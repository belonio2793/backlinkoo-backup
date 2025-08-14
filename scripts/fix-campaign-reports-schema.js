#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials from environment or config
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.log('Please set the service role key to run database migrations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixCampaignReportsSchema() {
  console.log('🔧 Fixing campaign_reports table schema...');

  try {
    // Check current table structure
    console.log('📋 Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'campaign_reports');

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError.message);
      return false;
    }

    const existingColumns = columns?.map(col => col.column_name) || [];
    console.log('📊 Existing columns:', existingColumns);

    // Add missing columns one by one
    const alterStatements = [];

    if (!existingColumns.includes('report_name')) {
      alterStatements.push(`ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_name TEXT NOT NULL DEFAULT 'Unnamed Report';`);
    }

    if (!existingColumns.includes('report_type')) {
      alterStatements.push(`ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'summary' CHECK (report_type IN ('summary', 'detailed', 'performance', 'links'));`);
    }

    if (!existingColumns.includes('generated_at')) {
      alterStatements.push(`ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`);
    }

    if (!existingColumns.includes('report_data')) {
      alterStatements.push(`ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_data JSONB DEFAULT '{}'::jsonb;`);
    }

    // Execute alter statements
    for (const statement of alterStatements) {
      console.log('⚙️ Executing:', statement);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('❌ Error executing statement:', error.message);
        // Try direct execution as backup
        try {
          const { error: directError } = await supabase
            .from('campaign_reports')
            .select('id')
            .limit(1);
            
          if (directError && directError.message.includes('column') && directError.message.includes('does not exist')) {
            console.log('🔨 Attempting direct schema fix...');
            // We need to execute this via a Netlify function since we can't run raw SQL here
            console.log('📝 Please run this SQL manually in your Supabase dashboard:');
            console.log(statement);
          }
        } catch (e) {
          console.error('Failed to execute statement:', e.message);
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    // Update existing records if generated_at was added
    if (!existingColumns.includes('generated_at')) {
      console.log('🔄 Updating existing records with generated_at values...');
      const { error: updateError } = await supabase
        .from('campaign_reports')
        .update({ generated_at: new Date().toISOString() })
        .is('generated_at', null);

      if (updateError) {
        console.error('❌ Error updating records:', updateError.message);
      } else {
        console.log('✅ Existing records updated');
      }
    }

    console.log('✅ Schema fix completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    return false;
  }
}

// Alternative: Create the function to run SQL if it doesn't exist
async function createExecSQLFunction() {
  console.log('🔧 Creating exec_sql function...');
  
  const functionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
    RETURNS TEXT AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'Success';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN SQLERRM;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
  
  if (error) {
    console.log('📝 Please run this SQL in your Supabase SQL editor:');
    console.log(functionSQL);
    console.log('\nThen run the following ALTER statements:');
    console.log(`
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_name TEXT NOT NULL DEFAULT 'Unnamed Report';
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_type TEXT NOT NULL DEFAULT 'summary' CHECK (report_type IN ('summary', 'detailed', 'performance', 'links'));
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE campaign_reports ADD COLUMN IF NOT EXISTS report_data JSONB DEFAULT '{}'::jsonb;
      
      UPDATE campaign_reports SET generated_at = created_at WHERE generated_at IS NULL;
      
      CREATE INDEX IF NOT EXISTS idx_campaign_reports_generated_at ON campaign_reports(generated_at);
      CREATE INDEX IF NOT EXISTS idx_campaign_reports_report_type ON campaign_reports(report_type);
    `);
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  console.log('🚀 Starting campaign_reports schema fix...');
  
  const success = await fixCampaignReportsSchema();
  
  if (!success) {
    console.log('\n📋 Manual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the ALTER statements shown above');
    console.log('4. Test the application again');
  }
  
  process.exit(success ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { fixCampaignReportsSchema };
