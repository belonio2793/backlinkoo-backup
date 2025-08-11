-- ================================================
-- AUTOMATION SYSTEM DATABASE SETUP - FIXED VERSION
-- Run this in Supabase SQL Editor
-- ================================================

-- First, drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS campaign_reports CASCADE;
DROP TABLE IF EXISTS link_placements CASCADE;
DROP TABLE IF EXISTS user_link_quotas CASCADE;
DROP TABLE IF EXISTS available_sites CASCADE;
DROP TABLE IF EXISTS automation_campaigns CASCADE;

-- Drop existing functions and triggers if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create automation_campaigns table
CREATE TABLE automation_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    engine_type VARCHAR(50) NOT NULL CHECK (engine_type IN ('blog_comments', 'web2_platforms', 'forum_profiles', 'social_media')),
    target_url TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    anchor_texts TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    daily_limit INTEGER DEFAULT 10 CHECK (daily_limit > 0),
    auto_start BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE,
    total_links_built INTEGER DEFAULT 0 CHECK (total_links_built >= 0),
    success_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Create link_placements table
CREATE TABLE link_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
    source_domain VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    placement_type VARCHAR(50) NOT NULL CHECK (placement_type IN ('blog_comment', 'web2_article', 'forum_post', 'social_post')),
    placement_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'placed', 'live', 'failed', 'removed')),
    domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
    placement_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cost DECIMAL(10,2) DEFAULT 0.00 CHECK (cost >= 0),
    notes TEXT
);

-- Create user_link_quotas table
CREATE TABLE user_link_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'enterprise')),
    total_quota INTEGER DEFAULT 20 CHECK (total_quota >= 0),
    used_quota INTEGER DEFAULT 0 CHECK (used_quota >= 0),
    remaining_quota INTEGER DEFAULT 20 CHECK (remaining_quota >= 0),
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create available_sites table
CREATE TABLE available_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    site_type VARCHAR(50) NOT NULL CHECK (site_type IN ('blog', 'web2', 'forum', 'social')),
    domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
    accepts_links BOOLEAN DEFAULT true,
    pricing DECIMAL(10,2) CHECK (pricing >= 0),
    contact_email VARCHAR(255),
    guidelines TEXT,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted'))
);

-- Create campaign_reports table
CREATE TABLE campaign_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    total_links INTEGER DEFAULT 0 CHECK (total_links >= 0),
    live_links INTEGER DEFAULT 0 CHECK (live_links >= 0),
    pending_links INTEGER DEFAULT 0 CHECK (pending_links >= 0),
    failed_links INTEGER DEFAULT 0 CHECK (failed_links >= 0),
    success_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (success_rate >= 0 AND success_rate <= 100),
    average_da DECIMAL(5,2) DEFAULT 0.00 CHECK (average_da >= 0 AND average_da <= 100),
    total_cost DECIMAL(10,2) DEFAULT 0.00 CHECK (total_cost >= 0),
    daily_velocity INTEGER DEFAULT 0 CHECK (daily_velocity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, report_date)
);

-- Create optimized indexes
CREATE INDEX idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX idx_automation_campaigns_engine_type ON automation_campaigns(engine_type);
CREATE INDEX idx_automation_campaigns_created_at ON automation_campaigns(created_at);

CREATE INDEX idx_link_placements_user_id ON link_placements(user_id);
CREATE INDEX idx_link_placements_campaign_id ON link_placements(campaign_id);
CREATE INDEX idx_link_placements_status ON link_placements(status);
CREATE INDEX idx_link_placements_placement_date ON link_placements(placement_date);
CREATE INDEX idx_link_placements_source_domain ON link_placements(source_domain);

CREATE INDEX idx_user_link_quotas_user_id ON user_link_quotas(user_id);
CREATE INDEX idx_user_link_quotas_plan_type ON user_link_quotas(plan_type);

CREATE INDEX idx_available_sites_domain ON available_sites(domain);
CREATE INDEX idx_available_sites_site_type ON available_sites(site_type);
CREATE INDEX idx_available_sites_status ON available_sites(status);
CREATE INDEX idx_available_sites_domain_authority ON available_sites(domain_authority);

CREATE INDEX idx_campaign_reports_user_id ON campaign_reports(user_id);
CREATE INDEX idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX idx_campaign_reports_date ON campaign_reports(report_date);

-- Enable Row Level Security
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_link_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Automation campaigns policies
CREATE POLICY "Users can view own campaigns" ON automation_campaigns 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON automation_campaigns 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON automation_campaigns 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON automation_campaigns 
    FOR DELETE USING (auth.uid() = user_id);

-- Link placements policies
CREATE POLICY "Users can view own link placements" ON link_placements 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own link placements" ON link_placements 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own link placements" ON link_placements 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own link placements" ON link_placements 
    FOR DELETE USING (auth.uid() = user_id);

-- User quotas policies
CREATE POLICY "Users can view own quotas" ON user_link_quotas 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quotas" ON user_link_quotas 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotas" ON user_link_quotas 
    FOR UPDATE USING (auth.uid() = user_id);

-- Available sites policies (public read access)
CREATE POLICY "Users can view available sites" ON available_sites 
    FOR SELECT USING (true);

-- Admin-only policies for available sites management
CREATE POLICY "Admins can manage available sites" ON available_sites 
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- Campaign reports policies
CREATE POLICY "Users can view own reports" ON campaign_reports 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON campaign_reports 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON campaign_reports 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON campaign_reports 
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_automation_campaigns_updated_at 
    BEFORE UPDATE ON automation_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_placements_updated_at 
    BEFORE UPDATE ON link_placements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_link_quotas_updated_at 
    BEFORE UPDATE ON user_link_quotas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update remaining_quota
CREATE OR REPLACE FUNCTION update_remaining_quota()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_quota = NEW.total_quota - NEW.used_quota;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic remaining_quota calculation
CREATE TRIGGER update_user_link_quotas_remaining 
    BEFORE INSERT OR UPDATE ON user_link_quotas 
    FOR EACH ROW EXECUTE FUNCTION update_remaining_quota();

-- Insert some sample available sites for testing
INSERT INTO available_sites (domain, site_type, domain_authority, accepts_links, pricing, guidelines, status) VALUES
('medium.com', 'blog', 95, true, 0.00, 'High-quality articles only. No spam or promotional content.', 'active'),
('dev.to', 'blog', 85, true, 0.00, 'Development-focused content. Community guidelines apply.', 'active'),
('hackernoon.com', 'blog', 80, true, 50.00, 'Tech articles with editorial review required.', 'active'),
('blogger.com', 'web2', 90, true, 0.00, 'Free platform with Google backing. Follow TOS.', 'active'),
('wordpress.com', 'web2', 95, true, 0.00, 'Premium features available. No spam policy.', 'active'),
('reddit.com', 'forum', 90, true, 0.00, 'Community-driven. Follow subreddit rules.', 'active'),
('quora.com', 'forum', 85, true, 0.00, 'Question-answer format. Quality answers required.', 'active')
ON CONFLICT (domain) DO NOTHING;

-- Grant necessary permissions (if needed)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create notification for successful setup
DO $$
BEGIN
    RAISE NOTICE '✅ Automation database setup completed successfully!';
    RAISE NOTICE '📊 Created 5 tables with proper relationships and security';
    RAISE NOTICE '🔒 Row Level Security enabled with comprehensive policies';
    RAISE NOTICE '⚡ Optimized indexes created for performance';
    RAISE NOTICE '🎯 Sample data inserted for testing';
END $$;
