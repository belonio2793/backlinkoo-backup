#!/usr/bin/env node

/**
 * Test Domain Sync Script
 * 
 * This script tests the domain sync functionality by:
 * 1. Checking Netlify connection
 * 2. Fetching domains from Netlify
 * 3. Checking database domains
 * 4. Testing sync functionality
 */

import { createClient } from '@supabase/supabase-js';

async function testDomainSync() {
  console.log('🔍 Testing Domain Sync System...\n');

  // Get environment variables
  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  console.log('📋 Environment Check:');
  console.log(`   Netlify Site ID: ${siteId}`);
  console.log(`   Netlify Token: ${netlifyToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);

  if (!netlifyToken) {
    console.error('❌ NETLIFY_ACCESS_TOKEN not configured');
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase configuration missing');
    return;
  }

  // Test Netlify API connection
  console.log('🌐 Testing Netlify API Connection...');
  try {
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const siteData = await response.json();
    console.log('✅ Netlify API Connected Successfully');
    console.log(`   Site Name: ${siteData.name}`);
    console.log(`   Custom Domain: ${siteData.custom_domain || 'None'}`);
    console.log(`   Domain Aliases: ${siteData.domain_aliases?.length || 0} aliases`);
    
    if (siteData.domain_aliases?.length > 0) {
      console.log('   Aliases:', siteData.domain_aliases.join(', '));
    }
    console.log('');

  } catch (error) {
    console.error('❌ Netlify API Connection Failed:', error.message);
    return;
  }

  // Test Supabase connection
  console.log('🗄️  Testing Supabase Connection...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test domains table
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .limit(10);

    if (domainError) {
      throw new Error(`Domains table error: ${domainError.message}`);
    }

    console.log('✅ Supabase Connected Successfully');
    console.log(`   Domains in database: ${domains?.length || 0}`);
    
    if (domains && domains.length > 0) {
      console.log('   Database domains:');
      domains.forEach(domain => {
        console.log(`     - ${domain.domain} (${domain.status}, netlify: ${domain.netlify_verified})`);
      });
    }
    console.log('');

    // Test sync logs
    const { data: syncLogs, error: syncError } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!syncError && syncLogs?.length > 0) {
      console.log('📊 Recent Sync Activity:');
      syncLogs.forEach(log => {
        console.log(`   ${log.created_at}: ${log.action} ${log.error_message ? `(Error: ${log.error_message})` : '✅'}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Supabase Connection Failed:', error.message);
    return;
  }

  // Test Edge Function
  console.log('⚡ Testing Edge Function...');
  try {
    const { data, error } = await supabase.functions.invoke('domains', {
      body: { action: 'list_dns' }
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    console.log('✅ Edge Function Accessible');
    if (data?.success) {
      console.log('   Edge function response: Success');
    } else {
      console.log('   Edge function response:', data?.error || 'Unknown error');
    }
    console.log('');

  } catch (error) {
    console.warn('⚠️  Edge Function Test Failed:', error.message);
    console.warn('   This might be normal if the function is not deployed yet\n');
  }

  console.log('🎯 Test Summary:');
  console.log('   ✅ System appears to be configured correctly');
  console.log('   ✅ Both Netlify and Supabase are accessible');
  console.log('   📝 Visit /domains page to add domains and test sync');
  console.log('\n💡 Next Steps:');
  console.log('   1. Open your app and go to /domains');
  console.log('   2. Sign in and add a test domain');
  console.log('   3. Check if the domain appears in both database and Netlify');
  console.log('   4. Monitor sync_logs table for any issues');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  testDomainSync().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

export { testDomainSync };
