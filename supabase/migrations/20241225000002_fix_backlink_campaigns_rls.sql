-- Fix RLS policies for backlink_campaigns table to ensure proper user access

-- First, let's make sure RLS is enabled
ALTER TABLE backlink_campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own campaigns" ON backlink_campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON backlink_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON backlink_campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON backlink_campaigns;

-- Recreate policies with better names and ensure they work correctly
CREATE POLICY "backlink_campaigns_select_policy" ON backlink_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "backlink_campaigns_insert_policy" ON backlink_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "backlink_campaigns_update_policy" ON backlink_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "backlink_campaigns_delete_policy" ON backlink_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Add a service role policy for administrative access (if needed)
CREATE POLICY "service_role_full_access" ON backlink_campaigns
    FOR ALL USING (auth.role() = 'service_role');

-- Verify the table structure has user_id column with proper foreign key
DO $$ 
BEGIN
    -- Check if user_id column exists and has proper constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'backlink_campaigns' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE backlink_campaigns 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Ensure user_id is not null (required for RLS)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'backlink_campaigns' 
        AND column_name = 'user_id'
        AND is_nullable = 'YES'
    ) THEN
        -- Update any existing rows without user_id (shouldn't happen in practice)
        -- This is just for safety
        UPDATE backlink_campaigns 
        SET user_id = (SELECT id FROM auth.users LIMIT 1)
        WHERE user_id IS NULL;
        
        -- Make user_id NOT NULL
        ALTER TABLE backlink_campaigns 
        ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_user_id ON backlink_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_status ON backlink_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_created_at ON backlink_campaigns(created_at);

-- Add comments for documentation
COMMENT ON TABLE backlink_campaigns IS 'Stores user backlink building campaigns with RLS enabled';
COMMENT ON POLICY "backlink_campaigns_select_policy" ON backlink_campaigns IS 'Users can only view their own campaigns';
COMMENT ON POLICY "backlink_campaigns_insert_policy" ON backlink_campaigns IS 'Users can only create campaigns for themselves';
COMMENT ON POLICY "backlink_campaigns_update_policy" ON backlink_campaigns IS 'Users can only update their own campaigns';
COMMENT ON POLICY "backlink_campaigns_delete_policy" ON backlink_campaigns IS 'Users can only delete their own campaigns';

-- Test the RLS policies work correctly (this is just a verification)
-- The following would fail if RLS is not working:
-- INSERT INTO backlink_campaigns (user_id, name, target_url) VALUES (gen_random_uuid(), 'test', 'https://test.com');
