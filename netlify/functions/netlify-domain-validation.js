/**
 * Netlify Domain Validation Function
 * 
 * Uses official Netlify API to:
 * 1. Get site information and domain aliases
 * 2. Check DNS configuration and validation status
 * 3. Verify SSL certificate status
 * 4. Add domains as aliases
 * 
 * API Documentation: https://docs.netlify.com/api/get-started/
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
    console.log('🔍 Netlify domain validation function called');

    // Get environment variables
    const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

    if (!netlifyToken) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'NETLIFY_ACCESS_TOKEN not configured'
        }),
      };
    }

    // Parse request
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
      } catch (error) {
        console.error('❌ Invalid JSON in request body:', error);
      }
    }

    const { action, domain } = requestData;
    const headers = {
      'Authorization': `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json'
    };

    console.log(`🔍 Processing action: ${action} for domain: ${domain}`);

    switch (action) {
      case 'getSiteInfo':
        return await getSiteInfo(siteId, headers);
      
      case 'getDNSInfo':
        return await getDNSInfo(siteId, headers);
      
      case 'getSSLStatus':
        return await getSSLStatus(siteId, headers);
      
      case 'validateDomain':
        return await validateDomain(siteId, domain, headers);
      
      case 'addDomainAlias':
        return await addDomainAlias(siteId, domain, headers);

      case 'removeDomainAlias':
        return await removeDomainAlias(siteId, domain, headers);

      case 'listDomainAliases':
        return await listDomainAliases(siteId, headers);
      
      default:
        return await getFullDomainReport(siteId, domain, headers);
    }

  } catch (error) {
    console.error('❌ Netlify validation error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Validation failed'
      }),
    };
  }
};

/**
 * Get comprehensive site information
 */
async function getSiteInfo(siteId, headers) {
  try {
    console.log('📋 Getting site information...');
    
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Site info failed: ${response.status} ${response.statusText}`);
    }

    const siteData = await response.json();
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'getSiteInfo',
        data: {
          id: siteData.id,
          name: siteData.name,
          url: siteData.url,
          ssl_url: siteData.ssl_url,
          custom_domain: siteData.custom_domain,
          domain_aliases: siteData.domain_aliases || [],
          state: siteData.state,
          created_at: siteData.created_at,
          updated_at: siteData.updated_at,
          build_settings: siteData.build_settings
        }
      }),
    };
  } catch (error) {
    console.error('❌ Get site info failed:', error);
    throw error;
  }
}

/**
 * Get DNS configuration for the site
 */
async function getDNSInfo(siteId, headers) {
  try {
    console.log('🌐 Getting DNS information...');
    
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/dns`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`DNS info failed: ${response.status} ${response.statusText}`);
    }

    const dnsData = await response.json();
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'getDNSInfo',
        data: {
          dns_records: dnsData,
          record_count: dnsData.length,
          record_types: [...new Set(dnsData.map(record => record.type))]
        }
      }),
    };
  } catch (error) {
    console.error('❌ Get DNS info failed:', error);
    throw error;
  }
}

/**
 * Get SSL certificate status
 */
async function getSSLStatus(siteId, headers) {
  try {
    console.log('🔒 Getting SSL status...');
    
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/ssl`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`SSL status failed: ${response.status} ${response.statusText}`);
    }

    const sslData = await response.json();
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'getSSLStatus',
        data: sslData
      }),
    };
  } catch (error) {
    console.error('❌ Get SSL status failed:', error);
    throw error;
  }
}

/**
 * Validate a specific domain
 */
async function validateDomain(siteId, domain, headers) {
  try {
    console.log(`🔍 Validating domain: ${domain}`);
    
    // Get current site info to check if domain exists
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers
    });

    if (!siteResponse.ok) {
      throw new Error(`Site validation failed: ${siteResponse.status}`);
    }

    const siteData = await siteResponse.json();
    const domainAliases = siteData.domain_aliases || [];
    const customDomain = siteData.custom_domain;
    
    // Check if domain exists as alias or custom domain
    const domainExists = domainAliases.includes(domain) || customDomain === domain;
    
    // Get DNS info for validation
    const dnsResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/dns`, {
      method: 'GET',
      headers
    });

    let dnsRecords = [];
    if (dnsResponse.ok) {
      dnsRecords = await dnsResponse.json();
    }

    // Filter DNS records for this domain
    const domainDNSRecords = dnsRecords.filter(record => 
      record.hostname === domain || 
      record.hostname === `www.${domain}` ||
      record.hostname.endsWith(`.${domain}`)
    );

    // Get SSL status
    let sslStatus = null;
    try {
      const sslResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/ssl`, {
        method: 'GET',
        headers
      });
      if (sslResponse.ok) {
        sslStatus = await sslResponse.json();
      }
    } catch (sslError) {
      console.warn('⚠️ Could not get SSL status:', sslError);
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'validateDomain',
        domain: domain,
        validation: {
          domain_exists_in_netlify: domainExists,
          is_custom_domain: customDomain === domain,
          is_domain_alias: domainAliases.includes(domain),
          dns_records_found: domainDNSRecords.length > 0,
          ssl_configured: sslStatus ? sslStatus.state === 'issued' : false,
          validation_status: domainExists ? 'valid' : 'not_configured'
        },
        data: {
          site_info: {
            custom_domain: customDomain,
            domain_aliases: domainAliases,
            ssl_url: siteData.ssl_url
          },
          dns_records: domainDNSRecords,
          ssl_status: sslStatus
        }
      }),
    };
  } catch (error) {
    console.error(`❌ Domain validation failed for ${domain}:`, error);
    throw error;
  }
}

/**
 * Add domain as alias to site
 */
async function addDomainAlias(siteId, domain, headers) {
  try {
    console.log(`➕ Adding domain alias: ${domain}`);
    
    // First get current aliases
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to get current aliases: ${siteResponse.status}`);
    }

    const siteData = await siteResponse.json();
    const currentAliases = siteData.domain_aliases || [];
    
    // Check if domain already exists
    if (currentAliases.includes(domain)) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          action: 'addDomainAlias',
          message: `Domain ${domain} already exists as alias`,
          domain: domain,
          already_exists: true,
          current_aliases: currentAliases
        }),
      };
    }

    // Add new domain to aliases
    const updatedAliases = [...currentAliases, domain];
    
    const updateResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        domain_aliases: updatedAliases
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to add domain alias: ${updateResponse.status} - ${errorText}`);
    }

    const updatedSite = await updateResponse.json();
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'addDomainAlias',
        message: `Successfully added ${domain} as domain alias`,
        domain: domain,
        previous_aliases: currentAliases,
        current_aliases: updatedSite.domain_aliases,
        site_url: updatedSite.ssl_url || updatedSite.url
      }),
    };
  } catch (error) {
    console.error(`❌ Add domain alias failed for ${domain}:`, error);
    throw error;
  }
}

/**
 * Remove domain alias from site
 */
async function removeDomainAlias(siteId, domain, headers) {
  try {
    console.log(`➖ Removing domain alias: ${domain}`);

    // First get current aliases
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to get current aliases: ${siteResponse.status}`);
    }

    const siteData = await siteResponse.json();
    const currentAliases = siteData.domain_aliases || [];

    // Check if domain exists in aliases
    if (!currentAliases.includes(domain)) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          action: 'removeDomainAlias',
          message: `Domain ${domain} was not found in domain aliases`,
          domain: domain,
          not_found: true,
          current_aliases: currentAliases
        }),
      };
    }

    // Remove domain from aliases
    const updatedAliases = currentAliases.filter(alias => alias !== domain);

    const updateResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        domain_aliases: updatedAliases
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to remove domain alias: ${updateResponse.status} - ${errorText}`);
    }

    const updatedSite = await updateResponse.json();

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'removeDomainAlias',
        message: `Successfully removed ${domain} from domain aliases`,
        domain: domain,
        previous_aliases: currentAliases,
        current_aliases: updatedSite.domain_aliases,
        site_url: updatedSite.ssl_url || updatedSite.url
      }),
    };
  } catch (error) {
    console.error(`❌ Remove domain alias failed for ${domain}:`, error);
    throw error;
  }
}

/**
 * List all domain aliases for the site
 */
async function listDomainAliases(siteId, headers) {
  try {
    console.log('📋 Listing domain aliases...');
    
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`List aliases failed: ${response.status}`);
    }

    const siteData = await response.json();
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        action: 'listDomainAliases',
        data: {
          site_name: siteData.name,
          custom_domain: siteData.custom_domain,
          domain_aliases: siteData.domain_aliases || [],
          ssl_url: siteData.ssl_url,
          total_domains: (siteData.domain_aliases || []).length + (siteData.custom_domain ? 1 : 0)
        }
      }),
    };
  } catch (error) {
    console.error('❌ List domain aliases failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive domain report
 */
async function getFullDomainReport(siteId, domain, headers) {
  try {
    console.log(`📊 Getting full domain report for: ${domain || 'all domains'}`);
    
    // Get all the information in parallel
    const [siteInfo, dnsInfo, sslStatus] = await Promise.allSettled([
      getSiteInfo(siteId, headers),
      getDNSInfo(siteId, headers),
      getSSLStatus(siteId, headers)
    ]);

    const report = {
      success: true,
      action: 'getFullDomainReport',
      timestamp: new Date().toISOString(),
      site_id: siteId,
      requested_domain: domain,
      report: {}
    };

    // Process site info
    if (siteInfo.status === 'fulfilled') {
      const siteData = JSON.parse(siteInfo.value.body).data;
      report.report.site_info = siteData;
    } else {
      report.report.site_info_error = siteInfo.reason?.message || 'Failed to get site info';
    }

    // Process DNS info
    if (dnsInfo.status === 'fulfilled') {
      const dnsData = JSON.parse(dnsInfo.value.body).data;
      report.report.dns_info = dnsData;
    } else {
      report.report.dns_info_error = dnsInfo.reason?.message || 'Failed to get DNS info';
    }

    // Process SSL status
    if (sslStatus.status === 'fulfilled') {
      const sslData = JSON.parse(sslStatus.value.body).data;
      report.report.ssl_status = sslData;
    } else {
      report.report.ssl_status_error = sslStatus.reason?.message || 'Failed to get SSL status';
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    };
  } catch (error) {
    console.error('❌ Full domain report failed:', error);
    throw error;
  }
}
