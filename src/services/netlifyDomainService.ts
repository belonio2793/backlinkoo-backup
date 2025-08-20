/**
 * Netlify Domain Service
 * Handles direct communication with Netlify API for domain management
 */

export interface NetlifyDomain {
  id: string;
  name: string;
  state: 'pending' | 'verified' | 'unverified' | 'provisioning' | 'live';
  dns_zone_name?: string;
  account_name?: string;
  account_slug?: string;
  dns_zone_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NetlifyDNSRecord {
  id: string;
  hostname: string;
  type: string;
  value: string;
  ttl?: number;
  priority?: number;
  port?: number;
  weight?: number;
  flag?: number;
  tag?: string;
}

export interface NetlifyDomainConfig {
  domain: string;
  subdomain?: string;
  siteId?: string;
  customCname?: string;
  sslEnabled?: boolean;
}

export class NetlifyDomainService {
  private apiToken: string;
  private siteId: string;
  private baseUrl = 'https://api.netlify.com/api/v1';

  constructor() {
    this.apiToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN || '';
    this.siteId = import.meta.env.VITE_NETLIFY_SITE_ID || '';
    
    if (!this.apiToken) {
      console.warn('⚠️ Netlify access token not configured');
    }
    if (!this.siteId) {
      console.warn('⚠️ Netlify site ID not configured');
    }
  }

  /**
   * Check if Netlify API is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiToken && this.siteId);
  }

  /**
   * Test Netlify API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      if (!this.isConfigured()) {
        return { 
          success: false, 
          error: 'Netlify API not configured. Missing access token or site ID.' 
        };
      }

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        return { 
          success: false, 
          error: `Netlify API error: ${response.status} - ${error}` 
        };
      }

      const data = await response.json();
      return { 
        success: true, 
        data: {
          siteName: data.name,
          siteUrl: data.url,
          customDomain: data.custom_domain,
          state: data.state
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a custom domain to Netlify site
   */
  async addDomain(domain: string): Promise<{ success: boolean; error?: string; data?: NetlifyDomain }> {
    try {
      if (!this.isConfigured()) {
        return { 
          success: false, 
          error: 'Netlify API not configured' 
        };
      }

      console.log(`🌐 Adding domain ${domain} to Netlify site...`);

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: domain })
      });

      if (!response.ok) {
        const error = await response.text();
        let errorMessage = `Failed to add domain: ${response.status}`;
        
        try {
          const errorData = JSON.parse(error);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = error || errorMessage;
        }

        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      console.log(`✅ Domain ${domain} added to Netlify successfully`);
      
      return { success: true, data };
    } catch (error: any) {
      console.error(`❌ Failed to add domain ${domain}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a domain from Netlify site
   */
  async removeDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Netlify API not configured' };
      }

      console.log(`🗑️ Removing domain ${domain} from Netlify...`);

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains/${domain}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Failed to remove domain: ${error}` };
      }

      console.log(`✅ Domain ${domain} removed from Netlify`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all domains for the site
   */
  async getDomains(): Promise<{ success: boolean; error?: string; data?: NetlifyDomain[] }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Netlify API not configured' };
      }

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Failed to get domains: ${error}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify domain configuration
   */
  async verifyDomain(domain: string): Promise<{ success: boolean; error?: string; data?: NetlifyDomain }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Netlify API not configured' };
      }

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains/${domain}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Domain not found: ${error}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Set up DNS records for a domain (if using Netlify DNS)
   */
  async setupDNS(domain: string, records: Partial<NetlifyDNSRecord>[]): Promise<{ success: boolean; error?: string; data?: NetlifyDNSRecord[] }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Netlify API not configured' };
      }

      // First get the DNS zone for the domain
      const domainResult = await this.verifyDomain(domain);
      if (!domainResult.success || !domainResult.data?.dns_zone_id) {
        return { success: false, error: 'Domain not found or DNS zone not configured' };
      }

      const dnsZoneId = domainResult.data.dns_zone_id;
      const createdRecords: NetlifyDNSRecord[] = [];

      for (const record of records) {
        const response = await fetch(`${this.baseUrl}/dns_zones/${dnsZoneId}/dns_records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(record)
        });

        if (response.ok) {
          const data = await response.json();
          createdRecords.push(data);
        }
      }

      return { success: true, data: createdRecords };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable SSL for a domain
   */
  async enableSSL(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Netlify API not configured' };
      }

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/ssl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          type: 'lets_encrypt',
          domains: [domain]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Failed to enable SSL: ${error}` };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get DNS instructions for manual setup
   */
  getDNSInstructions(domain: string): {
    aRecord: string;
    cnameRecord?: string;
    txtRecord?: string;
  } {
    // Netlify's standard DNS settings
    return {
      aRecord: '75.2.60.5', // Netlify's load balancer IP
      cnameRecord: `${this.siteId}.netlify.app`,
      txtRecord: `netlify-domain-verification=${domain}`
    };
  }

  /**
   * Deploy site to trigger any changes
   */
  async triggerDeploy(): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Netlify API not configured' };
      }

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Failed to trigger deploy: ${error}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const netlifyDomainService = new NetlifyDomainService();
