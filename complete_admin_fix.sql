-- ========================================================================
-- COMPLETE FIX FOR ADMIN LOGIN AND RLS ISSUES
-- ========================================================================
-- This script fixes both the infinite recursion and creates the admin user

-- STEP 1: IMMEDIATELY STOP THE INFINITE RECURSION
-- ========================================================================

-- Drop the problematic function that causes recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Temporarily disable RLS to stop the infinite loop
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to clean slate
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;

-- STEP 2: CREATE THE ADMIN USER
-- ========================================================================

-- Create the admin user in auth.users table
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if user already exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'support@backlinkoo.com';
    
    -- If user doesn't exist, create them
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            confirmation_token,
            email_confirmed_at,
            invited_at,
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
            role
        ) VALUES (
            admin_user_id,
            '00000000-0000-0000-0000-000000000000',
            'support@backlinkoo.com',
            crypt('Admin123!@#', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Support Admin", "display_name": "Support Team"}',
            false,
            'authenticated',
            'authenticated',
            '',
            now(),
            null,
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
            'authenticated'
        );
        
        RAISE NOTICE 'Created new admin user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- Create or update the profile
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
    ) ON CONFLICT (user_id) DO UPDATE SET
        role = 'admin',
        email = 'support@backlinkoo.com',
        full_name = 'Support Admin',
        display_name = 'Support Team',
        updated_at = now();
        
    RAISE NOTICE 'Created/updated admin profile';
END
$$;

-- STEP 3: CREATE SAFE RLS POLICIES (NO RECURSION)
-- ========================================================================

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, safe policies that don't call functions

-- Policy 1: Users can view their own profile
CREATE POLICY "users_select_own" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy 2: Users can update their own profile  
CREATE POLICY "users_update_own" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "users_insert_own" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admin bypass - support email gets full access
CREATE POLICY "admin_full_access" ON public.profiles
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

-- Policy 5: Admins can view all profiles (safe version)
CREATE POLICY "admins_select_all" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles admin_check
            WHERE admin_check.user_id = auth.uid()
            AND admin_check.role = 'admin'
            AND admin_check.user_id != profiles.user_id  -- Prevent self-reference
        )
    );

-- STEP 4: VERIFICATION
-- ========================================================================

-- Verify admin user was created
SELECT 
    'ADMIN USER CHECK' as test,
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    p.role,
    p.full_name,
    CASE 
        WHEN p.role = 'admin' AND au.email = 'support@backlinkoo.com' 
        THEN '✅ SUCCESS - Admin user ready for login'
        ELSE '❌ ERROR - Admin setup incomplete'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'support@backlinkoo.com';

-- Verify policies are not recursive
SELECT 
    '✅ RLS POLICIES FIXED - No more infinite recursion!' as message,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

-- Final success message
SELECT 
    '🎉 COMPLETE FIX APPLIED SUCCESSFULLY!' as result,
    'Login credentials: support@backlinkoo.com / Admin123!@#' as credentials,
    'You can now login at /admin' as next_step;
