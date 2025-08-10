/**
 * Debug test to verify that error formatting is working correctly
 * This will help identify if the [object Object] issue is resolved
 */

import { formatErrorForUI, formatErrorForLogging } from './errorUtils';

export function runErrorFormattingDebugTest() {
  console.log('🔧 Running Error Formatting Debug Test...');
  
  // Test 1: Simulate a Supabase error object (common cause of [object Object])
  const supabaseError = {
    code: '42P01',
    message: 'relation "campaign_runtime_metrics" does not exist',
    details: null,
    hint: 'Perhaps you meant to reference the table "public"."campaigns"?'
  };
  
  console.log('🧪 Test 1 - Supabase Error Object:');
  console.log('Input:', supabaseError);
  console.log('formatErrorForUI result:', formatErrorForUI(supabaseError));
  console.log('formatErrorForLogging result:', formatErrorForLogging(supabaseError));
  
  // Test 2: Standard Error object
  const standardError = new Error('This is a test error message');
  standardError.code = 'TEST_CODE';
  
  console.log('\n🧪 Test 2 - Standard Error Object:');
  console.log('Input:', standardError);
  console.log('formatErrorForUI result:', formatErrorForUI(standardError));
  console.log('formatErrorForLogging result:', formatErrorForLogging(standardError));
  
  // Test 3: Plain object (what causes [object Object])
  const plainObject = { someProperty: 'value', nested: { data: 'test' } };
  
  console.log('\n🧪 Test 3 - Plain Object (problematic case):');
  console.log('Input:', plainObject);
  console.log('formatErrorForUI result:', formatErrorForUI(plainObject));
  console.log('formatErrorForLogging result:', formatErrorForLogging(plainObject));
  
  // Test 4: Null/undefined
  console.log('\n🧪 Test 4 - Null/Undefined:');
  console.log('formatErrorForUI(null):', formatErrorForUI(null));
  console.log('formatErrorForUI(undefined):', formatErrorForUI(undefined));
  
  // Test 5: String (should pass through)
  console.log('\n🧪 Test 5 - String:');
  console.log('formatErrorForUI("string error"):', formatErrorForUI("string error"));
  
  // Verify none of the results are [object Object]
  const results = [
    formatErrorForUI(supabaseError),
    formatErrorForUI(standardError),
    formatErrorForUI(plainObject),
    formatErrorForUI(null),
    formatErrorForUI(undefined),
    formatErrorForUI("string error")
  ];
  
  const hasObjectObjectError = results.some(result => result === '[object Object]');
  
  if (hasObjectObjectError) {
    console.error('❌ FOUND [object Object] in results! Error formatting is not working properly.');
    return false;
  } else {
    console.log('✅ SUCCESS: No [object Object] found in any results. Error formatting is working correctly!');
    return true;
  }
}

// Auto-expose in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).runErrorFormattingDebugTest = runErrorFormattingDebugTest;
  console.log('🔧 Debug test available: runErrorFormattingDebugTest()');
}
