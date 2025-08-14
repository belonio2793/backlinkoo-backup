-- Complete Automation Schema Setup
-- This migration creates all required tables for the automation system

-- 1. Create automation_campaigns table with all required columns
CREATE TABLE IF NOT EXISTS automation_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    engine_type TEXT DEFAULT 'guest_posting',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'error')),
    keywords TEXT[] NOT NULL DEFAULT '{}',
    anchor_texts TEXT[] NOT NULL DEFAULT '{}',
    target_sites_used TEXT[] DEFAULT '{}',
    published_articles JSONB DEFAULT '[]'::jsonb,
    links_built INTEGER DEFAULT 0,
    available_sites INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 10,
    current_platform TEXT,
    execution_progress JSONB DEFAULT '{}'::jsonb,
    auto_start BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 2. Create automation_logs table for activity tracking
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    level TEXT DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'success')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create automation_content table for generated content
CREATE TABLE IF NOT EXISTS automation_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_keyword TEXT,
    anchor_text TEXT,
    backlink_url TEXT,
    platform TEXT DEFAULT 'telegraph',
    published_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- 4. Create automation_published_links table for tracking published links
CREATE TABLE IF NOT EXISTS automation_published_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    content_id UUID REFERENCES automation_content(id) ON DELETE SET NULL,
    published_url TEXT NOT NULL,
    anchor_text TEXT,
    target_url TEXT,
    platform TEXT DEFAULT 'telegraph',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'removed', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_checked TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create link_placements table for detailed tracking
CREATE TABLE IF NOT EXISTS link_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    content_id UUID REFERENCES automation_content(id) ON DELETE SET NULL,
    site_url TEXT NOT NULL,
    page_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    target_url TEXT NOT NULL,
    placement_type TEXT DEFAULT 'contextual',
    position_in_content INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create campaign_reports table for analytics
CREATE TABLE IF NOT EXISTS campaign_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    report_date DATE DEFAULT CURRENT_DATE,
    links_built INTEGER DEFAULT 0,
    content_pieces INTEGER DEFAULT 0,
    active_links INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5,4) DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    domain_authority_avg DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_automation_campaigns_updated_at ON automation_campaigns;
CREATE TRIGGER update_automation_campaigns_updated_at
    BEFORE UPDATE ON automation_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable Row Level Security on all tables
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_published_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for automation_campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON automation_campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON automation_campaigns;

CREATE POLICY "Users can view their own campaigns" ON automation_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON automation_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON automation_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON automation_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- 11. Create RLS policies for automation_logs
DROP POLICY IF EXISTS "Users can view logs for their campaigns" ON automation_logs;
CREATE POLICY "Users can view logs for their campaigns" ON automation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_logs.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- 12. Create RLS policies for automation_content
DROP POLICY IF EXISTS "Users can view content for their campaigns" ON automation_content;
DROP POLICY IF EXISTS "Users can create content for their campaigns" ON automation_content;
DROP POLICY IF EXISTS "Users can update content for their campaigns" ON automation_content;

CREATE POLICY "Users can view content for their campaigns" ON automation_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_content.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create content for their campaigns" ON automation_content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_content.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update content for their campaigns" ON automation_content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_content.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- 13. Create RLS policies for automation_published_links
DROP POLICY IF EXISTS "Users can view published links for their campaigns" ON automation_published_links;
CREATE POLICY "Users can view published links for their campaigns" ON automation_published_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_published_links.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- 14. Create RLS policies for link_placements
DROP POLICY IF EXISTS "Users can view link placements for their campaigns" ON link_placements;
CREATE POLICY "Users can view link placements for their campaigns" ON link_placements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = link_placements.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- 15. Create RLS policies for campaign_reports
DROP POLICY IF EXISTS "Users can view reports for their campaigns" ON campaign_reports;
CREATE POLICY "Users can view reports for their campaigns" ON campaign_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = campaign_reports.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- 16. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_created_at ON automation_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at ON automation_campaigns(completed_at);

CREATE INDEX IF NOT EXISTS idx_automation_logs_campaign_id ON automation_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_logs_level ON automation_logs(level);

CREATE INDEX IF NOT EXISTS idx_automation_content_campaign_id ON automation_content(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_content_status ON automation_content(status);
CREATE INDEX IF NOT EXISTS idx_automation_content_created_at ON automation_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_published_links_campaign_id ON automation_published_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_published_links_status ON automation_published_links(status);

CREATE INDEX IF NOT EXISTS idx_link_placements_campaign_id ON link_placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_date ON campaign_reports(report_date DESC);

-- 17. Create exec_sql function for emergency fixes
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TABLE(result TEXT) AS $$
BEGIN
    RETURN QUERY EXECUTE query;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT SQLSTATE || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Verify schema creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'automation_campaigns',
        'automation_logs', 
        'automation_content',
        'automation_published_links',
        'link_placements',
        'campaign_reports'
    );
    
    RAISE NOTICE 'Created % automation tables successfully', table_count;
    
    IF table_count = 6 THEN
        RAISE NOTICE '✅ All automation tables created successfully!';
    ELSE
        RAISE NOTICE '⚠️ Only % out of 6 tables were created', table_count;
    END IF;
END $$;
