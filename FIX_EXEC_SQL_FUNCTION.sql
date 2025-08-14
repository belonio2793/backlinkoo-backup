-- Fix exec_sql function conflict
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing exec_sql function if it exists
DROP FUNCTION IF EXISTS exec_sql(text);
DROP FUNCTION IF EXISTS public.exec_sql(text);

-- Step 2: Create the correct exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TABLE(result TEXT) AS $$
BEGIN
    RETURN QUERY EXECUTE query;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT SQLSTATE || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant necessary permissions
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;

-- Step 4: Test the function
SELECT exec_sql('SELECT ''Function created successfully'' as status;');
