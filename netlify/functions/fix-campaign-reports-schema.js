const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔧 Starting campaign_reports schema fix...');

    // Check if the columns exist by trying to select from the table
    let hasGeneratedAt = false;
    let hasReportName = false;
    let hasReportType = false;
    let hasReportData = false;

    try {
      const { data, error } = await supabase
        .from('campaign_reports')
        .select('generated_at, report_name, report_type, report_data')
        .limit(1);
      
      if (!error) {
        hasGeneratedAt = true;
        hasReportName = true;
        hasReportType = true;
        hasReportData = true;
      }
    } catch (e) {
      console.log('Some columns missing, will add them...');
    }

    // SQL statements to add missing columns
    const alterStatements = [];

    if (!hasReportName) {
      alterStatements.push(`
        ALTER TABLE campaign_reports 
        ADD COLUMN IF NOT EXISTS report_name TEXT NOT NULL DEFAULT 'Unnamed Report';
      `);
    }

    if (!hasReportType) {
      alterStatements.push(`
        ALTER TABLE campaign_reports 
        ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'summary';
      `);
      
      alterStatements.push(`
        ALTER TABLE campaign_reports 
        ADD CONSTRAINT IF NOT EXISTS check_report_type 
        CHECK (report_type IN ('summary', 'detailed', 'performance', 'links'));
      `);
    }

    if (!hasGeneratedAt) {
      alterStatements.push(`
        ALTER TABLE campaign_reports 
        ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `);
    }

    if (!hasReportData) {
      alterStatements.push(`
        ALTER TABLE campaign_reports 
        ADD COLUMN IF NOT EXISTS report_data JSONB DEFAULT '{}'::jsonb;
      `);
    }

    // Create indexes
    alterStatements.push(`
      CREATE INDEX IF NOT EXISTS idx_campaign_reports_generated_at 
      ON campaign_reports(generated_at);
    `);
    
    alterStatements.push(`
      CREATE INDEX IF NOT EXISTS idx_campaign_reports_report_type 
      ON campaign_reports(report_type);
    `);

    // Update existing records
    if (!hasGeneratedAt) {
      alterStatements.push(`
        UPDATE campaign_reports 
        SET generated_at = COALESCE(created_at, NOW()) 
        WHERE generated_at IS NULL;
      `);
    }

    // Execute each SQL statement using a function
    const results = [];
    
    for (const sql of alterStatements) {
      try {
        // Try to execute using a stored procedure
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: sql.trim() 
        });

        if (error) {
          console.log('RPC exec_sql not available, trying direct execution...');
          // If RPC fails, log the SQL for manual execution
          results.push({ 
            sql: sql.trim(), 
            success: false, 
            error: error.message,
            manualExecution: true
          });
        } else {
          results.push({ 
            sql: sql.trim(), 
            success: true, 
            result: data 
          });
        }
      } catch (e) {
        results.push({ 
          sql: sql.trim(), 
          success: false, 
          error: e.message,
          manualExecution: true
        });
      }
    }

    // Test if the fix worked by trying to query with the new columns
    let testResult = null;
    try {
      const { data, error } = await supabase
        .from('campaign_reports')
        .select('id, report_name, report_type, generated_at, report_data')
        .limit(1);
      
      if (error) {
        testResult = { success: false, error: error.message };
      } else {
        testResult = { success: true, message: 'Schema fix successful' };
      }
    } catch (e) {
      testResult = { success: false, error: e.message };
    }

    const response = {
      success: true,
      message: 'Schema fix completed',
      results,
      testResult,
      manualSQLRequired: results.some(r => r.manualExecution),
      manualSQL: results.filter(r => r.manualExecution).map(r => r.sql)
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error fixing schema:', error);
    
    // Provide manual SQL statements as fallback
    const manualSQL = `
      -- Add missing columns to campaign_reports table
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_name TEXT NOT NULL DEFAULT 'Unnamed Report';
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'summary';
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_data JSONB DEFAULT '{}'::jsonb;
      
      -- Add constraints
      ALTER TABLE campaign_reports ADD CONSTRAINT IF NOT EXISTS check_report_type CHECK (report_type IN ('summary', 'detailed', 'performance', 'links'));
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_campaign_reports_generated_at ON campaign_reports(generated_at);
      CREATE INDEX IF NOT EXISTS idx_campaign_reports_report_type ON campaign_reports(report_type);
      
      -- Update existing records
      UPDATE campaign_reports SET generated_at = COALESCE(created_at, NOW()) WHERE generated_at IS NULL;
    `;

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        manualSQL,
        instructions: 'Please run the provided SQL manually in your Supabase dashboard'
      })
    };
  }
};
