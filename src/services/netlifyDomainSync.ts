/**
 * Netlify Domain Sync Service
 * Uses existing Netlify functions for domain management
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NetlifyDomain {
  id: string;
  name: string;
  source: 'custom_domain' | 'domain_alias';
  state: string;
  created_at: string;
  updated_at: string;
}

export interface DomainSyncResult {
  success: boolean;
  totalFound: number;
  synced: number;
  updated: number;
  errors: string[];
  domains: NetlifyDomain[];
  message: string;
}

class NetlifyDomainSyncService {
  /**
   * Sync all domains from Netlify to Supabase
   */
  async syncDomainsFromNetlify(): Promise<DomainSyncResult> {
    console.log('🚀 Starting Netlify domain sync...');
    
    const result: DomainSyncResult = {
      success: false,
      totalFound: 0,
      synced: 0,
      updated: 0,
      errors: [],
      domains: [],
      message: ''
    };

    try {
      // Step 1: Get domains from Netlify
      console.log('📡 Fetching domains from Netlify...');
      const netlifyDomains = await this.getDomainsFromNetlify();
      
      result.domains = netlifyDomains.domains;
      result.totalFound = netlifyDomains.domains.length;
      result.errors.push(...netlifyDomains.errors);

      if (result.totalFound === 0) {
        result.message = 'No domains found in Netlify';
        result.success = true;
        return result;
      }

      console.log(`📋 Found ${result.totalFound} domains from Netlify`);

      // Step 2: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        result.errors.push('User not authenticated');
        result.message = 'Authentication required';
        return result;
      }

      // Step 3: Sync each domain to database
      console.log('💾 Syncing domains to database...');
      
      for (const domain of result.domains) {
        try {
          const syncResult = await this.syncDomainToDatabase(domain, user.id);
          
          if (syncResult.action === 'inserted') {
            result.synced++;
          } else if (syncResult.action === 'updated') {
            result.updated++;
          }

          console.log(`✅ ${syncResult.action}: ${domain.name}`);

        } catch (syncError: any) {
          console.error(`❌ Failed to sync ${domain.name}:`, syncError);
          result.errors.push(`${domain.name}: ${syncError.message}`);
        }
      }

      const totalProcessed = result.synced + result.updated;
      result.success = totalProcessed > 0;
      result.message = `Processed ${totalProcessed}/${result.totalFound} domains. ${result.synced} new, ${result.updated} updated.`;

      console.log(`✅ Sync complete: ${result.message}`);
      return result;

    } catch (error: any) {
      console.error('❌ Domain sync failed:', error);
      result.errors.push(`Sync error: ${error.message}`);
      result.message = `Sync failed: ${error.message}`;
      return result;
    }
  }

  /**
   * Get domains from Netlify using existing function
   */
  private async getDomainsFromNetlify(): Promise<{
    domains: NetlifyDomain[];
    errors: string[];
  }> {
    try {
      console.log('📡 Calling Netlify function to get site info...');
      
      const response = await fetch('/.netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_site_info' })
      });

      if (!response.ok) {
        throw new Error(`Netlify function error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get site info');
      }

      const domains: NetlifyDomain[] = [];
      const siteInfo = result.siteInfo;

      // Add custom domain
      if (siteInfo.custom_domain) {
        domains.push({
          id: `custom-${siteInfo.custom_domain}`,
          name: siteInfo.custom_domain,
          source: 'custom_domain',
          state: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Add domain aliases
      if (siteInfo.domain_aliases && Array.isArray(siteInfo.domain_aliases)) {
        siteInfo.domain_aliases.forEach((alias: string) => {
          domains.push({
            id: `alias-${alias}`,
            name: alias,
            source: 'domain_alias',
            state: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      }

      console.log(`✅ Found ${domains.length} domains from Netlify:`, domains.map(d => d.name));

      return {
        domains,
        errors: []
      };

    } catch (error: any) {
      console.error('❌ Failed to get domains from Netlify:', error);
      return {
        domains: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Sync a single domain to the database
   */
  private async syncDomainToDatabase(domain: NetlifyDomain, userId: string): Promise<{
    action: 'inserted' | 'updated' | 'skipped';
    error?: string;
  }> {
    try {
      // Check if domain already exists
      const { data: existing, error: selectError } = await supabase
        .from('domains')
        .select('id, domain, status')
        .eq('domain', domain.name)
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      const domainData = {
        domain: domain.name,
        user_id: userId,
        status: 'active',
        netlify_verified: true,
        created_at: domain.created_at,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing domain
        const { error: updateError } = await supabase
          .from('domains')
          .update(domainData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
        
        return { action: 'updated' };
      } else {
        // Insert new domain
        const { error: insertError } = await supabase
          .from('domains')
          .insert([domainData]);

        if (insertError) throw insertError;
        
        return { action: 'inserted' };
      }

    } catch (error: any) {
      console.error(`❌ Database sync failed for ${domain.name}:`, error);
      return { 
        action: 'skipped', 
        error: error.message 
      };
    }
  }

  /**
   * Test Netlify connection
   */
  async testNetlifyConnection(): Promise<{ success: boolean; error?: string; siteInfo?: any }> {
    try {
      console.log('🧪 Testing Netlify connection...');
      
      const response = await fetch('/.netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_config' })
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Netlify connection test successful');
        return { 
          success: true, 
          siteInfo: result.siteInfo 
        };
      } else {
        console.warn('⚠️ Netlify connection test failed:', result.error);
        return { 
          success: false, 
          error: result.error 
        };
      }

    } catch (error: any) {
      console.error('❌ Netlify connection test error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Get database domain count
   */
  async getDatabaseDomainCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error('❌ Failed to get database domain count:', error);
      return 0;
    }
  }
}

// Create singleton instance
const netlifyDomainSync = new NetlifyDomainSyncService();

// Export service methods
export const syncAllDomainsFromNetlify = () => netlifyDomainSync.syncDomainsFromNetlify();
export const testNetlifyConnection = () => netlifyDomainSync.testNetlifyConnection();
export const getDatabaseDomainCount = () => netlifyDomainSync.getDatabaseDomainCount();

export default netlifyDomainSync;
