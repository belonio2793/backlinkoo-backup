/**
 * Netlify Custom Domain Management Service
 * Updated to use the official custom_domain API approach
 * Based on: https://developers.netlify.com/guides/adding-your-domain-using-netlify-api/
 */

interface NetlifySiteUpdateResponse {
  id: string;
  name: string;
  custom_domain: string;
  url: string;
  admin_url: string;
  ssl_url?: string;
  created_at: string;
  updated_at: string;
}

interface NetlifyDomainVerificationRequest {
  custom_domain: string;
  txt_record_value?: string;
}

export class NetlifyCustomDomainService {
  private token: string;
  private siteId: string;
  private baseUrl = 'https://api.netlify.com/api/v1';

  constructor(token?: string, siteId?: string) {
    // Try multiple token sources: provided, environment variables, localStorage
    this.token = token ||
                 import.meta.env.VITE_NETLIFY_ACCESS_TOKEN ||
                 import.meta.env.VITE_NETLIFY_TOKEN ||
                 import.meta.env.NETLIFY_ACCESS_TOKEN ||
                 (typeof window !== 'undefined' ? localStorage.getItem('netlify_token_temp') : null) ||
                 '';
    this.siteId = siteId || import.meta.env.VITE_NETLIFY_SITE_ID || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

    if (!this.token) {
      console.warn('⚠️ NETLIFY_ACCESS_TOKEN not set - Netlify domain operations will be simulated');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.token && this.siteId);
  }

  /**
   * Add a custom domain to the Netlify site using the official API
   * Uses PATCH /sites/{site_id} with custom_domain field
   */
  async addCustomDomain(domain: string, txtRecordValue?: string): Promise<{
    success: boolean;
    data?: NetlifySiteUpdateResponse;
    error?: string;
    instructions?: {
      title: string;
      steps: string[];
      dnsRecords?: Array<{
        type: string;
        name: string;
        value: string;
        ttl: number;
      }>;
    };
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
        console.warn(`⚠️ DEMO MODE: Simulating custom domain addition for ${domain}`);
        
        const mockResponse: NetlifySiteUpdateResponse = {
          id: this.siteId,
          name: 'demo-site',
          custom_domain: domain,
          url: `https://${domain}`,
          admin_url: `https://app.netlify.com/sites/${this.siteId}`,
          ssl_url: `https://${domain}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        return {
          success: true,
          data: mockResponse,
          instructions: this.getSetupInstructions(domain, false)
        };
      }

      // Prepare the request payload
      const payload: NetlifyDomainVerificationRequest = {
        custom_domain: domain
      };

      // Add TXT record value if provided (for subdomain verification)
      if (txtRecordValue) {
        payload.txt_record_value = txtRecordValue;
      }

      console.log(`🚀 Adding custom domain ${domain} to Netlify site ${this.siteId}...`);

      // Make the PATCH request to update the site with custom domain
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = `${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch {
          // Use text error if JSON parsing fails
          if (errorData) {
            errorMessage = errorData;
          }
        }

        return {
          success: false,
          error: `Failed to add custom domain: ${errorMessage}`
        };
      }

      const updatedSite: NetlifySiteUpdateResponse = await response.json();
      console.log('✅ Custom domain added to Netlify:', updatedSite);

      return {
        success: true,
        data: updatedSite,
        instructions: this.getSetupInstructions(domain, true)
      };

    } catch (error) {
      console.error('❌ Error adding custom domain to Netlify:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get the current site information including custom domain
   */
  async getSiteInfo(): Promise<{
    success: boolean;
    data?: NetlifySiteUpdateResponse;
    error?: string;
  }> {
    try {
      // Demo mode simulation
      if (!this.token || this.token.includes('demo') || this.token.length < 20) {
        console.warn('⚠️ DEMO MODE: Cannot fetch real site info');
        return {
          success: true,
          data: {
            id: this.siteId,
            name: 'demo-site',
            custom_domain: '',
            url: 'https://demo-site.netlify.app',
            admin_url: `https://app.netlify.com/sites/${this.siteId}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
      }

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get site info: ${response.status} ${response.statusText}`
        };
      }

      const siteData: NetlifySiteUpdateResponse = await response.json();
      return {
        success: true,
        data: siteData
      };

    } catch (error) {
      console.error('❌ Error getting site info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Remove the custom domain from the site
   */
  async removeCustomDomain(): Promise<{
    success: boolean;
    data?: NetlifySiteUpdateResponse;
    error?: string;
  }> {
    try {
      // Demo mode simulation
      if (!this.token || this.token.includes('demo') || this.token.length < 20) {
        console.log('🔧 Demo mode: Simulating custom domain removal');
        return { success: true };
      }

      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ custom_domain: '' }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to remove custom domain: ${response.status} ${response.statusText}`
        };
      }

      const updatedSite: NetlifySiteUpdateResponse = await response.json();
      return {
        success: true,
        data: updatedSite
      };

    } catch (error) {
      console.error('❌ Error removing custom domain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if a domain needs TXT record verification (for subdomains)
   */
  private needsTxtVerification(domain: string): boolean {
    // Subdomains typically need TXT record verification
    const parts = domain.split('.');
    return parts.length > 2;
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
  private getSetupInstructions(domain: string, isAdded: boolean): {
    title: string;
    steps: string[];
    dnsRecords?: Array<{
      type: string;
      name: string;
      value: string;
      ttl: number;
    }>;
  } {
    const isSubdomain = this.needsTxtVerification(domain);
    
    if (!isAdded) {
      return {
        title: 'Demo Mode - Setup Instructions',
        steps: [
          `Would add custom domain: ${domain}`,
          'Real implementation requires valid NETLIFY_ACCESS_TOKEN',
          'DNS configuration would be provided after successful addition'
        ]
      };
    }

    if (isSubdomain) {
      return {
        title: 'Subdomain Setup Required',
        steps: [
          `Custom domain ${domain} has been added to your Netlify site`,
          'You need to verify ownership by adding a TXT record to your DNS',
          'Add the required TXT record to your DNS settings',
          'Wait for DNS propagation (usually 5-30 minutes)',
          'Netlify will automatically provision an SSL certificate once verified'
        ],
        dnsRecords: [
          {
            type: 'TXT',
            name: domain,
            value: 'netlify-verification-code-here',
            ttl: 300
          },
          {
            type: 'CNAME',
            name: domain.split('.')[0],
            value: `${this.siteId}.netlify.app`,
            ttl: 3600
          }
        ]
      };
    } else {
      return {
        title: 'Root Domain Setup Required',
        steps: [
          `Custom domain ${domain} has been added to your Netlify site`,
          'Configure your DNS with the following records:',
          'Add A records pointing to Netlify\'s load balancer',
          'Wait for DNS propagation (can take up to 48 hours)',
          'Netlify will automatically provision an SSL certificate once DNS is verified'
        ],
        dnsRecords: [
          {
            type: 'A',
            name: '@',
            value: '75.2.60.5',
            ttl: 3600
          },
          {
            type: 'CNAME',
            name: 'www',
            value: `${this.siteId}.netlify.app`,
            ttl: 3600
          }
        ]
      };
    }
  }

  /**
   * Generate TXT record value for subdomain verification
   * This would typically be provided by Netlify's API response
   */
  private generateTxtRecordValue(domain: string): string {
    // In a real implementation, this would come from Netlify's API
    // For now, return a placeholder
    return `netlify-verification=${domain}-${Date.now()}`;
  }
}

export default NetlifyCustomDomainService;
