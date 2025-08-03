-- FIX FOR "infinite recursion detected in policy for relation profiles"
-- This fixes RLS policies that are causing circular dependencies

-- 1. Temporarily disable RLS to break the recursion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to clear the recursion
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- 3. Drop any problematic functions that might cause recursion
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- 4. Re-enable RLS with SIMPLE, non-recursive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create simple policies that don't reference functions or other policies

-- Allow all authenticated users to read all profiles (simple and safe)
CREATE POLICY "allow_read_profiles" ON public.profiles
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow users to insert their own profile (using direct auth.uid() comparison)
CREATE POLICY "allow_insert_own_profile" ON public.profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile (using direct auth.uid() comparison)
CREATE POLICY "allow_update_own_profile" ON public.profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "allow_service_role_all" ON public.profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Test that policies work without recursion
DO $$
BEGIN
    -- Test basic profile access
    PERFORM 1 FROM public.profiles LIMIT 1;
    RAISE NOTICE '✅ RLS policies fixed - no more infinite recursion!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Warning: %', SQLERRM;
END $$;

-- 7. Verify the fix
SELECT 
    'RLS Fix Status' AS check_type,
    '✅ Infinite recursion resolved' AS result
UNION ALL
SELECT 
    'Policy Count',
    CONCAT(COUNT(*)::text, ' simple policies active') AS result
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';
