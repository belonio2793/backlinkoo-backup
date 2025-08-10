-- ==========================================
-- COMPLETE DATABASE SETUP FOR BACKLINK AUTOMATION
-- ==========================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- This will create ALL required tables, views, functions, and policies

-- ==========================================
-- 1. USER PROFILES AND AUTHENTICATION SETUP
-- ==========================================

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'monthly', 'enterprise')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. CAMPAIGN METRICS TABLES
-- ==========================================

-- Campaign Runtime Metrics Table - Tracks individual campaign runtime and progress indefinitely
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

-- User Monthly Link Aggregates Table - Tracks total links per user per month
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

-- Campaign Link History Table - Detailed history of each link built
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

-- ==========================================
-- 3. BLOG POSTS AND CONTENT TABLES
-- ==========================================

-- Blog Posts Table - For AI generated and manual blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    author_bio TEXT,
    author_avatar TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    category TEXT,
    tags TEXT[],
    seo_title TEXT,
    seo_description TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Saved Posts Table - For users to claim/save blog posts
CREATE TABLE IF NOT EXISTS user_saved_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    is_trial_post BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- AI Generated Posts Table - For tracking AI-generated content
CREATE TABLE IF NOT EXISTS ai_generated_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    keywords TEXT[],
    target_url TEXT,
    anchor_text TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'failed', 'queued')),
    generation_prompt TEXT,
    ai_model TEXT DEFAULT 'gpt-4',
    generation_time_ms INTEGER,
    word_count INTEGER,
    readability_score DECIMAL(5,2),
    seo_score DECIMAL(5,2),
    published_url TEXT,
    indexed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ADMIN AND CONFIGURATION TABLES
-- ==========================================

-- Admin Environment Variables Table - For storing API keys and configuration
CREATE TABLE IF NOT EXISTS admin_environment_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT NOT NULL UNIQUE,
    key_value TEXT NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Audit Log Table - For tracking user actions
CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logs Table - For application error logging
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    request_url TEXT,
    request_method TEXT,
    request_headers JSONB,
    request_body TEXT,
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. PREMIUM AND SUBSCRIPTION TABLES
-- ==========================================

-- Premium Subscriptions Table - Tracks user premium subscriptions
CREATE TABLE IF NOT EXISTS premium_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
    plan_id TEXT,
    plan_name TEXT,
    price_amount INTEGER, -- in cents
    currency TEXT DEFAULT 'usd',
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Premium Feature Usage Table - Tracks usage of premium features
CREATE TABLE IF NOT EXISTS premium_feature_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    usage_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_name, usage_date)
);

-- ==========================================
-- 6. REPORTING AND ANALYTICS TABLES
-- ==========================================

-- Saved Backlink Reports Table - For storing generated reports
CREATE TABLE IF NOT EXISTS saved_backlink_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    campaign_ids UUID[],
    target_url TEXT,
    report_data JSONB NOT NULL,
    report_type TEXT DEFAULT 'campaign_summary',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. VIEWS FOR DASHBOARD AND REPORTING
-- ==========================================

-- Live Campaign Monitor View - Real-time campaign dashboard
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

-- User Dashboard Summary View - Comprehensive user metrics
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

-- ==========================================
-- 8. FUNCTIONS FOR DATA MANAGEMENT
-- ==========================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'first_name',
            split_part(NEW.email, '@', 1)
        ),
        'user'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If profile creation fails, don't block user creation
        RETURN NEW;
END;
$$;

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
    -- Determine user premium status
    SELECT 
        CASE WHEN p.subscription_tier IN ('premium', 'monthly', 'enterprise') OR p.role = 'admin' THEN TRUE ELSE FALSE END,
        CASE WHEN p.subscription_tier IN ('premium', 'monthly', 'enterprise') OR p.role = 'admin' THEN -1 ELSE 20 END
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

-- ==========================================
-- 9. TRIGGERS
-- ==========================================

-- Remove existing triggers and create new ones
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_runtime_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_link_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_link_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_backlink_reports ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Campaign metrics policies
CREATE POLICY "Users can manage their own campaign metrics" ON campaign_runtime_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own monthly aggregates" ON user_monthly_link_aggregates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage monthly aggregates" ON user_monthly_link_aggregates FOR ALL USING (true);
CREATE POLICY "Users can manage their own link history" ON campaign_link_history FOR ALL USING (auth.uid() = user_id);

-- Blog posts policies
CREATE POLICY "Everyone can view published blog posts" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage their own blog posts" ON blog_posts FOR ALL USING (author_id = auth.uid());

-- User saved posts policies
CREATE POLICY "Users can manage their own saved posts" ON user_saved_posts FOR ALL USING (auth.uid() = user_id);

-- AI generated posts policies
CREATE POLICY "Users can manage their own AI posts" ON ai_generated_posts FOR ALL USING (auth.uid() = user_id);

-- Premium subscription policies
CREATE POLICY "Users can view their own subscription" ON premium_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subscription" ON premium_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Premium feature usage policies
CREATE POLICY "Users can view their own feature usage" ON premium_feature_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own feature usage" ON premium_feature_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved reports policies
CREATE POLICY "Users can manage their own reports" ON saved_backlink_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view public reports" ON saved_backlink_reports FOR SELECT USING (is_public = true);

-- Admin policies (full access for admin users)
CREATE POLICY "Admins have full access" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins have full campaign access" ON campaign_runtime_metrics FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins have full aggregates access" ON user_monthly_link_aggregates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins have full access to admin variables" ON admin_environment_variables FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins have full access to audit log" ON user_audit_log FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins have full access to error logs" ON error_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')
);

-- ==========================================
-- 11. INDEXES FOR PERFORMANCE
-- ==========================================

-- User and profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier, subscription_status);

-- Campaign metrics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_user_id ON campaign_runtime_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_campaign_id ON campaign_runtime_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_status ON campaign_runtime_metrics(status);
CREATE INDEX IF NOT EXISTS idx_campaign_runtime_metrics_created_at ON campaign_runtime_metrics(created_at);

-- Monthly aggregates indexes
CREATE INDEX IF NOT EXISTS idx_user_monthly_aggregates_user_month ON user_monthly_link_aggregates(user_id, year, month);

-- Link history indexes
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_user_id ON campaign_link_history(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_campaign_id ON campaign_link_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_published_at ON campaign_link_history(published_at);
CREATE INDEX IF NOT EXISTS idx_campaign_link_history_status ON campaign_link_history(status);

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- User saved posts indexes
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_user_id ON user_saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_post_id ON user_saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_posts_claimed_at ON user_saved_posts(claimed_at);

-- AI posts indexes
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_user_id ON ai_generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_campaign_id ON ai_generated_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_posts_status ON ai_generated_posts(status);

-- Admin and audit indexes
CREATE INDEX IF NOT EXISTS idx_admin_environment_variables_key_name ON admin_environment_variables(key_name);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_timestamp ON user_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Premium and subscription indexes
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_feature_usage_user_date ON premium_feature_usage(user_id, usage_date);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_saved_backlink_reports_user_id ON saved_backlink_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_backlink_reports_generated_at ON saved_backlink_reports(generated_at);

-- ==========================================
-- 12. GRANTS AND PERMISSIONS
-- ==========================================

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON saved_backlink_reports TO anon;

-- ==========================================
-- 13. COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE profiles IS 'User profiles with role and subscription information';
COMMENT ON TABLE campaign_runtime_metrics IS 'Individual campaign runtime tracking with progressive link counts';
COMMENT ON TABLE user_monthly_link_aggregates IS 'Monthly aggregated metrics per user for reporting and limits';
COMMENT ON TABLE campaign_link_history IS 'Detailed history of every link built with full audit trail';
COMMENT ON TABLE blog_posts IS 'Blog posts table for content management';
COMMENT ON TABLE user_saved_posts IS 'User claimed/saved blog posts with trial tracking';
COMMENT ON TABLE ai_generated_posts IS 'AI-generated blog posts with generation metadata';
COMMENT ON TABLE admin_environment_variables IS 'Secure storage for API keys and configuration';
COMMENT ON TABLE user_audit_log IS 'User action audit trail for security and compliance';
COMMENT ON TABLE error_logs IS 'Application error logging for debugging and monitoring';
COMMENT ON TABLE premium_subscriptions IS 'User premium subscription tracking and billing';
COMMENT ON TABLE premium_feature_usage IS 'Premium feature usage analytics and limits';
COMMENT ON TABLE saved_backlink_reports IS 'Generated and saved backlink reports';
COMMENT ON VIEW live_campaign_monitor IS 'Real-time dashboard view of campaign metrics';
COMMENT ON VIEW user_dashboard_summary IS 'Comprehensive user dashboard with lifetime and current stats';

-- ==========================================
-- SETUP COMPLETE! 
-- ==========================================
-- 
-- ✅ What this creates:
-- • User profiles and authentication system
-- • Campaign metrics tracking (persistent, progressive)
-- • Blog posts and content management
-- • AI-generated content tracking
-- • Premium subscriptions and billing
-- • Admin configuration and environment variables
-- • Comprehensive audit logging and error tracking
-- • Real-time dashboard views and reporting
-- • Row-level security policies
-- • Performance indexes
-- • Automated data management functions
--
-- 🎯 Your backlink automation platform database is now fully configured!
--
-- Next steps:
-- 1. Verify all tables were created successfully
-- 2. Test user registration and profile creation
-- 3. Test campaign creation and metrics tracking
-- 4. Configure your application's environment variables
-- 5. Set up your first admin user if needed
--
-- 🚀 Ready for production use!
