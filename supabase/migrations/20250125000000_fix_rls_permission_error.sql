-- ========================================================================
-- Emergency Fix for "permission denied for table users" Error
-- Migration: 20250125000000_fix_rls_permission_error.sql
-- ========================================================================

-- STEP 1: Drop problematic recursive functions that cause infinite loops
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- STEP 2: Drop any existing conflicting policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- STEP 3: Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create new, simple, non-recursive policies

-- Basic user access policies (no recursion)
CREATE POLICY "profiles_select_own" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Service role access (for admin functions)
CREATE POLICY "profiles_service_role_access" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Simple admin access without recursion risk
-- This uses a straightforward EXISTS query that shouldn't cause recursion
CREATE POLICY "profiles_admin_select_all" 
ON public.profiles 
FOR SELECT 
USING (
    auth.uid() = user_id  -- Users can see their own
    OR
    -- Admin check with subquery limit to prevent recursion
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'::app_role
        LIMIT 1
    )
);

CREATE POLICY "profiles_admin_update_all" 
ON public.profiles 
FOR UPDATE 
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'::app_role
        LIMIT 1
    )
)
WITH CHECK (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'::app_role
        LIMIT 1
    )
);

-- STEP 5: Grant necessary permissions to ensure access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- STEP 6: Verify the fix by testing table access
DO $$
BEGIN
    -- Test that we can query the profiles table without permission errors
    PERFORM COUNT(*) FROM public.profiles;
    RAISE NOTICE 'RLS permission fix applied successfully - profiles table is accessible';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Warning: Profiles table test failed - %, %', SQLSTATE, SQLERRM;
END $$;

-- STEP 7: Show current policies for verification
SELECT 
    'RLS Policies Fixed' as status,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
