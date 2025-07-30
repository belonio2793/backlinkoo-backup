import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type BlogPost = Tables<'blog_posts'>;
export type CreateBlogPost = TablesInsert<'blog_posts'>;
export type UpdateBlogPost = TablesUpdate<'blog_posts'>;

export interface BlogPostGenerationData {
  title: string;
  content: string;
  keywords: string[];
  targetUrl: string;
  anchorText?: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  metaDescription?: string;
  contextualLinks?: any[];
}

export class BlogService {
  /**
   * Generate a unique slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 50);
  }

  /**
   * Create a new blog post
   */
  async createBlogPost(
    data: BlogPostGenerationData,
    userId?: string,
    isTrialPost: boolean = false
  ): Promise<BlogPost> {
    const baseSlug = this.generateSlug(data.title);
    
    // Generate unique slug using database function
    const { data: uniqueSlugData, error: slugError } = await supabase
      .rpc('generate_unique_slug', { base_slug: baseSlug });

    if (slugError) {
      throw new Error(`Failed to generate unique slug: ${slugError.message}`);
    }

    const uniqueSlug = uniqueSlugData as string;
    const publishedUrl = `${window.location.origin}/blog/${uniqueSlug}`;

    const blogPostData: CreateBlogPost = {
      user_id: userId || null,
      title: data.title,
      slug: uniqueSlug,
      content: data.content,
      meta_description: data.metaDescription,
      keywords: data.keywords,
      tags: this.generateTags(data.title, data.targetUrl),
      category: this.categorizeContent(data.keywords.join(' ')),
      target_url: data.targetUrl,
      anchor_text: data.anchorText,
      published_url: publishedUrl,
      status: 'published',
      is_trial_post: isTrialPost,
      expires_at: isTrialPost ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      view_count: 0,
      seo_score: data.seoScore,
      reading_time: data.readingTime,
      word_count: data.wordCount,
      featured_image: this.generateFeaturedImage(data.keywords[0] || 'blog'),
      author_name: 'AI Generator',
      contextual_links: data.contextualLinks || [],
      published_at: new Date().toISOString()
    };

    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create blog post: ${error.message}`);
    }

    return blogPost;
  }

  /**
   * Get blog post by slug
   */
  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to fetch blog post: ${error.message}`);
    }

    // Increment view count
    await this.incrementViewCount(slug);

    return data;
  }

  /**
   * Get blog post by ID
   */
  async getBlogPostById(id: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch blog post: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a blog post
   */
  async updateBlogPost(id: string, updates: UpdateBlogPost): Promise<BlogPost> {
    // If title is being updated, regenerate slug
    if (updates.title) {
      const baseSlug = this.generateSlug(updates.title);
      const { data: uniqueSlugData, error: slugError } = await supabase
        .rpc('generate_unique_slug', { base_slug: baseSlug });

      if (!slugError && uniqueSlugData) {
        updates.slug = uniqueSlugData as string;
        updates.published_url = `${window.location.origin}/blog/${updates.slug}`;
      }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update blog post: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete blog post: ${error.message}`);
    }
  }

  /**
   * Get recent published blog posts
   */
  async getRecentBlogPosts(limit: number = 10): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent blog posts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's blog posts
   */
  async getUserBlogPosts(userId: string): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user blog posts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search blog posts
   */
  async searchBlogPosts(query: string, limit: number = 20): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%, content.ilike.%${query}%, keywords.cs.{${query}}`)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search blog posts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get blog posts by category
   */
  async getBlogPostsByCategory(category: string, limit: number = 20): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch blog posts by category: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Increment view count
   */
  private async incrementViewCount(slug: string): Promise<void> {
    try {
      await supabase.rpc('increment_blog_post_views', { post_slug: slug });
    } catch (error) {
      console.warn('Failed to increment view count:', error);
    }
  }

  /**
   * Generate tags from title and URL
   */
  private generateTags(title: string, targetUrl: string): string[] {
    const domain = new URL(targetUrl).hostname.replace('www.', '');
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);
    const topWords = titleWords.slice(0, 3);
    
    return [...topWords, domain, 'seo', 'backlink'];
  }

  /**
   * Categorize content based on keywords
   */
  private categorizeContent(keywords: string): string {
    const lowerKeywords = keywords.toLowerCase();
    
    if (lowerKeywords.includes('marketing') || lowerKeywords.includes('seo')) {
      return 'Digital Marketing';
    } else if (lowerKeywords.includes('tech') || lowerKeywords.includes('software')) {
      return 'Technology';
    } else if (lowerKeywords.includes('business') || lowerKeywords.includes('startup')) {
      return 'Business';
    } else if (lowerKeywords.includes('health') || lowerKeywords.includes('fitness')) {
      return 'Health & Wellness';
    } else if (lowerKeywords.includes('travel') || lowerKeywords.includes('tourism')) {
      return 'Travel';
    } else if (lowerKeywords.includes('finance') || lowerKeywords.includes('money')) {
      return 'Finance';
    } else if (lowerKeywords.includes('food') || lowerKeywords.includes('recipe')) {
      return 'Food & Lifestyle';
    } else if (lowerKeywords.includes('education') || lowerKeywords.includes('learning')) {
      return 'Education';
    } else {
      return 'General';
    }
  }

  /**
   * Generate featured image URL
   */
  private generateFeaturedImage(keyword: string): string {
    const encodedKeyword = encodeURIComponent(keyword);
    return `https://images.unsplash.com/1600x900/?${encodedKeyword}&auto=format&fit=crop`;
  }

  /**
   * Clean up expired trial posts
   */
  async cleanupExpiredTrialPosts(): Promise<number> {
    const { data, error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('is_trial_post', true)
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup expired trial posts: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get blog post statistics
   */
  async getBlogPostStats(userId?: string): Promise<{
    total: number;
    published: number;
    drafts: number;
    totalViews: number;
    trialPosts: number;
  }> {
    let query = supabase.from('blog_posts').select('status, view_count, is_trial_post');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch blog post stats: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      published: data?.filter(p => p.status === 'published').length || 0,
      drafts: data?.filter(p => p.status === 'draft').length || 0,
      totalViews: data?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0,
      trialPosts: data?.filter(p => p.is_trial_post).length || 0
    };

    return stats;
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error && error.code === 'PGRST116') {
      return true; // No rows found, slug is available
    }

    return false; // Slug exists or other error
  }
}

export const blogService = new BlogService();
