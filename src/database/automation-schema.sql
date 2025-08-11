-- =============================================
-- AUTOMATION CAMPAIGNS SCHEMA
-- =============================================

-- Automation campaigns table
CREATE TABLE IF NOT EXISTS automation_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    engine_type TEXT NOT NULL CHECK (engine_type IN ('blog_comments', 'web2_platforms', 'forum_profiles', 'social_media')),
    target_url TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    anchor_texts TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
    daily_limit INTEGER DEFAULT 10,
    auto_start BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    budget_limit DECIMAL(10,2),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Link placements table
CREATE TABLE IF NOT EXISTS link_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_domain TEXT NOT NULL,
    source_domain TEXT NOT NULL,
    source_url TEXT NOT NULL,
    placement_type TEXT NOT NULL CHECK (placement_type IN ('blog_comment', 'web2_post', 'forum_post', 'social_post', 'profile_link')),
    anchor_text TEXT NOT NULL,
    target_url TEXT NOT NULL,
    content_snippet TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'rejected', 'removed', 'failed')),
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    domain_authority INTEGER DEFAULT 0 CHECK (domain_authority >= 0 AND domain_authority <= 100),
    page_authority INTEGER DEFAULT 0 CHECK (page_authority >= 0 AND page_authority <= 100),
    placement_date TIMESTAMPTZ DEFAULT NOW(),
    verification_date TIMESTAMPTZ,
    removal_date TIMESTAMPTZ,
    cost DECIMAL(10,2) DEFAULT 0,
    engine_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign reports table
CREATE TABLE IF NOT EXISTS campaign_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_links_built INTEGER DEFAULT 0,
    links_live INTEGER DEFAULT 0,
    links_pending INTEGER DEFAULT 0,
    links_failed INTEGER DEFAULT 0,
    average_domain_authority DECIMAL(5,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    top_domains TEXT[] DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Available sites table (for link opportunities)
CREATE TABLE IF NOT EXISTS available_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain TEXT UNIQUE NOT NULL,
    domain_authority INTEGER DEFAULT 0 CHECK (domain_authority >= 0 AND domain_authority <= 100),
    page_authority INTEGER DEFAULT 0 CHECK (page_authority >= 0 AND page_authority <= 100),
    spam_score INTEGER DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100),
    category TEXT,
    niche TEXT[] DEFAULT '{}',
    placement_types TEXT[] DEFAULT '{}',
    cost_per_link DECIMAL(10,2) DEFAULT 0,
    acceptance_rate DECIMAL(5,2) DEFAULT 0,
    average_turnaround INTEGER DEFAULT 24, -- hours
    language TEXT DEFAULT 'en',
    country TEXT DEFAULT 'US',
    traffic_estimate INTEGER DEFAULT 0,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    requirements JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User link quotas table
CREATE TABLE IF NOT EXISTS user_link_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('guest', 'free', 'premium')),
    total_quota INTEGER DEFAULT 20,
    used_quota INTEGER DEFAULT 0,
    remaining_quota INTEGER DEFAULT 20,
    reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Link opportunities table (discovered sites)
CREATE TABLE IF NOT EXISTS link_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    placement_type TEXT NOT NULL,
    niche TEXT[] DEFAULT '{}',
    domain_authority INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    difficulty_score INTEGER DEFAULT 0 CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
    discovered_date TIMESTAMPTZ DEFAULT NOW(),
    last_verified TIMESTAMPTZ DEFAULT NOW(),
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'occupied', 'expired')),
    requirements JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Automation campaigns indexes
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_engine_type ON automation_campaigns(engine_type);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_created_at ON automation_campaigns(created_at);

-- Link placements indexes
CREATE INDEX IF NOT EXISTS idx_link_placements_campaign_id ON link_placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_placements_user_id ON link_placements(user_id);
CREATE INDEX IF NOT EXISTS idx_link_placements_status ON link_placements(status);
CREATE INDEX IF NOT EXISTS idx_link_placements_placement_date ON link_placements(placement_date);
CREATE INDEX IF NOT EXISTS idx_link_placements_source_domain ON link_placements(source_domain);
CREATE INDEX IF NOT EXISTS idx_link_placements_domain_authority ON link_placements(domain_authority);

-- Campaign reports indexes
CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_user_id ON campaign_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_period ON campaign_reports(period_start, period_end);

-- Available sites indexes
CREATE INDEX IF NOT EXISTS idx_available_sites_domain_authority ON available_sites(domain_authority);
CREATE INDEX IF NOT EXISTS idx_available_sites_status ON available_sites(status);
CREATE INDEX IF NOT EXISTS idx_available_sites_category ON available_sites(category);

-- User quotas indexes
CREATE INDEX IF NOT EXISTS idx_user_link_quotas_user_id ON user_link_quotas(user_id);

-- =============================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_link_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;

-- Automation campaigns policies
CREATE POLICY "Users can view their own campaigns" ON automation_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON automation_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON automation_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON automation_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Link placements policies
CREATE POLICY "Users can view their own link placements" ON link_placements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own link placements" ON link_placements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own link placements" ON link_placements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own link placements" ON link_placements
    FOR DELETE USING (auth.uid() = user_id);

-- Campaign reports policies
CREATE POLICY "Users can view their own reports" ON campaign_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" ON campaign_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Available sites policies (public read, admin write)
CREATE POLICY "Anyone can view available sites" ON available_sites
    FOR SELECT USING (true);

-- User quotas policies
CREATE POLICY "Users can view their own quota" ON user_link_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota" ON user_link_quotas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create user quotas" ON user_link_quotas
    FOR INSERT WITH CHECK (true);

-- Link opportunities policies (public read)
CREATE POLICY "Anyone can view link opportunities" ON link_opportunities
    FOR SELECT USING (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_automation_campaigns_updated_at 
    BEFORE UPDATE ON automation_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_placements_updated_at 
    BEFORE UPDATE ON link_placements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_available_sites_updated_at 
    BEFORE UPDATE ON available_sites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_opportunities_updated_at 
    BEFORE UPDATE ON link_opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment user quota
CREATE OR REPLACE FUNCTION increment_user_quota(user_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_link_quotas 
    SET 
        used_quota = used_quota + 1,
        remaining_quota = GREATEST(0, remaining_quota - 1),
        last_updated = NOW()
    WHERE user_id = user_id_param;
    
    -- Create quota record if it doesn't exist
    IF NOT FOUND THEN
        INSERT INTO user_link_quotas (user_id, used_quota, remaining_quota)
        VALUES (user_id_param, 1, 19)
        ON CONFLICT (user_id) DO UPDATE SET
            used_quota = user_link_quotas.used_quota + 1,
            remaining_quota = GREATEST(0, user_link_quotas.remaining_quota - 1),
            last_updated = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaign metrics
CREATE OR REPLACE FUNCTION get_campaign_metrics(campaign_id_param UUID)
RETURNS TABLE(
    total_links BIGINT,
    live_links BIGINT,
    pending_links BIGINT,
    failed_links BIGINT,
    success_rate DECIMAL,
    average_da DECIMAL,
    total_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_links,
        COUNT(CASE WHEN status = 'live' THEN 1 END)::BIGINT as live_links,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::BIGINT as pending_links,
        COUNT(CASE WHEN status IN ('failed', 'rejected') THEN 1 END)::BIGINT as failed_links,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN status = 'live' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
            ELSE 0 
        END as success_rate,
        COALESCE(AVG(domain_authority), 0)::DECIMAL as average_da,
        COALESCE(SUM(cost), 0)::DECIMAL as total_cost
    FROM link_placements 
    WHERE campaign_id = campaign_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SAMPLE DATA (for development)
-- =============================================

-- Insert sample available sites
INSERT INTO available_sites (domain, domain_authority, category, niche, placement_types, cost_per_link, acceptance_rate, language, country) VALUES
('techblog.example.com', 85, 'Technology', ARRAY['software', 'development', 'tech'], ARRAY['blog_comment', 'guest_post'], 25.00, 85.5, 'en', 'US'),
('marketingforum.net', 72, 'Marketing', ARRAY['digital marketing', 'seo', 'content'], ARRAY['forum_post', 'profile_link'], 15.50, 92.3, 'en', 'UK'),
('healthblog.org', 68, 'Health', ARRAY['wellness', 'fitness', 'nutrition'], ARRAY['blog_comment'], 18.75, 78.9, 'en', 'CA'),
('businessnetwork.com', 91, 'Business', ARRAY['entrepreneurship', 'finance', 'leadership'], ARRAY['profile_link', 'guest_post'], 45.00, 65.2, 'en', 'US'),
('designcommunity.io', 79, 'Design', ARRAY['web design', 'ui/ux', 'graphic design'], ARRAY['forum_post', 'profile_link'], 22.00, 88.7, 'en', 'US')
ON CONFLICT (domain) DO NOTHING;

-- Insert sample link opportunities
INSERT INTO link_opportunities (domain, url, placement_type, niche, domain_authority, estimated_cost, difficulty_score) VALUES
('newtech.example.com', 'https://newtech.example.com/blog-comments', 'blog_comment', ARRAY['technology', 'innovation'], 67, 12.50, 35),
('startuphub.net', 'https://startuphub.net/forum/opportunities', 'forum_post', ARRAY['startups', 'business'], 74, 28.00, 55),
('designerslounge.com', 'https://designerslounge.com/profiles', 'profile_link', ARRAY['design', 'creative'], 82, 35.00, 45),
('digitalmarketing.blog', 'https://digitalmarketing.blog/guest-posts', 'guest_post', ARRAY['marketing', 'seo'], 88, 65.00, 75),
('codecommunity.dev', 'https://codecommunity.dev/discussions', 'forum_post', ARRAY['programming', 'development'], 76, 20.00, 40)
ON CONFLICT DO NOTHING;
