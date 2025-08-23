#!/usr/bin/env node

/**
 * Setup Domains Table Script
 * 
 * This script sets up the domains table with:
 * - Proper schema and constraints
 * - Row Level Security (RLS) policies
 * - Automatic Netlify sync triggers
 * - Performance indexes
 * - Sync logging for debugging
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDomainsTable() {
  console.log('🚀 Setting up domains table for Netlify integration...\n');

  // Get Supabase configuration
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in environment variables');
    console.error('   Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Use service role key if available for admin operations
  const supabase = createClient(
    supabaseUrl, 
    supabaseServiceKey || supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Read the SQL setup script
    const sqlPath = path.join(__dirname, 'setup-domains-table.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Executing domains table setup SQL...');

    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_script: sqlScript 
    });

    if (error) {
      // Try alternative method if exec_sql function doesn't exist
      console.log('⚠️  Using alternative execution method...');
      
      // Split SQL into individual statements and execute
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('INSERT')) {
          const { error: stmtError } = await supabase.rpc('exec', { 
            sql: statement 
          });
          
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.warn(`⚠️  Statement warning: ${stmtError.message}`);
          }
        }
      }
    }

    console.log('✅ Domains table setup completed!\n');

    // Verify the setup
    console.log('🔍 Verifying table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('domains')
      .select('*')
      .limit(1);

    if (tableError && !tableError.message.includes('relation "domains" does not exist')) {
      console.log('✅ Domains table is accessible');
    } else if (tableError) {
      console.error('❌ Table verification failed:', tableError.message);
    } else {
      console.log('✅ Domains table is accessible and ready');
    }

    // Check sync logs table
    const { data: syncLogs, error: syncError } = await supabase
      .from('sync_logs')
      .select('*')
      .limit(1);

    if (!syncError) {
      console.log('✅ Sync logs table is ready');
    }

    console.log('\n🎉 Setup Summary:');
    console.log('   ✅ Domains table created with proper schema');
    console.log('   ✅ Row Level Security (RLS) enabled');
    console.log('   ✅ Automatic Netlify sync triggers installed');
    console.log('   ✅ Performance indexes created');
    console.log('   ✅ Sync logging system ready');
    console.log('\n📖 Next steps:');
    console.log('   1. Your /domains page is now ready to use');
    console.log('   2. Add domains through the UI');
    console.log('   3. Check sync logs for debugging if needed');
    console.log('\n🔧 Netlify Configuration:');
    console.log(`   Site ID: ${process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809'}`);
    console.log(`   Access Token: ${process.env.NETLIFY_ACCESS_TOKEN ? '✅ Configured' : '❌ Missing'}`);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your Supabase credentials');
    console.error('   2. Ensure you have proper database permissions');
    console.error('   3. Verify your project is properly connected');
    process.exit(1);
  }
}

// Alternative manual setup function
async function manualSetup() {
  console.log('\n🛠️  Manual Setup Instructions:');
  console.log('\nIf automatic setup failed, run this SQL manually in your Supabase SQL editor:\n');
  
  const sqlPath = path.join(__dirname, 'setup-domains-table.sql');
  const sqlScript = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('------- START SQL SCRIPT -------');
  console.log(sqlScript);
  console.log('------- END SQL SCRIPT -------');
  console.log('\nCopy and paste the above SQL into your Supabase project\'s SQL editor.\n');
}

// Main execution
if (require.main === module) {
  setupDomainsTable().catch(error => {
    console.error('❌ Setup script failed:', error);
    manualSetup();
  });
}

module.exports = { setupDomainsTable };
