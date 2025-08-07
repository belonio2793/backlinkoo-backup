-- Enhanced Affiliate System Database Schema
-- Comprehensive affiliate program with user-linked tracking, commission engine, and analytics

-- ==================== AFFILIATE PROFILES ====================
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  affiliate_id varchar(20) UNIQUE NOT NULL, -- e.g., "BL001234ABC"
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  tier varchar(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  commission_rate decimal(5,4) DEFAULT 0.2000, -- 20% default
  special_rate decimal(5,4), -- For special partners
  
  -- Tracking & Performance
  total_earnings decimal(12,2) DEFAULT 0,
  total_referrals integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  lifetime_value decimal(12,2) DEFAULT 0,
  avg_conversion_rate decimal(5,4) DEFAULT 0,
  
  -- Profile Information
  first_name varchar(100),
  last_name varchar(100),
  email varchar(255),
  phone varchar(20),
  company varchar(255),
  website varchar(255),
  
  -- Address & Payment
  address_line1 varchar(255),
  address_line2 varchar(255),
  city varchar(100),
  state varchar(100),
  postal_code varchar(20),
  country varchar(100),
  
  -- Payment Preferences
  payment_method varchar(50) DEFAULT 'paypal' CHECK (payment_method IN ('paypal', 'bank', 'crypto', 'stripe')),
  payment_details jsonb, -- PayPal email, bank info, crypto wallet, etc.
  payment_threshold decimal(8,2) DEFAULT 50.00,
  
  -- Marketing Information
  marketing_channels text[], -- ['social', 'email', 'blog', 'youtube', 'paid-ads']
  audience_size integer,
  primary_niche varchar(100),
  experience_level varchar(20) DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Application Data
  application_notes text,
  how_heard varchar(100),
  marketing_strategy text,
  
  -- System Fields
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==================== COMMISSION TIERS ====================
CREATE TABLE IF NOT EXISTS commission_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name varchar(20) UNIQUE NOT NULL,
  min_referrals integer DEFAULT 0,
  min_revenue decimal(12,2) DEFAULT 0,
  commission_rate decimal(5,4) NOT NULL,
  tier_order integer NOT NULL,
  benefits jsonb, -- Additional benefits like bonus credits, etc.
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default tiers
INSERT INTO commission_tiers (tier_name, min_referrals, min_revenue, commission_rate, tier_order, benefits) VALUES
  ('bronze', 0, 0, 0.2000, 1, '{"description": "Starting tier", "perks": ["Basic marketing materials", "Email support"]}'),
  ('silver', 10, 1000, 0.2500, 2, '{"description": "Growing affiliate", "perks": ["Premium banners", "Priority support", "Monthly bonuses"]}'),
  ('gold', 25, 5000, 0.3000, 3, '{"description": "Successful affiliate", "perks": ["Custom materials", "Phone support", "Quarterly bonuses"]}'),
  ('platinum', 50, 15000, 0.3500, 4, '{"description": "Top performer", "perks": ["Personal manager", "Custom landing pages", "Special rates"]}'),
  ('diamond', 100, 50000, 0.4000, 5, '{"description": "Elite affiliate", "perks": ["White-label options", "Revenue sharing", "Conference invites"]}}')
ON CONFLICT (tier_name) DO NOTHING;

-- ==================== REFERRAL TRACKING ====================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id varchar(20) NOT NULL REFERENCES affiliate_profiles(affiliate_id),
  
  -- Tracking Data
  tracking_id varchar(50) NOT NULL, -- Unique per click
  ip_address inet,
  user_agent text,
  referrer_url text,
  landing_page varchar(500),
  
  -- UTM Parameters
  utm_source varchar(100),
  utm_medium varchar(100),
  utm_campaign varchar(100),
  utm_term varchar(100),
  utm_content varchar(100),
  
  -- Device & Location
  device_type varchar(20), -- mobile, desktop, tablet
  device_info jsonb,
  location_data jsonb, -- country, region, city from IP
  
  -- Session Tracking
  session_id varchar(100),
  fingerprint varchar(100), -- Browser fingerprint
  
  created_at timestamp with time zone DEFAULT now()
);

-- ==================== CONVERSIONS ====================
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id varchar(20) NOT NULL REFERENCES affiliate_profiles(affiliate_id),
  click_id uuid REFERENCES affiliate_clicks(id),
  
  -- User & Order Information
  converted_user_id uuid REFERENCES auth.users(id),
  order_id varchar(100),
  subscription_id varchar(100),
  
  -- Financial Data
  order_value decimal(12,2) NOT NULL,
  commission_rate decimal(5,4) NOT NULL,
  commission_amount decimal(12,2) NOT NULL,
  
  -- Conversion Details
  conversion_type varchar(50), -- signup, purchase, subscription, etc.
  product_id varchar(100),
  plan_type varchar(100),
  
  -- Attribution
  attribution_type varchar(20) DEFAULT 'first_click' CHECK (attribution_type IN ('first_click', 'last_click', 'linear')),
  time_to_conversion interval,
  
  -- Processing Status
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed', 'rejected')),
  processed_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now()
);

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS affiliate_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id varchar(20) NOT NULL REFERENCES affiliate_profiles(affiliate_id),
  
  -- Payment Details
  amount decimal(12,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  payment_method varchar(50) NOT NULL,
  payment_reference varchar(255), -- PayPal transaction ID, bank reference, etc.
  
  -- Period Covered
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Status
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processed_at timestamp with time zone,
  payment_details jsonb, -- Additional payment information
  
  -- Accounting
  conversion_ids uuid[], -- Array of conversion IDs included in this payment
  notes text,
  
  created_at timestamp with time zone DEFAULT now()
);

-- ==================== MARKETING ASSETS ====================
CREATE TABLE IF NOT EXISTS affiliate_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Asset Information
  name varchar(200) NOT NULL,
  description text,
  asset_type varchar(50) NOT NULL, -- banner, email, video, social, etc.
  category varchar(100),
  
  -- File Details
  file_url varchar(500) NOT NULL,
  file_size integer,
  dimensions varchar(20), -- e.g., "728x90", "1080x1080"
  file_format varchar(10), -- jpg, png, gif, mp4, html, etc.
  
  -- Tracking
  download_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  
  -- Metadata
  tags text[],
  tier_requirement varchar(20), -- minimum tier to access
  is_featured boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==================== CAMPAIGNS ====================
CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id varchar(20) NOT NULL REFERENCES affiliate_profiles(affiliate_id),
  
  -- Campaign Details
  name varchar(200) NOT NULL,
  description text,
  campaign_type varchar(50), -- email, social, paid-ads, content, etc.
  
  -- Tracking
  campaign_code varchar(50) UNIQUE,
  total_clicks integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  total_revenue decimal(12,2) DEFAULT 0,
  
  -- Status
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  start_date date,
  end_date date,
  
  -- Configuration
  landing_page varchar(500),
  custom_utm_params jsonb,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==================== LEADERBOARD & GAMIFICATION ====================
CREATE TABLE IF NOT EXISTS affiliate_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id varchar(20) NOT NULL REFERENCES affiliate_profiles(affiliate_id),
  
  -- Achievement Details
  achievement_type varchar(50) NOT NULL, -- first_sale, top_performer, milestone, etc.
  achievement_name varchar(200) NOT NULL,
  description text,
  
  -- Rewards
  badge_icon varchar(100),
  badge_color varchar(7), -- hex color
  reward_amount decimal(8,2), -- bonus payment if applicable
  reward_credits integer, -- platform credits
  
  -- Tracking
  earned_at timestamp with time zone DEFAULT now(),
  is_public boolean DEFAULT true -- show on public leaderboard
);

-- ==================== ANALYTICS TRACKING ====================
CREATE TABLE IF NOT EXISTS affiliate_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id varchar(20) NOT NULL REFERENCES affiliate_profiles(affiliate_id),
  
  -- Time Period
  date date NOT NULL,
  hour integer CHECK (hour >= 0 AND hour <= 23),
  
  -- Metrics
  clicks integer DEFAULT 0,
  unique_clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue decimal(10,2) DEFAULT 0,
  commission decimal(10,2) DEFAULT 0,
  
  -- Additional Data
  top_sources jsonb, -- Top referrer sources for the period
  device_breakdown jsonb, -- mobile vs desktop stats
  geo_data jsonb, -- geographic breakdown
  
  created_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(affiliate_id, date, hour)
);

-- ==================== ADMIN CONFIGURATION ====================
CREATE TABLE IF NOT EXISTS affiliate_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key varchar(100) UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default configuration
INSERT INTO affiliate_config (config_key, config_value, description) VALUES
  ('default_commission_rate', '0.2000', 'Default commission rate for new affiliates'),
  ('payment_threshold', '50.00', 'Minimum amount before payment is processed'),
  ('cookie_duration_days', '30', 'How long affiliate cookies last'),
  ('auto_approve_affiliates', 'false', 'Whether to auto-approve new affiliate applications'),
  ('leaderboard_enabled', 'true', 'Enable public leaderboard display'),
  ('gamification_enabled', 'true', 'Enable badges and achievements')
ON CONFLICT (config_key) DO NOTHING;

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_affiliate_id ON affiliate_profiles(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_status ON affiliate_profiles(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_tier ON affiliate_profiles(tier);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_tracking_id ON affiliate_clicks(tracking_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate_id ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_created_at ON affiliate_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_status ON affiliate_conversions(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_payments_affiliate_id ON affiliate_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_status ON affiliate_payments(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_analytics_affiliate_id_date ON affiliate_analytics(affiliate_id, date);

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_analytics ENABLE ROW LEVEL SECURITY;

-- Affiliates can only see their own data
CREATE POLICY "Affiliates can view own profile" ON affiliate_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can update own profile" ON affiliate_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can view own clicks" ON affiliate_clicks
  FOR SELECT USING (
    affiliate_id IN (
      SELECT affiliate_id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can view own conversions" ON affiliate_conversions
  FOR SELECT USING (
    affiliate_id IN (
      SELECT affiliate_id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can view own payments" ON affiliate_payments
  FOR SELECT USING (
    affiliate_id IN (
      SELECT affiliate_id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can manage own campaigns" ON affiliate_campaigns
  FOR ALL USING (
    affiliate_id IN (
      SELECT affiliate_id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can view own achievements" ON affiliate_achievements
  FOR SELECT USING (
    affiliate_id IN (
      SELECT affiliate_id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can view own analytics" ON affiliate_analytics
  FOR SELECT USING (
    affiliate_id IN (
      SELECT affiliate_id FROM affiliate_profiles WHERE user_id = auth.uid()
    )
  );

-- Public assets can be viewed by all affiliates
CREATE POLICY "All affiliates can view assets" ON affiliate_assets
  FOR SELECT USING (true);

-- Commission tiers are public
CREATE POLICY "All can view commission tiers" ON commission_tiers
  FOR SELECT USING (true);

-- ==================== FUNCTIONS ====================

-- Function to generate unique affiliate ID
CREATE OR REPLACE FUNCTION generate_affiliate_id()
RETURNS varchar(20) AS $$
DECLARE
  new_id varchar(20);
  counter integer := 0;
BEGIN
  LOOP
    -- Generate ID like "BL001234ABC"
    new_id := 'BL' || LPAD((FLOOR(RANDOM() * 999999) + 1)::text, 6, '0') || 
              CHR(65 + FLOOR(RANDOM() * 26)) || 
              CHR(65 + FLOOR(RANDOM() * 26)) || 
              CHR(65 + FLOOR(RANDOM() * 26));
    
    -- Check if ID already exists
    IF NOT EXISTS (SELECT 1 FROM affiliate_profiles WHERE affiliate_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique affiliate ID after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update affiliate tier based on performance
CREATE OR REPLACE FUNCTION update_affiliate_tier(p_affiliate_id varchar(20))
RETURNS void AS $$
DECLARE
  affiliate_record affiliate_profiles%ROWTYPE;
  new_tier varchar(20);
BEGIN
  -- Get current affiliate data
  SELECT * INTO affiliate_record 
  FROM affiliate_profiles 
  WHERE affiliate_id = p_affiliate_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Determine new tier based on performance
  SELECT tier_name INTO new_tier
  FROM commission_tiers
  WHERE affiliate_record.total_referrals >= min_referrals 
    AND affiliate_record.total_earnings >= min_revenue
  ORDER BY tier_order DESC
  LIMIT 1;
  
  -- Update tier if changed
  IF new_tier IS NOT NULL AND new_tier != affiliate_record.tier THEN
    UPDATE affiliate_profiles 
    SET tier = new_tier, 
        commission_rate = (SELECT commission_rate FROM commission_tiers WHERE tier_name = new_tier),
        updated_at = now()
    WHERE affiliate_id = p_affiliate_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate affiliate earnings
CREATE OR REPLACE FUNCTION calculate_affiliate_earnings(p_affiliate_id varchar(20))
RETURNS TABLE(
  total_earnings decimal(12,2),
  pending_earnings decimal(12,2),
  paid_earnings decimal(12,2),
  current_month_earnings decimal(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ac.commission_amount), 0) as total_earnings,
    COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.commission_amount ELSE 0 END), 0) as pending_earnings,
    COALESCE(SUM(CASE WHEN ac.status = 'paid' THEN ac.commission_amount ELSE 0 END), 0) as paid_earnings,
    COALESCE(SUM(CASE WHEN ac.created_at >= date_trunc('month', CURRENT_DATE) THEN ac.commission_amount ELSE 0 END), 0) as current_month_earnings
  FROM affiliate_conversions ac
  WHERE ac.affiliate_id = p_affiliate_id;
END;
$$ LANGUAGE plpgsql;
