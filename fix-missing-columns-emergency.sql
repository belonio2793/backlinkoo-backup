-- Emergency Fix for Missing Columns
-- Run this in your Supabase SQL Editor to fix the missing columns immediately

-- Step 1: Create exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN json_build_object('rows_affected', result);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- Step 2: Add missing columns to automation_campaigns table
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false NOT NULL;

-- Step 3: Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND table_schema = 'public'
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;

-- Step 4: Test that the columns work
SELECT 
  id, 
  name, 
  status, 
  started_at, 
  completed_at, 
  auto_start 
FROM automation_campaigns 
LIMIT 1;
