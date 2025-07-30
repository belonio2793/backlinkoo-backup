/**
 * Netlify Function: Test OpenAI Configuration
 * Simple test to verify OpenAI API key configuration
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
    const openaiKey = process.env.OPENAI_API_KEY;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        hasKey: !!openaiKey,
        keyLength: openaiKey ? openaiKey.length : 0,
        keyPreview: openaiKey ? `${openaiKey.substring(0, 8)}...` : 'Not set',
        environment: process.env.NODE_ENV || 'unknown',
        availableEnvVars: Object.keys(process.env).filter(key => 
          key.includes('OPENAI') || key.includes('API')
        )
      })
    };

  } catch (error) {
    console.error('Config test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to check configuration',
        message: error.message 
      })
    };
  }
};
