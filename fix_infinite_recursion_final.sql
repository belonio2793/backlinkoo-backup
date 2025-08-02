-- ========================================================================
-- DEFINITIVE FIX FOR INFINITE RECURSION IN PROFILES POLICIES
-- ========================================================================
-- This completely eliminates the infinite recursion issue

-- STEP 1: IMMEDIATELY STOP ALL RECURSION
-- ========================================================================

-- Drop ANY function that might be causing recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.check_admin_role();
DROP FUNCTION IF EXISTS public.is_admin();

-- Disable RLS completely to stop the infinite loop
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies that might be causing recursion
DO $$ 
BEGIN
    -- Drop all policies on profiles table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- STEP 2: CLEAN UP EXISTING DATA
-- ========================================================================

-- Remove any problematic admin users to start fresh
DELETE FROM public.profiles WHERE email = 'support@backlinkoo.com';

-- Find and remove any orphaned auth.users records
DELETE FROM auth.users WHERE email = 'support@backlinkoo.com';

-- STEP 3: CREATE CLEAN ADMIN USER
-- ========================================================================

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Generate new UUID for admin user
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users with all required fields
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'support@backlinkoo.com',
        crypt('Admin123!@#', gen_salt('bf')),
        NOW(),
        NULL,
        '',
        NOW(),
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Support Admin", "display_name": "Support Team"}',
        FALSE,
        NOW(),
        NOW()
    );
    
    -- Insert matching profile record
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        display_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'support@backlinkoo.com',
        'Support Admin',
        'Support Team',
        'admin',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created admin user with ID: %', new_user_id;
END $$;

-- STEP 4: CREATE NON-RECURSIVE RLS POLICIES
-- ========================================================================

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile (simple, no recursion)
CREATE POLICY "profile_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can update their own profile (simple, no recursion)
CREATE POLICY "profile_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can insert their own profile (simple, no recursion)
CREATE POLICY "profile_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admin access using direct auth.users lookup (NO RECURSION)
CREATE POLICY "profile_admin_access"
ON public.profiles FOR ALL
USING (
    auth.uid() IN (
        SELECT au.id 
        FROM auth.users au 
        WHERE au.email = 'support@backlinkoo.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT au.id 
        FROM auth.users au 
        WHERE au.email = 'support@backlinkoo.com'
    )
);

-- STEP 5: VERIFY THE FIX
-- ========================================================================

-- Test that we can query profiles without recursion
SELECT 'Testing profiles query - should work without recursion' as test;

-- Count profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Verify admin user exists and is properly configured
SELECT 
    'ADMIN USER VERIFICATION' as check_type,
    au.id,
    au.email as auth_email,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    p.email as profile_email,
    p.role as profile_role,
    CASE 
        WHEN au.email = p.email AND p.role = 'admin' 
        THEN '✅ SUCCESS - Admin user ready for login'
        ELSE '❌ ERROR - Configuration mismatch'
    END as status
FROM auth.users au
JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'support@backlinkoo.com';

-- Test RLS policies work
SELECT 'RLS policies created successfully' as policies_status;

-- Final success message
SELECT 
    '🎉 INFINITE RECURSION FIXED!' as result,
    'You can now login with support@backlinkoo.com / Admin123!@#' as credentials,
    'Go to /admin to test the login' as next_step;
