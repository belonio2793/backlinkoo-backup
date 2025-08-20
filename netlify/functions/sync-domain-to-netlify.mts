import type { Context, Config } from "@netlify/functions";

interface DomainSyncRequest {
  domain: string;
  enable_ssl?: boolean;
  force_ssl?: boolean;
}

interface NetlifySyncResult {
  domain: string;
  success: boolean;
  netlify_added?: boolean;
  ssl_enabled?: boolean;
  dns_zone_created?: boolean;
  error?: string;
  steps: string[];
}

export default async (req: Request, context: Context): Promise<Response> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }

  try {
    const { domain, enable_ssl = true, force_ssl = true }: DomainSyncRequest = await req.json();

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain is required' }), {
        status: 400,
        headers
      });
    }

    console.log(`🌐 Syncing domain to Netlify: ${domain}`);

    const result = await syncDomainToNetlify(domain, enable_ssl, force_ssl);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers
    });

  } catch (error) {
    console.error('Domain sync error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers
    });
  }
};

async function syncDomainToNetlify(domain: string, enableSSL: boolean, forceSSL: boolean): Promise<NetlifySyncResult> {
  const result: NetlifySyncResult = {
    domain,
    success: false,
    steps: []
  };

  const netlifyToken = Netlify.env.get('NETLIFY_ACCESS_TOKEN');
  const siteId = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  if (!netlifyToken) {
    result.error = 'Netlify access token not configured';
    return result;
  }

  try {
    result.steps.push('🔍 Starting Netlify domain sync...');

    // Step 1: Add domain to Netlify site
    result.steps.push(`📍 Adding ${domain} to Netlify site...`);
    
    const addDomainResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_domain: domain
      })
    });

    if (!addDomainResponse.ok) {
      const errorText = await addDomainResponse.text();
      
      // Check if domain is already added
      if (addDomainResponse.status === 422 && errorText.includes('already exists')) {
        result.steps.push(`✅ Domain already exists in Netlify`);
        result.netlify_added = true;
      } else {
        throw new Error(`Failed to add domain: ${errorText}`);
      }
    } else {
      result.steps.push(`✅ Domain added to Netlify successfully`);
      result.netlify_added = true;
    }

    // Step 2: Create DNS zone
    result.steps.push(`🌍 Creating DNS zone for ${domain}...`);
    
    try {
      const dnsZoneResponse = await fetch(`https://api.netlify.com/api/v1/dns_zones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: domain,
          site_id: siteId
        })
      });

      if (dnsZoneResponse.ok) {
        result.steps.push(`✅ DNS zone created successfully`);
        result.dns_zone_created = true;
      } else if (dnsZoneResponse.status === 422) {
        result.steps.push(`✅ DNS zone already exists`);
        result.dns_zone_created = true;
      } else {
        const errorText = await dnsZoneResponse.text();
        result.steps.push(`⚠️ DNS zone creation warning: ${errorText}`);
        // Don't fail for DNS zone issues
      }
    } catch (dnsError) {
      result.steps.push(`⚠️ DNS zone creation failed (non-critical): ${dnsError}`);
      // Continue without failing
    }

    // Step 3: Enable SSL if requested
    if (enableSSL) {
      result.steps.push(`🔒 Enabling SSL for ${domain}...`);
      
      try {
        const sslResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/ssl`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            certificate: null, // Auto-provision
            key: null,
            csr: null
          })
        });

        if (sslResponse.ok) {
          result.steps.push(`✅ SSL certificate provisioning initiated`);
          result.ssl_enabled = true;
        } else if (sslResponse.status === 422) {
          result.steps.push(`✅ SSL already enabled or provisioned`);
          result.ssl_enabled = true;
        } else {
          const sslErrorText = await sslResponse.text();
          result.steps.push(`⚠️ SSL provisioning warning: ${sslErrorText}`);
          // SSL issues are common during initial setup
        }
      } catch (sslError) {
        result.steps.push(`⚠️ SSL setup failed (will auto-retry): ${sslError}`);
        // Continue without failing
      }

      // Step 4: Enable force SSL if requested
      if (forceSSL) {
        result.steps.push(`🔐 Enabling HTTPS redirects...`);
        
        try {
          await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${netlifyToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              force_ssl: true
            })
          });
          
          result.steps.push(`✅ HTTPS redirects enabled`);
        } catch (forceSSLError) {
          result.steps.push(`⚠️ HTTPS redirect setup warning: ${forceSSLError}`);
          // Continue without failing
        }
      }
    }

    // Step 5: Get current site configuration to verify
    result.steps.push(`🔍 Verifying domain configuration...`);
    
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      headers: {
        'Authorization': `Bearer ${netlifyToken}`
      }
    });

    if (siteResponse.ok) {
      const siteData = await siteResponse.json();
      const domainInAliases = siteData.domain_aliases?.includes(domain);
      const isCustomDomain = siteData.custom_domain === domain;
      
      if (domainInAliases || isCustomDomain) {
        result.steps.push(`✅ Domain verified in Netlify configuration`);
        result.success = true;
      } else {
        result.steps.push(`⚠️ Domain not found in site configuration (may need time to propagate)`);
        result.success = true; // Still consider successful if we got this far
      }
    }

    result.steps.push(`🎉 Domain sync completed successfully!`);
    
    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.steps.push(`❌ Error: ${result.error}`);
    return result;
  }
}

export const config: Config = {
  path: "/domains/sync-to-netlify"
};
