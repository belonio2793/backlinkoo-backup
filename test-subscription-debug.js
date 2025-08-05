/**
 * Subscription System Debug Test
 * 
 * This script helps diagnose subscription-related errors
 * Run with: node test-subscription-debug.js
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubscriptionSystem() {
  console.log('🧪 Starting Subscription System Debug Test...\n');

  // Test 1: Basic Supabase connectivity
  console.log('1. Testing Supabase connectivity...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
  } catch (error) {
    console.error('❌ Supabase connection exception:', error.message);
  }

  // Test 2: Edge function connectivity
  console.log('\n2. Testing create-subscription Edge function...');
  try {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: { test: true }
    });

    if (error) {
      console.error('❌ Edge function test failed:', error);
    } else {
      console.log('✅ Edge function test successful:', data);
    }
  } catch (error) {
    console.error('❌ Edge function test exception:', error.message);
  }

  // Test 3: Check profiles table structure
  console.log('\n3. Checking profiles table structure...');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Profiles table query failed:', error.message);
    } else {
      console.log('✅ Profiles table accessible');
      if (data && data.length > 0) {
        console.log('   Sample profile structure:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    console.error('❌ Profiles table query exception:', error.message);
  }

  // Test 4: Check subscribers table structure
  console.log('\n4. Checking subscribers table structure...');
  try {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Subscribers table query failed:', error.message);
    } else {
      console.log('✅ Subscribers table accessible');
      if (data && data.length > 0) {
        console.log('   Sample subscriber structure:', Object.keys(data[0]));
      }
    }
  } catch (error) {
    console.error('❌ Subscribers table query exception:', error.message);
  }

  // Test 5: Environment variables check
  console.log('\n5. Checking environment variables...');
  const envVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PRICE_ID'
  ];

  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });

  console.log('\n🏁 Debug test completed!');
  console.log('\nNext steps if issues found:');
  console.log('- Check .env file for missing variables');
  console.log('- Verify Supabase project settings');
  console.log('- Check Edge function deployment status');
  console.log('- Review database table permissions and RLS policies');
}

// Run the test
testSubscriptionSystem().catch(console.error);
