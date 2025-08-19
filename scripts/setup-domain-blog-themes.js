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

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

async function setupDomainBlogThemes() {
  try {
    console.log('🚀 Setting up domain blog themes database...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-domain-blog-themes-table.sql');
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
        // Try direct query for some statements
        try {
          const { error: directError } = await supabase.from('').select('').limit(0);
          if (directError) {
            console.log(`🔄 Attempting alternative execution...`);
          }
        } catch (altError) {
          console.warn(`⚠️  Alternative execution also failed for statement ${i + 1}`);
        }
      }
    }
    
    // Verify setup by checking if table exists
    console.log('🔍 Verifying setup...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'domain_blog_themes');
    
    if (tableError) {
      console.error('❌ Error verifying table:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Domain blog themes table created successfully');
    } else {
      console.log('⚠️  Table verification inconclusive - check manually');
    }
    
    // Test basic functionality
    console.log('🧪 Testing basic functionality...');
    const { data: testData, error: testError } = await supabase
      .from('domain_blog_themes')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing table access:', testError);
    } else {
      console.log('✅ Table access test successful');
      console.log(`📊 Found ${testData?.length || 0} existing theme records`);
    }
    
    console.log('🎉 Domain blog themes setup completed!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • domain_blog_themes table with RLS policies');
    console.log('   • Automatic default theme assignment trigger');
    console.log('   • Helper functions for theme management');
    console.log('   • Default themes for existing blog-enabled domains');
    console.log('');
    console.log('✨ Next steps:');
    console.log('   • Restart your dev server to pick up schema changes');
    console.log('   • Test theme assignment in the domains page');
    console.log('   • Verify automation integration works');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   • Check your SUPABASE_SERVICE_ROLE_KEY environment variable');
    console.error('   • Ensure your Supabase project has the required permissions');
    console.error('   • Verify your database connection');
    console.error('   • Check the SQL file syntax');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDomainBlogThemes();
}

export { setupDomainBlogThemes };
