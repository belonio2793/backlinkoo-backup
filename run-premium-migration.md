# Premium Role Migration Instructions

To enable the premium role system, you need to run the following SQL commands in your Supabase SQL Editor:

## 1. Add Premium Role to Enum

```sql
-- Add premium role to the app_role enum
ALTER TYPE app_role ADD VALUE 'premium';
```

## 2. Add Subscription Columns

```sql
-- Add subscription related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise'));
```

## 3. Create Audit Log Table

```sql
-- Create user_audit_log table for tracking user actions
CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);
```

## 4. Set Up RLS Policies

```sql
-- Enable RLS on user_audit_log
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for user_audit_log
CREATE POLICY "Users can view their own audit logs" ON user_audit_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON user_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON user_audit_log
    FOR INSERT WITH CHECK (true);
```

## 5. Create Indexes

```sql
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_timestamp ON user_audit_log(timestamp);
```

## 6. Update Existing Users

```sql
-- Update existing users to have proper subscription fields
UPDATE profiles 
SET 
    subscription_status = CASE 
        WHEN role = 'admin' THEN 'active'
        ELSE 'inactive'
    END,
    subscription_tier = CASE 
        WHEN role = 'admin' THEN 'premium'
        ELSE 'basic'
    END
WHERE subscription_status IS NULL OR subscription_tier IS NULL;
```

## 7. Test the Migration

After running the above commands, you can test by:

1. Go to your dashboard
2. Click "Upgrade Now" in the SEO Analysis Report
3. Complete the premium checkout process
4. Verify that your role is upgraded to "premium"
5. Check that you can claim unlimited posts

## Premium Features Enabled

Once the migration is complete and users upgrade to premium, they will have:

- ✅ Unlimited blog post claims (no 3-post limit)
- ✅ Access to 100/100 SEO optimized content
- ✅ Advanced analytics and reporting
- ✅ Priority support
- ✅ Advanced SEO features

## Manual Premium Role Assignment (For Testing)

To manually make a user premium for testing:

```sql
-- Replace 'user-uuid-here' with the actual user ID
UPDATE profiles 
SET 
    role = 'premium',
    subscription_status = 'active',
    subscription_tier = 'premium'
WHERE user_id = 'user-uuid-here';
```
