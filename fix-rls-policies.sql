-- Fix RLS Permission Errors Script
-- Run this in Supabase SQL Editor to resolve "permission denied for table users" errors

-- 1. Drop problematic functions that cause recursion
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- 2. Temporarily disable RLS on profiles to reset policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by users who created them" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- 4. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create simple, non-recursive policies
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Fix campaigns table policies if they exist
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_own" ON public.campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "campaigns_insert_own" ON public.campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_update_own" ON public.campaigns
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_delete_own" ON public.campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Fix user_credits table policies
ALTER TABLE public.user_credits DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can insert their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_select_own" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_credits_insert_own" ON public.user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_credits_update_own" ON public.user_credits
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Create simple admin function if needed (without recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 9. Add admin policies for essential tables
CREATE POLICY "admin_profiles_all" ON public.profiles
    FOR ALL USING (public.is_admin());

CREATE POLICY "admin_campaigns_all" ON public.campaigns
    FOR ALL USING (public.is_admin());

CREATE POLICY "admin_user_credits_all" ON public.user_credits
    FOR ALL USING (public.is_admin());

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_credits TO authenticated;

-- 11. Ensure auth.users is accessible (this is what was causing the original error)
-- Note: This should be handled by Supabase automatically, but let's ensure it
GRANT SELECT (id, email, created_at) ON auth.users TO authenticated;

-- Success message
SELECT 'RLS policies have been reset and simplified. The "permission denied for table users" error should be resolved.' as status;
