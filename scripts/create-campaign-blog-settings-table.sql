-- Create campaign_blog_settings table
CREATE TABLE IF NOT EXISTS public.campaign_blog_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.automation_campaigns(id) ON DELETE CASCADE,
    enable_domain_blogs BOOLEAN DEFAULT true,
    max_domains_per_campaign INTEGER DEFAULT 2 CHECK (max_domains_per_campaign >= 0 AND max_domains_per_campaign <= 10),
    preferred_domains TEXT[] DEFAULT '{}',
    auto_publish_blogs BOOLEAN DEFAULT true,
    blog_schedule_delay INTEGER DEFAULT 0, -- Minutes to delay blog publishing after main content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one setting per campaign
    UNIQUE(campaign_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_campaign_blog_settings_campaign_id ON public.campaign_blog_settings(campaign_id);

-- Enable RLS
ALTER TABLE public.campaign_blog_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their campaign blog settings" ON public.campaign_blog_settings
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert blog settings for their campaigns" ON public.campaign_blog_settings
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their campaign blog settings" ON public.campaign_blog_settings
    FOR UPDATE USING (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their campaign blog settings" ON public.campaign_blog_settings
    FOR DELETE USING (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
    );

-- Create function to get default blog settings for campaigns
CREATE OR REPLACE FUNCTION public.get_campaign_blog_settings(p_campaign_id UUID)
RETURNS TABLE (
    enable_domain_blogs BOOLEAN,
    max_domains_per_campaign INTEGER,
    preferred_domains TEXT[],
    auto_publish_blogs BOOLEAN,
    blog_schedule_delay INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(cbs.enable_domain_blogs, true) as enable_domain_blogs,
        COALESCE(cbs.max_domains_per_campaign, 2) as max_domains_per_campaign,
        COALESCE(cbs.preferred_domains, '{}') as preferred_domains,
        COALESCE(cbs.auto_publish_blogs, true) as auto_publish_blogs,
        COALESCE(cbs.blog_schedule_delay, 0) as blog_schedule_delay
    FROM public.campaign_blog_settings cbs
    WHERE cbs.campaign_id = p_campaign_id
    
    UNION ALL
    
    -- Return defaults if no settings exist
    SELECT 
        true as enable_domain_blogs,
        2 as max_domains_per_campaign,
        '{}' as preferred_domains,
        true as auto_publish_blogs,
        0 as blog_schedule_delay
    WHERE NOT EXISTS (
        SELECT 1 FROM public.campaign_blog_settings WHERE campaign_id = p_campaign_id
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create domain blog posts tracking table
CREATE TABLE IF NOT EXISTS public.domain_blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.automation_campaigns(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    published_url VARCHAR(1000) NOT NULL,
    theme_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'failed')),
    keywords TEXT[] DEFAULT '{}',
    target_url VARCHAR(1000),
    meta_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique slugs per domain
    UNIQUE(domain_id, slug)
);

-- Create indexes for domain blog posts
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_campaign_id ON public.domain_blog_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_domain_id ON public.domain_blog_posts(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_published_at ON public.domain_blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_domain_blog_posts_status ON public.domain_blog_posts(status);

-- Enable RLS for domain blog posts
ALTER TABLE public.domain_blog_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for domain blog posts
CREATE POLICY "Users can view their domain blog posts" ON public.domain_blog_posts
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
        OR
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert blog posts for their campaigns/domains" ON public.domain_blog_posts
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
        AND
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their domain blog posts" ON public.domain_blog_posts
    FOR UPDATE USING (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
        OR
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their domain blog posts" ON public.domain_blog_posts
    FOR DELETE USING (
        campaign_id IN (
            SELECT id FROM public.automation_campaigns WHERE user_id = auth.uid()
        )
        OR
        domain_id IN (
            SELECT id FROM public.domains WHERE user_id = auth.uid()
        )
    );

-- Create function to get domain blog statistics
CREATE OR REPLACE FUNCTION public.get_domain_blog_stats()
RETURNS TABLE (
    total_posts INTEGER,
    active_domains INTEGER,
    posts_last_30_days INTEGER,
    top_domains TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_posts,
        COUNT(DISTINCT domain_id)::INTEGER as active_domains,
        COUNT(CASE WHEN published_at > NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as posts_last_30_days,
        ARRAY_AGG(DISTINCT domain_name ORDER BY domain_name) as top_domains
    FROM public.domain_blog_posts
    WHERE status = 'published';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_blog_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_blog_posts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_blog_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_domain_blog_stats() TO authenticated;

-- Update domain published pages counter function
CREATE OR REPLACE FUNCTION public.increment_published_pages(domain_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.domains 
    SET pages_published = COALESCE(pages_published, 0) + 1,
        updated_at = NOW()
    WHERE id = domain_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.increment_published_pages(UUID) TO authenticated;
