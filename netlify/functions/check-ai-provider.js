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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { provider } = JSON.parse(event.body);

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
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `${provider} API key not configured` })
      };
    }

    // Check provider health
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
        healthy: isHealthy,
        status: response.status,
        latency: Date.now() - Date.now() // This would be calculated properly in real implementation
      })
    };

  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Health check failed' })
    };
  }
};
