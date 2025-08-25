#!/usr/bin/env node

/**
 * Setup Domains Database
 * 
 * This script creates the domains table for the automation link building system
 * according to the schema defined in the ChatGPT conversation.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDomainsDatabase() {
  try {
    console.log('🔧 Setting up domains database...');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'create-domains-table.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema SQL
    console.log('📄 Executing domains table schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSql });

    if (schemaError) {
      console.error('❌ Failed to create domains table:', schemaError);
      
      // Try alternative approach - create table directly
      console.log('🔄 Trying alternative table creation...');
      
      const { error: createError } = await supabase
        .from('domains')
        .select('*')
        .limit(1);

      if (createError && createError.code === '42P01') {
        // Table doesn't exist, create it manually
        console.log('📋 Creating domains table manually...');
        
        const createTableSql = `
          create table if not exists domains (
            id uuid default uuid_generate_v4() primary key,
            name text not null unique,
            site_id text,
            source text default 'manual',
            status text default 'active',
            created_at timestamptz default now(),
            updated_at timestamptz default now()
          );
          
          create index if not exists idx_domains_name on domains(name);
          create index if not exists idx_domains_source on domains(source);
          create index if not exists idx_domains_status on domains(status);
        `;
        
        // This might fail, but we'll continue to test
        await supabase.rpc('exec_sql', { sql: createTableSql }).catch(() => {});
      }
    }

    // Test the table by inserting a test record
    console.log('🧪 Testing domains table...');
    
    const testDomain = {
      name: `test-${Date.now()}.example.com`,
      site_id: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
      source: 'manual',
      status: 'active'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('domains')
      .insert(testDomain)
      .select();

    if (insertError) {
      console.error('❌ Failed to insert test domain:', insertError);
      return false;
    }

    console.log('✅ Test domain inserted:', insertData[0]);

    // Clean up test domain
    const { error: deleteError } = await supabase
      .from('domains')
      .delete()
      .eq('name', testDomain.name);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test domain:', deleteError);
    } else {
      console.log('🧹 Test domain cleaned up');
    }

    // Test the netlify-domains function
    console.log('🔌 Testing netlify-domains function...');
    
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('netlify-domains', {
        method: 'GET'
      });

      if (functionError) {
        console.warn('⚠️ Netlify-domains function test failed:', functionError);
      } else {
        console.log('✅ Netlify-domains function is working');
        console.log(`📊 Found ${functionData?.length || 0} domains from Netlify`);
      }
    } catch (funcError) {
      console.warn('⚠️ Could not test netlify-domains function:', funcError.message);
    }

    console.log('✅ Domains database setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Visit /domains page to test the domain manager');
    console.log('2. Try adding a domain manually');
    console.log('3. Test "Sync from Netlify" functionality');
    console.log('4. Check that domains are stored in the database');

    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

// Export for programmatic use
export { setupDomainsDatabase };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDomainsDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
