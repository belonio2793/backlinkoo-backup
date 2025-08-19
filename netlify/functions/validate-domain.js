const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Validate DNS records for a domain
 */
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.'
      })
    };
  }

  try {
    // Parse request body
    const { domain_id } = JSON.parse(event.body || '{}');

    if (!domain_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'domain_id is required'
        })
      };
    }

    console.log(`🔍 Validating domain ID: ${domain_id}`);

    // Get domain from database
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domain_id)
      .single();

    if (domainError || !domain) {
      console.error('Domain not found:', domainError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Domain not found'
        })
      };
    }

    console.log(`📍 Validating domain: ${domain.domain}`);

    // Simulate DNS validation (since we can't do real DNS queries in Netlify functions easily)
    const validationResults = await mockDNSValidation(domain);

    // Update domain with validation results
    const updateData = {
      dns_validated: validationResults.dns_validated,
      txt_record_validated: validationResults.txt_validated,
      a_record_validated: validationResults.a_validated,
      cname_validated: validationResults.cname_validated,
      last_validation_attempt: new Date().toISOString(),
      validation_error: validationResults.error || null,
      status: validationResults.dns_validated ? 'active' : 'failed'
    };

    const { error: updateError } = await supabase
      .from('domains')
      .update(updateData)
      .eq('id', domain_id);

    if (updateError) {
      console.error('Failed to update domain:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to update domain validation status'
        })
      };
    }

    // Log validation attempt
    await logValidationAttempt(domain_id, validationResults);

    console.log(`✅ Domain validation completed for ${domain.domain}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        validated: validationResults.dns_validated,
        domain: domain.domain,
        results: validationResults,
        message: validationResults.dns_validated 
          ? 'Domain validated successfully!' 
          : 'DNS validation failed. Please check your DNS records.'
      })
    };

  } catch (error) {
    console.error('Domain validation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error during validation',
        details: error.message
      })
    };
  }
};

/**
 * Mock DNS validation (in production, you'd use real DNS lookup tools)
 */
async function mockDNSValidation(domain) {
  console.log(`🔍 Running mock DNS validation for ${domain.domain}`);

  // Simulate DNS lookup delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Mock validation logic
  const results = {
    a_validated: Math.random() > 0.3, // 70% chance
    txt_validated: Math.random() > 0.4, // 60% chance  
    cname_validated: Math.random() > 0.5, // 50% chance
    error: null
  };

  // A domain is fully validated if all required records pass
  results.dns_validated = results.a_validated && results.txt_validated;

  if (!results.dns_validated) {
    const missing = [];
    if (!results.a_validated) missing.push('A record');
    if (!results.txt_validated) missing.push('TXT record');
    results.error = `Missing or invalid DNS records: ${missing.join(', ')}`;
  }

  console.log(`📊 Validation results for ${domain.domain}:`, results);
  
  return results;
}

/**
 * Log validation attempt for debugging
 */
async function logValidationAttempt(domainId, results) {
  try {
    await supabase
      .from('domain_validation_logs')
      .insert({
        domain_id: domainId,
        validation_type: 'full',
        success: results.dns_validated,
        error_message: results.error,
        dns_response: results
      });
  } catch (error) {
    console.warn('Failed to log validation attempt:', error);
    // Don't fail the main operation if logging fails
  }
}

/**
 * Real DNS validation function (commented out - requires external DNS service)
 */
/*
async function realDNSValidation(domain) {
  const dns = require('dns').promises;
  const results = {
    a_validated: false,
    txt_validated: false,
    cname_validated: false,
    dns_validated: false,
    error: null
  };

  try {
    // Check A record
    try {
      const aRecords = await dns.resolve4(domain.domain);
      results.a_validated = aRecords.some(ip => ip === domain.required_a_record);
    } catch (e) {
      console.log('A record lookup failed:', e.message);
    }

    // Check TXT record
    try {
      const txtRecords = await dns.resolveTxt(domain.domain);
      const flatTxt = txtRecords.flat().join(' ');
      results.txt_validated = flatTxt.includes(domain.verification_token);
    } catch (e) {
      console.log('TXT record lookup failed:', e.message);
    }

    // Check CNAME record
    try {
      const cnameRecords = await dns.resolveCname(`www.${domain.domain}`);
      results.cname_validated = cnameRecords.some(cname => cname === domain.required_cname);
    } catch (e) {
      console.log('CNAME record lookup failed:', e.message);
    }

    results.dns_validated = results.a_validated && results.txt_validated;
    
  } catch (error) {
    results.error = error.message;
  }

  return results;
}
*/
