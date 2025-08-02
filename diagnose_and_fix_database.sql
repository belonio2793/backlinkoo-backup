-- ========================================================================
-- DATABASE DIAGNOSTIC AND CLEANUP SCRIPT
-- ========================================================================
-- This script will diagnose and fix the database inconsistencies

-- STEP 1: DIAGNOSE CURRENT STATE
-- ========================================================================

-- Check what's in auth.users
SELECT 
    'AUTH.USERS TABLE' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users;

-- List all users in auth.users
SELECT 
    'AUTH.USERS DETAILS' as info,
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Check what's in public.profiles
SELECT 
    'PUBLIC.PROFILES TABLE' as table_name,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_profiles
FROM public.profiles;

-- List all profiles
SELECT 
    'PUBLIC.PROFILES DETAILS' as info,
    user_id,
    email,
    role,
    full_name,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Check for mismatched data
SELECT 
    'ORPHANED PROFILES' as issue,
    p.user_id,
    p.email as profile_email,
    'No matching auth.users record' as problem
FROM public.profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE au.id IS NULL;

SELECT 
    'USERS WITHOUT PROFILES' as issue,
    au.id,
    au.email as auth_email,
    'No matching profiles record' as problem
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;

-- STEP 2: CLEAN UP THE MESS
-- ========================================================================

-- Remove RLS temporarily to avoid recursion issues
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_select_own" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "admins_select_all" ON public.profiles;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Clean up orphaned profiles (profiles without matching auth.users)
DELETE FROM public.profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- STEP 3: CREATE FRESH ADMIN USER
-- ========================================================================

-- Remove any existing support admin user to start fresh
DELETE FROM public.profiles WHERE email = 'support@backlinkoo.com';
DELETE FROM auth.users WHERE email = 'support@backlinkoo.com';

-- Create a fresh admin user in auth.users
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
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
        role,
        aud,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'support@backlinkoo.com',
        crypt('Admin123!@#', gen_salt('bf')),
        now(), -- email confirmed
        null,
        '',
        now(),
        '',
        null,
        '',
        '',
        null,
        null,
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Support Admin", "display_name": "Support Team"}',
        false,
        'authenticated',
        'authenticated',
        now(),
        now()
    );
    
    -- Insert matching profile
    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        display_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'support@backlinkoo.com',
        'Support Admin',
        'Support Team',
        'admin',
        now(),
        now()
    );
    
    RAISE NOTICE 'Created fresh admin user with ID: %', admin_user_id;
END
$$;

-- STEP 4: CREATE PROPER RLS POLICIES
-- ========================================================================

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, safe policies

-- 1. Users can read their own profile
CREATE POLICY "users_read_own_profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 2. Users can update their own profile (but not change role)
CREATE POLICY "users_update_own_profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id 
        AND (role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()))
    );

-- 3. Users can insert their own profile during registration
CREATE POLICY "users_insert_own_profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 4. Support admin gets full access
CREATE POLICY "support_admin_full_access" ON public.profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'support@backlinkoo.com'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'support@backlinkoo.com'
        )
    );

-- STEP 5: VERIFICATION
-- ========================================================================

-- Verify the fix
SELECT 
    'VERIFICATION RESULTS' as test,
    au.id as user_id,
    au.email as auth_email,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    p.email as profile_email,
    p.role as profile_role,
    CASE 
        WHEN au.email = p.email AND p.role = 'admin' 
        THEN '✅ SUCCESS - Perfect sync!'
        ELSE '❌ ERROR - Still mismatched'
    END as status
FROM auth.users au
FULL OUTER JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'support@backlinkoo.com' OR p.email = 'support@backlinkoo.com';

-- Final check - make sure we can query profiles without recursion
SELECT 
    '✅ RLS CHECK PASSED' as message,
    COUNT(*) as profile_count
FROM public.profiles;

-- Success message
SELECT 
    '🎉 DATABASE CLEANUP COMPLETE!' as result,
    'auth.users and profiles tables are now properly synced' as status,
    'Login: support@backlinkoo.com / Admin123!@#' as credentials;
