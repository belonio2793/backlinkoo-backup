/**
 * Test script to verify error handling improvements
 * This script tests that errors are properly formatted and no [object Object] appears
 */

import { getErrorMessage, getErrorDetails, formatUserError, createErrorResponse } from './src/utils/errorFormatter.js';

// Test cases for various error types
const testCases = [
  {
    name: 'Standard Error object',
    error: new Error('This is a standard error message'),
    expected: 'This is a standard error message'
  },
  {
    name: 'String error',
    error: 'This is a string error',
    expected: 'This is a string error'
  },
  {
    name: 'Object with message property',
    error: { message: 'Object error message', code: 'ERR_001' },
    expected: 'Object error message'
  },
  {
    name: 'Object with error property',
    error: { error: 'Error in error property', status: 500 },
    expected: 'Error in error property'
  },
  {
    name: 'Nested error object',
    error: { response: { data: { message: 'Nested error message' } } },
    expected: 'Nested error message'
  },
  {
    name: 'Object with details property',
    error: { details: 'Error details message', type: 'validation' },
    expected: 'Error details message'
  },
  {
    name: 'Complex object with multiple properties',
    error: { 
      message: 'Main error message',
      error: 'Secondary error',
      details: 'Error details',
      statusText: 'Bad Request'
    },
    expected: 'Main error message'
  },
  {
    name: 'Empty object',
    error: {},
    expected: 'An unexpected error occurred'
  },
  {
    name: 'Null error',
    error: null,
    expected: 'An unexpected error occurred'
  },
  {
    name: 'Undefined error',
    error: undefined,
    expected: 'An unexpected error occurred'
  },
  {
    name: 'Database-like error',
    error: {
      message: 'relation "campaigns" does not exist',
      code: '42P01',
      details: 'The table campaigns was not found in schema public'
    },
    expected: 'relation "campaigns" does not exist'
  }
];

console.log('🧪 Testing Error Handling Improvements\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  
  try {
    const result = getErrorMessage(testCase.error);
    const details = getErrorDetails(testCase.error);
    const userMessage = formatUserError(testCase.error, 'Operation failed');
    const response = createErrorResponse(testCase.error, 'test-context');
    
    // Check if result contains [object Object]
    if (result.includes('[object Object]')) {
      console.log(`  ❌ FAIL: Contains [object Object]: "${result}"`);
      failed++;
      return;
    }
    
    // Check if result matches expected
    if (result === testCase.expected) {
      console.log(`  ✅ PASS: "${result}"`);
      console.log(`    Type: ${details.type}`);
      console.log(`    User message: "${userMessage}"`);
      console.log(`    Response success: ${response.success}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Expected "${testCase.expected}", got "${result}"`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ ERROR: Test threw exception: ${error.message}`);
    failed++;
  }
  
  console.log('');
});

console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Error handling improvements are working correctly.');
  console.log('✅ No [object Object] display issues detected');
  console.log('✅ All error types properly handled');
  console.log('✅ Meaningful error messages extracted');
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Please review the error handling logic.`);
}

// Test the specific error patterns mentioned in the issue
console.log('\n🔍 Testing specific error patterns from the issue:');

// Simulate the "Failed to get user reports [object Object]" issue
try {
  const mockSupabaseError = {
    message: 'Permission denied',
    code: 'PGRST301',
    details: null,
    hint: null
  };
  
  const userReportsError = getErrorMessage(mockSupabaseError);
  console.log(`User reports error: "${userReportsError}"`);
  
  if (userReportsError.includes('[object Object]')) {
    console.log('❌ Still contains [object Object]');
  } else {
    console.log('✅ Properly formatted error message');
  }
} catch (error) {
  console.log(`❌ Error testing user reports pattern: ${error.message}`);
}

// Simulate the "Failed to create campaign [object Object]" issue
try {
  const mockCampaignError = {
    error: 'Database connection failed',
    statusCode: 500,
    timestamp: new Date().toISOString()
  };
  
  const campaignError = getErrorMessage(mockCampaignError);
  console.log(`Campaign creation error: "${campaignError}"`);
  
  if (campaignError.includes('[object Object]')) {
    console.log('❌ Still contains [object Object]');
  } else {
    console.log('✅ Properly formatted error message');
  }
} catch (error) {
  console.log(`❌ Error testing campaign creation pattern: ${error.message}`);
}

console.log('\n🎯 Error handling improvements test completed!');
