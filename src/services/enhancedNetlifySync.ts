/**
 * Enhanced Netlify DNS Sync Service
 * Comprehensive domain sync from Netlify DNS to Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NetlifyDomain {
  id: string;
  name: string;
  source: 'site_custom' | 'site_alias' | 'dns_zone';
  state: string;
  created_at: string;
  updated_at: string;
  records_count?: number;
  zone_id?: string;
}

export interface ComprehensiveSyncResult {
  success: boolean;
  totalFound: number;
  synced: number;
  updated: number;
  errors: string[];
  domains: NetlifyDomain[];
  databaseOperations: {
    inserted: number;
    updated: number;
    failed: number;
  };
  message: string;
}

class EnhancedNetlifySync {
  private readonly NETLIFY_ACCESS_TOKEN = 'nfp_Xngqzk9sydkiKUvfdrqHLSnBCZiH33U8b967';
  private readonly NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  private readonly NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

  /**
   * Comprehensive sync from Netlify DNS to Supabase
   */
  async syncAllDomainsFromNetlify(): Promise<ComprehensiveSyncResult> {
    console.log('🚀 Starting comprehensive Netlify DNS sync...');
    
    const result: ComprehensiveSyncResult = {
      success: false,
      totalFound: 0,
      synced: 0,
      updated: 0,
      errors: [],
      domains: [],
      databaseOperations: {
        inserted: 0,
        updated: 0,
        failed: 0
      },
      message: ''
    };

    try {
      // Step 1: Test database connection
      console.log('🔍 Testing database connection...');
      const dbTest = await this.testDatabaseConnection();
      if (!dbTest.success) {
        result.errors.push(`Database error: ${dbTest.error}`);
        result.message = 'Database connection failed';
        return result;
      }
      console.log('✅ Database connection verified');

      // Step 2: Collect all domains from Netlify
      console.log('📡 Collecting domains from Netlify...');
      const allDomains = await this.getAllNetlifyDomains();
      
      result.domains = allDomains.domains;
      result.totalFound = allDomains.domains.length;
      result.errors.push(...allDomains.errors);

      console.log(`📋 Found ${result.totalFound} total domains from Netlify`);

      if (result.totalFound === 0) {
        result.message = 'No domains found in Netlify';
        result.success = true; // Not an error, just no domains
        return result;
      }

      // Step 3: Sync each domain to database
      console.log('💾 Syncing domains to database...');
      for (const domain of result.domains) {
        try {
          const syncResult = await this.syncSingleDomainToDatabase(domain);
          
          if (syncResult.action === 'inserted') {
            result.databaseOperations.inserted++;
            result.synced++;
          } else if (syncResult.action === 'updated') {
            result.databaseOperations.updated++;
            result.updated++;
          } else if (syncResult.action === 'failed') {
            result.databaseOperations.failed++;
            result.errors.push(`${domain.name}: ${syncResult.error}`);
          }

          console.log(`✅ ${syncResult.action}: ${domain.name}`);

        } catch (syncError: any) {
          console.error(`❌ Failed to sync ${domain.name}:`, syncError);
          result.databaseOperations.failed++;
          result.errors.push(`${domain.name}: ${syncError.message}`);
        }
      }

      // Step 4: Final validation
      const totalProcessed = result.databaseOperations.inserted + result.databaseOperations.updated + result.databaseOperations.failed;
      result.success = totalProcessed > 0 && result.databaseOperations.failed < result.totalFound;
      
      result.message = `Processed ${totalProcessed}/${result.totalFound} domains. ` +
        `${result.synced} new, ${result.updated} updated, ${result.databaseOperations.failed} failed.`;

      console.log(`✅ Sync complete: ${result.message}`);
      return result;

    } catch (error: any) {
      console.error('❌ Comprehensive sync failed:', error);
      result.errors.push(`Sync error: ${error.message}`);
      result.message = `Sync failed: ${error.message}`;
      return result;
    }
  }

  /**
   * Get ALL domains from Netlify (site + DNS zones)
   */
  private async getAllNetlifyDomains(): Promise<{
    domains: NetlifyDomain[];
    errors: string[];
  }> {
    const allDomains: NetlifyDomain[] = [];
    const errors: string[] = [];

    try {
      // 1. Get site domains (custom domain + aliases)
      console.log('📡 Fetching site configuration...');
      const siteResponse = await fetch(`${this.NETLIFY_API_BASE}/sites/${this.NETLIFY_SITE_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.NETLIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (siteResponse.ok) {
        const siteData = await siteResponse.json();
        
        // Add custom domain
        if (siteData.custom_domain) {
          allDomains.push({
            id: `site-custom-${siteData.custom_domain}`,
            name: siteData.custom_domain,
            source: 'site_custom',
            state: 'active',
            created_at: siteData.created_at || new Date().toISOString(),
            updated_at: siteData.updated_at || new Date().toISOString(),
          });
          console.log(`✅ Site custom domain: ${siteData.custom_domain}`);
        }

        // Add domain aliases
        if (siteData.domain_aliases && Array.isArray(siteData.domain_aliases)) {
          siteData.domain_aliases.forEach((alias: string, index: number) => {
            allDomains.push({
              id: `site-alias-${alias}`,
              name: alias,
              source: 'site_alias',
              state: 'active',
              created_at: siteData.created_at || new Date().toISOString(),
              updated_at: siteData.updated_at || new Date().toISOString(),
            });
            console.log(`✅ Site alias: ${alias}`);
          });
        }
      } else {
        const errorText = await siteResponse.text();
        errors.push(`Site API error: ${siteResponse.status} - ${errorText}`);
      }

    } catch (siteError: any) {
      console.error('❌ Site API error:', siteError);
      errors.push(`Site fetch error: ${siteError.message}`);
    }

    try {
      // 2. Get DNS zones (managed domains)
      console.log('📡 Fetching DNS zones...');
      const dnsResponse = await fetch(`${this.NETLIFY_API_BASE}/dns_zones`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.NETLIFY_ACCESS_TOKEN}`,
        },
      });

      if (dnsResponse.ok) {
        const dnsZones = await dnsResponse.json();
        
        if (Array.isArray(dnsZones)) {
          dnsZones.forEach((zone: any) => {
            allDomains.push({
              id: `dns-zone-${zone.id}`,
              name: zone.name,
              source: 'dns_zone',
              state: zone.state || 'active',
              created_at: zone.created_at || new Date().toISOString(),
              updated_at: zone.updated_at || new Date().toISOString(),
              records_count: zone.records?.length || 0,
              zone_id: zone.id,
            });
            console.log(`✅ DNS zone: ${zone.name} (${zone.records?.length || 0} records)`);
          });
        }
      } else {
        const errorText = await dnsResponse.text();
        errors.push(`DNS API error: ${dnsResponse.status} - ${errorText}`);
      }

    } catch (dnsError: any) {
      console.error('❌ DNS API error:', dnsError);
      errors.push(`DNS fetch error: ${dnsError.message}`);
    }

    // Remove duplicates by domain name
    const uniqueDomains = this.removeDuplicateDomains(allDomains);
    console.log(`📋 Collected ${uniqueDomains.length} unique domains from Netlify`);

    return { domains: uniqueDomains, errors };
  }

  /**
   * Test database connection and table structure
   */
  private async testDatabaseConnection(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Test basic connectivity
      const { data, error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Domains table does not exist. Please run database setup.'
          };
        }
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      return { success: true };

    } catch (dbError: any) {
      return {
        success: false,
        error: `Database connection failed: ${dbError.message}`
      };
    }
  }

  /**
   * Sync a single domain to database with proper error handling
   */
  private async syncSingleDomainToDatabase(domain: NetlifyDomain): Promise<{
    action: 'inserted' | 'updated' | 'skipped' | 'failed';
    error?: string;
  }> {
    try {
      // Check if domain already exists
      const { data: existingDomain, error: selectError } = await supabase
        .from('domains')
        .select('id, domain, netlify_verified, status')
        .eq('domain', domain.name)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.warn(`⚠️ Error checking existing domain ${domain.name}:`, selectError);
      }

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
          return {
            action: 'failed',
            error: `Update failed: ${updateError.message}`
          };
        }

        return { action: 'updated' };

      } else {
        // Insert new domain
        const { error: insertError } = await supabase
          .from('domains')
          .insert({
            domain: domain.name,
            user_id: '00000000-0000-0000-0000-000000000000', // Global system
            status: 'verified',
            netlify_verified: true,
            netlify_site_id: this.NETLIFY_SITE_ID,
            is_global: true,
            created_by: `netlify_${domain.source}`,
            created_at: domain.created_at,
            updated_at: domain.updated_at,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            // Duplicate key - try to update instead
            return await this.syncSingleDomainToDatabase(domain);
          }
          return {
            action: 'failed',
            error: `Insert failed: ${insertError.message}`
          };
        }

        return { action: 'inserted' };
      }

    } catch (error: any) {
      return {
        action: 'failed',
        error: `Database operation failed: ${error.message}`
      };
    }
  }

  /**
   * Remove duplicate domains (prefer DNS zones over site domains)
   */
  private removeDuplicateDomains(domains: NetlifyDomain[]): NetlifyDomain[] {
    const domainMap = new Map<string, NetlifyDomain>();

    domains.forEach(domain => {
      const existing = domainMap.get(domain.name);
      
      if (!existing) {
        domainMap.set(domain.name, domain);
      } else {
        // Prefer DNS zones over site domains (more complete info)
        if (domain.source === 'dns_zone' && existing.source !== 'dns_zone') {
          domainMap.set(domain.name, domain);
        }
      }
    });

    return Array.from(domainMap.values());
  }

  /**
   * Get current database domain count
   */
  async getDatabaseDomainCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Failed to count database domains:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Database count error:', error);
      return 0;
    }
  }

  /**
   * Test Netlify API connectivity
   */
  async testNetlifyConnection(): Promise<{
    success: boolean;
    message: string;
    siteInfo?: any;
  }> {
    try {
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
          message: `Netlify API error: ${response.status} - ${errorText}`
        };
      }

      const siteData = await response.json();
      
      return {
        success: true,
        message: `Connected to Netlify site: ${siteData.name}`,
        siteInfo: {
          siteName: siteData.name,
          siteId: siteData.id,
          url: siteData.url,
          customDomain: siteData.custom_domain,
          domainAliases: siteData.domain_aliases || [],
          state: siteData.state
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export const enhancedNetlifySync = new EnhancedNetlifySync();

// Export convenience functions
export const syncAllDomainsFromNetlify = () => enhancedNetlifySync.syncAllDomainsFromNetlify();
export const testNetlifyConnection = () => enhancedNetlifySync.testNetlifyConnection();
export const getDatabaseDomainCount = () => enhancedNetlifySync.getDatabaseDomainCount();
