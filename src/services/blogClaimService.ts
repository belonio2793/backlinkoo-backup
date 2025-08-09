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
        .from('blog_posts')
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
   * Get a user's claim statistics from all sources
   */
  static async getUserClaimStats(userId: string): Promise<UserClaimStats> {
    let claimedCount = 0;

    try {
      // Count from blog_posts table
      const { count: blogCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_trial_post', true);

      // Count from both blog_posts locations (old code kept for compatibility)
      const { count: publishedCount } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_trial_post', true);

      claimedCount = (blogCount || 0) + (publishedCount || 0);
    } catch (error) {
      console.warn('Database error, using localStorage fallback:', error);

      // Fallback to localStorage
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      for (const meta of allBlogPosts) {
        const postData = localStorage.getItem(`blog_post_${meta.slug}`);
        if (postData) {
          const post = JSON.parse(postData);
          if (post.user_id === userId && post.is_trial_post) {
            claimedCount++;
          }
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
    const claimedPosts: any[] = [];

    try {
      // Get from blog_posts table
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trial_post', true)
        .order('created_at', { ascending: false });

      if (blogPosts) claimedPosts.push(...blogPosts);

      // Get additional posts from blog_posts table (unified approach)
      const { data: publishedPosts, error: publishedError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_trial_post', false) // Get permanently claimed posts
        .order('created_at', { ascending: false });

      if (publishedPosts) claimedPosts.push(...publishedPosts);
    } catch (error) {
      console.warn('⚠️ DB error, using localStorage fallback:', error);
    }

    // Add localStorage posts
    try {
      const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      for (const meta of allBlogPosts) {
        const postData = localStorage.getItem(`blog_post_${meta.slug}`);
        if (postData) {
          const post = JSON.parse(postData);
          if (post.user_id === userId && post.is_trial_post) {
            // Check if already in DB results
            if (!claimedPosts.find(p => p.slug === post.slug)) {
              claimedPosts.push(post);
            }
          }
        }
      }
    } catch (storageError) {
      console.warn('⚠️ localStorage error:', storageError);
    }

    // Remove duplicates and sort
    const uniquePosts = claimedPosts.filter((post, index, self) =>
      index === self.findIndex(p => p.slug === post.slug)
    );

    return uniquePosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Can user claim more posts?
   */
  static async canUserClaimMore(user: any): Promise<{ canClaim: boolean; reason?: string }> {
    const stats = await this.getUserClaimStats(user.id);

    if (!stats.canClaim) {
      return {
        canClaim: false,
        reason: `You've reached the maximum of ${this.MAX_CLAIMS_PER_USER} claimed posts.`
      };
    }

    return { canClaim: true };
  }

  /**
   * Claim a post by ID (for use with different post objects)
   */
  static async claimPost(postId: string, user: any): Promise<ClaimResult> {
    try {
      // Find the post by ID in either table
      let post = null;
      let tableName = '';

      const { data: blogPost } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (blogPost) {
        post = blogPost;
        tableName = 'blog_posts';
      } else {
        // Only use blog_posts table now (unified approach)
        // This section removed as we now only check blog_posts table above
      }

      if (!post) {
        return { success: false, message: 'Post not found.' };
      }

      return await this.claimBlogPost(post.slug, user.id);
    } catch (error) {
      console.error('❌ Failed to claim post by ID:', error);
      return { success: false, message: 'Failed to claim post.' };
    }
  }

  /**
   * Unclaim a post
   */
  static async unclaimPost(postId: string, user: any): Promise<ClaimResult> {
    try {
      // Only use blog_posts table (unified approach)
      const { error: blogError } = await supabase
        .from('blog_posts')
        .update({ user_id: null, claimed_at: null })
        .eq('id', postId)
        .eq('user_id', user.id);

      return {
        success: true,
        message: 'Post unclaimed successfully.'
      };
    } catch (error) {
      console.error('❌ Failed to unclaim post:', error);
      return { success: false, message: 'Failed to unclaim post.' };
    }
  }

  /**
   * Enhanced claim method that tries both tables and localStorage
   */
  static async claimBlogPostEnhanced(blogSlug: string, userId: string): Promise<ClaimResult> {
    try {
      console.log(`🎯 Attempting to claim post: ${blogSlug} for user: ${userId}`);

      const stats = await this.getUserClaimStats(userId);
      if (!stats.canClaim) {
        return {
          success: false,
          message: `You've reached the maximum of ${this.MAX_CLAIMS_PER_USER} claimed posts.`
        };
      }

      // Try blog_posts table first
      const { data: blogPost, error: blogError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', blogSlug)
        .eq('is_trial_post', true)
        .maybeSingle();

      // Only use blog_posts table (unified approach)
      const post = blogPost;
      const foundInBlogPosts = !!blogPost;

      if (!post) {
        // Fallback to localStorage
        return await this.claimPostFromLocalStorage(blogSlug, userId);
      }

      if (post.user_id) {
        return { success: false, message: 'This blog post has already been claimed.' };
      }

      if (post.expires_at && new Date() > new Date(post.expires_at)) {
        return { success: false, message: 'This blog post has expired.' };
      }

      // Update blog_posts table (unified approach)
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          user_id: userId,
          expires_at: null,
          claimed_at: new Date().toISOString()
        })
        .eq('slug', blogSlug)
        .eq('is_trial_post', true)
        .is('user_id', null);

      if (updateError) {
        console.error('❌ Failed to update database:', updateError);
        return { success: false, message: 'Failed to claim blog post.' };
      }

      console.log(`✅ Successfully claimed post ${blogSlug} in blog_posts table`);
      return {
        success: true,
        message: 'Blog post claimed successfully! It\'s now permanently yours.'
      };
    } catch (error) {
      console.error('❌ Failed to claim post:', error);

      // Fallback to localStorage if database fails
      return await this.claimPostFromLocalStorage(blogSlug, userId);
    }
  }

  /**
   * Claim post from localStorage (fallback)
   */
  private static async claimPostFromLocalStorage(blogSlug: string, userId: string): Promise<ClaimResult> {
    try {
      const postData = localStorage.getItem(`blog_post_${blogSlug}`);
      if (!postData) {
        return { success: false, message: 'Blog post not found.' };
      }

      const post = JSON.parse(postData);
      if (post.user_id) {
        return { success: false, message: 'This blog post has already been claimed.' };
      }

      if (post.expires_at && new Date() > new Date(post.expires_at)) {
        return { success: false, message: 'This blog post has expired.' };
      }

      // Update localStorage
      post.user_id = userId;
      post.expires_at = null;
      post.claimed_at = new Date().toISOString();
      post.is_trial_post = true; // Keep as trial but claimed

      localStorage.setItem(`blog_post_${blogSlug}`, JSON.stringify(post));

      console.log(`✅ Successfully claimed post ${blogSlug} in localStorage`);
      return {
        success: true,
        message: 'Blog post claimed successfully! It\'s now permanently yours.'
      };
    } catch (error) {
      console.error('❌ Failed to claim from localStorage:', error);
      return { success: false, message: 'Failed to claim blog post.' };
    }
  }
}
