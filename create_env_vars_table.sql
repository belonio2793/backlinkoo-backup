-- Create admin_environment_variables table for storing API keys and configuration
CREATE TABLE IF NOT EXISTS admin_environment_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    is_secret BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_env_vars_key ON admin_environment_variables(key);

-- Enable Row Level Security
ALTER TABLE admin_environment_variables ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
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

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_environment_variables_updated_at 
    BEFORE UPDATE ON admin_environment_variables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial API keys
INSERT INTO admin_environment_variables (key, value, description, is_secret)
VALUES
    -- OpenAI API key removed for security - handled server-side only via Netlify functions
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
