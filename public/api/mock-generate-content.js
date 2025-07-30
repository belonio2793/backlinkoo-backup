// Mock API endpoint for development
// This simulates the Netlify function behavior
(async function() {
  // Simulate content generation
  const mockGenerateContent = (prompt, type = 'general') => {
    const responses = {
      general: 'This is mock generated content for testing purposes.',
      blog_post: '# Mock Blog Post\n\nThis is a mock blog post generated for testing the content generation system.',
      seo_keywords: 'mock keywords\ntest content\nsample data\ndevelopment mode'
    };

    return {
      success: true,
      content: responses[type] || responses.general,
      type: type,
      usage: {
        tokens: 50,
        cost: 0.0001
      },
      timestamp: new Date().toISOString()
    };
  };

  // Simulate the response
  const response = mockGenerateContent('test prompt', 'general');
  
  if (typeof window !== 'undefined') {
    console.log('Mock generate-content response:', response);
  }
  
  return response;
})();
