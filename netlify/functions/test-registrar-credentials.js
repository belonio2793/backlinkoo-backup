/**
 * Test registrar API credentials to verify they work correctly
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

    console.log(`🔧 Testing credentials for ${credentials.registrarCode}...`);

    // Test credentials based on registrar type
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
        message: 'Failed to test credentials',
        error: error.message
      })
    };
  }
};

/**
 * Test credentials for different registrars
 */
async function testCredentialsByRegistrar(credentials) {
  const { registrarCode, apiKey, apiSecret, accessToken, zone } = credentials;

  try {
    switch (registrarCode) {
      case 'cloudflare':
        return await testCloudflareCredentials(apiKey, zone);
      
      case 'namecheap':
        return await testNamecheapCredentials(apiKey, credentials.userId);
      
      case 'godaddy':
        return await testGoDaddyCredentials(apiKey, apiSecret);
      
      case 'route53':
        return await testRoute53Credentials(credentials);
      
      case 'digitalocean':
        return await testDigitalOceanCredentials(apiKey);
      
      case 'google':
        return await testGoogleCredentials(accessToken);
      
      default:
        return {
          success: false,
          message: `Testing not implemented for ${registrarCode}. Manual verification required.`
        };
    }
  } catch (error) {
    console.error(`Error testing ${registrarCode} credentials:`, error);
    return {
      success: false,
      message: `Failed to test ${registrarCode} credentials: ${error.message}`
    };
  }
}

/**
 * Test Cloudflare API credentials
 */
async function testCloudflareCredentials(apiKey, zoneId) {
  try {
    // Test by getting user info
    const response = await fetch('https://api.cloudflare.com/client/v4/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.message || 'API request failed');
    }

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Authentication failed');
    }

    // If zone ID provided, test zone access
    let zoneInfo = null;
    if (zoneId) {
      const zoneResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (zoneResponse.ok) {
        const zoneData = await zoneResponse.json();
        if (zoneData.success) {
          zoneInfo = {
            name: zoneData.result.name,
            status: zoneData.result.status
          };
        }
      }
    }

    return {
      success: true,
      message: 'Cloudflare credentials verified successfully',
      accountInfo: {
        email: data.result.email,
        name: data.result.first_name + ' ' + data.result.last_name,
        zones: zoneInfo ? [zoneInfo] : 'Zone access not tested'
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Cloudflare authentication failed: ${error.message}`
    };
  }
}

/**
 * Test Namecheap API credentials
 */
async function testNamecheapCredentials(apiKey, userId) {
  try {
    const testUrl = new URL('https://api.namecheap.com/xml.response');
    testUrl.searchParams.set('ApiUser', userId || 'testuser');
    testUrl.searchParams.set('ApiKey', apiKey);
    testUrl.searchParams.set('UserName', userId || 'testuser');
    testUrl.searchParams.set('Command', 'namecheap.users.getBalances');
    testUrl.searchParams.set('ClientIp', '127.0.0.1'); // This would need to be the actual client IP

    const response = await fetch(testUrl.toString(), {
      method: 'GET'
    });

    const xmlText = await response.text();
    
    // Basic XML parsing (would need proper parser in production)
    if (xmlText.includes('<Status>ERROR</Status>')) {
      throw new Error('API authentication failed');
    }

    if (xmlText.includes('<Status>OK</Status>')) {
      return {
        success: true,
        message: 'Namecheap credentials verified successfully',
        accountInfo: {
          note: 'Namecheap API requires IP whitelisting'
        }
      };
    }

    throw new Error('Unexpected API response');

  } catch (error) {
    return {
      success: false,
      message: `Namecheap authentication failed: ${error.message}. Note: Ensure your IP is whitelisted in Namecheap API settings.`
    };
  }
}

/**
 * Test GoDaddy API credentials
 */
async function testGoDaddyCredentials(apiKey, apiSecret) {
  try {
    const response = await fetch('https://api.godaddy.com/v1/domains', {
      method: 'GET',
      headers: {
        'Authorization': `sso-key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key or secret');
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const domains = await response.json();

    return {
      success: true,
      message: 'GoDaddy credentials verified successfully',
      accountInfo: {
        domainsCount: domains.length,
        sampleDomains: domains.slice(0, 3).map(d => d.domain)
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `GoDaddy authentication failed: ${error.message}`
    };
  }
}

/**
 * Test Route 53 credentials (basic test)
 */
async function testRoute53Credentials(credentials) {
  // Note: AWS SDK would be needed for proper Route 53 testing
  // This is a placeholder implementation
  return {
    success: false,
    message: 'Route 53 credential testing requires AWS SDK. Please verify manually in AWS console.'
  };
}

/**
 * Test DigitalOcean API credentials
 */
async function testDigitalOceanCredentials(apiKey) {
  try {
    const response = await fetch('https://api.digitalocean.com/v2/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API token');
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: 'DigitalOcean credentials verified successfully',
      accountInfo: {
        email: data.account.email,
        status: data.account.status,
        droplets: data.account.droplet_limit
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `DigitalOcean authentication failed: ${error.message}`
    };
  }
}

/**
 * Test Google Cloud DNS credentials
 */
async function testGoogleCredentials(accessToken) {
  try {
    // Test with a simple API call
    const response = await fetch('https://dns.googleapis.com/dns/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Google Cloud DNS credentials verified successfully',
      accountInfo: {
        projects: data.projects ? data.projects.length : 0
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Google Cloud DNS authentication failed: ${error.message}`
    };
  }
}
