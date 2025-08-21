import type { Context, Config } from "@netlify/functions";

interface ValidationRequest {
  domain: string;
  domainId: string;
}

interface ValidationResponse {
  success: boolean;
  netlifyVerified: boolean;
  dnsVerified: boolean;
  error?: string;
}

export default async (req: Request, context: Context): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { domain, domainId }: ValidationRequest = await req.json();

    if (!domain || !domainId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Domain and domainId are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get Netlify access token from environment
    const netlifyToken = Netlify.env.get('VITE_NETLIFY_ACCESS_TOKEN') || Netlify.env.get('NETLIFY_ACCESS_TOKEN');
    const siteId = Netlify.env.get('VITE_NETLIFY_SITE_ID') || Netlify.env.get('NETLIFY_SITE_ID');

    if (!netlifyToken) {
      return new Response(JSON.stringify({
        success: false,
        netlifyVerified: false,
        dnsVerified: false,
        error: 'Netlify access token not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Validating domain: ${domain}`);

    let netlifyVerified = false;
    let dnsVerified = false;
    let errorMessage = '';

    // Step 1: Check if domain exists in Netlify account
    try {
      console.log('Checking Netlify domains...');
      
      const netlifyResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (netlifyResponse.ok) {
        const domains = await netlifyResponse.json();
        netlifyVerified = domains.some((d: any) => 
          d.name === domain || d.name === `www.${domain}` || d.name.replace('www.', '') === domain
        );
        console.log(`Netlify verification: ${netlifyVerified}`);
      } else {
        console.error('Netlify API error:', netlifyResponse.status, netlifyResponse.statusText);
        errorMessage += `Netlify API error: ${netlifyResponse.statusText}. `;
      }
    } catch (error) {
      console.error('Error checking Netlify:', error);
      errorMessage += `Netlify check failed: ${error instanceof Error ? error.message : 'Unknown error'}. `;
    }

    // Step 2: Perform DNS validation
    try {
      console.log('Performing DNS validation...');
      
      // Check A records
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        
        // Check if DNS points to expected IPs (common Netlify/CDN IPs)
        const expectedIPs = ['75.2.60.5', '99.83.190.102', '185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
        
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          dnsVerified = dnsData.Answer.some((answer: any) => 
            expectedIPs.includes(answer.data) || answer.data.includes('netlify')
          );
        }
        
        console.log(`DNS verification: ${dnsVerified}`);
      } else {
        console.error('DNS lookup failed:', dnsResponse.status);
        errorMessage += `DNS lookup failed: ${dnsResponse.statusText}. `;
      }
    } catch (error) {
      console.error('Error checking DNS:', error);
      errorMessage += `DNS check failed: ${error instanceof Error ? error.message : 'Unknown error'}. `;
    }

    // If domain is not in Netlify, try to add it automatically
    if (!netlifyVerified && siteId) {
      try {
        console.log(`Attempting to add ${domain} to Netlify site...`);
        
        const addDomainResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/domains`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: domain })
        });

        if (addDomainResponse.ok) {
          const domainData = await addDomainResponse.json();
          netlifyVerified = true;
          console.log(`Successfully added ${domain} to Netlify:`, domainData);
        } else {
          const errorData = await addDomainResponse.text();
          console.error('Failed to add domain to Netlify:', addDomainResponse.status, errorData);
          errorMessage += `Failed to add to Netlify: ${errorData}. `;
        }
      } catch (error) {
        console.error('Error adding domain to Netlify:', error);
        errorMessage += `Failed to add to Netlify: ${error instanceof Error ? error.message : 'Unknown error'}. `;
      }
    }

    // Determine overall success
    const success = netlifyVerified || dnsVerified;

    const result: ValidationResponse = {
      success,
      netlifyVerified,
      dnsVerified,
      error: success ? undefined : (errorMessage || 'Domain validation failed')
    };

    console.log('Validation result:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Domain validation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      netlifyVerified: false,
      dnsVerified: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config: Config = {
  path: "/api/validate-domain"
};
