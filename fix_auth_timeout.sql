-- ========================================================================
-- SIMPLE FIX FOR AUTH TIMEOUT ISSUES
-- ========================================================================
-- This fixes the root cause of auth timeouts

-- Step 1: Remove problematic function that causes infinite recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Step 2: Temporarily disable RLS to stop hanging queries
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Clean up any existing admin user to start fresh
DELETE FROM public.profiles WHERE email = 'support@backlinkoo.com';
DELETE FROM auth.users WHERE email = 'support@backlinkoo.com';

-- Step 4: Create admin user properly
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
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
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
    '{"full_name": "Support Admin"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
);

-- Step 5: Create matching profile
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    display_name,
    role,
    created_at,
    updated_at
) SELECT 
    id,
    'support@backlinkoo.com',
    'Support Admin',
    'Support Team',
    'admin',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'support@backlinkoo.com';

-- Step 6: Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create SIMPLE policies that don't cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Simple admin policy using email check (no recursion)
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
CREATE POLICY "Admin full access" ON public.profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT au.id FROM auth.users au 
            WHERE au.email = 'support@backlinkoo.com'
        )
    );

-- Step 8: Verify the fix
SELECT 
    'VERIFICATION' as test,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    p.role,
    CASE 
        WHEN p.role = 'admin' THEN '✅ SUCCESS - Login should work now'
        ELSE '❌ ERROR - Setup failed'
    END as status
FROM auth.users au
JOIN public.profiles p ON au.id = p.user_id
WHERE au.email = 'support@backlinkoo.com';

SELECT '🎉 Auth timeout issue should be FIXED! Try logging in now.' as message;
