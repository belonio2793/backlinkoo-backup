-- Fix Missing Columns in automation_campaigns table
-- Run this SQL in your Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql

-- Step 1: Create exec_sql function (if it doesn't exist)
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

-- Step 3: Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'automation_campaigns'
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;

-- Expected output should show:
-- auto_start   | boolean                  | NO        | false
-- completed_at | timestamp with time zone | YES       | 
-- started_at   | timestamp with time zone | YES       | 

-- Step 4: Test that the columns work by creating a test record
INSERT INTO automation_campaigns (
  name, 
  target_url, 
  engine_type, 
  status, 
  keywords, 
  anchor_texts,
  started_at,
  completed_at,
  auto_start
) VALUES (
  'Test Campaign - Column Fix',
  'https://test-column-fix.com',
  'blog-comments',
  'draft',
  ARRAY['test'],
  ARRAY['test link'],
  NOW(),
  NULL,
  false
) RETURNING id, name, started_at, completed_at, auto_start;

-- Step 5: Clean up test record (replace ID with the one returned above)
-- DELETE FROM automation_campaigns WHERE name = 'Test Campaign - Column Fix';

-- All done! The missing columns should now be available.
