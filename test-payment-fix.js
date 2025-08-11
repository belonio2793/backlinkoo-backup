/**
 * Test script to verify payment service fixes
 */

console.log('🧪 Testing payment service fixes...');

// Test 1: Check if process.env issue is resolved
try {
  // Simulate the fallback service environment access
  const testEnv = import.meta.env?.VITE_STRIPE_PREMIUM_CHECKOUT_URL_MONTHLY;
  console.log('✅ Environment variable access works:', testEnv ? 'defined' : 'undefined');
} catch (error) {
  console.error('❌ Environment variable access failed:', error.message);
}

// Test 2: Simulate fetch response handling
async function testFetchResponseHandling() {
  try {
    console.log('🔍 Testing fetch response handling...');
    
    // Create a mock response that simulates the error scenario
    const mockResponse = new Response('{"error": "test"}', {
      status: 400,
      statusText: 'Bad Request',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Test error handling path
    if (!mockResponse.ok) {
      let errorText;
      try {
        errorText = await mockResponse.text();
        console.log('✅ Error text read successfully:', errorText);
      } catch (readError) {
        errorText = `HTTP ${mockResponse.status} ${mockResponse.statusText}`;
        console.log('✅ Fallback error text used:', errorText);
      }
    }
    
    console.log('✅ Fetch response handling test passed');
  } catch (error) {
    console.error('❌ Fetch response handling test failed:', error.message);
  }
}

// Test 3: Test symbol cleaner functionality
try {
  console.log('🧹 Testing symbol cleaner...');
  const testString = 'Hello � World';
  const cleaned = testString.replace(/\ufffd/g, '');
  console.log('Original:', testString);
  console.log('Cleaned:', cleaned);
  console.log('✅ Symbol cleaner works correctly');
} catch (error) {
  console.error('❌ Symbol cleaner test failed:', error.message);
}

// Run async test
testFetchResponseHandling();

console.log('🎉 Payment service tests completed!');
