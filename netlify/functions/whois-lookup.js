const dns = require('dns').promises;

/**
 * WHOIS lookup function using DNS queries and pattern matching
 * Since true WHOIS requires external services, we'll use DNS-based detection
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
    const { domain } = JSON.parse(event.body || '{}');

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

    console.log(`🔍 Performing WHOIS-like lookup for ${domain}`);

    // Perform DNS-based registrar detection
    const registrarInfo = await detectRegistrarInfo(domain);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: registrarInfo
      })
    };

  } catch (error) {
    console.error('WHOIS lookup error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'WHOIS lookup failed',
        details: error.message
      })
    };
  }
};

/**
 * Detect registrar information using DNS queries
 */
async function detectRegistrarInfo(domain) {
  const info = {
    domain: domain,
    registrar: 'Unknown',
    registrar_name: 'Unknown',
    nameservers: [],
    status: ['active'],
    creation_date: null,
    expiration_date: null,
    updated_date: new Date().toISOString()
  };

  try {
    // Get nameservers
    const nameservers = await dns.resolveNs(domain);
    info.nameservers = nameservers;
    
    // Detect registrar based on nameserver patterns
    const registrar = identifyRegistrarByNameservers(nameservers);
    info.registrar = registrar.name;
    info.registrar_name = registrar.name;

    // Try to get SOA record for additional info
    try {
      const soaRecords = await dns.resolveSoa(domain);
      if (soaRecords) {
        info.primary_nameserver = soaRecords.nsname;
        info.serial = soaRecords.serial;
      }
    } catch (soaError) {
      console.log('SOA lookup failed (not critical):', soaError.message);
    }

    // Try to get MX records
    try {
      const mxRecords = await dns.resolveMx(domain);
      info.mail_servers = mxRecords.map(mx => mx.exchange);
    } catch (mxError) {
      console.log('MX lookup failed (not critical):', mxError.message);
    }

    return info;

  } catch (error) {
    console.error('DNS lookup failed:', error);
    
    // Return basic info even if DNS fails
    info.registrar = 'Detection Failed';
    info.registrar_name = 'Detection Failed';
    info.status = ['lookup_failed'];
    info.error = error.message;
    
    return info;
  }
}

/**
 * Identify registrar based on nameserver patterns
 */
function identifyRegistrarByNameservers(nameservers) {
  const nsString = nameservers.join(' ').toLowerCase();
  
  // Cloudflare
  if (nsString.includes('cloudflare.com') || 
      nsString.includes('ns.cloudflare.com')) {
    return { name: 'Cloudflare', code: 'cloudflare' };
  }
  
  // Namecheap
  if (nsString.includes('namecheap.com') || 
      nsString.includes('registrar-servers.com') ||
      nsString.includes('dns1.registrar-servers.com')) {
    return { name: 'Namecheap', code: 'namecheap' };
  }
  
  // GoDaddy
  if (nsString.includes('domaincontrol.com') || 
      nsString.includes('godaddy.com') ||
      nsString.includes('parkingcrew.net')) {
    return { name: 'GoDaddy', code: 'godaddy' };
  }
  
  // Amazon Route 53
  if (nsString.includes('awsdns') || 
      nsString.includes('amazonaws.com')) {
    return { name: 'Amazon Route 53', code: 'route53' };
  }
  
  // DigitalOcean
  if (nsString.includes('digitalocean.com') || 
      nsString.includes('ns1.digitalocean.com')) {
    return { name: 'DigitalOcean', code: 'digitalocean' };
  }
  
  // Google Domains/Cloud DNS
  if (nsString.includes('googledomains.com') || 
      nsString.includes('google.com') ||
      nsString.includes('dns.google')) {
    return { name: 'Google Domains', code: 'google' };
  }
  
  // Hover
  if (nsString.includes('hover.com') || 
      nsString.includes('dns.hover.com')) {
    return { name: 'Hover', code: 'hover' };
  }
  
  // Network Solutions
  if (nsString.includes('worldnic.com') || 
      nsString.includes('networksolutions.com')) {
    return { name: 'Network Solutions', code: 'networksolutions' };
  }
  
  // 1&1/IONOS
  if (nsString.includes('1and1.com') || 
      nsString.includes('ionos.com') ||
      nsString.includes('ui-dns.com')) {
    return { name: '1&1 IONOS', code: 'ionos' };
  }
  
  // Bluehost
  if (nsString.includes('bluehost.com') || 
      nsString.includes('hostmonster.com')) {
    return { name: 'Bluehost', code: 'bluehost' };
  }
  
  // SiteGround
  if (nsString.includes('siteground.com')) {
    return { name: 'SiteGround', code: 'siteground' };
  }
  
  // Default fallback
  return { name: 'Unknown Registrar', code: 'unknown' };
}
