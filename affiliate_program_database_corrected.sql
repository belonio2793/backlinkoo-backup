-- =============================================================================
-- BACKLINK ∞ AFFILIATE PROGRAM DATABASE SCHEMA (CORRECTED)
-- Complete SQL setup for enterprise-grade affiliate program
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. AFFILIATE PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'partner')),
    total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    total_conversions INTEGER NOT NULL DEFAULT 0,
    lifetime_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    payout_method TEXT CHECK (payout_method IN ('paypal', 'stripe', 'crypto', 'bank')),
    payout_details JSONB,
    registration_data JSONB,
    
    -- Indexes
    CONSTRAINT unique_user_affiliate UNIQUE(user_id)
);

CREATE INDEX idx_affiliate_profiles_affiliate_id ON public.affiliate_profiles(affiliate_id);
CREATE INDEX idx_affiliate_profiles_status ON public.affiliate_profiles(status);
CREATE INDEX idx_affiliate_profiles_tier ON public.affiliate_profiles(tier);
CREATE INDEX idx_affiliate_profiles_created_at ON public.affiliate_profiles(created_at);

-- =============================================================================
-- 2. AFFILIATE REFERRALS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id TEXT NOT NULL REFERENCES public.affiliate_profiles(affiliate_id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    visitor_ip INET NOT NULL,
    user_agent TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    landing_page TEXT NOT NULL,
    referer TEXT,
    conversion_status TEXT NOT NULL DEFAULT 'pending' CHECK (conversion_status IN ('pending', 'converted', 'expired')),
    conversion_value DECIMAL(12,2),
    commission_earned DECIMAL(12,2),
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    device_fingerprint TEXT,
    session_id TEXT,
    country TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,
    os TEXT
);

CREATE INDEX idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_referral_code ON public.affiliate_referrals(referral_code);
CREATE INDEX idx_affiliate_referrals_status ON public.affiliate_referrals(conversion_status);
CREATE INDEX idx_affiliate_referrals_clicked_at ON public.affiliate_referrals(clicked_at);
CREATE INDEX idx_affiliate_referrals_expires_at ON public.affiliate_referrals(expires_at);

-- =============================================================================
-- 3. AFFILIATE COMMISSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id TEXT NOT NULL REFERENCES public.affiliate_profiles(affiliate_id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('signup', 'subscription', 'purchase', 'bonus')),
    amount DECIMAL(12,2) NOT NULL,
    percentage DECIMAL(5,4) NOT NULL,
    order_value DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payment_id TEXT,
    notes TEXT,
    tier_at_time TEXT,
    campaign_id UUID
);

CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_type ON public.affiliate_commissions(commission_type);
CREATE INDEX idx_affiliate_commissions_created_at ON public.affiliate_commissions(created_at);

-- =============================================================================
-- 4. AFFILIATE PAYOUTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id TEXT NOT NULL REFERENCES public.affiliate_profiles(affiliate_id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    method TEXT NOT NULL CHECK (method IN ('paypal', 'stripe', 'crypto', 'bank')),
    transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failure_reason TEXT,
    commission_ids UUID[] NOT NULL,
    payout_details JSONB
);

CREATE INDEX idx_affiliate_payouts_affiliate_id ON public.affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX idx_affiliate_payouts_created_at ON public.affiliate_payouts(created_at);

-- =============================================================================
-- 5. AFFILIATE CLICKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id TEXT NOT NULL REFERENCES public.affiliate_profiles(affiliate_id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    visitor_ip INET NOT NULL,
    user_agent TEXT NOT NULL,
    referer TEXT,
    utm_params JSONB,
    landing_page TEXT NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    country TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,
    os TEXT,
    session_id TEXT
);

CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);
CREATE INDEX idx_affiliate_clicks_country ON public.affiliate_clicks(country);
CREATE INDEX idx_affiliate_clicks_device_type ON public.affiliate_clicks(device_type);

-- =============================================================================
-- 6. AFFILIATE ASSETS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('banner', 'button', 'email_template', 'social_post', 'video', 'landing_page')),
    category TEXT NOT NULL,
    dimensions TEXT,
    file_url TEXT NOT NULL,
    preview_url TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    tags TEXT[],
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

CREATE INDEX idx_affiliate_assets_type ON public.affiliate_assets(type);
CREATE INDEX idx_affiliate_assets_category ON public.affiliate_assets(category);
CREATE INDEX idx_affiliate_assets_active ON public.affiliate_assets(is_active);

-- =============================================================================
-- 7. AFFILIATE CAMPAIGNS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    commission_rate DECIMAL(5,4) NOT NULL,
    bonus_amount DECIMAL(12,2),
    target_conversions INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    eligible_tiers TEXT[] NOT NULL DEFAULT ARRAY['bronze', 'silver', 'gold', 'platinum', 'partner'],
    campaign_assets UUID[],
    terms_and_conditions TEXT
);

CREATE INDEX idx_affiliate_campaigns_active ON public.affiliate_campaigns(is_active);
CREATE INDEX idx_affiliate_campaigns_dates ON public.affiliate_campaigns(start_date, end_date);

-- =============================================================================
-- 8. AFFILIATE LEADERBOARD TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id TEXT NOT NULL REFERENCES public.affiliate_profiles(affiliate_id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    rank INTEGER NOT NULL,
    referrals INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_affiliate_period UNIQUE(affiliate_id, period, period_start)
);

CREATE INDEX idx_affiliate_leaderboard_period ON public.affiliate_leaderboard(period, period_start);
CREATE INDEX idx_affiliate_leaderboard_rank ON public.affiliate_leaderboard(period, rank);

-- =============================================================================
-- 9. AFFILIATE MILESTONES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id TEXT NOT NULL REFERENCES public.affiliate_profiles(affiliate_id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL CHECK (milestone_type IN ('referrals', 'earnings', 'conversions', 'streak')),
    milestone_value DECIMAL(12,2) NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('bonus', 'tier_upgrade', 'badge', 'credits')),
    reward_value DECIMAL(12,2) NOT NULL,
    reward_description TEXT NOT NULL,
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ
);

CREATE INDEX idx_affiliate_milestones_affiliate_id ON public.affiliate_milestones(affiliate_id);
CREATE INDEX idx_affiliate_milestones_type ON public.affiliate_milestones(milestone_type);
CREATE INDEX idx_affiliate_milestones_claimed ON public.affiliate_milestones(is_claimed);

-- =============================================================================
-- 10. AFFILIATE BADGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id TEXT NOT NULL REFERENCES public.affiliate_profiles(affiliate_id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_description TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress_value DECIMAL(12,2),
    max_progress DECIMAL(12,2),
    
    CONSTRAINT unique_affiliate_badge UNIQUE(affiliate_id, badge_id)
);

CREATE INDEX idx_affiliate_badges_affiliate_id ON public.affiliate_badges(affiliate_id);
CREATE INDEX idx_affiliate_badges_rarity ON public.affiliate_badges(rarity);

-- =============================================================================
-- 11. AFFILIATE SETTINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    default_commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    cookie_duration_days INTEGER NOT NULL DEFAULT 30,
    minimum_payout DECIMAL(12,2) NOT NULL DEFAULT 50.00,
    payout_schedule TEXT NOT NULL DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly', 'bi_weekly', 'monthly')),
    auto_approve_affiliates BOOLEAN NOT NULL DEFAULT false,
    require_tax_info BOOLEAN NOT NULL DEFAULT false,
    commission_tiers JSONB NOT NULL DEFAULT '{"bronze": 0.20, "silver": 0.25, "gold": 0.30, "platinum": 0.35, "partner": 0.40}',
    bonus_milestones JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.affiliate_settings (id) VALUES (uuid_generate_v4()) 
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 12. RLS POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

-- Affiliate Profiles Policies
CREATE POLICY "Users can view their own affiliate profile"
ON public.affiliate_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate profile"
ON public.affiliate_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate profile"
ON public.affiliate_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliate profiles"
ON public.affiliate_profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Affiliate Referrals Policies
CREATE POLICY "Affiliates can view their own referrals"
ON public.affiliate_referrals FOR SELECT
USING (
    affiliate_id IN (
        SELECT affiliate_id FROM public.affiliate_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "System can insert referrals"
ON public.affiliate_referrals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all referrals"
ON public.affiliate_referrals FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Affiliate Commissions Policies
CREATE POLICY "Affiliates can view their own commissions"
ON public.affiliate_commissions FOR SELECT
USING (
    affiliate_id IN (
        SELECT affiliate_id FROM public.affiliate_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "System can insert commissions"
ON public.affiliate_commissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage all commissions"
ON public.affiliate_commissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Affiliate Assets Policies
CREATE POLICY "Everyone can view active assets"
ON public.affiliate_assets FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all assets"
ON public.affiliate_assets FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Leaderboard Policies (CORRECTED - removed 'system' role)
CREATE POLICY "Everyone can view leaderboard"
ON public.affiliate_leaderboard FOR SELECT
USING (true);

CREATE POLICY "Admins can manage leaderboard"
ON public.affiliate_leaderboard FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Milestones Policies
CREATE POLICY "Affiliates can view their own milestones"
ON public.affiliate_milestones FOR SELECT
USING (
    affiliate_id IN (
        SELECT affiliate_id FROM public.affiliate_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all milestones"
ON public.affiliate_milestones FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Badges Policies
CREATE POLICY "Affiliates can view their own badges"
ON public.affiliate_badges FOR SELECT
USING (
    affiliate_id IN (
        SELECT affiliate_id FROM public.affiliate_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all badges"
ON public.affiliate_badges FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Settings Policies
CREATE POLICY "Everyone can view settings"
ON public.affiliate_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.affiliate_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- =============================================================================
-- 13. UTILITY FUNCTIONS
-- =============================================================================

-- Function to generate unique affiliate ID
CREATE OR REPLACE FUNCTION generate_affiliate_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        new_id := 'BL' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)) || 
                  EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT;
        
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.affiliate_profiles WHERE affiliate_id = new_id
        );
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique affiliate ID after 100 attempts';
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission tiers
CREATE OR REPLACE FUNCTION calculate_affiliate_tier(
    total_earnings DECIMAL,
    total_conversions INTEGER
)
RETURNS TEXT AS $$
BEGIN
    IF total_earnings >= 10000 OR total_conversions >= 100 THEN
        RETURN 'platinum';
    ELSIF total_earnings >= 5000 OR total_conversions >= 50 THEN
        RETURN 'gold';
    ELSIF total_earnings >= 1000 OR total_conversions >= 20 THEN
        RETURN 'silver';
    ELSE
        RETURN 'bronze';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update affiliate tier automatically
CREATE OR REPLACE FUNCTION update_affiliate_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier TEXT;
    commission_rates JSONB;
BEGIN
    -- Calculate new tier
    new_tier := calculate_affiliate_tier(NEW.total_earnings, NEW.total_conversions);
    
    -- Get commission rates from settings
    SELECT commission_tiers INTO commission_rates 
    FROM public.affiliate_settings 
    LIMIT 1;
    
    -- Update tier and commission rate if changed
    IF NEW.tier != new_tier THEN
        NEW.tier := new_tier;
        NEW.commission_rate := (commission_rates ->> new_tier)::DECIMAL;
        NEW.updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic tier updates
CREATE TRIGGER trigger_update_affiliate_tier
    BEFORE UPDATE ON public.affiliate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_tier();

-- Function to automatically set affiliate_id on insert
CREATE OR REPLACE FUNCTION set_affiliate_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.affiliate_id IS NULL OR NEW.affiliate_id = '' THEN
        NEW.affiliate_id := generate_affiliate_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic affiliate_id generation
CREATE TRIGGER trigger_set_affiliate_id
    BEFORE INSERT ON public.affiliate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_affiliate_id();

-- =============================================================================
-- 14. SAMPLE DATA (OPTIONAL)
-- =============================================================================

-- Insert sample affiliate assets
INSERT INTO public.affiliate_assets (name, type, category, dimensions, file_url, preview_url, metadata) VALUES
('Leaderboard Banner - Blue', 'banner', 'display', '728x90', '/assets/banners/leaderboard_blue.png', '/assets/previews/leaderboard_blue.png', '{"colors": ["#2563eb", "#ffffff"], "style": "modern"}'),
('Rectangle Banner - Gradient', 'banner', 'display', '300x250', '/assets/banners/rectangle_gradient.png', '/assets/previews/rectangle_gradient.png', '{"colors": ["#3b82f6", "#8b5cf6"], "style": "gradient"}'),
('Primary CTA Button', 'button', 'cta', '200x50', '/assets/buttons/primary_cta.png', '/assets/previews/primary_cta.png', '{"variant": "primary", "text": "Get Started"}'),
('Welcome Email Template', 'email_template', 'email', '', '/assets/emails/welcome.html', '/assets/previews/welcome_email.png', '{"subject": "Welcome to Backlink ∞", "type": "transactional"}'),
('Instagram Square Post', 'social_post', 'social', '1080x1080', '/assets/social/instagram_square.png', '/assets/previews/instagram_square.png', '{"platform": "instagram", "format": "square"}')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 15. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_composite ON public.affiliate_referrals(affiliate_id, conversion_status, clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_composite ON public.affiliate_commissions(affiliate_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_composite ON public.affiliate_clicks(affiliate_id, clicked_at);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_active ON public.affiliate_profiles(affiliate_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_pending ON public.affiliate_commissions(affiliate_id, amount) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_converted ON public.affiliate_referrals(affiliate_id, commission_earned) WHERE conversion_status = 'converted';

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a summary view for quick affiliate stats
CREATE OR REPLACE VIEW affiliate_stats_summary AS
SELECT 
    ap.affiliate_id,
    ap.status,
    ap.tier,
    ap.commission_rate,
    ap.total_earnings,
    ap.total_conversions,
    ap.total_referrals,
    COUNT(DISTINCT ar.id) as total_clicks,
    COUNT(DISTINCT ac.id) as total_commissions,
    COALESCE(SUM(ac.amount) FILTER (WHERE ac.status = 'pending'), 0) as pending_commissions,
    COALESCE(SUM(ac.amount) FILTER (WHERE ac.status = 'paid'), 0) as paid_commissions,
    CASE 
        WHEN COUNT(DISTINCT ar.id) > 0 
        THEN (COUNT(DISTINCT ar.id) FILTER (WHERE ar.conversion_status = 'converted')::DECIMAL / COUNT(DISTINCT ar.id) * 100)
        ELSE 0 
    END as conversion_rate
FROM public.affiliate_profiles ap
LEFT JOIN public.affiliate_referrals ar ON ap.affiliate_id = ar.affiliate_id
LEFT JOIN public.affiliate_commissions ac ON ap.affiliate_id = ac.affiliate_id
GROUP BY ap.affiliate_id, ap.status, ap.tier, ap.commission_rate, ap.total_earnings, ap.total_conversions, ap.total_referrals;

-- Success message
SELECT 
    '🎉 Affiliate Program Database Setup Complete!' as status,
    'All tables, indexes, policies, and functions have been created' as details,
    'The affiliate program is now ready for use' as next_step;
