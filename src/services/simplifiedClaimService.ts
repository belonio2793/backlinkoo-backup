/**
 * Simplified Claim Service - Works without user_saved_posts table
 * Uses the blog_posts table's user_id field to track ownership
 */

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

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

export class SimplifiedClaimService {
  private static readonly MAX_SAVED_PER_FREE_USER = 3;

  /**
   * Get blog post by slug
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
   * Get claimable posts (trial posts that haven't been claimed)
   */
  static async getClaimablePosts(limit: number = 20): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('is_trial_post', true)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching claimable posts:', error);
        return [];
      }

      // Filter out expired posts
      const now = new Date();
      return (data || []).filter(post => {
        if (!post.expires_at) return true;
        return new Date(post.expires_at) > now;
      });
    } catch (error) {
      console.error('Error in getClaimablePosts:', error);
      return [];
    }
  }

  /**
   * Get user's claimed posts
   */
  static async getUserSavedPosts(userId: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user saved posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSavedPosts:', error);
      return [];
    }
  }

  /**
   * Get user's claim stats
   */
  static async getUserSavedStats(userId: string): Promise<ClaimStats> {
    try {
      const userPosts = await this.getUserSavedPosts(userId);
      const savedCount = userPosts.length;

      // TODO: Check actual subscription status from profiles table
      const isSubscriber = false; // For now, treat all as free users

      return {
        savedCount,
        maxSaved: isSubscriber ? Infinity : this.MAX_SAVED_PER_FREE_USER,
        canSave: isSubscriber || savedCount < this.MAX_SAVED_PER_FREE_USER,
        isSubscriber
      };
    } catch (error) {
      console.error('Error getting user saved stats:', error);
      return {
        savedCount: 0,
        maxSaved: this.MAX_SAVED_PER_FREE_USER,
        canSave: true,
        isSubscriber: false
      };
    }
  }

  /**
   * Claim a blog post (assign it to the user)
   */
  static async claimBlogPost(postSlug: string, user: User): Promise<ClaimResult> {
    try {
      console.log(`📌 Starting claim process for post: ${postSlug}, user: ${user.id}`);

      // Check user's claim limit
      const stats = await this.getUserSavedStats(user.id);
      if (!stats.canSave) {
        return {
          success: false,
          message: `You've reached the maximum of ${this.MAX_SAVED_PER_FREE_USER} claimed posts. Upgrade to claim unlimited posts!`,
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

      // Check if post is claimable
      if (!post.is_trial_post) {
        return {
          success: false,
          message: 'This post is not available for claiming.'
        };
      }

      if (post.user_id) {
        return {
          success: false,
          message: 'This post has already been claimed by another user.'
        };
      }

      // Check if post has expired
      if (post.expires_at && new Date(post.expires_at) < new Date()) {
        return {
          success: false,
          message: 'This post has expired and is no longer available for claiming.'
        };
      }

      // Claim the post by updating user_id and removing trial status
      const { data: updatedPost, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          user_id: user.id,
          is_trial_post: false,
          expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .eq('is_trial_post', true) // Ensure it's still claimable
        .is('user_id', null) // Ensure it hasn't been claimed
        .select()
        .single();

      if (updateError) {
        console.error('Error claiming post:', updateError);
        return {
          success: false,
          message: updateError.message.includes('duplicate') 
            ? 'This post has already been claimed.' 
            : 'Failed to claim post. Please try again.'
        };
      }

      if (!updatedPost) {
        return {
          success: false,
          message: 'Post is no longer available for claiming.'
        };
      }

      return {
        success: true,
        message: `Successfully claimed "${post.title}"! It's now permanently yours.`,
        post: updatedPost,
        savedCount: stats.savedCount + 1
      };

    } catch (error: any) {
      console.error('Error in claimBlogPost:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred while claiming the post.'
      };
    }
  }

  /**
   * Remove a saved post (unclaim it)
   */
  static async removeSavedPost(userId: string, postId: string): Promise<ClaimResult> {
    try {
      // Verify the post belongs to the user
      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !post) {
        return {
          success: false,
          message: 'Post not found or you do not own this post.'
        };
      }

      // Remove ownership by setting user_id to null
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error removing saved post:', updateError);
        return {
          success: false,
          message: 'Failed to remove post. Please try again.'
        };
      }

      return {
        success: true,
        message: `Successfully removed "${post.title}" from your dashboard.`
      };

    } catch (error: any) {
      console.error('Error in removeSavedPost:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred while removing the post.'
      };
    }
  }
}
