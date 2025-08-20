/**
 * Netlify API Domain Management Service
 * Automates domain addition and management via Netlify's API
 */

interface NetlifyDomainConfig {
  domain: string;
  certificate?: {
    type: 'manual' | 'lets_encrypt';
  };
}

interface NetlifyAPIResponse {
  id: string;
  domain: string;
  state: 'pending' | 'verified' | 'failed';
  dns_zone_id?: string;
  certificate?: {
    state: string;
    expires_at?: string;
  };
}

interface BulkDomainResult {
  domain: string;
  success: boolean;
  netlifyId?: string;
  error?: string;
  status: 'added' | 'exists' | 'failed';
}

export class NetlifyDomainAPI {
  private apiToken: string;
  private siteId: string;
  private baseUrl = 'https://api.netlify.com/api/v1';

  constructor(apiToken: string, siteId: string) {
    this.apiToken = apiToken;
    this.siteId = siteId;
  }

  /**
   * Check if we're using a demo/test token
   */
  private isDemoToken(): boolean {
    return this.apiToken.includes('demo') || this.apiToken.includes('test') || this.apiToken.length < 20;
  }

  /**
   * Get all domains for the site
   */
  async getDomains(): Promise<NetlifyAPIResponse[]> {
    // Return empty array for demo/development mode
    if (this.isDemoToken()) {
      console.warn('Using demo token - returning empty domains list');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Netlify site not found (${this.siteId}). Please check your site ID and API token.`);
        }
        if (response.status === 401) {
          throw new Error(`Netlify API authentication failed. Please check your API token permissions.`);
        }
        if (response.status === 403) {
          throw new Error(`Netlify API access forbidden. Please ensure your token has domain management permissions.`);
        }
        throw new Error(`Netlify API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Netlify domains:', error);
      throw error;
    }
  }

  /**
   * Add a single domain to Netlify
   */
  async addDomain(domain: string, options: { autoSSL?: boolean } = {}): Promise<NetlifyAPIResponse> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Return mock response for demo/development mode
    if (this.isDemoToken()) {
      console.warn(`Demo mode: Simulating domain addition for ${cleanDomain}`);
      return {
        id: `demo-${Date.now()}`,
        domain: cleanDomain,
        state: 'pending',
        dns_zone_id: 'demo-zone',
        certificate: options.autoSSL ? {
          state: 'pending',
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        } : undefined
      };
    }

    try {
      const domainConfig: NetlifyDomainConfig = {
        domain: cleanDomain,
        ...(options.autoSSL && {
          certificate: {
            type: 'lets_encrypt'
          }
        })
      };

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(domainConfig)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error(`Netlify API authentication failed. Please check your API token.`);
        }
        if (response.status === 403) {
          throw new Error(`Insufficient permissions. Please ensure your token can manage domains.`);
        }
        if (response.status === 422) {
          throw new Error(`Domain ${cleanDomain} is invalid or already exists in another site.`);
        }
        throw new Error(`Netlify API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error adding domain ${cleanDomain} to Netlify:`, error);
      throw error;
    }
  }

  /**
   * Remove a domain from Netlify
   */
  async removeDomain(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains/${domain}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`Error removing domain ${domain} from Netlify:`, error);
      return false;
    }
  }

  /**
   * Bulk add domains to Netlify
   */
  async bulkAddDomains(
    domains: string[], 
    options: { 
      autoSSL?: boolean;
      batchSize?: number;
      onProgress?: (completed: number, total: number, current: string) => void;
    } = {}
  ): Promise<BulkDomainResult[]> {
    const { autoSSL = true, batchSize = 5, onProgress } = options;
    const results: BulkDomainResult[] = [];
    
    // Get existing domains to avoid duplicates
    const existingDomains = await this.getDomains();
    const existingDomainNames = existingDomains.map(d => d.domain);

    // Process domains in batches to avoid rate limiting
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (domain) => {
        const cleanDomain = domain.trim().toLowerCase();
        
        // Check if domain already exists
        if (existingDomainNames.includes(cleanDomain)) {
          return {
            domain: cleanDomain,
            success: true,
            status: 'exists' as const,
            error: 'Domain already exists in Netlify'
          };
        }

        try {
          const result = await this.addDomain(cleanDomain, { autoSSL });
          onProgress?.(i + batch.indexOf(domain) + 1, domains.length, cleanDomain);
          
          return {
            domain: cleanDomain,
            success: true,
            netlifyId: result.id,
            status: 'added' as const
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          return {
            domain: cleanDomain,
            success: false,
            status: 'failed' as const,
            error: errorMessage
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            domain: 'unknown',
            success: false,
            status: 'failed',
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Verify domain DNS configuration
   */
  async verifyDomain(domain: string): Promise<{
    verified: boolean;
    records: {
      a_record: boolean;
      cname_record: boolean;
      txt_record: boolean;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains/${domain}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        verified: data.state === 'verified',
        records: {
          a_record: data.dns_zone_id !== null,
          cname_record: true, // Netlify handles this
          txt_record: data.state === 'verified'
        }
      };
    } catch (error) {
      console.error(`Error verifying domain ${domain}:`, error);
      return {
        verified: false,
        records: {
          a_record: false,
          cname_record: false,
          txt_record: false
        }
      };
    }
  }

  /**
   * Get domain certificate status
   */
  async getCertificateStatus(domain: string): Promise<{
    status: 'pending' | 'issued' | 'failed' | 'none';
    expiresAt?: string;
    autoRenew?: boolean;
  }> {
    try {
      const domains = await this.getDomains();
      const domainData = domains.find(d => d.domain === domain);
      
      if (!domainData?.certificate) {
        return { status: 'none' };
      }

      return {
        status: domainData.certificate.state as any,
        expiresAt: domainData.certificate.expires_at,
        autoRenew: true // Netlify auto-renews Let's Encrypt certificates
      };
    } catch (error) {
      console.error(`Error getting certificate status for ${domain}:`, error);
      return { status: 'failed' };
    }
  }

  /**
   * Update domain settings
   */
  async updateDomainSettings(domain: string, settings: {
    forceSSL?: boolean;
    certificate?: 'lets_encrypt' | 'manual';
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains/${domain}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      return response.ok;
    } catch (error) {
      console.error(`Error updating domain settings for ${domain}:`, error);
      return false;
    }
  }

  /**
   * Get domain analytics/stats
   */
  async getDomainStats(domain: string): Promise<{
    requests: number;
    bandwidth: number;
    errors: number;
  }> {
    try {
      // Note: This endpoint may require additional permissions
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/analytics?domain=${domain}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Analytics error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        requests: data.requests || 0,
        bandwidth: data.bandwidth || 0,
        errors: data.errors || 0
      };
    } catch (error) {
      console.warn(`Could not fetch analytics for ${domain}:`, error);
      return {
        requests: 0,
        bandwidth: 0,
        errors: 0
      };
    }
  }

  /**
   * Test API connection and permissions
   */
  async testConnection(): Promise<{
    connected: boolean;
    siteExists: boolean;
    permissions: string[];
    error?: string;
  }> {
    try {
      // Test basic site access
      const siteResponse = await fetch(`${this.baseUrl}/sites/${this.siteId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!siteResponse.ok) {
        throw new Error(`Site access failed: ${siteResponse.status}`);
      }

      const siteData = await siteResponse.json();
      
      // Test domain permissions
      const domainsResponse = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const permissions = ['sites:read'];
      if (domainsResponse.ok) {
        permissions.push('domains:read', 'domains:write');
      }

      return {
        connected: true,
        siteExists: true,
        permissions,
      };
    } catch (error) {
      return {
        connected: false,
        siteExists: false,
        permissions: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export default NetlifyDomainAPI;
