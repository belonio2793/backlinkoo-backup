/**
 * Direct test of the exact error formatting being used in the console.error
 */

export function testDirectErrorFormatting() {
  console.log('🧪 Testing Direct Error Formatting...');
  
  // Import the same functions used in the service
  import('@/utils/errorUtils').then(({ formatErrorForLogging }) => {
    
    // Create a mock Supabase error similar to what would be thrown
    const mockSupabaseError = {
      code: '42P01',
      message: 'relation "campaign_runtime_metrics" does not exist',
      details: null,
      hint: 'Perhaps you meant to reference the table "public"."campaigns"?'
    };
    
    console.log('🔍 Input error object:', mockSupabaseError);
    
    // Test the exact same call that's in the service
    const formattedResult = formatErrorForLogging(mockSupabaseError, 'getCampaignMetrics');
    
    console.log('🔍 formatErrorForLogging result:', formattedResult);
    console.log('🔍 Result type:', typeof formattedResult);
    
    // Test the exact console.error call
    console.error('Failed to fetch campaign metrics:', formattedResult);
    
    // Check if the result has any toString issues
    if (formattedResult && typeof formattedResult === 'object') {
      console.log('🔍 Object toString():', formattedResult.toString());
      console.log('🔍 Object JSON.stringify():', JSON.stringify(formattedResult));
    }
    
    // Test what happens when we concatenate with string
    const concatenated = 'Failed to fetch campaign metrics: ' + formattedResult;
    console.log('🔍 String concatenation result:', concatenated);
    
    if (concatenated.includes('[object Object]')) {
      console.error('❌ FOUND ISSUE: String concatenation produces [object Object]');
    } else {
      console.log('✅ String concatenation is safe');
    }
    
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testDirectErrorFormatting = testDirectErrorFormatting;
  console.log('🔧 Direct test available: testDirectErrorFormatting()');
}
