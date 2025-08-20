/**
 * Netlify Domain Management Service
 * Handles adding external domains to Netlify site for SSL/TLS and hosting
 */

interface NetlifyDomainResponse {
  id: string;
  domain: string;
  site_id: string;
  verified: boolean;
  created_at: string;
}

interface NetlifyDomainStatus {
  domain: string;
  verified: boolean;
  dns_check: string;
  ssl: {
    status: string;
    certificate?: any;
  };
  id: string;
  site_id: string;
}

export class NetlifyDomainService {
  private token: string;
  private siteId: string;
  private baseUrl = 'https://api.netlify.com/api/v1';

  constructor(token?: string, siteId?: string) {
    // Try multiple environment variable sources
    this.token = token ||
                 import.meta.env.VITE_NETLIFY_ACCESS_TOKEN ||
                 import.meta.env.VITE_NETLIFY_TOKEN ||
                 import.meta.env.NETLIFY_ACCESS_TOKEN ||
                 '';
    this.siteId = siteId || import.meta.env.VITE_NETLIFY_SITE_ID || '';

    if (!this.token) {
      console.warn('⚠️ NETLIFY_ACCESS_TOKEN or VITE_NETLIFY_TOKEN not set - Netlify domain operations will be simulated');
    }
    if (!this.siteId) {
      throw new Error('VITE_NETLIFY_SITE_ID is required for Netlify domain operations');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.token && this.siteId);
  }

  /**
   * Add a domain to the Netlify site
   */
  async addDomain(domain: string): Promise<{
    success: boolean;
    data?: NetlifyDomainResponse;
    status?: NetlifyDomainStatus;
    error?: string;
  }> {
    try {
      // Validate domain format
      if (!this.isValidDomain(domain)) {
        return {
          success: false,
          error: 'Invalid domain format'
        };
      }

      // Demo mode simulation
      if (!this.token || this.token.includes('demo') || this.token.length < 20) {
        console.log(`🔧 Demo mode: Simulating domain addition for ${domain}`);
        
        const mockResponse: NetlifyDomainResponse = {
          id: `demo-domain-${Date.now()}`,
          domain,
          site_id: this.siteId,
          verified: false,
          created_at: new Date().toISOString()
        };

        const mockStatus: NetlifyDomainStatus = {
          domain,
          verified: false,
          dns_check: 'pending',
          ssl: { status: 'pending_dns_verification' },
          id: mockResponse.id,
          site_id: this.siteId
        };

        return {
          success: true,
          data: mockResponse,
          status: mockStatus
        };
      }

      // Add domain to the site
      const addResponse = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.text();
        return {
          success: false,
          error: `Failed to add domain: ${addResponse.status} ${addResponse.statusText}. ${errorData}`
        };
      }

      const addedDomain: NetlifyDomainResponse = await addResponse.json();
      console.log('✅ Domain added to Netlify:', addedDomain);

      // Fetch domain status
      const statusResponse = await fetch(
        `${this.baseUrl}/sites/${this.siteId}/domains/${domain}`,
        {
          headers: { 'Authorization': `Bearer ${this.token}` },
        }
      );

      let status: NetlifyDomainStatus | undefined;
      if (statusResponse.ok) {
        status = await statusResponse.json();
        console.log('📡 Domain status:', status);
      }

      return {
        success: true,
        data: addedDomain,
        status
      };

    } catch (error) {
      console.error('❌ Error adding domain to Netlify:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get domain status from Netlify
   */
  async getDomainStatus(domain: string): Promise<{
    success: boolean;
    status?: NetlifyDomainStatus;
    error?: string;
  }> {
    try {
      // Demo mode simulation
      if (!this.token || this.token.includes('demo') || this.token.length < 20) {
        return {
          success: true,
          status: {
            domain,
            verified: Math.random() > 0.5,
            dns_check: Math.random() > 0.5 ? 'verified' : 'pending',
            ssl: { status: Math.random() > 0.5 ? 'verified' : 'pending_dns_verification' },
            id: `demo-${domain}`,
            site_id: this.siteId
          }
        };
      }

      const response = await fetch(
        `${this.baseUrl}/sites/${this.siteId}/domains/${domain}`,
        {
          headers: { 'Authorization': `Bearer ${this.token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: `Domain not found in Netlify site. Use "Add to Netlify" to add it first.`
          };
        }
        return {
          success: false,
          error: `Failed to get domain status: ${response.status} ${response.statusText}`
        };
      }

      const status: NetlifyDomainStatus = await response.json();
      return {
        success: true,
        status
      };

    } catch (error) {
      console.error('❌ Error getting domain status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * List all domains for the site
   */
  async listDomains(): Promise<{
    success: boolean;
    domains?: NetlifyDomainStatus[];
    error?: string;
  }> {
    try {
      // Demo mode simulation
      if (!this.token || this.token.includes('demo') || this.token.length < 20) {
        return {
          success: true,
          domains: [
            {
              domain: 'example.com',
              verified: true,
              dns_check: 'verified',
              ssl: { status: 'verified' },
              id: 'demo-1',
              site_id: this.siteId
            },
            {
              domain: 'demo.com',
              verified: false,
              dns_check: 'pending',
              ssl: { status: 'pending_dns_verification' },
              id: 'demo-2',
              site_id: this.siteId
            }
          ]
        };
      }

      const response = await fetch(
        `${this.baseUrl}/sites/${this.siteId}/domains`,
        {
          headers: { 'Authorization': `Bearer ${this.token}` },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to list domains: ${response.status} ${response.statusText}`
        };
      }

      const domains: NetlifyDomainStatus[] = await response.json();
      return {
        success: true,
        domains
      };

    } catch (error) {
      console.error('❌ Error listing domains:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if a domain exists in Netlify site
   */
  async domainExists(domain: string): Promise<{
    exists: boolean;
    error?: string;
  }> {
    try {
      // Demo mode simulation
      if (!this.token || this.token.includes('demo') || this.token.length < 20) {
        return { exists: Math.random() > 0.5 };
      }

      const response = await fetch(
        `${this.baseUrl}/sites/${this.siteId}/domains/${domain}`,
        {
          headers: { 'Authorization': `Bearer ${this.token}` },
        }
      );

      return { exists: response.ok };

    } catch (error) {
      console.error('❌ Error checking domain existence:', error);
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Remove a domain from the Netlify site
   */
  async removeDomain(domain: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Demo mode simulation
      if (!this.token || this.token.includes('demo') || this.token.length < 20) {
        console.log(`🔧 Demo mode: Simulating domain removal for ${domain}`);
        return { success: true };
      }

      const response = await fetch(
        `${this.baseUrl}/sites/${this.siteId}/domains/${domain}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.token}` },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to remove domain: ${response.status} ${response.statusText}`
        };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Error removing domain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  }

  /**
   * Get setup instructions for a domain
   */
  getSetupInstructions(domain: string, status?: NetlifyDomainStatus): {
    title: string;
    instructions: string[];
    nextSteps: string[];
  } {
    if (!status) {
      return {
        title: 'Initial Setup Required',
        instructions: [
          `Domain ${domain} has been added to Netlify`,
          'DNS verification is pending',
          'SSL certificate will be provisioned after DNS verification'
        ],
        nextSteps: [
          'Update your domain\'s nameservers to point to Netlify',
          'Or add A/CNAME records as specified by Netlify',
          'Wait for DNS propagation (can take up to 48 hours)'
        ]
      };
    }

    if (!status.verified) {
      return {
        title: 'DNS Verification Required',
        instructions: [
          `Domain ${domain} is waiting for DNS verification`,
          `DNS Check Status: ${status.dns_check}`,
          `SSL Status: ${status.ssl.status}`
        ],
        nextSteps: [
          'Ensure your domain\'s DNS is properly configured',
          'Check that A records point to Netlify\'s load balancer',
          'Verify CNAME records are set correctly'
        ]
      };
    }

    return {
      title: 'Domain Ready',
      instructions: [
        `Domain ${domain} is verified and ready`,
        `DNS Check: ${status.dns_check}`,
        `SSL: ${status.ssl.status}`
      ],
      nextSteps: [
        'Your domain is now ready to serve traffic',
        'SSL certificate is active',
        'You can now use this domain for your site'
      ]
    };
  }
}

export default NetlifyDomainService;
