// Simple test to verify content generation with the configured APIs

async function testContentGeneration() {
  console.log('🧪 Testing content generation with HuggingFace and Cohere...');
  
  try {
    // Import the globalBlogGenerator
    const { globalBlogGenerator } = await import('./src/services/globalBlogGenerator.js');
    
    const testRequest = {
      targetUrl: 'https://example.com',
      primaryKeyword: 'digital marketing',
      anchorText: 'marketing tools',
      sessionId: 'test-session-' + Date.now(),
      userLocation: 'United States',
      additionalContext: {
        contentLength: 'medium',
        contentTone: 'professional',
        seoFocus: 'high'
      }
    };
    
    console.log('📝 Making blog generation request...');
    const result = await globalBlogGenerator.generateGlobalBlogPost(testRequest);
    
    if (result.success) {
      console.log('✅ Content generation successful!');
      console.log('📊 Details:', {
        provider: result.data?.blogPost?.ai_provider || 'template',
        title: result.data?.blogPost?.title,
        wordCount: result.data?.blogPost?.word_count,
        seoScore: result.data?.blogPost?.seo_score,
        hasBacklink: result.data?.blogPost?.content?.includes(testRequest.targetUrl)
      });
      
      if (result.data?.blogPost?.content) {
        console.log('📄 Content preview:', result.data.blogPost.content.substring(0, 300) + '...');
      }
    } else {
      console.error('❌ Content generation failed:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  }
}

// Run the test
testContentGeneration()
  .then(() => console.log('🎉 Test completed'))
  .catch(error => console.error('💥 Test crashed:', error));
