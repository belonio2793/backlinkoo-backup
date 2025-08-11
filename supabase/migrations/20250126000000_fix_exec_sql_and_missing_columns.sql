-- ===================================================================
-- FIX MISSING exec_sql FUNCTION AND AUTOMATION CAMPAIGN COLUMNS
-- ===================================================================
-- This migration creates the missing exec_sql function and adds missing columns

-- Create the exec_sql function that many scripts depend on
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Add missing columns to automation_campaigns table
ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

ALTER TABLE automation_campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

-- Verify auto_start column exists (it should from the main schema)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at 
ON automation_campaigns(started_at);

CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at 
ON automation_campaigns(completed_at);

-- Update any existing active campaigns to have started_at if null
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE status = 'active' AND started_at IS NULL;

-- Ensure auto_start campaigns are properly initialized
UPDATE automation_campaigns 
SET started_at = COALESCE(started_at, created_at)
WHERE auto_start = true AND started_at IS NULL;

-- Create a test function to verify exec_sql works
CREATE OR REPLACE FUNCTION public.test_exec_sql()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.exec_sql('SELECT ''exec_sql function is working'' as status');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.test_exec_sql() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_exec_sql() TO service_role;

-- Success verification
SELECT 'exec_sql function and missing columns created successfully' as result;
