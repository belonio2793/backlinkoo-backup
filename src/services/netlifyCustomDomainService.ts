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
   * Uses server-side health check to verify configuration
   */
  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/.netlify/functions/netlify-custom-domain?health=check');
      if (!response.ok) return false;

      const result = await response.json();
      return result.success && result.environment?.hasToken;
    } catch {
      return false;
    }
  }

  /**
   * Legacy synchronous check (for backward compatibility)
   */
  isConfiguredSync(): boolean {
    // Basic client-side check - not as reliable as server-side
    return Boolean(this.token && this.siteId);
  }

  /**
   * Add a custom domain to the Netlify site using the official API
   * Uses server-side function for security
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

      console.log(`🚀 Adding custom domain ${domain} via server-side function...`);

      // Use server-side Netlify function for security
      const payload = { domain };
      if (txtRecordValue) {
        payload.txt_record_value = txtRecordValue;
      }

      const response = await fetch('/.netlify/functions/netlify-custom-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = `${response.status} ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.error) {
            errorMessage = errorJson.error;
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

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Unknown error occurred'
        };
      }

      console.log('✅ Custom domain added via server function:', result.data);

      return {
        success: true,
        data: result.data,
        instructions: result.instructions
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
      console.log('🔍 Getting site info via server-side function...');

      const response = await fetch('/.netlify/functions/netlify-custom-domain', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get site info: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Unknown error occurred'
        };
      }

      return {
        success: true,
        data: result.data
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
      console.log('🗑️ Removing custom domain via server-side function...');

      const response = await fetch('/.netlify/functions/netlify-custom-domain', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to remove custom domain: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Unknown error occurred'
        };
      }

      return {
        success: true,
        data: result.data
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
        title: 'Setup Required',
        steps: [
          `Domain ${domain} could not be added`,
          'Please ensure NETLIFY_ACCESS_TOKEN is properly configured',
          'DNS configuration will be provided after successful addition'
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
