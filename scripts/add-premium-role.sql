-- Add premium role to the app_role enum
ALTER TYPE app_role ADD VALUE 'premium';

-- Add subscription related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise'));

-- Create user_audit_log table for tracking user actions
CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_timestamp ON user_audit_log(timestamp);

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
