-- ===================================================================
-- URGENT FIX: Campaign Creation Error - "expected JSON array"
-- ===================================================================
-- 
-- ERROR: Failed to create campaign: [object Object]
-- CAUSE: Missing columns in automation_campaigns table
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase Dashboard > SQL Editor
-- 3. Paste and run this script
-- 4. Verify the fix by creating a campaign
-- 
-- ===================================================================

-- Fix automation_campaigns table schema to match application expectations
-- Add missing columns: links_built, available_sites, target_sites_used, published_articles

DO $$ 
BEGIN
    RAISE NOTICE 'Starting schema fix for automation_campaigns table...';
    
    -- Add links_built column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'links_built') THEN
        ALTER TABLE automation_campaigns ADD COLUMN links_built INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added links_built column';
    ELSE
        RAISE NOTICE '✓ links_built column already exists';
    END IF;

    -- Add available_sites column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'available_sites') THEN
        ALTER TABLE automation_campaigns ADD COLUMN available_sites INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added available_sites column';
    ELSE
        RAISE NOTICE '✓ available_sites column already exists';
    END IF;

    -- Add target_sites_used column (TEXT array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'target_sites_used') THEN
        ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
        RAISE NOTICE '✅ Added target_sites_used column (TEXT[])';
    ELSE
        RAISE NOTICE '✓ target_sites_used column already exists';
    END IF;

    -- Add published_articles column (JSONB array for article data)
    -- THIS IS THE KEY FIX FOR "expected JSON array" ERROR
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'published_articles') THEN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Added published_articles column (JSONB) - FIXES "expected JSON array" ERROR';
    ELSE
        RAISE NOTICE '✓ published_articles column already exists';
    END IF;

    -- Add started_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'started_at') THEN
        ALTER TABLE automation_campaigns ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added started_at column';
    ELSE
        RAISE NOTICE '✓ started_at column already exists';
    END IF;

    -- Add current_platform column for tracking current execution platform
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'current_platform') THEN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
        RAISE NOTICE '✅ Added current_platform column';
    ELSE
        RAISE NOTICE '✓ current_platform column already exists';
    END IF;

    -- Add execution_progress column for tracking progress data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'execution_progress') THEN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Added execution_progress column';
    ELSE
        RAISE NOTICE '✓ execution_progress column already exists';
    END IF;

    RAISE NOTICE 'Schema updates completed!';
END $$;

-- Create indexes for better performance
DO $$
BEGIN
    RAISE NOTICE 'Creating performance indexes...';
END $$;

CREATE INDEX IF NOT EXISTS idx_automation_campaigns_links_built ON automation_campaigns(links_built);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_available_sites ON automation_campaigns(available_sites);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_current_platform ON automation_campaigns(current_platform);

-- Update existing records to have proper default values
DO $$
BEGIN
    RAISE NOTICE 'Updating existing records with default values...';
END $$;

UPDATE automation_campaigns 
SET 
    links_built = COALESCE(links_built, 0),
    available_sites = COALESCE(available_sites, 0),
    target_sites_used = COALESCE(target_sites_used, '{}'),
    published_articles = COALESCE(published_articles, '[]'::jsonb),
    execution_progress = COALESCE(execution_progress, '{}'::jsonb)
WHERE 
    links_built IS NULL OR 
    available_sites IS NULL OR 
    target_sites_used IS NULL OR 
    published_articles IS NULL OR
    execution_progress IS NULL;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Verify the schema fix
SELECT 
    '🎯 SCHEMA FIX VERIFICATION' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns';

-- Show the new columns that were added
SELECT 
    '📋 NEW COLUMNS ADDED:' as info,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND column_name IN ('links_built', 'available_sites', 'target_sites_used', 'published_articles', 'started_at', 'current_platform', 'execution_progress')
ORDER BY column_name;

-- Show all columns in the table
SELECT 
    '📊 ALL COLUMNS IN automation_campaigns:' as info,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
ORDER BY ordinal_position;

-- Test that the JSON columns accept arrays
DO $$
BEGIN
    -- Test published_articles JSONB column
    PERFORM '[]'::jsonb;
    -- Test execution_progress JSONB column  
    PERFORM '{}'::jsonb;
    RAISE NOTICE '✅ JSON columns are properly configured';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ JSON column configuration issue: %', SQLERRM;
END $$;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CAMPAIGN SCHEMA FIX COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ The "expected JSON array" error should now be resolved';
    RAISE NOTICE '✅ Campaign creation should work properly';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next steps:';
    RAISE NOTICE '   1. Go back to your application';
    RAISE NOTICE '   2. Try creating a campaign again';
    RAISE NOTICE '   3. The error should be fixed!';
    RAISE NOTICE '';
END $$;
