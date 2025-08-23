/**
 * Netlify API Service
 * 
 * Official Netlify API integration for domain management and validation
 * Based on Netlify API documentation: https://docs.netlify.com/api/get-started/
 */

export interface NetlifyApiResponse<T = any> {
  success: boolean;
  action?: string;
  data?: T;
  error?: string;
  domain?: string;
  validation?: DomainValidation;
  message?: string;
}

export interface DomainValidation {
  domain_exists_in_netlify: boolean;
  is_custom_domain: boolean;
  is_domain_alias: boolean;
  dns_records_found: boolean;
  ssl_configured: boolean;
  validation_status: 'valid' | 'not_configured' | 'pending' | 'error';
}

export interface SiteInfo {
  id: string;
  name: string;
  url: string;
  ssl_url?: string;
  custom_domain?: string;
  domain_aliases: string[];
  state: string;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  id: string;
  hostname: string;
  type: string;
  value: string;
  ttl: number;
  priority?: number;
  dns_zone_id: string;
  site_id: string;
  managed: boolean;
}

export interface SSLStatus {
  state: string;
  domains: string[];
  expires_at?: string;
  created_at?: string;
}

export class NetlifyApiService {
  private static baseUrl = '/.netlify/functions/netlify-domain-validation';
  private static fallbackUrl = '/.netlify/functions/add-domain-to-netlify';

  /**
   * Test if the main function is available
   */
  private static async testFunctionAvailability(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSiteInfo' })
      });

      return response.status !== 404;
    } catch (error) {
      console.warn('Function availability test failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive site information
   */
  static async getSiteInfo(): Promise<NetlifyApiResponse<SiteInfo>> {
    try {
      // Test function availability first
      const isAvailable = await this.testFunctionAvailability();

      if (!isAvailable) {
        console.warn('⚠️ Main function not available, using fallback data');
        return {
          success: false,
          error: 'Netlify domain validation function not deployed. Please deploy the function first.'
        };
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSiteInfo' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Get site info failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get site info'
      };
    }
  }

  /**
   * Get DNS configuration for the site
   */
  static async getDNSInfo(): Promise<NetlifyApiResponse<{ dns_records: DNSRecord[]; record_count: number; record_types: string[] }>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getDNSInfo' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Get DNS info failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get DNS info'
      };
    }
  }

  /**
   * Get SSL certificate status
   */
  static async getSSLStatus(): Promise<NetlifyApiResponse<SSLStatus>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSSLStatus' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Get SSL status failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get SSL status'
      };
    }
  }

  /**
   * Validate a specific domain
   */
  static async validateDomain(domain: string): Promise<NetlifyApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'validateDomain',
          domain: domain
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Validate domain failed for ${domain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate domain',
        domain: domain
      };
    }
  }

  /**
   * Add domain as alias to Netlify site
   */
  static async addDomainAlias(domain: string): Promise<NetlifyApiResponse> {
    try {
      // First try the main function
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addDomainAlias',
          domain: domain
        })
      });

      if (response.ok) {
        return await response.json();
      }

      // If 404, try the fallback function
      if (response.status === 404) {
        console.warn(`⚠️ Main function not available (404), trying fallback for ${domain}`);
        return await this.addDomainAliasFallback(domain);
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error(`❌ Add domain alias failed for ${domain}:`, error);

      // If it's a network error, try fallback
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn(`⚠️ Network error, trying fallback for ${domain}`);
        return await this.addDomainAliasFallback(domain);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add domain alias',
        domain: domain
      };
    }
  }

  /**
   * Fallback method using existing add-domain-to-netlify function
   */
  private static async addDomainAliasFallback(domain: string): Promise<NetlifyApiResponse> {
    try {
      console.log(`🔄 Using fallback method for ${domain}`);

      const response = await fetch(this.fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain,
          domainId: `fallback-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Fallback failed: HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Convert fallback response format to expected format
      if (result.success) {
        return {
          success: true,
          action: 'addDomainAlias',
          message: result.message || `Successfully added ${domain} via fallback method`,
          domain: domain
        };
      } else {
        return {
          success: false,
          error: result.error || 'Fallback method failed',
          domain: domain
        };
      }
    } catch (error) {
      console.error(`❌ Fallback method failed for ${domain}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fallback method failed',
        domain: domain
      };
    }
  }

  /**
   * List all domain aliases for the site
   */
  static async listDomainAliases(): Promise<NetlifyApiResponse<{ 
    site_name: string; 
    custom_domain?: string; 
    domain_aliases: string[]; 
    ssl_url?: string; 
    total_domains: number; 
  }>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'listDomainAliases' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ List domain aliases failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list domain aliases'
      };
    }
  }

  /**
   * Get comprehensive domain report
   */
  static async getFullDomainReport(domain?: string): Promise<NetlifyApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getFullDomainReport',
          domain: domain
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Full domain report failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get domain report'
      };
    }
  }

  /**
   * Test Netlify API connectivity
   */
  static async testConnection(): Promise<NetlifyApiResponse> {
    try {
      console.log('🧪 Testing Netlify API connectivity...');
      
      const siteInfo = await this.getSiteInfo();
      
      if (siteInfo.success) {
        console.log('✅ Netlify API connection successful');
        return {
          success: true,
          message: 'Netlify API connection successful',
          data: {
            site_name: siteInfo.data?.name,
            domain_count: siteInfo.data?.domain_aliases?.length || 0,
            has_custom_domain: !!siteInfo.data?.custom_domain,
            ssl_enabled: !!siteInfo.data?.ssl_url
          }
        };
      } else {
        console.error('❌ Netlify API connection failed:', siteInfo.error);
        return {
          success: false,
          error: `Connection test failed: ${siteInfo.error}`
        };
      }
    } catch (error) {
      console.error('❌ Netlify API test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Check if domain exists in Netlify site (quick check)
   */
  static async quickDomainCheck(domain: string): Promise<{
    exists: boolean;
    isCustomDomain: boolean;
    isAlias: boolean;
    error?: string;
  }> {
    try {
      const siteInfo = await this.getSiteInfo();
      
      if (!siteInfo.success || !siteInfo.data) {
        return {
          exists: false,
          isCustomDomain: false,
          isAlias: false,
          error: siteInfo.error || 'Failed to get site info'
        };
      }

      const { custom_domain, domain_aliases } = siteInfo.data;
      const isCustomDomain = custom_domain === domain;
      const isAlias = domain_aliases.includes(domain);

      return {
        exists: isCustomDomain || isAlias,
        isCustomDomain,
        isAlias
      };
    } catch (error) {
      return {
        exists: false,
        isCustomDomain: false,
        isAlias: false,
        error: error instanceof Error ? error.message : 'Quick check failed'
      };
    }
  }
}

export default NetlifyApiService;
