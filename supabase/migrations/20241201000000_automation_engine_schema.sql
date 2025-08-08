-- Enterprise Backlink Automation Engine Database Schema
-- Designed to handle 1000+ concurrent campaigns with full scalability

-- Campaign Management Tables
CREATE TABLE IF NOT EXISTS automation_campaigns (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('queued', 'processing', 'paused', 'completed', 'failed')) DEFAULT 'queued',
    campaign_data JSONB NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_node TEXT,
    estimated_duration BIGINT,
    actual_duration BIGINT,
    progress_percentage INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link Opportunities Discovery
CREATE TABLE IF NOT EXISTS link_opportunities (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    discovery_method TEXT NOT NULL,
    authority INTEGER DEFAULT 0,
    page_authority INTEGER DEFAULT 0,
    spam_score INTEGER DEFAULT 0,
    relevance_score INTEGER DEFAULT 0,
    content_relevance INTEGER DEFAULT 0,
    competitor_links INTEGER DEFAULT 0,
    estimated_success_rate INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('discovered', 'verified', 'contacted', 'responded', 'posted', 'live', 'rejected', 'dead', 'blacklisted')) DEFAULT 'discovered',
    verification JSONB,
    metadata JSONB,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified TIMESTAMPTZ DEFAULT NOW(),
    next_verification TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Generation Requests
CREATE TABLE IF NOT EXISTS content_requests (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    opportunity_id TEXT REFERENCES link_opportunities(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    context JSONB NOT NULL,
    requirements JSONB NOT NULL,
    status TEXT CHECK (status IN ('pending', 'generating', 'reviewing', 'approved', 'posted', 'failed')) DEFAULT 'pending',
    content JSONB,
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    generated_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posted Links Tracking
CREATE TABLE IF NOT EXISTS posted_links (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    opportunity_id TEXT REFERENCES link_opportunities(id) ON DELETE CASCADE,
    content_request_id TEXT REFERENCES content_requests(id) ON DELETE CASCADE,
    posted_url TEXT NOT NULL,
    anchor_text TEXT,
    link_url TEXT NOT NULL,
    post_content TEXT,
    status TEXT CHECK (status IN ('posted', 'live', 'removed', 'failed', 'pending_verification')) DEFAULT 'posted',
    indexed BOOLEAN DEFAULT FALSE,
    estimated_reach INTEGER DEFAULT 0,
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    removed_at TIMESTAMPTZ,
    last_checked TIMESTAMPTZ,
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logging and Recovery
CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    component TEXT NOT NULL,
    operation TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical', 'catastrophic')) DEFAULT 'medium',
    category TEXT NOT NULL,
    error_details JSONB NOT NULL,
    system_state JSONB,
    recovery_attempts INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT FALSE,
    resolution JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics and Metrics
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    time_range JSONB NOT NULL,
    metrics JSONB NOT NULL,
    performance JSONB NOT NULL,
    trends JSONB,
    predictions JSONB,
    competitor_data JSONB,
    cost_analysis JSONB,
    roi_analysis JSONB,
    recommendations JSONB,
    alerts JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Health Monitoring
CREATE TABLE IF NOT EXISTS health_checks (
    id TEXT PRIMARY KEY,
    component TEXT NOT NULL,
    status TEXT CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')) DEFAULT 'unknown',
    response_time INTEGER DEFAULT 0,
    details JSONB,
    dependencies TEXT[],
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limiting and Anti-Detection
CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    limit_type TEXT NOT NULL,
    max_requests INTEGER NOT NULL,
    window_ms BIGINT NOT NULL,
    current_requests INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource_type, resource_id, limit_type)
);

-- User Agent and Proxy Rotation
CREATE TABLE IF NOT EXISTS user_agents (
    id SERIAL PRIMARY KEY,
    user_agent TEXT NOT NULL UNIQUE,
    browser TEXT,
    version TEXT,
    os TEXT,
    device_type TEXT,
    last_used TIMESTAMPTZ,
    success_rate DECIMAL(5,2) DEFAULT 100.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proxy_pool (
    id SERIAL PRIMARY KEY,
    proxy_url TEXT NOT NULL UNIQUE,
    proxy_type TEXT CHECK (proxy_type IN ('http', 'https', 'socks4', 'socks5')) DEFAULT 'http',
    region TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'blocked', 'testing')) DEFAULT 'testing',
    last_used TIMESTAMPTZ,
    success_rate DECIMAL(5,2) DEFAULT 100.0,
    response_time INTEGER DEFAULT 0,
    concurrent_limit INTEGER DEFAULT 1,
    current_usage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing Nodes for Distributed Architecture
CREATE TABLE IF NOT EXISTS processing_nodes (
    id TEXT PRIMARY KEY,
    node_type TEXT CHECK (node_type IN ('primary', 'secondary', 'fallback', 'burst')) DEFAULT 'primary',
    region TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    current_load INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'inactive', 'maintenance', 'failed')) DEFAULT 'active',
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    configuration JSONB,
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Performance Metrics (Time Series)
CREATE TABLE IF NOT EXISTS campaign_metrics_timeseries (
    id BIGSERIAL PRIMARY KEY,
    campaign_id TEXT REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metrics_type TEXT NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    metadata JSONB
);

-- Alert Rules and Notifications
CREATE TABLE IF NOT EXISTS alert_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    condition JSONB NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    channels JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    suppression_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Log
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    alert_rule_id TEXT REFERENCES alert_rules(id) ON DELETE CASCADE,
    campaign_id TEXT,
    error_id TEXT,
    channel_type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'retry')) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Templates and Learning Data
CREATE TABLE IF NOT EXISTS content_templates (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    template TEXT NOT NULL,
    variables TEXT[],
    performance_score DECIMAL(5,2) DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Machine Learning Training Data
CREATE TABLE IF NOT EXISTS ml_training_data (
    id BIGSERIAL PRIMARY KEY,
    data_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    performance_score DECIMAL(5,2),
    feedback JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Analysis Data
CREATE TABLE IF NOT EXISTS competitor_analysis (
    id TEXT PRIMARY KEY,
    campaign_id TEXT REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    competitor_url TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    backlink_data JSONB,
    content_data JSONB,
    performance_metrics JSONB,
    last_analyzed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_id ON automation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_status ON automation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_priority ON automation_campaigns(priority);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_scheduled_at ON automation_campaigns(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_link_opportunities_campaign_id ON link_opportunities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_status ON link_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_authority ON link_opportunities(authority);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_discovered_at ON link_opportunities(discovered_at);

CREATE INDEX IF NOT EXISTS idx_content_requests_campaign_id ON content_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON content_requests(status);
CREATE INDEX IF NOT EXISTS idx_content_requests_created_at ON content_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_posted_links_campaign_id ON posted_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posted_links_status ON posted_links(status);
CREATE INDEX IF NOT EXISTS idx_posted_links_posted_at ON posted_links(posted_at);

CREATE INDEX IF NOT EXISTS idx_error_logs_campaign_id ON error_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_created_at ON campaign_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_health_checks_component ON health_checks(component);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_resource ON rate_limits(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_processing_nodes_status ON processing_nodes(status);
CREATE INDEX IF NOT EXISTS idx_processing_nodes_region ON processing_nodes(region);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timeseries_campaign_id ON campaign_metrics_timeseries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timeseries_timestamp ON campaign_metrics_timeseries(timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timeseries_campaign_timestamp ON campaign_metrics_timeseries(campaign_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timeseries_campaign_type_timestamp ON campaign_metrics_timeseries(campaign_id, metrics_type, timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE automation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE posted_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics_timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

-- User Access Policies
CREATE POLICY "Users can view their own campaigns" ON automation_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON automation_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON automation_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their campaign opportunities" ON link_opportunities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = link_opportunities.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their content requests" ON content_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = content_requests.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their posted links" ON posted_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = posted_links.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their analytics" ON campaign_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their metrics" ON campaign_metrics_timeseries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = campaign_metrics_timeseries.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- Admin Access Policies
CREATE POLICY "Admins can access all data" ON automation_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Service Role Policies (for system operations)
CREATE POLICY "Service role can manage campaigns" ON automation_campaigns
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage opportunities" ON link_opportunities
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage content" ON content_requests
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage links" ON posted_links
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage errors" ON error_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Public access for health checks and system monitoring
ALTER TABLE health_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_pool DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_data DISABLE ROW LEVEL SECURITY;

-- Functions for automated cleanup and maintenance
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS void AS $$
BEGIN
    -- Clean up old error logs (older than 30 days)
    DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old health checks (older than 7 days)
    DELETE FROM health_checks WHERE checked_at < NOW() - INTERVAL '7 days';
    
    -- Clean up old notifications (older than 30 days)
    DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old metrics data (older than 90 days)
    DELETE FROM campaign_metrics_timeseries WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Update proxy success rates
    UPDATE proxy_pool SET 
        success_rate = LEAST(100.0, success_rate + 1.0)
    WHERE status = 'active' AND last_used > NOW() - INTERVAL '1 hour';
    
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign progress
CREATE OR REPLACE FUNCTION update_campaign_progress(campaign_id_param TEXT) RETURNS void AS $$
DECLARE
    total_target INTEGER;
    links_generated INTEGER;
    new_progress INTEGER;
BEGIN
    -- Get campaign target and current links
    SELECT 
        (campaign_data->>'totalLinksTarget')::INTEGER,
        COUNT(pl.id)
    INTO total_target, links_generated
    FROM automation_campaigns ac
    LEFT JOIN posted_links pl ON pl.campaign_id = ac.id AND pl.status = 'live'
    WHERE ac.id = campaign_id_param
    GROUP BY ac.id, ac.campaign_data;
    
    -- Calculate progress percentage
    new_progress := CASE 
        WHEN total_target > 0 THEN LEAST(100, (links_generated * 100) / total_target)
        ELSE 0
    END;
    
    -- Update campaign progress
    UPDATE automation_campaigns 
    SET 
        progress_percentage = new_progress,
        updated_at = NOW()
    WHERE id = campaign_id_param;
    
    -- Check if campaign is complete
    IF new_progress >= 100 THEN
        UPDATE automation_campaigns 
        SET 
            status = 'completed',
            completed_at = NOW()
        WHERE id = campaign_id_param AND status != 'completed';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update campaign progress
CREATE OR REPLACE FUNCTION trigger_update_campaign_progress() RETURNS trigger AS $$
BEGIN
    PERFORM update_campaign_progress(NEW.campaign_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posted_links_progress_trigger
    AFTER INSERT OR UPDATE ON posted_links
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_campaign_progress();

-- Function to generate analytics summaries
CREATE OR REPLACE FUNCTION generate_campaign_summary(campaign_id_param TEXT) RETURNS JSONB AS $$
DECLARE
    summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'campaign_id', ac.id,
        'status', ac.status,
        'progress', ac.progress_percentage,
        'opportunities_found', COUNT(DISTINCT lo.id),
        'links_posted', COUNT(DISTINCT pl.id) FILTER (WHERE pl.status IN ('posted', 'live')),
        'links_live', COUNT(DISTINCT pl.id) FILTER (WHERE pl.status = 'live'),
        'average_authority', COALESCE(AVG(lo.authority), 0),
        'success_rate', CASE 
            WHEN COUNT(DISTINCT lo.id) > 0 THEN 
                (COUNT(DISTINCT pl.id) FILTER (WHERE pl.status = 'live') * 100.0) / COUNT(DISTINCT lo.id)
            ELSE 0 
        END,
        'last_activity', MAX(GREATEST(lo.discovered_at, pl.posted_at, ac.updated_at))
    ) INTO summary
    FROM automation_campaigns ac
    LEFT JOIN link_opportunities lo ON lo.campaign_id = ac.id
    LEFT JOIN posted_links pl ON pl.campaign_id = ac.id
    WHERE ac.id = campaign_id_param
    GROUP BY ac.id, ac.status, ac.progress_percentage;
    
    RETURN summary;
END;
$$ LANGUAGE plpgsql;

-- Scheduled cleanup job (to be run by pg_cron or external scheduler)
SELECT cron.schedule('cleanup-automation-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Initial data for user agents
INSERT INTO user_agents (user_agent, browser, version, os, device_type) VALUES
('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Chrome', '120.0', 'Windows', 'desktop'),
('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Chrome', '120.0', 'macOS', 'desktop'),
('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Chrome', '120.0', 'Linux', 'desktop'),
('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0', 'Firefox', '121.0', 'Windows', 'desktop'),
('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0', 'Firefox', '121.0', 'macOS', 'desktop')
ON CONFLICT (user_agent) DO NOTHING;

-- Initial processing nodes configuration
INSERT INTO processing_nodes (id, node_type, region, capacity) VALUES
('primary-us-east-1', 'primary', 'us-east', 200),
('primary-us-west-1', 'primary', 'us-west', 200),
('secondary-eu-west-1', 'secondary', 'eu-west', 150),
('secondary-ap-south-1', 'secondary', 'asia-pacific', 150),
('fallback-us-central-1', 'fallback', 'us-central', 100),
('burst-global-1', 'burst', 'global', 100)
ON CONFLICT (id) DO NOTHING;

-- Initial alert rules
INSERT INTO alert_rules (id, name, condition, severity, channels) VALUES
(
    'high-error-rate',
    'High Error Rate Detected',
    '{"metric": "error_count", "operator": "gt", "threshold": 10, "timeWindow": 300, "frequency": 10}',
    'high',
    '[{"type": "email", "target": "alerts@company.com", "priority": "high"}]'
),
(
    'critical-system-failure',
    'Critical System Failure',
    '{"metric": "critical_errors", "operator": "gt", "threshold": 1, "timeWindow": 60, "frequency": 1}',
    'critical',
    '[{"type": "email", "target": "oncall@company.com", "priority": "urgent"}, {"type": "slack", "target": "#alerts", "priority": "urgent"}]'
),
(
    'capacity-threshold',
    'System Capacity Threshold',
    '{"metric": "capacity_usage", "operator": "gt", "threshold": 90, "timeWindow": 300, "frequency": 1}',
    'medium',
    '[{"type": "email", "target": "ops@company.com", "priority": "medium"}]'
)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Create a view for campaign dashboard
CREATE OR REPLACE VIEW campaign_dashboard AS
SELECT 
    ac.id,
    ac.user_id,
    ac.status,
    ac.progress_percentage,
    ac.campaign_data->>'name' as campaign_name,
    ac.campaign_data->>'targetUrl' as target_url,
    ac.created_at,
    ac.updated_at,
    COUNT(DISTINCT lo.id) as opportunities_found,
    COUNT(DISTINCT pl.id) FILTER (WHERE pl.status IN ('posted', 'live')) as links_posted,
    COUNT(DISTINCT pl.id) FILTER (WHERE pl.status = 'live') as links_live,
    COALESCE(AVG(lo.authority), 0) as average_authority,
    CASE 
        WHEN COUNT(DISTINCT lo.id) > 0 THEN 
            (COUNT(DISTINCT pl.id) FILTER (WHERE pl.status = 'live') * 100.0) / COUNT(DISTINCT lo.id)
        ELSE 0 
    END as success_rate
FROM automation_campaigns ac
LEFT JOIN link_opportunities lo ON lo.campaign_id = ac.id
LEFT JOIN posted_links pl ON pl.campaign_id = ac.id
GROUP BY ac.id, ac.user_id, ac.status, ac.progress_percentage, ac.campaign_data, ac.created_at, ac.updated_at;

-- Performance monitoring view
CREATE OR REPLACE VIEW system_performance AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'active') as active_campaigns,
    COUNT(*) FILTER (WHERE status = 'queued') as queued_campaigns,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_campaigns,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_campaigns,
    AVG(progress_percentage) as average_progress,
    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as current_load,
    (SELECT SUM(capacity) FROM processing_nodes WHERE status = 'active') as total_capacity,
    (SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '1 hour') as recent_errors
FROM automation_campaigns;
