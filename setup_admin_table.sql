-- Create admin_environment_variables table
-- SECURITY: This script has been cleaned of hardcoded API keys

-- Step 1: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_environment_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_env_vars_key ON admin_environment_variables(key);

-- Step 3: Enable Row Level Security
ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy for admin access only
DROP POLICY IF EXISTS "Admin access only" ON admin_environment_variables;
CREATE POLICY "Admin access only" ON admin_environment_variables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                'admin@backlinkoo.com',
                'support@backlinkoo.com'
            )
        )
    );

-- Step 5: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS update_admin_environment_variables_updated_at ON admin_environment_variables;
CREATE TRIGGER update_admin_environment_variables_updated_at 
    BEFORE UPDATE ON admin_environment_variables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- SECURITY NOTICE:
-- API keys should be inserted manually through the admin interface or
-- secure deployment scripts that use environment variables, NOT hardcoded values.

-- Verification: Check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_environment_variables'
ORDER BY ordinal_position;
