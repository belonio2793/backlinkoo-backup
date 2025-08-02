-- ========================================================================
-- EMERGENCY FIX FOR INFINITE RECURSION - TEMPORARILY DISABLE RLS
-- ========================================================================
-- Use this if you need immediate access to your application
-- This completely disables RLS on profiles table to stop the recursion

-- 1. Disable RLS on profiles table to stop infinite recursion immediately
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop the problematic function
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- 3. Test that profiles are now accessible
SELECT 'EMERGENCY FIX APPLIED - RLS DISABLED' as status;

-- Verify we can now query profiles without recursion
SELECT 
    COUNT(*) as profile_count,
    'Profiles table is now accessible' as message
FROM public.profiles;

-- ========================================================================
-- IMPORTANT: After running this emergency fix:
-- 1. Your app should work again immediately
-- 2. Run the full fix in fix_infinite_recursion_profiles.sql when ready
-- 3. That will re-enable RLS with proper, non-recursive policies
-- ========================================================================
