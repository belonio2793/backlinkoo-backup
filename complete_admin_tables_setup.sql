-- =====================================================
-- COMPLETE ADMIN TABLES AND FUNCTIONS SETUP
-- Execute this entire script in your Supabase SQL Editor
-- =====================================================

-- 1. ENABLE REQUIRED EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREATE PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
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
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CREATE PREMIUM SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'premium' CHECK (plan_type IN ('premium', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    stripe_price_id TEXT,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. CREATE ADMIN ENVIRONMENT VARIABLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_environment_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT NOT NULL UNIQUE,
    encrypted_value TEXT,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'api_keys', 'database', 'email', 'payment', 'ai')),
    is_sensitive BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. CREATE AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. CREATE USER SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. CREATE ADMIN NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    is_read BOOLEAN DEFAULT false,
    read_by UUID REFERENCES auth.users(id),
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. CREATE SYSTEM METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type TEXT DEFAULT 'counter' CHECK (metric_type IN ('counter', 'gauge', 'histogram')),
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Premium subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON public.premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON public.premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_period ON public.premium_subscriptions(current_period_start, current_period_end);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_stripe ON public.premium_subscriptions(stripe_subscription_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- System metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON public.system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON public.system_metrics(timestamp);

-- 10. CREATE TRIGGER FUNCTIONS
-- =====================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, table_name, record_id, old_values)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.admin_audit_log (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.admin_audit_log (user_id, action, table_name, record_id, new_values)
        VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. CREATE TRIGGERS
-- =====================================================
-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at ON public.premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at
    BEFORE UPDATE ON public.premium_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_environment_variables_updated_at ON public.admin_environment_variables;
CREATE TRIGGER update_admin_environment_variables_updated_at
    BEFORE UPDATE ON public.admin_environment_variables
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON public.user_sessions;
CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Audit log triggers
DROP TRIGGER IF EXISTS audit_premium_subscriptions ON public.premium_subscriptions;
CREATE TRIGGER audit_premium_subscriptions
    AFTER INSERT OR UPDATE OR DELETE ON public.premium_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

-- 12. CREATE ADMIN FUNCTIONS
-- =====================================================
-- Function to check if user is premium
CREATE OR REPLACE FUNCTION public.is_premium_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.premium_subscriptions
        WHERE user_id = user_uuid
        AND status = 'active'
        AND current_period_end > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all premium subscriptions (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_all_premium_subscriptions()
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
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
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
    FROM public.premium_subscriptions ps
    ORDER BY ps.created_at DESC;
END;
$$;

-- Function to grant premium access (admin only)
CREATE OR REPLACE FUNCTION public.admin_grant_premium_access(
    target_user_id UUID,
    plan_type TEXT DEFAULT 'premium',
    duration_months INTEGER DEFAULT 12
)
RETURNS public.premium_subscriptions
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
    result public.premium_subscriptions;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Insert or update premium subscription
    INSERT INTO public.premium_subscriptions (
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
        NOW() + (duration_months || ' months')::INTERVAL
    )
    ON CONFLICT (user_id) DO UPDATE SET
        plan_type = EXCLUDED.plan_type,
        status = 'active',
        current_period_start = NOW(),
        current_period_end = NOW() + (duration_months || ' months')::INTERVAL,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$;

-- Function to revoke premium access (admin only)
CREATE OR REPLACE FUNCTION public.admin_revoke_premium_access(target_user_id UUID)
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
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Delete premium subscription
    DELETE FROM public.premium_subscriptions 
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
END;
$$;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS public.profiles
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_role TEXT;
    result public.profiles;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('user', 'admin', 'moderator') THEN
        RAISE EXCEPTION 'Invalid role: %', new_role;
    END IF;
    
    -- Update user role
    UPDATE public.profiles 
    SET role = new_role, updated_at = NOW()
    WHERE user_id = target_user_id
    RETURNING * INTO result;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'User not found: %', target_user_id;
    END IF;
    
    RETURN result;
END;
$$;

-- Function to get user statistics (admin only)
CREATE OR REPLACE FUNCTION public.get_user_statistics()
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
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM auth.users),
        'premiumUsers', (
            SELECT COUNT(*) 
            FROM public.premium_subscriptions 
            WHERE status = 'active' 
            AND current_period_end > NOW()
        ),
        'adminUsers', (
            SELECT COUNT(*) 
            FROM public.profiles 
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
        ),
        'premiumRevenue', (
            SELECT COUNT(*) * 29.99 
            FROM public.premium_subscriptions 
            WHERE status = 'active'
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to make user admin
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
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
    INSERT INTO public.profiles (user_id, email, role)
    VALUES (target_user_id, user_email, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 13. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_environment_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- 14. CREATE RLS POLICIES
-- =====================================================
-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Premium subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.premium_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.premium_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admin environment variables policies
DROP POLICY IF EXISTS "Admin access only" ON public.admin_environment_variables;
CREATE POLICY "Admin access only" ON public.admin_environment_variables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Audit log policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System can insert audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "System can insert audit logs" ON public.admin_audit_log
    FOR INSERT WITH CHECK (true);

-- User sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admin notifications policies
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.admin_notifications;
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System metrics policies
DROP POLICY IF EXISTS "Admins can view metrics" ON public.system_metrics;
CREATE POLICY "Admins can view metrics" ON public.system_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 15. GRANT PERMISSIONS
-- =====================================================
-- Grant table permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.premium_subscriptions TO authenticated;
GRANT ALL ON public.admin_environment_variables TO authenticated;
GRANT ALL ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.admin_notifications TO authenticated;
GRANT ALL ON public.system_metrics TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.is_premium_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_premium_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_premium_access(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_premium_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.make_user_admin(TEXT) TO authenticated;

-- 16. INSERT SAMPLE DATA (Optional)
-- =====================================================
-- Insert sample admin notification
INSERT INTO public.admin_notifications (title, message, type, priority)
VALUES ('System Initialized', 'Admin system has been successfully initialized', 'success', 1)
ON CONFLICT DO NOTHING;

-- Insert sample system metrics
INSERT INTO public.system_metrics (metric_name, metric_value, metric_type, tags)
VALUES 
    ('system_uptime', 0, 'gauge', '{"unit": "seconds"}'),
    ('user_registrations', 0, 'counter', '{"period": "daily"}'),
    ('premium_conversions', 0, 'counter', '{"period": "daily"}')
ON CONFLICT DO NOTHING;

-- 17. ADD TABLE COMMENTS
-- =====================================================
COMMENT ON TABLE public.profiles IS 'Extended user profile information and roles';
COMMENT ON TABLE public.premium_subscriptions IS 'Premium subscription tracking and billing';
COMMENT ON TABLE public.admin_environment_variables IS 'Secure storage for admin environment variables';
COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for admin actions';
COMMENT ON TABLE public.user_sessions IS 'User session tracking and management';
COMMENT ON TABLE public.admin_notifications IS 'Admin system notifications';
COMMENT ON TABLE public.system_metrics IS 'System performance and business metrics';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- IMPORTANT: After running this script, execute these commands:

-- 1. Make yourself an admin (replace with your email):
-- SELECT make_user_admin('your-email@example.com');

-- 2. Test the system:
-- SELECT get_user_statistics();

-- 3. Grant premium to a test user:
-- SELECT admin_grant_premium_access('user-uuid-here', 'premium', 12);

-- The admin dashboard should now be fully functional!
