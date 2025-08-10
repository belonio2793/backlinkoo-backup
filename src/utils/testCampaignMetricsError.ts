/**
 * Test to verify campaign metrics error formatting is working
 * This can be run in browser console to test the fix
 */

export async function testCampaignMetricsErrorFormatting() {
  console.log('🧪 Testing Campaign Metrics Error Formatting...');
  
  try {
    // Dynamic import to avoid loading issues
    const { campaignMetricsService } = await import('@/services/campaignMetricsService');
    
    // This should trigger a database error since the user ID is fake
    const result = await campaignMetricsService.getCampaignMetrics('fake-user-id-test-12345');
    
    console.log('📋 Result:', result);
    
    if (!result.success && result.error) {
      const errorMessage = result.error;
      console.log('✅ Error message type:', typeof errorMessage);
      console.log('✅ Error message value:', errorMessage);
      
      // Check if it's the dreaded "[object Object]"
      if (errorMessage === '[object Object]') {
        console.error('❌ ERROR STILL SHOWS [object Object]!');
        return false;
      } else if (typeof errorMessage === 'string' && errorMessage.length > 0) {
        console.log('✅ SUCCESS: Error is properly formatted as a readable string!');
        console.log('✅ Error message:', errorMessage);
        return true;
      } else {
        console.warn('⚠️ Unexpected error format:', errorMessage);
        return false;
      }
    } else {
      console.log('ℹ️ No error occurred or unexpected result structure');
      return true;
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testCampaignMetricsErrorFormatting = testCampaignMetricsErrorFormatting;
  console.log('🔧 Test function available: testCampaignMetricsErrorFormatting()');
}
