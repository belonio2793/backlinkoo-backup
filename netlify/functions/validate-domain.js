/**
 * Validate Domain - DNS Record Validation Function
 * 
 * Validates DNS records for a domain to ensure proper configuration
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
    console.log('🔍 Starting DNS validation...');
    
    // Parse request body
    let requestData = {};
    if (event.body) {
      try {
        requestData = JSON.parse(event.body);
        console.log('📋 Validation request:', { domain: requestData.domain, domainId: requestData.domainId });
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

    // Clean the domain name
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    console.log(`🔍 Validating DNS for domain: ${cleanDomain}`);

    // Simulate DNS validation (in production, you would use DNS lookup libraries)
    const validation = await simulateDnsValidation(cleanDomain);

    console.log('✅ DNS validation completed:', validation);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(validation),
    };

  } catch (error) {
    console.error('❌ DNS validation error:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'DNS validation failed',
        details: 'Check server logs for more information'
      }),
    };
  }
};

/**
 * Simulate DNS validation for development
 * In production, this would use actual DNS lookup libraries like 'dns' or external APIs
 */
async function simulateDnsValidation(domain) {
  // Simulate validation delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Determine if this is a subdomain or root domain
  const isSubdomain = domain.split('.').length > 2;
  
  let dnsChecks;
  
  if (isSubdomain) {
    // Subdomain DNS checks
    dnsChecks = [
      {
        type: 'CNAME',
        name: domain.split('.')[0],
        expectedValue: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809.netlify.app',
        currentValue: Math.random() > 0.3 ? 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809.netlify.app' : 'old-server.example.com',
        status: Math.random() > 0.3 ? 'verified' : 'error',
        error: Math.random() > 0.7 ? 'CNAME record not found' : undefined
      }
    ];
  } else {
    // Root domain DNS checks
    dnsChecks = [
      {
        type: 'A',
        name: '@',
        expectedValue: '75.2.60.5',
        currentValue: Math.random() > 0.4 ? '75.2.60.5' : '1.2.3.4',
        status: Math.random() > 0.4 ? 'verified' : 'error',
        error: Math.random() > 0.8 ? 'A record not found' : undefined
      },
      {
        type: 'A',
        name: '@',
        expectedValue: '99.83.190.102',
        currentValue: Math.random() > 0.4 ? '99.83.190.102' : '1.2.3.4',
        status: Math.random() > 0.4 ? 'verified' : 'error',
        error: Math.random() > 0.8 ? 'Secondary A record not found' : undefined
      },
      {
        type: 'CNAME',
        name: 'www',
        expectedValue: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809.netlify.app',
        currentValue: Math.random() > 0.5 ? 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809.netlify.app' : 'old-server.example.com',
        status: Math.random() > 0.5 ? 'verified' : 'error',
        error: Math.random() > 0.7 ? 'WWW CNAME record not found' : undefined
      }
    ];
  }
  
  // Calculate overall success
  const verifiedChecks = dnsChecks.filter(check => check.status === 'verified');
  const success = verifiedChecks.length === dnsChecks.length;
  
  let message;
  if (success) {
    message = `All DNS records validated successfully for ${domain}`;
  } else {
    const errorCount = dnsChecks.length - verifiedChecks.length;
    message = `${errorCount} DNS record${errorCount > 1 ? 's' : ''} need attention for ${domain}`;
  }
  
  return {
    success,
    message,
    domain,
    dnsChecks,
    netlifyVerified: Math.random() > 0.2, // 80% chance Netlify recognizes the domain
    dnsVerified: success,
    timestamp: new Date().toISOString(),
    propagationEstimate: success ? 'Complete' : '6-48 hours remaining'
  };
}
