import type { Context, Config } from "@netlify/functions";

interface DomainRequest {
  domains: string[];
  siteId?: string;
  enableSSL?: boolean;
  forceSSL?: boolean;
}

interface NetlifyDomainResponse {
  domain: string;
  success: boolean;
  ssl_enabled?: boolean;
  error?: string;
  dns_zone?: any;
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { domains, siteId, enableSSL = true, forceSSL = true }: DomainRequest = await req.json();

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Domains array is required and cannot be empty' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use provided siteId or default to the main site
    const targetSiteId = siteId || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
    const netlifyToken = Netlify.env.get('NETLIFY_ACCESS_TOKEN');

    if (!netlifyToken) {
      return new Response(JSON.stringify({ 
        error: 'Netlify access token not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results: NetlifyDomainResponse[] = [];

    // Process domains sequentially to avoid rate limits
    for (const domain of domains) {
      try {
        console.log(`🌐 Adding domain: ${domain}`);
        
        // Add custom domain to Netlify site
        const domainResult = await addDomainToSite(domain, targetSiteId, netlifyToken);
        
        if (domainResult.success && enableSSL) {
          console.log(`🔒 Enabling SSL for: ${domain}`);
          
          // Enable SSL certificate for the domain
          const sslResult = await enableSSLForDomain(domain, targetSiteId, netlifyToken, forceSSL);
          domainResult.ssl_enabled = sslResult.success;
          
          if (!sslResult.success) {
            domainResult.error = `Domain added but SSL failed: ${sslResult.error}`;
            domainResult.success = false;
          }
        }

        results.push(domainResult);
        
        // Add small delay between requests to be respectful to API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing domain ${domain}:`, error);
        results.push({
          domain,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return new Response(JSON.stringify({
      message: `Processed ${domains.length} domains`,
      summary: {
        total: domains.length,
        successful: successCount,
        failed: failureCount
      },
      results,
      site_id: targetSiteId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Domain management error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function addDomainToSite(domain: string, siteId: string, token: string): Promise<NetlifyDomainResponse> {
  try {
    // First, add the domain to the site
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_domain: domain
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const siteData = await response.json();
    
    // Create DNS zone for the domain if needed
    await createDNSZone(domain, siteId, token);

    return {
      domain,
      success: true,
      dns_zone: siteData.dns_zone_id
    };

  } catch (error) {
    return {
      domain,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function enableSSLForDomain(domain: string, siteId: string, token: string, forceSSL: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    // Enable SSL certificate provisioning
    const sslResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/ssl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        certificate: null, // Let Netlify provision automatically
        key: null,
        csr: null
      })
    });

    if (!sslResponse.ok) {
      const errorData = await sslResponse.text();
      console.log(`SSL provisioning response for ${domain}:`, errorData);
      
      // Sometimes SSL is already enabled or will be auto-provisioned
      if (sslResponse.status === 422 || errorData.includes('already exists')) {
        return { success: true };
      }
      
      throw new Error(`SSL provisioning failed: HTTP ${sslResponse.status}: ${errorData}`);
    }

    // If forceSSL is enabled, redirect HTTP to HTTPS
    if (forceSSL) {
      await enableHTTPSRedirect(siteId, token);
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SSL error'
    };
  }
}

async function createDNSZone(domain: string, siteId: string, token: string): Promise<void> {
  try {
    const dnsResponse = await fetch(`https://api.netlify.com/api/v1/dns_zones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domain,
        site_id: siteId
      })
    });

    if (!dnsResponse.ok && dnsResponse.status !== 422) {
      // 422 usually means DNS zone already exists
      const errorData = await dnsResponse.text();
      console.log(`DNS zone creation warning for ${domain}:`, errorData);
    }
    
  } catch (error) {
    console.log(`DNS zone creation non-critical error for ${domain}:`, error);
    // Don't throw - DNS zone creation is optional
  }
}

async function enableHTTPSRedirect(siteId: string, token: string): Promise<void> {
  try {
    await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        force_ssl: true
      })
    });
  } catch (error) {
    console.log('HTTPS redirect setup non-critical error:', error);
    // Don't throw - this is optional
  }
}

export const config: Config = {
  path: "/domains/add"
};
