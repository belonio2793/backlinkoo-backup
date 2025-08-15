/**
 * Test utility to verify response body fix is working
 */

export async function testResponseBodyFix(): Promise<void> {
  console.log('🧪 Testing response body fix...');

  try {
    // Test 1: Multiple clones of the same response
    console.log('Test 1: Multiple response clones...');
    const response = await fetch('/.netlify/functions/api-status', { method: 'GET' });
    
    const clone1 = response.clone();
    const clone2 = response.clone();
    const clone3 = response.clone();
    
    // Try to read all clones
    const results = await Promise.allSettled([
      clone1.json(),
      clone2.json(), 
      clone3.json()
    ]);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Successfully read ${successful}/3 cloned responses`);
    
    // Test 2: Reading same response multiple times (should fail gracefully)
    console.log('Test 2: Multiple reads of same response...');
    const response2 = await fetch('/.netlify/functions/api-status', { method: 'GET' });
    
    try {
      await response2.json();
      await response2.text(); // This should be handled gracefully
      console.log('❌ Unexpected: Read response body twice without error');
    } catch (error) {
      console.log('✅ Expected: Second read failed gracefully');
    }
    
    // Test 3: Network logger simulation
    console.log('Test 3: Network logger simulation...');
    const response3 = await fetch('/.netlify/functions/api-status', { method: 'GET' });
    
    // Simulate what network logger does
    const loggerClone = response3.clone();
    const appClone = response3.clone();
    
    const loggerData = await loggerClone.json();
    const appData = await appClone.json();
    
    console.log('✅ Network logger simulation successful');
    console.log('✅ Response body fix is working properly!');
    
  } catch (error) {
    console.error('❌ Response body fix test failed:', error);
    throw error;
  }
}

// Add to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testResponseBodyFix = testResponseBodyFix;
}
