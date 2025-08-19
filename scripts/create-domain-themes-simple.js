#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase with anon key (limited permissions)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDomainThemesTable() {
  console.log('🔍 Checking domain_blog_themes table status...');
  
  try {
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('domain_blog_themes')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ domain_blog_themes table does not exist');
        console.log('');
        console.log('🛠️  To fix this issue:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run the SQL from: scripts/create-domain-blog-themes-table.sql');
        console.log('   4. Or run: npm run setup:blog-themes (requires service role key)');
        console.log('');
        console.log('📋 Required SQL commands:');
        console.log('   - Create domain_blog_themes table');
        console.log('   - Set up RLS policies');
        console.log('   - Create update_domain_blog_theme function');
        console.log('   - Add default themes for existing domains');
        
        return false;
      } else {
        console.log('⚠️  Table exists but has permission issues:', error.message);
        console.log('');
        console.log('🔧 Possible solutions:');
        console.log('   1. Check RLS policies in Supabase dashboard');
        console.log('   2. Ensure user authentication is working');
        console.log('   3. Verify table permissions');
        
        return false;
      }
    }

    console.log('✅ domain_blog_themes table exists and is accessible');
    console.log(`📊 Current record count: ${data?.length || 0}`);
    return true;
    
  } catch (error) {
    console.log('❌ Network error checking table:', error.message);
    console.log('');
    console.log('🌐 This could be:');
    console.log('   1. Network connectivity issue');
    console.log('   2. Supabase service unavailable');
    console.log('   3. Invalid Supabase configuration');
    
    return false;
  }
}

async function main() {
  console.log('🚀 Domain Blog Themes - Database Status Check');
  console.log('='.repeat(50));
  
  const tableExists = await checkDomainThemesTable();
  
  if (tableExists) {
    console.log('');
    console.log('✅ All good! Domain themes should work properly.');
  } else {
    console.log('');
    console.log('⚠️  Domain themes will use fallback mode until database is set up.');
  }
  
  console.log('');
  console.log('📖 For more help, see: DOMAIN_PRODUCTION_FALLBACK_REMOVAL.md');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkDomainThemesTable };
