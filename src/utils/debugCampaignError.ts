/**
 * Direct debug test to isolate where [object Object] is coming from
 */

export async function debugCampaignErrorSource() {
  console.log('🔍 Debugging Campaign Error Source...');
  
  try {
    // Test the service directly
    const { campaignMetricsService } = await import('@/services/campaignMetricsService');
    
    console.log('📡 Calling campaignMetricsService.getCampaignMetrics with fake ID...');
    const result = await campaignMetricsService.getCampaignMetrics('debug-fake-user-id-12345');
    
    console.log('📋 Raw result object:', result);
    console.log('📋 Result success:', result.success);
    console.log('📋 Result error:', result.error);
    console.log('📋 Result error type:', typeof result.error);
    
    if (result.error) {
      console.log('📋 Result error toString():', result.error.toString());
      console.log('📋 Result error JSON:', JSON.stringify(result.error));
      
      // Test our error formatter
      const { formatErrorForUI } = await import('@/utils/errorUtils');
      const formatted = formatErrorForUI(result.error);
      console.log('📋 Formatted error:', formatted);
      console.log('📋 Formatted error type:', typeof formatted);
      
      // Check if it's literally "[object Object]"
      if (result.error === '[object Object]') {
        console.error('❌ FOUND IT! The service is returning "[object Object]" as a string');
        return { source: 'service-return', issue: 'returning-literal-string' };
      } else if (typeof result.error === 'object' && result.error.toString() === '[object Object]') {
        console.error('❌ FOUND IT! The service is returning an object that stringifies to "[object Object]"');
        return { source: 'service-return', issue: 'object-toString' };
      } else if (formatted === '[object Object]') {
        console.error('❌ FOUND IT! The formatErrorForUI function is producing "[object Object]"');
        return { source: 'error-formatter', issue: 'formatter-broken' };
      } else {
        console.log('✅ Error is properly formatted:', formatted);
        return { source: 'external', issue: 'possibly-cached-or-other-source' };
      }
    } else {
      console.log('ℹ️ No error returned - unexpected result structure');
      return { source: 'unknown', issue: 'no-error-in-result' };
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return { source: 'test-failure', issue: error.message };
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugCampaignErrorSource = debugCampaignErrorSource;
  console.log('🔧 Debug function available: debugCampaignErrorSource()');
}
