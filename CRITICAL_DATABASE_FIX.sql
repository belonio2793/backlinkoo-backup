-- CRITICAL FIX: This will definitely resolve the "expected JSON array" error
-- The issue is the automation_campaigns table is missing JSONB columns

-- Step 1: Verify current table structure
SELECT 'BEFORE FIX - Current columns:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Force add ALL missing columns with proper error handling
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check and add published_articles (CRITICAL - this is causing the error)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
          AND column_name = 'published_articles'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Added published_articles column';
    ELSE
        RAISE NOTICE 'ℹ️ published_articles already exists';
    END IF;

    -- Check and add links_built
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
          AND column_name = 'links_built'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE automation_campaigns ADD COLUMN links_built INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added links_built column';
    ELSE
        RAISE NOTICE 'ℹ️ links_built already exists';
    END IF;

    -- Check and add available_sites
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
          AND column_name = 'available_sites'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE automation_campaigns ADD COLUMN available_sites INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Added available_sites column';
    ELSE
        RAISE NOTICE 'ℹ️ available_sites already exists';
    END IF;

    -- Check and add target_sites_used
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
          AND column_name = 'target_sites_used'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
        RAISE NOTICE '✅ Added target_sites_used column';
    ELSE
        RAISE NOTICE 'ℹ️ target_sites_used already exists';
    END IF;

    -- Check and add engine_type
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
          AND column_name = 'engine_type'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE automation_campaigns ADD COLUMN engine_type TEXT DEFAULT 'web2_platforms';
        RAISE NOTICE '✅ Added engine_type column';
    ELSE
        RAISE NOTICE 'ℹ️ engine_type already exists';
    END IF;

    -- Check and add execution_progress
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
          AND column_name = 'execution_progress'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Added execution_progress column';
    ELSE
        RAISE NOTICE 'ℹ️ execution_progress already exists';
    END IF;

    -- Check and add current_platform
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
          AND column_name = 'current_platform'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
        RAISE NOTICE '✅ Added current_platform column';
    ELSE
        RAISE NOTICE 'ℹ️ current_platform already exists';
    END IF;

    RAISE NOTICE 'Schema update completed successfully!';
END $$;

-- Step 3: Verify the fix worked
SELECT 'AFTER FIX - Updated columns:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Critical verification - check for the specific columns causing issues
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'published_articles' 
                      AND data_type = 'jsonb')
        THEN '✅ FIXED: published_articles (JSONB) exists'
        ELSE '❌ BROKEN: published_articles missing or wrong type'
    END as published_articles_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'links_built')
        THEN '✅ FIXED: links_built exists'
        ELSE '❌ BROKEN: links_built missing'
    END as links_built_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'target_sites_used')
        THEN '✅ FIXED: target_sites_used exists'
        ELSE '❌ BROKEN: target_sites_used missing'
    END as target_sites_used_status;

-- Step 5: Test insert to verify no more "expected JSON array" error
INSERT INTO automation_campaigns (
    user_id,
    name,
    keywords,
    anchor_texts,
    target_url,
    engine_type,
    published_articles,
    links_built,
    available_sites,
    target_sites_used
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Critical Fix Test Campaign',
    ARRAY['test', 'automation'],
    ARRAY['test link', 'automation tool'],
    'https://test-fix.example.com',
    'web2_platforms',
    '[]'::jsonb,
    0,
    1,
    '{}'::text[]
) RETURNING id, name, published_articles;

-- Clean up test data
DELETE FROM automation_campaigns WHERE name = 'Critical Fix Test Campaign';

-- Final status
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'automation_campaigns' 
                      AND column_name = 'published_articles')
        THEN '🎉 SUCCESS: The "expected JSON array" error should now be fixed!'
        ELSE '⚠️ ISSUE: published_articles column still missing'
    END as final_status;
