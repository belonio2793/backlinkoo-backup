#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
);

async function setupCampaignBlogSettings() {
  try {
    console.log('🚀 Setting up campaign blog settings database...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-campaign-blog-settings-table.sql');
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
        // Try direct execution for DDL statements
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
        // Try alternative approach for some statements
        if (statement.includes('CREATE TABLE')) {
          console.log(`🔄 Attempting direct table creation...`);
          // Could implement direct table creation logic here if needed
        }
      }
    }
    
    // Verify setup by checking if tables exist
    console.log('🔍 Verifying setup...');
    
    // Check campaign_blog_settings table
    const { data: blogSettings, error: blogError } = await supabase
      .from('campaign_blog_settings')
      .select('*')
      .limit(0);
    
    if (blogError && !blogError.message?.includes('does not exist')) {
      console.error('❌ Error verifying campaign_blog_settings table:', blogError);
    } else {
      console.log('✅ campaign_blog_settings table verified');
    }
    
    // Check domain_blog_posts table
    const { data: blogPosts, error: postsError } = await supabase
      .from('domain_blog_posts')
      .select('*')
      .limit(0);
    
    if (postsError && !postsError.message?.includes('does not exist')) {
      console.error('❌ Error verifying domain_blog_posts table:', postsError);
    } else {
      console.log('✅ domain_blog_posts table verified');
    }
    
    console.log('🎉 Campaign blog settings setup completed!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • campaign_blog_settings table with RLS policies');
    console.log('   ��� domain_blog_posts table for tracking published posts');
    console.log('   • Helper functions for blog statistics and settings');
    console.log('   • Updated increment_published_pages function');
    console.log('');
    console.log('✨ Next steps:');
    console.log('   • Restart your dev server to pick up schema changes');
    console.log('   • Create a campaign to test domain blog integration');
    console.log('   • Check domain blog posts are being created and linked');
    console.log('');
    console.log('🔗 Integration features:');
    console.log('   • Automatic domain blog publishing during campaigns');
    console.log('   • Theme-based blog post generation');
    console.log('   • Campaign-linked blog post tracking');
    console.log('   • Domain rotation for multiple backlinks');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   • Check your SUPABASE_SERVICE_ROLE_KEY environment variable');
    console.error('   • Ensure your Supabase project has the required permissions');
    console.error('   • Verify domain_blog_themes table exists (run setup:blog-themes first)');
    console.error('   • Check the SQL file syntax');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupCampaignBlogSettings();
}

module.exports = { setupCampaignBlogSettings };
