// Mock API endpoint for development
// This simulates the Netlify function behavior
(async function() {
  // Simulate the OpenAI API check logic
  const mockCheckProvider = () => {
    // Check if we have the environment variable (simulate server-side check)
    const hasApiKey = true; // In real scenario, this would check process.env.OPENAI_API_KEY
    
    if (!hasApiKey) {
      return {
        provider: 'OpenAI',
        configured: false,
        message: 'OpenAI API key not configured in environment'
      };
    }

    // Simulate API health check
    return {
      provider: 'OpenAI',
      configured: true,
      healthy: true,
      status: 200,
      message: 'OpenAI API is working correctly'
    };
  };

  // Return the mock response
  const response = mockCheckProvider();
  
  // Set headers for JSON response
  if (typeof window !== 'undefined') {
    console.log('Mock check-ai-provider response:', response);
  }
  
  return response;
})();
