/**
 * Test utility to verify error handling fixes are working
 * This can be run in the browser console to test error formatting
 */

import { formatErrorForUI, formatErrorForLogging } from './errorUtils';

export function testErrorFormatting() {
  console.log('🧪 Testing Error Formatting Fixes...');

  // Test 1: Standard Error object
  const standardError = new Error('This is a test error message');
  standardError.code = 'TEST_ERROR_CODE';
  console.log('✅ Standard Error:', formatErrorForUI(standardError));
  console.log('✅ Standard Error (logging):', formatErrorForLogging(standardError));

  // Test 2: Supabase-like error object
  const supabaseError = {
    message: 'relation "campaign_metrics" does not exist',
    code: '42P01',
    details: null,
    hint: 'Perhaps you meant to reference the table "public"."campaigns"?'
  };
  console.log('✅ Supabase Error:', formatErrorForUI(supabaseError));
  console.log('✅ Supabase Error (logging):', formatErrorForLogging(supabaseError));

  // Test 3: Plain object (this would show [object Object] before)
  const plainObject = { someField: 'value', nested: { field: 'test' } };
  console.log('✅ Plain Object:', formatErrorForUI(plainObject));

  // Test 4: String error
  const stringError = 'Simple string error message';
  console.log('✅ String Error:', formatErrorForUI(stringError));

  // Test 5: Null/undefined
  console.log('✅ Null Error:', formatErrorForUI(null));
  console.log('✅ Undefined Error:', formatErrorForUI(undefined));

  // Test 6: Response-like object (common cause of body stream errors)
  const mockResponse = {
    status: 500,
    statusText: 'Internal Server Error',
    message: 'Database connection failed'
  };
  console.log('✅ Response-like Error:', formatErrorForUI(mockResponse));

  console.log('🎉 Error formatting test complete! All errors should be readable strings, no [object Object]');
  
  return {
    standardError: formatErrorForUI(standardError),
    supabaseError: formatErrorForUI(supabaseError),
    plainObject: formatErrorForUI(plainObject),
    stringError: formatErrorForUI(stringError),
    nullError: formatErrorForUI(null),
    undefinedError: formatErrorForUI(undefined),
    responseError: formatErrorForUI(mockResponse)
  };
}

// Auto-run test in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testErrorFormatting = testErrorFormatting;
  console.log('🔧 Error formatting test available: testErrorFormatting()');
}
