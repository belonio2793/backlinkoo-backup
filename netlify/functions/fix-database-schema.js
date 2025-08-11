const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Only allow POST requests for security
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Missing Supabase configuration',
        details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found'
      })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔧 Starting database schema fix...');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../../fix-database-schema.sql');
    let migrationSQL;
    
    try {
      migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    } catch (readError) {
      // If file read fails, use inline SQL
      migrationSQL = `
-- Emergency database schema fix
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    record_count integer;
BEGIN
    EXECUTE query;
    IF LOWER(TRIM(query)) LIKE 'select%' THEN
        EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
        RETURN COALESCE(result, '[]'::jsonb);
    ELSE
        GET DIAGNOSTICS record_count = ROW_COUNT;
        RETURN jsonb_build_object('success', true, 'rows_affected', record_count);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM, 'success', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon;

ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_automation_campaigns_started_at ON automation_campaigns(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_campaigns_completed_at ON automation_campaigns(completed_at);
`;
    }

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 5);

    const results = [];
    let errorCount = 0;

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        
        // Use rpc to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          query: statement 
        });

        if (error) {
          // If exec_sql doesn't exist yet, this might be the first statement creating it
          if (error.message.includes('function exec_sql') && statement.includes('CREATE OR REPLACE FUNCTION public.exec_sql')) {
            console.log('exec_sql function creation statement - this is expected to fail initially');
            results.push({
              statement: `Statement ${i + 1}`,
              status: 'skipped',
              note: 'exec_sql function creation requires direct database access'
            });
          } else {
            console.error(`Statement ${i + 1} failed:`, error.message);
            errorCount++;
            results.push({
              statement: `Statement ${i + 1}`,
              status: 'error',
              error: error.message
            });
          }
        } else {
          results.push({
            statement: `Statement ${i + 1}`,
            status: 'success',
            data: data
          });
        }
      } catch (execError) {
        console.error(`Statement ${i + 1} execution failed:`, execError);
        errorCount++;
        results.push({
          statement: `Statement ${i + 1}`,
          status: 'error',
          error: execError.message
        });
      }
    }

    // Test if the migration worked
    let testResult = null;
    try {
      const { data: testData, error: testError } = await supabase.rpc('exec_sql', { 
        query: "SELECT 'Migration test successful' as test_result" 
      });
      
      if (!testError) {
        testResult = { success: true, data: testData };
      } else {
        testResult = { success: false, error: testError.message };
      }
    } catch (testErr) {
      testResult = { success: false, error: testErr.message };
    }

    // Check columns
    let columnCheck = null;
    try {
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'automation_campaigns')
        .in('column_name', ['started_at', 'completed_at', 'auto_start']);

      if (!colError) {
        columnCheck = { success: true, columns: columns };
      } else {
        columnCheck = { success: false, error: colError.message };
      }
    } catch (colErr) {
      columnCheck = { success: false, error: colErr.message };
    }

    console.log('✅ Database schema fix completed');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database schema fix completed',
        summary: {
          totalStatements: statements.length,
          errors: errorCount,
          successRate: `${Math.round(((statements.length - errorCount) / statements.length) * 100)}%`
        },
        testResult,
        columnCheck,
        details: results,
        note: errorCount > 0 ? 'Some statements failed. Manual database migration may be required.' : 'All statements executed successfully.'
      })
    };

  } catch (error) {
    console.error('❌ Database schema fix failed:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Database schema fix failed',
        details: error.message,
        suggestion: 'Please run the SQL migration manually through your database admin panel or contact support.'
      })
    };
  }
};
