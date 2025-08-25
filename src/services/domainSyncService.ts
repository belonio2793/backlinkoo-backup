import { supabase } from '@/integrations/supabase/client';
import { Domain, NetlifyDomainResult } from './domainService';

export interface SyncResult {
  success: boolean;
  message: string;
  details?: {
    added: string[];
    updated: string[];
    removed: string[];
    errors: string[];
  };
  error?: string;
}

export interface NetlifySiteInfo {
  id: string;
  name: string;
  url: string;
  custom_domain: string;
  domain_aliases: string[];
  ssl_url?: string;
}

export interface DomainSyncStatus {
  domain: string;
  supabase_status: 'exists' | 'missing' | 'error';
  netlify_status: 'exists' | 'missing' | 'error';
  sync_status: 'in_sync' | 'needs_sync' | 'conflict';
  last_sync?: string;
  error_message?: string;
}

export class DomainSyncService {
  private static readonly NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  private static readonly BATCH_SIZE = 10;

  /**
   * Perform comprehensive bidirectional sync between Supabase and Netlify
   */
  static async performBidirectionalSync(userId: string): Promise<SyncResult> {
    console.log('🔄 Starting bidirectional domain sync...');
    
    const result: SyncResult = {
      success: false,
      message: '',
      details: {
        added: [],
        updated: [],
        removed: [],
        errors: []
      }
    };

    try {
      // Step 1: Get current state from both sources
      const [supabaseDomains, netlifyInfo] = await Promise.all([
        this.getSupabaseDomains(userId),
        this.getNetlifySiteInfo()
      ]);

      if (!netlifyInfo.success) {
        result.error = `Netlify connection failed: ${netlifyInfo.error}`;
        result.message = 'Could not connect to Netlify';
        return result;
      }

      const netlifyDomains = [
        ...(netlifyInfo.siteInfo?.custom_domain ? [netlifyInfo.siteInfo.custom_domain] : []),
        ...(netlifyInfo.siteInfo?.domain_aliases || [])
      ];

      console.log('📊 Current state:', {
        supabase: supabaseDomains.map(d => d.domain),
        netlify: netlifyDomains
      });

      // Step 2: Analyze differences
      const syncStatus = this.analyzeSyncStatus(supabaseDomains, netlifyDomains);
      
      // Step 3: Sync from Netlify to Supabase (add missing domains)
      for (const domain of netlifyDomains) {
        const existsInSupabase = supabaseDomains.some(d => d.domain === domain);
        
        if (!existsInSupabase) {
          try {
            await this.addDomainToSupabase(domain, userId, true); // netlify_verified = true
            result.details!.added.push(domain);
            console.log(`✅ Added ${domain} to Supabase`);
          } catch (error: any) {
            result.details!.errors.push(`Failed to add ${domain} to Supabase: ${error.message}`);
            console.error(`❌ Failed to add ${domain} to Supabase:`, error);
          }
        }
      }

      // Step 4: Update Supabase domains that exist in Netlify
      for (const supabaseDomain of supabaseDomains) {
        const existsInNetlify = netlifyDomains.includes(supabaseDomain.domain);
        
        if (existsInNetlify && !supabaseDomain.netlify_verified) {
          try {
            await this.updateDomainStatus(supabaseDomain.id, {
              status: 'verified',
              netlify_verified: true,
              error_message: null
            });
            result.details!.updated.push(supabaseDomain.domain);
            console.log(`✅ Updated ${supabaseDomain.domain} status in Supabase`);
          } catch (error: any) {
            result.details!.errors.push(`Failed to update ${supabaseDomain.domain}: ${error.message}`);
          }
        } else if (!existsInNetlify && supabaseDomain.netlify_verified) {
          // Domain was removed from Netlify
          try {
            await this.updateDomainStatus(supabaseDomain.id, {
              status: 'error',
              netlify_verified: false,
              error_message: 'Domain no longer exists in Netlify'
            });
            result.details!.updated.push(supabaseDomain.domain);
            console.log(`⚠️ Marked ${supabaseDomain.domain} as removed from Netlify`);
          } catch (error: any) {
            result.details!.errors.push(`Failed to update ${supabaseDomain.domain}: ${error.message}`);
          }
        }
      }

      // Step 5: Record sync operation
      await this.logSyncOperation(userId, {
        operation: 'bidirectional_sync',
        netlify_domains: netlifyDomains,
        supabase_domains: supabaseDomains.map(d => d.domain),
        changes: result.details,
        site_info: netlifyInfo.siteInfo
      });

      result.success = result.details!.errors.length === 0;
      result.message = this.buildSyncMessage(result.details!);

      console.log('🎉 Bidirectional sync completed:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Bidirectional sync failed:', error);
      result.error = error.message;
      result.message = 'Sync operation failed';
      return result;
    }
  }

  /**
   * Get site information from Netlify
   */
  static async getNetlifySiteInfo(): Promise<NetlifyDomainResult & { siteInfo?: NetlifySiteInfo }> {
    try {
      const response = await fetch('/netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_site_info' }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Failed to fetch Netlify site info',
          error: result.error
        };
      }

      return {
        success: true,
        message: `Retrieved site info: ${result.domainCount} domains`,
        domains: result.domains,
        siteInfo: result.siteInfo
      };
    } catch (error: any) {
      console.error('Netlify site info fetch failed:', error);
      return {
        success: false,
        message: 'Network error connecting to Netlify',
        error: error.message
      };
    }
  }

  /**
   * Get domains from Supabase
   */
  static async getSupabaseDomains(userId: string): Promise<Domain[]> {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch Supabase domains:', error);
      throw new Error(`Failed to fetch domains: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add domain to Supabase database
   */
  static async addDomainToSupabase(
    domain: string, 
    userId: string, 
    netlifyVerified: boolean = false
  ): Promise<Domain> {
    const { data, error } = await supabase
      .from('domains')
      .upsert({
        domain: domain.toLowerCase().trim(),
        user_id: userId,
        status: netlifyVerified ? 'verified' : 'pending',
        netlify_verified: netlifyVerified,
        netlify_site_id: this.NETLIFY_SITE_ID,
      }, {
        onConflict: 'user_id,domain',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add domain to Supabase: ${error.message}`);
    }

    return data;
  }

  /**
   * Update domain status in Supabase
   */
  static async updateDomainStatus(
    domainId: string, 
    updates: Partial<Pick<Domain, 'status' | 'netlify_verified' | 'error_message'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('domains')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', domainId);

    if (error) {
      throw new Error(`Failed to update domain: ${error.message}`);
    }
  }

  /**
   * Analyze sync status between Supabase and Netlify
   */
  static analyzeSyncStatus(supabaseDomains: Domain[], netlifyDomains: string[]): DomainSyncStatus[] {
    const statusMap = new Map<string, DomainSyncStatus>();

    // Check Supabase domains
    supabaseDomains.forEach(domain => {
      statusMap.set(domain.domain, {
        domain: domain.domain,
        supabase_status: 'exists',
        netlify_status: netlifyDomains.includes(domain.domain) ? 'exists' : 'missing',
        sync_status: 'needs_sync',
        last_sync: domain.updated_at,
        error_message: domain.error_message || undefined
      });
    });

    // Check Netlify domains
    netlifyDomains.forEach(domain => {
      const existing = statusMap.get(domain);
      if (existing) {
        existing.sync_status = existing.netlify_status === 'exists' && existing.supabase_status === 'exists' 
          ? 'in_sync' : 'needs_sync';
      } else {
        statusMap.set(domain, {
          domain,
          supabase_status: 'missing',
          netlify_status: 'exists',
          sync_status: 'needs_sync'
        });
      }
    });

    return Array.from(statusMap.values());
  }

  /**
   * Log sync operation to database
   */
  static async logSyncOperation(userId: string, operation: any): Promise<void> {
    try {
      await supabase
        .from('sync_logs')
        .insert({
          table_name: 'domains',
          action: 'bidirectional_sync',
          payload: operation,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log sync operation:', error);
      // Don't throw - logging is optional
    }
  }

  /**
   * Build human-readable sync message
   */
  static buildSyncMessage(details: NonNullable<SyncResult['details']>): string {
    const parts = [];
    
    if (details.added.length > 0) {
      parts.push(`Added ${details.added.length} domain(s)`);
    }
    
    if (details.updated.length > 0) {
      parts.push(`Updated ${details.updated.length} domain(s)`);
    }
    
    if (details.removed.length > 0) {
      parts.push(`Removed ${details.removed.length} domain(s)`);
    }
    
    if (details.errors.length > 0) {
      parts.push(`${details.errors.length} error(s)`);
    }

    if (parts.length === 0) {
      return 'All domains are in sync';
    }

    return `Sync completed: ${parts.join(', ')}`;
  }

  /**
   * Test Netlify configuration and connectivity
   */
  static async testNetlifyConfiguration(): Promise<NetlifyDomainResult> {
    try {
      const response = await fetch('/netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_config' }),
      });

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        siteInfo: result.siteInfo,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to test Netlify connection',
        error: error.message
      };
    }
  }

  /**
   * Get domain sync status overview
   */
  static async getDomainSyncOverview(userId: string): Promise<{
    total: number;
    inSync: number;
    needsSync: number;
    hasErrors: number;
    lastSync: string | null;
  }> {
    const domains = await this.getSupabaseDomains(userId);
    
    return {
      total: domains.length,
      inSync: domains.filter(d => d.netlify_verified && d.status === 'verified').length,
      needsSync: domains.filter(d => !d.netlify_verified || d.status === 'pending').length,
      hasErrors: domains.filter(d => d.status === 'error').length,
      lastSync: domains.length > 0 ? domains[0].updated_at : null
    };
  }
}
