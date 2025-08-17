const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🔧 Starting published links schema fix...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Missing Supabase configuration',
        details: 'VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check current schema
    console.log('📋 Checking current automation_published_links schema...');
    
    const { data: currentColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'automation_published_links')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to check current schema', details: columnsError })
      };
    }

    console.log('📋 Current columns:', currentColumns?.map(c => c.column_name) || []);

    // Define required columns
    const requiredColumns = [
      { name: 'anchor_text', type: 'TEXT', nullable: true },
      { name: 'target_url', type: 'TEXT', nullable: true },
      { name: 'keyword', type: 'TEXT', nullable: true },
      { name: 'validation_status', type: 'TEXT', default: 'pending' },
      { name: 'status', type: 'TEXT', default: 'active' },
      { name: 'published_at', type: 'TIMESTAMPTZ', default: 'NOW()' }
    ];

    const existingColumns = currentColumns?.map(c => c.column_name) || [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col.name));

    console.log('🔍 Missing columns:', missingColumns.map(c => c.name));

    // Add missing columns
    const results = [];
    for (const column of missingColumns) {
      console.log(`📝 Adding column: ${column.name}`);
      
      let sql = `ALTER TABLE automation_published_links ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`;
      if (column.default) {
        sql += ` DEFAULT ${column.default}`;
      }
      sql += ';';

      try {
        const { error } = await supabase.rpc('exec_sql', { query: sql });
        if (error) {
          console.warn(`⚠️ Warning adding ${column.name}:`, error.message);
          results.push({
            column: column.name,
            status: 'warning',
            message: error.message
          });
        } else {
          console.log(`✅ Successfully added: ${column.name}`);
          results.push({
            column: column.name,
            status: 'success',
            message: 'Column added successfully'
          });
        }
      } catch (err) {
        console.error(`❌ Error adding ${column.name}:`, err.message);
        results.push({
          column: column.name,
          status: 'error',
          message: err.message
        });
      }
    }

    // Verify final schema
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'automation_published_links')
      .eq('table_schema', 'public');

    if (finalError) {
      console.warn('⚠️ Could not verify final schema:', finalError.message);
    } else {
      console.log('✅ Final schema verified:', finalColumns?.map(c => `${c.column_name}:${c.data_type}`) || []);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Schema fix completed',
        missingColumns: missingColumns.map(c => c.name),
        results,
        finalColumns: finalColumns?.map(c => c.column_name) || []
      })
    };

  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Schema fix failed', 
        details: error.message,
        stack: error.stack 
      })
    };
  }
};
