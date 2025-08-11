-- ========================================================================
-- SUPABASE DATABASE FIX - Copy and paste this entire script into Supabase SQL Editor
-- ========================================================================
-- This will fix all missing columns and functions for your automation system

-- Step 1: Create or recreate the exec_sql function (in case it's missing or broken)
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    record_count integer;
BEGIN
    -- Execute dynamic SQL and capture result
    EXECUTE query;
    
    -- For SELECT statements, try to return data
    IF LOWER(TRIM(query)) LIKE 'select%' THEN
        EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
        RETURN COALESCE(result, '[]'::jsonb);
    ELSE
        -- For DDL/DML statements, return success status
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RETURN jsonb_build_object('success', true, 'rows_affected', record_count);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM, 'success', false);
END;
$$;

-- Grant execute permissions to all user roles
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;

-- Step 2: Add missing columns to automation_campaigns table
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Verify auto_start column exists (should already be there)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'automation_campaigns' 
        AND column_name = 'auto_start'
    ) THEN
        ALTER TABLE automation_campaigns 
        ADD COLUMN auto_start BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Step 3: Create performance indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at 
ON automation_campaigns(started_at);

CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at 
ON automation_campaigns(completed_at);

-- Step 4: Update existing data to be consistent
-- Set started_at for any active campaigns that don't have it
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE status = 'active' AND started_at IS NULL;

-- Set started_at for auto_start campaigns
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE auto_start = true AND started_at IS NULL;

-- Step 5: Create a test function to verify everything works
CREATE OR REPLACE FUNCTION public.test_automation_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    column_count integer;
BEGIN
    -- Test that we can query all required columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'automation_campaigns' 
    AND column_name IN ('started_at', 'completed_at', 'auto_start');
    
    IF column_count = 3 THEN
        result = jsonb_build_object(
            'status', 'success',
            'message', 'All required columns exist',
            'columns_found', column_count
        );
    ELSE
        result = jsonb_build_object(
            'status', 'error',
            'message', 'Missing columns detected',
            'columns_found', column_count,
            'expected', 3
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Grant execute permissions for test function
GRANT EXECUTE ON FUNCTION public.test_automation_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_automation_schema() TO service_role;
GRANT EXECUTE ON FUNCTION public.test_automation_schema() TO anon;

-- Step 6: Verification queries to confirm everything is working
-- Check that all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;

-- Test the exec_sql function
SELECT public.exec_sql('SELECT COUNT(*) as total_campaigns FROM automation_campaigns') as exec_sql_test;

-- Test the schema validation function
SELECT public.test_automation_schema() as schema_test;

-- Final success message
SELECT 'Database migration completed successfully! All automation features should now work.' as status;
