import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type BlogPost = Tables<'blog_posts'>;

export interface ClaimStatus {
  canClaim: boolean;
  reason: 'available' | 'claimed_by_user' | 'claimed_by_other' | 'limit_reached' | 'not_logged_in';
  claimedCount: number;
  post?: BlogPost;
}

export class ClaimStatusService {
  /**
   * Check if a user can claim a specific blog post
   */
  static async checkClaimStatus(slug: string, userId?: string): Promise<ClaimStatus> {
    try {
      // Get the post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .single();

      if (postError || !post) {
        return {
          canClaim: false,
          reason: 'available', // Post not found, treat as not claimable
          claimedCount: 0
        };
      }

      // If user is not logged in
      if (!userId) {
        return {
          canClaim: false,
          reason: 'not_logged_in',
          claimedCount: 0,
          post
        };
      }

      // If post is already claimed by this user
      if (post.user_id === userId) {
        const claimedCount = await this.getUserClaimCount(userId);
        return {
          canClaim: false,
          reason: 'claimed_by_user',
          claimedCount,
          post
        };
      }

      // If post is claimed by another user
      if (post.user_id && post.user_id !== userId) {
        const claimedCount = await this.getUserClaimCount(userId);
        return {
          canClaim: false,
          reason: 'claimed_by_other',
          claimedCount,
          post
        };
      }

      // Check user's claim limit
      const claimedCount = await this.getUserClaimCount(userId);
      if (claimedCount >= 3) {
        return {
          canClaim: false,
          reason: 'limit_reached',
          claimedCount,
          post
        };
      }

      // Post is available for claiming
      return {
        canClaim: true,
        reason: 'available',
        claimedCount,
        post
      };

    } catch (error) {
      console.error('Error checking claim status:', error);
      return {
        canClaim: false,
        reason: 'available',
        claimedCount: 0
      };
    }
  }

  /**
   * Get the number of posts a user has claimed
   */
  static async getUserClaimCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting user claim count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting user claim count:', error);
      return 0;
    }
  }

  /**
   * Get all posts claimed by a user
   */
  static async getUserClaimedPosts(userId: string): Promise<BlogPost[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error getting user claimed posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user claimed posts:', error);
      return [];
    }
  }

  /**
   * Claim a blog post
   */
  static async claimPost(slug: string): Promise<{ success: boolean; error?: string; claimedCount?: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Not logged in' };
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return { success: false, error: 'No valid session' };
      }

      // Call the Netlify function
      const response = await fetch('/.netlify/functions/claim-post-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ slug })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to claim post' };
      }

      return { 
        success: true, 
        claimedCount: result.claimedPosts 
      };

    } catch (error) {
      console.error('Error claiming post:', error);
      return { success: false, error: 'An error occurred. Please try again.' };
    }
  }

  /**
   * Get claim button text based on status
   */
  static getClaimButtonText(status: ClaimStatus): string {
    switch (status.reason) {
      case 'available':
        return 'Claim this Post';
      case 'claimed_by_user':
        return 'You Claimed This';
      case 'claimed_by_other':
        return 'Already Claimed';
      case 'limit_reached':
        return 'Claim Limit Reached';
      case 'not_logged_in':
        return 'Login to Claim';
      default:
        return 'Claim this Post';
    }
  }

  /**
   * Check if claim button should be disabled
   */
  static isClaimButtonDisabled(status: ClaimStatus): boolean {
    return !status.canClaim;
  }
}
