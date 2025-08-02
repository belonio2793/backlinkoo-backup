-- Manual SQL script to create RPC functions for admin user management
-- Run this directly in your Supabase SQL editor

-- Create RPC function to allow admin access to all user profiles
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
GRANT EXECUTE ON FUNCTION get_all_user_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION get_profiles_admin_bypass() TO authenticated;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to see all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Create policy to allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Comment on functions
COMMENT ON FUNCTION get_all_user_profiles() IS 'Returns all user profiles for admin users only';
COMMENT ON FUNCTION get_profiles_admin_bypass() IS 'Bypasses RLS to return all profiles - use with caution';
