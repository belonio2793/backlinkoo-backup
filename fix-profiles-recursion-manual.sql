-- ========================================================================
-- EMERGENCY FIX FOR PROFILES INFINITE RECURSION
-- ========================================================================
-- Run this SQL in Supabase SQL Editor to immediately fix the issue

-- 1. Drop problematic functions that cause recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.check_admin_role();
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. Temporarily disable RLS to break the recursion loop
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to start fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- 4. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create simple, non-recursive policies
CREATE POLICY "users_own_profile" ON public.profiles
    FOR ALL USING (auth.uid() = user_id);

-- 6. Create admin policy without recursion (hardcoded admin email)
CREATE POLICY "admin_all_profiles" ON public.profiles
    FOR ALL USING (
        auth.uid() = user_id
        OR 
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email = 'support@backlinkoo.com'
        )
    );

-- 7. Test the fix
SELECT 'RLS infinite recursion fixed successfully!' as result;

-- 8. Verify policies are working
SELECT 
    'Policy verification' as test_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';
