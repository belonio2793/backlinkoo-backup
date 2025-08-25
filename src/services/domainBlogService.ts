import { supabase } from '@/integrations/supabase/client';
import { DomainRoutingService } from './domainRoutingService';

export interface DomainBlogPost {
  id: string;
  domain_id: string;
  user_id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta_description?: string;
  target_url?: string;
  anchor_text?: string;
  keywords: string[];
  author_name: string;
  status: 'draft' | 'published' | 'archived';
  featured_image_url?: string;
  tags: string[];
  view_count: number;
  like_count: number;
  seo_score: number;
  reading_time: number;
  word_count: number;
  published_url: string;
  is_trial_post: boolean;
  expires_at?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
}

export interface CreateDomainBlogPost {
  domain_id: string;
  user_id?: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  meta_description?: string;
  target_url?: string;
  anchor_text?: string;
  keywords?: string[];
  author_name?: string;
  status?: 'draft' | 'published' | 'archived';
  featured_image_url?: string;
  tags?: string[];
  category_id?: string;
  is_trial_post?: boolean;
  expires_at?: string;
}

export interface DomainBlogPostGenerationData {
  title: string;
  content: string;
  targetUrl?: string;
  anchorText?: string;
  primaryKeyword?: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  customSlug?: string;
  excerpt?: string;
  metaDescription?: string;
  tags?: string[];
  categoryId?: string;
}

export class DomainBlogService {
  /**
   * Generate a unique slug from title with domain scope
   */
  private static generateSlug(title: string, domainId: string): string {
    const baseSlug = title
      .replace(/<[^>]*>/g, '') // Strip HTML tags first
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 45); // Leave room for suffix

    // Add timestamp for uniqueness within domain
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${timestamp}-${random}`;
  }

  /**
   * Extract keyword from title
   */
  private static extractKeywordFromTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .slice(0, 3)
      .join(' ');
  }

  /**
   * Generate tags from title and URL
   */
  private static generateTags(title: string, targetUrl?: string): string[] {
    const tags = [];
    
    // Extract tags from title
    const titleWords = title.toLowerCase().split(' ').filter(word => 
      word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will'].includes(word)
    );
    tags.push(...titleWords.slice(0, 3));
    
    // Add domain-based tag if target URL provided
    if (targetUrl) {
      try {
        const domain = new URL(targetUrl).hostname.replace('www.', '');
        tags.push(domain.split('.')[0]);
      } catch (e) {
        // Ignore invalid URLs
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Categorize content based on title
   */
  private static categorizeContent(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('tutorial') || lowerTitle.includes('guide') || lowerTitle.includes('how to')) {
      return 'Tutorial';
    } else if (lowerTitle.includes('news') || lowerTitle.includes('update') || lowerTitle.includes('announcement')) {
      return 'News';
    } else if (lowerTitle.includes('review') || lowerTitle.includes('comparison')) {
      return 'Review';
    } else if (lowerTitle.includes('tip') || lowerTitle.includes('best practice')) {
      return 'Tips';
    }
    
    return 'General';
  }

  /**
   * Calculate reading time based on word count
   */
  private static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Calculate word count
   */
  private static calculateWordCount(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate excerpt from content
   */
  private static generateExcerpt(content: string, maxLength: number = 160): string {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    const excerpt = plainText.substring(0, maxLength);
    const lastSpace = excerpt.lastIndexOf(' ');
    return lastSpace > 100 ? excerpt.substring(0, lastSpace) + '...' : excerpt + '...';
  }

  /**
   * Create a new domain blog post
   */
  static async createDomainBlogPost(
    data: DomainBlogPostGenerationData,
    domainId: string,
    userId?: string
  ): Promise<{ post: DomainBlogPost | null; error: string | null }> {
    try {
      // Get domain context for URL generation
      const domain = await DomainRoutingService.getDomainByHostname();
      if (!domain && domainId) {
        // Fallback: get domain info directly
        const { data: domainData } = await supabase
          .from('domains')
          .select('domain, site_url, blog_subdirectory')
          .eq('id', domainId)
          .single();
        
        if (!domainData) {
          return { post: null, error: 'Domain not found' };
        }
      }

      // Generate slug if not provided
      const slug = data.customSlug || this.generateSlug(data.title, domainId);

      // Calculate metrics
      const wordCount = data.wordCount || this.calculateWordCount(data.content);
      const readingTime = data.readingTime || this.calculateReadingTime(data.content);
      const excerpt = data.excerpt || this.generateExcerpt(data.content);

      // Generate published URL
      let published_url = '';
      if (domain) {
        published_url = DomainRoutingService.generateBlogUrl(domain, slug);
      } else {
        // Fallback URL generation
        published_url = `https://example.com/blog/${slug}`;
      }

      const blogPostData: CreateDomainBlogPost = {
        domain_id: domainId,
        user_id: userId || null,
        title: data.title,
        slug,
        content: data.content,
        excerpt,
        meta_description: data.metaDescription || excerpt,
        target_url: data.targetUrl || '',
        anchor_text: data.anchorText || data.title,
        keywords: data.primaryKeyword ? [data.primaryKeyword] : [this.extractKeywordFromTitle(data.title)],
        author_name: 'Blog Author',
        status: 'published',
        tags: data.tags || this.generateTags(data.title, data.targetUrl),
        view_count: 0,
        like_count: 0,
        seo_score: data.seoScore || 75,
        reading_time: readingTime,
        word_count: wordCount,
        category_id: data.categoryId,
        is_trial_post: false
      };

      const { data: insertedPost, error } = await supabase
        .from('domain_blog_posts')
        .insert({
          ...blogPostData,
          published_url,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating domain blog post:', error);
        return { post: null, error: error.message };
      }

      return { post: insertedPost as DomainBlogPost, error: null };

    } catch (error: any) {
      console.error('Error creating domain blog post:', error);
      return { post: null, error: error.message };
    }
  }

  /**
   * Get domain blog posts with filtering
   */
  static async getDomainBlogPosts(
    domainId: string,
    options: {
      limit?: number;
      offset?: number;
      categoryId?: string;
      status?: string;
      tags?: string[];
    } = {}
  ): Promise<{ posts: DomainBlogPost[]; error: string | null }> {
    try {
      let query = supabase
        .from('domain_blog_posts')
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

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      query = query
        .order('published_at', { ascending: false })
        .limit(options.limit || 10);

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { posts: [], error: error.message };
      }

      return { posts: data || [], error: null };

    } catch (error: any) {
      return { posts: [], error: error.message };
    }
  }

  /**
   * Get domain blog post by slug
   */
  static async getDomainBlogPostBySlug(
    domainId: string,
    slug: string
  ): Promise<{ post: DomainBlogPost | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('domain_blog_posts')
        .select(`
          *,
          domain_blog_categories(name, slug, color)
        `)
        .eq('domain_id', domainId)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        return { post: null, error: error.message };
      }

      // Increment view count
      await supabase
        .from('domain_blog_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return { post: data as DomainBlogPost, error: null };

    } catch (error: any) {
      return { post: null, error: error.message };
    }
  }

  /**
   * Update domain blog post
   */
  static async updateDomainBlogPost(
    postId: string,
    updates: Partial<CreateDomainBlogPost>
  ): Promise<{ post: DomainBlogPost | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('domain_blog_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        return { post: null, error: error.message };
      }

      return { post: data as DomainBlogPost, error: null };

    } catch (error: any) {
      return { post: null, error: error.message };
    }
  }

  /**
   * Delete domain blog post
   */
  static async deleteDomainBlogPost(postId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('domain_blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get domain blog statistics
   */
  static async getDomainBlogStats(domainId: string): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalViews: number;
    totalLikes: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('domain_blog_posts')
        .select('status, view_count, like_count')
        .eq('domain_id', domainId);

      if (error) {
        return {
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
          totalViews: 0,
          totalLikes: 0,
          error: error.message
        };
      }

      const stats = data.reduce((acc, post) => {
        acc.totalPosts++;
        if (post.status === 'published') acc.publishedPosts++;
        if (post.status === 'draft') acc.draftPosts++;
        acc.totalViews += post.view_count || 0;
        acc.totalLikes += post.like_count || 0;
        return acc;
      }, {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        totalLikes: 0
      });

      return { ...stats, error: null };

    } catch (error: any) {
      return {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        error: error.message
      };
    }
  }
}

export default DomainBlogService;
