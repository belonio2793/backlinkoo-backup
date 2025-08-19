const { createClient } = require('@supabase/supabase-js');
const dns = require('dns').promises;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Your hosting configuration - update these with your actual hosting details
const HOSTING_CONFIG = {
  ip: process.env.HOSTING_IP || '24d12611b1d842c3991e44b7832b3bca-e9bf40585b974daebd52c6201.fly.dev', // Netlify/Fly.io IP
  cname_target: process.env.HOSTING_CNAME || 'backlinkoo.com', // Your main domain
  txt_prefix: 'blo-verification=',
  // Add validation options
  allow_any_ip: process.env.ALLOW_ANY_IP === 'true', // For testing
  debug_mode: process.env.DEBUG_DNS === 'true'
};

/**
 * Validate DNS records for a domain
 */
async function validateDNSRecords(domain, verificationToken) {
  const results = {
    domain,
    txt_validated: false,
    a_validated: false,
    cname_validated: false,
    errors: [],
    dns_responses: {}
  };

  try {
    // 1. Validate TXT record for domain verification
    console.log(`🔍 Checking TXT record for ${domain}...`);
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const flatTxt = txtRecords.flat().join(' ');
      results.dns_responses.txt = txtRecords;
      
      const expectedTxt = `${HOSTING_CONFIG.txt_prefix}${verificationToken}`;
      if (flatTxt.includes(expectedTxt)) {
        results.txt_validated = true;
        console.log(`✅ TXT record validated for ${domain}`);
      } else {
        results.errors.push(`TXT record not found. Expected: ${expectedTxt}`);
        console.log(`❌ TXT record validation failed for ${domain}. Found: ${flatTxt}`);
      }
    } catch (error) {
      results.errors.push(`TXT record lookup failed: ${error.message}`);
      console.log(`❌ TXT record lookup error for ${domain}:`, error.message);
    }

    // 2. Validate A record points to our hosting
    console.log(`🔍 Checking A record for ${domain}...`);
    try {
      const aRecords = await dns.resolve4(domain);
      results.dns_responses.a = aRecords;
      
      if (aRecords.includes(HOSTING_CONFIG.ip)) {
        results.a_validated = true;
        console.log(`✅ A record validated for ${domain}`);
      } else {
        results.errors.push(`A record doesn't point to our hosting IP: ${HOSTING_CONFIG.ip}. Found: ${aRecords.join(', ')}`);
        console.log(`❌ A record validation failed for ${domain}. Expected: ${HOSTING_CONFIG.ip}, Found: ${aRecords.join(', ')}`);
      }
    } catch (error) {
      results.errors.push(`A record lookup failed: ${error.message}`);
      console.log(`❌ A record lookup error for ${domain}:`, error.message);
    }

    // 3. Validate CNAME record for www subdomain
    console.log(`🔍 Checking CNAME record for www.${domain}...`);
    try {
      const cnameRecords = await dns.resolveCname(`www.${domain}`);
      results.dns_responses.cname = cnameRecords;
      
      if (cnameRecords.includes(HOSTING_CONFIG.cname_target) || cnameRecords.includes(domain)) {
        results.cname_validated = true;
        console.log(`✅ CNAME record validated for www.${domain}`);
      } else {
        results.errors.push(`CNAME record doesn't point to ${HOSTING_CONFIG.cname_target} or ${domain}. Found: ${cnameRecords.join(', ')}`);
        console.log(`❌ CNAME record validation failed for www.${domain}. Expected: ${HOSTING_CONFIG.cname_target}, Found: ${cnameRecords.join(', ')}`);
      }
    } catch (error) {
      // CNAME is optional, so just warn
      results.errors.push(`CNAME record lookup failed (optional): ${error.message}`);
      console.log(`⚠️ CNAME record lookup error for www.${domain}:`, error.message);
    }

  } catch (error) {
    console.error(`❌ DNS validation error for ${domain}:`, error);
    results.errors.push(`DNS validation failed: ${error.message}`);
  }

  return results;
}

/**
 * Update domain status in database
 */
async function updateDomainStatus(domainId, validationResults) {
  const isValid = validationResults.txt_validated && validationResults.a_validated;
  
  const updateData = {
    dns_validated: isValid,
    txt_record_validated: validationResults.txt_validated,
    a_record_validated: validationResults.a_validated,
    cname_validated: validationResults.cname_validated,
    status: isValid ? 'active' : 'failed',
    last_validation_attempt: new Date().toISOString(),
    validation_error: validationResults.errors.length > 0 ? validationResults.errors.join('; ') : null,
    auto_retry_count: 0 // Reset retry count on manual validation
  };

  const { error: updateError } = await supabase
    .from('domains')
    .update(updateData)
    .eq('id', domainId);

  if (updateError) {
    console.error('❌ Error updating domain status:', updateError);
    throw updateError;
  }

  // Log validation attempt
  const { error: logError } = await supabase
    .from('domain_validation_logs')
    .insert({
      domain_id: domainId,
      validation_type: 'full',
      success: isValid,
      error_message: validationResults.errors.length > 0 ? validationResults.errors.join('; ') : null,
      dns_response: validationResults.dns_responses
    });

  if (logError) {
    console.error('⚠️ Error logging validation attempt:', logError);
  }

  return isValid;
}

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { domain_id } = JSON.parse(event.body);

    if (!domain_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'domain_id is required' })
      };
    }

    // Get domain details from database
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domain_id)
      .single();

    if (domainError || !domain) {
      console.error('❌ Domain not found:', domainError);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Domain not found' })
      };
    }

    console.log(`🚀 Starting DNS validation for ${domain.domain}...`);

    // Update status to validating
    await supabase
      .from('domains')
      .update({ status: 'validating' })
      .eq('id', domain_id);

    // Perform DNS validation
    const validationResults = await validateDNSRecords(domain.domain, domain.verification_token);

    // Update domain status based on results
    const isValid = await updateDomainStatus(domain_id, validationResults);

    console.log(`${isValid ? '✅' : '❌'} DNS validation completed for ${domain.domain}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        domain: domain.domain,
        validated: isValid,
        results: validationResults
      })
    };

  } catch (error) {
    console.error('❌ DNS validation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'DNS validation failed',
        message: error.message
      })
    };
  }
};
