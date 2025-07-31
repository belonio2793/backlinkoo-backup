/**
 * OpenAI Status Check Function
 * Simple health check for OpenAI API connectivity
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const startTime = Date.now();

    // Check if API key is configured
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    const keyValid = hasApiKey && process.env.OPENAI_API_KEY.startsWith('sk-');

    if (!keyValid) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          configured: false,
          status: 'not_configured',
          message: 'OpenAI API key not configured or invalid',
          responseTime: Date.now() - startTime
        })
      };
    }

    // Test the actual API connection
    console.log('🔍 Testing OpenAI API connectivity...');
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const modelCount = data.data ? data.data.length : 0;
      
      console.log(`✅ OpenAI API connected - ${modelCount} models available`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          configured: true,
          status: 'connected',
          message: `OpenAI API connected - ${modelCount} models available`,
          responseTime,
          modelCount,
          keyPreview: process.env.OPENAI_API_KEY.substring(0, 12) + '...'
        })
      };
    } else {
      const errorData = await response.text().catch(() => '');
      console.error('❌ OpenAI API error:', response.status, errorData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          configured: true,
          status: 'error',
          message: `OpenAI API error: ${response.status} ${response.statusText}`,
          responseTime,
          error: errorData
        })
      };
    }

  } catch (error) {
    console.error('OpenAI status check failed:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configured: !!process.env.OPENAI_API_KEY,
        status: 'error',
        message: `OpenAI connection failed: ${error.message}`,
        responseTime: Date.now() - Date.now(),
        error: error.message
      })
    };
  }
};
