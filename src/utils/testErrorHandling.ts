/**
 * Error Handling Test Utility
 * 
 * Test the unified error handler to ensure [object Object] displays are fixed
 */

export function testErrorHandling() {
  console.log('🧪 Testing error handling...');

  // Test 1: Object error in promise rejection
  setTimeout(() => {
    Promise.reject({
      error: 'test database error',
      code: 'PGRST116',
      details: 'Row not found',
      hint: 'Check your query parameters'
    });
  }, 100);

  // Test 2: String error in promise rejection
  setTimeout(() => {
    Promise.reject('Simple string error');
  }, 200);

  // Test 3: Null/undefined error
  setTimeout(() => {
    Promise.reject(null);
  }, 300);

  // Test 4: Error object
  setTimeout(() => {
    Promise.reject(new Error('Standard error object'));
  }, 400);

  // Test 5: Nested object error
  setTimeout(() => {
    Promise.reject({
      response: {
        data: {
          error: 'Nested error message',
          status: 500
        }
      }
    });
  }, 500);

  // Test 6: Campaign-specific error
  setTimeout(() => {
    Promise.reject({
      message: 'Campaign toggle failed',
      campaign_id: 'test-123',
      operation: 'toggle'
    });
  }, 600);

  console.log('🧪 Test errors dispatched - check console output');
}

// Add to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testErrorHandling = testErrorHandling;
  
  // Auto-test in development
  if (import.meta.env.DEV) {
    setTimeout(() => {
      console.log('🔧 Running automatic error handling test...');
      testErrorHandling();
    }, 2000);
  }
}
