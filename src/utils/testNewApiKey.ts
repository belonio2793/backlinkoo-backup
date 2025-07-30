/**
 * Immediate API Key Test
 * Tests the newly set API key to verify it's working
 */

import { validateAndTestApiKey } from './isolatedApiTester';

const API_KEY = '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';

export async function testCurrentApiKey() {
  console.log('🧪 Testing newly configured API key...');
  
  try {
    const result = await validateAndTestApiKey(API_KEY);
    
    if (result.success) {
      console.log('✅ API key test successful!');
      console.log('📊 Result:', result.message);
      console.log('⚡ Response time:', result.responseTime + 'ms');
      
      // Show success notification
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('api-key-success', {
          detail: { message: result.message, responseTime: result.responseTime }
        }));
      }
      
      return true;
    } else {
      console.error('❌ API key test failed:', result.message);
      
      // Show error notification
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('api-key-error', {
          detail: { message: result.message, status: result.status }
        }));
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing API key:', error);
    return false;
  }
}

// Auto-test when imported (with delay to ensure setup is complete)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testCurrentApiKey().then(success => {
      if (success) {
        console.log('🎉 OpenAI API key is ready for use!');
      } else {
        console.log('⚠️ OpenAI API key needs attention - check admin dashboard');
      }
    });
  }, 3000); // Wait 3 seconds for setup to complete
}
