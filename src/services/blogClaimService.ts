import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface ClaimablePost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  published_url: string;
  target_url: string;
  created_at: string;
  expires_at?: string;
  seo_score: number;
  reading_time: number;
  word_count: number;
  view_count: number;
  is_trial_post: boolean;
  user_id?: string;
  author_name: string;
  tags: string[];
  category: string;
}

export interface ClaimResult {
  success: boolean;
  message: string;
  post?: ClaimablePost;
  error?: string;
}

export class BlogClaimService {
  /**
   * Get all published blog posts from the database that can be claimed
   */
  static async getClaimablePosts(limit: number = 20): Promise<ClaimablePost[]> {
    try {
      console.log(`🔍 BlogClaimService: Fetching up to ${limit} claimable posts...`);

      // Test database connection first
      try {
        const { error: connectionError } = await supabase
          .from('published_blog_posts')
          .select('id')
          .limit(1);

        if (connectionError) {
          console.warn('⚠️ BlogClaimService: Database connection test failed:', connectionError.message);
          if (connectionError.message?.includes('relation') || connectionError.message?.includes('does not exist')) {
            console.warn('🔧 BlogClaimService: Table does not exist, returning empty array');
            return [];
          }
        } else {
          console.log('✅ BlogClaimService: Database connection test passed');
        }
      } catch (testError: any) {
        console.warn('⚠️ BlogClaimService: Database test failed:', testError.message);
        return [];
      }

      const { data, error } = await supabase
        .from('published_blog_posts')
        .select(`
          id, slug, title, excerpt, published_url, target_url,
          created_at, expires_at, seo_score, reading_time, word_count,
          view_count, is_trial_post, user_id, author_name, tags, category
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ BlogClaimService: Database error fetching posts:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          errorString: JSON.stringify(error, null, 2)
        });
        console.error('❌ BlogClaimService: Raw error details:', JSON.stringify(error, null, 2));

        // Check if it's a table/schema issue
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('🔧 BlogClaimService: Database table may not exist, falling back to empty array');
        }
        return [];
      }

      console.log(`✅ BlogClaimService: Successfully fetched ${data?.length || 0} posts from database`);

      if (data && data.length > 0) {
        console.log('📋 BlogClaimService: Post breakdown:', {
          total: data.length,
          trial: data.filter(p => p.is_trial_post).length,
          claimed: data.filter(p => p.user_id && !p.is_trial_post).length,
          available: data.filter(p => !p.user_id || p.is_trial_post).length
        });
      }

      // Validate data structure
      const validatedData = (data || []).filter(post => {
        if (!post.id || !post.slug || !post.title) {
          console.warn('⚠️ BlogClaimService: Skipping invalid post data:', post);
          return false;
        }
        return true;
      });

      console.log(`✅ BlogClaimService: Validated ${validatedData.length}/${data?.length || 0} posts`);
      return validatedData;
    } catch (error: any) {
      console.error('💥 BlogClaimService: Exception fetching claimable posts:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return [];
    }
  }

  /**
   * Get posts claimed by a specific user
   */
  static async getUserClaimedPosts(userId: string): Promise<ClaimablePost[]> {
    try {
      const { data, error } = await supabase
        .from('published_blog_posts')
        .select(`
          id, slug, title, excerpt, published_url, target_url, 
          created_at, expires_at, seo_score, reading_time, word_count, 
          view_count, is_trial_post, user_id, author_name, tags, category
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user claimed posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching user claimed posts:', error);
      return [];
    }
  }

  /**
   * Claim a blog post by assigning it to a user
   * This removes the expiry date and marks it as permanently owned
   */
  static async claimPost(postId: string, user: User): Promise<ClaimResult> {
    try {
      console.log(`🔍 BlogClaimService: Attempting to claim post with ID: ${postId}`);

      // First check if the post exists and is claimable
      const { data: existingPost, error: fetchError } = await supabase
        .from('published_blog_posts')
        .select('id, title, user_id, is_trial_post, expires_at, slug')
        .eq('id', postId)
        .eq('status', 'published')
        .single();

      // Check for database table not existing
      if (fetchError && fetchError.message?.includes('relation') && fetchError.message?.includes('does not exist')) {
        console.warn('⚠️ BlogClaimService: Database table does not exist, trying localStorage fallback...');

        // Try to find the post in localStorage and use claimLocalStoragePost
        const blogStorageKey = `blog_post_${postId}`;
        const storedBlogData = localStorage.getItem(blogStorageKey);

        if (storedBlogData) {
          const blogPost = JSON.parse(storedBlogData);
          console.log('🔄 BlogClaimService: Found post in localStorage, using claimLocalStoragePost method');
          return await this.claimLocalStoragePost(blogPost, user);
        }

        // Try to find by scanning all blog posts in localStorage
        const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        for (const blogMeta of allBlogPosts) {
          const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
          if (blogData) {
            const blogPost = JSON.parse(blogData);
            if (blogPost.id === postId) {
              console.log('🔄 BlogClaimService: Found post by scanning localStorage, using claimLocalStoragePost method');
              return await this.claimLocalStoragePost(blogPost, user);
            }
          }
        }

        return {
          success: false,
          message: 'Database table not available and post not found in localStorage',
          error: 'Table does not exist and localStorage fallback failed'
        };
      }

      if (fetchError || !existingPost) {
        console.error('❌ BlogClaimService: Post not found in database:', `ID: ${postId}, Error: ${fetchError?.message || 'Unknown error'}, Hint: This might be a localStorage-only post`);
        return {
          success: false,
          message: 'Blog post not found or unavailable for claiming',
          error: fetchError?.message
        };
      }

      // Check if already claimed by another user
      if (existingPost.user_id && existingPost.user_id !== user.id) {
        return {
          success: false,
          message: 'This blog post has already been claimed by another user'
        };
      }

      // Check if already claimed by the same user
      if (existingPost.user_id === user.id && !existingPost.is_trial_post) {
        return {
          success: false,
          message: 'You have already claimed this blog post'
        };
      }

      // Claim the post
      const { data: updatedPost, error: updateError } = await supabase
        .from('published_blog_posts')
        .update({
          user_id: user.id,
          is_trial_post: false,
          expires_at: null, // Remove expiry
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          message: 'Failed to claim the blog post',
          error: updateError.message
        };
      }

      console.log('✅ BlogClaimService: Post claimed successfully:', {
        postId: updatedPost.id,
        slug: updatedPost.slug,
        title: updatedPost.title
      });

      return {
        success: true,
        message: 'Blog post claimed successfully! It will now be permanently saved to your account.',
        post: updatedPost
      };
    } catch (error: any) {
      console.error('Exception claiming post:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while claiming the post',
        error: error.message
      };
    }
  }

  /**
   * Unclaim a blog post by removing user assignment
   * This restores it as a trial post with expiry
   */
  static async unclaimPost(postId: string, user: User): Promise<ClaimResult> {
    try {
      // First check if the post exists and is owned by the user
      const { data: existingPost, error: fetchError } = await supabase
        .from('published_blog_posts')
        .select('id, title, user_id, is_trial_post')
        .eq('id', postId)
        .eq('user_id', user.id)
        .eq('status', 'published')
        .single();

      if (fetchError || !existingPost) {
        return {
          success: false,
          message: 'Blog post not found or you do not have permission to unclaim it',
          error: fetchError?.message
        };
      }

      // Calculate new expiry (24 hours from now)
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Unclaim the post
      const { data: updatedPost, error: updateError } = await supabase
        .from('published_blog_posts')
        .update({
          user_id: null,
          is_trial_post: true,
          expires_at: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          message: 'Failed to unclaim the blog post',
          error: updateError.message
        };
      }

      return {
        success: true,
        message: 'Blog post unclaimed successfully! It will expire in 24 hours unless claimed again.',
        post: updatedPost
      };
    } catch (error: any) {
      console.error('Exception unclaiming post:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while unclaiming the post',
        error: error.message
      };
    }
  }

  /**
   * Check if a user can claim more posts (implement limits if needed)
   */
  static async canUserClaimMore(user: User): Promise<{ canClaim: boolean; reason?: string; claimedCount: number; maxClaims: number }> {
    try {
      // Get current claimed posts count
      const { data: claimedPosts, error } = await supabase
        .from('published_blog_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .neq('is_trial_post', true);

      if (error) {
        console.error('Error checking claim limits:', error);
        return { canClaim: false, reason: 'Unable to check claim limits', claimedCount: 0, maxClaims: 5 };
      }

      const claimedCount = claimedPosts?.length || 0;
      const maxClaims = 5; // Default limit - could be made configurable per user tier

      if (claimedCount >= maxClaims) {
        return {
          canClaim: false,
          reason: `You have reached the maximum limit of ${maxClaims} claimed posts. Please unclaim a post to claim a new one.`,
          claimedCount,
          maxClaims
        };
      }

      return {
        canClaim: true,
        claimedCount,
        maxClaims
      };
    } catch (error) {
      console.error('Exception checking claim limits:', error);
      return { canClaim: false, reason: 'Unable to check claim limits', claimedCount: 0, maxClaims: 5 };
    }
  }

  /**
   * Create a database entry from a localStorage blog post and claim it
   * This is used for claiming posts that only exist in localStorage
   */
  static async claimLocalStoragePost(localPost: any, user: User): Promise<ClaimResult> {
    try {
      console.log('🔄 BlogClaimService: Creating database entry for localStorage post:', localPost.slug);

      // Check if post already exists by slug
      const { data: existingPost } = await supabase
        .from('published_blog_posts')
        .select('id, user_id, is_trial_post')
        .eq('slug', localPost.slug)
        .eq('status', 'published')
        .single();

      if (existingPost) {
        // Post already exists, use regular claim flow
        return await this.claimPost(existingPost.id, user);
      }

      // Create new database entry with user as owner
      const postToInsert = {
        ...localPost,
        user_id: user.id,
        is_trial_post: false,
        expires_at: null,
        status: 'published',
        updated_at: new Date().toISOString()
      };

      const { data: insertedPost, error: insertError } = await supabase
        .from('published_blog_posts')
        .insert([postToInsert])
        .select()
        .single();

      if (insertError) {
        console.error('❌ BlogClaimService: Failed to create database entry:', insertError);
        return {
          success: false,
          message: 'Failed to save post to database',
          error: insertError.message
        };
      }

      console.log('✅ BlogClaimService: Successfully created and claimed post:', insertedPost.id);

      return {
        success: true,
        message: 'Blog post claimed successfully! It has been saved to your account.',
        post: insertedPost
      };
    } catch (error: any) {
      console.error('💥 BlogClaimService: Exception creating localStorage post:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while claiming the post',
        error: error.message
      };
    }
  }

  /**
   * Get claim statistics for a user
   */
  static async getClaimStats(userId: string): Promise<{
    totalClaimed: number;
    totalViews: number;
    averageSeoScore: number;
    totalWordCount: number;
  }> {
    try {
      const { data: claimedPosts, error } = await supabase
        .from('published_blog_posts')
        .select('view_count, seo_score, word_count')
        .eq('user_id', userId)
        .eq('status', 'published')
        .neq('is_trial_post', true);

      if (error || !claimedPosts) {
        return { totalClaimed: 0, totalViews: 0, averageSeoScore: 0, totalWordCount: 0 };
      }

      const totalClaimed = claimedPosts.length;
      const totalViews = claimedPosts.reduce((sum, post) => sum + (post.view_count || 0), 0);
      const totalWordCount = claimedPosts.reduce((sum, post) => sum + (post.word_count || 0), 0);
      const averageSeoScore = totalClaimed > 0 
        ? Math.round(claimedPosts.reduce((sum, post) => sum + (post.seo_score || 0), 0) / totalClaimed)
        : 0;

      return {
        totalClaimed,
        totalViews,
        averageSeoScore,
        totalWordCount
      };
    } catch (error) {
      console.error('Exception getting claim stats:', error);
      return { totalClaimed: 0, totalViews: 0, averageSeoScore: 0, totalWordCount: 0 };
    }
  }
}

export const blogClaimService = BlogClaimService;
