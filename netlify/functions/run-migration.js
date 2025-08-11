const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Supabase configuration' })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const migrationSQL = `
-- ===================================================================
-- FIX MISSING exec_sql FUNCTION AND AUTOMATION CAMPAIGN COLUMNS
-- ===================================================================

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

-- Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'automation_campaigns' 
AND column_name IN ('started_at', 'completed_at', 'auto_start')
ORDER BY column_name;
`;

  try {
    console.log('🔧 Running database migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: migrationSQL });
    
    if (error) {
      // If exec_sql doesn't exist, execute the SQL directly
      console.log('exec_sql not available, executing SQL directly...');
      
      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'))
        .filter(s => !s.match(/^\s*$/));

      const results = [];
      
      for (const statement of statements) {
        if (statement.includes('SELECT')) {
          // For SELECT statements, use rpc if available
          const { data: selectData, error: selectError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'automation_campaigns')
            .in('column_name', ['started_at', 'completed_at', 'auto_start']);
            
          if (!selectError) {
            results.push({ statement: 'column_check', data: selectData });
          }
        } else {
          // For other statements, they need to be executed at the database level
          console.log('Statement needs direct database execution:', statement.substring(0, 50) + '...');
        }
      }
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: true, 
          message: 'Migration partially executed (direct SQL execution required for functions)',
          results: results,
          note: 'Some statements require direct database access. Please run the migration manually or through Supabase dashboard.'
        })
      };
    }

    // Test the exec_sql function
    const { data: testData, error: testError } = await supabase.rpc('test_exec_sql');
    
    console.log('✅ Migration completed successfully');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Database migration completed successfully',
        migrationResult: data,
        testResult: testData
      })
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Migration failed', 
        details: error.message,
        suggestion: 'Please run the migration manually through Supabase dashboard'
      })
    };
  }
};
