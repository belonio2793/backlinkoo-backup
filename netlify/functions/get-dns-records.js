/**
 * Get current DNS records from registrar APIs
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

    console.log(`📋 Getting DNS records for ${domain} from ${credentials.registrarCode}`);

    // Get records based on registrar
    const records = await getDNSRecordsByRegistrar(domain, credentials);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        records: records
      })
    };

  } catch (error) {
    console.error('Get DNS records error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to get DNS records',
        details: error.message
      })
    };
  }
};

/**
 * Get DNS records for specific registrar
 */
async function getDNSRecordsByRegistrar(domain, credentials) {
  switch (credentials.registrarCode) {
    case 'cloudflare':
      return await getCloudflareRecords(domain, credentials);
    
    case 'namecheap':
      return await getNamecheapRecords(domain, credentials);
    
    case 'godaddy':
      return await getGoDaddyRecords(domain, credentials);
    
    case 'digitalocean':
      return await getDigitalOceanRecords(domain, credentials);
    
    default:
      throw new Error(`Getting records for ${credentials.registrarCode} not implemented yet`);
  }
}

/**
 * Get DNS records from Cloudflare
 */
async function getCloudflareRecords(domain, credentials) {
  try {
    // First, get the zone ID for the domain
    let zoneId = credentials.zone;
    
    if (!zoneId) {
      const zonesResponse = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const zonesData = await zonesResponse.json();
      
      if (!zonesData.success || zonesData.result.length === 0) {
        throw new Error('Domain not found in Cloudflare account');
      }
      
      zoneId = zonesData.result[0].id;
    }

    // Get DNS records for the zone
    const recordsResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const recordsData = await recordsResponse.json();

    if (!recordsData.success) {
      throw new Error(recordsData.errors?.[0]?.message || 'Failed to get Cloudflare records');
    }

    // Convert Cloudflare format to our standard format
    return recordsData.result.map(record => ({
      id: record.id,
      type: record.type,
      name: record.name === domain ? '@' : record.name.replace(`.${domain}`, ''),
      content: record.content,
      ttl: record.ttl,
      priority: record.priority
    }));

  } catch (error) {
    throw new Error(`Cloudflare API error: ${error.message}`);
  }
}

/**
 * Get DNS records from Namecheap
 */
async function getNamecheapRecords(domain, credentials) {
  try {
    // Namecheap uses XML API
    const url = new URL('https://api.namecheap.com/xml.response');
    url.searchParams.set('ApiUser', credentials.userId);
    url.searchParams.set('ApiKey', credentials.apiKey);
    url.searchParams.set('UserName', credentials.userId);
    url.searchParams.set('Command', 'namecheap.domains.dns.getHosts');
    url.searchParams.set('ClientIp', '127.0.0.1');
    url.searchParams.set('SLD', domain.split('.')[0]);
    url.searchParams.set('TLD', domain.split('.').slice(1).join('.'));

    const response = await fetch(url.toString());
    const text = await response.text();

    if (!text.includes('Status="OK"')) {
      throw new Error('Failed to get Namecheap DNS records');
    }

    // Parse XML response (basic parsing)
    const records = [];
    const hostRegex = /<host[^>]*HostId="(\d+)"[^>]*Name="([^"]*)"[^>]*Type="([^"]*)"[^>]*Address="([^"]*)"[^>]*TTL="([^"]*)"[^>]*>/g;
    
    let match;
    while ((match = hostRegex.exec(text)) !== null) {
      records.push({
        id: match[1],
        type: match[3],
        name: match[2] === '@' ? '@' : match[2],
        content: match[4],
        ttl: parseInt(match[5])
      });
    }

    return records;

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
      headers: {
        'Authorization': `sso-key ${credentials.apiKey}:${credentials.apiSecret}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const records = await response.json();

    // Convert GoDaddy format to our standard format
    return records.map(record => ({
      type: record.type,
      name: record.name,
      content: record.data,
      ttl: record.ttl,
      priority: record.priority
    }));

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
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert DigitalOcean format to our standard format
    return data.domain_records.map(record => ({
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.data,
      ttl: record.ttl,
      priority: record.priority
    }));

  } catch (error) {
    throw new Error(`DigitalOcean API error: ${error.message}`);
  }
}
