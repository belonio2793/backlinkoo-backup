-- ✅ CORRECT RLS policies for your database schema
-- Execute these commands in your Supabase SQL editor

-- Enable RLS on profiles table (this is safe to run)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies first (safe to run even if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- ✅ Policy for users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- ✅ Policy for admins to view all profiles (using profiles.role, not user_roles table)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    -- Check if current user is admin using profiles.role
    EXISTS (
        SELECT 1 FROM public.profiles admin_check 
        WHERE admin_check.user_id = auth.uid() 
        AND admin_check.role = 'admin'::app_role
    )
    OR auth.uid() = user_id  -- Users can always see their own profile
);

-- ✅ Policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ✅ Policy for admins to update any profile (using profiles.role)
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_check 
        WHERE admin_check.user_id = auth.uid() 
        AND admin_check.role = 'admin'::app_role
    )
    OR auth.uid() = user_id  -- Users can always update their own profile
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles admin_check 
        WHERE admin_check.user_id = auth.uid() 
        AND admin_check.role = 'admin'::app_role
    )
    OR auth.uid() = user_id  -- Users can always update their own profile
);

-- ✅ Policy for inserting new profiles (for user registration)
CREATE POLICY "Enable insert for authenticated users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ✅ Policy for admins to insert profiles for other users
CREATE POLICY "Admins can insert any profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles admin_check 
        WHERE admin_check.user_id = auth.uid() 
        AND admin_check.role = 'admin'::app_role
    )
);

-- ✅ Policy for admins to delete profiles (soft delete functionality)
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_check 
        WHERE admin_check.user_id = auth.uid() 
        AND admin_check.role = 'admin'::app_role
    )
);

-- Verify the policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
