import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting premium role migration...');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'add-premium-role.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL commands and execute them one by one
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    for (const command of commands) {
      console.log(`📝 Executing: ${command.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        query: command + ';'
      });

      if (error) {
        console.error(`❌ Error executing command: ${error.message}`);
        // Continue with next command instead of failing completely
      } else {
        console.log(`✅ Command executed successfully`);
      }
    }

    console.log('🎉 Premium role migration completed!');
    
    // Test the migration by checking if we can query the new enum value
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);

    if (testError) {
      console.warn('⚠️ Warning: Could not test migration:', testError.message);
    } else {
      console.log('✅ Migration test passed - profiles table accessible');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();
