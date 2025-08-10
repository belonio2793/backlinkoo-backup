/**
 * Comprehensive test to verify that [object Object] errors are completely fixed
 * Tests all the major error paths that could cause this issue
 */

export async function testAllErrorObjectFixes() {
  console.log('🔬 Running Comprehensive [object Object] Error Test...');
  
  let allTestsPassed = true;
  const failedTests: string[] = [];
  
  try {
    // Test 1: Campaign Metrics Service Error
    console.log('\n🧪 Test 1: Campaign Metrics Service');
    const { campaignMetricsService } = await import('@/services/campaignMetricsService');
    const result = await campaignMetricsService.getCampaignMetrics('fake-user-test-123');
    
    if (!result.success && result.error) {
      if (result.error === '[object Object]') {
        console.error('❌ Test 1 FAILED: Campaign metrics still shows [object Object]');
        failedTests.push('Campaign Metrics Service');
        allTestsPassed = false;
      } else {
        console.log('✅ Test 1 PASSED: Campaign metrics error formatted correctly:', result.error);
      }
    }
    
    // Test 2: Error Utils Functions
    console.log('\n🧪 Test 2: Error Utils Functions');
    const { formatErrorForUI, formatErrorForLogging } = await import('@/utils/errorUtils');
    
    const testError = { 
      code: '42P01', 
      message: 'test error', 
      details: 'test details' 
    };
    
    const formattedUI = formatErrorForUI(testError);
    const formattedLogging = formatErrorForLogging(testError);
    
    if (formattedUI === '[object Object]' || formattedLogging === '[object Object]') {
      console.error('❌ Test 2 FAILED: Error utils still produce [object Object]');
      failedTests.push('Error Utils Functions');
      allTestsPassed = false;
    } else {
      console.log('✅ Test 2 PASSED: Error utils work correctly');
      console.log('  - formatErrorForUI:', formattedUI);
    }
    
    // Test 3: Various Error Types
    console.log('\n🧪 Test 3: Various Error Types');
    const testCases = [
      new Error('Standard error'),
      { message: 'Object with message' },
      { code: '42P01', details: 'Object with code and details' },
      'String error',
      null,
      undefined,
      { weird: 'object', without: 'message' }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const formatted = formatErrorForUI(testCases[i]);
      if (formatted === '[object Object]') {
        console.error(`❌ Test 3.${i + 1} FAILED: Error type ${typeof testCases[i]} still produces [object Object]`);
        failedTests.push(`Error Type ${i + 1}`);
        allTestsPassed = false;
      } else {
        console.log(`✅ Test 3.${i + 1} PASSED: ${typeof testCases[i]} -> "${formatted}"`);
      }
    }
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! [object Object] errors have been completely fixed!');
      console.log('✅ Campaign metrics errors now display properly');
      console.log('✅ Error formatting functions work correctly');
      console.log('✅ All error types are handled properly');
    } else {
      console.error('❌ SOME TESTS FAILED:');
      failedTests.forEach(test => console.error(`  - ${test}`));
      console.error('❌ [object Object] errors may still occur in these areas');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    return false;
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testAllErrorObjectFixes = testAllErrorObjectFixes;
  console.log('🔧 Comprehensive test available: testAllErrorObjectFixes()');
}
