/**
 * Database Permission Fix Helper
 * 
 * Instructions:
 * 1. Go to Supabase Dashboard → SQL Editor
 * 2. Copy and paste the SQL from fix-rls-policies.sql
 * 3. Run the SQL script
 * 4. Refresh your application
 * 
 * This script tests the database connection and provides guidance.
 */

import { supabase } from '../src/integrations/supabase/client.ts';

async function testDatabasePermissions() {
  console.log('🔍 Testing database permissions...');
  
  try {
    // Test basic auth connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Auth connection successful');
    
    if (!user) {
      console.log('ℹ️  No user logged in - this is normal for testing');
    } else {
      console.log('✅ User authenticated:', user.email);
    }
    
    // Test profiles table access
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (profileError) {
        console.error('❌ Profiles table error:', profileError);
        console.log('🔧 This indicates RLS policy issues - run the SQL fix script');
      } else {
        console.log('✅ Profiles table accessible');
      }
    } catch (error) {
      console.error('❌ Profiles table catch error:', error);
    }
    
    // Test campaigns table access
    try {
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .limit(1);
        
      if (campaignError) {
        console.error('❌ Campaigns table error:', campaignError);
      } else {
        console.log('✅ Campaigns table accessible');
      }
    } catch (error) {
      console.error('❌ Campaigns table catch error:', error);
    }
    
    // Test campaign_runtime_metrics table access
    try {
      const { data: metrics, error: metricsError } = await supabase
        .from('campaign_runtime_metrics')
        .select('*')
        .limit(1);
        
      if (metricsError) {
        console.error('❌ Campaign metrics table error:', metricsError);
        if (metricsError.code === '42501') {
          console.log('🔧 This is the "permission denied" error - run the SQL fix script');
        }
      } else {
        console.log('✅ Campaign metrics table accessible');
      }
    } catch (error) {
      console.error('❌ Campaign metrics table catch error:', error);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Show instructions
console.log(`
🛠️  DATABASE PERMISSION FIX INSTRUCTIONS:

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of fix-rls-policies.sql
3. Paste and run the SQL script
4. Refresh your application

The SQL script will:
- Remove problematic recursive functions
- Reset RLS policies safely
- Create simple, non-recursive policies
- Fix the "permission denied for table users" error

After running the SQL script, this error should be resolved:
"permission denied for table users"
`);

// Run test if in browser environment
if (typeof window !== 'undefined') {
  testDatabasePermissions();
}

export { testDatabasePermissions };
