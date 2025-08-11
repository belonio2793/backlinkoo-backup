-- Create automation_campaigns table
CREATE TABLE IF NOT EXISTS automation_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    engine_type VARCHAR(50) NOT NULL, -- 'blog_comments', 'web2_platforms', 'forum_profiles', 'social_media'
    target_url TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    anchor_texts TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    daily_limit INTEGER DEFAULT 10,
    auto_start BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE,
    total_links_built INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00
);

-- Create link_placements table
CREATE TABLE IF NOT EXISTS link_placements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
    source_domain VARCHAR(255) NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    placement_type VARCHAR(50) NOT NULL, -- 'blog_comment', 'web2_article', 'forum_post', 'social_post'
    placement_url TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'placed', 'live', 'failed', 'removed'
    domain_authority INTEGER,
    placement_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT
);

-- Create user_link_quotas table
CREATE TABLE IF NOT EXISTS user_link_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    plan_type VARCHAR(20) DEFAULT 'free', -- 'free', 'premium', 'enterprise'
    total_quota INTEGER DEFAULT 20,
    used_quota INTEGER DEFAULT 0,
    remaining_quota INTEGER DEFAULT 20,
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create available_sites table (for future link opportunities)
CREATE TABLE IF NOT EXISTS available_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    site_type VARCHAR(50) NOT NULL, -- 'blog', 'web2', 'forum', 'social'
    domain_authority INTEGER,
    accepts_links BOOLEAN DEFAULT true,
    pricing DECIMAL(10,2),
    contact_email VARCHAR(255),
    guidelines TEXT,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' -- 'active', 'inactive', 'blacklisted'
);

-- Create campaign_reports table
CREATE TABLE IF NOT EXISTS campaign_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    total_links INTEGER DEFAULT 0,
    live_links INTEGER DEFAULT 0,
    pending_links INTEGER DEFAULT 0,
    failed_links INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    average_da DECIMAL(5,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    daily_velocity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_engine_type ON automation_campaigns(engine_type);

CREATE INDEX IF NOT EXISTS idx_link_placements_user_id ON link_placements(user_id);
CREATE INDEX IF NOT EXISTS idx_link_placements_campaign_id ON link_placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_placements_status ON link_placements(status);
CREATE INDEX IF NOT EXISTS idx_link_placements_placement_date ON link_placements(placement_date);

CREATE INDEX IF NOT EXISTS idx_user_link_quotas_user_id ON user_link_quotas(user_id);

CREATE INDEX IF NOT EXISTS idx_available_sites_domain ON available_sites(domain);
CREATE INDEX IF NOT EXISTS idx_available_sites_site_type ON available_sites(site_type);
CREATE INDEX IF NOT EXISTS idx_available_sites_status ON available_sites(status);

CREATE INDEX IF NOT EXISTS idx_campaign_reports_user_id ON campaign_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_campaign_id ON campaign_reports(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_reports_date ON campaign_reports(report_date);

-- Set up Row Level Security (RLS)
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_link_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Available sites policies (read-only for users)
CREATE POLICY "Users can view available sites" ON available_sites 
    FOR SELECT USING (true);

-- Campaign reports policies
CREATE POLICY "Users can view own reports" ON campaign_reports 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON campaign_reports 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON campaign_reports 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON campaign_reports 
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_automation_campaigns_updated_at 
    BEFORE UPDATE ON automation_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_placements_updated_at 
    BEFORE UPDATE ON link_placements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_link_quotas_updated_at 
    BEFORE UPDATE ON user_link_quotas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
