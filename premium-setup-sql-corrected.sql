-- First, let's check what enum values are available for app_role
SELECT enumlabel FROM pg_enum WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'app_role'
);

-- Alternative way to check enum values
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'app_role';

-- Based on common patterns, try one of these role values:
-- Option 1: Use 'user' role but set subscription_tier to 'premium'
UPDATE profiles 
SET 
  subscription_tier = 'premium', 
  subscription_status = 'active',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'labindalawamaryrose@gmail.com');

-- Option 2: If 'admin' is a valid enum value, use that (admins get premium access)
UPDATE profiles 
SET 
  role = 'admin',
  subscription_tier = 'premium', 
  subscription_status = 'active',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'labindalawamaryrose@gmail.com');

-- Option 3: Create the profile if it doesn't exist (using 'user' role)
INSERT INTO profiles (user_id, role, subscription_tier, subscription_status, created_at, updated_at)
SELECT 
  id,
  'user',
  'premium',
  'active',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'labindalawamaryrose@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  subscription_tier = 'premium',
  subscription_status = 'active',
  updated_at = NOW();

-- Verify the changes
SELECT 
  u.email,
  p.role,
  p.subscription_tier,
  p.subscription_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'labindalawamaryrose@gmail.com';
