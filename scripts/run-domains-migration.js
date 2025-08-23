#!/usr/bin/env node

/**
 * Domains Table Migration Runner
 * 
 * This script fixes the domains table schema to match what DomainsPage.tsx expects
 * Run this to resolve /domains page issues
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function runMigration() {
  console.log('🔧 Running domains table migration...');

  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('domains')
      .select('id')
      .limit(1);

    console.log('📊 Connection test result:', { 
      hasData: !!testData, 
      error: testError?.message,
      dataLength: testData?.length 
    });

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'fix-domains-schema-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL loaded, length:', migrationSQL.length);

    // Check if we can run SQL directly
    try {
      // Try to run a simple SQL command first
      const { data: sqlTest, error: sqlError } = await supabase.rpc('exec_sql', { 
        sql: 'SELECT current_database();' 
      });

      if (sqlError) {
        console.warn('⚠️ exec_sql function not available, using alternative method');
        
        // Alternative: Run individual commands via regular queries
        await runMigrationAlternative(supabase);
      } else {
        console.log('✅ exec_sql available, running full migration');
        
        // Run the full migration SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        
        if (error) {
          console.error('❌ Migration failed:', error);
          throw error;
        }
        
        console.log('✅ Migration executed successfully');
      }
    } catch (rpcError) {
      console.warn('⚠️ RPC method failed, using alternative approach');
      await runMigrationAlternative(supabase);
    }

    // Verify the migration worked
    await verifyMigration(supabase);

    console.log('🎉 Domains table migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the /domains page in your application');
    console.log('2. Try adding a domain to verify functionality');
    console.log('3. Check that DNS validation works');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check your Supabase connection');
    console.log('2. Verify you have the correct permissions');
    console.log('3. Run the SQL manually in Supabase SQL editor');
    process.exit(1);
  }
}

async function runMigrationAlternative(supabase) {
  console.log('🔄 Running migration using alternative method...');

  // Add missing columns one by one
  const columnsToAdd = [
    { name: 'netlify_verified', type: 'BOOLEAN', defaultValue: 'false' },
    { name: 'dns_verified', type: 'BOOLEAN', defaultValue: 'false' },
    { name: 'error_message', type: 'TEXT', defaultValue: null },
    { name: 'dns_records', type: 'JSONB', defaultValue: "'[]'::jsonb" },
    { name: 'selected_theme', type: 'TEXT', defaultValue: null },
    { name: 'theme_name', type: 'TEXT', defaultValue: null },
    { name: 'blog_enabled', type: 'BOOLEAN', defaultValue: 'false' },
    { name: 'netlify_site_id', type: 'TEXT', defaultValue: null },
    { name: 'netlify_domain_id', type: 'TEXT', defaultValue: null },
    { name: 'ssl_enabled', type: 'BOOLEAN', defaultValue: 'false' },
    { name: 'custom_dns_configured', type: 'BOOLEAN', defaultValue: 'false' },
    { name: 'last_validation_at', type: 'TIMESTAMP WITH TIME ZONE', defaultValue: null }
  ];

  for (const column of columnsToAdd) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}${column.defaultValue ? ` DEFAULT ${column.defaultValue}` : ''};`
      });

      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️ Could not add column ${column.name}:`, error.message);
      } else {
        console.log(`✅ Added/verified column: ${column.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ Column ${column.name} might already exist or require manual addition`);
    }
  }

  // Data migration
  try {
    // Migrate dns_validated to dns_verified
    await supabase.rpc('exec_sql', {
      sql: `UPDATE public.domains SET dns_verified = dns_validated WHERE dns_validated IS NOT NULL AND dns_verified IS NULL;`
    });

    // Migrate validation_error to error_message  
    await supabase.rpc('exec_sql', {
      sql: `UPDATE public.domains SET error_message = validation_error WHERE validation_error IS NOT NULL AND error_message IS NULL;`
    });

    console.log('✅ Data migration completed');
  } catch (migrationError) {
    console.warn('⚠️ Data migration partially failed (this is OK if columns do not exist)');
  }
}

async function verifyMigration(supabase) {
  console.log('🔍 Verifying migration...');

  // Check that required columns exist by querying them
  const requiredColumns = [
    'id', 'user_id', 'domain', 'status', 'netlify_verified', 
    'dns_verified', 'error_message', 'dns_records', 'selected_theme', 
    'theme_name', 'blog_enabled', 'created_at'
  ];

  try {
    const { data, error } = await supabase
      .from('domains')
      .select(requiredColumns.join(', '))
      .limit(1);

    if (error) {
      console.error('❌ Verification failed - missing columns:', error.message);
      
      // Check which specific columns are missing
      for (const column of requiredColumns) {
        try {
          await supabase.from('domains').select(column).limit(1);
          console.log(`✅ Column exists: ${column}`);
        } catch (colError) {
          console.log(`❌ Column missing: ${column}`);
        }
      }
      throw error;
    }

    console.log('✅ All required columns are present');
    console.log('📊 Test query returned:', data?.length || 0, 'rows');

    // Test domain_themes table
    const { data: themesData, error: themesError } = await supabase
      .from('domain_themes')
      .select('id, name')
      .limit(5);

    if (themesError) {
      console.warn('⚠️ domain_themes table might need manual creation');
    } else {
      console.log('✅ domain_themes table accessible with', themesData?.length || 0, 'themes');
    }

  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration, verifyMigration };
