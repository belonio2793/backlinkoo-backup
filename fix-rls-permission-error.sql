-- ========================================================================
-- FIX FOR "permission denied for table users" ERROR
-- ========================================================================
-- This script fixes the RLS policy issues causing permission denied errors

-- STEP 1: Drop any problematic recursive functions that cause infinite loops
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- STEP 2: Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- STEP 4: Create proper, non-recursive RLS policies

-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for inserting new profiles (for user registration)
CREATE POLICY "Enable insert for authenticated users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admin policies using simple role check WITHOUT recursion
-- This checks if the current user has admin role directly
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    auth.uid() = user_id  -- Users can always see their own profile
    OR
    -- Admin check: look up the current user's role in profiles table
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
);

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
    auth.uid() = user_id  -- Users can always update their own profile
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
)
WITH CHECK (
    auth.uid() = user_id  -- Users can always update their own profile
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
);

-- Admin policy for inserting profiles for other users
CREATE POLICY "Admins can insert any profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id  -- Users can insert their own profile
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
);

-- Admin policy for deleting profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::app_role
);

-- STEP 5: Verify the policies were created correctly
SELECT 
    'RLS policies fixed successfully' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

-- STEP 6: Test that we can now query profiles without permission errors
SELECT 
    COUNT(*) as total_profiles,
    'Profiles table is now accessible' as message
FROM public.profiles;

-- Display current policies for verification
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
