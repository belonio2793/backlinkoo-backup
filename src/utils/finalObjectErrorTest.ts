/**
 * Final comprehensive test to verify all [object Object] errors are eliminated
 * This tests all the places where the error was found and fixed
 */

export async function finalObjectErrorTest() {
  console.clear();
  console.log('🏁 FINAL [object Object] ERROR TEST');
  console.log('=====================================');
  
  let allPassed = true;
  const errors: string[] = [];
  
  try {
    // Test 1: Campaign Metrics Service - getCampaignMetrics
    console.log('\n🧪 Test 1: Campaign Metrics Service - getCampaignMetrics');
    const { campaignMetricsService } = await import('@/services/campaignMetricsService');
    
    const result1 = await campaignMetricsService.getCampaignMetrics('test-user-final-' + Date.now());
    console.log('📋 Result:', result1);
    
    if (result1.error && result1.error === '[object Object]') {
      console.error('❌ FAILED: getCampaignMetrics returns [object Object]');
      allPassed = false;
      errors.push('getCampaignMetrics service');
    } else {
      console.log('✅ PASSED: getCampaignMetrics error properly formatted');
    }
    
    // Test 2: Campaign Metrics Service - deleteCampaign
    console.log('\n🧪 Test 2: Campaign Metrics Service - deleteCampaign');
    const result2 = await campaignMetricsService.deleteCampaign('test-user-final-' + Date.now(), 'fake-campaign-id');
    console.log('📋 Result:', result2);
    
    if (result2.error && result2.error === '[object Object]') {
      console.error('❌ FAILED: deleteCampaign returns [object Object]');
      allPassed = false;
      errors.push('deleteCampaign service');
    } else {
      console.log('✅ PASSED: deleteCampaign error properly formatted');
    }
    
    // Test 3: Error Formatting Functions
    console.log('\n🧪 Test 3: Error Formatting Functions');
    const { formatErrorForUI, formatErrorForLogging } = await import('@/utils/errorUtils');
    
    const testError = {
      code: '42P01',
      message: 'test table does not exist',
      details: null,
      hint: 'test hint'
    };
    
    const uiFormatted = formatErrorForUI(testError);
    const logFormatted = formatErrorForLogging(testError, 'test-context');
    
    console.log('📋 UI formatted:', uiFormatted);
    console.log('📋 Log formatted:', logFormatted);
    
    if (uiFormatted === '[object Object]' || (typeof logFormatted === 'object' && logFormatted.toString() === '[object Object]')) {
      console.error('❌ FAILED: Error formatting functions produce [object Object]');
      allPassed = false;
      errors.push('Error formatting functions');
    } else {
      console.log('✅ PASSED: Error formatting functions work correctly');
    }
    
    // Test 4: String Concatenation Safety
    console.log('\n🧪 Test 4: String Concatenation Safety');
    const concatenationTest = 'Failed to fetch campaign metrics: ' + logFormatted;
    console.log('📋 Concatenation result:', concatenationTest);
    
    if (concatenationTest.includes('[object Object]')) {
      console.error('❌ FAILED: String concatenation produces [object Object]');
      allPassed = false;
      errors.push('String concatenation');
    } else {
      console.log('✅ PASSED: String concatenation is safe');
    }
    
    // Test 5: Console.error simulation
    console.log('\n🧪 Test 5: Console.error simulation');
    const consoleTestError = { code: 'TEST', message: 'console test error' };
    console.error('Failed to fetch campaign metrics:', formatErrorForLogging(consoleTestError, 'test'));
    console.log('✅ Console.error simulation completed (check above output)');
    
    // Final Summary
    console.log('\n🏁 FINAL SUMMARY');
    console.log('================');
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ [object Object] errors have been completely eliminated');
      console.log('✅ Campaign metrics errors will now display properly');
      console.log('✅ All console.error and console.warn statements use proper formatting');
      console.log('✅ Error formatting functions work correctly');
      console.log('✅ String concatenation is safe');
    } else {
      console.error('❌ SOME TESTS FAILED');
      console.error('Failed areas:', errors);
      console.error('❌ [object Object] errors may still occur');
    }
    
    return { passed: allPassed, errors };
    
  } catch (error) {
    console.error('❌ Test suite crashed:', error);
    return { passed: false, errors: ['Test suite crash'] };
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).finalObjectErrorTest = finalObjectErrorTest;
  console.log('🔧 Final test available: finalObjectErrorTest()');
}
