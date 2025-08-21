/**
 * Unified Claim Service - Centralized blog post claiming logic
 * Works with blog_posts table consistently across the application
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';
import { ClaimErrorHandler } from '@/utils/claimErrorHandler';

type BlogPost = Tables<'blog_posts'>;

export interface ClaimResult {
  success: boolean;
  message: string;
  post?: BlogPost;
  savedCount?: number;
  needsUpgrade?: boolean;
}

export interface ClaimStats {
  savedCount: number;
  maxSaved: number;
  canSave: boolean;
  isSubscriber: boolean;
}

export class UnifiedClaimService {
  private static readonly MAX_SAVED_PER_FREE_USER = 3;

  /**
   * Check user's subscription status
   */
  static async getUserSubscriptionStatus(userId: string): Promise<{
    isSubscriber: boolean;
    subscriptionTier: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return { isSubscriber: false, subscriptionTier: null };
      }

      const isSubscriber = data.subscription_tier === 'monthly' || data.subscription_tier === 'premium';
      return {
        isSubscriber,
        subscriptionTier: data.subscription_tier
      };
    } catch (error: any) {
      console.error('Error checking subscription status:', {
        error: error?.message || error,
        userId,
        timestamp: new Date().toISOString()
      });
      return { isSubscriber: false, subscriptionTier: null };
    }
  }

  /**
   * Check how many posts user has saved to dashboard
   */
  static async getUserSavedStats(userId: string): Promise<ClaimStats> {
    try {
      // Check subscription status
      const { isSubscriber } = await this.getUserSubscriptionStatus(userId);

      // Count saved posts in user's dashboard
      const { count, error } = await supabase
        .from('user_saved_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to get user saved stats:', {
          error: error?.message || error,
          code: error?.code,
          userId,
          timestamp: new Date().toISOString()
        });
        return {
          savedCount: 0,
          maxSaved: isSubscriber ? -1 : this.MAX_SAVED_PER_FREE_USER,
          canSave: true,
          isSubscriber
        };
      }

      const savedCount = count || 0;
      const maxSaved = isSubscriber ? -1 : this.MAX_SAVED_PER_FREE_USER; // -1 means unlimited

      return {
        savedCount,
        maxSaved,
        canSave: isSubscriber || savedCount < this.MAX_SAVED_PER_FREE_USER,
        isSubscriber
      };
    } catch (error: any) {
      console.error('Error getting user saved stats:', {
        error: error?.message || error,
        stack: error?.stack,
        userId,
        timestamp: new Date().toISOString()
      });
      return {
        savedCount: 0,
        maxSaved: this.MAX_SAVED_PER_FREE_USER,
        canSave: true,
        isSubscriber: false
      };
    }
  }

  /**
   * Get blog post by slug from database
   * Queries published_blog_posts first, then blog_posts as fallback
   */
  static async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      // Try published_blog_posts first (where new posts are saved)
      let { data, error } = await supabase
        .from('published_blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found in published_blog_posts, try blog_posts fallback
        console.log('📖 Post not found in published_blog_posts, trying blog_posts fallback...');
        const fallbackResult = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found in either table
        }
        console.error('Error fetching blog post:', error.message || error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBlogPostBySlug:', error.message || error);
      return null;
    }
  }

  /**
   * Get blog post by ID from database
   * Queries published_blog_posts first, then blog_posts as fallback
   */
  static async getBlogPostById(id: string): Promise<BlogPost | null> {
    try {
      // Try published_blog_posts first (where new posts are saved)
      let { data, error } = await supabase
        .from('published_blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found in published_blog_posts, try blog_posts fallback
        console.log('📖 Post not found in published_blog_posts, trying blog_posts fallback...');
        const fallbackResult = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();

        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching blog post by ID:', error.message || error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBlogPostById:', error.message || error);
      return null;
    }
  }

  /**
   * Save a blog post to user's dashboard
   */
  static async claimBlogPost(postSlug: string, user: User): Promise<ClaimResult> {
    try {
      console.log(`📌 Starting save process for post: ${postSlug}, user: ${user.id}`);

      // Check user's save limit
      const stats = await this.getUserSavedStats(user.id);
      if (!stats.canSave) {
        return {
          success: false,
          message: `You've reached the maximum of ${this.MAX_SAVED_PER_FREE_USER} saved posts. Upgrade to save unlimited posts!`,
          savedCount: stats.savedCount,
          needsUpgrade: true
        };
      }

      // Get the post from database
      const post = await this.getBlogPostBySlug(postSlug);
      if (!post) {
        return {
          success: false,
          message: 'Blog post not found.'
        };
      }

      // Check if user already saved this post
      const { data: existingSave, error: checkError } = await supabase
        .from('user_saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing save:', checkError.message || checkError);
        return {
          success: false,
          message: 'Error checking if post is already saved.'
        };
      }

      if (existingSave) {
        return {
          success: false,
          message: 'This post is already in your dashboard.'
        };
      }

      // Save the post to user's dashboard
      const { data: savedPost, error: saveError } = await supabase
        .from('user_saved_posts')
        .insert({
          user_id: user.id,
          post_id: post.id,
          saved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save post:', saveError.message || saveError);
        return {
          success: false,
          message: 'Failed to save the blog post. Please try again.'
        };
      }

      // Mark the post as "protected" from auto-deletion by setting a flag
      await supabase
        .from('blog_posts')
        .update({
          view_count: (post.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      console.log(`✅ Successfully saved post to dashboard: ${postSlug}`);

      const newStats = await this.getUserSavedStats(user.id);

      return {
        success: true,
        message: `"${post.title}" added to your dashboard! ${stats.isSubscriber ? 'Unlimited saves available.' : `${this.MAX_SAVED_PER_FREE_USER - newStats.savedCount} saves remaining.`}`,
        post,
        savedCount: newStats.savedCount
      };

    } catch (error) {
      const claimError = ClaimErrorHandler.analyzeError(error);
      console.error('Error in claimBlogPost:', ClaimErrorHandler.formatForLogging(claimError, {
        postSlug,
        userId: user.id,
        userEmail: user.email
      }));

      return {
        success: false,
        message: claimError.userMessage + ' ' + ClaimErrorHandler.getSuggestedAction(claimError)
      };
    }
  }

  /**
   * Get user's saved posts from dashboard
   */
  static async getUserSavedPosts(userId: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('user_saved_posts')
        .select(`
          *,
          blog_posts(*)
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Failed to get user saved posts:', error.message || error);
        return [];
      }

      // Extract blog posts from the joined data
      return (data || []).map(item => (item as any).blog_posts).filter(Boolean);
    } catch (error) {
      console.error('Error getting user saved posts:', error.message || error);
      return [];
    }
  }

  /**
   * Remove a post from user's dashboard
   */
  static async removeSavedPost(userId: string, postId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('user_saved_posts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        console.error('Failed to remove saved post:', error.message || error);
        return {
          success: false,
          message: 'Failed to remove post from dashboard.'
        };
      }

      return {
        success: true,
        message: 'Post removed from dashboard.'
      };
    } catch (error) {
      console.error('Error removing saved post:', error.message || error);
      return {
        success: false,
        message: 'Error removing post from dashboard.'
      };
    }
  }

  /**
   * Get all available posts for saving to dashboard
   * Queries published_blog_posts first, then blog_posts as fallback
   */
  static async getAvailablePosts(limit: number = 20): Promise<BlogPost[]> {
    try {
      console.log('📖 Fetching available posts from published_blog_posts...');

      // Try published_blog_posts first (where new posts are saved)
      let { data, error } = await supabase
        .from('published_blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      // If published_blog_posts fails or returns no data, try blog_posts fallback
      if (error || !data || data.length === 0) {
        console.log('📖 Trying blog_posts fallback...');
        const fallbackResult = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fallbackResult.error) {
          console.error('Failed to get available posts from both tables:', fallbackResult.error.message || fallbackResult.error);
          throw fallbackResult.error;
        }

        data = fallbackResult.data;
      }

      console.log(`✅ Found ${data?.length || 0} available posts`);
      return data || [];
    } catch (error) {
      console.error('Error getting available posts:', error.message || error);
      return [];
    }
  }

  /**
   * Get all claimable posts (backward compatibility)
   */
  static async getClaimablePosts(limit: number = 20): Promise<BlogPost[]> {
    return this.getAvailablePosts(limit);
  }

  /**
   * Get user claim statistics (compatibility method for ClaimSystemStatus)
   */
  static async getUserClaimStats(userId: string): Promise<{
    claimedCount: number;
    maxClaims: number;
    canClaim: boolean;
  }> {
    try {
      const stats = await this.getUserSavedStats(userId);

      return {
        claimedCount: stats.savedCount,
        maxClaims: stats.maxSaved === -1 ? Infinity : stats.maxSaved,
        canClaim: stats.canSave
      };
    } catch (error: any) {
      console.error('Error getting user claim stats:', {
        error: error?.message || error,
        userId,
        timestamp: new Date().toISOString()
      });

      return {
        claimedCount: 0,
        maxClaims: this.MAX_SAVED_PER_FREE_USER,
        canClaim: true
      };
    }
  }

  /**
   * Check if any users have saved a specific post (prevents auto-deletion)
   */
  static async isPostSavedByAnyUser(postId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('user_saved_posts')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('Error checking if post is saved:', error.message || error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking if post is saved:', error.message || error);
      return false;
    }
  }

  /**
   * Check if a specific post can be saved by a user
   */
  static async isPostSaveable(postSlug: string, userId?: string): Promise<{
    saveable: boolean;
    reason?: string;
    post?: BlogPost;
    alreadySaved?: boolean;
  }> {
    try {
      const post = await this.getBlogPostBySlug(postSlug);

      if (!post) {
        return { saveable: false, reason: 'Post not found' };
      }

      if (userId) {
        // Check if user already saved this post
        const { data: existingSave } = await supabase
          .from('user_saved_posts')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', post.id)
          .single();

        if (existingSave) {
          return {
            saveable: false,
            reason: 'Already in your dashboard',
            post,
            alreadySaved: true
          };
        }

        // Check user's save limit
        const stats = await this.getUserSavedStats(userId);
        if (!stats.canSave) {
          return {
            saveable: false,
            reason: `You've reached the maximum of ${this.MAX_SAVED_PER_FREE_USER} saved posts. Upgrade for unlimited!`,
            post
          };
        }
      }

      return { saveable: true, post };

    } catch (error) {
      console.error('Error checking if post is saveable:', error.message || error);
      return { saveable: false, reason: 'Error checking post status' };
    }
  }

  /**
   * Backward compatibility alias
   */
  static async isPostClaimable(postSlug: string, userId?: string) {
    return this.isPostSaveable(postSlug, userId);
  }

  /**
   * Cleanup expired posts (only delete if not saved by any user)
   */
  static async cleanupExpiredPosts(): Promise<number> {
    try {
      // Get expired posts
      const { data: expiredPosts, error: fetchError } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('is_trial_post', true)
        .not('expires_at', 'is', null)
        .lt('expires_at', new Date().toISOString());

      if (fetchError || !expiredPosts) {
        console.error('Failed to fetch expired posts:', fetchError.message || fetchError);
        return 0;
      }

      let deletedCount = 0;

      // Check each post to see if it's saved by any user
      for (const post of expiredPosts) {
        const isSaved = await this.isPostSavedByAnyUser(post.id);

        if (!isSaved) {
          // Safe to delete - no user has saved it
          const { error: deleteError } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', post.id);

          if (!deleteError) {
            deletedCount++;
          } else {
            console.error(`Failed to delete post ${post.id}:`, deleteError.message || deleteError);
          }
        } else {
          console.log(`🔒 Preserving expired post ${post.id} - saved by users`);
        }
      }

      console.log(`🧹 Cleaned up ${deletedCount} expired posts (preserved ${expiredPosts.length - deletedCount} saved posts)`);
      return deletedCount;

    } catch (error) {
      console.error('Error cleaning up expired posts:', error.message || error);
      return 0;
    }
  }
}
