/**
 * Domain Diagnostic Function
 * 
 * This function helps diagnose issues with domain addition to Netlify
 * and provides detailed feedback for troubleshooting.
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
          error: 'Domain is required for diagnostics'
        }),
      };
    }

    console.log(`🔍 Running diagnostics for domain: ${domain}`);

    const diagnostics = {
      domain,
      timestamp: new Date().toISOString(),
      environment: {},
      netlifyAccount: {},
      domainChecks: {},
      recommendations: []
    };

    // 1. Check environment configuration
    const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

    diagnostics.environment = {
      hasNetlifyToken: !!netlifyToken,
      tokenLength: netlifyToken ? netlifyToken.length : 0,
      siteId: siteId,
      tokenFormat: netlifyToken ? netlifyToken.substring(0, 4) + '...' : 'missing'
    };

    if (!netlifyToken) {
      diagnostics.recommendations.push({
        type: 'critical',
        message: 'NETLIFY_ACCESS_TOKEN is not configured',
        action: 'Set the NETLIFY_ACCESS_TOKEN environment variable'
      });
    }

    // 2. Check Netlify account access
    if (netlifyToken) {
      try {
        console.log('Testing Netlify API access...');
        
        const accountResponse = await fetch('https://api.netlify.com/api/v1/accounts', {
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
          },
        });

        if (accountResponse.ok) {
          const accounts = await accountResponse.json();
          diagnostics.netlifyAccount = {
            accessible: true,
            accountCount: accounts.length,
            primaryAccount: accounts[0]?.name || 'Unknown'
          };
        } else {
          diagnostics.netlifyAccount = {
            accessible: false,
            error: `${accountResponse.status} ${accountResponse.statusText}`,
            details: await accountResponse.text()
          };

          diagnostics.recommendations.push({
            type: 'critical',
            message: 'Cannot access Netlify account with provided token',
            action: 'Verify NETLIFY_ACCESS_TOKEN is valid and has proper permissions'
          });
        }
      } catch (error) {
        diagnostics.netlifyAccount = {
          accessible: false,
          error: error.message
        };
      }

      // 3. Check site access
      try {
        console.log(`Testing site access for: ${siteId}`);
        
        const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
          },
        });

        if (siteResponse.ok) {
          const siteData = await siteResponse.json();
          diagnostics.netlifyAccount.site = {
            accessible: true,
            name: siteData.name,
            url: siteData.url,
            customDomain: siteData.custom_domain || 'none',
            plan: siteData.account_type || 'unknown'
          };
        } else {
          diagnostics.netlifyAccount.site = {
            accessible: false,
            error: `${siteResponse.status} ${siteResponse.statusText}`
          };

          diagnostics.recommendations.push({
            type: 'critical',
            message: 'Cannot access specified Netlify site',
            action: 'Verify NETLIFY_SITE_ID is correct and token has access to this site'
          });
        }
      } catch (error) {
        diagnostics.netlifyAccount.site = {
          accessible: false,
          error: error.message
        };
      }
    }

    // 4. Domain format validation
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    const isValidFormat = domainRegex.test(cleanDomain);
    const isSubdomain = cleanDomain.split('.').length > 2;

    diagnostics.domainChecks = {
      original: domain,
      cleaned: cleanDomain,
      isValidFormat,
      isSubdomain,
      requiresTxtVerification: isSubdomain
    };

    if (!isValidFormat) {
      diagnostics.recommendations.push({
        type: 'warning',
        message: 'Domain format appears invalid',
        action: `Check domain format: ${cleanDomain}`
      });
    }

    // 5. DNS checks
    try {
      console.log(`Checking DNS for: ${cleanDomain}`);
      
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=A`);
      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        diagnostics.domainChecks.dns = {
          resolvable: !!dnsData.Answer,
          records: dnsData.Answer ? dnsData.Answer.length : 0,
          ips: dnsData.Answer ? dnsData.Answer.map(a => a.data) : []
        };
      }
    } catch (error) {
      diagnostics.domainChecks.dns = {
        resolvable: false,
        error: error.message
      };
    }

    // 6. Generate overall assessment
    const criticalIssues = diagnostics.recommendations.filter(r => r.type === 'critical').length;
    const warningIssues = diagnostics.recommendations.filter(r => r.type === 'warning').length;

    diagnostics.assessment = {
      status: criticalIssues === 0 ? (warningIssues === 0 ? 'healthy' : 'warning') : 'critical',
      criticalIssues,
      warningIssues,
      canAddDomain: criticalIssues === 0 && isValidFormat
    };

    if (diagnostics.assessment.canAddDomain) {
      diagnostics.recommendations.push({
        type: 'success',
        message: 'Configuration looks good for domain addition',
        action: 'You can retry adding the domain to Netlify'
      });
    }

    console.log('✅ Diagnostics completed:', diagnostics.assessment);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        diagnostics
      }),
    };

  } catch (error) {
    console.error('❌ Error in diagnose-domain-issue function:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Diagnostics failed',
        details: 'Check server logs for more information'
      }),
    };
  }
};
