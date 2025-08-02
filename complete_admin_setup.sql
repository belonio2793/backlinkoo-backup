-- =====================================================
-- COMPLETE ADMIN SYSTEM SETUP FOR SUPABASE
-- Execute these commands in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE PREMIUM SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS premium_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_type TEXT NOT NULL DEFAULT 'premium',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_period ON premium_subscriptions(current_period_start, current_period_end);

-- Enable RLS
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. CREATE PROFILES TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT,
    full_name TEXT,
    display_name TEXT,
    bio TEXT,
    company TEXT,
    website TEXT,
    location TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    marketing_emails BOOLEAN DEFAULT true,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at ON premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at
    BEFORE UPDATE ON premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. CREATE PREMIUM STATUS CHECK FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION is_premium_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM premium_subscriptions
        WHERE user_id = user_uuid
        AND status = 'active'
        AND current_period_end > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE ADMIN FUNCTIONS FOR USER MANAGEMENT
-- =====================================================

-- Function to get all premium subscriptions for admin use
CREATE OR REPLACE FUNCTION admin_get_all_premium_subscriptions()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    plan_type TEXT,
    status TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    -- Also check user metadata for admin role
    IF current_user_role != 'admin' AND 
       COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', '') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Return all premium subscriptions
    RETURN QUERY
    SELECT 
        ps.id,
        ps.user_id,
        ps.plan_type,
        ps.status,
        ps.current_period_start,
        ps.current_period_end,
        ps.stripe_subscription_id,
        ps.stripe_customer_id,
        ps.created_at,
        ps.updated_at
    FROM premium_subscriptions ps
    ORDER BY ps.created_at DESC;
END;
$$;

-- Function to grant premium access (admin only)
CREATE OR REPLACE FUNCTION admin_grant_premium_access(
    target_user_id UUID,
    plan_type TEXT DEFAULT 'premium'
)
RETURNS premium_subscriptions
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
    result premium_subscriptions;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' AND 
       COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', '') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Insert or update premium subscription
    INSERT INTO premium_subscriptions (
        user_id,
        plan_type,
        status,
        current_period_start,
        current_period_end
    ) VALUES (
        target_user_id,
        plan_type,
        'active',
        NOW(),
        NOW() + INTERVAL '1 year'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        plan_type = EXCLUDED.plan_type,
        status = 'active',
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 year',
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$;

-- Function to revoke premium access (admin only)
CREATE OR REPLACE FUNCTION admin_revoke_premium_access(target_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' AND 
       COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', '') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Delete premium subscription
    DELETE FROM premium_subscriptions 
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
END;
$$;

-- Function to get premium analytics (admin only)
CREATE OR REPLACE FUNCTION get_premium_analytics()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
    result JSON;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' AND 
       COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', '') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get analytics data
    SELECT json_build_object(
        'totalPremiumUsers', (
            SELECT COUNT(*) 
            FROM premium_subscriptions 
            WHERE status = 'active' 
            AND current_period_end > NOW()
        ),
        'totalUsers', (
            SELECT COUNT(*) 
            FROM auth.users
        ),
        'averageSubscriptionDays', (
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (current_period_end - current_period_start)) / 86400), 0)::int
            FROM premium_subscriptions 
            WHERE status = 'active'
        ),
        'subscriptionsThisMonth', (
            SELECT COUNT(*) 
            FROM premium_subscriptions 
            WHERE created_at >= date_trunc('month', NOW())
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to get all users with profiles (admin only)
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    profile_data JSON
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' AND 
       COALESCE((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role', '') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.email_confirmed_at,
        u.created_at,
        u.updated_at,
        u.last_sign_in_at,
        json_build_object(
            'full_name', p.full_name,
            'role', p.role,
            'company', p.company,
            'location', p.location
        ) as profile_data
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.user_id
    ORDER BY u.created_at DESC;
END;
$$;

-- 6. CREATE RLS POLICIES
-- =====================================================

-- Policies for premium_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON premium_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON premium_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policy for premium subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON premium_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON premium_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policy for profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 7. SET UP PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_all_premium_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_premium_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_premium_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_premium_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION is_premium_user(UUID) TO authenticated;

-- Grant table permissions
GRANT ALL ON premium_subscriptions TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- 8. CREATE ADMIN USER FUNCTION (Set yourself as admin)
-- =====================================================
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Create or update profile with admin role
    INSERT INTO profiles (user_id, email, role)
    VALUES (target_user_id, user_email, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 9. GRANT YOURSELF ADMIN ACCESS
-- =====================================================
-- Replace 'your-email@example.com' with your actual email
-- SELECT make_user_admin('your-email@example.com');

-- 10. CREATE SAMPLE PREMIUM USER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION create_sample_premium_user(user_email TEXT)
RETURNS premium_subscriptions
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_user_id UUID;
    result premium_subscriptions;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Create premium subscription
    INSERT INTO premium_subscriptions (
        user_id,
        plan_type,
        status,
        current_period_start,
        current_period_end
    ) VALUES (
        target_user_id,
        'premium',
        'active',
        NOW(),
        NOW() + INTERVAL '1 year'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'active',
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '1 year',
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$;

-- 11. UTILITY FUNCTIONS FOR ADMIN DASHBOARD
-- =====================================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
    result JSON;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM auth.users),
        'premiumUsers', (
            SELECT COUNT(*) 
            FROM premium_subscriptions 
            WHERE status = 'active' 
            AND current_period_end > NOW()
        ),
        'adminUsers', (
            SELECT COUNT(*) 
            FROM profiles 
            WHERE role = 'admin'
        ),
        'activeUsers', (
            SELECT COUNT(*) 
            FROM auth.users 
            WHERE last_sign_in_at > NOW() - INTERVAL '30 days'
        ),
        'usersThisMonth', (
            SELECT COUNT(*) 
            FROM auth.users 
            WHERE created_at >= date_trunc('month', NOW())
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION make_user_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_sample_premium_user(TEXT) TO authenticated;

-- 12. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE premium_subscriptions IS 'Tracks user premium subscriptions and billing information';
COMMENT ON TABLE profiles IS 'Extended user profile information including roles';
COMMENT ON FUNCTION admin_get_all_premium_subscriptions() IS 'Admin function to get all premium subscriptions bypassing RLS';
COMMENT ON FUNCTION admin_grant_premium_access(UUID, TEXT) IS 'Admin function to grant premium access to any user';
COMMENT ON FUNCTION admin_revoke_premium_access(UUID) IS 'Admin function to revoke premium access from any user';
COMMENT ON FUNCTION get_premium_analytics() IS 'Admin function to get premium subscription analytics';
COMMENT ON FUNCTION make_user_admin(TEXT) IS 'Function to grant admin role to a user by email';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- To use these functions:
-- 1. First make yourself admin: SELECT make_user_admin('your-email@example.com');
-- 2. Create a test premium user: SELECT create_sample_premium_user('test-user@example.com');
-- 3. Get analytics: SELECT get_premium_analytics();
-- 4. Get user stats: SELECT get_user_statistics();
-- 5. Grant premium to user: SELECT admin_grant_premium_access('user-uuid-here');
-- 6. Revoke premium from user: SELECT admin_revoke_premium_access('user-uuid-here');
