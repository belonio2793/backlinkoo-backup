/**
 * Silent Error Handler Test
 * 
 * Verify error handling without creating unhandled promise rejections
 */

import { formatErrorForUI } from './errorUtils';

export function testErrorFormattingOnly() {
  console.log('🧪 Testing error formatting (no promise rejections)...');

  // Test various error objects to ensure proper formatting
  const testErrors = [
    // Object error
    {
      error: 'database connection failed',
      code: 'PGRST116',
      details: 'Row not found',
      hint: 'Check your query parameters'
    },
    // String error
    'Simple string error',
    // Null/undefined
    null,
    undefined,
    // Error object
    new Error('Standard error object'),
    // Nested object error
    {
      response: {
        data: {
          error: 'Nested error message',
          status: 500
        }
      }
    },
    // Campaign-specific error
    {
      message: 'Campaign toggle failed',
      campaign_id: 'test-123',
      operation: 'toggle'
    }
  ];

  console.group('🔍 Error Formatting Test Results:');
  
  testErrors.forEach((error, index) => {
    const formatted = formatErrorForUI(error);
    const type = typeof error;
    
    console.log(`Test ${index + 1} (${type}):`, {
      original: error,
      formatted: formatted,
      isObjectObject: formatted === '[object Object]' ? '❌ FAILED' : '✅ PASSED'
    });
  });
  
  console.groupEnd();
  
  // Test console.error override with objects
  console.log('\n🔍 Testing console.error override:');
  console.error('Test error with object:', {
    error: 'This should not display as [object Object]',
    code: 500
  });
  
  console.log('✅ Error formatting test completed');
}

// Add to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testErrorFormattingOnly = testErrorFormattingOnly;
}

export default testErrorFormattingOnly;
