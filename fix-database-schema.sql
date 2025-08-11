-- ===============================================================================
-- EMERGENCY DATABASE SCHEMA FIX
-- Fixes missing exec_sql function and automation_campaigns columns
-- ===============================================================================

-- 1. Create the exec_sql function that many scripts depend on
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;

-- 2. Add missing columns to automation_campaigns table
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Verify auto_start column exists (should already be there from the schema)
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

-- 3. Create performance indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at 
ON automation_campaigns(started_at);

CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at 
ON automation_campaigns(completed_at);

-- 4. Update existing active campaigns to have started_at if null
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE status = 'active' AND started_at IS NULL;

-- 5. Initialize auto_start campaigns with started_at
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE auto_start = true AND started_at IS NULL;

-- 6. Create a test function to verify exec_sql works
CREATE OR REPLACE FUNCTION public.test_exec_sql()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.exec_sql('SELECT ''exec_sql function is working'' as status');
END;
$$;

-- Grant execute permissions for test function
GRANT EXECUTE ON FUNCTION public.test_exec_sql() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_exec_sql() TO service_role;
GRANT EXECUTE ON FUNCTION public.test_exec_sql() TO anon;

-- 7. Verification query to confirm everything is working
SELECT 'Schema migration completed successfully' as result;

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;

-- Test exec_sql function
SELECT public.exec_sql('SELECT COUNT(*) as campaign_count FROM automation_campaigns') as exec_sql_test;
