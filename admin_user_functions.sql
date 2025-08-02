-- Admin functions for user management that bypass RLS restrictions
-- These functions should be created with SECURITY DEFINER to run with elevated privileges

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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_all_premium_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_premium_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_premium_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_premium_analytics() TO authenticated;

-- Add comments
COMMENT ON FUNCTION admin_get_all_premium_subscriptions() IS 'Admin function to get all premium subscriptions bypassing RLS';
COMMENT ON FUNCTION admin_grant_premium_access(UUID, TEXT) IS 'Admin function to grant premium access to any user';
COMMENT ON FUNCTION admin_revoke_premium_access(UUID) IS 'Admin function to revoke premium access from any user';
COMMENT ON FUNCTION get_premium_analytics() IS 'Admin function to get premium subscription analytics';
