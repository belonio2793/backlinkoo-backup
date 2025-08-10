/**
 * Test error handling to ensure no [object Object] errors
 */

import { reliableContentGenerator } from '@/services/reliableContentGenerator';

export async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  try {
    const result = await reliableContentGenerator.generateContent(
      'Test content generation', 
      {
        primaryKeyword: 'test',
        targetUrl: 'https://example.com',
        anchorText: 'test link'
      }
    );
    
    console.log('✅ Content generation test completed:', {
      success: result.success,
      provider: result.provider,
      contentLength: result.content.length,
      fallbacksUsed: result.fallbacksUsed
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error in content generation test:', 
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

// Auto-run disabled to prevent console pollution
// To run manually: testErrorHandling()
if (import.meta.env.DEV) {
  (window as any).testErrorHandling = testErrorHandling;
  console.log('🔧 Error handling test available: testErrorHandling()');
}
