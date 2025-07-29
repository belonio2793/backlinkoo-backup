/**
 * Simple API Status Checker
 * Returns overall API availability for AI Live system
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

    // System is online if OpenAI API key is configured
    const isOnline = hasOpenAIKey;
    
    const providerStatus = {
      OpenAI: {
        configured: hasOpenAIKey,
        status: hasOpenAIKey ? 'online' : 'not_configured'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        online: isOnline,
        providers: providerStatus,
        message: isOnline ? 'AI services available' : 'No AI providers configured',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Status check error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        online: false,
        error: 'Status check failed',
        timestamp: new Date().toISOString()
      })
    };
  }
};
