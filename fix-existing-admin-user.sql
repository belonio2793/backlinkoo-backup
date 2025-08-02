-- Fix existing admin user: reset password and ensure proper configuration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/new

-- Step 1: Update the existing user's password
UPDATE auth.users 
SET 
  encrypted_password = crypt('Admin123!@#', gen_salt('bf')),
  updated_at = NOW(),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE email = 'support@backlinkoo.com';

-- Step 2: Create or update the user's profile with admin role
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
WHERE u.email = 'support@backlinkoo.com'
ON CONFLICT (user_id) 
DO UPDATE SET
  role = 'admin',
  full_name = 'Support Admin',
  display_name = 'Support Team',
  updated_at = NOW();

-- Step 3: Verify the fix worked
SELECT 
  'User exists in auth.users:' as status,
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  CASE WHEN u.encrypted_password IS NOT NULL THEN 'Password set' ELSE 'No password' END as password_status
FROM auth.users u 
WHERE u.email = 'support@backlinkoo.com'

UNION ALL

SELECT 
  'Profile exists:' as status,
  p.email,
  p.role::text as email_confirmed,
  p.full_name as password_status
FROM public.profiles p 
WHERE p.email = 'support@backlinkoo.com';

-- Expected output should show both the user and profile exist with admin role
-- If this runs successfully, you can now login with:
-- Email: support@backlinkoo.com
-- Password: Admin123!@#
