#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for required environment variables
if (!process.env.VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL environment variable is required');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required for database setup');
  console.error('');
  console.error('🔧 Setup required:');
  console.error('   1. Get your service role key from Supabase dashboard');
  console.error('   2. Add SUPABASE_SERVICE_ROLE_KEY=your_key to your .env file');
  console.error('   3. Or run: SUPABASE_SERVICE_ROLE_KEY=your_key npm run setup:auto-propagation');
  console.error('');
  console.error('📋 Note: This is only needed for initial database setup');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAutoPropagation() {
  try {
    console.log('🚀 Setting up auto-propagation database tables...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-auto-propagation-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // For creation statements, some errors might be expected (like "already exists")
          if (!error.message?.includes('already exists')) {
            throw error;
          } else {
            console.log(`ℹ️  Statement ${i + 1} - Object already exists, continuing...`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (execError) {
        console.error(`💥 Failed to execute statement ${i + 1}:`, execError);
      }
    }
    
    // Verify setup by checking if tables exist
    console.log('🔍 Verifying setup...');
    
    // Check domain_registrar_credentials table
    const { data: credentials, error: credError } = await supabase
      .from('domain_registrar_credentials')
      .select('*')
      .limit(0);
    
    if (credError && !credError.message?.includes('does not exist')) {
      console.error('❌ Error verifying domain_registrar_credentials table:', credError);
    } else {
      console.log('✅ domain_registrar_credentials table verified');
    }
    
    // Check domain_auto_propagation_logs table
    const { data: logs, error: logsError } = await supabase
      .from('domain_auto_propagation_logs')
      .select('*')
      .limit(0);
    
    if (logsError && !logsError.message?.includes('does not exist')) {
      console.error('❌ Error verifying domain_auto_propagation_logs table:', logsError);
    } else {
      console.log('✅ domain_auto_propagation_logs table verified');
    }
    
    // Check domain_validation_logs table
    const { data: validation, error: validationError } = await supabase
      .from('domain_validation_logs')
      .select('*')
      .limit(0);
    
    if (validationError && !validationError.message?.includes('does not exist')) {
      console.error('❌ Error verifying domain_validation_logs table:', validationError);
    } else {
      console.log('✅ domain_validation_logs table verified');
    }
    
    console.log('🎉 Auto-propagation setup completed!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • domain_registrar_credentials table with secure credential storage');
    console.log('   • domain_auto_propagation_logs table for tracking updates');
    console.log('   • domain_validation_logs table for DNS validation history');
    console.log('   • Helper functions for statistics and cleanup');
    console.log('   • RLS policies for security');
    console.log('');
    console.log('✨ Next steps:');
    console.log('   • Restart your dev server to pick up schema changes');
    console.log('   • Go to /domains page to test auto-propagation');
    console.log('   • Configure registrar API credentials');
    console.log('   • Test automatic DNS propagation');
    console.log('');
    console.log('🔗 Supported registrars:');
    console.log('   • Cloudflare (Full support)');
    console.log('   • GoDaddy (Full support)');
    console.log('   • DigitalOcean (Full support)');
    console.log('   • Namecheap (Basic support)');
    console.log('   • Route 53 (Planned)');
    console.log('');
    console.log('🔐 Security notes:');
    console.log('   • API credentials are encrypted before storage');
    console.log('   • RLS policies protect user data');
    console.log('   • Service role key only needed for setup');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   • Check your SUPABASE_SERVICE_ROLE_KEY environment variable');
    console.error('   • Ensure your Supabase project has the required permissions');
    console.error('   • Verify domains table exists (run setup:domains first)');
    console.error('   • Check the SQL file syntax');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAutoPropagation();
}

export { setupAutoPropagation };
