/**
 * Update DNS records via various registrar APIs
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

    console.log(`🔄 Updating ${records.length} DNS records for ${domain} via ${credentials.registrarCode}...`);

    // Update DNS records based on registrar type
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
        recordsFailed: records ? records.length : 0,
        errors: [error.message],
        details: []
      })
    };
  }
};

/**
 * Update DNS records for different registrars
 */
async function updateDNSRecordsByRegistrar(domain, records, credentials) {
  const { registrarCode } = credentials;

  try {
    switch (registrarCode) {
      case 'cloudflare':
        return await updateCloudflareRecords(domain, records, credentials);
      
      case 'namecheap':
        return await updateNamecheapRecords(domain, records, credentials);
      
      case 'godaddy':
        return await updateGoDaddyRecords(domain, records, credentials);
      
      case 'digitalocean':
        return await updateDigitalOceanRecords(domain, records, credentials);
      
      case 'route53':
        return await updateRoute53Records(domain, records, credentials);
      
      default:
        return {
          success: false,
          recordsUpdated: 0,
          recordsCreated: 0,
          recordsFailed: records.length,
          errors: [`DNS record updates not implemented for ${registrarCode}`],
          details: records.map(record => ({
            record,
            action: 'failed',
            error: `Registrar ${registrarCode} not supported`
          }))
        };
    }
  } catch (error) {
    console.error(`Error updating ${registrarCode} DNS records:`, error);
    return {
      success: false,
      recordsUpdated: 0,
      recordsCreated: 0,
      recordsFailed: records.length,
      errors: [`Failed to update ${registrarCode} DNS records: ${error.message}`],
      details: records.map(record => ({
        record,
        action: 'failed',
        error: error.message
      }))
    };
  }
}

/**
 * Update DNS records in Cloudflare
 */
async function updateCloudflareRecords(domain, records, credentials) {
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

    // Get existing records
    const existingResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const existingData = await existingResponse.json();
    if (!existingData.success) {
      throw new Error('Failed to fetch existing DNS records');
    }

    const existingRecords = existingData.result;
    
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors = [];
    const details = [];

    // Process each record
    for (const record of records) {
      try {
        const recordName = record.name === '@' ? domain : `${record.name}.${domain}`;
        
        // Find existing record with same type and name
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
              ttl: record.ttl || 3600,
              priority: record.priority
            })
          });

          const updateData = await updateResponse.json();
          
          if (updateData.success) {
            recordsUpdated++;
            details.push({
              record,
              action: 'updated',
              recordId: existing.id
            });
          } else {
            recordsFailed++;
            const error = updateData.errors?.[0]?.message || 'Update failed';
            errors.push(`Failed to update ${record.type} record: ${error}`);
            details.push({
              record,
              action: 'failed',
              error
            });
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
              ttl: record.ttl || 3600,
              priority: record.priority
            })
          });

          const createData = await createResponse.json();
          
          if (createData.success) {
            recordsCreated++;
            details.push({
              record,
              action: 'created',
              recordId: createData.result.id
            });
          } else {
            recordsFailed++;
            const error = createData.errors?.[0]?.message || 'Creation failed';
            errors.push(`Failed to create ${record.type} record: ${error}`);
            details.push({
              record,
              action: 'failed',
              error
            });
          }
        }
      } catch (error) {
        recordsFailed++;
        errors.push(`Failed to process ${record.type} record: ${error.message}`);
        details.push({
          record,
          action: 'failed',
          error: error.message
        });
      }
    }

    return {
      success: recordsFailed === 0,
      recordsUpdated,
      recordsCreated,
      recordsFailed,
      errors,
      details
    };

  } catch (error) {
    throw new Error(`Cloudflare DNS update error: ${error.message}`);
  }
}

/**
 * Update DNS records in GoDaddy
 */
async function updateGoDaddyRecords(domain, records, credentials) {
  try {
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors = [];
    const details = [];

    // GoDaddy requires updating records by type
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
          recordsUpdated += typeRecords.length;
          typeRecords.forEach(record => {
            details.push({
              record: { type, name: record.name, content: record.data },
              action: 'updated'
            });
          });
        } else {
          recordsFailed += typeRecords.length;
          const error = `HTTP ${response.status}: ${response.statusText}`;
          errors.push(`Failed to update ${type} records: ${error}`);
          typeRecords.forEach(record => {
            details.push({
              record: { type, name: record.name, content: record.data },
              action: 'failed',
              error
            });
          });
        }
      } catch (error) {
        recordsFailed += typeRecords.length;
        errors.push(`Failed to update ${type} records: ${error.message}`);
        typeRecords.forEach(record => {
          details.push({
            record: { type, name: record.name, content: record.data },
            action: 'failed',
            error: error.message
          });
        });
      }
    }

    return {
      success: recordsFailed === 0,
      recordsUpdated,
      recordsCreated: 0, // GoDaddy replaces all records of a type
      recordsFailed,
      errors,
      details
    };

  } catch (error) {
    throw new Error(`GoDaddy DNS update error: ${error.message}`);
  }
}

/**
 * Update DNS records in DigitalOcean
 */
async function updateDigitalOceanRecords(domain, records, credentials) {
  try {
    // Get existing records first
    const existingResponse = await fetch(`https://api.digitalocean.com/v2/domains/${domain}/records`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!existingResponse.ok) {
      throw new Error(`Failed to fetch existing records: HTTP ${existingResponse.status}`);
    }

    const existingData = await existingResponse.json();
    const existingRecords = existingData.domain_records;
    
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors = [];
    const details = [];

    // Process each record
    for (const record of records) {
      try {
        // Find existing record with same type and name
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
              ttl: record.ttl || 3600,
              priority: record.priority
            })
          });

          if (updateResponse.ok) {
            recordsUpdated++;
            details.push({
              record,
              action: 'updated',
              recordId: existing.id
            });
          } else {
            recordsFailed++;
            const error = `HTTP ${updateResponse.status}: ${updateResponse.statusText}`;
            errors.push(`Failed to update ${record.type} record: ${error}`);
            details.push({
              record,
              action: 'failed',
              error
            });
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
              ttl: record.ttl || 3600,
              priority: record.priority
            })
          });

          if (createResponse.ok) {
            recordsCreated++;
            const createData = await createResponse.json();
            details.push({
              record,
              action: 'created',
              recordId: createData.domain_record.id
            });
          } else {
            recordsFailed++;
            const error = `HTTP ${createResponse.status}: ${createResponse.statusText}`;
            errors.push(`Failed to create ${record.type} record: ${error}`);
            details.push({
              record,
              action: 'failed',
              error
            });
          }
        }
      } catch (error) {
        recordsFailed++;
        errors.push(`Failed to process ${record.type} record: ${error.message}`);
        details.push({
          record,
          action: 'failed',
          error: error.message
        });
      }
    }

    return {
      success: recordsFailed === 0,
      recordsUpdated,
      recordsCreated,
      recordsFailed,
      errors,
      details
    };

  } catch (error) {
    throw new Error(`DigitalOcean DNS update error: ${error.message}`);
  }
}

/**
 * Update DNS records in Namecheap (simplified)
 */
async function updateNamecheapRecords(domain, records, credentials) {
  // Note: Namecheap API is more complex and requires replacing all records at once
  // This is a simplified implementation
  throw new Error('Namecheap DNS record updates require complex XML API calls. Please use manual setup.');
}

/**
 * Update DNS records in Route 53 (placeholder)
 */
async function updateRoute53Records(domain, records, credentials) {
  // Note: Would need AWS SDK for proper Route 53 implementation
  throw new Error('Route 53 DNS record updates require AWS SDK implementation');
}
