/**
 * Debug function to test Netlify API connectivity and site access
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const token = process.env.NETLIFY_ACCESS_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
    const baseUrl = 'https://api.netlify.com/api/v1';

    console.log('🔍 Debug info:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      siteId: siteId,
      environment: process.env.NODE_ENV
    });

    if (!token) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'NETLIFY_ACCESS_TOKEN not configured',
          debug: {
            hasToken: false,
            siteId: siteId,
            availableEnvVars: Object.keys(process.env).filter(key => key.includes('NETLIFY'))
          }
        }),
      };
    }

    // Test 1: Check if we can access the site
    console.log(`🌐 Testing site access: ${baseUrl}/sites/${siteId}`);
    const siteResponse = await fetch(`${baseUrl}/sites/${siteId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`📡 Site response status: ${siteResponse.status}`);

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      console.error('❌ Site access failed:', errorText);
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Site access failed: ${siteResponse.status} ${siteResponse.statusText}`,
          debug: {
            hasToken: true,
            tokenLength: token.length,
            siteId: siteId,
            errorDetails: errorText,
            endpoint: `${baseUrl}/sites/${siteId}`
          }
        }),
      };
    }

    const siteData = await siteResponse.json();
    console.log('✅ Site data retrieved:', siteData.name);

    // Test 2: Check what domains API endpoints are available
    const domainsResponse = await fetch(`${baseUrl}/sites/${siteId}/domains`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`📡 Domains API response status: ${domainsResponse.status}`);

    let domainsData = null;
    let domainsError = null;

    if (domainsResponse.ok) {
      domainsData = await domainsResponse.json();
      console.log('✅ Domains API accessible, domains count:', domainsData.length);
    } else {
      domainsError = await domainsResponse.text();
      console.log('❌ Domains API failed:', domainsError);
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        debug: {
          site: {
            id: siteData.id,
            name: siteData.name,
            url: siteData.url,
            custom_domain: siteData.custom_domain || null,
            ssl_url: siteData.ssl_url
          },
          api: {
            siteAccess: true,
            domainsAccess: domainsResponse.ok,
            domainsError: domainsError,
            domainsCount: domainsData?.length || 0
          },
          token: {
            hasToken: true,
            tokenLength: token.length,
            tokenStart: token.substring(0, 8) + '...'
          },
          endpoints: {
            site: `${baseUrl}/sites/${siteId}`,
            domains: `${baseUrl}/sites/${siteId}/domains`,
            customDomain: `${baseUrl}/sites/${siteId}` // PATCH endpoint for custom_domain
          }
        }
      }),
    };

  } catch (error) {
    console.error('❌ Debug function error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        debug: {
          errorType: error.constructor.name,
          errorStack: error.stack
        }
      }),
    };
  }
};
