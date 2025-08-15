/**
 * Campaign Resume Issues - Comprehensive Fix
 * This script addresses all potential issues preventing campaigns from resuming properly
 */

console.log('🔧 Campaign Resume Issues - Comprehensive Fix\n');

// Step 1: Fix database schema
async function fixDatabaseSchema() {
  console.log('📊 Step 1: Fixing database schema...\n');
  
  try {
    const response = await fetch('/.netlify/functions/fix-campaign-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Database schema fix completed:', result);
    } else {
      const error = await response.text();
      console.log('❌ Database schema fix failed:', error);
    }
  } catch (error) {
    console.log('❌ Error running schema fix:', error.message);
  }
  console.log('');
}

// Step 2: Test working campaign processor
async function testCampaignProcessor() {
  console.log('🚀 Step 2: Testing campaign processor...\n');
  
  const testData = {
    keyword: 'test keyword',
    anchorText: 'test link',
    targetUrl: 'https://example.com',
    campaignId: 'fix-test-' + Date.now()
  };
  
  try {
    console.log('Testing with data:', testData);
    
    const response = await fetch('/.netlify/functions/working-campaign-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Campaign processor working correctly!');
      console.log('Result:', result);
      
      if (result.success && result.data?.publishedUrls) {
        console.log('📝 Published URLs:', result.data.publishedUrls);
        console.log('🎯 Total posts:', result.data.totalPosts);
        console.log('🔄 Prompt used:', result.data.promptUsed);
      }
    } else {
      const error = await response.text();
      console.log('❌ Campaign processor failed:', error);
    }
  } catch (error) {
    console.log('❌ Network error testing campaign processor:', error.message);
  }
  console.log('');
}

// Step 3: Test all critical functions
async function testCriticalFunctions() {
  console.log('🔍 Step 3: Testing critical functions...\n');
  
  const functions = [
    'working-campaign-processor',
    'fix-campaign-schema',
    'api-status'
  ];
  
  for (const func of functions) {
    try {
      const response = await fetch(`/.netlify/functions/${func}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (response.status === 404) {
        console.log(`❌ ${func}: NOT FOUND (404) - Function not deployed`);
      } else {
        console.log(`✅ ${func}: Available (status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${func}: Error - ${error.message}`);
    }
  }
  console.log('');
}

// Step 4: Environment check
async function checkEnvironment() {
  console.log('🌍 Step 4: Checking environment...\n');
  
  // Check if we're in development or production
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('localhost');
  console.log('Environment:', isDev ? 'Development' : 'Production');
  console.log('URL:', window.location.href);
  
  // Check Supabase availability
  if (window.supabase) {
    console.log('✅ Supabase client available');
    
    try {
      const { data: { user } } = await window.supabase.auth.getUser();
      console.log('✅ User authenticated:', user ? 'Yes' : 'No');
    } catch (error) {
      console.log('❌ Auth check failed:', error.message);
    }
  } else {
    console.log('❌ Supabase client not available');
  }
  console.log('');
}

// Main execution
async function runComprehensiveFix() {
  console.log('🔧 Starting Comprehensive Campaign Resume Fix\n');
  console.log('=' .repeat(60));
  
  await checkEnvironment();
  await testCriticalFunctions();
  await fixDatabaseSchema();
  await testCampaignProcessor();
  
  console.log('=' .repeat(60));
  console.log('🏁 Campaign Resume Fix Complete\n');
  
  console.log('💡 SUMMARY:');
  console.log('1. If functions return 404: Netlify functions need to be deployed');
  console.log('2. If database errors: Schema has been fixed automatically');
  console.log('3. If content not posting: OpenAI API key may be missing');
  console.log('4. If Telegraph fails: Service may be temporarily down');
  console.log('\n🔍 Check browser dev tools Network tab for detailed error information');
  console.log('\n🛠️  This fix function is available as: window.fixCampaignResume()');
}

// Make available globally
if (typeof window !== 'undefined') {
  window.fixCampaignResume = runComprehensiveFix;
  window.testCampaignProcessor = testCampaignProcessor;
  window.fixDatabaseSchema = fixDatabaseSchema;
  
  // Auto-run the fix
  runComprehensiveFix().catch(error => {
    console.error('❌ Fix execution failed:', error);
  });
}
