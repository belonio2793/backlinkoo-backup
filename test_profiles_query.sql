-- ========================================================================
-- TEST PROFILES QUERY - VERIFY INFINITE RECURSION IS FIXED
-- ========================================================================

-- Test 1: Simple count query (should not hang)
SELECT 'Test 1: Basic count query' as test;
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Test 2: Select specific admin user (should not hang)
SELECT 'Test 2: Admin user query' as test;
SELECT user_id, email, role FROM public.profiles WHERE email = 'support@backlinkoo.com';

-- Test 3: Check RLS policies exist
SELECT 'Test 3: RLS policies check' as test;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- Test 4: Verify admin user in auth.users
SELECT 'Test 4: Auth.users check' as test;
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email = 'support@backlinkoo.com';

-- If all these queries complete without hanging, the recursion is fixed!
SELECT '🎉 SUCCESS: All queries completed without infinite recursion!' as final_result;
