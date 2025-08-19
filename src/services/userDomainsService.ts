import { supabase } from '@/integrations/supabase/client';

export interface UserDomain {
  id: string;
  user_id: string;
  domain: string;
  url: string;
  status: 'active' | 'inactive' | 'verifying';
  verified: boolean;
  notes?: string;
  target_keywords?: string[];
  verification_token?: string;
  verification_method?: string;
  last_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export type CreateDomainData = {
  domain: string;
  url: string;
  notes?: string;
  target_keywords?: string[];
};

export type UpdateDomainData = {
  notes?: string;
  target_keywords?: string[];
  status?: 'active' | 'inactive' | 'verifying';
  verified?: boolean;
};

export class UserDomainsService {
  /**
   * Get all domains for the current user
   */
  static async getUserDomains(): Promise<UserDomain[]> {
    const { data, error } = await supabase
      .from('user_domains')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user domains:', error);
      throw new Error(`Failed to fetch domains: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific domain by ID
   */
  static async getDomainById(id: string): Promise<UserDomain | null> {
    const { data, error } = await supabase
      .from('user_domains')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching domain:', error);
      throw new Error(`Failed to fetch domain: ${error.message}`);
    }

    return data;
  }

  /**
   * Add a new domain for the current user
   */
  static async createDomain(domainData: CreateDomainData): Promise<UserDomain> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate domain format
    const validation = this.validateDomain(domainData.domain);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid domain format');
    }

    const { data, error } = await supabase
      .from('user_domains')
      .insert({
        user_id: user.id,
        domain: validation.domain,
        url: validation.url,
        notes: domainData.notes,
        target_keywords: domainData.target_keywords || [],
        status: 'verifying'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating domain:', error);
      if (error.code === '23505') {
        throw new Error('Domain already exists for this user');
      }
      throw new Error(`Failed to create domain: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing domain
   */
  static async updateDomain(id: string, updates: UpdateDomainData): Promise<UserDomain> {
    const { data, error } = await supabase
      .from('user_domains')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating domain:', error);
      throw new Error(`Failed to update domain: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a domain
   */
  static async deleteDomain(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_domains')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting domain:', error);
      throw new Error(`Failed to delete domain: ${error.message}`);
    }
  }

  /**
   * Validate and format domain input
   */
  static validateDomain(input: string): { 
    isValid: boolean; 
    domain: string; 
    url: string; 
    error?: string 
  } {
    try {
      // Remove protocol and trailing slash
      let cleanDomain = input.trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase();

      // Remove www. prefix for consistency
      cleanDomain = cleanDomain.replace(/^www\./, '');

      // Basic domain validation regex
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      
      if (!cleanDomain || cleanDomain.length < 3) {
        return { 
          isValid: false, 
          domain: '', 
          url: '', 
          error: 'Domain too short' 
        };
      }

      if (cleanDomain.length > 253) {
        return { 
          isValid: false, 
          domain: '', 
          url: '', 
          error: 'Domain too long' 
        };
      }

      if (!domainRegex.test(cleanDomain)) {
        return { 
          isValid: false, 
          domain: '', 
          url: '', 
          error: 'Invalid domain format' 
        };
      }

      // Check for valid TLD
      const parts = cleanDomain.split('.');
      if (parts.length < 2) {
        return { 
          isValid: false, 
          domain: '', 
          url: '', 
          error: 'Domain must have a valid TLD' 
        };
      }

      const tld = parts[parts.length - 1];
      if (tld.length < 2 || tld.length > 6) {
        return { 
          isValid: false, 
          domain: '', 
          url: '', 
          error: 'Invalid TLD' 
        };
      }

      const url = `https://${cleanDomain}`;
      
      return { 
        isValid: true, 
        domain: cleanDomain, 
        url 
      };
    } catch (error) {
      return { 
        isValid: false, 
        domain: '', 
        url: '', 
        error: 'Invalid domain format' 
      };
    }
  }

  /**
   * Verify domain ownership (placeholder for future implementation)
   */
  static async verifyDomain(id: string): Promise<{ verified: boolean; error?: string }> {
    try {
      const domain = await this.getDomainById(id);
      if (!domain) {
        throw new Error('Domain not found');
      }

      // TODO: Implement actual domain verification
      // For now, simulate verification
      const verified = Math.random() > 0.3; // 70% success rate for demo

      if (verified) {
        await this.updateDomain(id, { 
          verified: true, 
          status: 'active',
          last_verified_at: new Date().toISOString()
        });
        return { verified: true };
      } else {
        return { verified: false, error: 'Verification failed' };
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      return { verified: false, error: 'Verification error' };
    }
  }

  /**
   * Get active domains for campaigns (used by automation tools)
   */
  static async getActiveDomains(): Promise<UserDomain[]> {
    const { data, error } = await supabase
      .from('user_domains')
      .select('*')
      .eq('status', 'active')
      .eq('verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active domains:', error);
      throw new Error(`Failed to fetch active domains: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get domain statistics
   */
  static async getDomainStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    pending: number;
  }> {
    const domains = await this.getUserDomains();
    
    return {
      total: domains.length,
      active: domains.filter(d => d.status === 'active').length,
      verified: domains.filter(d => d.verified).length,
      pending: domains.filter(d => d.status === 'verifying').length
    };
  }

  /**
   * Check if a domain already exists for the user
   */
  static async domainExists(domain: string): Promise<boolean> {
    const validation = this.validateDomain(domain);
    if (!validation.isValid) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_domains')
      .select('id')
      .eq('domain', validation.domain)
      .limit(1);

    if (error) {
      console.error('Error checking domain existence:', error);
      return false;
    }

    return (data || []).length > 0;
  }
}

export default UserDomainsService;
