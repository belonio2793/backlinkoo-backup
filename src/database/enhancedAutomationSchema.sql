-- Enhanced Automation Schema for Different Backlinking Types
-- Comprehensive database structure for efficient campaign management

-- ==================== CORE CAMPAIGN TABLES ====================

-- Enhanced campaigns table with backlinking type specifics
CREATE TABLE IF NOT EXISTS automation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    engine_type VARCHAR(50) NOT NULL, -- 'blog_comments', 'web2_platforms', 'forum_profiles', 'social_media', 'guest_posts', 'directory_submissions'
    backlinking_strategy JSONB NOT NULL DEFAULT '{}', -- Strategy-specific configuration
    target_url TEXT NOT NULL,
    destination_verification JSONB DEFAULT '{}', -- Track destination URL verification
    keywords TEXT[] NOT NULL DEFAULT '{}',
    anchor_texts TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'auto_paused'
    priority TEXT DEFAULT 'medium',
    daily_limit INTEGER DEFAULT 20, -- Base limit for free tier
    daily_usage INTEGER DEFAULT 0, -- Current day usage
    auto_pause_enabled BOOLEAN DEFAULT true,
    auto_run_enabled BOOLEAN DEFAULT false, -- Premium feature
    premium_features JSONB DEFAULT '{}',
    compute_units_used DECIMAL(10,4) DEFAULT 0.0000,
    hosting_resources JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ,
    paused_reason VARCHAR(100),
    premium_upgrade_triggered_at TIMESTAMPTZ
);

-- ==================== BACKLINKING TYPE SPECIFIC TABLES ====================

-- Blog Comments Domain Database
CREATE TABLE IF NOT EXISTS blog_comment_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    base_url TEXT NOT NULL,
    comment_system VARCHAR(50), -- 'wordpress', 'disqus', 'custom', 'facebook'
    authority_score INTEGER DEFAULT 0,
    spam_tolerance INTEGER DEFAULT 0, -- 1-100 scale
    moderation_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'strict'
    approval_rate DECIMAL(5,2) DEFAULT 0.00,
    average_approval_time INTEGER DEFAULT 0, -- minutes
    last_successful_post TIMESTAMPTZ,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    blocked_until TIMESTAMPTZ,
    niche_categories TEXT[] DEFAULT '{}',
    posting_requirements JSONB DEFAULT '{}', -- email, registration, etc.
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_verified TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' -- 'active', 'inactive', 'blocked', 'testing'
);

-- Web2 Platform Database
CREATE TABLE IF NOT EXISTS web2_platform_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    platform_type VARCHAR(50), -- 'medium', 'linkedin', 'reddit', 'quora', 'tumblr'
    api_integration BOOLEAN DEFAULT false,
    requires_account BOOLEAN DEFAULT true,
    posting_frequency_limit INTEGER DEFAULT 5, -- posts per day
    content_requirements JSONB DEFAULT '{}',
    character_limits JSONB DEFAULT '{}',
    authority_score INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    follower_threshold INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    last_post_date TIMESTAMPTZ,
    account_status VARCHAR(20) DEFAULT 'active',
    niche_relevance TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Profile Database
CREATE TABLE IF NOT EXISTS forum_profile_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    forum_software VARCHAR(50), -- 'phpbb', 'vbulletin', 'discourse', 'custom'
    registration_difficulty VARCHAR(20) DEFAULT 'medium',
    profile_link_allowed BOOLEAN DEFAULT true,
    signature_allowed BOOLEAN DEFAULT true,
    post_requirement INTEGER DEFAULT 0, -- minimum posts before profile link
    authority_score INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    activity_level VARCHAR(20) DEFAULT 'medium',
    moderation_strictness VARCHAR(20) DEFAULT 'medium',
    niche_focus TEXT[] DEFAULT '{}',
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    average_approval_time INTEGER DEFAULT 0,
    last_successful_profile TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
);

-- Social Media Platform Database
CREATE TABLE IF NOT EXISTS social_media_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name VARCHAR(50) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    platform_type VARCHAR(30), -- 'twitter', 'facebook', 'instagram', 'tiktok', 'pinterest'
    api_available BOOLEAN DEFAULT false,
    link_policy VARCHAR(20) DEFAULT 'restricted', -- 'open', 'restricted', 'forbidden'
    character_limit INTEGER DEFAULT 280,
    hashtag_support BOOLEAN DEFAULT true,
    story_features BOOLEAN DEFAULT false,
    algorithm_weight DECIMAL(3,2) DEFAULT 1.00,
    engagement_potential INTEGER DEFAULT 50, -- 1-100 scale
    audience_size_estimate BIGINT DEFAULT 0,
    posting_frequency_safe INTEGER DEFAULT 10, -- per day
    best_posting_times JSONB DEFAULT '{}',
    content_formats TEXT[] DEFAULT '{}', -- 'text', 'image', 'video', 'link'
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest Post Database
CREATE TABLE IF NOT EXISTS guest_post_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    editor_email VARCHAR(255),
    submission_page TEXT,
    guest_post_guidelines TEXT,
    authority_score INTEGER DEFAULT 0,
    traffic_estimate INTEGER DEFAULT 0,
    acceptance_rate DECIMAL(5,2) DEFAULT 0.00,
    average_response_time INTEGER DEFAULT 0, -- days
    content_requirements JSONB DEFAULT '{}',
    word_count_range JSONB DEFAULT '{}', -- min/max words
    topics_accepted TEXT[] DEFAULT '{}',
    backlink_policy VARCHAR(50) DEFAULT 'allowed', -- 'allowed', 'nofollow', 'forbidden'
    payment_required BOOLEAN DEFAULT false,
    pricing_info JSONB DEFAULT '{}',
    last_contact_date TIMESTAMPTZ,
    relationship_status VARCHAR(20) DEFAULT 'new', -- 'new', 'contacted', 'responded', 'active', 'declined'
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Directory Submission Database
CREATE TABLE IF NOT EXISTS directory_submission_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directory_name VARCHAR(100) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    directory_type VARCHAR(30), -- 'general', 'niche', 'local', 'industry'
    submission_cost DECIMAL(10,2) DEFAULT 0.00,
    review_time_days INTEGER DEFAULT 7,
    authority_score INTEGER DEFAULT 0,
    approval_rate DECIMAL(5,2) DEFAULT 0.00,
    link_type VARCHAR(20) DEFAULT 'dofollow', -- 'dofollow', 'nofollow', 'mixed'
    categories_available TEXT[] DEFAULT '{}',
    submission_requirements JSONB DEFAULT '{}',
    recurring_fees BOOLEAN DEFAULT false,
    featured_listing_available BOOLEAN DEFAULT false,
    last_submission_date TIMESTAMPTZ,
    success_count INTEGER DEFAULT 0,
    rejection_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
);

-- ==================== LIVE URL STORAGE & SYNC TABLES ====================

-- Live URLs with real-time sync capabilities
CREATE TABLE IF NOT EXISTS live_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    domain_id UUID, -- References appropriate domain table
    domain_table_name VARCHAR(50), -- Which domain table this references
    source_url TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT,
    placement_type VARCHAR(50) NOT NULL,
    content_snippet TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'posted', 'verified', 'failed', 'removed'
    verification_status VARCHAR(20) DEFAULT 'unverified', -- 'unverified', 'verified', 'broken', 'redirect'
    posting_timestamp TIMESTAMPTZ DEFAULT NOW(),
    verification_timestamp TIMESTAMPTZ,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    response_time_ms INTEGER,
    http_status_code INTEGER,
    backlink_live BOOLEAN DEFAULT false,
    destination_match BOOLEAN DEFAULT false, -- Verified against campaign target_url
    sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'pending_sync', 'sync_failed'
    ui_placements JSONB DEFAULT '[]', -- Track which UI components are displaying this
    compute_cost DECIMAL(8,4) DEFAULT 0.0000,
    quality_score INTEGER DEFAULT 0,
    authority_passed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- URL sync log for tracking changes across UI placements
CREATE TABLE IF NOT EXISTS url_sync_log (
    id BIGSERIAL PRIMARY KEY,
    live_url_id UUID REFERENCES live_urls(id) ON DELETE CASCADE,
    sync_event VARCHAR(30) NOT NULL, -- 'created', 'updated', 'verified', 'removed', 'ui_refresh'
    ui_component VARCHAR(50), -- Which UI component triggered the sync
    old_data JSONB,
    new_data JSONB,
    sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
    sync_duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- ==================== USAGE & COMPUTE TRACKING ====================

-- Daily usage tracking for users
CREATE TABLE IF NOT EXISTS daily_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE,
    campaign_count INTEGER DEFAULT 0,
    links_processed INTEGER DEFAULT 0,
    links_posted INTEGER DEFAULT 0,
    compute_units_used DECIMAL(10,4) DEFAULT 0.0000,
    api_requests INTEGER DEFAULT 0,
    storage_used_mb DECIMAL(10,2) DEFAULT 0.00,
    bandwidth_used_mb DECIMAL(10,2) DEFAULT 0.00,
    processing_time_seconds INTEGER DEFAULT 0,
    premium_features_used TEXT[] DEFAULT '{}',
    hosting_cost_estimated DECIMAL(8,4) DEFAULT 0.0000,
    tier_limit_reached BOOLEAN DEFAULT false,
    autopause_triggered BOOLEAN DEFAULT false,
    premium_upgrade_suggested BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, usage_date)
);

-- Compute cost matrix for different operations
CREATE TABLE IF NOT EXISTS compute_cost_matrix (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL, -- 'url_discovery', 'content_analysis', 'posting', 'verification'
    engine_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'expert'
    base_cost DECIMAL(8,6) NOT NULL, -- Cost per operation
    premium_discount DECIMAL(3,2) DEFAULT 0.00, -- Percentage discount for premium users
    hosting_factor DECIMAL(3,2) DEFAULT 1.00, -- Multiplier based on hosting complexity
    success_bonus DECIMAL(8,6) DEFAULT 0.000000, -- Bonus cost for successful operations
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(operation_type, engine_type, difficulty_level)
);

-- ==================== PREMIUM SUBSCRIPTION TRIGGERS ====================

-- Premium upgrade triggers and events
CREATE TABLE IF NOT EXISTS premium_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_type VARCHAR(30) NOT NULL, -- 'daily_limit', 'compute_limit', 'feature_request', 'autopause', 'performance'
    trigger_event VARCHAR(50) NOT NULL,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE SET NULL,
    trigger_data JSONB DEFAULT '{}',
    user_response VARCHAR(20), -- 'shown', 'dismissed', 'upgraded', 'ignored'
    conversion_value DECIMAL(8,2), -- If user upgraded, the plan value
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    priority INTEGER DEFAULT 5, -- 1-10, higher is more important
    shown_count INTEGER DEFAULT 0,
    max_show_count INTEGER DEFAULT 3
);

-- Auto-pause/auto-run configuration
CREATE TABLE IF NOT EXISTS automation_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    auto_pause_enabled BOOLEAN DEFAULT true,
    auto_run_enabled BOOLEAN DEFAULT false, -- Premium feature
    daily_limit INTEGER DEFAULT 20,
    compute_limit DECIMAL(8,4) DEFAULT 10.0000,
    pause_triggers JSONB DEFAULT '{}', -- Conditions that trigger pause
    run_triggers JSONB DEFAULT '{}', -- Conditions that trigger auto-run (premium)
    premium_mode BOOLEAN DEFAULT false,
    current_status VARCHAR(20) DEFAULT 'manual', -- 'manual', 'auto_paused', 'auto_running'
    last_pause_reason VARCHAR(100),
    last_action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campaign_id)
);

-- ==================== SYSTEM OPERATIONS MONITORING ====================

-- System operations log for activity monitoring
CREATE TABLE IF NOT EXISTS system_operations (
    id BIGSERIAL PRIMARY KEY,
    operation_id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE SET NULL,
    operation_type VARCHAR(30) NOT NULL, -- 'url_discovery', 'content_posting', 'verification', 'sync', 'compute'
    operation_subtype VARCHAR(50),
    status VARCHAR(20) DEFAULT 'started', -- 'started', 'processing', 'completed', 'failed', 'retrying'
    priority INTEGER DEFAULT 5,
    processing_node VARCHAR(50),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    compute_cost DECIMAL(8,6) DEFAULT 0.000000,
    success_rate DECIMAL(5,2),
    error_message TEXT,
    operation_data JSONB DEFAULT '{}',
    result_data JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    hosting_impact JSONB DEFAULT '{}' -- CPU, memory, bandwidth usage
);

-- Real-time activity feed for subtle UI display
CREATE TABLE IF NOT EXISTS activity_feed (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL, -- 'url_found', 'link_posted', 'verification', 'milestone', 'alert'
    activity_subtype VARCHAR(50),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    severity VARCHAR(10) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    read_status BOOLEAN DEFAULT false,
    display_duration INTEGER DEFAULT 5000, -- milliseconds to show in UI
    ui_placement VARCHAR(30) DEFAULT 'notification', -- 'notification', 'sidebar', 'header', 'modal'
    action_url TEXT, -- Optional URL for click actions
    auto_dismiss BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Campaign and URL indexes
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_user_status ON automation_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_engine_type ON automation_campaigns(engine_type);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_daily_usage ON automation_campaigns(daily_usage, daily_limit);

-- Live URLs indexes
CREATE INDEX IF NOT EXISTS idx_live_urls_campaign_status ON live_urls(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_live_urls_verification ON live_urls(verification_status, last_checked);
CREATE INDEX IF NOT EXISTS idx_live_urls_sync_status ON live_urls(sync_status, updated_at);

-- Domain tables indexes
CREATE INDEX IF NOT EXISTS idx_blog_comment_domains_status ON blog_comment_domains(status, authority_score);
CREATE INDEX IF NOT EXISTS idx_web2_platform_domains_type ON web2_platform_domains(platform_type, success_rate);
CREATE INDEX IF NOT EXISTS idx_forum_profile_domains_activity ON forum_profile_domains(activity_level, success_rate);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage_tracking(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_daily_usage_limits ON daily_usage_tracking(tier_limit_reached, premium_upgrade_suggested);

-- System operations indexes
CREATE INDEX IF NOT EXISTS idx_system_operations_status ON system_operations(status, start_time);
CREATE INDEX IF NOT EXISTS idx_system_operations_user_campaign ON system_operations(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_read ON activity_feed(user_id, read_status, created_at);

-- ==================== TRIGGERS FOR AUTOMATIC OPERATIONS ====================

-- Function to update campaign daily usage
CREATE OR REPLACE FUNCTION update_campaign_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'posted' AND OLD.status != 'posted' THEN
        UPDATE automation_campaigns 
        SET daily_usage = daily_usage + 1,
            updated_at = NOW()
        WHERE id = NEW.campaign_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for live URL posting
CREATE TRIGGER trigger_update_campaign_usage
    AFTER UPDATE ON live_urls
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_usage();

-- Function to check daily limits and trigger auto-pause
CREATE OR REPLACE FUNCTION check_daily_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if daily limit reached
    IF NEW.daily_usage >= NEW.daily_limit THEN
        -- Auto-pause if enabled
        UPDATE automation_campaigns 
        SET status = 'auto_paused',
            paused_reason = 'daily_limit_reached',
            updated_at = NOW()
        WHERE id = NEW.id AND auto_pause_enabled = true;
        
        -- Log premium trigger
        INSERT INTO premium_triggers (user_id, trigger_type, trigger_event, campaign_id, trigger_data)
        VALUES (NEW.user_id, 'daily_limit', 'limit_reached', NEW.id, 
                jsonb_build_object('daily_usage', NEW.daily_usage, 'daily_limit', NEW.daily_limit));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for daily limit checking
CREATE TRIGGER trigger_check_daily_limits
    AFTER UPDATE ON automation_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_limits();

-- ==================== STORED PROCEDURES FOR COMMON OPERATIONS ====================

-- Procedure to get comprehensive campaign status
CREATE OR REPLACE FUNCTION get_campaign_status(p_campaign_id UUID)
RETURNS TABLE (
    campaign_name VARCHAR,
    status VARCHAR,
    daily_usage INTEGER,
    daily_limit INTEGER,
    compute_used DECIMAL,
    live_links_count BIGINT,
    success_rate DECIMAL,
    last_activity TIMESTAMPTZ,
    premium_features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name,
        c.status,
        c.daily_usage,
        c.daily_limit,
        c.compute_units_used,
        COUNT(l.id) FILTER (WHERE l.status = 'verified'),
        CASE 
            WHEN COUNT(l.id) > 0 THEN 
                (COUNT(l.id) FILTER (WHERE l.status = 'verified') * 100.0 / COUNT(l.id))
            ELSE 0
        END,
        c.last_activity,
        c.premium_features
    FROM automation_campaigns c
    LEFT JOIN live_urls l ON c.id = l.campaign_id
    WHERE c.id = p_campaign_id
    GROUP BY c.id, c.name, c.status, c.daily_usage, c.daily_limit, c.compute_units_used, c.last_activity, c.premium_features;
END;
$$ LANGUAGE plpgsql;

-- Procedure to sync URL data across UI placements
CREATE OR REPLACE FUNCTION sync_url_data(p_live_url_id UUID, p_ui_component VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    sync_start TIMESTAMPTZ;
    sync_end TIMESTAMPTZ;
    success BOOLEAN DEFAULT true;
BEGIN
    sync_start := NOW();
    
    BEGIN
        -- Update sync status
        UPDATE live_urls 
        SET sync_status = 'synced',
            updated_at = NOW()
        WHERE id = p_live_url_id;
        
        -- Log sync event
        sync_end := NOW();
        INSERT INTO url_sync_log (live_url_id, sync_event, ui_component, sync_timestamp, sync_duration_ms, success)
        VALUES (p_live_url_id, 'ui_refresh', p_ui_component, sync_start, 
                EXTRACT(EPOCH FROM (sync_end - sync_start)) * 1000, true);
                
    EXCEPTION WHEN OTHERS THEN
        success := false;
        INSERT INTO url_sync_log (live_url_id, sync_event, ui_component, sync_timestamp, success, error_message)
        VALUES (p_live_url_id, 'ui_refresh', p_ui_component, sync_start, false, SQLERRM);
    END;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Initialize compute cost matrix with default values
INSERT INTO compute_cost_matrix (operation_type, engine_type, difficulty_level, base_cost, premium_discount, hosting_factor) VALUES
('url_discovery', 'blog_comments', 'easy', 0.001000, 0.20, 1.0),
('url_discovery', 'blog_comments', 'medium', 0.002500, 0.20, 1.2),
('url_discovery', 'blog_comments', 'hard', 0.005000, 0.25, 1.5),
('content_posting', 'blog_comments', 'easy', 0.010000, 0.15, 1.0),
('content_posting', 'blog_comments', 'medium', 0.025000, 0.15, 1.3),
('content_posting', 'blog_comments', 'hard', 0.050000, 0.20, 1.8),
('verification', 'blog_comments', 'easy', 0.002000, 0.10, 1.0),
('verification', 'blog_comments', 'medium', 0.005000, 0.10, 1.1),
('verification', 'blog_comments', 'hard', 0.010000, 0.15, 1.3),
('url_discovery', 'web2_platforms', 'easy', 0.005000, 0.25, 1.2),
('url_discovery', 'web2_platforms', 'medium', 0.012500, 0.25, 1.5),
('url_discovery', 'web2_platforms', 'hard', 0.025000, 0.30, 2.0),
('content_posting', 'web2_platforms', 'easy', 0.020000, 0.20, 1.5),
('content_posting', 'web2_platforms', 'medium', 0.050000, 0.20, 2.0),
('content_posting', 'web2_platforms', 'hard', 0.100000, 0.25, 3.0)
ON CONFLICT (operation_type, engine_type, difficulty_level) DO NOTHING;
