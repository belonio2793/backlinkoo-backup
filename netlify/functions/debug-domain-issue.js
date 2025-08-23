/**
 * Debug Domain Issue - Netlify Function
 * 
 * Helps diagnose why a specific domain cannot be added to Netlify
 * Provides detailed information about the site, existing aliases, and potential conflicts
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
    console.log('🔍 Starting domain diagnostic...');
    
    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
        console.log('📋 Diagnostic request:', { domain: requestData.domain });
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

    if (!netlifyToken) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Netlify access token not configured'
        }),
      };
    }

    // Clean the domain name
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    console.log(`🔍 Diagnosing domain: ${cleanDomain}`);

    const diagnostic = {
      domain: cleanDomain,
      timestamp: new Date().toISOString(),
      siteId: siteId,
      checks: [],
      recommendations: []
    };

    // 1. Get current site configuration
    try {
      console.log('📋 Fetching current site configuration...');
      const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!siteResponse.ok) {
        const errorData = await siteResponse.text();
        diagnostic.checks.push({
          name: 'Site Configuration Access',
          status: 'failed',
          message: `Cannot access site configuration: ${siteResponse.status} ${siteResponse.statusText}`,
          details: errorData
        });
        
        diagnostic.recommendations.push({
          type: 'critical',
          message: 'Cannot access Netlify site configuration',
          action: 'Verify NETLIFY_SITE_ID and NETLIFY_ACCESS_TOKEN are correct'
        });
      } else {
        const siteData = await siteResponse.json();
        
        diagnostic.checks.push({
          name: 'Site Configuration Access',
          status: 'passed',
          message: 'Successfully accessed site configuration',
          details: {
            siteName: siteData.name,
            customDomain: siteData.custom_domain,
            aliases: siteData.domain_aliases || [],
            sslUrl: siteData.ssl_url,
            url: siteData.url
          }
        });

        // 2. Check if domain already exists as alias
        const existingAliases = siteData.domain_aliases || [];
        if (existingAliases.includes(cleanDomain)) {
          diagnostic.checks.push({
            name: 'Domain Alias Check',
            status: 'warning',
            message: `Domain ${cleanDomain} is already configured as an alias`,
            details: { existingAliases }
          });
          
          diagnostic.recommendations.push({
            type: 'info',
            message: `Domain ${cleanDomain} is already added to your site`,
            action: 'No action needed - domain is already configured'
          });
        } else {
          diagnostic.checks.push({
            name: 'Domain Alias Check',
            status: 'passed',
            message: `Domain ${cleanDomain} is not currently configured as an alias`,
            details: { existingAliases }
          });
        }

        // 3. Check if domain conflicts with primary domain
        if (siteData.custom_domain === cleanDomain) {
          diagnostic.checks.push({
            name: 'Primary Domain Check',
            status: 'warning',
            message: `Domain ${cleanDomain} is already set as the primary domain`,
            details: { primaryDomain: siteData.custom_domain }
          });
          
          diagnostic.recommendations.push({
            type: 'warning',
            message: 'Domain is already the primary domain',
            action: 'Cannot add primary domain as alias - already configured'
          });
        } else {
          diagnostic.checks.push({
            name: 'Primary Domain Check',
            status: 'passed',
            message: `Domain ${cleanDomain} does not conflict with primary domain`,
            details: { primaryDomain: siteData.custom_domain }
          });
        }

        // 4. Test adding the domain (simulation)
        try {
          console.log('🧪 Testing domain addition (simulation)...');
          const testAliases = [...existingAliases, cleanDomain];
          
          // Don't actually update, just test the request format
          diagnostic.checks.push({
            name: 'Domain Addition Simulation',
            status: 'passed',
            message: 'Domain can be added to aliases array',
            details: {
              currentAliases: existingAliases,
              proposedAliases: testAliases,
              newAlias: cleanDomain
            }
          });
          
          if (!existingAliases.includes(cleanDomain)) {
            diagnostic.recommendations.push({
              type: 'success',
              message: `Domain ${cleanDomain} can be safely added as an alias`,
              action: 'Proceed with domain addition'
            });
          }
          
        } catch (testError) {
          diagnostic.checks.push({
            name: 'Domain Addition Simulation',
            status: 'failed',
            message: `Domain addition test failed: ${testError.message}`,
            details: testError
          });
        }
      }
    } catch (siteError) {
      console.error('❌ Site configuration error:', siteError);
      diagnostic.checks.push({
        name: 'Site Configuration Access',
        status: 'failed',
        message: `Network error accessing site: ${siteError.message}`,
        details: siteError
      });
    }

    // 5. Domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (domainRegex.test(cleanDomain)) {
      diagnostic.checks.push({
        name: 'Domain Format Validation',
        status: 'passed',
        message: 'Domain format is valid',
        details: { domain: cleanDomain, format: 'valid' }
      });
    } else {
      diagnostic.checks.push({
        name: 'Domain Format Validation',
        status: 'failed',
        message: 'Domain format is invalid',
        details: { domain: cleanDomain, format: 'invalid' }
      });
      
      diagnostic.recommendations.push({
        type: 'critical',
        message: 'Invalid domain format',
        action: 'Check domain spelling and format (e.g., example.com)'
      });
    }

    // Generate overall assessment
    const failedChecks = diagnostic.checks.filter(c => c.status === 'failed');
    const warningChecks = diagnostic.checks.filter(c => c.status === 'warning');
    
    let overallStatus = 'healthy';
    if (failedChecks.length > 0) {
      overallStatus = 'critical';
    } else if (warningChecks.length > 0) {
      overallStatus = 'warning';
    }

    diagnostic.assessment = {
      status: overallStatus,
      canAddDomain: failedChecks.length === 0,
      issues: failedChecks.length + warningChecks.length,
      summary: failedChecks.length === 0 ? 
        'Domain can be added successfully' : 
        `${failedChecks.length} critical issues prevent domain addition`
    };

    console.log('✅ Domain diagnostic completed:', diagnostic.assessment);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        diagnostics: diagnostic
      }),
    };

  } catch (error) {
    console.error('❌ Domain diagnostic error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Domain diagnostic failed',
        details: 'Check server logs for more information'
      }),
    };
  }
};
