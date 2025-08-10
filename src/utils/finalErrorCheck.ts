/**
 * Final comprehensive error check to identify the exact source of [object Object]
 * This will trace through the entire error path to find where it's coming from
 */

export async function finalErrorCheck() {
  console.log('🔍 FINAL ERROR CHECK - Tracing [object Object] source...');
  
  // Step 1: Test formatErrorForUI directly
  console.log('\n📝 Step 1: Testing formatErrorForUI function directly...');
  
  const { formatErrorForUI } = await import('@/utils/errorUtils');
  
  // Test with various problematic objects
  const testObjects = [
    { code: '42P01', message: 'test error' },
    new Error('test error'),
    { toString: () => '[object Object]' }, // Problematic object
    '[object Object]', // Already a string
    null,
    undefined
  ];
  
  for (let i = 0; i < testObjects.length; i++) {
    const input = testObjects[i];
    const output = formatErrorForUI(input);
    console.log(`  Test ${i + 1}: ${typeof input} -> "${output}"`);
    
    if (output === '[object Object]') {
      console.error(`  ❌ FOUND ISSUE: formatErrorForUI produces [object Object] for input:`, input);
    }
  }
  
  // Step 2: Test the actual campaign service call
  console.log('\n📝 Step 2: Testing campaignMetricsService call...');
  
  const { campaignMetricsService } = await import('@/services/campaignMetricsService');
  
  // Intercept console.error to see exactly what's being logged
  const originalConsoleError = console.error;
  let capturedErrors: any[] = [];
  
  console.error = (...args) => {
    capturedErrors.push(args);
    originalConsoleError(...args);
  };
  
  try {
    const result = await campaignMetricsService.getCampaignMetrics('final-check-user-' + Date.now());
    
    // Restore console.error
    console.error = originalConsoleError;
    
    console.log('📋 Service result:', result);
    console.log('📋 Captured console.error calls:', capturedErrors.length);
    
    // Check captured errors
    capturedErrors.forEach((errorArgs, index) => {
      console.log(`  Captured error ${index + 1}:`, errorArgs);
      
      // Check if any of the error arguments contain [object Object]
      const hasObjectError = errorArgs.some(arg => {
        if (typeof arg === 'string') {
          return arg.includes('[object Object]');
        } else if (typeof arg === 'object') {
          return arg && arg.toString() === '[object Object]';
        }
        return false;
      });
      
      if (hasObjectError) {
        console.error(`  ❌ FOUND [object Object] in captured error ${index + 1}:`, errorArgs);
      }
    });
    
    // Check the service result
    if (result.error === '[object Object]') {
      console.error('❌ FOUND ISSUE: Service returns literal [object Object] string');
    } else if (typeof result.error === 'object' && result.error && result.error.toString() === '[object Object]') {
      console.error('❌ FOUND ISSUE: Service returns object that stringifies to [object Object]');
    } else {
      console.log('✅ Service error is properly formatted:', result.error);
    }
    
  } catch (error) {
    console.error = originalConsoleError;
    console.error('❌ Service call failed:', error);
  }
  
  // Step 3: Summary
  console.log('\n📋 SUMMARY:');
  console.log('If [object Object] is still appearing, it might be:');
  console.log('1. Browser cache showing old errors');
  console.log('2. A different error source not covered by these fixes');
  console.log('3. An error in the formatErrorForUI function itself');
  
  console.log('\n🔧 To verify the fix is working:');
  console.log('1. Clear browser console completely');
  console.log('2. Trigger a fresh campaign metrics error');
  console.log('3. Check if the new error is properly formatted');
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).finalErrorCheck = finalErrorCheck;
  console.log('🔧 Final check available: finalErrorCheck()');
}
