/**
 * Claimable Blog Service - Implements the end-to-end blog claiming system
 * Handles blog generation, claiming, expiration, and user limits
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface ClaimableBlogData {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  title: string;
  content: string;
  excerpt?: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
}

export interface ClaimResult {
  success: boolean;
  message: string;
  claimedCount?: number;
  needsUpgrade?: boolean;
}

export interface BlogGenerationResult {
  success: boolean;
  blogPost?: any;
  publishedUrl?: string;
  error?: string;
}

export class ClaimableBlogService {
  /**
   * Generate a unique slug from title with maximum collision resistance
   */
  private static generateSlug(title: string): string {
    const baseSlug = title
      // Strip HTML tags first
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 40); // Leave more room for uniqueness suffix

    // Maximum entropy approach for guaranteed uniqueness
    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2, 9);
    const random2 = Math.random().toString(36).substring(2, 7);
    const counter = Math.floor(Math.random() * 9999).toString(36);

    return `${baseSlug}-${timestamp}-${random1}-${random2}-${counter}`;
  }

  /**
   * Generate and publish a new blog post (open to public)
   */
  static async generateAndPublishBlog(data: ClaimableBlogData, user?: User): Promise<BlogGenerationResult> {
    try {
      console.log('🚀 Generating and publishing blog post:', data.keyword);

      // Try database trigger approach first, fallback to service generation
      const slug = null; // Let database trigger handle slug generation

      // Set expiration to 24 hours from now for unclaimed posts
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const blogPostData = {
        user_id: user?.id || null,
        slug, // null triggers database slug generation
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 200) + '...',
        anchor_text: data.anchorText,
        target_url: data.targetUrl,
        // published_url will be set after we get the generated slug
        status: 'published',
        is_claimed: false,
        claimed_by: null,
        claimed_at: null,
        expires_at: expiresAt, // 24-hour expiration for unclaimed posts
        view_count: 0,
        seo_score: data.seoScore,
        reading_time: data.readingTime,
        word_count: data.wordCount,
        author_name: user ? 'AI Generator' : 'Anonymous',
        tags: this.generateTags(data.keyword),
        category: this.categorizeContent(data.keyword),
        published_at: new Date().toISOString()
      };

      // Insert into blog_posts table (unified approach)
      // Remove any custom id field to let database auto-generate UUID
      const { id: _, ...cleanBlogPostData } = blogPostData as any;

      const { data: blogPost, error } = await supabase
        .from('blog_posts')
        .insert(cleanBlogPostData)
        .select()
        .single();

      if (error) {
        // Handle any slug-related errors with comprehensive fallback
        if (error.message.includes('blog_posts_slug_key') || error.message.includes('duplicate key value violates unique constraint') || error.message.includes('null value in column "slug"')) {
          console.warn('⚠️ Slug generation issue detected, implementing fallback strategy...');

          // First fallback: Generate service-level slug
          const fallbackSlug = this.generateSlug(data.title);
          const retryData = { ...cleanBlogPostData, slug: fallbackSlug };

          const { data: retryPost, error: retryError } = await supabase
            .from('blog_posts')
            .insert(retryData)
            .select()
            .single();

          if (retryError) {
            // Second fallback: Add timestamp to ensure uniqueness
            if (retryError.message.includes('blog_posts_slug_key')) {
              console.warn('⚠️ Second slug collision, using timestamp fallback...');

              const timestampSlug = `${fallbackSlug}-emergency-${Date.now()}`;
              const emergencyData = { ...cleanBlogPostData, slug: timestampSlug };

              const { data: emergencyPost, error: emergencyError } = await supabase
                .from('blog_posts')
                .insert(emergencyData)
                .select()
                .single();

              if (emergencyError) {
                console.error('❌ Failed to publish blog post after all retries:', emergencyError);
                return {
                  success: false,
                  error: `Failed to publish blog post after all retries: ${emergencyError.message}`
                };
              }

              const emergencyUrl = `${window.location.origin}/blog/${emergencyPost.slug}`;
              console.log('✅ Blog post published with emergency fallback:', emergencyUrl);

              return {
                success: true,
                blogPost: emergencyPost,
                publishedUrl: emergencyUrl
              };
            }

            console.error('❌ Failed to publish blog post after slug retry:', retryError);
            return {
              success: false,
              error: `Failed to publish blog post after retry: ${retryError.message}`
            };
          }

          // Generate publishedUrl using the database-generated slug
          const publishedUrl = `${window.location.origin}/blog/${retryPost.slug}`;

          console.log('✅ Blog post published successfully after slug retry:', publishedUrl);

          return {
            success: true,
            blogPost: retryPost,
            publishedUrl
          };
        }

        console.error('❌ Failed to publish blog post:', error);
        return {
          success: false,
          error: `Failed to publish blog post: ${error.message}`
        };
      }

      // Generate publishedUrl using the database-generated slug
      const publishedUrl = `${window.location.origin}/blog/${blogPost.slug}`;

      console.log('✅ Blog post published successfully:', publishedUrl);

      return {
        success: true,
        blogPost,
        publishedUrl
      };

    } catch (error) {
      console.error('❌ Error generating blog post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Claim a blog post for a user (with 3-post limit)
   */
  static async claimBlogPost(postId: string, user: User): Promise<ClaimResult> {
    try {
      console.log('🔄 Attempting to claim blog post:', postId);

      // Use the database function to claim the post
      const { data, error } = await supabase
        .rpc('claim_blog_post', {
          post_id: postId,
          user_id: user.id
        });

      if (error) {
        console.error('❌ Failed to claim blog post:', error);
        return {
          success: false,
          message: `Failed to claim blog post: ${error.message}`
        };
      }

      const result = data?.[0];
      
      if (!result?.success) {
        // Check if it's a limit reached error
        const needsUpgrade = result?.message?.includes('maximum limit') || result?.message?.includes('Pro plan');
        
        return {
          success: false,
          message: result?.message || 'Failed to claim blog post',
          claimedCount: result?.claimed_count || 0,
          needsUpgrade
        };
      }

      console.log('✅ Blog post claimed successfully');
      
      return {
        success: true,
        message: result.message,
        claimedCount: result.claimed_count
      };

    } catch (error) {
      console.error('❌ Error claiming blog post:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all claimable posts (with expiration logic)
   */
  static async getClaimablePosts(limit: number = 20): Promise<any[]> {
    try {
      console.log('🔍 Fetching claimable posts...');

      // Use the database function to get posts with expiration logic
      const { data, error } = await supabase
        .rpc('get_claimable_posts', { limit_count: limit });

      if (error) {
        console.error('❌ Failed to fetch claimable posts:', error);
        return [];
      }

      console.log(`✅ Fetched ${data?.length || 0} claimable posts`);
      return data || [];

    } catch (error) {
      console.error('❌ Error fetching claimable posts:', error);
      return [];
    }
  }

  /**
   * Get user's claimed posts count
   */
  static async getUserClaimedCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_claimed_count', { user_id: userId });

      if (error) {
        console.error('❌ Failed to get user claimed count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('❌ Error getting user claimed count:', error);
      return 0;
    }
  }

  /**
   * Get user's claimed posts
   */
  static async getUserClaimedPosts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trial_post', false) // Get permanently claimed posts
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch user claimed posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user claimed posts:', error);
      return [];
    }
  }

  /**
   * Clean up expired unclaimed posts (for cron job)
   */
  static async cleanupExpiredPosts(): Promise<number> {
    try {
      console.log('🧹 Cleaning up expired posts...');

      const { data, error } = await supabase
        .rpc('cleanup_expired_posts');

      if (error) {
        console.error('❌ Failed to cleanup expired posts:', error);
        return 0;
      }

      console.log(`✅ Cleaned up ${data || 0} expired posts`);
      return data || 0;
    } catch (error) {
      console.error('❌ Error cleaning up expired posts:', error);
      return 0;
    }
  }

  /**
   * Generate tags from keyword
   */
  private static generateTags(keyword: string): string[] {
    const words = keyword.toLowerCase().split(/\s+/);
    return words.slice(0, 5); // Max 5 tags
  }

  /**
   * Categorize content based on keyword
   */
  private static categorizeContent(keyword: string): string {
    const categories: { [key: string]: string[] } = {
      'Technology': ['tech', 'software', 'ai', 'digital', 'app', 'web', 'mobile'],
      'Business': ['business', 'marketing', 'sales', 'startup', 'entrepreneur'],
      'Health': ['health', 'wellness', 'fitness', 'medical', 'nutrition'],
      'Finance': ['finance', 'money', 'investment', 'banking', 'crypto'],
      'Education': ['education', 'learning', 'school', 'university', 'course'],
      'Lifestyle': ['lifestyle', 'travel', 'food', 'fashion', 'home']
    };

    const lowerKeyword = keyword.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lowerKeyword.includes(kw))) {
        return category;
      }
    }
    
    return 'General';
  }
}
