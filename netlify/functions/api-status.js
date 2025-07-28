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
    const hasGrokKey = !!process.env.GROK_API_KEY;
    
    // For demo purposes, consider system online if we have at least one API key
    const isOnline = hasOpenAIKey || hasGrokKey;
    
    const providerStatus = {
      OpenAI: {
        configured: hasOpenAIKey,
        status: hasOpenAIKey ? 'online' : 'not_configured'
      },
      Grok: {
        configured: hasGrokKey,
        status: hasGrokKey ? 'online' : 'not_configured'
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
