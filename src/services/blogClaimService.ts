import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { initializeBlogSystemSafely } from '@/utils/ensureBlogTables';

interface ClaimResult {
  success: boolean;
  message: string;
  error?: string;
}

interface UserClaimStats {
  claimedCount: number;
  maxClaims: number;
  canClaim: boolean;
}

export class BlogClaimService {
  private static readonly MAX_CLAIMS_PER_USER = 3;

  /**
   * Get all published blog posts from the database that can be claimed
   */
  static async getClaimablePosts(limit: number = 20): Promise<any[]> {
    try {
      console.log(`🔍 BlogClaimService: Fetching up to ${limit} claimable posts...`);
      const initResult = await initializeBlogSystemSafely();

      if (initResult.fallbackToLocalStorage) {
        console.warn('⚠️ Using localStorage fallback due to DB issues');
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
        console.error('❌ Error fetching posts:', error);
        return [];
      }

      return (data || []).filter(post => post.id && post.slug && post.title);
    } catch (err) {
      console.error('❌ Unexpected error fetching claimable posts:', err);
      return [];
    }
  }

  /**
   * Get a user's claim statistics
   */
  static async getUserClaimStats(userId: string): Promise<UserClaimStats> {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_trial_post', true);

      const claimedCount = count || 0;

      return {
        claimedCount,
        maxClaims: this.MAX_CLAIMS_PER_USER,
        canClaim: claimedCount < this.MAX_CLAIMS_PER_USER
      };
    } catch (error) {
      console.warn('Database error, using localStorage fallback:', error);
    }

    // Fallback
    const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    let claimedCount = 0;

    for (const meta of allBlogPosts) {
      const post = localStorage.getItem(`blog_post_${meta.slug}`);
      if (post) {
        const blogPost = JSON.parse(post);
        if (blogPost.user_id === userId && blogPost.is_trial_post) {
          claimedCount++;
        }
      }
    }

    return {
      claimedCount,
      maxClaims: this.MAX_CLAIMS_PER_USER,
      canClaim: claimedCount < this.MAX_CLAIMS_PER_USER
    };
  }

  /**
   * Claim a blog post
   */
  static async claimBlogPost(blogSlug: string, userId: string): Promise<ClaimResult> {
    try {
      const stats = await this.getUserClaimStats(userId);

      if (!stats.canClaim) {
        return {
          success: false,
          message: `You’ve reached the maximum of ${this.MAX_CLAIMS_PER_USER} claimed posts.`
        };
      }

      const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', blogSlug)
        .eq('is_trial_post', true)
        .single();

      if (error || !post) {
        return { success: false, message: 'Blog post not found.' };
      }

      if (post.user_id) {
        return { success: false, message: 'This blog post has already been claimed.' };
      }

      if (post.expires_at && new Date() > new Date(post.expires_at)) {
        return { success: false, message: 'This blog post has expired.' };
      }

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          user_id: userId,
          expires_at: null
        })
        .eq('slug', blogSlug)
        .eq('is_trial_post', true)
        .is('user_id', null);

      if (updateError) {
        return { success: false, message: 'Failed to claim blog post.' };
      }

      return {
        success: true,
        message: 'Blog post claimed successfully! It’s now permanently yours.'
      };
    } catch (error) {
      console.error('❌ Failed to claim post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all claimed posts for a user
   */
  static async getUserClaimedPosts(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trial_post', true)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.warn('⚠️ DB error, using fallback:', error);
    }

    const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    const claimed = [];

    for (const meta of allBlogPosts) {
      const post = localStorage.getItem(`blog_post_${meta.slug}`);
      if (post) {
        const blogPost = JSON.parse(post);
        if (blogPost.user_id === userId && blogPost.is_trial_post) {
          claimed.push(blogPost);
        }
      }
    }

    return claimed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}