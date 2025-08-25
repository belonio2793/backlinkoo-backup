/**
 * Supabase to Netlify Sync Service
 * Syncs domains FROM Supabase TO Netlify using the edge function
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Domain {
  id: string;
  name: string;
  site_id?: string;
  source: 'supabase' | 'netlify';
  status: 'pending' | 'active' | 'error';
  user_id?: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  count?: number;
  error?: string;
}

class SupabaseToNetlifySync {
  private readonly SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  private readonly EDGE_FUNCTION_URL = `${this.SUPABASE_URL}/functions/v1/netlify-domains`;
  private readonly DEFAULT_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  /**
   * Get all domains from Supabase
   */
  async getAllDomains(): Promise<Domain[]> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch domains:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching domains:', error);
      throw error;
    }
  }

  /**
   * Add a new domain to Supabase
   */
  async addDomain(domainName: string, siteId?: string): Promise<SyncResult> {
    try {
      const cleanDomain = this.cleanDomainName(domainName);
      
      // Check if domain already exists
      const { data: existingDomain } = await supabase
        .from('domains')
        .select('name')
        .eq('name', cleanDomain)
        .single();

      if (existingDomain) {
        return {
          success: false,
          message: `Domain ${cleanDomain} already exists`
        };
      }

      // Add domain to Supabase
      const { data, error } = await supabase
        .from('domains')
        .insert({
          name: cleanDomain,
          site_id: siteId || this.DEFAULT_SITE_ID,
          source: 'supabase',
          status: 'pending',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to add domain:', error);
        return {
          success: false,
          message: `Failed to add domain: ${error.message}`
        };
      }

      console.log(`✅ Added domain ${cleanDomain} to Supabase`);
      return {
        success: true,
        message: `Domain ${cleanDomain} added successfully`
      };

    } catch (error: any) {
      console.error('❌ Add domain error:', error);
      return {
        success: false,
        message: `Error adding domain: ${error.message}`
      };
    }
  }

  /**
   * Sync pending domains to Netlify using edge function
   */
  async syncToNetlify(): Promise<SyncResult> {
    try {
      console.log('🚀 Syncing domains from Supabase to Netlify...');

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge function error:', errorText);
        return {
          success: false,
          message: `Sync failed: ${response.status}`,
          error: errorText
        };
      }

      const result = await response.json();
      console.log('✅ Sync result:', result);

      return {
        success: true,
        message: result.message || 'Domains synced successfully',
        count: result.count
      };

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      return {
        success: false,
        message: `Sync error: ${error.message}`
      };
    }
  }

  /**
   * Remove domain from both Supabase and Netlify
   */
  async removeDomain(domainId: string): Promise<SyncResult> {
    try {
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId);

      if (error) {
        console.error('❌ Failed to remove domain:', error);
        return {
          success: false,
          message: `Failed to remove domain: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Domain removed successfully'
      };

    } catch (error: any) {
      console.error('❌ Remove domain error:', error);
      return {
        success: false,
        message: `Error removing domain: ${error.message}`
      };
    }
  }

  /**
   * Update domain status
   */
  async updateDomainStatus(domainId: string, status: string, errorMessage?: string): Promise<SyncResult> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('domains')
        .update(updateData)
        .eq('id', domainId);

      if (error) {
        console.error('❌ Failed to update domain status:', error);
        return {
          success: false,
          message: `Failed to update status: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Domain status updated successfully'
      };

    } catch (error: any) {
      console.error('❌ Update status error:', error);
      return {
        success: false,
        message: `Error updating status: ${error.message}`
      };
    }
  }

  /**
   * Get domains by status
   */
  async getDomainsByStatus(status: string): Promise<Domain[]> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch domains by status:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching domains by status:', error);
      throw error;
    }
  }

  /**
   * Test edge function connectivity
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
        }
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Edge function is accessible and working'
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: `Edge function error: ${response.status} - ${errorText}`
        };
      }

    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  /**
   * Clean domain name
   */
  private cleanDomainName(domain: string): string {
    return domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    total: number;
    pending: number;
    active: number;
    error: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: 0,
        active: 0,
        error: 0
      };

      data?.forEach(domain => {
        switch (domain.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'active':
            stats.active++;
            break;
          case 'error':
            stats.error++;
            break;
        }
      });

      return stats;

    } catch (error: any) {
      console.error('❌ Error getting sync stats:', error);
      return {
        total: 0,
        pending: 0,
        active: 0,
        error: 0
      };
    }
  }
}

// Export singleton instance
export const supabaseToNetlifySync = new SupabaseToNetlifySync();

// Export convenience functions
export const getAllDomains = () => supabaseToNetlifySync.getAllDomains();
export const addDomain = (domain: string, siteId?: string) => supabaseToNetlifySync.addDomain(domain, siteId);
export const syncToNetlify = () => supabaseToNetlifySync.syncToNetlify();
export const removeDomain = (domainId: string) => supabaseToNetlifySync.removeDomain(domainId);
export const updateDomainStatus = (domainId: string, status: string, errorMessage?: string) => 
  supabaseToNetlifySync.updateDomainStatus(domainId, status, errorMessage);
export const getDomainsByStatus = (status: string) => supabaseToNetlifySync.getDomainsByStatus(status);
export const testEdgeFunction = () => supabaseToNetlifySync.testConnection();
export const getSyncStats = () => supabaseToNetlifySync.getSyncStats();
