/**
 * Test utility to verify campaign metrics error handling is working
 * Run this in browser console: testCampaignMetricsErrorHandling()
 */

import { campaignMetricsService } from '@/services/campaignMetricsService';
import { formatErrorForUI } from '@/utils/errorUtils';

export async function testCampaignMetricsErrorHandling() {
  console.log('🧪 Testing Campaign Metrics Error Handling...');
  
  try {
    // This should trigger a database error
    const result = await campaignMetricsService.getCampaignMetrics('fake-user-id-12345');
    
    console.log('📋 Result:', result);
    
    if (!result.success && result.error) {
      console.log('✅ Error message type:', typeof result.error);
      console.log('✅ Error message value:', result.error);
      console.log('✅ Formatted for UI:', formatErrorForUI(result.error));
      
      // Verify it's not "[object Object]"
      if (result.error.toString() === '[object Object]') {
        console.error('❌ STILL SHOWING [object Object]!');
        return false;
      } else {
        console.log('✅ Error is properly formatted!');
        return true;
      }
    } else {
      console.log('ℹ️ No error occurred or different result structure');
      return true;
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testCampaignMetricsErrorHandling = testCampaignMetricsErrorHandling;
  console.log('🔧 Test function available: testCampaignMetricsErrorHandling()');
}
