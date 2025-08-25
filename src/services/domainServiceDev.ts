import { supabase } from '@/integrations/supabase/client';

/**
 * Development version of domain service that works without Netlify authentication
 * This provides mock Netlify responses for development purposes
 */

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

export class DomainServiceDev {
  private static readonly NETLIFY_SITE_ID = 'ca6261e6-0a59-40b5-a2bc-5b5481ac8809';
  
  // Mock domains for development
  private static mockNetlifyDomains = [
    'backlinkoo.com',
    'app.backlinkoo.com'
  ];

  /**
   * Get all domains for a user from the database
   */
  static async getUserDomains(userId: string): Promise<Domain[]> {
    try {
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
    } catch (error: any) {
      console.error('Database error:', error);
      // Return empty array in case of database issues
      return [];
    }
  }

  /**
   * Mock sync from Netlify for development
   */
  static async syncFromNetlify(userId: string): Promise<NetlifyDomainResult> {
    console.log('🔧 Development mode: Using mock Netlify data');
    
    try {
      // Simulate successful Netlify response
      const netlifyDomains = this.mockNetlifyDomains;
      
      // Sync each domain to database
      for (const domainName of netlifyDomains) {
        await this.upsertDomain(domainName, userId);
      }

      return {
        success: true,
        message: `Synced ${netlifyDomains.length} domains from Netlify (dev mode)`,
        domains: netlifyDomains,
        siteInfo: {
          id: this.NETLIFY_SITE_ID,
          name: 'Backlinkoo (Dev)',
          url: 'https://backlinkoo.netlify.app',
          custom_domain: 'backlinkoo.com',
          domain_aliases: netlifyDomains.filter(d => d !== 'backlinkoo.com')
        }
      };
    } catch (error: any) {
      console.error('Development sync failed:', error);
      return {
        success: false,
        message: 'Development sync failed',
        error: error.message
      };
    }
  }

  /**
   * Add or update a domain in the database
   */
  static async upsertDomain(domainName: string, userId: string): Promise<Domain> {
    const cleanDomain = this.cleanDomainName(domainName);
    
    try {
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
    } catch (error: any) {
      console.error('Upsert error:', error);
      throw error;
    }
  }

  /**
   * Mock add domain for development
   */
  static async addDomain(domainName: string, userId: string): Promise<AddDomainResult> {
    const cleanedDomain = this.cleanDomainName(domainName);
    
    console.log('🔧 Development mode: Mock adding domain to Netlify');

    try {
      // Add to database as pending first
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

      // Simulate successful Netlify addition
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

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
        message: `${cleanedDomain} added successfully (dev mode)`,
        netlifyData: {
          site_id: this.NETLIFY_SITE_ID,
          alias_name: cleanedDomain
        }
      };
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
   * Mock Netlify connection test
   */
  static async testNetlifyConnection(): Promise<NetlifyDomainResult> {
    console.log('🔧 Development mode: Mock Netlify connection test');
    
    return {
      success: true,
      message: 'Netlify connection successful (development mode)',
      siteInfo: {
        id: this.NETLIFY_SITE_ID,
        name: 'Backlinkoo (Dev)',
        url: 'https://backlinkoo.netlify.app',
        custom_domain: 'backlinkoo.com',
        domain_aliases: ['app.backlinkoo.com']
      }
    };
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
