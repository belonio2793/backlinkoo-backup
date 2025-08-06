#!/usr/bin/env node

/**
 * Email Configuration Diagnostic Tool
 * Tests Resend email setup for user registration confirmations
 */

const { SecureConfig } = require('./src/lib/secure-config.ts');

console.log('🔧 Email Configuration Diagnostic\n');

// 1. Check Resend API Key Configuration
console.log('1️⃣ Checking Resend API Key...');
try {
  const resendKey = SecureConfig.RESEND_API_KEY;
  if (resendKey) {
    if (resendKey.startsWith('re_')) {
      console.log('✅ Resend API key is configured and has correct format');
      console.log(`   Key prefix: ${resendKey.substring(0, 8)}...`);
    } else {
      console.log('❌ Resend API key has incorrect format (should start with "re_")');
      console.log(`   Current: ${resendKey.substring(0, 10)}...`);
    }
  } else {
    console.log('❌ Resend API key is not configured');
  }
} catch (error) {
  console.log('❌ Error accessing Resend API key:', error.message);
}

// 2. Check Environment Variables
console.log('\n2️⃣ Checking Environment Variables...');
const envVars = [
  'RESEND_API_KEY',
  'VITE_SUPABASE_URL', 
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: configured (${value.substring(0, 8)}...)`);
  } else {
    console.log(`❌ ${varName}: not set`);
  }
});

// 3. Test Resend API Connectivity
console.log('\n3️⃣ Testing Resend API Connectivity...');
async function testResendAPI() {
  try {
    const resendKey = SecureConfig.RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.log('❌ No Resend API key found to test');
      return;
    }

    console.log('   Making API call to Resend domains endpoint...');
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resend API is accessible');
      console.log(`   Domains configured: ${data.data?.length || 0}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ Resend API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Resend API connection failed:', error.message);
  }
}

// 4. Check Supabase Auth Configuration
console.log('\n4️⃣ Checking Supabase Auth Configuration...');
async function checkSupabaseAuth() {
  try {
    const supabaseUrl = SecureConfig.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = SecureConfig.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase credentials not found');
      return;
    }

    console.log('   Testing Supabase connection...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error && !error.message.includes('session_not_found')) {
      console.log(`❌ Supabase auth error: ${error.message}`);
    } else {
      console.log('✅ Supabase auth connection successful');
    }

    // Check auth settings by attempting to get user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError && !userError.message.includes('session_not_found')) {
      console.log(`⚠️  Supabase user fetch warning: ${userError.message}`);
    } else {
      console.log('✅ Supabase user endpoint accessible');
    }

  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
  }
}

// 5. Check Email Templates and Endpoints
console.log('\n5️⃣ Checking Email Service Endpoints...');
function checkEmailEndpoints() {
  const endpoints = [
    'netlify/functions/send-email-resend/index.ts',
    'supabase/functions/send-email-resend/index.ts',
    'supabase/functions/send-test-email/index.ts'
  ];

  endpoints.forEach(endpoint => {
    try {
      const fs = require('fs');
      if (fs.existsSync(endpoint)) {
        console.log(`✅ ${endpoint}: exists`);
      } else {
        console.log(`❌ ${endpoint}: not found`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: error checking - ${error.message}`);
    }
  });
}

// 6. Check Netlify Functions
console.log('\n6️⃣ Checking Netlify Functions...');
function checkNetlifyFunctions() {
  try {
    const fs = require('fs');
    const functionsDir = 'netlify/functions';
    
    if (fs.existsSync(functionsDir)) {
      const functions = fs.readdirSync(functionsDir);
      const emailFunctions = functions.filter(f => f.includes('email') || f.includes('send'));
      
      console.log(`✅ Netlify functions directory exists`);
      console.log(`   Email-related functions: ${emailFunctions.join(', ')}`);
    } else {
      console.log('❌ Netlify functions directory not found');
    }
  } catch (error) {
    console.log('❌ Error checking Netlify functions:', error.message);
  }
}

// Run all tests
async function runDiagnostics() {
  await testResendAPI();
  await checkSupabaseAuth();
  checkEmailEndpoints();
  checkNetlifyFunctions();

  console.log('\n📋 DIAGNOSTIC SUMMARY');
  console.log('====================');
  console.log('');
  console.log('Common issues for email confirmation problems:');
  console.log('');
  console.log('1. RESEND_API_KEY not properly configured in Supabase project settings');
  console.log('2. Supabase Auth email templates not configured');
  console.log('3. Email redirect URLs not matching application domains');
  console.log('4. Netlify functions not deployed or accessible');
  console.log('5. Supabase email rate limiting or domain verification issues');
  console.log('');
  console.log('Next steps:');
  console.log('- Check Supabase Dashboard > Project Settings > Auth > Email Templates');
  console.log('- Verify RESEND_API_KEY in Supabase Dashboard > Project Settings > Environment Variables');
  console.log('- Test email delivery with a simple test email');
  console.log('- Check browser network tab for failed email API calls during signup');
}

runDiagnostics().catch(console.error);
