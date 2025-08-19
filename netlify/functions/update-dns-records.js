/**
 * Update DNS records via registrar APIs
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
    const { domain, records, credentials } = JSON.parse(event.body || '{}');
    
    if (!domain || !records || !credentials) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Domain, records, and credentials are required'
        })
      };
    }

    console.log(`🔄 Updating ${records.length} DNS records for ${domain}`);

    // Update records based on registrar
    const result = await updateDNSRecordsByRegistrar(domain, records, credentials);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Update DNS records error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        recordsUpdated: 0,
        recordsCreated: 0,
        recordsFailed: records?.length || 0,
        errors: [error.message],
        details: []
      })
    };
  }
};

/**
 * Update DNS records for specific registrar
 */
async function updateDNSRecordsByRegistrar(domain, records, credentials) {
  switch (credentials.registrarCode) {
    case 'cloudflare':
      return await updateCloudflareRecords(domain, records, credentials);
    
    case 'namecheap':
      return await updateNamecheapRecords(domain, records, credentials);
    
    case 'godaddy':
      return await updateGoDaddyRecords(domain, records, credentials);
    
    case 'digitalocean':
      return await updateDigitalOceanRecords(domain, records, credentials);
    
    default:
      throw new Error(`Updating records for ${credentials.registrarCode} not implemented yet`);
  }
}

/**
 * Update DNS records in Cloudflare
 */
async function updateCloudflareRecords(domain, records, credentials) {
  const result = {
    success: false,
    recordsUpdated: 0,
    recordsCreated: 0,
    recordsFailed: 0,
    errors: [],
    details: []
  };

  try {
    // Get zone ID
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

    // Get existing records
    const existingResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const existingData = await existingResponse.json();
    const existingRecords = existingData.success ? existingData.result : [];

    // Process each record
    for (const record of records) {
      try {
        const recordName = record.name === '@' ? domain : `${record.name}.${domain}`;
        
        // Find existing record
        const existing = existingRecords.find(r => 
          r.type === record.type && r.name === recordName
        );

        if (existing) {
          // Update existing record
          const updateResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: record.type,
              name: recordName,
              content: record.content,
              ttl: record.ttl || 3600
            })
          });

          const updateData = await updateResponse.json();
          
          if (updateData.success) {
            result.recordsUpdated++;
            result.details.push({
              record,
              action: 'updated'
            });
          } else {
            throw new Error(updateData.errors?.[0]?.message || 'Update failed');
          }
        } else {
          // Create new record
          const createResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: record.type,
              name: recordName,
              content: record.content,
              ttl: record.ttl || 3600
            })
          });

          const createData = await createResponse.json();
          
          if (createData.success) {
            result.recordsCreated++;
            result.details.push({
              record,
              action: 'created'
            });
          } else {
            throw new Error(createData.errors?.[0]?.message || 'Creation failed');
          }
        }
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`${record.type} ${record.name}: ${error.message}`);
        result.details.push({
          record,
          action: 'failed',
          error: error.message
        });
      }
    }

    result.success = result.recordsFailed === 0;
    return result;

  } catch (error) {
    result.recordsFailed = records.length;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Update DNS records in GoDaddy
 */
async function updateGoDaddyRecords(domain, records, credentials) {
  const result = {
    success: false,
    recordsUpdated: 0,
    recordsCreated: 0,
    recordsFailed: 0,
    errors: [],
    details: []
  };

  try {
    // GoDaddy replaces all records of a given type
    // Group records by type
    const recordsByType = {};
    
    for (const record of records) {
      if (!recordsByType[record.type]) {
        recordsByType[record.type] = [];
      }
      
      recordsByType[record.type].push({
        name: record.name,
        data: record.content,
        ttl: record.ttl || 3600,
        priority: record.priority
      });
    }

    // Update each record type
    for (const [type, typeRecords] of Object.entries(recordsByType)) {
      try {
        const response = await fetch(`https://api.godaddy.com/v1/domains/${domain}/records/${type}`, {
          method: 'PUT',
          headers: {
            'Authorization': `sso-key ${credentials.apiKey}:${credentials.apiSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(typeRecords)
        });

        if (response.ok) {
          result.recordsUpdated += typeRecords.length;
          typeRecords.forEach(record => {
            result.details.push({
              record: { type, name: record.name, content: record.data },
              action: 'updated'
            });
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        result.recordsFailed += typeRecords.length;
        result.errors.push(`${type} records: ${error.message}`);
        typeRecords.forEach(record => {
          result.details.push({
            record: { type, name: record.name, content: record.data },
            action: 'failed',
            error: error.message
          });
        });
      }
    }

    result.success = result.recordsFailed === 0;
    return result;

  } catch (error) {
    result.recordsFailed = records.length;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Update DNS records in DigitalOcean
 */
async function updateDigitalOceanRecords(domain, records, credentials) {
  const result = {
    success: false,
    recordsUpdated: 0,
    recordsCreated: 0,
    recordsFailed: 0,
    errors: [],
    details: []
  };

  try {
    // Get existing records
    const existingResponse = await fetch(`https://api.digitalocean.com/v2/domains/${domain}/records`, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!existingResponse.ok) {
      throw new Error(`Failed to get existing records: HTTP ${existingResponse.status}`);
    }

    const existingData = await existingResponse.json();
    const existingRecords = existingData.domain_records || [];

    // Process each record
    for (const record of records) {
      try {
        // Find existing record
        const existing = existingRecords.find(r => 
          r.type === record.type && r.name === record.name
        );

        if (existing) {
          // Update existing record
          const updateResponse = await fetch(`https://api.digitalocean.com/v2/domains/${domain}/records/${existing.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: record.type,
              name: record.name,
              data: record.content,
              ttl: record.ttl || 3600
            })
          });

          if (updateResponse.ok) {
            result.recordsUpdated++;
            result.details.push({
              record,
              action: 'updated'
            });
          } else {
            throw new Error(`HTTP ${updateResponse.status}: ${updateResponse.statusText}`);
          }
        } else {
          // Create new record
          const createResponse = await fetch(`https://api.digitalocean.com/v2/domains/${domain}/records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: record.type,
              name: record.name,
              data: record.content,
              ttl: record.ttl || 3600
            })
          });

          if (createResponse.ok) {
            result.recordsCreated++;
            result.details.push({
              record,
              action: 'created'
            });
          } else {
            throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText}`);
          }
        }
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`${record.type} ${record.name}: ${error.message}`);
        result.details.push({
          record,
          action: 'failed',
          error: error.message
        });
      }
    }

    result.success = result.recordsFailed === 0;
    return result;

  } catch (error) {
    result.recordsFailed = records.length;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Update DNS records in Namecheap (simplified approach)
 */
async function updateNamecheapRecords(domain, records, credentials) {
  // Namecheap API is more complex and requires careful handling
  // For now, return a "not implemented" response
  return {
    success: false,
    recordsUpdated: 0,
    recordsCreated: 0,
    recordsFailed: records.length,
    errors: ['Namecheap automatic updates require additional implementation'],
    details: records.map(record => ({
      record,
      action: 'failed',
      error: 'Namecheap automatic updates not yet implemented'
    }))
  };
}
