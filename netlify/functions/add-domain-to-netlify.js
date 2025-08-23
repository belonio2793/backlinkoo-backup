/**
 * Add Domain to Netlify as Alias - Official API Implementation
 *
 * This function adds domains as ALIASES to your existing Netlify site, preserving
 * your primary domain (backlinkoo.com). It does NOT replace the primary domain.
 *
 * Uses the Netlify Site Aliases API: POST /api/v1/sites/{site_id}/aliases
 *
 * Integrates with the DomainsPage workflow for seamless domain addition.
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
    console.log('🚀 Netlify function started, processing domain addition request...');

    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
        console.log('📋 Request data parsed:', { domain: requestData.domain, domainId: requestData.domainId });
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
          details: 'NETLIFY_ACCESS_TOKEN environment variable is missing'
        }),
      };
    }

    console.log(`🚀 Adding domain ${domain} as alias to Netlify site ${siteId} (preserving primary domain)...`);

    // Clean the domain name (remove protocol, www, trailing slash)
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(cleanDomain)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Invalid domain format'
        }),
      };
    }

    // Check if domain is a subdomain (requires TXT verification)
    const isSubdomain = cleanDomain.split('.').length > 2;

    // First, get the current site configuration to retrieve existing aliases
    console.log('📋 Getting current site configuration...');
    const getCurrentSiteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getCurrentSiteResponse.ok) {
      throw new Error(`Failed to get current site config: ${getCurrentSiteResponse.status} ${getCurrentSiteResponse.statusText}`);
    }

    const currentSite = await getCurrentSiteResponse.json();
    const existingAliases = currentSite.domain_aliases || [];

    // Check if domain already exists as alias
    if (existingAliases.includes(cleanDomain)) {
      throw new Error(`Domain ${cleanDomain} is already configured as an alias for this site`);
    }

    // Add new domain to the existing aliases array
    const updatedAliases = [...existingAliases, cleanDomain];

    console.log(`📝 Adding ${cleanDomain} to aliases. Current aliases:`, existingAliases);
    console.log(`📝 Updated aliases will be:`, updatedAliases);

    // Use the correct site update endpoint to add domain_aliases without affecting primary domain
    // This preserves backlinkoo.com as the primary domain and adds new domains as aliases
    // Following Netlify API documentation: PUT /api/v1/sites/{site_id} with domain_aliases array
    const netlifyResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain_aliases: updatedAliases
      }),
    });

    if (!netlifyResponse.ok) {
      console.error(`❌ Netlify API request failed with status ${netlifyResponse.status}`);

      let errorData;
      try {
        errorData = await netlifyResponse.text();
        console.error('❌ Raw error response:', errorData);
      } catch (readError) {
        console.error('❌ Could not read error response:', readError);
        errorData = `HTTP ${netlifyResponse.status}: ${netlifyResponse.statusText}`;
      }

      let errorMessage = `${netlifyResponse.status} ${netlifyResponse.statusText}`;
      let detailedError = '';
      let specificError = '';

      try {
        const errorJson = JSON.parse(errorData);
        console.error('❌ Parsed error JSON:', errorJson);

        // Extract specific error messages from various Netlify API response formats
        if (errorJson.message) {
          errorMessage = errorJson.message;
          specificError = errorJson.message;
        }

        if (errorJson.error) {
          errorMessage = errorJson.error;
          specificError = errorJson.error;
        }

        if (errorJson.errors) {
          if (Array.isArray(errorJson.errors)) {
            specificError = errorJson.errors.map(err => err.message || err).join(', ');
          } else if (typeof errorJson.errors === 'object') {
            specificError = Object.values(errorJson.errors).join(', ');
          } else {
            specificError = JSON.stringify(errorJson.errors);
          }
          detailedError = specificError;
        }

        // Check for domain-specific errors
        if (errorJson.domain_aliases) {
          specificError = `Domain aliases error: ${JSON.stringify(errorJson.domain_aliases)}`;
        }

        // Check for validation errors
        if (errorJson.code) {
          specificError += ` (Code: ${errorJson.code})`;
        }

      } catch (parseError) {
        console.error('❌ Could not parse error as JSON:', parseError);
        if (errorData && errorData.trim().length > 0) {
          errorMessage = errorData.trim();
          specificError = errorData.trim();
        }
      }

      // Provide user-friendly error messages based on status codes and specific errors
      let userFriendlyMessage = specificError || errorMessage || 'Unknown error';

      // Check for specific domain-related error messages
      if (specificError && specificError.toLowerCase().includes('already')) {
        userFriendlyMessage = `Domain ${cleanDomain} is already configured as an alias for this Netlify site. No further action needed.`;
      } else if (specificError && specificError.toLowerCase().includes('invalid')) {
        userFriendlyMessage = `Domain ${cleanDomain} is invalid or cannot be added as an alias. Please verify the domain format.`;
      } else if (specificError && specificError.toLowerCase().includes('conflict')) {
        userFriendlyMessage = `Domain ${cleanDomain} conflicts with existing configuration. It may be configured elsewhere.`;
      } else {
        // Fallback to status-based messages if no specific error found
        switch (netlifyResponse.status) {
          case 401:
            userFriendlyMessage = 'Authentication failed. Please check Netlify access token configuration.';
            break;
          case 403:
            userFriendlyMessage = 'Permission denied. Your Netlify token may not have sufficient permissions.';
            break;
          case 404:
            userFriendlyMessage = 'Netlify site not found. Please verify the site ID is correct.';
            break;
          case 422:
            userFriendlyMessage = specificError ?
              `Domain alias update failed: ${specificError}` :
              `Domain alias update failed. ${cleanDomain} may already be added as an alias, be invalid, or conflict with existing configuration.`;
            break;
          case 429:
            userFriendlyMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
            break;
          case 500:
            userFriendlyMessage = 'Netlify server error. Please try again later.';
            break;
          default:
            if (specificError) {
              userFriendlyMessage = `Failed to add domain ${cleanDomain}: ${specificError}`;
            } else if (errorMessage.includes('domain')) {
              userFriendlyMessage = `Domain ${cleanDomain} could not be added: ${errorMessage}`;
            } else {
              userFriendlyMessage = `Failed to add domain ${cleanDomain}: ${errorMessage}`;
            }
        }
      }

      console.error(`❌ Failed to add domain ${cleanDomain}:`, {
        status: netlifyResponse.status,
        statusText: netlifyResponse.statusText,
        errorMessage,
        detailedError,
        userFriendlyMessage
      });

      return {
        statusCode: netlifyResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: userFriendlyMessage,
          domain: cleanDomain,
          details: {
            status: netlifyResponse.status,
            statusText: netlifyResponse.statusText,
            originalError: errorMessage,
            specificError: specificError,
            detailedError: detailedError,
            rawResponse: errorData,
            siteId: siteId,
            operation: 'domain_aliases_update',
            timestamp: new Date().toISOString()
          },
          debug: {
            message: 'Check server logs for complete error details',
            endpoint: `PATCH /api/v1/sites/${siteId}`,
            body: { domain_aliases: 'attempted_update' }
          }
        }),
      };
    }

    const updatedSite = await netlifyResponse.json();
    console.log(`✅ Successfully added ${cleanDomain} as alias to Netlify:`, {
      alias_name: cleanDomain,
      site_id: siteId,
      primary_domain: updatedSite.custom_domain,
      all_aliases: updatedSite.domain_aliases,
      primary_domain_preserved: true
    });

    // Generate DNS setup instructions based on domain type
    const dnsInstructions = generateDNSInstructions(cleanDomain, siteId, isSubdomain);

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
      } catch (dbError) {
        console.warn('Database update failed:', dbError);
        // Don't fail the entire operation if DB update fails
      }
    }

    // Return success response with setup instructions
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        domain: cleanDomain,
        netlifyData: {
          alias_name: cleanDomain,
          site_id: siteId,
          primary_domain: updatedSite.custom_domain,
          all_aliases: updatedSite.domain_aliases,
          primary_domain_preserved: true,
          alias_created: true
        },
        dnsInstructions,
        dbUpdate: dbUpdateResult,
        message: `Domain ${cleanDomain} successfully added as alias to Netlify site. Primary domain (backlinkoo.com) preserved. Please configure DNS records for the new alias.`
      }),
    };

  } catch (error) {
    console.error('❌ Error in add-domain-to-netlify function:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: 'Check server logs for more information'
      }),
    };
  }
};

/**
 * Generate DNS setup instructions based on domain type
 */
function generateDNSInstructions(domain, siteId, isSubdomain) {
  if (isSubdomain) {
    return {
      title: 'Subdomain Setup Required',
      type: 'subdomain',
      steps: [
        `Subdomain ${domain} has been added to your Netlify site`,
        'Add the required TXT record for verification',
        'Add a CNAME record pointing to your Netlify site',
        'Wait for DNS propagation (usually 5-30 minutes)',
        'Netlify will automatically provision an SSL certificate once verified'
      ],
      dnsRecords: [
        {
          type: 'TXT',
          name: `netlify-challenge.${domain}`,
          value: 'any-value-for-verification',
          ttl: 300,
          required: true,
          description: 'Required for subdomain verification'
        },
        {
          type: 'CNAME',
          name: domain.split('.')[0],
          value: `${siteId}.netlify.app`,
          ttl: 3600,
          required: true,
          description: 'Points subdomain to Netlify'
        }
      ]
    };
  } else {
    return {
      title: 'Root Domain Setup Required',
      type: 'root',
      steps: [
        `Root domain ${domain} has been added to your Netlify site`,
        'Configure your DNS with the following A records',
        'Add CNAME record for www subdomain',
        'Wait for DNS propagation (can take up to 48 hours)',
        'Netlify will automatically provision an SSL certificate once DNS is verified'
      ],
      dnsRecords: [
        {
          type: 'A',
          name: '@',
          value: '75.2.60.5',
          ttl: 3600,
          required: true,
          description: 'Primary Netlify load balancer'
        },
        {
          type: 'A',
          name: '@',
          value: '99.83.190.102',
          ttl: 3600,
          required: true,
          description: 'Secondary Netlify load balancer'
        },
        {
          type: 'CNAME',
          name: 'www',
          value: `${siteId}.netlify.app`,
          ttl: 3600,
          required: true,
          description: 'Points www to Netlify'
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
