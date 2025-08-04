import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type BlogPost = Tables<'blog_posts'>;

export interface ClaimResult {
  success: boolean;
  message: string;
  post?: BlogPost;
  needsLogin?: boolean;
  needsUpgrade?: boolean;
}

export interface DeleteResult {
  success: boolean;
  message: string;
  canDelete?: boolean;
}

export class EnhancedBlogClaimService {
  /**
   * Check if a post can be claimed
   */
  static canClaimPost(post: BlogPost): boolean {
    return !post.claimed && post.user_id === null;
  }

  /**
   * Check if a post can be unclaimed by the current user
   */
  static canUnclaimPost(post: BlogPost, user?: User): { canUnclaim: boolean; reason?: string } {
    // Only claimed posts can be unclaimed
    if (!post.claimed) {
      return { canUnclaim: false, reason: 'Post is not claimed' };
    }

    // Must be logged in
    if (!user) {
      return { canUnclaim: false, reason: 'Must be logged in to unclaim posts' };
    }

    // Only the post owner can unclaim their post
    if (post.user_id !== user.id) {
      return { canUnclaim: false, reason: 'Only the post owner can unclaim their post' };
    }

    return { canUnclaim: true };
  }

  /**
   * Check if a post can be deleted by the current user
   */
  static canDeletePost(post: BlogPost, user?: User): { canDelete: boolean; reason?: string } {
    // Unclaimed posts can be deleted by anyone
    if (!post.claimed) {
      return { canDelete: true };
    }

    // Claimed posts can only be deleted by the owner or admin
    if (post.claimed) {
      if (!user) {
        return { canDelete: false, reason: 'Must be logged in to delete claimed posts' };
      }

      // Allow post owner to delete their own claimed posts
      if (post.user_id === user.id) {
        return { canDelete: true };
      }

      // Check if user is admin (this would need to be implemented based on your admin logic)
      return { canDelete: false, reason: 'Only post owners and admins can delete claimed posts' };
    }

    return { canDelete: false, reason: 'Unknown post state' };
  }

  /**
   * Claim a blog post
   */
  static async claimPost(slug: string, user: User): Promise<ClaimResult> {
    try {
      // First, get the post
      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError || !post) {
        return {
          success: false,
          message: 'Post not found'
        };
      }

      // Check if post can be claimed
      if (!this.canClaimPost(post)) {
        return {
          success: false,
          message: 'This post has already been claimed'
        };
      }

      // Check if post has expired
      if (post.expires_at && new Date(post.expires_at) <= new Date()) {
        return {
          success: false,
          message: 'This post has expired and can no longer be claimed'
        };
      }

      // Update the post to claim it
      const { data: updatedPost, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          user_id: user.id,
          claimed: true,
          expires_at: null, // Remove expiration
          is_trial_post: false // No longer a trial post
        })
        .eq('id', post.id)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          message: `Failed to claim post: ${updateError.message}`
        };
      }

      return {
        success: true,
        message: '',
        post: updatedPost
      };

    } catch (error: any) {
      return {
        success: false,
        message: `An error occurred: ${error.message}`
      };
    }
  }

  /**
   * Unclaim a blog post (return it to claimable state)
   */
  static async unclaimPost(slug: string, user: User): Promise<ClaimResult> {
    try {
      // First, get the post
      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError || !post) {
        return {
          success: false,
          message: 'Post not found'
        };
      }

      // Check if post can be unclaimed
      const unclaimCheck = this.canUnclaimPost(post, user);
      if (!unclaimCheck.canUnclaim) {
        return {
          success: false,
          message: unclaimCheck.reason || 'Cannot unclaim this post'
        };
      }

      // Set expiration to 24 hours from now
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);

      // Update the post to unclaim it
      const { data: updatedPost, error: updateError } = await supabase
        .from('blog_posts')
        .update({
          user_id: null,
          claimed: false,
          expires_at: expirationDate.toISOString(),
          is_trial_post: true // Return to trial status
        })
        .eq('id', post.id)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          message: `Failed to unclaim post: ${updateError.message}`
        };
      }

      return {
        success: true,
        message: 'Post successfully unclaimed and returned to claimable pool for 24 hours',
        post: updatedPost
      };

    } catch (error: any) {
      return {
        success: false,
        message: `An error occurred: ${error.message}`
      };
    }
  }

  /**
   * Delete a blog post (with proper permissions)
   */
  static async deletePost(slug: string, user?: User): Promise<DeleteResult> {
    try {
      // First, get the post
      const { data: post, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError || !post) {
        return {
          success: false,
          message: 'Post not found'
        };
      }

      // Check deletion permissions
      const { canDelete, reason } = this.canDeletePost(post, user);
      
      if (!canDelete) {
        return {
          success: false,
          message: reason || 'You do not have permission to delete this post',
          canDelete: false
        };
      }

      // Delete the post
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id);

      if (deleteError) {
        return {
          success: false,
          message: `Failed to delete post: ${deleteError.message}`
        };
      }

      return {
        success: true,
        message: 'Post deleted successfully',
        canDelete: true
      };

    } catch (error: any) {
      return {
        success: false,
        message: `An error occurred: ${error.message}`
      };
    }
  }

  /**
   * Get posts that can be claimed (unclaimed posts that haven't expired)
   */
  static async getClaimablePosts(limit: number = 20): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('claimed', false)
        .eq('status', 'published')
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching claimable posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClaimablePosts:', error);
      return [];
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
        .eq('claimed', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user claimed posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserClaimedPosts:', error);
      return [];
    }
  }

  /**
   * Cleanup expired posts (can be called manually or via cron)
   */
  static async cleanupExpiredPosts(): Promise<{ deletedCount: number; error?: string }> {
    try {
      // Try the RPC function first
      const { data, error } = await supabase.rpc('cleanup_expired_posts');

      if (!error && data !== null) {
        return { deletedCount: data || 0 };
      }

      // If RPC function doesn't exist, use manual cleanup
      console.warn('RPC function not available, using manual cleanup');
      const { data: expiredPosts, error: selectError } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('claimed', false)
        .not('expires_at', 'is', null)
        .lte('expires_at', new Date().toISOString());

      if (selectError) {
        return { deletedCount: 0, error: selectError.message };
      }

      if (!expiredPosts || expiredPosts.length === 0) {
        return { deletedCount: 0 };
      }

      // Delete expired posts manually
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('claimed', false)
        .not('expires_at', 'is', null)
        .lte('expires_at', new Date().toISOString());

      if (deleteError) {
        return { deletedCount: 0, error: deleteError.message };
      }

      return { deletedCount: expiredPosts.length };
    } catch (error: any) {
      return { deletedCount: 0, error: error.message };
    }
  }

  /**
   * Check if user needs to login for claiming
   */
  static handleClaimIntent(slug: string, postTitle: string): void {
    const claimIntent = {
      slug,
      postTitle,
      timestamp: Date.now(),
      action: 'claim'
    };

    localStorage.setItem('claim_intent', JSON.stringify(claimIntent));
  }

  /**
   * Process any pending claim intent after login
   */
  static async processPendingClaimIntent(user: User): Promise<ClaimResult | null> {
    try {
      // Safety check: ensure user is authenticated
      if (!user || !user.id) {
        console.warn('Cannot process claim intent: user not authenticated');
        localStorage.removeItem('claim_intent');
        return null;
      }

      const claimIntentStr = localStorage.getItem('claim_intent');
      if (!claimIntentStr) return null;

      const claimIntent = JSON.parse(claimIntentStr);

      // Check if intent is recent (within last hour)
      if (Date.now() - claimIntent.timestamp > 60 * 60 * 1000) {
        localStorage.removeItem('claim_intent');
        return null;
      }

      // Clear the intent
      localStorage.removeItem('claim_intent');

      // Attempt to claim the post
      return await this.claimPost(claimIntent.slug, user);
    } catch (error) {
      console.error('Error processing claim intent:', error);
      localStorage.removeItem('claim_intent');
      return null;
    }
  }
}
