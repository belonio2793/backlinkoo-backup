const { createClient } = require('@supabase/supabase-js');
const dns = require('dns').promises;

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Default hosting configuration - should match your actual hosting setup
const EXPECTED_HOST = "hosting.backlinkoo.com"; // Your CNAME target
const EXPECTED_IP = "192.168.1.100"; // Your hosting IP (this should be your real IP)

/**
 * Timeout wrapper for DNS queries with retry logic
 */
function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`DNS query timeout after ${ms}ms`)), ms)
    )
  ]);
}

/**
 * Retry wrapper for DNS operations
 */
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`DNS operation attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

/**
 * Real DNS validation for domain records
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
    const { domain_id, domain: domainName } = JSON.parse(event.body || '{}');

    if (!domain_id && !domainName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'domain_id or domain is required'
        })
      };
    }

    console.log(`🔍 Starting DNS validation for domain ID: ${domain_id}`);

    // Get domain from database
    let domainQuery = supabase.from('domains').select('*');
    
    if (domain_id) {
      domainQuery = domainQuery.eq('id', domain_id);
    } else {
      domainQuery = domainQuery.eq('domain', domainName);
    }

    const { data: domain, error: domainError } = await domainQuery.single();

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

    // Get expected values from domain record or use defaults
    const expectedIP = domain.required_a_record || EXPECTED_IP;
    const expectedHost = domain.required_cname || EXPECTED_HOST;
    const verificationToken = domain.verification_token;

    if (!verificationToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Domain missing verification token. Please re-add the domain.'
        })
      };
    }

    // Perform real DNS validation
    const validationResults = await performDNSValidation(
      domain.domain, 
      verificationToken, 
      expectedIP, 
      expectedHost
    );

    // Update domain with validation results
    const updateData = {
      dns_validated: validationResults.success,
      txt_record_validated: validationResults.txtValid,
      a_record_validated: validationResults.aValid,
      cname_validated: validationResults.cnameValid,
      last_validation_attempt: new Date().toISOString(),
      validation_error: validationResults.error || null,
      status: validationResults.success ? 'active' : 'failed'
    };

    const { error: updateError } = await supabase
      .from('domains')
      .update(updateData)
      .eq('id', domain.id);

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

    // Log validation attempt for debugging
    await logValidationAttempt(domain.id, validationResults);

    console.log(`✅ DNS validation completed for ${domain.domain}:`, validationResults);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        validated: validationResults.success,
        domain: domain.domain,
        results: {
          txt_validated: validationResults.txtValid,
          a_validated: validationResults.aValid,
          cname_validated: validationResults.cnameValid,
          dns_validated: validationResults.success,
          error: validationResults.error
        },
        message: validationResults.success 
          ? 'Domain validated successfully!' 
          : `DNS validation failed: ${validationResults.error}`
      })
    };

  } catch (error) {
    console.error('DNS validation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error during DNS validation',
        details: error.message
      })
    };
  }
};

/**
 * Perform real DNS validation checks
 */
async function performDNSValidation(domain, verificationToken, expectedIP, expectedHost) {
  const results = {
    txtValid: false,
    aValid: false,
    cnameValid: false,
    success: false,
    error: null,
    details: {}
  };

  try {
    console.log(`🔍 Checking DNS records for ${domain}`);
    console.log(`Expected IP: ${expectedIP}, Expected Host: ${expectedHost}`);
    console.log(`Verification Token: ${verificationToken}`);

    // Check TXT record for verification token with retry
    try {
      const txtRecords = await withRetry(async () => {
        return await withTimeout(dns.resolveTxt(domain), 8000);
      });
      const flattened = txtRecords.flat().join(' ');
      results.txtValid = flattened.includes(verificationToken);
      results.details.txtRecords = txtRecords;
      console.log(`📝 TXT records found:`, txtRecords);
      console.log(`📝 TXT validation: ${results.txtValid}`);
    } catch (txtError) {
      console.log(`❌ TXT record lookup failed after retries:`, txtError.message);
      results.details.txtError = txtError.message;
    }

    // Check A record with retry
    try {
      const aRecords = await withRetry(async () => {
        return await withTimeout(dns.resolve4(domain), 8000);
      });
      results.aValid = aRecords.includes(expectedIP);
      results.details.aRecords = aRecords;
      console.log(`🔗 A records found:`, aRecords);
      console.log(`🔗 A record validation: ${results.aValid}`);
    } catch (aError) {
      console.log(`❌ A record lookup failed after retries:`, aError.message);
      results.details.aError = aError.message;
    }

    // Check CNAME record for www subdomain with retry
    try {
      const cnameRecords = await withRetry(async () => {
        return await withTimeout(dns.resolveCname(`www.${domain}`), 8000);
      });
      results.cnameValid = cnameRecords.includes(expectedHost);
      results.details.cnameRecords = cnameRecords;
      console.log(`🌐 CNAME records found:`, cnameRecords);
      console.log(`🌐 CNAME validation: ${results.cnameValid}`);
    } catch (cnameError) {
      console.log(`❌ CNAME record lookup failed after retries:`, cnameError.message);
      results.details.cnameError = cnameError.message;
      // CNAME is optional, so don't fail validation for this
      results.cnameValid = true; // Consider CNAME as optional
    }

    // Domain is valid if TXT and A records are correct
    // CNAME is optional but recommended
    results.success = results.txtValid && results.aValid;

    if (!results.success) {
      const missing = [];
      if (!results.txtValid) missing.push(`TXT record with verification token`);
      if (!results.aValid) missing.push(`A record pointing to ${expectedIP}`);
      results.error = `Missing or invalid DNS records: ${missing.join(' and ')}`;
    }

    console.log(`📊 Final validation results:`, results);
    
  } catch (error) {
    console.error('DNS validation error:', error);
    results.error = `DNS validation error: ${error.message}`;
    results.success = false;
  }

  return results;
}

/**
 * Log validation attempt for debugging
 */
async function logValidationAttempt(domainId, results) {
  try {
    // Try to insert validation log, but don't fail if table doesn't exist
    await supabase
      .from('domain_validation_logs')
      .insert({
        domain_id: domainId,
        validation_type: 'dns',
        success: results.success,
        error_message: results.error,
        dns_response: results.details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('Failed to log validation attempt (table may not exist):', error.message);
    // Don't fail the main operation if logging fails
  }
}
