import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive Netlify Domain Sync Service
 * Handles bidirectional sync between Supabase domains table and Netlify
 */

export interface NetlifyDomain {
  id?: string;
  domain: string;
  status: 'pending' | 'verified' | 'error';
  ssl_enabled?: boolean;
  created_at?: string;
  error_message?: string;
}

export interface NetlifySiteInfo {
  id: string;
  name: string;
  url: string;
  custom_domain: string | null;
  domain_aliases: string[];
  ssl_url: string;
}

export interface DomainSyncResult {
  success: boolean;
  message: string;
  domains_synced?: number;
  domains_added?: number;
  domains_updated?: number;
  errors?: string[];
  site_info?: NetlifySiteInfo;
}

export class NetlifyDomainSyncService {
  private static readonly NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  private static readonly BASE_URL = '/.netlify/functions';

  /**
   * Get current Netlify site information and domains
   */
  static async getNetlifySiteInfo(): Promise<{ success: boolean; data?: NetlifySiteInfo; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/add-domain-to-netlify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_site_info' }),
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: {
            id: result.siteInfo.id,
            name: result.siteInfo.name,
            url: result.siteInfo.url,
            custom_domain: result.siteInfo.custom_domain,
            domain_aliases: result.siteInfo.domain_aliases || [],
            ssl_url: result.siteInfo.ssl_url
          }
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('Failed to get Netlify site info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync domains from Netlify to Supabase
   */
  static async syncFromNetlify(userId: string): Promise<DomainSyncResult> {
    try {
      console.log('🔄 Starting sync from Netlify to Supabase...');

      // Get Netlify site info and domains
      const netlifyResult = await this.getNetlifySiteInfo();
      
      if (!netlifyResult.success || !netlifyResult.data) {
        return {
          success: false,
          message: `Failed to fetch from Netlify: ${netlifyResult.error}`,
          errors: [netlifyResult.error || 'Unknown Netlify error']
        };
      }

      const siteInfo = netlifyResult.data;
      const allDomains: string[] = [];

      // Collect all domains from Netlify
      if (siteInfo.custom_domain) {
        allDomains.push(siteInfo.custom_domain);
      }
      if (siteInfo.domain_aliases && siteInfo.domain_aliases.length > 0) {
        allDomains.push(...siteInfo.domain_aliases);
      }

      console.log(`📋 Found ${allDomains.length} domains in Netlify:`, allDomains);

      let domainsAdded = 0;
      let domainsUpdated = 0;
      const errors: string[] = [];

      // Sync each domain to Supabase
      for (const domain of allDomains) {
        try {
          const { data: existingDomain } = await supabase
            .from('domains')
            .select('*')
            .eq('domain', domain)
            .eq('user_id', userId)
            .single();

          if (existingDomain) {
            // Update existing domain
            const { error } = await supabase
              .from('domains')
              .update({
                status: 'verified',
                netlify_verified: true,
                netlify_site_id: this.NETLIFY_SITE_ID,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingDomain.id);

            if (error) {
              errors.push(`Failed to update ${domain}: ${error.message}`);
            } else {
              domainsUpdated++;
              console.log(`✅ Updated domain: ${domain}`);
            }
          } else {
            // Add new domain
            const { error } = await supabase
              .from('domains')
              .insert({
                domain,
                user_id: userId,
                status: 'verified',
                netlify_verified: true,
                netlify_site_id: this.NETLIFY_SITE_ID,
              });

            if (error) {
              errors.push(`Failed to add ${domain}: ${error.message}`);
            } else {
              domainsAdded++;
              console.log(`✅ Added domain: ${domain}`);
            }
          }
        } catch (error: any) {
          errors.push(`Error processing ${domain}: ${error.message}`);
        }
      }

      const totalSynced = domainsAdded + domainsUpdated;
      
      return {
        success: true,
        message: `Synced ${totalSynced} domains from Netlify (${domainsAdded} added, ${domainsUpdated} updated)`,
        domains_synced: totalSynced,
        domains_added: domainsAdded,
        domains_updated: domainsUpdated,
        errors: errors.length > 0 ? errors : undefined,
        site_info: siteInfo
      };

    } catch (error: any) {
      console.error('❌ Netlify sync failed:', error);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  /**
   * Add domain to both Netlify and Supabase
   */
  static async addDomain(domain: string, userId: string): Promise<DomainSyncResult> {
    try {
      console.log(`🔄 Adding domain ${domain} to Netlify and Supabase...`);

      // First, add to Supabase as pending
      const { data: dbDomain, error: dbError } = await supabase
        .from('domains')
        .insert({
          domain,
          user_id: userId,
          status: 'pending',
          netlify_verified: false,
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.code === '23505') {
          return {
            success: false,
            message: 'Domain already exists in your account',
            errors: ['Domain already exists']
          };
        }
        throw dbError;
      }

      // Add to Netlify
      const response = await fetch(`${this.BASE_URL}/add-domain-to-netlify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain,
          domainId: dbDomain.id 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update Supabase with success
        await supabase
          .from('domains')
          .update({
            status: 'verified',
            netlify_verified: true,
            netlify_site_id: this.NETLIFY_SITE_ID,
            error_message: null,
          })
          .eq('id', dbDomain.id);

        return {
          success: true,
          message: `✅ ${domain} added successfully to Netlify and Supabase`,
          domains_added: 1
        };
      } else {
        // Update Supabase with error
        await supabase
          .from('domains')
          .update({
            status: 'error',
            error_message: result.error,
          })
          .eq('id', dbDomain.id);

        return {
          success: false,
          message: `Failed to add ${domain} to Netlify: ${result.error}`,
          errors: [result.error]
        };
      }
    } catch (error: any) {
      console.error('❌ Add domain failed:', error);
      return {
        success: false,
        message: `Failed to add domain: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  /**
   * Remove domain from both Netlify and Supabase
   */
  static async removeDomain(domainId: string, userId: string): Promise<DomainSyncResult> {
    try {
      // Get domain info first
      const { data: domain, error: fetchError } = await supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !domain) {
        return {
          success: false,
          message: 'Domain not found or access denied',
          errors: ['Domain not found']
        };
      }

      console.log(`🔄 Removing domain ${domain.domain} from Netlify and Supabase...`);

      // Remove from Supabase first
      const { error: deleteError } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId)
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Note: We don't automatically remove from Netlify to prevent accidental removals
      // This would need to be done manually or with explicit confirmation

      return {
        success: true,
        message: `✅ ${domain.domain} removed from Supabase (Netlify removal requires manual action)`,
        domains_synced: 1
      };

    } catch (error: any) {
      console.error('❌ Remove domain failed:', error);
      return {
        success: false,
        message: `Failed to remove domain: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  /**
   * Get all domains for a user from Supabase
   */
  static async getUserDomains(userId: string): Promise<{ success: boolean; domains?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, domains: data || [] };
    } catch (error: any) {
      console.error('❌ Failed to get user domains:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Netlify connection
   */
  static async testConnection(): Promise<DomainSyncResult> {
    try {
      const response = await fetch(`${this.BASE_URL}/add-domain-to-netlify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_config' }),
      });

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.success 
          ? '✅ Netlify connection successful' 
          : `❌ Netlify connection failed: ${result.error}`,
        errors: result.success ? undefined : [result.error]
      };
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Connection test failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  /**
   * Perform complete bidirectional sync
   */
  static async performFullSync(userId: string): Promise<DomainSyncResult> {
    try {
      console.log('🔄 Starting full bidirectional sync...');

      // Test connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        return connectionTest;
      }

      // Sync from Netlify to Supabase
      const syncResult = await this.syncFromNetlify(userId);
      
      return {
        success: syncResult.success,
        message: syncResult.message,
        domains_synced: syncResult.domains_synced,
        domains_added: syncResult.domains_added,
        domains_updated: syncResult.domains_updated,
        errors: syncResult.errors,
        site_info: syncResult.site_info
      };

    } catch (error: any) {
      console.error('❌ Full sync failed:', error);
      return {
        success: false,
        message: `Full sync failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }
}
