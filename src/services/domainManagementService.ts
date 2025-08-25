import { supabase } from '@/integrations/supabase/client';

export interface DomainManagementResponse {
  success: boolean;
  domain?: any;
  netlify_verified?: boolean;
  netlify_removed?: boolean;
  error?: string;
  message?: string;
  sync_results?: {
    total_netlify: number;
    total_supabase: number;
    in_sync: number;
    added_to_supabase: number;
    updated_in_supabase: number;
  };
  netlify_domains?: string[];
  supabase_domains?: string[];
}

export class DomainManagementService {
  /**
   * Add a domain to both Supabase and Netlify
   */
  static async addDomain(domain: string, userId?: string): Promise<DomainManagementResponse> {
    try {
      console.log(`🔄 Adding domain: ${domain}`);
      
      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        body: {
          action: 'add',
          domain: domain.trim().toLowerCase(),
          user_id: userId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to add domain'
        };
      }

      console.log('✅ Domain add response:', data);
      return data;

    } catch (error: any) {
      console.error('Add domain service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add domain'
      };
    }
  }

  /**
   * Remove a domain from both Supabase and Netlify
   */
  static async removeDomain(domain: string, userId?: string): Promise<DomainManagementResponse> {
    try {
      console.log(`🔄 Removing domain: ${domain}`);
      
      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        body: {
          action: 'remove',
          domain: domain.trim().toLowerCase(),
          user_id: userId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to remove domain'
        };
      }

      console.log('✅ Domain remove response:', data);
      return data;

    } catch (error: any) {
      console.error('Remove domain service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove domain'
      };
    }
  }

  /**
   * Sync domains between Supabase and Netlify
   */
  static async syncDomains(userId?: string): Promise<DomainManagementResponse> {
    try {
      console.log('🔄 Syncing domains between Supabase and Netlify');
      
      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        body: {
          action: 'sync',
          user_id: userId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to sync domains'
        };
      }

      console.log('✅ Domain sync response:', data);
      return data;

    } catch (error: any) {
      console.error('Sync domains service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync domains'
      };
    }
  }

  /**
   * Get all domains from Supabase
   */
  static async getDomains(userId?: string): Promise<{ domains: any[]; error: string | null }> {
    try {
      let query = supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to load domains:', error);
        return { domains: [], error: error.message };
      }

      return { domains: data || [], error: null };

    } catch (error: any) {
      console.error('Get domains service error:', error);
      return { domains: [], error: error.message };
    }
  }

  /**
   * Test Netlify connection
   */
  static async testNetlifyConnection(): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      const result = await this.syncDomains();
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        return {
          success: true,
          message: 'Netlify connection successful',
          responseTime
        };
      } else {
        return {
          success: false,
          message: result.error || 'Netlify connection failed',
          responseTime
        };
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        message: error.message || 'Netlify connection test failed',
        responseTime
      };
    }
  }

  /**
   * Validate domain format
   */
  static validateDomain(domain: string): { isValid: boolean; error?: string } {
    if (!domain || !domain.trim()) {
      return { isValid: false, error: 'Domain cannot be empty' };
    }

    const cleanDomain = domain.trim().toLowerCase();

    // Remove protocol and www
    const normalizedDomain = cleanDomain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    // Check for valid domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    
    if (!domainRegex.test(normalizedDomain)) {
      return { 
        isValid: false, 
        error: 'Invalid domain format. Use format: example.com' 
      };
    }

    // Check length
    if (normalizedDomain.length > 253) {
      return { 
        isValid: false, 
        error: 'Domain name too long' 
      };
    }

    return { isValid: true };
  }

  /**
   * Clean and normalize domain input
   */
  static cleanDomain(domain: string): string {
    return domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  /**
   * Setup real-time subscription for domains table
   */
  static setupRealtimeSubscription(
    callback: (payload: any) => void,
    userId?: string
  ): (() => void) {
    const subscriptionConfig = {
      event: '*' as const,
      schema: 'public',
      table: 'domains',
      ...(userId && { filter: `user_id=eq.${userId}` })
    };

    const channel = supabase
      .channel('domains-realtime')
      .on('postgres_changes', subscriptionConfig, callback)
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get domain statistics
   */
  static async getDomainStats(userId?: string): Promise<{
    total: number;
    verified: number;
    pending: number;
    errors: number;
    netlifyVerified: number;
  }> {
    try {
      const { domains } = await this.getDomains(userId);
      
      const stats = domains.reduce((acc, domain) => {
        acc.total++;
        
        if (domain.status === 'verified') acc.verified++;
        else if (domain.status === 'pending') acc.pending++;
        else if (domain.status === 'error') acc.errors++;
        
        if (domain.netlify_verified) acc.netlifyVerified++;
        
        return acc;
      }, {
        total: 0,
        verified: 0,
        pending: 0,
        errors: 0,
        netlifyVerified: 0
      });

      return stats;

    } catch (error) {
      console.error('Failed to get domain stats:', error);
      return {
        total: 0,
        verified: 0,
        pending: 0,
        errors: 0,
        netlifyVerified: 0
      };
    }
  }
}

export default DomainManagementService;
