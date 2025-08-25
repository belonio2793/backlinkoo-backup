/**
 * Domains API Helper
 * 
 * Frontend integration helper for the enhanced netlify-domains function
 * Based on the ChatGPT conversation implementation
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export interface Domain {
  id?: string;
  name: string;
  site_id?: string;
  source?: 'manual' | 'netlify';
  status?: 'active' | 'pending' | 'verified' | 'unverified' | 'error';
  created_at?: string;
  updated_at?: string;
}

/**
 * Map database domain status to UI-friendly status
 */
function mapDomainStatus(
  dbStatus: string,
  netlifyVerified: boolean,
  dnsVerified: boolean
): 'active' | 'pending' | 'verified' | 'unverified' | 'error' {
  if (dbStatus === 'error') return 'error';
  if (dbStatus === 'verified' || (netlifyVerified && dnsVerified)) return 'verified';
  if (dbStatus === 'dns_ready' || netlifyVerified) return 'pending';
  if (dbStatus === 'active') return 'active';
  return 'unverified';
}

export interface NetlifyDomain {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export class DomainsApiHelper {
  /**
   * Fetch domains from Netlify and sync with Supabase database
   * This calls the enhanced netlify-domains function (GET)
   */
  static async syncDomains(): Promise<NetlifyDomain[]> {
    try {
      console.log('🔄 Syncing domains from Netlify...');

      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        method: 'GET'
      });

      if (error) {
        console.error('❌ Error syncing domains:', error);
        throw new Error(`Failed to sync domains: ${error.message}`);
      }

      console.log(`✅ Synced ${data?.length || 0} domains from Netlify`);
      return data || [];

    } catch (error) {
      console.error('❌ Sync domains failed:', error);
      throw error;
    }
  }

  /**
   * Add a new domain to Netlify and sync with Supabase
   * This calls the enhanced netlify-domains function (POST)
   */
  static async addDomain(domainName: string): Promise<NetlifyDomain> {
    try {
      console.log(`➕ Adding domain: ${domainName}`);

      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        method: 'POST',
        body: { domain: domainName }
      });

      if (error) {
        console.error('❌ Error adding domain:', error);
        throw new Error(`Failed to add domain: ${error.message}`);
      }

      console.log(`✅ Added domain: ${domainName}`);
      return data;

    } catch (error) {
      console.error('❌ Add domain failed:', error);
      throw error;
    }
  }

  /**
   * Remove a domain from Netlify and Supabase
   * This calls the enhanced netlify-domains function (DELETE)
   */
  static async deleteDomain(domainName: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting domain: ${domainName}`);

      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        method: 'DELETE',
        body: { domain: domainName }
      });

      if (error) {
        console.error('❌ Error deleting domain:', error);
        throw new Error(`Failed to delete domain: ${error.message}`);
      }

      console.log(`✅ Deleted domain: ${domainName}`);
      return data?.success || false;

    } catch (error) {
      console.error('❌ Delete domain failed:', error);
      throw error;
    }
  }

  /**
   * Fetch domains directly from Supabase database
   * Use this to display the current domain list in the UI
   */
  static async fetchDomainsFromDatabase(): Promise<Domain[]> {
    try {
      console.log('📋 Fetching domains from database...');

      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching domains from database:', error);
        throw new Error(`Failed to fetch domains: ${error.message}`);
      }

      console.log(`📊 Found ${data?.length || 0} domains in database`);

      // Map database rows to Domain interface (domain column → name property)
      return (data || []).map(row => ({
        id: row.id,
        name: row.domain, // Map DB column 'domain' to interface property 'name'
        site_id: row.netlify_site_id,
        source: row.is_global ? 'netlify' : 'manual',
        status: mapDomainStatus(row.status, row.netlify_verified, row.dns_verified),
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

    } catch (error) {
      console.error('❌ Fetch domains from database failed:', error);
      throw error;
    }
  }

  /**
   * Add a domain manually to the database (without Netlify)
   * Use this for domains that are managed outside of Netlify
   */
  static async addManualDomain(domainName: string): Promise<Domain> {
    try {
      console.log(`➕ Adding manual domain: ${domainName}`);

      const { data, error } = await supabase
        .from('domains')
        .insert({
          domain: domainName, // Use correct DB column name
          netlify_site_id: 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809',
          status: 'pending' // Use correct status enum value
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding manual domain:', error);
        throw new Error(`Failed to add manual domain: ${error.message}`);
      }

      console.log(`✅ Added manual domain: ${domainName}`);
      return data;

    } catch (error) {
      console.error('❌ Add manual domain failed:', error);
      throw error;
    }
  }

  /**
   * Update domain status in the database
   * Use this to mark domains as verified, error, etc.
   */
  static async updateDomainStatus(domainName: string, status: Domain['status']): Promise<Domain> {
    try {
      console.log(`🔄 Updating domain ${domainName} status to: ${status}`);

      const { data, error } = await supabase
        .from('domains')
        .update({ status })
        .eq('name', domainName)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating domain status:', error);
        throw new Error(`Failed to update domain status: ${error.message}`);
      }

      console.log(`✅ Updated domain ${domainName} status to: ${status}`);
      return data;

    } catch (error) {
      console.error('❌ Update domain status failed:', error);
      throw error;
    }
  }

  /**
   * Test the netlify-domains function connectivity
   * Use this for debugging and health checks
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing netlify-domains function connectivity...');

      const { data, error } = await supabase.functions.invoke('netlify-domains', {
        method: 'GET'
      });

      if (error) {
        console.error('❌ Connection test failed:', error);
        return false;
      }

      console.log('✅ Connection test successful');
      console.log(`📊 Function returned ${data?.length || 0} domains`);
      return true;

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

// Export individual functions for convenience
export const {
  syncDomains,
  addDomain,
  deleteDomain,
  fetchDomainsFromDatabase,
  addManualDomain,
  updateDomainStatus,
  testConnection
} = DomainsApiHelper;

export default DomainsApiHelper;
