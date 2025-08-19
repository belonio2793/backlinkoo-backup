/**
 * Get current DNS records from various registrar APIs
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
    const { domain, credentials } = JSON.parse(event.body || '{}');
    
    if (!domain || !credentials) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Domain and credentials are required'
        })
      };
    }

    console.log(`📋 Fetching DNS records for ${domain} from ${credentials.registrarCode}...`);

    // Get DNS records based on registrar type
    const result = await getDNSRecordsByRegistrar(domain, credentials);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Get DNS records error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        records: [],
        error: 'Failed to fetch DNS records',
        details: error.message
      })
    };
  }
};

/**
 * Get DNS records from different registrars
 */
async function getDNSRecordsByRegistrar(domain, credentials) {
  const { registrarCode } = credentials;

  try {
    switch (registrarCode) {
      case 'cloudflare':
        return await getCloudflareRecords(domain, credentials);
      
      case 'namecheap':
        return await getNamecheapRecords(domain, credentials);
      
      case 'godaddy':
        return await getGoDaddyRecords(domain, credentials);
      
      case 'digitalocean':
        return await getDigitalOceanRecords(domain, credentials);
      
      case 'route53':
        return await getRoute53Records(domain, credentials);
      
      default:
        return {
          success: false,
          records: [],
          error: `DNS record fetching not implemented for ${registrarCode}`
        };
    }
  } catch (error) {
    console.error(`Error fetching ${registrarCode} DNS records:`, error);
    return {
      success: false,
      records: [],
      error: `Failed to fetch ${registrarCode} DNS records: ${error.message}`
    };
  }
}

/**
 * Get DNS records from Cloudflare
 */
async function getCloudflareRecords(domain, credentials) {
  try {
    // First, get the zone ID if not provided
    let zoneId = credentials.zone;
    
    if (!zoneId) {
      const zonesResponse = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const zonesData = await zonesResponse.json();
      
      if (!zonesData.success || zonesData.result.length === 0) {
        throw new Error(`Zone not found for domain ${domain}`);
      }
      
      zoneId = zonesData.result[0].id;
    }

    // Get DNS records for the zone
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to fetch DNS records');
    }

    // Convert to our standard format
    const records = data.result.map(record => ({
      type: record.type,
      name: record.name === domain ? '@' : record.name.replace(`.${domain}`, ''),
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
      id: record.id
    }));

    return {
      success: true,
      records
    };

  } catch (error) {
    throw new Error(`Cloudflare API error: ${error.message}`);
  }
}

/**
 * Get DNS records from Namecheap
 */
async function getNamecheapRecords(domain, credentials) {
  try {
    const url = new URL('https://api.namecheap.com/xml.response');
    url.searchParams.set('ApiUser', credentials.userId || credentials.apiKey);
    url.searchParams.set('ApiKey', credentials.apiKey);
    url.searchParams.set('UserName', credentials.userId || credentials.apiKey);
    url.searchParams.set('Command', 'namecheap.domains.dns.getHosts');
    url.searchParams.set('ClientIp', '127.0.0.1'); // Would need actual client IP
    url.searchParams.set('SLD', domain.split('.')[0]);
    url.searchParams.set('TLD', domain.split('.').slice(1).join('.'));

    const response = await fetch(url.toString());
    const xmlText = await response.text();

    // Basic XML parsing (would need proper XML parser in production)
    if (xmlText.includes('<Status>ERROR</Status>')) {
      throw new Error('Failed to fetch DNS records from Namecheap');
    }

    // This is a simplified parser - in production, use a proper XML parser
    const records = [];
    const hostRegex = /<host[^>]*HostId="(\d+)"[^>]*Name="([^"]*)"[^>]*Type="([^"]*)"[^>]*Address="([^"]*)"[^>]*TTL="([^"]*)"[^>]*\/>/g;
    
    let match;
    while ((match = hostRegex.exec(xmlText)) !== null) {
      records.push({
        type: match[3],
        name: match[2] === '@' ? '@' : match[2],
        content: match[4],
        ttl: parseInt(match[5]) || 1800,
        id: match[1]
      });
    }

    return {
      success: true,
      records
    };

  } catch (error) {
    throw new Error(`Namecheap API error: ${error.message}`);
  }
}

/**
 * Get DNS records from GoDaddy
 */
async function getGoDaddyRecords(domain, credentials) {
  try {
    const response = await fetch(`https://api.godaddy.com/v1/domains/${domain}/records`, {
      method: 'GET',
      headers: {
        'Authorization': `sso-key ${credentials.apiKey}:${credentials.apiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const records = await response.json();

    // Convert to our standard format
    const formattedRecords = records.map(record => ({
      type: record.type,
      name: record.name === '@' ? '@' : record.name,
      content: record.data,
      ttl: record.ttl || 3600,
      priority: record.priority
    }));

    return {
      success: true,
      records: formattedRecords
    };

  } catch (error) {
    throw new Error(`GoDaddy API error: ${error.message}`);
  }
}

/**
 * Get DNS records from DigitalOcean
 */
async function getDigitalOceanRecords(domain, credentials) {
  try {
    const response = await fetch(`https://api.digitalocean.com/v2/domains/${domain}/records`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert to our standard format
    const records = data.domain_records.map(record => ({
      type: record.type,
      name: record.name === '@' ? '@' : record.name,
      content: record.data,
      ttl: record.ttl || 3600,
      priority: record.priority,
      id: record.id
    }));

    return {
      success: true,
      records
    };

  } catch (error) {
    throw new Error(`DigitalOcean API error: ${error.message}`);
  }
}

/**
 * Get DNS records from Route 53 (placeholder)
 */
async function getRoute53Records(domain, credentials) {
  // Note: Would need AWS SDK for proper Route 53 implementation
  throw new Error('Route 53 DNS record fetching requires AWS SDK implementation');
}
