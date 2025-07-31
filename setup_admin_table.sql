-- Create admin_environment_variables table and add OpenAI API key
-- This script will setup the missing table and configure the API key

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

-- Step 7: Insert/Update the OpenAI API key
INSERT INTO admin_environment_variables (key, value, description, is_secret)
VALUES
    (
        'VITE_OPENAI_API_KEY',
        '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',
        'OpenAI API key for AI content generation and backlink creation',
        true
    ),
    (
        'SUPABASE_ACCESS_TOKEN',
        'sbp_65f13d3ef84fae093dbb2b2d5368574f69b3cea2',
        'Supabase account access token for database operations and deployments',
        true
    )
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = timezone('utc'::text, now());

-- Verification: Check if the data was inserted correctly
SELECT 
    key, 
    CASE 
        WHEN is_secret THEN LEFT(value, 10) || '...' 
        ELSE value 
    END as masked_value,
    description,
    created_at,
    updated_at
FROM admin_environment_variables 
ORDER BY created_at DESC;
