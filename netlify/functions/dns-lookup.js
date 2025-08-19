const dns = require('dns').promises;

/**
 * DNS lookup function for getting various record types
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
    const { domain, type = 'A' } = JSON.parse(event.body || '{}');

    if (!domain) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Domain is required'
        })
      };
    }

    console.log(`🔍 DNS lookup for ${domain} (${type})`);

    // Perform DNS lookup based on record type
    const records = await performDNSLookup(domain, type.toUpperCase());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        domain: domain,
        type: type.toUpperCase(),
        records: records
      })
    };

  } catch (error) {
    console.error('DNS lookup error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'DNS lookup failed',
        details: error.message
      })
    };
  }
};

/**
 * Perform DNS lookup for different record types
 */
async function performDNSLookup(domain, type) {
  const timeout = 8000; // 8 second timeout
  
  try {
    switch (type) {
      case 'A':
        return await withTimeout(dns.resolve4(domain), timeout);
      
      case 'AAAA':
        return await withTimeout(dns.resolve6(domain), timeout);
      
      case 'CNAME':
        return await withTimeout(dns.resolveCname(domain), timeout);
      
      case 'TXT':
        const txtRecords = await withTimeout(dns.resolveTxt(domain), timeout);
        return txtRecords.flat(); // Flatten array of arrays
      
      case 'MX':
        const mxRecords = await withTimeout(dns.resolveMx(domain), timeout);
        return mxRecords.map(mx => ({
          exchange: mx.exchange,
          priority: mx.priority
        }));
      
      case 'NS':
        return await withTimeout(dns.resolveNs(domain), timeout);
      
      case 'SOA':
        const soaRecord = await withTimeout(dns.resolveSoa(domain), timeout);
        return [soaRecord];
      
      case 'PTR':
        return await withTimeout(dns.resolvePtr(domain), timeout);
      
      case 'SRV':
        return await withTimeout(dns.resolveSrv(domain), timeout);
      
      default:
        throw new Error(`Unsupported record type: ${type}`);
    }
  } catch (error) {
    console.error(`DNS lookup failed for ${domain} (${type}):`, error.message);
    
    // Return empty array for most record types that might not exist
    if (error.code === 'ENOTFOUND' || 
        error.code === 'ENODATA' || 
        error.message.includes('queryTxt ENOTFOUND')) {
      return [];
    }
    
    throw error;
  }
}

/**
 * Add timeout to DNS operations
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`DNS query timeout after ${ms}ms`)), ms)
    )
  ]);
}
