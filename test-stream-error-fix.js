// Test script to verify the "Response body stream already read" error is fixed

async function testNetlifyConnectionFix() {
  console.log('🧪 Testing Netlify connection fix...');
  
  try {
    // Test multiple consecutive calls to verify no stream errors
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      console.log(`📊 Test ${i + 1}/3: Testing connection...`);
      
      const response = await fetch('/netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_config'
        }),
      });
      
      // Use the same fixed approach: read response text once
      const responseText = await response.text();
      
      if (!response.ok) {
        console.log(`❌ Test ${i + 1} failed: HTTP ${response.status}: ${responseText}`);
        results.push({ success: false, error: `HTTP ${response.status}` });
        continue;
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.log(`❌ Test ${i + 1} failed: Invalid JSON response`);
        results.push({ success: false, error: 'Invalid JSON' });
        continue;
      }
      
      console.log(`✅ Test ${i + 1} completed:`, result.success ? 'SUCCESS' : 'FAILED');
      results.push({ 
        success: result.success,
        config: result.config,
        siteInfo: result.siteInfo,
        error: result.error 
      });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    console.log('\n📋 Test Results Summary:');
    console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
    console.log(`❌ Failed tests: ${totalTests - successCount}/${totalTests}`);
    
    if (successCount === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Response body stream error is FIXED!');
    } else if (successCount > 0) {
      console.log('⚠️ PARTIAL SUCCESS - Some tests passed, connection working but may have issues');
    } else {
      console.log('💥 ALL TESTS FAILED - Connection or configuration issues detected');
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Critical test error:', error);
    console.error('Stack trace:', error.stack);
    return [{ success: false, error: error.message }];
  }
}

// Auto-run test when script loads
if (typeof window !== 'undefined') {
  console.log('🚀 Stream error fix test loaded - call testNetlifyConnectionFix() to run tests');
} else {
  // Running in Node environment
  testNetlifyConnectionFix().then(results => {
    console.log('Test completed with results:', results);
    process.exit(results.every(r => r.success) ? 0 : 1);
  });
}
