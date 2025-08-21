/**
 * Netlify PBN Service
 * Manages domains for Private Blog Network via Netlify API
 */

export interface NetlifyDomain {
  id: string;
  name: string;
  state: 'pending' | 'verified' | 'unverified' | 'live';
  ssl?: {
    state: string;
    certificate?: any;
  };
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

export interface NetlifyDomainResult {
  success: boolean;
  domain?: NetlifyDomain;
  dnsRecords?: DNSRecord[];
  error?: string;
}

export class NetlifyPBNService {
  private apiToken: string;
  private siteId: string;
  private baseUrl = 'https://api.netlify.com/api/v1';

  constructor() {
    this.apiToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN || '';
    this.siteId = import.meta.env.VITE_NETLIFY_SITE_ID || process.env.NETLIFY_SITE_ID || '';
    
    if (!this.apiToken) {
      console.warn('⚠️ Netlify access token not configured');
    }
    if (!this.siteId) {
      console.warn('⚠️ Netlify site ID not configured');
    }
  }

  /**
   * Check if Netlify is properly configured
   */
  isConfigured(): boolean {
    return !!(this.apiToken && this.siteId);
  }

  /**
   * Add domain to Netlify for PBN hosting
   */
  async addDomainToPBN(domain: string): Promise<NetlifyDomainResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Netlify not configured. Please set NETLIFY_ACCESS_TOKEN and NETLIFY_SITE_ID'
      };
    }

    try {
      console.log(`🌐 Adding domain ${domain} to Netlify PBN...`);

      // Add domain to site
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Netlify API error: ${response.status} ${errorText}`);
      }

      const netlifyDomain = await response.json();

      // Get DNS records for this domain
      const dnsRecords = this.generateDNSRecords(domain);

      console.log(`✅ Domain ${domain} added to Netlify PBN successfully`);

      return {
        success: true,
        domain: netlifyDomain,
        dnsRecords
      };

    } catch (error) {
      console.error('❌ Failed to add domain to Netlify:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate DNS records for domain configuration
   */
  private generateDNSRecords(domain: string): DNSRecord[] {
    return [
      {
        type: 'A',
        name: '@',
        value: '75.2.60.5', // Netlify's load balancer IP
        ttl: 300
      },
      {
        type: 'CNAME',
        name: 'www',
        value: domain,
        ttl: 300
      },
      {
        type: 'TXT',
        name: '@',
        value: `netlify-verification=${this.generateVerificationToken()}`,
        ttl: 300
      }
    ];
  }

  /**
   * Verify domain configuration
   */
  async verifyDomain(domain: string): Promise<NetlifyDomainResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Netlify not configured'
      };
    }

    try {
      console.log(`🔍 Verifying domain ${domain}...`);

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains/${domain}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Domain verification failed: ${response.status}`);
      }

      const domainInfo = await response.json();

      console.log(`✅ Domain ${domain} verification completed`);

      return {
        success: true,
        domain: domainInfo
      };

    } catch (error) {
      console.error('❌ Domain verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get all domains for the site
   */
  async getAllDomains(): Promise<NetlifyDomain[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch domains: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Failed to fetch domains:', error);
      return [];
    }
  }

  /**
   * Remove domain from Netlify
   */
  async removeDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Netlify not configured'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains/${domain}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove domain: ${response.status}`);
      }

      console.log(`✅ Domain ${domain} removed from Netlify`);

      return { success: true };

    } catch (error) {
      console.error('❌ Failed to remove domain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get DNS instructions for domain
   */
  getDNSInstructions(domain: string): DNSRecord[] {
    return this.generateDNSRecords(domain);
  }

  /**
   * Check if domain is ready for PBN publishing
   */
  async isDomainReadyForPBN(domain: string): Promise<boolean> {
    try {
      const result = await this.verifyDomain(domain);
      return result.success && result.domain?.state === 'verified';
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const netlifyPBNService = new NetlifyPBNService();
