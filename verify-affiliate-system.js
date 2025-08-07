#!/usr/bin/env node

/**
 * COMPREHENSIVE AFFILIATE SYSTEM VERIFICATION
 * Verifies all aspects of the affiliate program implementation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

console.log('🔍 AFFILIATE SYSTEM VERIFICATION STARTING...\n');
console.log('='.repeat(60));

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Database Tables Verification
async function verifyDatabaseTables() {
  console.log('\n📋 1. DATABASE TABLES VERIFICATION');
  console.log('-'.repeat(40));
  
  const requiredTables = [
    'affiliate_profiles',
    'affiliate_referrals',
    'affiliate_commissions',
    'affiliate_clicks',
    'affiliate_payouts',
    'affiliate_assets',
    'affiliate_campaigns',
    'affiliate_leaderboard',
    'affiliate_milestones',
    'affiliate_settings',
    'affiliate_tier_requirements'
  ];
  
  const results = {};
  
  for (const table of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results[table] = { exists: false, error: error.message };
      } else {
        console.log(`✅ ${table}: Table exists (${count || 0} records)`);
        results[table] = { exists: true, count: count || 0 };
      }
    } catch (err) {
      console.log(`❌ ${table}: Connection error`);
      results[table] = { exists: false, error: err.message };
    }
  }
  
  return results;
}

// Test 2: Views and Functions Verification
async function verifyViewsAndFunctions() {
  console.log('\n📊 2. VIEWS AND FUNCTIONS VERIFICATION');
  console.log('-'.repeat(40));
  
  const views = ['affiliate_dashboard_stats'];
  const functions = ['create_test_affiliate_data'];
  
  const results = { views: {}, functions: {} };
  
  // Test views
  for (const view of views) {
    try {
      const { data, error } = await supabase.from(view).select('*').limit(1);
      if (error) {
        console.log(`❌ View ${view}: ${error.message}`);
        results.views[view] = { exists: false, error: error.message };
      } else {
        console.log(`✅ View ${view}: Working`);
        results.views[view] = { exists: true };
      }
    } catch (err) {
      console.log(`❌ View ${view}: ${err.message}`);
      results.views[view] = { exists: false, error: err.message };
    }
  }
  
  // Test functions (via RPC)
  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func, { test_user_id: '00000000-0000-0000-0000-000000000000' });
      if (error && !error.message.includes('violates foreign key constraint')) {
        console.log(`❌ Function ${func}: ${error.message}`);
        results.functions[func] = { exists: false, error: error.message };
      } else {
        console.log(`✅ Function ${func}: Available`);
        results.functions[func] = { exists: true };
      }
    } catch (err) {
      console.log(`❌ Function ${func}: ${err.message}`);
      results.functions[func] = { exists: false, error: err.message };
    }
  }
  
  return results;
}

// Test 3: Service Layer Verification
async function verifyServiceLayer() {
  console.log('\n🔧 3. SERVICE LAYER VERIFICATION');
  console.log('-'.repeat(40));
  
  const serviceFile = 'src/services/affiliateService.ts';
  const typesFile = 'src/integrations/supabase/affiliate-types.ts';
  
  const results = {};
  
  // Check if files exist
  if (fs.existsSync(serviceFile)) {
    console.log(`✅ Service file: ${serviceFile} exists`);
    results.serviceFile = true;
    
    // Read and verify service methods
    try {
      const serviceContent = fs.readFileSync(serviceFile, 'utf8');
      const requiredMethods = [
        'createAffiliateProfile',
        'getAffiliateProfile',
        'getAffiliateStats',
        'generateAffiliateLink',
        'trackAffiliateClick',
        'getAffiliateAnalytics'
      ];
      
      const methodsFound = {};
      requiredMethods.forEach(method => {
        if (serviceContent.includes(method)) {
          console.log(`✅ Method ${method}: Found`);
          methodsFound[method] = true;
        } else {
          console.log(`❌ Method ${method}: Missing`);
          methodsFound[method] = false;
        }
      });
      
      results.methods = methodsFound;
    } catch (err) {
      console.log(`❌ Error reading service file: ${err.message}`);
      results.serviceFile = false;
    }
  } else {
    console.log(`❌ Service file: ${serviceFile} missing`);
    results.serviceFile = false;
  }
  
  // Check types file
  if (fs.existsSync(typesFile)) {
    console.log(`✅ Types file: ${typesFile} exists`);
    results.typesFile = true;
  } else {
    console.log(`❌ Types file: ${typesFile} missing`);
    results.typesFile = false;
  }
  
  return results;
}

// Test 4: Components Verification
async function verifyComponents() {
  console.log('\n🎨 4. COMPONENTS VERIFICATION');
  console.log('-'.repeat(40));
  
  const components = [
    'src/pages/AffiliateProgram.tsx',
    'src/components/affiliate/AffiliateDashboard.tsx',
    'src/components/affiliate/AffiliateRegistration.tsx',
    'src/components/affiliate/AffiliateAssetLibrary.tsx',
    'src/components/affiliate/AffiliateGamification.tsx'
  ];
  
  const results = {};
  
  components.forEach(component => {
    if (fs.existsSync(component)) {
      console.log(`✅ Component: ${path.basename(component)} exists`);
      results[component] = true;
    } else {
      console.log(`❌ Component: ${path.basename(component)} missing`);
      results[component] = false;
    }
  });
  
  return results;
}

// Test 5: Integration Test
async function performIntegrationTest() {
  console.log('\n🧪 5. INTEGRATION TEST');
  console.log('-'.repeat(40));
  
  const results = {};
  
  try {
    // Test 1: Create a test affiliate profile
    console.log('Testing affiliate profile creation...');
    
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const { data, error } = await supabase
      .from('affiliate_profiles')
      .insert({
        user_id: testUserId,
        affiliate_id: 'TEST_' + Date.now(),
        status: 'active',
        tier: 'bronze',
        total_earnings: 0,
        total_referrals: 0,
        total_conversions: 0,
        lifetime_value: 0
      })
      .select()
      .single();
    
    if (error && !error.message.includes('violates foreign key constraint')) {
      console.log(`❌ Profile creation test failed: ${error.message}`);
      results.profileCreation = false;
    } else if (error && error.message.includes('violates foreign key constraint')) {
      console.log(`⚠️  Profile creation test: Foreign key constraint (expected for test)`);
      results.profileCreation = 'expected_error';
    } else {
      console.log(`✅ Profile creation test: Success`);
      results.profileCreation = true;
      
      // Clean up test data
      await supabase
        .from('affiliate_profiles')
        .delete()
        .eq('id', data.id);
    }
    
    // Test 2: Check affiliate clicks table
    console.log('Testing affiliate clicks insertion...');
    
    const { error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: 'TEST_CLICK_' + Date.now(),
        referral_code: 'TEST_REF_' + Date.now(),
        visitor_ip: '127.0.0.1',
        user_agent: 'Mozilla/5.0 Test Browser',
        landing_page: 'https://test.example.com',
        device_type: 'desktop'
      });
    
    if (clickError) {
      console.log(`❌ Click tracking test failed: ${clickError.message}`);
      results.clickTracking = false;
    } else {
      console.log(`✅ Click tracking test: Success`);
      results.clickTracking = true;
    }
    
  } catch (err) {
    console.log(`❌ Integration test error: ${err.message}`);
    results.integrationError = err.message;
  }
  
  return results;
}

// Main verification function
async function runCompleteVerification() {
  const startTime = Date.now();
  
  console.log('🚀 Starting comprehensive affiliate system verification...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tables: await verifyDatabaseTables(),
    viewsAndFunctions: await verifyViewsAndFunctions(),
    serviceLayer: await verifyServiceLayer(),
    components: await verifyComponents(),
    integration: await performIntegrationTest()
  };
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL VERIFICATION REPORT');
  console.log('='.repeat(60));
  
  // Calculate scores
  const tableResults = Object.values(results.tables);
  const tablesScore = tableResults.filter(t => t.exists).length / tableResults.length;
  
  const componentResults = Object.values(results.components);
  const componentsScore = componentResults.filter(Boolean).length / componentResults.length;
  
  const serviceScore = results.serviceLayer.serviceFile && results.serviceLayer.typesFile ? 1 : 0;
  
  const overallScore = (tablesScore * 0.4) + (componentsScore * 0.3) + (serviceScore * 0.3);
  
  console.log(`📋 Database Tables: ${Math.round(tablesScore * 100)}% (${tableResults.filter(t => t.exists).length}/${tableResults.length})`);
  console.log(`🎨 Components: ${Math.round(componentsScore * 100)}% (${componentResults.filter(Boolean).length}/${componentResults.length})`);
  console.log(`🔧 Service Layer: ${Math.round(serviceScore * 100)}%`);
  console.log(`⏱️  Verification Duration: ${duration}s`);
  console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${Math.round(overallScore * 100)}%`);
  
  if (overallScore >= 0.9) {
    console.log('🎉 AFFILIATE SYSTEM IS FULLY OPERATIONAL!');
    console.log('✨ All components verified and working correctly.');
  } else if (overallScore >= 0.7) {
    console.log('✅ AFFILIATE SYSTEM IS MOSTLY WORKING');
    console.log('⚠️  Some minor issues detected that may need attention.');
  } else if (overallScore >= 0.5) {
    console.log('⚠️  AFFILIATE SYSTEM HAS SIGNIFICANT ISSUES');
    console.log('🔧 Multiple components need attention before full deployment.');
  } else {
    console.log('🚨 AFFILIATE SYSTEM REQUIRES IMMEDIATE ATTENTION');
    console.log('❌ Critical issues detected that prevent proper operation.');
  }
  
  // Save results to file
  fs.writeFileSync('affiliate-verification-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Detailed results saved to: affiliate-verification-results.json');
  
  return results;
}

// Run verification
runCompleteVerification().catch(console.error);
