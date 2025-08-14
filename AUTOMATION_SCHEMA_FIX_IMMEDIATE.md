# 🚨 IMMEDIATE FIX FOR "EXPECTED JSON ARRAY" ERROR

## Problem
The automation system is failing with `"expected JSON array"` error because the database schema is missing required columns that the code expects.

## CRITICAL FIX NEEDED NOW

### Step 1: Run This SQL in Supabase Dashboard

Go to **Supabase Dashboard > SQL Editor** and run this SQL:

```sql
-- EMERGENCY FIX: Add missing columns to automation_campaigns table
-- This fixes the "expected JSON array" error

DO $$ 
BEGIN
    -- Add links_built column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'links_built') THEN
        ALTER TABLE automation_campaigns ADD COLUMN links_built INTEGER DEFAULT 0;
        RAISE NOTICE 'Added links_built column';
    END IF;

    -- Add available_sites column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'available_sites') THEN
        ALTER TABLE automation_campaigns ADD COLUMN available_sites INTEGER DEFAULT 0;
        RAISE NOTICE 'Added available_sites column';
    END IF;

    -- Add target_sites_used column (TEXT array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'target_sites_used') THEN
        ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added target_sites_used column';
    END IF;

    -- Add published_articles column (JSONB array) - THIS FIXES THE "expected JSON array" ERROR
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'published_articles') THEN
        ALTER TABLE automation_campaigns ADD COLUMN published_articles JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added published_articles column';
    END IF;

    -- Add current_platform column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'current_platform') THEN
        ALTER TABLE automation_campaigns ADD COLUMN current_platform TEXT;
        RAISE NOTICE 'Added current_platform column';
    END IF;

    -- Add execution_progress column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'execution_progress') THEN
        ALTER TABLE automation_campaigns ADD COLUMN execution_progress JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added execution_progress column';
    END IF;

    -- Add engine_type column (required by the code)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_campaigns' AND column_name = 'engine_type') THEN
        ALTER TABLE automation_campaigns ADD COLUMN engine_type TEXT DEFAULT 'web2_platforms';
        RAISE NOTICE 'Added engine_type column';
    END IF;
END $$;

-- Update existing records to have proper default values
UPDATE automation_campaigns 
SET 
    links_built = COALESCE(links_built, 0),
    available_sites = COALESCE(available_sites, 0),
    target_sites_used = COALESCE(target_sites_used, '{}'),
    published_articles = COALESCE(published_articles, '[]'::jsonb),
    execution_progress = COALESCE(execution_progress, '{}'::jsonb),
    engine_type = COALESCE(engine_type, 'web2_platforms')
WHERE 
    links_built IS NULL OR 
    available_sites IS NULL OR 
    target_sites_used IS NULL OR 
    published_articles IS NULL OR
    execution_progress IS NULL OR
    engine_type IS NULL;

-- Verify the fix
SELECT 'Schema fix completed - should resolve "expected JSON array" error' as status;

-- Show the columns that were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
  AND column_name IN ('links_built', 'available_sites', 'target_sites_used', 'published_articles', 'current_platform', 'execution_progress', 'engine_type')
ORDER BY column_name;
```

### Step 2: Test the Fix

After running the SQL:

1. **Go back to `/automation`**
2. **Go to "Debug" tab**
3. **Click "Run Test" on "Campaign Creation Fix Test"**
4. **The error should be resolved**

## What This Fix Does

### ✅ Adds Missing Columns:
- `links_built` (INTEGER) - Tracks number of links built
- `available_sites` (INTEGER) - Number of available publishing sites
- `target_sites_used` (TEXT[]) - Array of sites used for publishing
- `published_articles` (JSONB) - **THIS FIXES THE "expected JSON array" ERROR**
- `current_platform` (TEXT) - Current platform being used
- `execution_progress` (JSONB) - Progress tracking data
- `engine_type` (TEXT) - Required engine type field

### ✅ Sets Proper Defaults:
- All existing records get proper default values
- New records will have correct structure
- JSON arrays are properly initialized

### ✅ Resolves The Error:
The "expected JSON array" error was happening because the code was trying to insert/update the `published_articles` field as a JSONB array, but the column didn't exist in the database.

---

## Alternative: Quick Test Without Full Fix

If you want to test immediately without the full schema fix, you can also modify the test to use basic data:

1. Go to the automation page
2. Use the "System Testing" tab instead of the "Debug" tab
3. That test should work with the basic schema

---

🚨 **RUN THE SQL ABOVE TO PERMANENTLY FIX THE "expected JSON array" ERROR**
