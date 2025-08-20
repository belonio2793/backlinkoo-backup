/**
 * Netlify Function: DNS Domain Validation
 * Validates DNS records for domains using external DNS lookup services
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { domain_id } = JSON.parse(event.body || '{}');

    // Health check
    if (domain_id === 'health-check') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'DNS validation service is online',
          timestamp: new Date().toISOString()
        })
      };
    }

    if (!domain_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'domain_id is required' })
      };
    }

    // Get domain from Supabase
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domain_id)
      .single();

    if (domainError || !domain) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Domain not found',
          domain_id
        })
      };
    }

    console.log(`🔍 Validating DNS for domain: ${domain.domain}`);

    // Perform DNS validation using external services
    const validationResults = await validateDNSRecords(domain);

    // Update domain in Supabase
    const updateData = {
      dns_validated: validationResults.dns_validated,
      txt_record_validated: validationResults.txt_validated,
      a_record_validated: validationResults.a_validated,
      cname_validated: validationResults.cname_validated,
      status: validationResults.dns_validated ? 'active' : 'failed',
      last_validation_attempt: new Date().toISOString(),
      validation_error: validationResults.error || null
    };

    const { error: updateError } = await supabase
      .from('domains')
      .update(updateData)
      .eq('id', domain_id);

    if (updateError) {
      console.error('Error updating domain:', updateError);
    }

    const result = {
      success: true,
      validated: validationResults.dns_validated,
      domain: domain.domain,
      results: validationResults,
      message: validationResults.dns_validated 
        ? `DNS validation successful for ${domain.domain}`
        : `DNS validation failed for ${domain.domain}: ${validationResults.error || 'Unknown error'}`
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('DNS validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'DNS validation service error',
        details: error.message
      })
    };
  }
};

/**
 * Validate DNS records for a domain
 */
async function validateDNSRecords(domain) {
  const results = {
    txt_validated: false,
    a_validated: false,
    cname_validated: false,
    dns_validated: false,
    error: null
  };

  try {
    // Use DNS over HTTPS for reliable DNS lookups
    const dnsQueries = await Promise.allSettled([
      validateARecord(domain.domain, domain.required_a_record),
      validateTXTRecord(domain.domain, domain.verification_token),
      validateCNAMERecord(domain.domain, domain.required_cname)
    ]);

    // Process A record validation
    if (dnsQueries[0].status === 'fulfilled') {
      results.a_validated = dnsQueries[0].value;
    }

    // Process TXT record validation
    if (dnsQueries[1].status === 'fulfilled') {
      results.txt_validated = dnsQueries[1].value;
    }

    // Process CNAME record validation
    if (dnsQueries[2].status === 'fulfilled') {
      results.cname_validated = dnsQueries[2].value;
    }

    // Domain is considered validated if both A and TXT records are valid
    results.dns_validated = results.a_validated && results.txt_validated;

    if (!results.dns_validated) {
      const errors = [];
      if (!results.a_validated) errors.push('A record not configured');
      if (!results.txt_validated) errors.push('TXT record not configured');
      results.error = errors.join(', ');
    }

  } catch (error) {
    console.error('DNS validation error:', error);
    results.error = error.message;
  }

  return results;
}

/**
 * Validate A record using DNS over HTTPS
 */
async function validateARecord(domain, expectedIP) {
  try {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });

    if (!response.ok) return false;

    const data = await response.json();
    
    if (data.Answer) {
      return data.Answer.some(record => 
        record.type === 1 && record.data === expectedIP
      );
    }

    return false;
  } catch (error) {
    console.error('A record validation error:', error);
    return false;
  }
}

/**
 * Validate TXT record for domain verification
 */
async function validateTXTRecord(domain, verificationToken) {
  try {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`, {
      headers: { 'Accept': 'application/dns-json' }
    });

    if (!response.ok) return false;

    const data = await response.json();
    
    if (data.Answer) {
      const expectedValue = `blo-verification=${verificationToken}`;
      return data.Answer.some(record => 
        record.type === 16 && record.data.includes(expectedValue)
      );
    }

    return false;
  } catch (error) {
    console.error('TXT record validation error:', error);
    return false;
  }
}

/**
 * Validate CNAME record for www subdomain
 */
async function validateCNAMERecord(domain, expectedCNAME) {
  try {
    const wwwDomain = `www.${domain}`;
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${wwwDomain}&type=CNAME`, {
      headers: { 'Accept': 'application/dns-json' }
    });

    if (!response.ok) return true; // CNAME is optional

    const data = await response.json();
    
    if (data.Answer) {
      return data.Answer.some(record => 
        record.type === 5 && record.data === expectedCNAME
      );
    }

    return true; // CNAME is optional
  } catch (error) {
    console.error('CNAME record validation error:', error);
    return true; // CNAME is optional, don't fail validation
  }
}
