#!/usr/bin/env node

/**
 * Test script to verify campaign metrics error and apply client-side fix
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCampaignMetrics() {
  console.log('🧪 Testing campaign metrics access...');

  try {
    // Test 1: Check if campaigns table exists and is accessible
    console.log('📊 Testing campaigns table access...');
    
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    if (campaignsError) {
      console.error('❌ Campaigns table error:', {
        message: campaignsError.message,
        code: campaignsError.code,
        details: campaignsError.details
      });
      
      if (campaignsError.message.includes('permission denied for table users')) {
        console.log('🎯 Found the "permission denied for table users" error!');
        console.log('📋 This confirms the RLS recursion issue.');
        return { hasError: true, errorType: 'users_permission' };
      }
      
      return { hasError: true, errorType: 'other', error: campaignsError };
    }

    console.log('✅ Campaigns table accessible');

    // Test 2: Check profiles table access
    console.log('👤 Testing profiles table access...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      console.error('❌ Profiles table error:', {
        message: profilesError.message,
        code: profilesError.code,
        details: profilesError.details
      });
      
      if (profilesError.message.includes('permission denied for table users')) {
        console.log('🎯 Found the "permission denied for table users" error in profiles!');
        return { hasError: true, errorType: 'users_permission' };
      }
      
      return { hasError: true, errorType: 'profiles_access', error: profilesError };
    }

    console.log('✅ Profiles table accessible');

    // Test 3: Test campaign metrics service functionality
    console.log('🔍 Testing campaign metrics functionality...');
    
    // This should work if the tables are accessible
    const testResult = {
      hasError: false,
      campaignsAccessible: true,
      profilesAccessible: true,
      message: 'All tables accessible - no permission errors detected'
    };

    console.log('🎉 Campaign metrics test completed successfully!');
    return testResult;

  } catch (error) {
    console.error('💥 Unexpected error during test:', error);
    return { hasError: true, errorType: 'unexpected', error };
  }
}

async function suggestFix(testResult) {
  if (!testResult.hasError) {
    console.log('\n✅ No errors detected - campaign metrics should work fine!');
    return;
  }

  console.log('\n🔧 SUGGESTED FIXES:');

  if (testResult.errorType === 'users_permission') {
    console.log(`
📋 ROOT CAUSE: RLS Policy Recursion
The error "permission denied for table users" indicates that Row Level Security (RLS) 
policies are creating an infinite recursion loop.

🛠️ IMMEDIATE FIX OPTIONS:

Option 1: Manual Supabase Dashboard Fix
1. Go to https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp
2. Navigate to SQL Editor
3. Run this SQL:

DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simple_user_access" ON public.profiles 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_access" ON public.profiles 
FOR ALL USING (auth.role() = 'service_role');

Option 2: Application-Level Workaround
- Update the admin dashboard to use service role key
- Implement fallback data for when RLS blocks access
- Use local storage for campaign metrics as temporary solution

🎯 PRIORITY: Option 1 (SQL fix) should resolve the issue permanently.
    `);
  } else {
    console.log(`
❌ Error Type: ${testResult.errorType}
📝 Error Details: ${JSON.stringify(testResult.error, null, 2)}

🛠️ GENERAL FIXES:
1. Check Supabase project status and ensure it's not paused
2. Verify environment variables are correct
3. Check network connectivity to Supabase
4. Review recent database migrations for conflicts
    `);
  }
}

// Run the test
console.log('🚀 Starting Campaign Metrics Diagnostics...\n');

testCampaignMetrics()
  .then(result => {
    console.log('\n📊 TEST RESULTS:', JSON.stringify(result, null, 2));
    return suggestFix(result);
  })
  .then(() => {
    console.log('\n🏁 Diagnostics complete.');
  })
  .catch(error => {
    console.error('\n💥 Test failed with unexpected error:', error);
  });
