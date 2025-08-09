-- REVERT RECENT DATABASE CHANGES
-- This script reverts the major database changes made in recent sessions
-- =============================================================================

-- STEP 1: REVERT AFFILIATE PROGRAM TABLES
-- =============================================================================
-- Drop all affiliate-related tables in correct order (respecting foreign keys)

DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;
DROP TABLE IF EXISTS public.affiliate_commissions CASCADE;
DROP TABLE IF EXISTS public.affiliate_referrals CASCADE;
DROP TABLE IF EXISTS public.affiliate_profiles CASCADE;
DROP TABLE IF EXISTS public.affiliate_settings CASCADE;

-- Drop affiliate-related functions
DROP FUNCTION IF EXISTS public.generate_affiliate_id() CASCADE;
DROP FUNCTION IF EXISTS public.set_affiliate_id() CASCADE;

-- Drop affiliate-related views
DROP VIEW IF EXISTS public.affiliate_dashboard_stats CASCADE;

-- STEP 2: REVERT ADMIN USER CHANGES
-- =============================================================================
-- Remove the admin user that was created
DELETE FROM public.profiles WHERE email = 'support@backlinkoo.com';
DELETE FROM auth.users WHERE email = 'support@backlinkoo.com';

-- STEP 3: REVERT RLS POLICY CHANGES
-- =============================================================================
-- Re-enable RLS on profiles table (if it was disabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove any problematic policies that might have been added
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;

-- Restore basic RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- STEP 4: REVERT BLOG POSTS SECURITY CHANGES
-- =============================================================================
-- Re-enable RLS on blog_posts if it was disabled
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow public insert access" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON public.blog_posts;

-- Restore secure blog_posts policies
CREATE POLICY "Users can view published blog posts" 
ON public.blog_posts FOR SELECT 
USING (published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own blog posts" 
ON public.blog_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog posts" 
ON public.blog_posts FOR UPDATE 
USING (auth.uid() = user_id);

-- STEP 5: REMOVE PROBLEMATIC FUNCTIONS
-- =============================================================================
-- Remove any functions that cause infinite recursion
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile() CASCADE;

-- STEP 6: CLEAN UP PERMISSIONS
-- =============================================================================
-- Revoke excessive permissions that might have been granted
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

-- Restore minimal necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- STEP 7: RESET SEQUENCES AND INDEXES
-- =============================================================================
-- Remove any affiliate-related indexes that might remain
DROP INDEX IF EXISTS idx_affiliate_profiles_affiliate_id;
DROP INDEX IF EXISTS idx_affiliate_profiles_user_id;
DROP INDEX IF EXISTS idx_affiliate_profiles_status;
DROP INDEX IF EXISTS idx_affiliate_referrals_affiliate_id;
DROP INDEX IF EXISTS idx_affiliate_referrals_referral_code;
DROP INDEX IF EXISTS idx_affiliate_referrals_status;
DROP INDEX IF EXISTS idx_affiliate_commissions_affiliate_id;
DROP INDEX IF EXISTS idx_affiliate_commissions_status;
DROP INDEX IF EXISTS idx_affiliate_clicks_affiliate_id;
DROP INDEX IF EXISTS idx_affiliate_clicks_clicked_at;

-- STEP 8: REMOVE TRIGGERS
-- =============================================================================
-- Remove affiliate-related triggers
DROP TRIGGER IF EXISTS trigger_set_affiliate_id ON public.affiliate_profiles;

-- COMPLETION MESSAGE
-- =============================================================================
SELECT 'Database revert completed successfully! Affiliate tables, admin users, and problematic policies have been removed.' AS status;
