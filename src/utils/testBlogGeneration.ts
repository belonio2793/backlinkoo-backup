/**
 * Test utility for blog generation
 */

import { DirectOpenAIService } from '@/services/directOpenAI';
import { environmentVariablesService } from '@/services/environmentVariablesService';

export async function testBlogGeneration() {
  console.log('🧪 Testing blog generation functionality...');
  
  try {
    // Check if OpenAI API key is configured
    const apiKey = await environmentVariablesService.getOpenAIKey();
    console.log('🔑 API Key status:', apiKey ? 'Configured' : 'Not configured');
    
    if (!apiKey) {
      console.log('❌ OpenAI API key not found. Please configure it in the admin panel.');
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    // Test with sample data
    const testRequest = {
      keyword: 'test SEO optimization',
      anchorText: 'learn more about SEO',
      targetUrl: 'https://example.com/seo-guide'
    };

    console.log('📝 Testing with sample data:', testRequest);

    const result = await DirectOpenAIService.generateBlogPost(testRequest);
    
    if (result.success) {
      console.log('✅ Blog generation test successful!');
      console.log('📄 Generated post:', {
        title: result.title,
        contentLength: result.content?.length,
        slug: result.slug,
        blogUrl: result.blogUrl
      });
      return result;
    } else {
      console.log('❌ Blog generation test failed:', result.error);
      return result;
    }
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export for testing in browser console
(window as any).testBlogGeneration = testBlogGeneration;
