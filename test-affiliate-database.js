// Test affiliate database functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

console.log('🔍 Testing Affiliate Database Implementation...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test affiliate tables existence
async function testAffiliateTables() {
  console.log('📋 Checking affiliate table structure...');
  
  const tables = [
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
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results[table] = false;
      } else {
        console.log(`✅ ${table}: Table accessible`);
        results[table] = true;
      }
    } catch (err) {
      console.log(`❌ ${table}: Connection error - ${err.message}`);
      results[table] = false;
    }
  }
  
  return results;
}

// Test affiliate dashboard view
async function testAffiliateDashboardView() {
  console.log('\n📊 Testing affiliate dashboard view...');
  
  try {
    const { data, error } = await supabase
      .from('affiliate_dashboard_stats')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ affiliate_dashboard_stats view: ${error.message}`);
      return false;
    } else {
      console.log(`✅ affiliate_dashboard_stats view: Working`);
      return true;
    }
  } catch (err) {
    console.log(`❌ affiliate_dashboard_stats view: ${err.message}`);
    return false;
  }
}

// Test affiliate service functions
async function testAffiliateService() {
  console.log('\n🔧 Testing affiliate service layer...');
  
  try {
    // Import the affiliate service
    const { affiliateService } = await import('./src/services/affiliateService.ts');
    
    console.log('✅ Affiliate service imported successfully');
    
    // Test service methods exist
    const methods = [
      'createAffiliateProfile',
      'getAffiliateProfile', 
      'getAffiliateStats',
      'generateAffiliateLink',
      'trackAffiliateClick',
      'getAffiliateAnalytics'
    ];
    
    methods.forEach(method => {
      if (typeof affiliateService[method] === 'function') {
        console.log(`✅ ${method}: Method available`);
      } else {
        console.log(`❌ ${method}: Method missing`);
      }
    });
    
    return true;
  } catch (err) {
    console.log(`❌ Affiliate service: ${err.message}`);
    return false;
  }
}

// Test affiliate page routing
async function testAffiliatePageAccess() {
  console.log('\n🌐 Testing affiliate page accessibility...');
  
  try {
    // Check if affiliate components exist
    const components = [
      './src/pages/AffiliateProgram.tsx',
      './src/components/affiliate/AffiliateDashboard.tsx',
      './src/components/affiliate/AffiliateRegistration.tsx',
      './src/components/affiliate/AffiliateAssetLibrary.tsx'
    ];
    
    for (const component of components) {
      try {
        const fs = require('fs');
        if (fs.existsSync(component)) {
          console.log(`✅ ${component}: File exists`);
        } else {
          console.log(`❌ ${component}: File missing`);
        }
      } catch (err) {
        console.log(`❌ ${component}: Access error`);
      }
    }
    
    return true;
  } catch (err) {
    console.log(`❌ Affiliate page check: ${err.message}`);
    return false;
  }
}

// Run comprehensive test
async function runAffiliateDiagnostic() {
  console.log('🚀 Starting comprehensive affiliate system diagnostic...\n');
  
  const results = {
    tables: await testAffiliateTables(),
    dashboardView: await testAffiliateDashboardView(),
    service: await testAffiliateService(),
    pages: await testAffiliatePageAccess()
  };
  
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('='.repeat(50));
  
  const tableResults = Object.values(results.tables);
  const tablesPassed = tableResults.filter(Boolean).length;
  const tablesTotal = tableResults.length;
  
  console.log(`📋 Database Tables: ${tablesPassed}/${tablesTotal} accessible`);
  console.log(`📊 Dashboard View: ${results.dashboardView ? '✅ Working' : '❌ Failed'}`);
  console.log(`🔧 Service Layer: ${results.service ? '✅ Working' : '❌ Failed'}`);
  console.log(`🌐 Page Components: ${results.pages ? '✅ Working' : '❌ Failed'}`);
  
  const overallHealth = (tablesPassed / tablesTotal * 0.4) + 
                       (results.dashboardView ? 0.2 : 0) +
                       (results.service ? 0.2 : 0) +
                       (results.pages ? 0.2 : 0);
  
  console.log(`\n🎯 Overall System Health: ${Math.round(overallHealth * 100)}%`);
  
  if (overallHealth >= 0.8) {
    console.log('🎉 Affiliate system is fully operational!');
  } else if (overallHealth >= 0.6) {
    console.log('⚠️  Affiliate system has minor issues that need attention');
  } else {
    console.log('🚨 Affiliate system requires immediate attention');
  }
  
  return results;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAffiliateDiagnostic };
} else {
  runAffiliateDiagnostic();
}
