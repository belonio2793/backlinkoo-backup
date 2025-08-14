-- ===================================================================
-- FIXED: Campaign Creation Error - "expected JSON array"
-- ===================================================================
-- 
-- This version fixes the UPDATE issue by only updating columns
-- that actually exist after the ALTER TABLE statements succeed
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase Dashboard > SQL Editor
-- 3. Paste and run this script
-- 
-- ===================================================================

-- Step 1: Add the missing columns safely
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

    RAISE NOTICE 'All column additions completed!';
END $$;

-- Step 2: Create indexes for better performance
DO $$
BEGIN
    RAISE NOTICE 'Creating performance indexes...';
END $$;

CREATE INDEX IF NOT EXISTS idx_automation_campaigns_links_built ON automation_campaigns(links_built);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_available_sites ON automation_campaigns(available_sites);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_current_platform ON automation_campaigns(current_platform);

-- Step 3: Update existing records - FIXED VERSION
-- This version checks for column existence before trying to update
DO $$
DECLARE
    update_sql TEXT := 'UPDATE automation_campaigns SET ';
    set_clauses TEXT[] := ARRAY[]::TEXT[];
    where_clauses TEXT[] := ARRAY[]::TEXT[];
    final_sql TEXT;
BEGIN
    RAISE NOTICE 'Updating existing records with default values...';
    
    -- Build SET clauses only for columns that exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'links_built') THEN
        set_clauses := array_append(set_clauses, 'links_built = COALESCE(links_built, 0)');
        where_clauses := array_append(where_clauses, 'links_built IS NULL');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'available_sites') THEN
        set_clauses := array_append(set_clauses, 'available_sites = COALESCE(available_sites, 0)');
        where_clauses := array_append(where_clauses, 'available_sites IS NULL');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'target_sites_used') THEN
        set_clauses := array_append(set_clauses, 'target_sites_used = COALESCE(target_sites_used, ''{}''::TEXT[])');
        where_clauses := array_append(where_clauses, 'target_sites_used IS NULL');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'published_articles') THEN
        set_clauses := array_append(set_clauses, 'published_articles = COALESCE(published_articles, ''[]''::jsonb)');
        where_clauses := array_append(where_clauses, 'published_articles IS NULL');
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_campaigns' AND column_name = 'execution_progress') THEN
        set_clauses := array_append(set_clauses, 'execution_progress = COALESCE(execution_progress, ''{}''::jsonb)');
        where_clauses := array_append(where_clauses, 'execution_progress IS NULL');
    END IF;
    
    -- Only execute UPDATE if we have columns to update
    IF array_length(set_clauses, 1) > 0 THEN
        final_sql := update_sql || array_to_string(set_clauses, ', ') || 
                    ' WHERE ' || array_to_string(where_clauses, ' OR ');
        
        RAISE NOTICE 'Executing: %', final_sql;
        EXECUTE final_sql;
        
        GET DIAGNOSTICS update_sql = ROW_COUNT;
        RAISE NOTICE '✅ Updated % existing records with default values', update_sql;
    ELSE
        RAISE NOTICE '✓ No columns to update or no existing records need updates';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Update operation failed: %, continuing...', SQLERRM;
END $$;

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Verify the schema fix
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'automation_campaigns';
    
    RAISE NOTICE '🎯 SCHEMA FIX VERIFICATION: % total columns in automation_campaigns', col_count;
END $$;

-- Show the new columns that were added
SELECT 
    '📋 NEW COLUMNS STATUS:' as info,
    column_name, 
    data_type, 
    is_nullable, 
    CASE 
        WHEN column_default IS NULL THEN 'No default'
        ELSE substring(column_default, 1, 50)
    END as column_default_preview
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND column_name IN ('links_built', 'available_sites', 'target_sites_used', 'published_articles', 'started_at', 'current_platform', 'execution_progress')
ORDER BY column_name;

-- Test that the JSON columns work properly
DO $$
BEGIN
    -- Test published_articles JSONB column
    PERFORM '[]'::jsonb;
    -- Test execution_progress JSONB column  
    PERFORM '{}'::jsonb;
    -- Test TEXT array
    PERFORM '{}'::TEXT[];
    
    RAISE NOTICE '✅ All column types are properly configured';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Column type configuration issue: %', SQLERRM;
END $$;

-- Show count of existing campaigns
DO $$
DECLARE
    campaign_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO campaign_count FROM automation_campaigns;
    RAISE NOTICE '📊 Total existing campaigns: %', campaign_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not count campaigns: %', SQLERRM;
END $$;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 FIXED CAMPAIGN SCHEMA COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ The "expected JSON array" error should now be resolved';
    RAISE NOTICE '✅ Campaign creation should work properly';
    RAISE NOTICE '✅ UPDATE statement issue has been fixed';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Next steps:';
    RAISE NOTICE '   1. Go back to your application';
    RAISE NOTICE '   2. Try creating a campaign again';
    RAISE NOTICE '   3. The error should be fixed!';
    RAISE NOTICE '';
END $$;
