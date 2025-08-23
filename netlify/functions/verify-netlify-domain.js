/**
 * Verify Netlify Domain - Check if domain exists in Netlify site aliases
 *
 * This function verifies whether a domain has been successfully added as an alias
 * to your Netlify site by checking the current site configuration.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      }),
    };
  }

  try {
    console.log('🔍 Netlify domain verification started...');

    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
      } catch (error) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: 'Invalid JSON in request body'
          }),
        };
      }
    }

    const { domain } = requestData;

    if (!domain) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Domain is required'
        }),
      };
    }

    // Get environment variables
    const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

    console.log('🔑 Environment check:', {
      hasToken: !!netlifyToken,
      siteId: siteId
    });

    if (!netlifyToken) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Netlify access token not configured',
          needsConfiguration: true
        }),
      };
    }

    // Clean the domain name
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    console.log(`🔍 Checking if ${cleanDomain} exists in Netlify site ${siteId}...`);

    // Get current site configuration
    const getSiteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getSiteResponse.ok) {
      const errorText = await getSiteResponse.text();
      console.error('❌ Failed to get site info:', errorText);
      
      return {
        statusCode: getSiteResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Failed to verify domain: HTTP ${getSiteResponse.status}`,
          details: errorText
        }),
      };
    }

    const siteData = await getSiteResponse.json();
    const aliases = siteData.domain_aliases || [];
    const primaryDomain = siteData.custom_domain;

    console.log('📋 Site verification results:', {
      site_name: siteData.name,
      primary_domain: primaryDomain,
      current_aliases: aliases,
      checking_domain: cleanDomain
    });

    // Check if domain exists in aliases
    const existsInAliases = aliases.includes(cleanDomain);
    const isPrimaryDomain = primaryDomain === cleanDomain;
    const isConfigured = existsInAliases || isPrimaryDomain;

    const verificationResult = {
      success: true,
      domain: cleanDomain,
      netlifyData: {
        site_id: siteId,
        site_name: siteData.name,
        site_url: siteData.url,
        ssl_url: siteData.ssl_url,
        primary_domain: primaryDomain,
        all_aliases: aliases,
        domain_status: {
          exists_in_aliases: existsInAliases,
          is_primary_domain: isPrimaryDomain,
          is_configured: isConfigured,
          total_aliases: aliases.length
        }
      },
      verification: {
        domain_found: isConfigured,
        location: isPrimaryDomain ? 'primary' : existsInAliases ? 'alias' : 'not_found',
        message: isConfigured 
          ? `Domain ${cleanDomain} is ${isPrimaryDomain ? 'the primary domain' : 'configured as an alias'}`
          : `Domain ${cleanDomain} is not configured in this Netlify site`,
        recommendations: isConfigured 
          ? ['Configure DNS records to point to Netlify', 'Wait for SSL certificate provisioning']
          : ['Use the "Add via Netlify API" button to add this domain', 'Ensure you have proper Netlify permissions']
      }
    };

    console.log('✅ Verification complete:', verificationResult.verification);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationResult),
    };

  } catch (error) {
    console.error('❌ Error in verify-netlify-domain function:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Domain verification failed',
        details: 'Check server logs for more information'
      }),
    };
  }
};
