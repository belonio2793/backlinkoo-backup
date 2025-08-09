-- SQL commands to set user as premium
-- Replace 'USER_ID_HERE' with the actual user_id from auth.users table

-- Step 1: Find the user_id first
SELECT id, email FROM auth.users WHERE email = 'labindalawamaryrose@gmail.com';

-- Step 2: Update or insert profile with premium status
-- Option A: If profile exists, update it
UPDATE profiles 
SET 
  role = 'premium',
  subscription_tier = 'premium', 
  subscription_status = 'active',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'labindalawamaryrose@gmail.com');

-- Option B: If profile doesn't exist, insert it
INSERT INTO profiles (user_id, role, subscription_tier, subscription_status, created_at, updated_at)
SELECT 
  id,
  'premium',
  'premium',
  'active',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'labindalawamaryrose@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'premium',
  subscription_tier = 'premium',
  subscription_status = 'active',
  updated_at = NOW();

-- Step 3: (Optional) Add premium subscription record
INSERT INTO premium_subscriptions (user_id, plan_type, status, current_period_start, current_period_end, created_at, updated_at)
SELECT 
  id,
  'premium',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'labindalawamaryrose@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  current_period_end = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- Step 4: Verify the changes
SELECT 
  u.email,
  p.role,
  p.subscription_tier,
  p.subscription_status,
  ps.status as premium_sub_status,
  ps.current_period_end
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN premium_subscriptions ps ON u.id = ps.user_id
WHERE u.email = 'labindalawamaryrose@gmail.com';
