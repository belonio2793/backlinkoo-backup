-- Simple Admin User Creation Script
-- Run this in your Supabase SQL Editor if the app button doesn't work

-- Step 1: Create the admin user in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'support@backlinkoo.com',
    crypt('Admin123!@#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Support Admin"}',
    FALSE
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Create the profile (might fail due to RLS, that's OK)
INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    display_name,
    role,
    created_at,
    updated_at
) SELECT 
    au.id,
    'support@backlinkoo.com',
    'Support Admin',
    'Support Team',
    'admin',
    NOW(),
    NOW()
FROM auth.users au 
WHERE au.email = 'support@backlinkoo.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verify
SELECT 'Admin user created!' as message;
SELECT email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users WHERE email = 'support@backlinkoo.com';
