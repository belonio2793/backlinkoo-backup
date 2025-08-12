-- Database Diagnostic Script
-- Run each section separately to identify the issue

-- 1. Check if automation_campaigns table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'automation_campaigns';

-- 2. If table exists, check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if the specific columns already exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start');

-- 4. Check your current user permissions
SELECT current_user, current_database();

-- 5. Try to create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS automation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    engine_type TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    keywords TEXT[] DEFAULT '{}',
    anchor_texts TEXT[] DEFAULT '{}',
    daily_limit INTEGER DEFAULT 10,
    links_built INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Add the missing columns
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    auto_start BOOLEAN DEFAULT false
);

-- 6. If table exists but columns are missing, add them one by one
DO $$
BEGIN
    -- Add started_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'started_at'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN started_at TIMESTAMPTZ;
        RAISE NOTICE 'Added started_at column';
    ELSE
        RAISE NOTICE 'started_at column already exists';
    END IF;

    -- Add completed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added completed_at column';
    ELSE
        RAISE NOTICE 'completed_at column already exists';
    END IF;

    -- Add auto_start column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'auto_start'
    ) THEN
        ALTER TABLE automation_campaigns ADD COLUMN auto_start BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added auto_start column';
    ELSE
        RAISE NOTICE 'auto_start column already exists';
    END IF;
END $$;

-- 7. Final verification
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;
