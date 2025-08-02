-- Create RPC function to allow admin access to all user profiles
-- This bypasses RLS policies for admin users to manage the system

CREATE OR REPLACE FUNCTION get_all_user_profiles()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    email TEXT,
    display_name TEXT,
    role app_role,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;

    -- Return all user profiles for admin users
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.email,
        p.display_name,
        p.role,
        p.created_at,
        p.updated_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_user_profiles() TO authenticated;

-- Create a simpler function that bypasses RLS entirely for system admins
CREATE OR REPLACE FUNCTION get_profiles_admin_bypass()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    email TEXT,
    display_name TEXT,
    role app_role,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function bypasses RLS entirely
    -- Only use in admin contexts with proper authentication
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.email,
        p.display_name,
        p.role,
        p.created_at,
        p.updated_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION get_profiles_admin_bypass() TO authenticated;

-- Comment on functions
COMMENT ON FUNCTION get_all_user_profiles() IS 'Returns all user profiles for admin users only';
COMMENT ON FUNCTION get_profiles_admin_bypass() IS 'Bypasses RLS to return all profiles - use with caution';
