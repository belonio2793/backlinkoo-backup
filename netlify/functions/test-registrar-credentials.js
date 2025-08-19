/**
 * Test registrar API credentials
 * Supports Cloudflare, Namecheap, GoDaddy, DigitalOcean, Route 53
 */
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      })
    };
  }

  try {
    const credentials = JSON.parse(event.body || '{}');
    
    if (!credentials.registrarCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Registrar code is required'
        })
      };
    }

    console.log(`🔧 Testing credentials for ${credentials.registrarCode}`);

    // Test credentials based on registrar
    const result = await testCredentialsByRegistrar(credentials);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Credential test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error during credential test',
        details: error.message
      })
    };
  }
};

/**
 * Test credentials for specific registrar
 */
async function testCredentialsByRegistrar(credentials) {
  switch (credentials.registrarCode) {
    case 'cloudflare':
      return await testCloudflareCredentials(credentials);
    
    case 'namecheap':
      return await testNamecheapCredentials(credentials);
    
    case 'godaddy':
      return await testGoDaddyCredentials(credentials);
    
    case 'digitalocean':
      return await testDigitalOceanCredentials(credentials);
    
    case 'route53':
      return await testRoute53Credentials(credentials);
    
    default:
      return {
        success: false,
        message: `Registrar ${credentials.registrarCode} not supported yet`
      };
  }
}

/**
 * Test Cloudflare API credentials
 */
async function testCloudflareCredentials(credentials) {
  try {
    if (!credentials.apiKey) {
      return {
        success: false,
        message: 'API key is required for Cloudflare'
      };
    }

    // Test API access by getting user info
    const response = await fetch('https://api.cloudflare.com/client/v4/user', {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        message: 'Cloudflare credentials verified successfully',
        accountInfo: {
          email: data.result.email,
          id: data.result.id,
          organization: data.result.organizations?.[0]?.name || 'Personal'
        }
      };
    } else {
      return {
        success: false,
        message: data.errors?.[0]?.message || 'Invalid Cloudflare credentials'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Cloudflare API error: ${error.message}`
    };
  }
}

/**
 * Test Namecheap API credentials
 */
async function testNamecheapCredentials(credentials) {
  try {
    if (!credentials.apiKey || !credentials.userId) {
      return {
        success: false,
        message: 'API key and user ID are required for Namecheap'
      };
    }

    // Test API access by getting domain list (limited call)
    const url = new URL('https://api.namecheap.com/xml.response');
    url.searchParams.set('ApiUser', credentials.userId);
    url.searchParams.set('ApiKey', credentials.apiKey);
    url.searchParams.set('UserName', credentials.userId);
    url.searchParams.set('Command', 'namecheap.domains.getList');
    url.searchParams.set('ClientIp', '127.0.0.1'); // Placeholder IP

    const response = await fetch(url.toString());
    const text = await response.text();

    // Simple XML parsing for success/error
    if (text.includes('Status="OK"')) {
      return {
        success: true,
        message: 'Namecheap credentials verified successfully',
        accountInfo: {
          userId: credentials.userId
        }
      };
    } else if (text.includes('Authentication failed') || text.includes('Invalid ApiKey')) {
      return {
        success: false,
        message: 'Invalid Namecheap API credentials'
      };
    } else {
      return {
        success: false,
        message: 'Namecheap API error - check your credentials and IP whitelist'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Namecheap API error: ${error.message}`
    };
  }
}

/**
 * Test GoDaddy API credentials
 */
async function testGoDaddyCredentials(credentials) {
  try {
    if (!credentials.apiKey || !credentials.apiSecret) {
      return {
        success: false,
        message: 'API key and secret are required for GoDaddy'
      };
    }

    // Test API access by getting domain list
    const response = await fetch('https://api.godaddy.com/v1/domains', {
      headers: {
        'Authorization': `sso-key ${credentials.apiKey}:${credentials.apiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const domains = await response.json();
      return {
        success: true,
        message: 'GoDaddy credentials verified successfully',
        accountInfo: {
          domainCount: domains.length
        }
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'Invalid GoDaddy API credentials'
      };
    } else {
      return {
        success: false,
        message: `GoDaddy API error: HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `GoDaddy API error: ${error.message}`
    };
  }
}

/**
 * Test DigitalOcean API credentials
 */
async function testDigitalOceanCredentials(credentials) {
  try {
    if (!credentials.apiKey) {
      return {
        success: false,
        message: 'API key is required for DigitalOcean'
      };
    }

    // Test API access by getting account info
    const response = await fetch('https://api.digitalocean.com/v2/account', {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'DigitalOcean credentials verified successfully',
        accountInfo: {
          email: data.account.email,
          uuid: data.account.uuid,
          status: data.account.status
        }
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'Invalid DigitalOcean API token'
      };
    } else {
      return {
        success: false,
        message: `DigitalOcean API error: HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `DigitalOcean API error: ${error.message}`
    };
  }
}

/**
 * Test AWS Route 53 credentials
 */
async function testRoute53Credentials(credentials) {
  // Route 53 requires AWS SDK and proper credential handling
  // For now, return a placeholder response
  return {
    success: false,
    message: 'Route 53 integration requires AWS SDK setup - contact support for configuration'
  };
}
