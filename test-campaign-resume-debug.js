/**
 * Campaign Resume Debug Test
 * Tests the exact flow that happens when user clicks "Resume Campaign"
 */

console.log('🔍 Testing Campaign Resume Flow...\n');

// Test function availability
async function testFunctionAvailability() {
  console.log('📡 Testing function availability...\n');
  
  const functions = [
    'working-campaign-processor',
    'working-content-generator', 
    'fix-campaign-schema'
  ];
  
  for (const func of functions) {
    try {
      console.log(`Testing /.netlify/functions/${func}...`);
      
      const response = await fetch(`/.netlify/functions/${func}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: 'test',
          anchorText: 'test link',
          targetUrl: 'https://example.com',
          campaignId: 'test-123'
        })
      });
      
      console.log(`  Status: ${response.status}`);
      if (response.status === 404) {
        console.log(`  ❌ Function ${func} NOT FOUND (404)`);
      } else {
        console.log(`  ✅ Function ${func} available (status: ${response.status})`);
        if (response.status !== 200) {
          const text = await response.text();
          console.log(`  Response: ${text.substring(0, 200)}...`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing ${func}:`, error.message);
    }
    console.log('');
  }
}

// Test database schema
async function testDatabaseSchema() {
  console.log('🗄️ Testing database schema...\n');
  
  // Test if we can access Supabase
  if (typeof window !== 'undefined' && window.supabase) {
    try {
      // Test campaigns table
      const { data: campaigns, error: campaignsError } = await window.supabase
        .from('campaigns')
        .select('id, name, status, keywords')
        .limit(1);
        
      if (campaignsError) {
        console.log('❌ Error accessing campaigns table:', campaignsError.message);
      } else {
        console.log('✅ Campaigns table accessible, found', campaigns?.length || 0, 'records');
      }
      
      // Test published_links table  
      const { data: links, error: linksError } = await window.supabase
        .from('published_links')
        .select('id, campaign_id, url')
        .limit(1);
        
      if (linksError) {
        console.log('❌ Error accessing published_links table:', linksError.message);
      } else {
        console.log('✅ Published_links table accessible, found', links?.length || 0, 'records');
      }
      
      // Test activity_logs table
      const { data: logs, error: logsError } = await window.supabase
        .from('activity_logs')
        .select('id, campaign_id, message')
        .limit(1);
        
      if (logsError) {
        console.log('❌ Error accessing activity_logs table:', logsError.message);
      } else {
        console.log('✅ Activity_logs table accessible, found', logs?.length || 0, 'records');
      }
      
    } catch (error) {
      console.log('❌ Database test error:', error.message);
    }
  } else {
    console.log('❌ Supabase client not available in window object');
  }
  console.log('');
}

// Test campaign processor directly
async function testCampaignProcessor() {
  console.log('🚀 Testing working-campaign-processor directly...\n');
  
  const testData = {
    keyword: 'digital marketing',
    anchorText: 'marketing services',
    targetUrl: 'https://example.com',
    campaignId: 'test-campaign-' + Date.now()
  };
  
  try {
    console.log('Sending request with data:', testData);
    
    const response = await fetch('/.netlify/functions/working-campaign-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS - Campaign processor response:', result);
      
      if (result.success && result.data?.publishedUrls) {
        console.log('📝 Published URLs:', result.data.publishedUrls);
        console.log('🎯 Total posts:', result.data.totalPosts);
        console.log('🔄 Prompt used:', result.data.promptUsed);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED - Error response:', errorText);
    }
    
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
  }
  console.log('');
}

// Main test execution
async function runTests() {
  console.log('🔍 Campaign Resume Debug Test Started\n');
  console.log('=' .repeat(50));
  
  await testFunctionAvailability();
  await testDatabaseSchema();
  await testCampaignProcessor();
  
  console.log('=' .repeat(50));
  console.log('🏁 Campaign Resume Debug Test Complete\n');
  
  // Additional recommendations
  console.log('💡 RECOMMENDATIONS:');
  console.log('1. If functions return 404, check Netlify deployment');
  console.log('2. If database errors, run fix-campaign-schema function');
  console.log('3. If content not posting, check OpenAI API key configuration');
  console.log('4. Check browser dev tools Network tab during resume for detailed errors');
}

// Auto-run the test
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});

// Make available globally for manual testing
if (typeof window !== 'undefined') {
  window.testCampaignResume = runTests;
  window.testCampaignProcessor = testCampaignProcessor;
  window.testDatabaseSchema = testDatabaseSchema;
  console.log('\n🛠️ Manual test functions available:');
  console.log('- window.testCampaignResume()');
  console.log('- window.testCampaignProcessor()');
  console.log('- window.testDatabaseSchema()');
}
