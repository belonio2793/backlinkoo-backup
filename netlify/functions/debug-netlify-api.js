/**
 * Debug Netlify API Issues
 * 
 * This function helps debug exactly what's wrong with the Netlify API calls
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    let requestData = {};
    if (event.body) {
      requestData = JSON.parse(event.body);
    }

    const { domain } = requestData;
    const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

    console.log('🔍 Debug Info:');
    console.log('Domain:', domain);
    console.log('Site ID:', siteId);
    console.log('Token available:', !!netlifyToken);
    console.log('Token length:', netlifyToken?.length);

    const debug = {
      domain,
      siteId,
      tokenAvailable: !!netlifyToken,
      tokenLength: netlifyToken?.length,
      steps: []
    };

    // Step 1: Test basic authentication
    debug.steps.push('Testing Netlify authentication...');
    
    try {
      const authTest = await fetch('https://api.netlify.com/api/v1/user', {
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
        },
      });

      debug.authTest = {
        status: authTest.status,
        ok: authTest.ok,
        statusText: authTest.statusText
      };

      if (authTest.ok) {
        const userData = await authTest.json();
        debug.authTest.user = {
          email: userData.email,
          name: userData.full_name
        };
        debug.steps.push('✅ Authentication successful');
      } else {
        const errorText = await authTest.text();
        debug.authTest.error = errorText;
        debug.steps.push('❌ Authentication failed');
      }
    } catch (error) {
      debug.authTest = { error: error.message };
      debug.steps.push('❌ Authentication request failed');
    }

    // Step 2: Test site access
    debug.steps.push('Testing site access...');
    
    try {
      const siteTest = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
        },
      });

      debug.siteTest = {
        status: siteTest.status,
        ok: siteTest.ok,
        statusText: siteTest.statusText
      };

      if (siteTest.ok) {
        const siteData = await siteTest.json();
        debug.siteTest.site = {
          name: siteData.name,
          url: siteData.url,
          customDomain: siteData.custom_domain,
          plan: siteData.account_type
        };
        debug.steps.push('✅ Site access successful');
      } else {
        const errorText = await siteTest.text();
        debug.siteTest.error = errorText;
        debug.steps.push('❌ Site access failed');
      }
    } catch (error) {
      debug.siteTest = { error: error.message };
      debug.steps.push('❌ Site request failed');
    }

    // Step 3: Test the exact domain addition call that's failing
    if (domain) {
      debug.steps.push('Testing domain addition API call...');
      
      const cleanDomain = domain.trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');

      try {
        const payload = { custom_domain: cleanDomain };
        
        console.log('Making API call with payload:', payload);
        
        const domainTest = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        debug.domainTest = {
          status: domainTest.status,
          ok: domainTest.ok,
          statusText: domainTest.statusText,
          payload
        };

        const responseText = await domainTest.text();
        
        if (domainTest.ok) {
          try {
            debug.domainTest.response = JSON.parse(responseText);
            debug.steps.push('✅ Domain addition successful');
          } catch {
            debug.domainTest.response = responseText;
          }
        } else {
          debug.domainTest.error = responseText;
          debug.steps.push('❌ Domain addition failed');
          
          // Try to parse error details
          try {
            const errorJson = JSON.parse(responseText);
            debug.domainTest.errorDetails = errorJson;
          } catch {
            debug.domainTest.rawError = responseText;
          }
        }
      } catch (error) {
        debug.domainTest = { error: error.message };
        debug.steps.push('❌ Domain addition request failed');
      }
    }

    // Step 4: Check current site domains
    debug.steps.push('Checking current site domains...');
    
    try {
      const domainsTest = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
        },
      });

      if (domainsTest.ok) {
        const domainsData = await domainsTest.json();
        debug.currentDomains = domainsData;
        debug.steps.push('✅ Retrieved current domains');
      } else {
        const errorText = await domainsTest.text();
        debug.currentDomains = { error: errorText };
        debug.steps.push('❌ Could not retrieve domains');
      }
    } catch (error) {
      debug.currentDomains = { error: error.message };
      debug.steps.push('❌ Domains request failed');
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        debug
      }),
    };

  } catch (error) {
    console.error('❌ Debug function error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message
      }),
    };
  }
};
