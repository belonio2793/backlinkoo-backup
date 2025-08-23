/**
 * Mock Netlify Domain Service for Development
 * Simulates the add-domain-to-netlify function when running locally
 */

export interface NetlifyDomainResponse {
  success: boolean;
  domain?: string;
  error?: string;
  details?: {
    status?: number;
    statusText?: string;
    specificError?: string;
    originalError?: string;
    rawResponse?: string;
    siteId?: string;
    operation?: string;
    timestamp?: string;
  };
  netlifyData?: {
    alias_name?: string;
    site_id?: string;
    primary_domain_preserved?: boolean;
    alias_created?: boolean;
  };
  dnsInstructions?: {
    title?: string;
    type?: string;
    steps?: string[];
    dnsRecords?: Array<{
      type: string;
      name: string;
      value: string;
      ttl?: number;
      required?: boolean;
      description?: string;
    }>;
  };
  message?: string;
}

export class NetlifyDomainMock {
  private static existingAliases: string[] = ['www.backlinkoo.com'];
  
  /**
   * Mock the add-domain-to-netlify function
   */
  static async addDomainToNetlify(domain: string, domainId?: string): Promise<NetlifyDomainResponse> {
    console.log(`🧪 [MOCK] Adding domain ${domain} to Netlify...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Clean domain
    const cleanDomain = domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(cleanDomain)) {
      return {
        success: false,
        error: `Invalid domain format: ${cleanDomain}`,
        details: {
          status: 400,
          specificError: 'Domain format validation failed',
          operation: 'domain_validation'
        }
      };
    }
    
    // Check if domain already exists as alias
    if (this.existingAliases.includes(cleanDomain)) {
      return {
        success: false,
        error: `Domain ${cleanDomain} is already configured as an alias for this Netlify site`,
        details: {
          status: 422,
          specificError: 'Domain already exists as alias',
          operation: 'duplicate_check'
        }
      };
    }
    
    // Simulate different scenarios based on domain
    if (cleanDomain.includes('error')) {
      return {
        success: false,
        error: 'Simulated network error for testing',
        details: {
          status: 500,
          specificError: 'Mock error for domains containing "error"',
          operation: 'domain_aliases_update'
        }
      };
    }
    
    if (cleanDomain.includes('timeout')) {
      await new Promise(resolve => setTimeout(resolve, 8000)); // Long delay
      return {
        success: false,
        error: 'Request timeout',
        details: {
          status: 408,
          specificError: 'Mock timeout for domains containing "timeout"',
          operation: 'domain_aliases_update'
        }
      };
    }
    
    // Success scenario
    this.existingAliases.push(cleanDomain);
    
    return {
      success: true,
      domain: cleanDomain,
      netlifyData: {
        alias_name: cleanDomain,
        site_id: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
        primary_domain_preserved: true,
        alias_created: true
      },
      dnsInstructions: {
        title: 'DNS Configuration Required',
        type: 'root',
        steps: [
          `Root domain ${cleanDomain} has been added to your Netlify site`,
          'Configure your DNS with the following A records',
          'Add CNAME record for www subdomain',
          'Wait for DNS propagation (can take up to 48 hours)',
          'Netlify will automatically provision an SSL certificate once DNS is verified'
        ],
        dnsRecords: [
          {
            type: 'A',
            name: '@',
            value: '75.2.60.5',
            ttl: 3600,
            required: true,
            description: 'Primary Netlify load balancer'
          },
          {
            type: 'A',
            name: '@',
            value: '99.83.190.102',
            ttl: 3600,
            required: true,
            description: 'Secondary Netlify load balancer'
          },
          {
            type: 'CNAME',
            name: 'www',
            value: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809.netlify.app',
            ttl: 3600,
            required: true,
            description: 'Points www to Netlify'
          }
        ]
      },
      message: `Domain ${cleanDomain} successfully added as alias to Netlify site. Primary domain (backlinkoo.com) preserved. Please configure DNS records for the new alias.`
    };
  }
  
  /**
   * Get current aliases (for diagnostic purposes)
   */
  static getCurrentAliases(): string[] {
    return [...this.existingAliases];
  }
  
  /**
   * Reset aliases (for testing)
   */
  static resetAliases(): void {
    this.existingAliases = ['www.backlinkoo.com'];
  }
}

/**
 * Smart function caller that uses mock in development or real function in production
 */
export async function callNetlifyDomainFunction(domain: string, domainId?: string): Promise<NetlifyDomainResponse> {
  // Check if we're in development and functions aren't available
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // Try real function first
    try {
      const response = await fetch('/.netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, domainId })
      });
      
      if (response.status === 404) {
        console.log('🔄 Netlify functions not available, using mock...');
        return NetlifyDomainMock.addDomainToNetlify(domain, domainId);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.log('🔄 Network error, falling back to mock:', error);
      return NetlifyDomainMock.addDomainToNetlify(domain, domainId);
    }
  } else {
    // Production - always try real function
    const response = await fetch('/.netlify/functions/add-domain-to-netlify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, domainId })
    });
    
    return response.json();
  }
}

export default NetlifyDomainMock;
