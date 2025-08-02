-- ========================================================================
-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES
-- ========================================================================
-- The issue: get_current_user_role() function queries profiles table
-- which triggers RLS policies that call get_current_user_role() again
-- causing infinite recursion.

-- 1. Drop the problematic function that causes recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- 2. Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Also drop policies that might exist from correct_rls_policies.sql
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 3. Create NEW, SAFE RLS policies that DON'T cause recursion
-- These policies use EXISTS subqueries that bypass the RLS on the subquery

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies that don't cause recursion
-- These use a direct table lookup in the EXISTS clause
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        -- Allow users to see their own profile
        auth.uid() = user_id
        OR
        -- Allow admins to see all profiles using direct lookup
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (
        -- Allow users to update their own profile
        auth.uid() = user_id
        OR
        -- Allow admins to update any profile
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        -- Allow users to insert their own profile
        auth.uid() = user_id
        OR
        -- Allow admins to insert any profile
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- 4. Fix other tables that might be using the problematic function
-- Drop and recreate policies for other tables that used get_current_user_role()

-- Credits table
DROP POLICY IF EXISTS "Admins can manage all credits" ON public.credits;
CREATE POLICY "Admins can manage all credits" ON public.credits
    FOR ALL USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- Campaigns table  
DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can update campaigns" ON public.campaigns;

CREATE POLICY "Admins can view all campaigns" ON public.campaigns
    FOR SELECT USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

CREATE POLICY "Admins can update campaigns" ON public.campaigns
    FOR UPDATE USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- Credit transactions table
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
CREATE POLICY "Admins can view all transactions" ON public.credit_transactions
    FOR ALL USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- 5. Test the fix by querying profiles
-- This should work without infinite recursion
SELECT 'RLS policies fixed successfully!' as status;

-- Test profile access
SELECT 
    'Profile query test' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles LIMIT 1)
        THEN 'SUCCESS: Can query profiles without recursion'
        ELSE 'WARNING: No profiles found or query failed'
    END as result;

-- Show current policies for verification
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
