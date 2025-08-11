-- ========================================================================
-- DIAGNOSTIC: Identify exact permission issues without changing anything
-- ========================================================================
-- This script only READS and REPORTS - makes NO CHANGES

-- Test 1: Check if we can read profiles table
SELECT 'TEST 1: Basic profile access' as test;
DO $$
BEGIN
    PERFORM COUNT(*) FROM public.profiles LIMIT 1;
    RAISE NOTICE 'Profile table access: SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Profile table access: FAILED - %', SQLERRM;
END $$;

-- Test 2: Check for problematic recursive functions
SELECT 'TEST 2: Checking for recursive functions' as test;
SELECT 
    'Function found: ' || proname as function_name,
    'Definition contains recursion: ' || CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%' || proname || '%' THEN 'YES - PROBLEM'
        ELSE 'NO - OK'
    END as recursion_check
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname LIKE '%user_role%';

-- Test 3: Check current RLS policies
SELECT 'TEST 3: Current RLS policies' as test;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test 4: Check table permissions
SELECT 'TEST 4: Table permissions for authenticated role' as test;
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'profiles' 
AND grantee = 'authenticated';

-- Test 5: Try a simple campaign status update (simulation)
SELECT 'TEST 5: Campaign table access test' as test;
DO $$
BEGIN
    -- Just test if we can read the campaigns table
    PERFORM COUNT(*) FROM automation_campaigns LIMIT 1;
    RAISE NOTICE 'Automation campaigns access: SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Automation campaigns access: FAILED - %', SQLERRM;
END $$;

SELECT 'DIAGNOSTIC COMPLETE - Check the output above for specific issues' as result;
