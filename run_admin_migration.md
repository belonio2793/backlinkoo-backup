# Fix: admin_environment_variables Table Missing

## The Issue
The `admin_environment_variables` table doesn't exist in your Supabase database, causing errors throughout the admin dashboard.

## Why This Table is Needed
This table is **essential** for:
- ✅ Storing API keys securely in the database
- ✅ Dynamic configuration updates without redeployment
- ✅ Centralized admin configuration management
- ✅ Real-time synchronization of settings

## Solution Options

### Option 1: Run Supabase Migration (Recommended)
```bash
# Navigate to your project root
cd your-project

# Run the migration
supabase db push

# Or run specific migration
supabase migration up --include-all
```

### Option 2: Manual SQL Execution in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run this SQL:

```sql
-- Create admin_environment_variables table
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

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_admin_environment_variables_updated_at 
    BEFORE UPDATE ON admin_environment_variables 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO admin_environment_variables (key, value, description, is_secret)
VALUES
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
```

### Option 3: Use the Built-in Table Creator
Your app has a built-in table creator. After running the SQL above, the admin components should detect the table automatically.

## After Creating the Table
1. The error will disappear
2. Admin environment variable management will work
3. API key synchronization will function properly
4. Your consolidated OpenAI config will be able to save settings to the database

## Important Notes
- **DO NOT REMOVE** this table - it's critical for admin functionality
- The table includes Row Level Security (RLS) for security
- Only admin emails can access this table
- The table supports both secret and non-secret environment variables
