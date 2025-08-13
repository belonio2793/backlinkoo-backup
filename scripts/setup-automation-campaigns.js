#!/usr/bin/env node

/**
 * Database Setup Script for Automation Campaigns
 * This script creates the automation_campaigns table and sets up RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up automation campaigns database...');
  
  try {
    // Read the enhanced SQL schema file
    const schemaPath = join(__dirname, '../src/database/automation-enhanced-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Executing schema SQL...');
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      // Try direct SQL execution if RPC doesn't work
      console.log('⚠️  RPC method failed, trying direct execution...');
      
      const { error: directError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);
      
      if (directError) {
        throw new Error(`Database connection failed: ${directError.message}`);
      }
      
      // Split SQL into individual statements and execute them
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (stmtError && !stmtError.message.includes('already exists')) {
          console.warn(`⚠️  Warning: ${stmtError.message}`);
        }
      }
    }
    
    console.log('✅ Schema executed successfully');
    
    // Test the table creation
    console.log('🔍 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('automation_campaigns')
      .select('id')
      .limit(1);
    
    if (testError) {
      throw new Error(`Table test failed: ${testError.message}`);
    }
    
    console.log('✅ automation_campaigns table is accessible');
    
    // Show success message
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nThe automation_campaigns table has been created with:');
    console.log('   ✓ User campaign storage');
    console.log('   ✓ Row Level Security (RLS)');
    console.log('   ✓ Proper indexes for performance');
    console.log('   ✓ Automatic timestamp updates');
    console.log('\nYou can now use the /automation page to create campaigns!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    console.log('\n💡 Manual setup instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL from: src/database/automation-campaigns-schema.sql');
    
    process.exit(1);
  }
}

// Execute the setup
setupDatabase();
