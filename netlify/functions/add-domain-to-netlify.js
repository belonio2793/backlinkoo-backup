/**
 * Add Domain to Netlify as Alias - Official API Implementation
 *
 * This function adds domains as ALIASES to your existing Netlify site, preserving
 * your primary domain. Uses the official Netlify API documentation.
 *
 * API Endpoint: PATCH /api/v1/sites/{site_id}
 * Documentation: https://docs.netlify.com/manage/domains/manage-domains/manage-multiple-domains/
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

  // Only allow POST requests
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
    console.log('🚀 Netlify domain addition function started...');

    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
        console.log('📋 Request data:', { domain: requestData.domain, domainId: requestData.domainId });
      } catch (error) {
        console.error('❌ Invalid JSON in request body:', error);
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

    const { domain, domainId } = requestData;

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
      tokenLength: netlifyToken?.length || 0,
      tokenPreview: netlifyToken ? `${netlifyToken.substring(0, 8)}...` : 'none',
      siteId: siteId
    });

    if (!netlifyToken) {
      console.error('❌ NETLIFY_ACCESS_TOKEN not found in environment variables');
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Netlify access token not configured',
          details: 'NETLIFY_ACCESS_TOKEN environment variable is missing. Please configure your Netlify personal access token.'
        }),
      };
    }

    // Clean the domain name (remove protocol, www, trailing slash)
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    console.log(`🧹 Cleaned domain: ${domain} → ${cleanDomain}`);

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(cleanDomain)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Invalid domain format: ${cleanDomain}`
        }),
      };
    }

    console.log(`🚀 Adding domain ${cleanDomain} as alias to Netlify site ${siteId}...`);

    // Step 1: Get current site configuration to retrieve existing aliases
    console.log('📋 Step 1: Getting current site configuration...');
    const getCurrentSiteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 GET site response status: ${getCurrentSiteResponse.status}`);

    if (!getCurrentSiteResponse.ok) {
      const errorText = await getCurrentSiteResponse.text();
      console.error('❌ Failed to get current site config:', errorText);
      
      let errorMessage = `Failed to retrieve site information (HTTP ${getCurrentSiteResponse.status})`;
      if (getCurrentSiteResponse.status === 401) {
        errorMessage = 'Authentication failed. Please check your Netlify access token.';
      } else if (getCurrentSiteResponse.status === 403) {
        errorMessage = 'Permission denied. Your token may not have access to this site.';
      } else if (getCurrentSiteResponse.status === 404) {
        errorMessage = 'Site not found. Please verify the site ID is correct.';
      }

      return {
        statusCode: getCurrentSiteResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          details: {
            status: getCurrentSiteResponse.status,
            response: errorText,
            siteId: siteId
          }
        }),
      };
    }

    const currentSite = await getCurrentSiteResponse.json();
    const existingAliases = currentSite.domain_aliases || [];
    
    console.log('📋 Current site info:', {
      name: currentSite.name,
      url: currentSite.url,
      custom_domain: currentSite.custom_domain,
      existing_aliases: existingAliases,
      ssl_url: currentSite.ssl_url
    });

    // Step 2: Check if domain already exists as alias
    if (existingAliases.includes(cleanDomain)) {
      console.log(`ℹ️ Domain ${cleanDomain} is already configured as an alias`);
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          domain: cleanDomain,
          message: `Domain ${cleanDomain} is already configured as an alias for this site`,
          netlifyData: {
            alias_name: cleanDomain,
            site_id: siteId,
            primary_domain: currentSite.custom_domain,
            all_aliases: existingAliases,
            already_exists: true
          },
          dnsInstructions: generateDNSInstructions(cleanDomain)
        }),
      };
    }

    // Step 3: Add new domain to the existing aliases array
    const updatedAliases = [...existingAliases, cleanDomain];

    console.log(`📝 Step 3: Updating aliases:`, {
      before: existingAliases,
      after: updatedAliases,
      new_domain: cleanDomain
    });

    // Step 4: Update site with new domain aliases
    console.log('🔄 Step 4: Sending PATCH request to update domain aliases...');
    const updatePayload = { domain_aliases: updatedAliases };
    console.log('📤 PATCH payload:', updatePayload);

    const netlifyResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    console.log(`📊 PATCH response status: ${netlifyResponse.status}`);

    if (!netlifyResponse.ok) {
      const errorText = await netlifyResponse.text();
      console.error('❌ Netlify API PATCH request failed:', {
        status: netlifyResponse.status,
        statusText: netlifyResponse.statusText,
        response: errorText
      });

      let errorMessage = `Failed to add domain alias (HTTP ${netlifyResponse.status})`;
      let specificError = '';

      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Parsed error JSON:', errorJson);

        if (errorJson.message) {
          specificError = errorJson.message;
        }
        if (errorJson.error) {
          specificError = errorJson.error;  
        }
        if (errorJson.errors) {
          if (Array.isArray(errorJson.errors)) {
            specificError = errorJson.errors.map(err => err.message || err).join(', ');
          } else {
            specificError = JSON.stringify(errorJson.errors);
          }
        }
      } catch (parseError) {
        specificError = errorText;
      }

      // Provide user-friendly error messages
      switch (netlifyResponse.status) {
        case 401:
          errorMessage = 'Authentication failed. Please check your Netlify access token.';
          break;
        case 403:
          errorMessage = 'Permission denied. Your Netlify token may not have sufficient permissions.';
          break;
        case 404:
          errorMessage = 'Site not found. Please verify the site ID is correct.';
          break;
        case 422:
          errorMessage = specificError || `Domain ${cleanDomain} cannot be added as an alias. It may be invalid or already in use elsewhere.`;
          break;
        case 429:
          errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
          break;
        default:
          errorMessage = specificError || `Failed to add domain ${cleanDomain} as alias`;
      }

      return {
        statusCode: netlifyResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          domain: cleanDomain,
          details: {
            status: netlifyResponse.status,
            statusText: netlifyResponse.statusText,
            specificError: specificError,
            rawResponse: errorText,
            siteId: siteId,
            attempted_aliases: updatedAliases
          }
        }),
      };
    }

    // Step 5: Parse successful response
    const updatedSite = await netlifyResponse.json();
    
    console.log('✅ Successfully updated site aliases:', {
      domain: cleanDomain,
      site_id: siteId,
      primary_domain: updatedSite.custom_domain,
      all_aliases: updatedSite.domain_aliases,
      ssl_url: updatedSite.ssl_url
    });

    // Step 6: Verify the domain was actually added
    const finalAliases = updatedSite.domain_aliases || [];
    const domainWasAdded = finalAliases.includes(cleanDomain);

    if (!domainWasAdded) {
      console.error('❌ Domain was not found in final aliases list:', {
        expected: cleanDomain,
        actual_aliases: finalAliases
      });
      
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: `Domain ${cleanDomain} was not successfully added to aliases`,
          details: {
            attempted_domain: cleanDomain,
            final_aliases: finalAliases,
            response_received: true
          }
        }),
      };
    }

    // Generate DNS setup instructions
    const dnsInstructions = generateDNSInstructions(cleanDomain);

    // Update domain status in database if domainId provided
    let dbUpdateResult = null;
    if (domainId) {
      try {
        dbUpdateResult = await updateDomainInDatabase(domainId, {
          status: 'dns_ready',
          netlify_verified: true,
          netlify_site_id: siteId,
          dns_records: dnsInstructions.dnsRecords,
          error_message: null
        });
        console.log('✅ Database updated successfully:', dbUpdateResult);
      } catch (dbError) {
        console.warn('⚠️ Database update failed (non-critical):', dbError);
        // Don't fail the entire operation if DB update fails
      }
    }

    // Return success response
    const successResponse = {
      success: true,
      domain: cleanDomain,
      netlifyData: {
        alias_name: cleanDomain,
        site_id: siteId,
        primary_domain: updatedSite.custom_domain,
        all_aliases: updatedSite.domain_aliases,
        ssl_url: updatedSite.ssl_url,
        site_name: updatedSite.name,
        alias_created: true,
        verified_in_response: true
      },
      dnsInstructions,
      dbUpdate: dbUpdateResult,
      message: `Domain ${cleanDomain} successfully added as alias to Netlify site ${updatedSite.name}. Configure DNS records to activate.`
    };

    console.log('✅ Returning success response:', successResponse);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(successResponse),
    };

  } catch (error) {
    console.error('❌ Unexpected error in add-domain-to-netlify function:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: {
          error_type: 'unexpected_error',
          timestamp: new Date().toISOString()
        }
      }),
    };
  }
};

/**
 * Generate DNS setup instructions based on domain type
 */
function generateDNSInstructions(domain) {
  const isSubdomain = domain.split('.').length > 2;

  if (isSubdomain) {
    return {
      title: 'Subdomain DNS Configuration',
      type: 'subdomain',
      steps: [
        `Subdomain ${domain} has been added to your Netlify site`,
        'Add a CNAME record pointing to backlinkoo.netlify.app',
        'Wait for DNS propagation (usually 5-30 minutes)',
        'Netlify will automatically provision an SSL certificate once DNS is verified'
      ],
      dnsRecords: [
        {
          type: 'CNAME',
          name: domain.split('.')[0],
          value: 'backlinkoo.netlify.app',
          ttl: 3600,
          required: true,
          description: 'Points subdomain to Netlify'
        }
      ]
    };
  } else {
    return {
      title: 'Root Domain DNS Configuration with Nameservers',
      type: 'root',
      steps: [
        `Root domain ${domain} has been added to your Netlify site`,
        'Configure your domain to use our nameservers at your domain registrar',
        'Add CNAME record for www subdomain (required for verification)',
        'Wait for DNS propagation (usually 5-30 minutes)',
        'Netlify will automatically provision an SSL certificate once DNS is verified'
      ],
      nameservers: [
        'dns1.p05.nsone.net',
        'dns2.p05.nsone.net',
        'dns3.p05.nsone.net',
        'dns4.p05.nsone.net'
      ],
      dnsRecords: [
        {
          type: 'CNAME',
          name: 'www',
          value: 'backlinkoo.netlify.app',
          ttl: 3600,
          required: true,
          description: 'Points www subdomain to Netlify (required for verification)'
        }
      ]
    };
  }
}

/**
 * Update domain status in Supabase database
 */
async function updateDomainInDatabase(domainId, updateData) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration not available');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/domains?id=eq.${domainId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': supabaseKey
    },
    body: JSON.stringify({
      ...updateData,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Database update failed: ${errorText}`);
  }

  return { success: true, domainId, updated: Object.keys(updateData) };
}
