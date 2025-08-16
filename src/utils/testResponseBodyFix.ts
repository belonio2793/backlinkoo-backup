/**
 * Test Response Body Fix
 * Verify that the getEmptyResult method fix is working correctly
 */

export async function testResponseBodyFix(): Promise<void> {
  try {
    console.log('🧪 Testing Response Body Fix...');

    // Import the ResponseBodyManager to trigger the fix
    const { ResponseBodyManager } = await import('./responseBodyFix');

    // Test creating a mock response
    const testResponse = new Response('{"test": "data"}', {
      status: 200,
      statusText: 'OK'
    });

    // Test the getEmptyResult method
    const manager = ResponseBodyManager.getInstance();
    const emptyJson = await manager.getEmptyResult('json');
    const emptyText = await manager.getEmptyResult('text');

    console.log('✅ Response Body Fix test passed');
    console.log('  - getEmptyResult(json):', emptyJson);
    console.log('  - getEmptyResult(text):', emptyText);

    // Test createMockResponse method
    const mockResponse = manager.createMockResponse(testResponse);
    console.log('  - createMockResponse created:', mockResponse.status);

    return;
  } catch (error: any) {
    console.error('❌ Response Body Fix test failed:', error.message);
    throw error;
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testResponseBodyFix = testResponseBodyFix;
}
