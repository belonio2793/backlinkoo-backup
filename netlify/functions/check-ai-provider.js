/**
 * Netlify Function: Check AI Provider Health
 * Verifies if OpenAI or Grok APIs are available
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let provider;

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      provider = body.provider;
    } else {
      // GET request - get provider from query parameters
      provider = event.queryStringParameters?.provider;
    }

    if (!provider) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Provider name required' })
      };
    }

    let apiKey, endpoint;

    switch (provider) {
      case 'OpenAI':
        apiKey = process.env.OPENAI_API_KEY;
        endpoint = 'https://api.openai.com/v1/models';
        break;
      case 'Grok':
        apiKey = process.env.GROK_API_KEY;
        endpoint = 'https://api.x.ai/v1/models';
        break;
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unsupported provider' })
        };
    }

    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          provider,
          configured: false,
          message: `${provider} API key not configured in Netlify environment`
        })
      };
    }

    // Check provider health
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const isHealthy = response.ok;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          provider,
          configured: true,
          healthy: isHealthy,
          status: response.status,
          message: isHealthy ? `${provider} API is working correctly` : `${provider} API key invalid`
        })
      };
    } catch (fetchError) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          provider,
          configured: true,
          healthy: false,
          message: `${provider} API connection failed`,
          error: fetchError.message
        })
      };
    }

  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Health check failed' })
    };
  }
};
