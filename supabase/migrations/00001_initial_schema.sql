-- Initial schema migration
-- This represents the current state of your database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE user_role_type AS ENUM ('admin', 'moderator', 'user');

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    links_requested INTEGER NOT NULL,
    links_delivered INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    completed_backlinks TEXT[],
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    campaign_id UUID REFERENCES campaigns(id),
    order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    amount INTEGER DEFAULT 0,
    total_purchased INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global campaign ledger
CREATE TABLE IF NOT EXISTS global_campaign_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    campaign_name TEXT NOT NULL,
    keywords_count INTEGER NOT NULL,
    backlinks_delivered INTEGER NOT NULL,
    keyword_difficulty_avg DECIMAL,
    user_location_country TEXT NOT NULL,
    user_location_country_code TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    product_name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    user_id UUID,
    guest_checkout BOOLEAN DEFAULT FALSE,
    stripe_session_id TEXT,
    paypal_order_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (main user profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT,
    role app_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ranking results
CREATE TABLE IF NOT EXISTS ranking_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id UUID NOT NULL,
    search_engine TEXT NOT NULL,
    position INTEGER,
    found BOOLEAN DEFAULT FALSE,
    total_results INTEGER,
    backlinks_count INTEGER,
    serp_features JSONB,
    competitor_analysis JSONB,
    error_details JSONB,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ranking targets
CREATE TABLE IF NOT EXISTS ranking_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    keyword TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    resource TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    user_id UUID,
    subscribed BOOLEAN DEFAULT TRUE,
    subscription_tier TEXT,
    payment_method TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_end TIMESTAMPTZ,
    guest_checkout BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role user_role_type DEFAULT 'user',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_ranking_results_target_id ON ranking_results(target_id);
CREATE INDEX IF NOT EXISTS idx_ranking_targets_user_id ON ranking_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create RLS (Row Level Security) policies if needed
-- These can be added later based on security requirements

-- Create views
CREATE OR REPLACE VIEW ranking_dashboard AS
SELECT 
    rt.id as target_id,
    rt.user_id,
    rt.name,
    rt.url,
    rt.domain,
    rt.keyword,
    rt.is_active,
    rt.created_at as target_created_at,
    rt.updated_at as target_updated_at,
    
    -- Google results
    rr_google.position as google_position,
    rr_google.found as google_found,
    rr_google.backlinks_count as google_backlinks,
    rr_google.checked_at as google_checked_at,
    
    -- Calculated fields
    CASE
        WHEN rr_google.position IS NOT NULL
        THEN rr_google.position::DECIMAL
        ELSE NULL
    END as average_position,
    
    LEAST(
        COALESCE(rr_google.position, 999),
        COALESCE(rr_bing.position, 999),
        COALESCE(rr_yahoo.position, 999)
    ) as best_position

FROM ranking_targets rt
LEFT JOIN LATERAL (
    SELECT position, found, backlinks_count, checked_at
    FROM ranking_results rr
    WHERE rr.target_id = rt.id AND rr.search_engine = 'google'
    ORDER BY checked_at DESC
    LIMIT 1
) rr_google ON true
;

-- Create functions for user role management
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role app_role;
BEGIN
    SELECT role INTO user_role
    FROM profiles
    WHERE user_id = auth.uid();
    
    RETURN COALESCE(user_role, 'user'::app_role);
END;
$$;

CREATE OR REPLACE FUNCTION get_user_role(check_user_id UUID DEFAULT NULL)
RETURNS user_role_type
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    user_role user_role_type;
BEGIN
    target_user_id := COALESCE(check_user_id, auth.uid());
    
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = target_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'user'::user_role_type);
END;
$$;

CREATE OR REPLACE FUNCTION assign_user_role(target_user_id UUID, new_role user_role_type)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only admins can assign roles
    IF get_user_role() != 'admin' THEN
        RETURN FALSE;
    END IF;
    
    INSERT INTO user_roles (user_id, role, created_by)
    VALUES (target_user_id, new_role, auth.uid());
    
    RETURN TRUE;
END;
$$;
