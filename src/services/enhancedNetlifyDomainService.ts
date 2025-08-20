/**
 * Enhanced Netlify Domain Management Service
 * Handles adding external domains to Netlify site, DNS zone creation, and DNS propagation
 */

interface NetlifyDomainResponse {
  id: string;
  domain: string;
  site_id: string;
  verified: boolean;
  created_at: string;
}

interface NetlifyDNSZone {
  id: string;
  name: string;
  account_slug: string;
  created_at: string;
  updated_at: string;
  records: NetlifyDNSRecord[];
}

interface NetlifyDNSRecord {
  id: string;
  hostname: string;
  type: string;
  value: string;
  ttl: number;
  priority?: number;
  managed: boolean;
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

interface DomainSetupResult {
  success: boolean;
  domain: string;
  netlifyDomainId?: string;
  dnsZoneId?: string;
  dnsRecords?: NetlifyDNSRecord[];
  setupInstructions?: string[];
  error?: string;
}

export class EnhancedNetlifyDomainService {
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
      console.warn('⚠️ NETLIFY_ACCESS_TOKEN not set - Netlify operations will be simulated');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.token && this.siteId);
  }

  /**
   * Complete domain setup: Add to Netlify + Create DNS Zone + Setup Records
   */
  async setupDomainComplete(domain: string): Promise<DomainSetupResult> {
    try {
      console.log(`🚀 Starting complete domain setup for: ${domain}`);

      // Validate domain format
      if (!this.isValidDomain(domain)) {
        return {
          success: false,
          domain,
          error: 'Invalid domain format'
        };
      }

      // Check if token is configured
      if (!this.token || this.token.length < 20) {
        return {
          success: false,
          domain,
          error: 'NETLIFY_ACCESS_TOKEN not configured. Please connect to Netlify first.'
        };
      }

      const result: DomainSetupResult = {
        success: true,
        domain,
        setupInstructions: []
      };

      // Step 1: Add domain to Netlify site
      console.log(`📌 Step 1: Adding ${domain} to Netlify site...`);
      const domainResult = await this.addDomainToSite(domain);
      
      if (!domainResult.success) {
        return {
          success: false,
          domain,
          error: `Failed to add domain to site: ${domainResult.error}`
        };
      }

      result.netlifyDomainId = domainResult.data?.id;
      result.setupInstructions?.push(`✅ Domain ${domain} added to Netlify site`);

      // Step 2: Create DNS zone
      console.log(`📌 Step 2: Creating DNS zone for ${domain}...`);
      const zoneResult = await this.createDNSZone(domain);
      
      if (zoneResult.success && zoneResult.zone) {
        result.dnsZoneId = zoneResult.zone.id;
        result.setupInstructions?.push(`✅ DNS zone created for ${domain}`);

        // Step 3: Setup DNS records
        console.log(`📌 Step 3: Setting up DNS records...`);
        const recordsResult = await this.setupDNSRecords(domain, zoneResult.zone.id);
        
        if (recordsResult.success) {
          result.dnsRecords = recordsResult.records;
          result.setupInstructions?.push(`✅ DNS records configured`);
          result.setupInstructions?.push(`📡 Nameservers: ${this.getNetlifyNameservers()}`);
        } else {
          result.setupInstructions?.push(`⚠️ DNS records setup failed: ${recordsResult.error}`);
        }
      } else {
        result.setupInstructions?.push(`⚠️ DNS zone creation failed: ${zoneResult.error}`);
      }

      // Step 4: Provide setup instructions
      result.setupInstructions?.push(
        `🔧 Next steps:`,
        `1. Update nameservers at your domain registrar to: ${this.getNetlifyNameservers()}`,
        `2. Wait 24-48 hours for DNS propagation`,
        `3. SSL certificate will be automatically provisioned once DNS is verified`
      );

      console.log(`✅ Domain setup completed for: ${domain}`);
      return result;

    } catch (error) {
      console.error('❌ Error in complete domain setup:', error);
      return {
        success: false,
        domain,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add domain to Netlify site
   */
  private async addDomainToSite(domain: string): Promise<{
    success: boolean;
    data?: NetlifyDomainResponse;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/sites/${this.siteId}/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorData}`
        };
      }

      const data: NetlifyDomainResponse = await response.json();
      return { success: true, data };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Create DNS zone for domain
   */
  private async createDNSZone(domain: string): Promise<{
    success: boolean;
    zone?: NetlifyDNSZone;
    error?: string;
  }> {
    try {
      // Check if zone already exists
      const existingZone = await this.getDNSZone(domain);
      if (existingZone.success && existingZone.zone) {
        return { success: true, zone: existingZone.zone };
      }

      // Create new DNS zone
      const response = await fetch(`${this.baseUrl}/dns_zones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: `Failed to create DNS zone: HTTP ${response.status}: ${errorData}`
        };
      }

      const zone: NetlifyDNSZone = await response.json();
      return { success: true, zone };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get existing DNS zone
   */
  private async getDNSZone(domain: string): Promise<{
    success: boolean;
    zone?: NetlifyDNSZone;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/dns_zones/${domain}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (response.status === 404) {
        return { success: false, error: 'DNS zone not found' };
      }

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const zone: NetlifyDNSZone = await response.json();
      return { success: true, zone };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Setup DNS records for the domain
   */
  private async setupDNSRecords(domain: string, zoneId: string): Promise<{
    success: boolean;
    records?: NetlifyDNSRecord[];
    error?: string;
  }> {
    try {
      const records: NetlifyDNSRecord[] = [];
      // Use the exact same DNS records as backlinkoo.com
      const backlinkooDomain = 'backlinkoo.netlify.app'; // Main Netlify app domain
      const recordsToCreate = [
        // A record pointing to the same IP as backlinkoo.com
        {
          type: 'A',
          hostname: domain,
          value: '75.2.60.5', // Netlify's IP that backlinkoo.com uses
          ttl: 3600
        },
        // CNAME for www subdomain - point to the same place as backlinkoo.com
        {
          type: 'CNAME',
          hostname: `www.${domain}`,
          value: backlinkooDomain,
          ttl: 3600
        },
        // CNAME for blog subdomain - point to the same place as backlinkoo.com
        {
          type: 'CNAME',
          hostname: `blog.${domain}`,
          value: backlinkooDomain,
          ttl: 3600
        },
        // Wildcard CNAME to catch all subdomains
        {
          type: 'CNAME',
          hostname: `*.${domain}`,
          value: backlinkooDomain,
          ttl: 3600
        }
      ];

      for (const record of recordsToCreate) {
        try {
          const response = await fetch(`${this.baseUrl}/dns_zones/${zoneId}/dns_records`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
          });

          if (response.ok) {
            const createdRecord: NetlifyDNSRecord = await response.json();
            records.push(createdRecord);
            console.log(`✅ DNS record created: ${record.type} ${record.hostname} -> ${record.value}`);
          } else {
            console.warn(`⚠️ Failed to create DNS record: ${record.type} ${record.hostname}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error creating DNS record: ${record.type} ${record.hostname}:`, error);
        }
      }

      return { success: true, records };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Get Netlify nameservers
   */
  private getNetlifyNameservers(): string {
    return 'dns1.p01.nsone.net, dns2.p01.nsone.net, dns3.p01.nsone.net, dns4.p01.nsone.net';
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
      if (!this.token || this.token.length < 20) {
        return {
          success: false,
          error: 'NETLIFY_ACCESS_TOKEN not configured'
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
      return { success: true, status };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate setup instructions based on domain status
   */
  generateSetupInstructions(domain: string, isFromRegistrar: boolean = false): string[] {
    const instructions = [
      `🌐 Domain Setup Instructions for: ${domain}`,
      '',
    ];

    if (isFromRegistrar) {
      instructions.push(
        '📋 For domains purchased from registrars:',
        '1. Login to your domain registrar (GoDaddy, Namecheap, etc.)',
        '2. Navigate to DNS management or nameserver settings',
        `3. Replace nameservers with: ${this.getNetlifyNameservers()}`,
        '4. Save changes and wait 24-48 hours for propagation',
        '',
      );
    } else {
      instructions.push(
        '📋 For domains added via /domains page:',
        '1. Ensure domain points to our server IP: 75.2.60.5',
        '2. Add CNAME records for subdomains as needed',
        '3. SSL certificates will be automatically provisioned',
        '',
      );
    }

    instructions.push(
      '🔍 Verification:',
      '• Use DNS propagation checkers to verify changes',
      '• Check domain status in the /domains page',
      '• SSL certificate status will update automatically',
      '',
      '⚡ Advanced Options:',
      '• Configure blog subdirectory routing',
      '• Set up custom redirects',
      '• Enable edge functions for enhanced performance'
    );

    return instructions;
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }
}

export default EnhancedNetlifyDomainService;
