/**
 * Secure server-side Netlify Domain Management Service
 * Uses Netlify functions to securely manage domains with NETLIFY_ACCESS_TOKEN
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

export class NetlifyDomainServerService {
  private baseUrl = '/.netlify/functions/netlify-domain-manager';

  /**
   * Add a domain to the Netlify site (server-side)
   */
  async addDomain(domain: string): Promise<{
    success: boolean;
    data?: NetlifyDomainResponse;
    status?: NetlifyDomainStatus;
    error?: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addDomain',
          domain: domain
        }),
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('❌ Error adding domain via server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Get domain status from Netlify (server-side)
   */
  async getDomainStatus(domain: string): Promise<{
    success: boolean;
    status?: NetlifyDomainStatus;
    error?: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDomainStatus',
          domain: domain
        }),
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('❌ Error getting domain status via server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * List all domains for the site (server-side)
   */
  async listDomains(): Promise<{
    success: boolean;
    domains?: NetlifyDomainStatus[];
    error?: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'listDomains'
        }),
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('❌ Error listing domains via server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Remove a domain from the Netlify site (server-side)
   */
  async removeDomain(domain: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeDomain',
          domain: domain
        }),
      });

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('❌ Error removing domain via server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'listDomains'
        }),
      });

      // If we get any response (even an error), the service is available
      return response.ok || response.status < 500;

    } catch (error) {
      console.error('❌ Server-side Netlify service not available:', error);
      return false;
    }
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

export default NetlifyDomainServerService;
