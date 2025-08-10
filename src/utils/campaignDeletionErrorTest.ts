/**
 * Test utility to verify campaign deletion error handling is working correctly
 * Tests that error objects are properly formatted and not showing "[object Object]"
 */

import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';

export async function testCampaignDeletionErrorHandling(): Promise<{
  success: boolean;
  results: string[];
  errors: string[];
}> {
  const results: string[] = [];
  const errors: string[] = [];
  let allPassed = true;

  console.log('🧪 Testing Campaign Deletion Error Handling...\n');

  // Test 1: Generic Error object
  console.log('Test 1: Generic Error object formatting');
  const genericError = new Error('Campaign not found');
  const formatted1 = formatErrorForUI(genericError);
  results.push(`Generic Error: "${formatted1}"`);
  if (formatted1 === '[object Object]') {
    errors.push('Generic Error formatting failed');
    allPassed = false;
  }

  // Test 2: Supabase-style error object
  console.log('Test 2: Supabase-style error object formatting');
  const supabaseError = {
    message: 'Permission denied',
    code: '42501',
    details: 'User does not have permission to delete this campaign',
    hint: 'Check if user owns the campaign'
  };
  const formatted2 = formatErrorForUI(supabaseError);
  results.push(`Supabase Error: "${formatted2}"`);
  if (formatted2 === '[object Object]') {
    errors.push('Supabase Error formatting failed');
    allPassed = false;
  }

  // Test 3: Network error object
  console.log('Test 3: Network error object formatting');
  const networkError = {
    name: 'TypeError',
    message: 'Failed to fetch',
    stack: 'TypeError: Failed to fetch\n    at fetch...'
  };
  const formatted3 = formatErrorForUI(networkError);
  results.push(`Network Error: "${formatted3}"`);
  if (formatted3 === '[object Object]') {
    errors.push('Network Error formatting failed');
    allPassed = false;
  }

  // Test 4: API error response
  console.log('Test 4: API error response formatting');
  const apiError = {
    error: 'Campaign deletion failed',
    details: 'Database deletion failed. Please try again or contact support.',
    supportInfo: {
      campaignId: 'test-123',
      timestamp: new Date().toISOString(),
      errorCode: 'DB_DELETE_FAILED'
    }
  };
  const formatted4 = formatErrorForUI(apiError.error);
  results.push(`API Error: "${formatted4}"`);
  if (formatted4 === '[object Object]') {
    errors.push('API Error formatting failed');
    allPassed = false;
  }

  // Test 5: Error logging format
  console.log('Test 5: Error logging format');
  const logFormat = formatErrorForLogging(genericError, 'deleteCampaign');
  results.push(`Log Format: ${JSON.stringify(logFormat, null, 2)}`);
  if (JSON.stringify(logFormat).includes('[object Object]')) {
    errors.push('Error logging format contains [object Object]');
    allPassed = false;
  }

  // Test 6: Null/undefined error handling
  console.log('Test 6: Null/undefined error handling');
  const formatted6a = formatErrorForUI(null);
  const formatted6b = formatErrorForUI(undefined);
  results.push(`Null Error: "${formatted6a}"`);
  results.push(`Undefined Error: "${formatted6b}"`);
  if (formatted6a === '[object Object]' || formatted6b === '[object Object]') {
    errors.push('Null/undefined error formatting failed');
    allPassed = false;
  }

  // Test 7: Empty object error handling
  console.log('Test 7: Empty object error handling');
  const emptyObjectError = {};
  const formatted7 = formatErrorForUI(emptyObjectError);
  results.push(`Empty Object Error: "${formatted7}"`);
  if (formatted7 === '[object Object]') {
    errors.push('Empty object error formatting failed');
    allPassed = false;
  }

  console.log('\n📋 Test Results:');
  results.forEach(result => console.log(`  ✓ ${result}`));

  if (errors.length > 0) {
    console.log('\n❌ Test Failures:');
    errors.forEach(error => console.log(`  ✗ ${error}`));
  }

  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`Tests run: ${results.length}, Failures: ${errors.length}\n`);

  return {
    success: allPassed,
    results,
    errors
  };
}

// Auto-run test when imported in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Run test after a short delay to ensure dependencies are loaded
  setTimeout(() => {
    testCampaignDeletionErrorHandling().catch(console.error);
  }, 1000);
}
