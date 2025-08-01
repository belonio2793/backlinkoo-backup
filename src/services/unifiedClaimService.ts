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
  claimedCount?: number;
  needsUpgrade?: boolean;
}

export interface ClaimStats {
  claimedCount: number;
  maxClaims: number;
  canClaim: boolean;
}

export class UnifiedClaimService {
  private static readonly MAX_CLAIMS_PER_USER = 3;

  /**
   * Check if user can claim more posts
   */
  static async getUserClaimStats(userId: string): Promise<ClaimStats> {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_trial_post', true);

      if (error) {
        console.error('Failed to get user claim stats:', error);
        return {
          claimedCount: 0,
          maxClaims: this.MAX_CLAIMS_PER_USER,
          canClaim: true
        };
      }

      const claimedCount = count || 0;
      
      return {
        claimedCount,
        maxClaims: this.MAX_CLAIMS_PER_USER,
        canClaim: claimedCount < this.MAX_CLAIMS_PER_USER
      };
    } catch (error) {
      console.error('Error getting user claim stats:', error);
      return {
        claimedCount: 0,
        maxClaims: this.MAX_CLAIMS_PER_USER,
        canClaim: true
      };
    }
  }

  /**
   * Get blog post by slug from database
   */
  static async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
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
        console.error('Error fetching blog post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBlogPostBySlug:', error);
      return null;
    }
  }

  /**
   * Get blog post by ID from database
   */
  static async getBlogPostById(id: string): Promise<BlogPost | null> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching blog post by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBlogPostById:', error);
      return null;
    }
  }

  /**
   * Claim a blog post - main functionality
   */
  static async claimBlogPost(postSlug: string, user: User): Promise<ClaimResult> {
    try {
      console.log(`🎯 Starting claim process for post: ${postSlug}, user: ${user.id}`);

      // Check user's claim limit
      const stats = await this.getUserClaimStats(user.id);
      if (!stats.canClaim) {
        return {
          success: false,
          message: `You've reached the maximum of ${this.MAX_CLAIMS_PER_USER} claimed posts. Upgrade to claim more!`,
          claimedCount: stats.claimedCount,
          needsUpgrade: true
        };
      }

      // Get the post from database
      const post = await this.getBlogPostBySlug(postSlug);
      if (!post) {
        return {
          success: false,
          message: 'Blog post not found or not available for claiming.'
        };
      }

      // Validate post can be claimed
      if (!post.is_trial_post) {
        return {
          success: false,
          message: 'This post is not available for claiming.'
        };
      }

      if (post.user_id) {
        return {
          success: false,
          message: 'This blog post has already been claimed by another user.'
        };
      }

      if (post.expires_at && new Date() > new Date(post.expires_at)) {
        return {
          success: false,
          message: 'This blog post has expired and is no longer available for claiming.'
        };
      }

      // Perform the claim - update post with user ownership
      const { data: updatedPost, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          user_id: user.id,
          expires_at: null, // Remove expiration
          is_trial_post: false, // Convert from trial to permanent
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .eq('is_trial_post', true) // Safety check
        .is('user_id', null) // Safety check - ensure not already claimed
        .select()
        .single();

      if (updateError) {
        console.error('Failed to claim post:', updateError);
        
        // Check if it was a race condition (someone else claimed it)
        if (updateError.code === 'PGRST116') {
          return {
            success: false,
            message: 'This post was just claimed by another user. Please try a different post.'
          };
        }
        
        return {
          success: false,
          message: 'Failed to claim the blog post. Please try again.'
        };
      }

      if (!updatedPost) {
        return {
          success: false,
          message: 'This post was just claimed by another user or is no longer available.'
        };
      }

      // Also increment view count for the newly claimed post
      await supabase
        .from('blog_posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', post.id);

      console.log(`✅ Successfully claimed post: ${postSlug}`);
      
      const newStats = await this.getUserClaimStats(user.id);
      
      return {
        success: true,
        message: `Blog post claimed successfully! You now own "${post.title}" permanently.`,
        post: updatedPost,
        claimedCount: newStats.claimedCount
      };

    } catch (error) {
      console.error('Error in claimBlogPost:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while claiming the post. Please try again.'
      };
    }
  }

  /**
   * Get user's claimed posts
   */
  static async getUserClaimedPosts(userId: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trial_post', false) // Only get permanently claimed posts
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to get user claimed posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user claimed posts:', error);
      return [];
    }
  }

  /**
   * Get all claimable posts (trial posts that haven't expired)
   */
  static async getClaimablePosts(limit: number = 20): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('is_trial_post', true)
        .is('user_id', null)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get claimable posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting claimable posts:', error);
      return [];
    }
  }

  /**
   * Check if a specific post is claimable by a user
   */
  static async isPostClaimable(postSlug: string, userId?: string): Promise<{
    claimable: boolean;
    reason?: string;
    post?: BlogPost;
  }> {
    try {
      const post = await this.getBlogPostBySlug(postSlug);
      
      if (!post) {
        return { claimable: false, reason: 'Post not found' };
      }

      if (!post.is_trial_post) {
        return { claimable: false, reason: 'Post is not a trial post', post };
      }

      if (post.user_id) {
        if (post.user_id === userId) {
          return { claimable: false, reason: 'You already own this post', post };
        }
        return { claimable: false, reason: 'Post already claimed by another user', post };
      }

      if (post.expires_at && new Date() > new Date(post.expires_at)) {
        return { claimable: false, reason: 'Post has expired', post };
      }

      if (userId) {
        const stats = await this.getUserClaimStats(userId);
        if (!stats.canClaim) {
          return { 
            claimable: false, 
            reason: `You've reached the maximum of ${this.MAX_CLAIMS_PER_USER} claimed posts`,
            post 
          };
        }
      }

      return { claimable: true, post };
      
    } catch (error) {
      console.error('Error checking if post is claimable:', error);
      return { claimable: false, reason: 'Error checking post status' };
    }
  }

  /**
   * Cleanup expired trial posts (for maintenance)
   */
  static async cleanupExpiredPosts(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('is_trial_post', true)
        .is('user_id', null)
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('Failed to cleanup expired posts:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Cleaned up ${deletedCount} expired trial posts`);
      return deletedCount;
      
    } catch (error) {
      console.error('Error cleaning up expired posts:', error);
      return 0;
    }
  }
}
