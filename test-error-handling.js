// Test script for error handling improvements
// Run this in browser console to test error message extraction

import { getErrorMessage, formatErrorForUser } from './src/utils/errorUtils.js';

// Test cases for error message extraction
const testErrors = [
  // Standard Error object
  new Error('This is a test error'),
  
  // Object without message
  { someProperty: 'value' },
  
  // Supabase-style error
  { message: 'Database connection failed', details: 'Connection timeout', code: 'CONNECTION_ERROR' },
  
  // String error
  'Simple string error',
  
  // Null/undefined
  null,
  undefined,
  
  // Object that stringifies to [object Object]
  {},
  
  // Complex object
  { 
    error: 'Something went wrong',
    stack: 'Error: Something went wrong\n    at test (file.js:1:1)',
    timestamp: Date.now()
  }
];

console.log('🧪 Testing error message extraction...\n');

testErrors.forEach((error, index) => {
  console.log(`Test ${index + 1}:`, {
    input: error,
    getErrorMessage: getErrorMessage(error),
    formatErrorForUser: formatErrorForUser(error, 'Test Context')
  });
});

console.log('\n✅ Error handling test completed');
