-- Campaign Metrics Tracking Migration
-- This creates tables for comprehensive campaign and link metrics tracking

-- Campaign Runtime Metrics Table
-- Tracks individual campaign runtime and progress indefinitely
CREATE TABLE IF NOT EXISTS campaign_runtime_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_runtime_seconds INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped', 'completed', 'deleted')),
    
    -- Progressive link tracking (can only increase unless deleted)
    progressive_link_count INTEGER DEFAULT 0,
    links_live INTEGER DEFAULT 0,
    links_pending INTEGER DEFAULT 0,
    links_failed INTEGER DEFAULT 0,
    
    -- Campaign configuration
    target_url TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    anchor_texts TEXT[] DEFAULT '{}',
    daily_limit INTEGER DEFAULT 25,
    
    -- Quality metrics
    average_authority DECIMAL(5,2) DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    velocity DECIMAL(8,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, user_id)
);

-- User Monthly Link Aggregates Table  
-- Tracks total links per user per month (aggregate across all campaigns)
CREATE TABLE IF NOT EXISTS user_monthly_link_aggregates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Aggregate metrics for the month
    total_links_generated INTEGER DEFAULT 0,
    total_links_live INTEGER DEFAULT 0,
    total_campaigns_active INTEGER DEFAULT 0,
    total_campaigns_completed INTEGER DEFAULT 0,
    
    -- Quality aggregates
    average_authority DECIMAL(5,2) DEFAULT 0,
    average_success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- User subscription info (for limit tracking)
    is_premium BOOLEAN DEFAULT FALSE,
    monthly_link_limit INTEGER DEFAULT 20,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, year, month)
);

-- Campaign Link History Table
-- Detailed history of each link built for permanent record
CREATE TABLE IF NOT EXISTS campaign_link_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Link details
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    domain TEXT NOT NULL,
    
    -- Link status and quality
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'failed', 'removed')),
    domain_authority INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Link type and strategy
    link_type TEXT NOT NULL DEFAULT 'unknown',
    link_strategy TEXT DEFAULT 'manual',
    
    -- Performance metrics
    clicks INTEGER DEFAULT 0,
    link_juice DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live Campaign Monitor View
-- Aggregates data from all active campaigns for dashboard display
CREATE OR REPLACE VIEW live_campaign_monitor AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(crm.id) as total_campaigns,
    COUNT(CASE WHEN crm.status = 'active' THEN 1 END) as active_campaigns,
    COUNT(CASE WHEN crm.status = 'paused' THEN 1 END) as paused_campaigns,
    SUM(crm.progressive_link_count) as total_links_generated,
    SUM(crm.links_live) as total_links_live,
    SUM(crm.links_pending) as total_links_pending,
    AVG(crm.average_authority) as avg_authority,
    AVG(crm.success_rate) as avg_success_rate,
    SUM(crm.total_runtime_seconds) as total_runtime_seconds,
    MAX(crm.last_active_time) as last_activity
FROM auth.users u
LEFT JOIN campaign_runtime_metrics crm ON u.id = crm.user_id AND crm.status != 'deleted'
GROUP BY u.id, u.email;

-- User Dashboard Summary View
-- Comprehensive user metrics for dashboard display
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.email,
    p.subscription_tier,
    p.subscription_status,
    
    -- Current month aggregates
    COALESCE(umla_current.total_links_generated, 0) as current_month_links,
    COALESCE(umla_current.monthly_link_limit, 20) as monthly_limit,
    COALESCE(umla_current.is_premium, false) as is_premium,
    
    -- All-time totals from live monitor
    COALESCE(lcm.total_links_generated, 0) as lifetime_links,
    COALESCE(lcm.total_campaigns, 0) as total_campaigns,
    COALESCE(lcm.active_campaigns, 0) as active_campaigns,
    COALESCE(lcm.avg_authority, 0) as average_authority,
    COALESCE(lcm.avg_success_rate, 0) as average_success_rate,
    
    -- Last activity
    lcm.last_activity
    
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN live_campaign_monitor lcm ON u.id = lcm.user_id
LEFT JOIN user_monthly_link_aggregates umla_current ON (
    u.id = umla_current.user_id 
    AND umla_current.year = EXTRACT(YEAR FROM NOW())
    AND umla_current.month = EXTRACT(MONTH FROM NOW())
);

-- Functions for updating metrics

-- Function to update campaign runtime metrics
CREATE OR REPLACE FUNCTION update_campaign_runtime_metrics(
    p_campaign_id UUID,
    p_user_id UUID,
    p_campaign_name TEXT,
    p_target_url TEXT,
    p_keywords TEXT[],
    p_anchor_texts TEXT[],
    p_status TEXT,
    p_progressive_link_count INTEGER,
    p_links_live INTEGER DEFAULT 0,
    p_links_pending INTEGER DEFAULT 0,
    p_average_authority DECIMAL DEFAULT 0,
    p_success_rate DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    existing_record campaign_runtime_metrics%ROWTYPE;
    updated_id UUID;
BEGIN
    -- Check if record exists
    SELECT * INTO existing_record 
    FROM campaign_runtime_metrics 
    WHERE campaign_id = p_campaign_id AND user_id = p_user_id;
    
    IF existing_record.id IS NOT NULL THEN
        -- Update existing record (progressive link count can only increase)
        UPDATE campaign_runtime_metrics SET
            campaign_name = p_campaign_name,
            target_url = p_target_url,
            keywords = p_keywords,
            anchor_texts = p_anchor_texts,
            status = p_status,
            progressive_link_count = GREATEST(existing_record.progressive_link_count, p_progressive_link_count),
            links_live = p_links_live,
            links_pending = p_links_pending,
            average_authority = p_average_authority,
            success_rate = p_success_rate,
            last_active_time = NOW(),
            total_runtime_seconds = CASE 
                WHEN p_status = 'active' THEN 
                    existing_record.total_runtime_seconds + EXTRACT(EPOCH FROM (NOW() - existing_record.last_active_time))::INTEGER
                ELSE existing_record.total_runtime_seconds
            END,
            updated_at = NOW()
        WHERE id = existing_record.id
        RETURNING id INTO updated_id;
    ELSE
        -- Insert new record
        INSERT INTO campaign_runtime_metrics (
            campaign_id, user_id, campaign_name, target_url, keywords, anchor_texts,
            status, progressive_link_count, links_live, links_pending,
            average_authority, success_rate, start_time, last_active_time
        ) VALUES (
            p_campaign_id, p_user_id, p_campaign_name, p_target_url, p_keywords, p_anchor_texts,
            p_status, p_progressive_link_count, p_links_live, p_links_pending,
            p_average_authority, p_success_rate, NOW(), NOW()
        )
        RETURNING id INTO updated_id;
    END IF;
    
    -- Update monthly aggregates
    PERFORM update_user_monthly_aggregates(p_user_id);
    
    RETURN updated_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user monthly aggregates
CREATE OR REPLACE FUNCTION update_user_monthly_aggregates(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    current_month INTEGER := EXTRACT(MONTH FROM NOW());
    user_is_premium BOOLEAN;
    user_link_limit INTEGER;
    aggregate_id UUID;
BEGIN
    -- Determine user premium status (simplified - adjust based on your user system)
    SELECT 
        CASE WHEN p.subscription_tier = 'premium' OR p.subscription_tier = 'pro' THEN TRUE ELSE FALSE END,
        CASE WHEN p.subscription_tier = 'premium' OR p.subscription_tier = 'pro' THEN -1 ELSE 20 END
    INTO user_is_premium, user_link_limit
    FROM profiles p WHERE p.user_id = p_user_id;
    
    -- Default to free user if no profile found
    user_is_premium := COALESCE(user_is_premium, FALSE);
    user_link_limit := COALESCE(user_link_limit, 20);
    
    -- Insert or update monthly aggregate
    INSERT INTO user_monthly_link_aggregates (
        user_id, year, month, 
        total_links_generated, total_links_live,
        total_campaigns_active, total_campaigns_completed,
        is_premium, monthly_link_limit
    )
    SELECT 
        p_user_id, current_year, current_month,
        COALESCE(SUM(crm.progressive_link_count), 0),
        COALESCE(SUM(crm.links_live), 0),
        COUNT(CASE WHEN crm.status = 'active' THEN 1 END),
        COUNT(CASE WHEN crm.status = 'completed' THEN 1 END),
        user_is_premium,
        user_link_limit
    FROM campaign_runtime_metrics crm
    WHERE crm.user_id = p_user_id AND crm.status != 'deleted'
    
    ON CONFLICT (user_id, year, month) DO UPDATE SET
        total_links_generated = EXCLUDED.total_links_generated,
        total_links_live = EXCLUDED.total_links_live,
        total_campaigns_active = EXCLUDED.total_campaigns_active,
        total_campaigns_completed = EXCLUDED.total_campaigns_completed,
        is_premium = EXCLUDED.is_premium,
        monthly_link_limit = EXCLUDED.monthly_link_limit,
        updated_at = NOW()
    RETURNING id INTO aggregate_id;
    
    RETURN aggregate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- Campaign runtime metrics policies
ALTER TABLE campaign_runtime_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaign metrics" ON campaign_runtime_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaign metrics" ON campaign_runtime_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaign metrics" ON campaign_runtime_metrics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaign metrics" ON campaign_runtime_metrics
    FOR DELETE USING (auth.uid() = user_id);

-- User monthly aggregates policies
ALTER TABLE user_monthly_link_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly aggregates" ON user_monthly_link_aggregates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage monthly aggregates" ON user_monthly_link_aggregates
    FOR ALL USING (true);

-- Campaign link history policies
ALTER TABLE campaign_link_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own link history" ON campaign_link_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own link history" ON campaign_link_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own link history" ON campaign_link_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (full access)
CREATE POLICY "Admins have full access to campaign metrics" ON campaign_runtime_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins have full access to monthly aggregates" ON user_monthly_link_aggregates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins have full access to link history" ON campaign_link_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_user_id ON campaign_runtime_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_campaign_id ON campaign_runtime_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_status ON campaign_runtime_metrics(status);
CREATE INDEX IF NOT EXISTS idx_user_monthly_aggregates_user_month ON user_monthly_link_aggregates(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_user_id ON campaign_link_history(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_campaign_id ON campaign_link_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_published_at ON campaign_link_history(published_at);

-- Comments for documentation
COMMENT ON TABLE campaign_runtime_metrics IS 'Individual campaign runtime tracking with progressive link counts that persist indefinitely unless deleted';
COMMENT ON TABLE user_monthly_link_aggregates IS 'Monthly aggregated metrics per user across all campaigns for reporting and limit tracking';
COMMENT ON TABLE campaign_link_history IS 'Detailed history of every link built, with full audit trail for reporting';
COMMENT ON VIEW live_campaign_monitor IS 'Real-time dashboard view showing collective metrics from all active/non-deleted campaigns';
COMMENT ON VIEW user_dashboard_summary IS 'Comprehensive user dashboard showing current month stats and lifetime totals';
