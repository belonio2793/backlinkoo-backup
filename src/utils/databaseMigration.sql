-- Database Migration Script for Blog Comment Automation System
-- This script fixes schema misconfigurations and adds missing columns

-- First, check if blog_campaigns table exists and add missing columns
DO $$
BEGIN
    -- Add automation_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_campaigns' 
        AND column_name = 'automation_enabled'
    ) THEN
        ALTER TABLE blog_campaigns 
        ADD COLUMN automation_enabled boolean DEFAULT false;
        
        RAISE NOTICE 'Added automation_enabled column to blog_campaigns';
    ELSE
        RAISE NOTICE 'automation_enabled column already exists';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_campaigns' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE blog_campaigns 
        ADD COLUMN updated_at timestamptz DEFAULT now();
        
        RAISE NOTICE 'Added updated_at column to blog_campaigns';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Update blog_comments table to support new status values
DO $$
BEGIN
    -- Drop and recreate the status constraint to include new values
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'blog_comments' 
        AND constraint_name = 'blog_comments_status_check'
    ) THEN
        ALTER TABLE blog_comments DROP CONSTRAINT blog_comments_status_check;
    END IF;
    
    -- Add the new constraint with all status values
    ALTER TABLE blog_comments 
    ADD CONSTRAINT blog_comments_status_check 
    CHECK (status IN ('pending', 'approved', 'posted', 'failed', 'processing', 'needs_verification'));
    
    RAISE NOTICE 'Updated blog_comments status constraint';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Status constraint update failed or not needed: %', SQLERRM;
END $$;

-- Add platform column to blog_comments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_comments' 
        AND column_name = 'platform'
    ) THEN
        ALTER TABLE blog_comments 
        ADD COLUMN platform text NOT NULL DEFAULT 'generic' 
        CHECK (platform IN ('substack', 'medium', 'wordpress', 'generic'));
        
        RAISE NOTICE 'Added platform column to blog_comments';
    ELSE
        RAISE NOTICE 'platform column already exists';
    END IF;
END $$;

-- Add account_id column to blog_comments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_comments' 
        AND column_name = 'account_id'
    ) THEN
        -- First check if blog_accounts table exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'blog_accounts'
        ) THEN
            ALTER TABLE blog_comments 
            ADD COLUMN account_id uuid REFERENCES blog_accounts(id);
            
            RAISE NOTICE 'Added account_id column to blog_comments';
        ELSE
            -- Add without foreign key constraint if blog_accounts doesn't exist
            ALTER TABLE blog_comments 
            ADD COLUMN account_id uuid;
            
            RAISE NOTICE 'Added account_id column to blog_comments (without foreign key)';
        END IF;
    ELSE
        RAISE NOTICE 'account_id column already exists';
    END IF;
END $$;

-- Add error_message column to blog_comments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_comments' 
        AND column_name = 'error_message'
    ) THEN
        ALTER TABLE blog_comments 
        ADD COLUMN error_message text;
        
        RAISE NOTICE 'Added error_message column to blog_comments';
    ELSE
        RAISE NOTICE 'error_message column already exists';
    END IF;
END $$;

-- Create blog_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    platform text NOT NULL CHECK (platform IN ('substack', 'medium', 'wordpress', 'generic')),
    email text NOT NULL,
    display_name text,
    cookies text,
    session_data jsonb,
    is_verified boolean DEFAULT false,
    verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
    last_used timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, platform, email)
);

-- Create automation_jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS automation_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES blog_campaigns(id) ON DELETE CASCADE,
    job_type text NOT NULL CHECK (job_type IN ('discover_blogs', 'post_comments', 'verify_accounts')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payload jsonb,
    result jsonb,
    error_message text,
    scheduled_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for account_id if tables exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_accounts'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_comments' AND column_name = 'account_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'blog_comments' 
        AND ccu.column_name = 'account_id' 
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE blog_comments 
        ADD CONSTRAINT fk_blog_comments_account_id 
        FOREIGN KEY (account_id) REFERENCES blog_accounts(id);
        
        RAISE NOTICE 'Added foreign key constraint for account_id';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Foreign key constraint creation failed or not needed: %', SQLERRM;
END $$;

-- Enable RLS on new tables
ALTER TABLE blog_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_accounts
CREATE POLICY IF NOT EXISTS "Users can view their own accounts" ON blog_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own accounts" ON blog_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own accounts" ON blog_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own accounts" ON blog_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for automation_jobs
CREATE POLICY IF NOT EXISTS "Users can view jobs for their campaigns" ON automation_jobs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM blog_campaigns 
        WHERE blog_campaigns.id = automation_jobs.campaign_id 
        AND blog_campaigns.user_id = auth.uid()
    ));

CREATE POLICY IF NOT EXISTS "System can manage automation jobs" ON automation_jobs
    FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_automation ON blog_campaigns(automation_enabled);
CREATE INDEX IF NOT EXISTS idx_blog_comments_platform ON blog_comments(platform);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_user_id ON blog_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_platform ON blog_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_verified ON blog_accounts(is_verified);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_campaign_id ON automation_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_type ON automation_jobs(job_type);

-- Create or replace the trigger function for updating campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE blog_campaigns 
    SET 
        links_posted = (
            SELECT COUNT(*) FROM blog_comments 
            WHERE campaign_id = NEW.campaign_id AND status = 'posted'
        ),
        updated_at = now()
    WHERE id = NEW.campaign_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON blog_comments;
CREATE TRIGGER update_campaign_stats_trigger
    AFTER UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_stats();

-- Final verification
SELECT 
    'blog_campaigns' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_campaigns'
ORDER BY ordinal_position;

SELECT 
    'blog_comments' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_comments'
ORDER BY ordinal_position;

-- Show table creation status
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES 
    ('blog_campaigns'),
    ('blog_comments'), 
    ('blog_accounts'),
    ('automation_jobs')
) as expected_tables(table_name);
