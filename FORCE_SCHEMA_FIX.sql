-- FORCE SCHEMA FIX: Run this if the previous attempt didn't work
-- This is a more aggressive approach to ensure the columns are added

-- First, check if the table exists at all
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'automation_campaigns' 
                   AND table_schema = 'public') THEN
        RAISE EXCEPTION 'automation_campaigns table does not exist!';
    END IF;
    RAISE NOTICE 'automation_campaigns table exists';
END $$;

-- Force add each column individually with error handling
DO $$
BEGIN
    -- Add published_articles column (THIS IS THE CRITICAL ONE)
    BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB;
        RAISE NOTICE 'Added published_articles column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'published_articles column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding published_articles: %', SQLERRM;
    END;

    -- Set default for published_articles
    BEGIN
        ALTER TABLE automation_campaigns ALTER COLUMN published_articles SET DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Set default for published_articles';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error setting default for published_articles: %', SQLERRM;
    END;

    -- Add links_built column
    BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN links_built INTEGER;
        RAISE NOTICE 'Added links_built column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'links_built column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding links_built: %', SQLERRM;
    END;

    -- Set default for links_built
    BEGIN
        ALTER TABLE automation_campaigns ALTER COLUMN links_built SET DEFAULT 0;
        RAISE NOTICE 'Set default for links_built';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error setting default for links_built: %', SQLERRM;
    END;

    -- Add available_sites column
    BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN available_sites INTEGER;
        RAISE NOTICE 'Added available_sites column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'available_sites column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding available_sites: %', SQLERRM;
    END;

    -- Set default for available_sites
    BEGIN
        ALTER TABLE automation_campaigns ALTER COLUMN available_sites SET DEFAULT 1;
        RAISE NOTICE 'Set default for available_sites';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error setting default for available_sites: %', SQLERRM;
    END;

    -- Add target_sites_used column
    BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[];
        RAISE NOTICE 'Added target_sites_used column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'target_sites_used column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding target_sites_used: %', SQLERRM;
    END;

    -- Set default for target_sites_used
    BEGIN
        ALTER TABLE automation_campaigns ALTER COLUMN target_sites_used SET DEFAULT '{}';
        RAISE NOTICE 'Set default for target_sites_used';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error setting default for target_sites_used: %', SQLERRM;
    END;

    -- Add engine_type column
    BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN engine_type TEXT;
        RAISE NOTICE 'Added engine_type column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'engine_type column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding engine_type: %', SQLERRM;
    END;

    -- Set default for engine_type
    BEGIN
        ALTER TABLE automation_campaigns ALTER COLUMN engine_type SET DEFAULT 'web2_platforms';
        RAISE NOTICE 'Set default for engine_type';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error setting default for engine_type: %', SQLERRM;
    END;

    -- Add execution_progress column
    BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB;
        RAISE NOTICE 'Added execution_progress column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'execution_progress column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding execution_progress: %', SQLERRM;
    END;

    -- Set default for execution_progress
    BEGIN
        ALTER TABLE automation_campaigns ALTER COLUMN execution_progress SET DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Set default for execution_progress';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error setting default for execution_progress: %', SQLERRM;
    END;

    -- Add current_platform column
    BEGIN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
        RAISE NOTICE 'Added current_platform column';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'current_platform column already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error adding current_platform: %', SQLERRM;
    END;

    RAISE NOTICE 'Schema fix attempt completed';
END $$;

-- Now verify what columns actually exist
SELECT 
    'VERIFICATION: automation_campaigns columns' as info,
    array_agg(column_name ORDER BY ordinal_position) as existing_columns
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND table_schema = 'public';

-- Test that we can select the critical columns
SELECT 
    'TEST: Can select critical columns' as test_name,
    COUNT(*) as row_count
FROM automation_campaigns 
WHERE published_articles IS NOT NULL 
   OR published_articles IS NULL;

-- Final status
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'automation_campaigns' 
              AND column_name = 'published_articles'
              AND data_type = 'jsonb'
        )
        THEN '✅ SUCCESS: published_articles column exists and is JSONB type'
        ELSE '❌ FAILED: published_articles column missing or wrong type'
    END as final_status;
