const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { action, domain, siteId } = JSON.parse(event.body || '{}');
    
    // Get Netlify token from environment (server-side, secure)
    const NETLIFY_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;
    const NETLIFY_SITE_ID = siteId || process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
    
    if (!NETLIFY_TOKEN) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'NETLIFY_ACCESS_TOKEN not configured on server' 
        })
      };
    }

    const baseUrl = 'https://api.netlify.com/api/v1';
    
    switch (action) {
      case 'addDomain':
        return await addDomain(domain, NETLIFY_TOKEN, NETLIFY_SITE_ID, baseUrl, headers);
      
      case 'getDomainStatus':
        return await getDomainStatus(domain, NETLIFY_TOKEN, NETLIFY_SITE_ID, baseUrl, headers);
      
      case 'listDomains':
        return await listDomains(NETLIFY_TOKEN, NETLIFY_SITE_ID, baseUrl, headers);
      
      case 'removeDomain':
        return await removeDomain(domain, NETLIFY_TOKEN, NETLIFY_SITE_ID, baseUrl, headers);
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            success: false, 
            error: 'Invalid action. Use: addDomain, getDomainStatus, listDomains, removeDomain' 
          })
        };
    }
    
  } catch (error) {
    console.error('Netlify domain manager error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      })
    };
  }
};

async function addDomain(domain, token, siteId, baseUrl, headers) {
  try {
    // Add domain to the site
    const addResponse = await fetch(`${baseUrl}/sites/${siteId}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain }),
    });

    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      return {
        statusCode: addResponse.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Failed to add domain: ${addResponse.status} ${addResponse.statusText}. ${errorText}`
        })
      };
    }

    const addedDomain = await addResponse.json();
    console.log('✅ Domain added to Netlify:', addedDomain);

    // Get domain status
    const statusResponse = await fetch(`${baseUrl}/sites/${siteId}/domains/${domain}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    let status = null;
    if (statusResponse.ok) {
      status = await statusResponse.json();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: addedDomain,
        status: status
      })
    };

  } catch (error) {
    console.error('Error adding domain:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to add domain'
      })
    };
  }
}

async function getDomainStatus(domain, token, siteId, baseUrl, headers) {
  try {
    const response = await fetch(`${baseUrl}/sites/${siteId}/domains/${domain}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Domain not found in Netlify site. Use "Add to Netlify" to add it first.'
          })
        };
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Failed to get domain status: ${response.status} ${response.statusText}`
        })
      };
    }

    const status = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: status
      })
    };

  } catch (error) {
    console.error('Error getting domain status:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to get domain status'
      })
    };
  }
}

async function listDomains(token, siteId, baseUrl, headers) {
  try {
    const response = await fetch(`${baseUrl}/sites/${siteId}/domains`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Failed to list domains: ${response.status} ${response.statusText}`
        })
      };
    }

    const domains = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        domains: domains
      })
    };

  } catch (error) {
    console.error('Error listing domains:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to list domains'
      })
    };
  }
}

async function removeDomain(domain, token, siteId, baseUrl, headers) {
  try {
    const response = await fetch(`${baseUrl}/sites/${siteId}/domains/${domain}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Failed to remove domain: ${response.status} ${response.statusText}`
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true
      })
    };

  } catch (error) {
    console.error('Error removing domain:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to remove domain'
      })
    };
  }
}
