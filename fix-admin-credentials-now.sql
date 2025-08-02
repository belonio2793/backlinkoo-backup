-- COMPREHENSIVE ADMIN USER FIX
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/new
-- This will fix the existing admin user or create a new one if needed

-- Step 1: Delete existing problematic user if exists
DELETE FROM public.profiles WHERE email = 'support@backlinkoo.com';
DELETE FROM auth.users WHERE email = 'support@backlinkoo.com';

-- Step 2: Create admin user with proper configuration
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  confirmation_sent_at,
  recovery_sent_at,
  email_change_sent_at,
  new_email,
  new_phone,
  invited_at,
  action_link,
  email_change,
  email_change_confirm_status,
  banned_until,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_token_current,
  email_change_confirm_status_new,
  recovery_token,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- instance_id
  gen_random_uuid(),                        -- id (auto-generated)
  'authenticated',                          -- aud
  'authenticated',                          -- role
  'support@backlinkoo.com',                -- email
  crypt('Admin123!@#', gen_salt('bf')),    -- encrypted_password
  NOW(),                                   -- email_confirmed_at (confirmed immediately)
  NULL,                                    -- phone_confirmed_at
  NULL,                                    -- confirmation_sent_at
  NULL,                                    -- recovery_sent_at
  NULL,                                    -- email_change_sent_at
  NULL,                                    -- new_email
  NULL,                                    -- new_phone
  NULL,                                    -- invited_at
  NULL,                                    -- action_link
  NULL,                                    -- email_change
  0,                                       -- email_change_confirm_status
  NULL,                                    -- banned_until
  '{"provider": "email", "providers": ["email"]}'::jsonb,  -- raw_app_meta_data
  '{"full_name": "Support Admin", "display_name": "Support Team"}'::jsonb,  -- raw_user_meta_data
  FALSE,                                   -- is_super_admin
  NOW(),                                   -- created_at
  NOW(),                                   -- updated_at
  NULL,                                    -- phone
  NULL,                                    -- phone_change
  NULL,                                    -- phone_change_token
  NULL,                                    -- phone_change_sent_at
  NOW(),                                   -- confirmed_at (confirmed immediately)
  NULL,                                    -- email_change_token_current
  NULL,                                    -- email_change_confirm_status_new
  NULL,                                    -- recovery_token
  NULL,                                    -- reauthentication_token
  NULL,                                    -- reauthentication_sent_at
  FALSE,                                   -- is_sso_user
  NULL                                     -- deleted_at
);

-- Step 3: Create corresponding profile with admin role
INSERT INTO public.profiles (
  user_id,
  email,
  full_name,
  display_name,
  role,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'support@backlinkoo.com',
  'Support Admin',
  'Support Team',
  'admin',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'support@backlinkoo.com';

-- Step 4: Verify the setup
SELECT 
  'VERIFICATION - Admin User Created' as step,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  u.confirmed_at IS NOT NULL as confirmed,
  CASE WHEN u.encrypted_password IS NOT NULL THEN 'Password set correctly' ELSE 'NO PASSWORD' END as password_status,
  p.role as profile_role,
  p.full_name as profile_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'support@backlinkoo.com';

-- If you see output showing the user exists with email_confirmed=true, confirmed=true, 
-- password_status='Password set correctly', and profile_role='admin', then login should work.

-- LOGIN CREDENTIALS:
-- Email: support@backlinkoo.com
-- Password: Admin123!@#
