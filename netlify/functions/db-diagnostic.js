const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    // Get table structure for backlink_campaigns
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', {
      table_name: 'backlink_campaigns'
    });

    if (tableError) {
      console.error('Table info error:', tableError);
    }

    // Try to query the table structure using information_schema
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'backlink_campaigns');

    if (columnError) {
      console.error('Column info error:', columnError);
    }

    // Try a simple select to see what happens
    const { data: testData, error: testError } = await supabase
      .from('backlink_campaigns')
      .select('*')
      .limit(1);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tableInfo,
        columnInfo,
        testData,
        errors: {
          tableError,
          columnError,
          testError
        }
      })
    };

  } catch (error) {
    console.error('Diagnostic error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};
