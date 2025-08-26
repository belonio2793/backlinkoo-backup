import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NetlifyDomainData {
  domain: string;
  type: 'custom' | 'alias' | 'branch';
  verified: boolean;
  ssl_status: 'none' | 'pending' | 'issued' | 'error';
  dns_records?: any[];
  created_at?: string;
  netlify_site_id?: string;
  netlify_domain_id?: string;
}

export interface BulkSyncResult {
  success: boolean;
  totalProcessed: number;
  successfulSyncs: number;
  errors: Array<{
    domain: string;
    error: string;
  }>;
  domains: NetlifyDomainData[];
}

export class NetlifyDomainBulkSync {
  
  /**
   * Fetch all domains from Netlify API
   */
  static async fetchAllNetlifyDomains(): Promise<{
    success: boolean;
    domains?: NetlifyDomainData[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching all domains from Netlify...');

      // Try the Supabase edge function first
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('netlify-domains', {
        body: {
          action: 'sync'
        }
      });

      if (!edgeError && edgeData?.success) {
        console.log('✅ Successfully fetched domains via edge function');
        
        const domains: NetlifyDomainData[] = (edgeData.netlify_domains || []).map((domain: string, index: number) => ({
          domain,
          type: 'alias',
          verified: true,
          ssl_status: 'issued',
          created_at: new Date().toISOString(),
          netlify_site_id: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809'
        }));

        return {
          success: true,
          domains
        };
      }

      // Fallback to direct Netlify function
      console.log('⚠️ Edge function failed, trying direct Netlify function...');
      
      const response = await fetch('/.netlify/functions/netlify-domain-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getSiteInfo'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          const domains: NetlifyDomainData[] = [];
          
          // Add custom domain if exists
          if (result.data.custom_domain) {
            domains.push({
              domain: result.data.custom_domain,
              type: 'custom',
              verified: true,
              ssl_status: result.data.ssl_url ? 'issued' : 'none',
              created_at: result.data.created_at,
              netlify_site_id: result.data.id
            });
          }

          // Add domain aliases
          if (result.data.domain_aliases && result.data.domain_aliases.length > 0) {
            result.data.domain_aliases.forEach((domain: string) => {
              domains.push({
                domain,
                type: 'alias',
                verified: true,
                ssl_status: 'issued',
                created_at: result.data.created_at,
                netlify_site_id: result.data.id
              });
            });
          }

          return {
            success: true,
            domains
          };
        }
      }

      // Final fallback - return empty but successful to allow manual input
      console.log('⚠️ All automatic methods failed, will allow manual domain input');
      return {
        success: true,
        domains: []
      };

    } catch (error: any) {
      console.error('❌ Failed to fetch Netlify domains:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch domains from Netlify'
      };
    }
  }

  /**
   * Store domains in Supabase with comprehensive mapping
   */
  static async storeDomainInSupabase(
    domain: NetlifyDomainData, 
    userId: string
  ): Promise<{ success: boolean; error?: string; domain_id?: string }> {
    try {
      // Check if domain already exists
      const { data: existingDomain } = await supabase
        .from('domains')
        .select('id, domain')
        .eq('domain', domain.domain)
        .eq('user_id', userId)
        .single();

      if (existingDomain) {
        // Update existing domain with Netlify data
        const { data, error } = await supabase
          .from('domains')
          .update({
            netlify_verified: domain.verified,
            ssl_status: domain.ssl_status,
            dns_verified: domain.verified,
            custom_domain: domain.type === 'custom',
            netlify_site_id: domain.netlify_site_id,
            netlify_domain_id: domain.netlify_domain_id,
            dns_records: domain.dns_records || [],
            ssl_enabled: domain.ssl_status === 'issued',
            last_sync: new Date().toISOString(),
            last_validation_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: domain.verified ? 'validated' : 'pending'
          })
          .eq('id', existingDomain.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        return {
          success: true,
          domain_id: data.id
        };
      } else {
        // Insert new domain with full Netlify data
        const { data, error } = await supabase
          .from('domains')
          .insert({
            domain: domain.domain,
            user_id: userId,
            status: domain.verified ? 'validated' : 'pending',
            netlify_verified: domain.verified,
            dns_verified: domain.verified,
            ssl_status: domain.ssl_status,
            custom_domain: domain.type === 'custom',
            netlify_site_id: domain.netlify_site_id,
            netlify_domain_id: domain.netlify_domain_id,
            dns_records: domain.dns_records || [],
            ssl_enabled: domain.ssl_status === 'issued',
            blog_enabled: false,
            pages_published: 0,
            last_sync: new Date().toISOString(),
            last_validation_at: new Date().toISOString(),
            created_at: domain.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return {
          success: true,
          domain_id: data.id
        };
      }
    } catch (error: any) {
      console.error(`❌ Failed to store domain ${domain.domain}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to store domain in database'
      };
    }
  }

  /**
   * Bulk sync all Netlify domains to Supabase
   */
  static async syncAllDomainsToSupabase(userId: string): Promise<BulkSyncResult> {
    const result: BulkSyncResult = {
      success: false,
      totalProcessed: 0,
      successfulSyncs: 0,
      errors: [],
      domains: []
    };

    try {
      // Step 1: Fetch all domains from Netlify
      const fetchResult = await this.fetchAllNetlifyDomains();
      
      if (!fetchResult.success) {
        return {
          ...result,
          errors: [{ domain: 'fetch_error', error: fetchResult.error || 'Failed to fetch domains' }]
        };
      }

      const domains = fetchResult.domains || [];
      result.domains = domains;
      result.totalProcessed = domains.length;

      if (domains.length === 0) {
        return {
          ...result,
          success: true,
          errors: [{ domain: 'no_domains', error: 'No domains found in Netlify. You may need to connect to Netlify MCP or configure API tokens.' }]
        };
      }

      // Step 2: Store each domain in Supabase
      for (const domain of domains) {
        const storeResult = await this.storeDomainInSupabase(domain, userId);
        
        if (storeResult.success) {
          result.successfulSyncs++;
        } else {
          result.errors.push({
            domain: domain.domain,
            error: storeResult.error || 'Unknown storage error'
          });
        }
      }

      result.success = result.successfulSyncs > 0;

      return result;

    } catch (error: any) {
      console.error('❌ Bulk sync failed:', error);
      return {
        ...result,
        errors: [{ domain: 'sync_error', error: error.message || 'Bulk sync failed' }]
      };
    }
  }

  /**
   * Manual domain addition helper (for when API is not available)
   */
  static async addDomainManually(
    domain: string,
    userId: string,
    options: {
      isCustomDomain?: boolean;
      hasSSL?: boolean;
      hasTheme?: string;
      blogEnabled?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string; domain_id?: string }> {
    
    const domainData: NetlifyDomainData = {
      domain,
      type: options.isCustomDomain ? 'custom' : 'alias',
      verified: true, // Assume verified if manually added
      ssl_status: options.hasSSL ? 'issued' : 'none',
      netlify_site_id: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
      created_at: new Date().toISOString()
    };

    return this.storeDomainInSupabase(domainData, userId);
  }

  /**
   * Get sync status and recommendations
   */
  static async getSyncStatus(userId: string): Promise<{
    hasNetlifyConnection: boolean;
    supabaseDomainCount: number;
    lastSync?: string;
    recommendations: string[];
  }> {
    try {
      // Check Supabase domain count
      const { count } = await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Check if we can connect to Netlify
      const netlifyTest = await this.fetchAllNetlifyDomains();

      const recommendations: string[] = [];

      if (!netlifyTest.success) {
        recommendations.push('Connect to Netlify MCP to enable automatic domain syncing');
        recommendations.push('Or use manual domain addition if API access is not available');
      }

      if ((count || 0) === 0) {
        recommendations.push('No domains found in database - run a sync to import your domains');
      }

      // Check last sync time
      const { data: lastSyncData } = await supabase
        .from('domains')
        .select('last_sync')
        .eq('user_id', userId)
        .not('last_sync', 'is', null)
        .order('last_sync', { ascending: false })
        .limit(1)
        .single();

      return {
        hasNetlifyConnection: netlifyTest.success && (netlifyTest.domains?.length || 0) > 0,
        supabaseDomainCount: count || 0,
        lastSync: lastSyncData?.last_sync,
        recommendations
      };

    } catch (error: any) {
      console.error('❌ Failed to get sync status:', error);
      return {
        hasNetlifyConnection: false,
        supabaseDomainCount: 0,
        recommendations: ['Error checking sync status - please try again']
      };
    }
  }
}
