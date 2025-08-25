import { supabase } from '@/integrations/supabase/client';

export interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'error';
  user_id: string;
  netlify_verified: boolean;
  created_at: string;
  netlify_site_id?: string;
  error_message?: string;
}

export interface NetlifyDomainResult {
  success: boolean;
  message: string;
  domains?: string[];
  siteInfo?: {
    id: string;
    name: string;
    url: string;
    custom_domain: string;
    domain_aliases: string[];
  };
  error?: string;
}

export interface AddDomainResult {
  success: boolean;
  domain?: string;
  message: string;
  error?: string;
  netlifyData?: any;
}

export class DomainService {
  private static readonly NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';

  /**
   * Get all domains for a user from the database
   */
  static async getUserDomains(userId: string): Promise<Domain[]> {
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user domains:', error);
      throw new Error(`Failed to fetch domains: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Sync domains from Netlify to the database
   */
  static async syncFromNetlify(userId: string): Promise<NetlifyDomainResult> {
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
          message: result.error || 'Failed to fetch from Netlify',
          error: result.error
        };
      }

      const netlifyDomains = result.domains || [];
      console.log('Syncing domains from Netlify:', netlifyDomains);

      // Sync each domain to database
      for (const domainName of netlifyDomains) {
        await this.upsertDomain(domainName, userId);
      }

      return {
        success: true,
        message: `Synced ${netlifyDomains.length} domains from Netlify`,
        domains: netlifyDomains,
        siteInfo: result.siteInfo
      };
    } catch (error: any) {
      console.error('Netlify sync failed:', error);
      return {
        success: false,
        message: 'Sync failed due to network or API error',
        error: error.message
      };
    }
  }

  /**
   * Add or update a domain in the database
   */
  static async upsertDomain(domainName: string, userId: string): Promise<Domain> {
    const cleanDomain = this.cleanDomainName(domainName);
    
    const { data, error } = await supabase
      .from('domains')
      .upsert({
        domain: cleanDomain,
        user_id: userId,
        status: 'verified',
        netlify_verified: true,
        netlify_site_id: this.NETLIFY_SITE_ID,
      }, {
        onConflict: 'user_id,domain',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert domain:', error);
      throw new Error(`Failed to save domain: ${error.message}`);
    }

    return data;
  }

  /**
   * Add a new domain to both Netlify and the database
   */
  static async addDomain(domainName: string, userId: string): Promise<AddDomainResult> {
    const cleanedDomain = this.cleanDomainName(domainName);

    try {
      // First add to database as pending
      const { data: dbDomain, error: dbError } = await supabase
        .from('domains')
        .insert({
          domain: cleanedDomain,
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
            message: 'Domain already exists',
            error: 'Domain already exists in your account'
          };
        }
        throw dbError;
      }

      // Add to Netlify
      const response = await fetch('/netlify/functions/add-domain-to-netlify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: cleanedDomain,
          domainId: dbDomain.id 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update database with success
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
          domain: cleanedDomain,
          message: `${cleanedDomain} added successfully to Netlify`,
          netlifyData: result.netlifyData
        };
      } else {
        // Update database with error
        await supabase
          .from('domains')
          .update({
            status: 'error',
            error_message: result.error,
          })
          .eq('id', dbDomain.id);

        return {
          success: false,
          domain: cleanedDomain,
          message: `Failed to add to Netlify: ${result.error}`,
          error: result.error
        };
      }
    } catch (error: any) {
      console.error('Add domain error:', error);
      return {
        success: false,
        domain: cleanedDomain,
        message: `Failed to add domain: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Remove a domain from the database
   */
  static async removeDomain(domainId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify ownership
      const { data: domain, error: fetchError } = await supabase
        .from('domains')
        .select('*')
        .eq('id', domainId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !domain) {
        return {
          success: false,
          message: 'Domain not found or access denied'
        };
      }

      // Remove from database
      const { error } = await supabase
        .from('domains')
        .delete()
        .eq('id', domainId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: `${domain.domain} removed successfully`
      };
    } catch (error: any) {
      console.error('Remove domain error:', error);
      return {
        success: false,
        message: `Failed to remove domain: ${error.message}`
      };
    }
  }

  /**
   * Test Netlify connection
   */
  static async testNetlifyConnection(): Promise<NetlifyDomainResult> {
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
   * Clean domain name by removing protocol, www, and trailing slash
   */
  static cleanDomainName(domain: string): string {
    return domain.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  /**
   * Validate domain format
   */
  static isValidDomain(domain: string): boolean {
    const cleanDomain = this.cleanDomainName(domain);
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(cleanDomain);
  }

  /**
   * Check if domain is the primary domain
   */
  static isPrimaryDomain(domain: string): boolean {
    return domain === 'backlinkoo.com';
  }
}
