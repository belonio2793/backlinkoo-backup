import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { blogPersistenceService } from './blogPersistenceService';
import { SEOAnalyzer } from './seoAnalyzer';
import { formatErrorForUI } from '@/utils/errorUtils';
import { applyBeautifulContentStructure } from '@/utils/forceBeautifulContentStructure';
import { emergencyBlogService } from './emergencyBlogService';

export type BlogPost = Tables<'blog_posts'>;
export type CreateBlogPost = TablesInsert<'blog_posts'>;
export type UpdateBlogPost = TablesUpdate<'blog_posts'>;

export interface BlogPostGenerationData {
  title: string;
  content: string;
  targetUrl: string;
  anchorText?: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
  customSlug?: string; // Allow custom slug override
}

export class BlogService {
  /**
   * Generate a unique slug from title with enhanced collision resistance
   */
  private generateSlug(title: string): string {
    const baseSlug = title
      .replace(/<[^>]*>/g, '') // Strip HTML tags first
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 45); // Leave room for suffix

    // Add high-entropy suffix for guaranteed uniqueness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 11); // 9 chars
    const extra = Math.random().toString(36).substring(2, 6); // Additional entropy for browser
    return `${baseSlug}-${timestamp}-${random}-${extra}`;
  }

  /**
   * Create a new blog post with enhanced persistence
   * Uses maximum persistence for claimed posts
   */
  async createBlogPost(
    data: BlogPostGenerationData,
    userId?: string,
    isTrialPost: boolean = false
  ): Promise<BlogPost> {
    try {
      // Use database trigger approach: let database handle slug generation
      // If database doesn't have trigger, fallback to service-level generation
      const customSlug = data.customSlug || null; // Let database trigger handle it first

    // AUTOMATICALLY apply beautiful content structure to all new blog posts
    console.log('🎨 Applying beautiful content structure to new blog post...');
    const beautifulContent = applyBeautifulContentStructure(data.content, data.title);

    const blogPostData: CreateBlogPost = {
      user_id: userId || null,
      title: data.title,
      slug: customSlug, // null triggers database slug generation
      content: beautifulContent, // Use beautifully formatted content
      target_url: data.targetUrl,
      anchor_text: data.anchorText,
      // published_url will be set after database generates slug
      status: 'published',
      is_trial_post: isTrialPost,
      expires_at: isTrialPost ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      view_count: 0,
      seo_score: data.seoScore,
      reading_time: data.readingTime,
      word_count: data.wordCount,
      author_name: 'Backlink ∞ ',
      tags: this.generateTags(data.title, data.targetUrl),
      category: this.categorizeContent(data.title)
    };

    // If this is a claimed post (has userId and not trial), use maximum persistence
    if (userId && !isTrialPost) {
      console.log('🔒 Creating claimed post with maximum persistence...');
      const persistenceResult = await blogPersistenceService.storeWithMaxPersistence(
        blogPostData,
        'claim'
      );

      if (!persistenceResult.success) {
        throw new Error(`Failed to create blog post with maximum persistence: ${formatErrorForUI(persistenceResult.error)}`);
      }

      return persistenceResult.data!;
    }

    // For trial posts, attempt normal creation
    console.log('🔓 Attempting blog post creation...');

    // Remove any custom id field to let database auto-generate UUID
    const { id: _, ...cleanBlogPostData } = blogPostData as any;

    let result;
    try {
      // Primary save to published_blog_posts table
      result = await supabase
        .from('published_blog_posts')
        .insert(cleanBlogPostData)
        .select();

      // Also save to blog_posts for backward compatibility
      try {
        await supabase
          .from('blog_posts')
          .insert(cleanBlogPostData);
        console.log('✅ [BlogService] Also saved to blog_posts for compatibility');
      } catch (backupError) {
        console.warn('⚠️ [BlogService] Backup save to blog_posts failed:', this.getSafeErrorMessage(backupError));
      }

    } catch (networkError: any) {
      console.error('❌ Network error during blog post creation:', networkError);
      throw new Error(`Network error: ${networkError.message || 'Failed to connect to database'}`);
    }

    const { data: blogPostArray, error } = result;
    const blogPost = blogPostArray?.[0] || null;

    if (error || !blogPost) {
      // Handle slug collision with enhanced retry strategy
      if (error && (error.message.includes('slug') || error.message.includes('duplicate key value violates unique constraint') || error.message.includes('null value in column "slug"'))) {
        console.warn('⚠️ Slug issue detected, implementing fallback strategy...');

        // Fallback: Generate service-level slug with maximum uniqueness
        const fallbackSlug = this.generateSlug(data.title);
        const retryData = { ...cleanBlogPostData, slug: fallbackSlug };

        let retryResult;
        try {
          retryResult = await supabase
            .from('published_blog_posts')
            .insert(retryData)
            .select();

          // Also save to blog_posts for backward compatibility
          try {
            await supabase
              .from('blog_posts')
              .insert(retryData);
          } catch (backupError) {
            // Handle stream errors gracefully
            const errorMessage = this.getSafeErrorMessage(backupError);
            console.warn('⚠️ [BlogService] Backup retry save to blog_posts failed:', errorMessage);
          }

        } catch (networkError: any) {
          console.error('❌ Network error during retry:', networkError);
          throw new Error(`Network error on retry: ${networkError.message || 'Failed to connect to database'}`);
        }

        const { data: retryPostArray, error: retryError } = retryResult;

        const retryPost = retryPostArray?.[0] || null;

        if (retryError || !retryPost) {
          // Final attempt with timestamp
          if (retryError && retryError.message && retryError.message.includes('slug')) {
            const finalSlug = `${fallbackSlug}-${Date.now()}`;
            const finalData = { ...cleanBlogPostData, slug: finalSlug };

            let finalResult;
            try {
              finalResult = await supabase
                .from('published_blog_posts')
                .insert(finalData)
                .select();

              // Also save to blog_posts for backward compatibility
              try {
                await supabase
                  .from('blog_posts')
                  .insert(finalData);
              } catch (backupError) {
                console.warn('⚠️ [BlogService] Backup final save to blog_posts failed:', this.getSafeErrorMessage(backupError));
              }
            } catch (networkError: any) {
              console.error('❌ Network error during final retry:', networkError);
              throw new Error(`Network error on final retry: ${networkError.message || 'Failed to connect to database'}`);
            }

            const { data: finalPostArray, error: finalError } = finalResult;

            const finalPost = finalPostArray?.[0] || null;

            if (finalError || !finalPost) {
              throw new Error(`Failed to create blog post after multiple retries: ${finalError?.message || 'No data returned'}`);
            }

            console.log('✅ Blog post created successfully after final retry');
            return finalPost;
          }
          throw new Error(`Failed to create blog post after slug retry: ${retryError.message}`);
        }

        console.log('✅ Blog post created successfully after slug retry');
        return retryPost;
      }

      if (error && (error.message.includes('row-level security') || error.message.includes('policy'))) {
        console.error('🚨 RLS POLICY IS BLOCKING BLOG POST CREATION');
        console.error('');
        console.error('📋 MANUAL FIX REQUIRED:');
        console.error('1. Go to your Supabase Dashboard');
        console.error('2. Open SQL Editor');
        console.error('3. Execute: ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;');
        console.error('4. Execute: GRANT ALL ON blog_posts TO PUBLIC;');
        console.error('5. Refresh this page');

        throw new Error('RLS policy blocking blog creation. Manual SQL execution required in Supabase: ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY; GRANT ALL ON blog_posts TO PUBLIC;');
      }

      if (error) {
        throw new Error(`Failed to create blog post: ${error.message}`);
      } else {
        throw new Error('Failed to create blog post: No data returned from database');
      }
    }

    console.log('✅ Blog post created successfully');

    // Create backup for trial posts too
    // Trial posts are created directly - no additional backup needed since they expire

    return blogPost;
    } catch (error: any) {
      console.error('Blog post creation failed:', error);
      throw new Error(`Failed to create blog post: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get blog post by slug with complete stream isolation
   */
  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    console.log('🔍 [BlogService] Fetching blog post by slug:', slug);

    // Create multiple isolated approaches to avoid stream conflicts
    const approaches = [
      () => this.fetchWithIsolatedClient(slug, 'published_blog_posts'),
      () => this.fetchWithIsolatedClient(slug, 'blog_posts'),
      () => this.fetchWithBasicQuery(slug, 'published_blog_posts'),
      () => this.fetchWithBasicQuery(slug, 'blog_posts')
    ];

    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`��� [BlogService] Trying approach ${i + 1}/${approaches.length}`);
        const result = await approaches[i]();

        if (result) {
          console.log(`✅ [BlogService] Success with approach ${i + 1}`);
          // Increment view count in background (don't await to avoid blocking)
          this.incrementViewCount(slug, i < 2 ? 'published_blog_posts' : 'blog_posts').catch(() => {});
          return result;
        }
      } catch (error: any) {
        console.warn(`⚠️ [BlogService] Approach ${i + 1} failed:`, this.getSafeErrorMessage(error));

        // If this is the last approach, try emergency service
        if (i === approaches.length - 1) {
          console.log('🚨 [BlogService] All approaches failed, trying emergency service...');

          try {
            const emergencyResult = await emergencyBlogService.emergencyFetchBySlug(slug);
            if (emergencyResult) {
              console.log('✅ [BlogService] Emergency service succeeded');
              return emergencyResult as BlogPost;
            }
          } catch (emergencyError) {
            console.error('❌ [BlogService] Emergency service also failed:', this.getSafeErrorMessage(emergencyError));
          }

          console.error('❌ [BlogService] All methods failed, returning null');
          return null;
        }
      }
    }

    return null;
  }

  /**
   * Fetch using isolated client approach
   */
  private async fetchWithIsolatedClient(slug: string, tableName: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(this.getSafeErrorMessage(error));
    }

    return data;
  }

  /**
   * Fetch using basic query with minimal fields
   */
  private async fetchWithBasicQuery(slug: string, tableName: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, slug, title, content, status, created_at, updated_at, user_id, target_url, published_url, view_count, seo_score, reading_time, word_count, author_name, tags, category, is_trial_post, expires_at, anchor_text, is_claimed, claimed_by, claimed_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(this.getSafeErrorMessage(error));
    }

    // Map to expected format if needed
    return {
      ...data,
      // Ensure compatibility with both table schemas
      claimed: data.is_claimed || false,
      meta_description: data.meta_description || '',
      excerpt: data.excerpt || '',
      keywords: data.keywords || [],
      published_at: data.published_at || data.created_at
    } as BlogPost;
  }

  /**
   * Check if error is related to response stream issues
   */
  private isStreamError(error: any): boolean {
    if (!error || !error.message) return false;
    const message = error.message.toLowerCase();
    return message.includes('body stream already read') ||
           message.includes('body used already') ||
           message.includes('response body stream') ||
           message.includes('failed to execute \'text\' on \'response\'');
  }

  /**
   * Extract safe error message without exposing Response objects
   */
  private getSafeErrorMessage(error: any): string {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.error_description) return error.error_description;
    return 'Unknown error occurred';
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
   * Update a blog post with persistence protection
   */
  async updateBlogPost(id: string, updates: UpdateBlogPost): Promise<BlogPost> {
    // If title is being updated, regenerate slug
    if (updates.title) {
      const baseSlug = this.generateSlug(updates.title);
      const { data: uniqueSlugData, error: slugError } = await supabase
        .rpc('generate_unique_slug', { base_slug: baseSlug });

      if (!slugError && uniqueSlugData) {
        updates.slug = uniqueSlugData as string;
        updates.published_url = `/blog/${updates.slug}`;
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

    // If this update involves claiming (user_id added and trial status removed)
    if (updates.user_id && updates.is_trial_post === false) {
      console.log('🔒 Post being claimed - creating permanent backup...');
      try {
        await blogPersistenceService.storeWithMaxPersistence(data, 'claim');
      } catch (backupError) {
        console.warn('⚠️ Claim backup failed (non-critical):', backupError);
      }
    }

    return data;
  }

  /**
   * Get all blog posts
   */
  async getAllBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch all blog posts:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete blog post:', error.message);
      return false;
    }

    return true;
  }

  /**
   * Get recent published blog posts
   */
  async getRecentBlogPosts(limit: number = 10): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Handle third-party interference gracefully
        if (error.message?.includes('Third-party script interference')) {
          console.warn('⚠️ Third-party interference detected in getRecentBlogPosts, returning empty array');
          return [];
        }
        throw new Error(`Failed to fetch recent blog posts: ${error.message}`);
      }

      return data || [];
    } catch (networkError: any) {
      console.warn('⚠️ Network error in getRecentBlogPosts:', networkError.message);
      // Return empty array instead of throwing to prevent cascade failures
      return [];
    }
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
      .or(`title.ilike.%${query}%, content.ilike.%${query}%, tags.cs.{${query}}`)
      .order('created_at', { ascending: false })
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
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch blog posts by category: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Increment view count
   */
  private async incrementViewCount(slug: string, tableName: string = 'blog_posts'): Promise<void> {
    try {
      // Try using the RPC function first (works for both tables)
      let rpcFunction = '';
      if (tableName === 'published_blog_posts') {
        rpcFunction = 'increment_published_blog_post_views';
      } else {
        rpcFunction = 'increment_blog_post_views';
      }

      const { error } = await supabase.rpc(rpcFunction, { post_slug: slug });

      if (error) {
        // Check if it's a missing function error and use fallback
        if (error.code === '42883' || error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
          console.log(`View increment function ${rpcFunction} not available, using direct update on ${tableName}`);
        } else {
          console.warn('View increment function failed:', error.message);
        }

        // Fallback: direct update on the correct table
        await supabase
          .from(tableName)
          .update({ view_count: supabase.sql`view_count + 1` })
          .eq('slug', slug)
          .eq('status', 'published');
      }
    } catch (error) {
      console.warn(`Failed to increment view count for ${tableName}:`, error);
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
    try {
      let query = supabase.from('blog_posts').select('status, view_count, is_trial_post');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        // Handle third-party interference gracefully
        if (error.message?.includes('Third-party script interference')) {
          console.warn('⚠️ Third-party interference detected in getBlogPostStats, returning default stats');
          return { total: 0, published: 0, drafts: 0, totalViews: 0, trialPosts: 0 };
        }
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
    } catch (networkError: any) {
      console.warn('⚠️ Network error in getBlogPostStats:', networkError.message);
      // Return default stats instead of throwing to prevent cascade failures
      return { total: 0, published: 0, drafts: 0, totalViews: 0, trialPosts: 0 };
    }
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
