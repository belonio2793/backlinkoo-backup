/**
 * Utility to clear console and test fresh error output
 * This helps identify if errors are coming from cache vs live code
 */

export function clearConsoleAndTestError() {
  console.clear();
  console.log('🧹 Console cleared. Testing fresh error output...');
  
  setTimeout(async () => {
    try {
      const { campaignMetricsService } = await import('@/services/campaignMetricsService');
      
      console.log('🔬 Making fresh call to campaignMetricsService...');
      const result = await campaignMetricsService.getCampaignMetrics('fresh-test-user-id-' + Date.now());
      
      console.log('📋 Fresh result:', result);
      
      if (result.error) {
        console.log('🎯 Fresh error value:', result.error);
        console.log('🎯 Fresh error type:', typeof result.error);
        
        if (result.error === '[object Object]') {
          console.error('🚨 FRESH [object Object] ERROR DETECTED - Issue is in current code');
        } else {
          console.log('✅ Fresh error is properly formatted');
        }
      }
      
    } catch (error) {
      console.error('❌ Fresh test failed:', error);
    }
  }, 100);
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).clearConsoleAndTestError = clearConsoleAndTestError;
  console.log('🔧 Clear test available: clearConsoleAndTestError()');
}
