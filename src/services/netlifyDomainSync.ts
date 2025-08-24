/**
 * Direct Netlify Domain Sync Service
 * Syncs domains from Netlify DNS to local database
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NetlifyDomain {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  records_count?: number;
}

export interface SyncResult {
  success: boolean;
  domains: NetlifyDomain[];
  synced: number;
  errors: string[];
  message: string;
}

class NetlifyDomainSyncService {
  private readonly NETLIFY_ACCESS_TOKEN = 'nfp_Xngqzk9sydkiKUvfdrqHLSnBCZiH33U8b967';
  private readonly NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  private readonly NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

  /**
   * Sync all domains from Netlify to database
   */
  async syncDomainsFromNetlify(): Promise<SyncResult> {
    console.log('🔄 Starting direct Netlify domain sync...');
    
    const result: SyncResult = {
      success: false,
      domains: [],
      synced: 0,
      errors: [],
      message: ''
    };

    try {
      // Step 1: Get domains from site configuration
      const siteDomainsResult = await this.getSiteDomainsFromNetlify();
      if (!siteDomainsResult.success) {
        result.errors.push(`Site domains error: ${siteDomainsResult.error}`);
      } else {
        result.domains.push(...siteDomainsResult.domains);
      }

      // Step 2: Get DNS zones (managed domains)
      const dnsZonesResult = await this.getDNSZonesFromNetlify();
      if (!dnsZonesResult.success) {
        result.errors.push(`DNS zones error: ${dnsZonesResult.error}`);
      } else {
        result.domains.push(...dnsZonesResult.domains);
      }

      // Remove duplicates
      const uniqueDomains = this.removeDuplicateDomains(result.domains);
      console.log(`📋 Found ${uniqueDomains.length} unique domains from Netlify`);

      // Step 3: Sync to database
      let syncedCount = 0;
      for (const domain of uniqueDomains) {
        try {
          const synced = await this.syncDomainToDatabase(domain);
          if (synced) {
            syncedCount++;
          }
        } catch (syncError: any) {
          console.warn(`⚠️ Failed to sync ${domain.name}:`, syncError.message);
          result.errors.push(`${domain.name}: ${syncError.message}`);
        }
      }

      result.synced = syncedCount;
      result.success = syncedCount > 0 || result.errors.length === 0;
      result.message = `Successfully synced ${syncedCount} of ${uniqueDomains.length} domains`;

      console.log(`✅ Sync complete: ${syncedCount} domains synced`);
      return result;

    } catch (error: any) {
      console.error('❌ Netlify sync failed:', error);
      result.errors.push(error.message);
      result.message = `Sync failed: ${error.message}`;
      return result;
    }
  }

  /**
   * Get domains from site configuration (custom domain + aliases)
   */
  private async getSiteDomainsFromNetlify(): Promise<{
    success: boolean;
    domains: NetlifyDomain[];
    error?: string;
  }> {
    try {
      console.log('📡 Fetching site domains from Netlify...');
      
      const response = await fetch(`${this.NETLIFY_API_BASE}/sites/${this.NETLIFY_SITE_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.NETLIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Netlify API error: ${response.status} - ${errorText}`);
      }

      const siteData = await response.json();
      const domains: NetlifyDomain[] = [];

      // Add custom domain
      if (siteData.custom_domain) {
        domains.push({
          id: `site-custom-${siteData.custom_domain}`,
          name: siteData.custom_domain,
          state: 'site_custom_domain',
          created_at: siteData.created_at,
          updated_at: siteData.updated_at,
        });
      }

      // Add domain aliases
      if (siteData.domain_aliases && Array.isArray(siteData.domain_aliases)) {
        siteData.domain_aliases.forEach((alias: string, index: number) => {
          domains.push({
            id: `site-alias-${alias}`,
            name: alias,
            state: 'site_alias',
            created_at: siteData.created_at,
            updated_at: siteData.updated_at,
          });
        });
      }

      console.log(`✅ Site domains: ${domains.length} found`);
      return { success: true, domains };

    } catch (error: any) {
      console.error('❌ Failed to get site domains:', error);
      return { success: false, domains: [], error: error.message };
    }
  }

  /**
   * Get DNS zones (managed domains)
   */
  private async getDNSZonesFromNetlify(): Promise<{
    success: boolean;
    domains: NetlifyDomain[];
    error?: string;
  }> {
    try {
      console.log('📡 Fetching DNS zones from Netlify...');
      
      const response = await fetch(`${this.NETLIFY_API_BASE}/dns_zones`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.NETLIFY_ACCESS_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Netlify DNS API error: ${response.status} - ${errorText}`);
      }

      const dnsZones = await response.json();
      const domains: NetlifyDomain[] = [];

      if (Array.isArray(dnsZones)) {
        dnsZones.forEach((zone: any) => {
          domains.push({
            id: `dns-zone-${zone.id}`,
            name: zone.name,
            state: 'dns_zone',
            created_at: zone.created_at,
            updated_at: zone.updated_at,
            user_id: zone.user_id,
            records_count: zone.records?.length || 0,
          });
        });
      }

      console.log(`✅ DNS zones: ${domains.length} found`);
      return { success: true, domains };

    } catch (error: any) {
      console.error('❌ Failed to get DNS zones:', error);
      return { success: false, domains: [], error: error.message };
    }
  }

  /**
   * Remove duplicate domains
   */
  private removeDuplicateDomains(domains: NetlifyDomain[]): NetlifyDomain[] {
    const seen = new Set<string>();
    return domains.filter(domain => {
      if (seen.has(domain.name)) {
        return false;
      }
      seen.add(domain.name);
      return true;
    });
  }

  /**
   * Sync a single domain to database
   */
  private async syncDomainToDatabase(netlifyDomain: NetlifyDomain): Promise<boolean> {
    try {
      // Check if domain already exists
      const { data: existingDomain } = await supabase
        .from('domains')
        .select('id, netlify_verified')
        .eq('domain', netlifyDomain.name)
        .single();

      if (existingDomain) {
        // Update existing domain
        const { error: updateError } = await supabase
          .from('domains')
          .update({
            netlify_verified: true,
            status: 'verified',
            netlify_site_id: this.NETLIFY_SITE_ID,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDomain.id);

        if (updateError) {
          console.warn(`⚠️ Failed to update ${netlifyDomain.name}:`, updateError);
          return false;
        }

        console.log(`🔄 Updated existing domain: ${netlifyDomain.name}`);
        return true;
      } else {
        // Insert new domain
        const { error: insertError } = await supabase
          .from('domains')
          .insert({
            domain: netlifyDomain.name,
            user_id: '00000000-0000-0000-0000-000000000000', // Global system
            status: 'verified',
            netlify_verified: true,
            netlify_site_id: this.NETLIFY_SITE_ID,
            is_global: true,
            created_by: 'netlify_sync',
            created_at: netlifyDomain.created_at,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            console.log(`ℹ️ Domain already exists: ${netlifyDomain.name}`);
            return false;
          }
          console.warn(`⚠️ Failed to insert ${netlifyDomain.name}:`, insertError);
          return false;
        }

        console.log(`✅ Added new domain: ${netlifyDomain.name}`);
        return true;
      }
    } catch (error: any) {
      console.error(`❌ Database sync error for ${netlifyDomain.name}:`, error);
      return false;
    }
  }

  /**
   * Get all domains currently in Netlify
   */
  async getNetlifyDomains(): Promise<NetlifyDomain[]> {
    const result = await this.syncDomainsFromNetlify();
    return result.domains;
  }

  /**
   * Test Netlify API connectivity
   */
  async testNetlifyConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🧪 Testing Netlify API connection...');
      
      const response = await fetch(`${this.NETLIFY_API_BASE}/sites/${this.NETLIFY_SITE_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.NETLIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Netlify API error: ${response.status} - ${errorText}`,
        };
      }

      const siteData = await response.json();
      
      return {
        success: true,
        message: `Successfully connected to Netlify site: ${siteData.name}`,
        details: {
          siteName: siteData.name,
          siteId: siteData.id,
          url: siteData.url,
          customDomain: siteData.custom_domain,
          domainAliases: siteData.domain_aliases || [],
        },
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }
}

// Export singleton instance
export const netlifyDomainSync = new NetlifyDomainSyncService();

// Export for easy use in components
export const syncDomainsFromNetlify = () => netlifyDomainSync.syncDomainsFromNetlify();
export const testNetlifyConnection = () => netlifyDomainSync.testNetlifyConnection();
