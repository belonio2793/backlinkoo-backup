/**
 * Simple Blog Claim Service
 * Handles claiming blog posts with 3-post limit per user
 */

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
   * Get user's current claim statistics
   */
  static async getUserClaimStats(userId: string): Promise<UserClaimStats> {
    try {
      // Try database first
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { count, error } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_trial_post', true);

        if (!error) {
          const claimedCount = count || 0;
          return {
            claimedCount,
            maxClaims: this.MAX_CLAIMS_PER_USER,
            canClaim: claimedCount < this.MAX_CLAIMS_PER_USER
          };
        }
      }
    } catch (error) {
      console.warn('Database error, using localStorage fallback:', error);
    }

    // Fallback to localStorage
    const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    let claimedCount = 0;

    for (const blogMeta of allBlogPosts) {
      const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
      if (blogData) {
        const blogPost = JSON.parse(blogData);
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
   * Claim a blog post for a user
   */
  static async claimBlogPost(blogSlug: string, userId: string): Promise<ClaimResult> {
    try {
      // Check if user can claim more posts
      const stats = await this.getUserClaimStats(userId);
      
      if (!stats.canClaim) {
        return {
          success: false,
          message: `You have reached the maximum limit of ${this.MAX_CLAIMS_PER_USER} claimed posts.`
        };
      }

      // Try database first
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data: existingPost, error: fetchError } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', blogSlug)
            .eq('is_trial_post', true)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          if (!existingPost) {
            return {
              success: false,
              message: 'Blog post not found.'
            };
          }

          if (existingPost.user_id) {
            return {
              success: false,
              message: 'This blog post has already been claimed by another user.'
            };
          }

          // Check if post is expired
          if (existingPost.expires_at && new Date() > new Date(existingPost.expires_at)) {
            return {
              success: false,
              message: 'This blog post has expired and can no longer be claimed.'
            };
          }

          // Claim the post
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ 
              user_id: userId,
              expires_at: null // Remove expiration when claimed
            })
            .eq('slug', blogSlug)
            .eq('is_trial_post', true)
            .is('user_id', null); // Ensure it's still unclaimed

          if (!updateError) {
            return {
              success: true,
              message: 'Blog post claimed successfully! It is now permanently yours.'
            };
          }
        }
      } catch (dbError) {
        console.warn('Database error, using localStorage fallback:', dbError);
      }

      // Fallback to localStorage
      const blogData = localStorage.getItem(`blog_post_${blogSlug}`);
      if (!blogData) {
        return {
          success: false,
          message: 'Blog post not found.'
        };
      }

      const blogPost = JSON.parse(blogData);
      
      if (blogPost.user_id) {
        return {
          success: false,
          message: 'This blog post has already been claimed by another user.'
        };
      }

      // Check if post is expired
      if (blogPost.expires_at && new Date() > new Date(blogPost.expires_at)) {
        return {
          success: false,
          message: 'This blog post has expired and can no longer be claimed.'
        };
      }

      // Claim the post in localStorage
      blogPost.user_id = userId;
      blogPost.expires_at = null; // Remove expiration when claimed
      blogPost.updated_at = new Date().toISOString();
      
      localStorage.setItem(`blog_post_${blogSlug}`, JSON.stringify(blogPost));
      
      return {
        success: true,
        message: 'Blog post claimed successfully! It is now permanently yours.'
      };

    } catch (error) {
      console.error('Failed to claim blog post:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all claimed posts for a user
   */
  static async getUserClaimedPosts(userId: string): Promise<any[]> {
    try {
      // Try database first
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_trial_post', true)
          .order('created_at', { ascending: false });

        if (!error) {
          return data || [];
        }
      }
    } catch (error) {
      console.warn('Database error, using localStorage fallback:', error);
    }

    // Fallback to localStorage
    const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
    const claimedPosts: any[] = [];

    for (const blogMeta of allBlogPosts) {
      const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
      if (blogData) {
        const blogPost = JSON.parse(blogData);
        if (blogPost.user_id === userId && blogPost.is_trial_post) {
          claimedPosts.push(blogPost);
        }
      }
    }

    return claimedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}
