-- Backlink Automation System Database Schema
-- This migration creates tables for the automated link building system

-- 1. Backlink Campaigns Table
CREATE TABLE IF NOT EXISTS backlink_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    anchor_texts TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('active', 'paused', 'stopped', 'completed')) DEFAULT 'active',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    links_generated INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 10,
    
    -- Link strategy settings
    strategy_blog_comments BOOLEAN DEFAULT true,
    strategy_forum_profiles BOOLEAN DEFAULT true,
    strategy_web2_platforms BOOLEAN DEFAULT true,
    strategy_social_profiles BOOLEAN DEFAULT false,
    strategy_contact_forms BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Additional settings
    settings JSONB DEFAULT '{}'::jsonb
);

-- 2. Link Opportunities Table
CREATE TABLE IF NOT EXISTS link_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES backlink_campaigns(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT,
    link_type TEXT CHECK (link_type IN ('blog_comment', 'forum_profile', 'web2_platform', 'social_profile', 'contact_form')) NOT NULL,
    authority_score INTEGER CHECK (authority_score >= 0 AND authority_score <= 100),
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    status TEXT CHECK (status IN ('pending', 'posted', 'failed', 'skipped')) DEFAULT 'pending',
    keyword TEXT,
    
    -- Discovery metadata
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    discovery_method TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Link Posting Results Table
CREATE TABLE IF NOT EXISTS link_posting_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES link_opportunities(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES backlink_campaigns(id) ON DELETE CASCADE,
    
    -- Posting details
    anchor_text TEXT,
    generated_content TEXT,
    posting_method TEXT,
    success BOOLEAN DEFAULT false,
    
    -- Result details
    posted_url TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    posted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    posting_metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Campaign Analytics Table
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES backlink_campaigns(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    
    -- Daily metrics
    opportunities_discovered INTEGER DEFAULT 0,
    links_attempted INTEGER DEFAULT 0,
    links_posted INTEGER DEFAULT 0,
    links_failed INTEGER DEFAULT 0,
    
    -- Success rates
    success_rate DECIMAL(5,2),
    
    -- Link type breakdown
    blog_comments_posted INTEGER DEFAULT 0,
    forum_profiles_posted INTEGER DEFAULT 0,
    web2_platforms_posted INTEGER DEFAULT 0,
    social_profiles_posted INTEGER DEFAULT 0,
    contact_forms_posted INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure one record per campaign per date
    UNIQUE(campaign_id, date)
);

-- 5. Link Discovery Queue Table (for batched processing)
CREATE TABLE IF NOT EXISTS link_discovery_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES backlink_campaigns(id) ON DELETE CASCADE,
    keywords TEXT[] NOT NULL,
    link_strategies TEXT[] NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    
    -- Processing details
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Results
    opportunities_found INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_user_id ON backlink_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_status ON backlink_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_campaign_id ON link_opportunities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_status ON link_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_link_type ON link_opportunities(link_type);
CREATE INDEX IF NOT EXISTS idx_link_posting_results_campaign_id ON link_posting_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_posting_results_opportunity_id ON link_posting_results(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON campaign_analytics(date);
CREATE INDEX IF NOT EXISTS idx_link_discovery_queue_status ON link_discovery_queue(status);

-- Create updated_at trigger for campaigns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_backlink_campaigns_updated_at 
    BEFORE UPDATE ON backlink_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_posting_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_discovery_queue ENABLE ROW LEVEL SECURITY;

-- Campaigns: Users can only access their own campaigns
CREATE POLICY "Users can view their own campaigns" ON backlink_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON backlink_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON backlink_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON backlink_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Link opportunities: Users can only access opportunities from their campaigns
CREATE POLICY "Users can view opportunities from their campaigns" ON link_opportunities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = link_opportunities.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert opportunities for their campaigns" ON link_opportunities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = link_opportunities.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update opportunities from their campaigns" ON link_opportunities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = link_opportunities.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

-- Link posting results: Users can only access results from their campaigns
CREATE POLICY "Users can view posting results from their campaigns" ON link_posting_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = link_posting_results.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert posting results for their campaigns" ON link_posting_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = link_posting_results.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

-- Campaign analytics: Users can only view analytics for their campaigns
CREATE POLICY "Users can view analytics for their campaigns" ON campaign_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = campaign_analytics.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert analytics" ON campaign_analytics
    FOR INSERT WITH CHECK (true);

-- Discovery queue: Users can only access queue items for their campaigns
CREATE POLICY "Users can view discovery queue for their campaigns" ON link_discovery_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = link_discovery_queue.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert discovery queue items for their campaigns" ON link_discovery_queue
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM backlink_campaigns 
            WHERE backlink_campaigns.id = link_discovery_queue.campaign_id 
            AND backlink_campaigns.user_id = auth.uid()
        )
    );

-- Helper functions for analytics
CREATE OR REPLACE FUNCTION calculate_campaign_success_rate(campaign_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_attempts INTEGER;
    successful_posts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_attempts
    FROM link_posting_results
    WHERE campaign_id = campaign_uuid;
    
    SELECT COUNT(*) INTO successful_posts
    FROM link_posting_results
    WHERE campaign_id = campaign_uuid AND success = true;
    
    IF total_attempts > 0 THEN
        RETURN (successful_posts::DECIMAL / total_attempts::DECIMAL) * 100;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaign overview
CREATE OR REPLACE FUNCTION get_campaign_overview(campaign_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'campaign_id', c.id,
        'name', c.name,
        'status', c.status,
        'progress', c.progress,
        'links_generated', c.links_generated,
        'total_opportunities', (
            SELECT COUNT(*) FROM link_opportunities WHERE campaign_id = c.id
        ),
        'pending_opportunities', (
            SELECT COUNT(*) FROM link_opportunities 
            WHERE campaign_id = c.id AND status = 'pending'
        ),
        'posted_links', (
            SELECT COUNT(*) FROM link_opportunities 
            WHERE campaign_id = c.id AND status = 'posted'
        ),
        'success_rate', calculate_campaign_success_rate(c.id),
        'created_at', c.created_at,
        'last_active_at', c.last_active_at
    ) INTO result
    FROM backlink_campaigns c
    WHERE c.id = campaign_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE backlink_campaigns IS 'Stores automated link building campaigns created by users';
COMMENT ON TABLE link_opportunities IS 'Stores discovered link opportunities for each campaign';
COMMENT ON TABLE link_posting_results IS 'Stores results of automated link posting attempts';
COMMENT ON TABLE campaign_analytics IS 'Daily analytics and metrics for campaigns';
COMMENT ON TABLE link_discovery_queue IS 'Queue for processing link discovery tasks';
