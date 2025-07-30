// Test connection function for API services (OpenAI, Resend, etc.)
exports.handler = async (event, context) => {
  console.log('🧪 Test connection function called');

  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  // Basic function test if no body provided
  if (event.httpMethod === 'GET') {
    try {
      const response = {
        success: true,
        message: 'Netlify functions are working correctly',
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
          hasOpenAI: !!process.env.OPENAI_API_KEY,
          hasResend: !!process.env.RESEND_API_KEY
        }
      };

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
      };
    } catch (error) {
      console.error('Basic test function error:', error);

      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  // Service-specific testing for POST requests
  if (event.httpMethod === 'POST') {
    try {
      const { service, apiKey } = JSON.parse(event.body || '{}');

      if (service === 'openai') {
        return await testOpenAI(apiKey);
      } else if (service === 'resend') {
        return await testResend(apiKey);
      } else {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            error: 'Unsupported service. Use "openai" or "resend"'
          })
        };
      }
    } catch (error) {
      console.error('Service test error:', error);

      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: false,
      error: 'Method not allowed. Use GET or POST.'
    })
  };
};

async function testOpenAI(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: `OpenAI API responding (${data.data?.length || 0} models available)`,
          details: {
            modelsAvailable: data.data?.length || 0,
            keyValid: true
          }
        })
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || 'Invalid API key'}`
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: `OpenAI connection failed: ${error.message}`
      })
    };
  }
}

async function testResend(apiKey) {
  try {
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: `Resend API responding (${data.data?.length || 0} domains configured)`,
          details: {
            domainsConfigured: data.data?.length || 0,
            keyValid: true
          }
        })
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: `Resend API error: ${errorData.message || 'Invalid API key'}`
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: `Resend connection failed: ${error.message}`
      })
    };
  }
}
