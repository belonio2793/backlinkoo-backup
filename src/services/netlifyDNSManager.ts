/**
 * Enhanced Netlify DNS Management Service
 * Uses NETLIFY_ACCESS_TOKEN environment variable for DNS zone editing
 * Provides comprehensive domain and DNS record management
 */

import { NetlifyDomainAPI } from './netlifyDomainAPI';

interface DNSRecord {
  id?: string;
  type: 'A' | 'CNAME' | 'TXT' | 'MX' | 'AAAA';
  hostname: string;
  value: string;
  ttl?: number;
  priority?: number;
}

interface DNSZone {
  id: string;
  name: string;
  records: DNSRecord[];
}

interface AutoDNSConfig {
  aRecords: string[];
  cnameTarget: string;
  txtVerification: string;
  enableSSL: boolean;
}

export class NetlifyDNSManager extends NetlifyDomainAPI {
  private static instance: NetlifyDNSManager | null = null;

  constructor(apiToken?: string, siteId?: string) {
    // Use environment variable if available, fallback to provided token
    const token = apiToken || import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;
    const site = siteId || 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809'; // Default site ID

    if (!token) {
      throw new Error('NETLIFY_ACCESS_TOKEN environment variable is required for DNS management');
    }

    super(token, site);
  }

  /**
   * Get singleton instance with environment token
   */
  static getInstance(): NetlifyDNSManager {
    if (!NetlifyDNSManager.instance) {
      NetlifyDNSManager.instance = new NetlifyDNSManager();
    }
    return NetlifyDNSManager.instance;
  }

  /**
   * Check if environment token is available
   */
  static isConfigured(): boolean {
    const token = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    return Boolean(token);
  }

  /**
   * Get DNS zone for a domain
   */
  async getDNSZone(domain: string): Promise<DNSZone | null> {
    try {
      const response = await fetch(`${this.baseUrl}/dns_zones`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch DNS zones: ${response.status}`);
      }

      const zones = await response.json();
      const zone = zones.find((z: any) => z.name === domain || z.name === domain.replace(/^www\./, ''));
      
      if (!zone) {
        return null;
      }

      // Get DNS records for the zone
      const recordsResponse = await fetch(`${this.baseUrl}/dns_zones/${zone.id}/dns_records`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const records = recordsResponse.ok ? await recordsResponse.json() : [];

      return {
        id: zone.id,
        name: zone.name,
        records: records.map((r: any) => ({
          id: r.id,
          type: r.type,
          hostname: r.hostname,
          value: r.value,
          ttl: r.ttl,
          priority: r.priority
        }))
      };
    } catch (error) {
      console.error(`Error getting DNS zone for ${domain}:`, error);
      return null;
    }
  }

  /**
   * Create or update DNS records for a domain
   */
  async manageDNSRecords(domain: string, records: DNSRecord[]): Promise<{
    success: boolean;
    created: DNSRecord[];
    updated: DNSRecord[];
    errors: string[];
  }> {
    const result = {
      success: true,
      created: [] as DNSRecord[],
      updated: [] as DNSRecord[],
      errors: [] as string[]
    };

    try {
      // Get or create DNS zone
      let zone = await this.getDNSZone(domain);
      
      if (!zone) {
        // Create DNS zone if it doesn't exist
        const zoneResponse = await fetch(`${this.baseUrl}/dns_zones`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: domain,
            account_slug: 'main' // Use default account
          })
        });

        if (!zoneResponse.ok) {
          throw new Error(`Failed to create DNS zone: ${zoneResponse.status}`);
        }

        const newZone = await zoneResponse.json();
        zone = {
          id: newZone.id,
          name: newZone.name,
          records: []
        };
      }

      // Process each record
      for (const record of records) {
        try {
          // Check if record already exists
          const existingRecord = zone.records.find(r => 
            r.type === record.type && 
            r.hostname === record.hostname
          );

          if (existingRecord) {
            // Update existing record
            const updateResponse = await fetch(`${this.baseUrl}/dns_zones/${zone.id}/dns_records/${existingRecord.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: record.type,
                hostname: record.hostname,
                value: record.value,
                ttl: record.ttl || 3600,
                ...(record.priority && { priority: record.priority })
              })
            });

            if (updateResponse.ok) {
              result.updated.push(record);
            } else {
              result.errors.push(`Failed to update ${record.type} record for ${record.hostname}`);
            }
          } else {
            // Create new record
            const createResponse = await fetch(`${this.baseUrl}/dns_zones/${zone.id}/dns_records`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: record.type,
                hostname: record.hostname,
                value: record.value,
                ttl: record.ttl || 3600,
                ...(record.priority && { priority: record.priority })
              })
            });

            if (createResponse.ok) {
              result.created.push(record);
            } else {
              result.errors.push(`Failed to create ${record.type} record for ${record.hostname}`);
            }
          }
        } catch (error) {
          result.errors.push(`Error processing ${record.type} record: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`DNS management failed: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Automatically configure DNS for blog hosting
   */
  async autoConfigureBlogDNS(domain: string, config?: Partial<AutoDNSConfig>): Promise<{
    success: boolean;
    message: string;
    records: DNSRecord[];
    verificationToken?: string;
  }> {
    const defaultConfig: AutoDNSConfig = {
      aRecords: ['75.2.60.5', '99.83.190.102'], // Netlify IPs
      cnameTarget: 'builder-io-domains.netlify.app',
      txtVerification: this.generateVerificationToken(),
      enableSSL: true,
      ...config
    };

    const records: DNSRecord[] = [
      // A records for root domain
      ...defaultConfig.aRecords.map(ip => ({
        type: 'A' as const,
        hostname: '@',
        value: ip,
        ttl: 3600
      })),
      // CNAME for www
      {
        type: 'CNAME' as const,
        hostname: 'www',
        value: defaultConfig.cnameTarget,
        ttl: 3600
      },
      // TXT verification record
      {
        type: 'TXT' as const,
        hostname: '@',
        value: `blo-verification=${defaultConfig.txtVerification}`,
        ttl: 3600
      }
    ];

    try {
      // First add domain to Netlify site
      await this.addDomain(domain, { autoSSL: defaultConfig.enableSSL });

      // Then configure DNS records
      const dnsResult = await this.manageDNSRecords(domain, records);

      if (dnsResult.success) {
        return {
          success: true,
          message: `DNS automatically configured for ${domain}. ${dnsResult.created.length} records created, ${dnsResult.updated.length} updated.`,
          records,
          verificationToken: defaultConfig.txtVerification
        };
      } else {
        return {
          success: false,
          message: `DNS configuration partially failed: ${dnsResult.errors.join(', ')}`,
          records
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Auto DNS configuration failed: ${error instanceof Error ? error.message : String(error)}`,
        records: []
      };
    }
  }

  /**
   * Bulk configure multiple domains for blog hosting
   */
  async bulkConfigureBlogDNS(
    domains: string[], 
    config?: Partial<AutoDNSConfig>,
    onProgress?: (completed: number, total: number, current: string, result: any) => void
  ): Promise<{
    successful: string[];
    failed: { domain: string; error: string }[];
    totalProcessed: number;
  }> {
    const successful: string[] = [];
    const failed: { domain: string; error: string }[] = [];

    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i].trim().toLowerCase();
      
      try {
        const result = await this.autoConfigureBlogDNS(domain, config);
        
        if (result.success) {
          successful.push(domain);
        } else {
          failed.push({ domain, error: result.message });
        }

        onProgress?.(i + 1, domains.length, domain, result);
      } catch (error) {
        failed.push({ 
          domain, 
          error: error instanceof Error ? error.message : String(error) 
        });
        onProgress?.(i + 1, domains.length, domain, { success: false, error });
      }

      // Rate limiting delay
      if (i < domains.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    return {
      successful,
      failed,
      totalProcessed: domains.length
    };
  }

  /**
   * Verify DNS propagation status
   */
  async verifyDNSPropagation(domain: string): Promise<{
    propagated: boolean;
    records: {
      aRecord: boolean;
      cnameRecord: boolean;
      txtRecord: boolean;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    
    try {
      // Use external DNS lookup service to verify propagation
      const verificationPromises = [
        this.checkARecord(domain),
        this.checkCNAMERecord(`www.${domain}`),
        this.checkTXTRecord(domain)
      ];

      const [aRecord, cnameRecord, txtRecord] = await Promise.allSettled(verificationPromises);

      const records = {
        aRecord: aRecord.status === 'fulfilled' && aRecord.value,
        cnameRecord: cnameRecord.status === 'fulfilled' && cnameRecord.value,
        txtRecord: txtRecord.status === 'fulfilled' && txtRecord.value
      };

      if (aRecord.status === 'rejected') errors.push(`A record check failed: ${aRecord.reason}`);
      if (cnameRecord.status === 'rejected') errors.push(`CNAME record check failed: ${cnameRecord.reason}`);
      if (txtRecord.status === 'rejected') errors.push(`TXT record check failed: ${txtRecord.reason}`);

      return {
        propagated: records.aRecord && records.cnameRecord && records.txtRecord,
        records,
        errors
      };
    } catch (error) {
      return {
        propagated: false,
        records: { aRecord: false, cnameRecord: false, txtRecord: false },
        errors: [`DNS verification failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * Helper methods for DNS verification
   */
  private async checkARecord(domain: string): Promise<boolean> {
    try {
      // In production, use actual DNS lookup service
      // For development, simulate the check
      if (import.meta.env.DEV) {
        return true; // Simulate success in development
      }

      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const data = await response.json();
      
      return data.Answer && data.Answer.some((record: any) => 
        record.type === 1 && ['75.2.60.5', '99.83.190.102'].includes(record.data)
      );
    } catch {
      return false;
    }
  }

  private async checkCNAMERecord(domain: string): Promise<boolean> {
    try {
      if (import.meta.env.DEV) {
        return true; // Simulate success in development
      }

      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      const data = await response.json();
      
      return data.Answer && data.Answer.some((record: any) => 
        record.type === 5 && record.data.includes('netlify.app')
      );
    } catch {
      return false;
    }
  }

  private async checkTXTRecord(domain: string): Promise<boolean> {
    try {
      if (import.meta.env.DEV) {
        return true; // Simulate success in development
      }

      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
      const data = await response.json();
      
      return data.Answer && data.Answer.some((record: any) => 
        record.type === 16 && record.data.includes('blo-verification=')
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    return 'blo-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get environment configuration status
   */
  static getConfigStatus(): {
    configured: boolean;
    source: 'environment' | 'manual' | 'none';
    message: string;
  } {
    const envToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN || process.env.NETLIFY_ACCESS_TOKEN;
    
    if (envToken) {
      return {
        configured: true,
        source: 'environment',
        message: 'NETLIFY_ACCESS_TOKEN configured via environment variable'
      };
    }

    return {
      configured: false,
      source: 'none',
      message: 'NETLIFY_ACCESS_TOKEN environment variable not found. Manual configuration required.'
    };
  }
}

export default NetlifyDNSManager;
