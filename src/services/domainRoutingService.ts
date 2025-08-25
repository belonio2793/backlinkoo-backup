import { supabase } from '@/integrations/supabase/client';

export interface DomainContext {
  id: string;
  domain: string;
  site_url: string;
  blog_subdirectory: string;
  blog_enabled: boolean;
  blog_settings?: DomainBlogSettings;
}

export interface DomainBlogSettings {
  id: string;
  domain_id: string;
  blog_title: string;
  blog_description: string;
  blog_logo_url?: string;
  theme_primary_color: string;
  theme_secondary_color: string;
  posts_per_page: number;
  enable_comments: boolean;
  enable_social_sharing: boolean;
  custom_css?: string;
  meta_tags: Record<string, any>;
}

export interface DomainBlogCategory {
  id: string;
  domain_id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

export class DomainRoutingService {
  private static currentDomain: DomainContext | null = null;
  private static domainCache = new Map<string, DomainContext>();
  
  /**
   * Get current hostname from browser or server context
   */
  static getCurrentHostname(): string {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    
    // Server-side fallback or default
    return 'localhost';
  }
  
  /**
   * Get domain context by hostname with caching
   */
  static async getDomainByHostname(hostname?: string): Promise<DomainContext | null> {
    const targetHostname = hostname || this.getCurrentHostname();
    
    // Check cache first
    if (this.domainCache.has(targetHostname)) {
      return this.domainCache.get(targetHostname) || null;
    }
    
    try {
      // Query domains table for the hostname
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select(`
          id,
          domain,
          site_url,
          blog_subdirectory,
          blog_enabled
        `)
        .eq('domain', targetHostname)
        .eq('blog_enabled', true)
        .single();
      
      if (domainError || !domainData) {
        console.log(`🌐 Domain ${targetHostname} not found or blog disabled`);
        return null;
      }
      
      // Get blog settings for this domain
      const { data: settingsData } = await supabase
        .from('domain_blog_settings')
        .select('*')
        .eq('domain_id', domainData.id)
        .single();
      
      const domainContext: DomainContext = {
        id: domainData.id,
        domain: domainData.domain,
        site_url: domainData.site_url || `https://${domainData.domain}`,
        blog_subdirectory: domainData.blog_subdirectory || '/blog',
        blog_enabled: domainData.blog_enabled,
        blog_settings: settingsData || undefined
      };
      
      // Cache the result
      this.domainCache.set(targetHostname, domainContext);
      
      console.log(`✅ Domain context loaded for ${targetHostname}:`, domainContext);
      return domainContext;
      
    } catch (error) {
      console.error(`❌ Error loading domain context for ${targetHostname}:`, error);
      return null;
    }
  }
  
  /**
   * Get current domain context
   */
  static async getCurrentDomain(): Promise<DomainContext | null> {
    if (this.currentDomain) {
      return this.currentDomain;
    }
    
    this.currentDomain = await this.getDomainByHostname();
    return this.currentDomain;
  }
  
  /**
   * Set current domain context (useful for testing or SSR)
   */
  static setCurrentDomain(domain: DomainContext | null): void {
    this.currentDomain = domain;
  }
  
  /**
   * Generate blog URL for a specific domain and post slug
   */
  static generateBlogUrl(domain: DomainContext, slug: string): string {
    const baseUrl = domain.site_url || `https://${domain.domain}`;
    const blogPath = domain.blog_subdirectory || '/blog';
    return `${baseUrl}${blogPath}/${slug}`;
  }
  
  /**
   * Generate blog listing URL for a domain
   */
  static generateBlogListingUrl(domain: DomainContext): string {
    const baseUrl = domain.site_url || `https://${domain.domain}`;
    const blogPath = domain.blog_subdirectory || '/blog';
    return `${baseUrl}${blogPath}`;
  }
  
  /**
   * Get all blog categories for a domain
   */
  static async getDomainBlogCategories(domainId: string): Promise<DomainBlogCategory[]> {
    try {
      const { data, error } = await supabase
        .from('domain_blog_categories')
        .select('*')
        .eq('domain_id', domainId)
        .order('name');
      
      if (error) {
        console.error('Error loading domain blog categories:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error loading domain blog categories:', error);
      return [];
    }
  }
  
  /**
   * Get blog posts for a specific domain
   */
  static async getDomainBlogPosts(
    domainId: string, 
    options: {
      limit?: number;
      offset?: number;
      categoryId?: string;
      status?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          domain_blog_categories(name, slug, color)
        `)
        .eq('domain_id', domainId);
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      
      query = query
        .order('published_at', { ascending: false })
        .limit(options.limit || 10);
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading domain blog posts:', error);
        return { posts: [], error: error.message };
      }
      
      return { posts: data || [], error: null };
    } catch (error: any) {
      console.error('Error loading domain blog posts:', error);
      return { posts: [], error: error.message };
    }
  }
  
  /**
   * Get a single blog post by slug for a specific domain
   */
  static async getDomainBlogPostBySlug(domainId: string, slug: string) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          domain_blog_categories(name, slug, color)
        `)
        .eq('domain_id', domainId)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) {
        console.error('Error loading blog post by slug:', error);
        return { post: null, error: error.message };
      }
      
      return { post: data, error: null };
    } catch (error: any) {
      console.error('Error loading blog post by slug:', error);
      return { post: null, error: error.message };
    }
  }
  
  /**
   * Create a blog post for a specific domain
   */
  static async createDomainBlogPost(
    domainId: string,
    postData: {
      title: string;
      content: string;
      slug?: string;
      target_url?: string;
      anchor_text?: string;
      keywords?: string[];
      category_id?: string;
      meta_description?: string;
      author_name?: string;
      is_trial_post?: boolean;
    },
    userId?: string
  ) {
    try {
      const domain = await this.getDomainByHostname();
      if (!domain) {
        throw new Error('Domain context not found');
      }
      
      // Generate slug if not provided
      const slug = postData.slug || this.generateSlugFromTitle(postData.title);
      
      // Generate published URL
      const published_url = this.generateBlogUrl(domain, slug);
      
      const blogPost = {
        domain_id: domainId,
        user_id: userId || null,
        title: postData.title,
        slug,
        content: postData.content,
        target_url: postData.target_url || '',
        anchor_text: postData.anchor_text || postData.title,
        keywords: postData.keywords || [],
        category_id: postData.category_id || null,
        meta_description: postData.meta_description || postData.title,
        published_url,
        status: 'published',
        is_trial_post: postData.is_trial_post || false,
        author_name: postData.author_name || 'Blog Author',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(blogPost)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating domain blog post:', error);
        return { post: null, error: error.message };
      }
      
      return { post: data, error: null };
    } catch (error: any) {
      console.error('Error creating domain blog post:', error);
      return { post: null, error: error.message };
    }
  }
  
  /**
   * Generate URL-friendly slug from title
   */
  private static generateSlugFromTitle(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 45);
    
    // Add timestamp for uniqueness
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
  }
  
  /**
   * Clear domain cache (useful for development or when domains change)
   */
  static clearCache(): void {
    this.domainCache.clear();
    this.currentDomain = null;
    console.log('🧹 Domain routing cache cleared');
  }
  
  /**
   * Initialize domain routing for current hostname
   */
  static async initialize(): Promise<DomainContext | null> {
    const hostname = this.getCurrentHostname();
    console.log(`🚀 Initializing domain routing for: ${hostname}`);
    
    const domain = await this.getDomainByHostname(hostname);
    if (domain) {
      console.log(`✅ Domain routing initialized for ${domain.domain}`);
      this.setCurrentDomain(domain);
    } else {
      console.log(`⚠️ No domain configuration found for ${hostname}`);
    }
    
    return domain;
  }
  
  /**
   * Check if current hostname has multi-domain blog enabled
   */
  static async isMultiDomainBlogEnabled(): Promise<boolean> {
    const domain = await this.getCurrentDomain();
    return domain?.blog_enabled || false;
  }
  
  /**
   * Get fallback domain (useful for localhost development)
   */
  static async getFallbackDomain(): Promise<DomainContext | null> {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select(`
          id,
          domain,
          site_url,
          blog_subdirectory,
          blog_enabled
        `)
        .eq('blog_enabled', true)
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        domain: data.domain,
        site_url: data.site_url || `https://${data.domain}`,
        blog_subdirectory: data.blog_subdirectory || '/blog',
        blog_enabled: data.blog_enabled
      };
    } catch (error) {
      console.error('Error getting fallback domain:', error);
      return null;
    }
  }
}

export default DomainRoutingService;
