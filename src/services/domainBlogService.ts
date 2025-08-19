import { supabase } from '@/integrations/supabase/client';

export interface ValidatedDomain {
  id: string;
  domain: string;
  status: string;
  blog_enabled: boolean;
  blog_subdirectory: string;
  pages_published: number;
}

export class DomainBlogService {
  /**
   * Get all validated domains available for blog publishing
   */
  static async getValidatedDomains(): Promise<ValidatedDomain[]> {
    const { data, error } = await supabase
      .from('domains')
      .select('id, domain, status, blog_enabled, blog_subdirectory, pages_published')
      .eq('status', 'active')
      .eq('dns_validated', true)
      .order('domain', { ascending: true });

    if (error) {
      console.error('Error fetching validated domains:', error);
      throw new Error(`Failed to fetch validated domains: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Enable blog publishing for a validated domain
   */
  static async enableBlogForDomain(domainId: string, subdirectory: string = 'blog'): Promise<void> {
    const { error } = await supabase
      .from('domains')
      .update({
        blog_enabled: true,
        blog_subdirectory: subdirectory
      })
      .eq('id', domainId)
      .eq('status', 'active');

    if (error) {
      console.error('Error enabling blog for domain:', error);
      throw new Error(`Failed to enable blog: ${error.message}`);
    }
  }

  /**
   * Disable blog publishing for a domain
   */
  static async disableBlogForDomain(domainId: string): Promise<void> {
    const { error } = await supabase
      .from('domains')
      .update({
        blog_enabled: false
      })
      .eq('id', domainId);

    if (error) {
      console.error('Error disabling blog for domain:', error);
      throw new Error(`Failed to disable blog: ${error.message}`);
    }
  }

  /**
   * Increment the published pages counter for a domain
   */
  static async incrementPublishedPages(domainId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_published_pages', {
      domain_id: domainId
    });

    if (error) {
      console.error('Error incrementing published pages:', error);
      // Don't throw error for this, it's just a counter
    }
  }

  /**
   * Get domains with blog enabled for campaign selection
   */
  static async getBlogEnabledDomains(): Promise<ValidatedDomain[]> {
    const { data, error } = await supabase
      .from('domains')
      .select('id, domain, status, blog_enabled, blog_subdirectory, pages_published')
      .eq('status', 'active')
      .eq('blog_enabled', true)
      .order('domain', { ascending: true });

    if (error) {
      console.error('Error fetching blog-enabled domains:', error);
      throw new Error(`Failed to fetch blog-enabled domains: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a blog post URL for a specific domain
   */
  static createBlogURL(domain: string, subdirectory: string = 'blog', slug?: string): string {
    let url = `https://${domain}/${subdirectory}`;
    if (slug) {
      url += `/${slug}`;
    }
    return url;
  }

  /**
   * Get blog publishing statistics for all domains
   */
  static async getBlogStats(): Promise<{
    total_domains: number;
    active_domains: number;
    blog_enabled_domains: number;
    total_pages_published: number;
  }> {
    const { data, error } = await supabase
      .from('domains')
      .select('status, blog_enabled, pages_published');

    if (error) {
      console.error('Error fetching blog stats:', error);
      throw new Error(`Failed to fetch blog stats: ${error.message}`);
    }

    const stats = {
      total_domains: data.length,
      active_domains: data.filter(d => d.status === 'active').length,
      blog_enabled_domains: data.filter(d => d.blog_enabled).length,
      total_pages_published: data.reduce((sum, d) => sum + (d.pages_published || 0), 0)
    };

    return stats;
  }
}

export default DomainBlogService;
