import { supabase } from '@/integrations/supabase/client';

export class BlogCleanupService {
  /**
   * Clean up expired unclaimed blog posts
   */
  static async cleanupExpiredPosts(): Promise<{ cleaned: number; errors: string[] }> {
    const results = { cleaned: 0, errors: [] as string[] };
    
    try {
      // Clean up from database first
      try {
        const { data: expiredPosts, error: fetchError } = await supabase
          .from('blog_posts')
          .select('id, slug, expires_at')
          .eq('is_trial_post', true)
          .is('user_id', null) // Only unclaimed posts
          .not('expires_at', 'is', null)
          .lt('expires_at', new Date().toISOString());

        if (fetchError) {
          throw fetchError;
        }

        if (expiredPosts && expiredPosts.length > 0) {
          const expiredIds = expiredPosts.map(post => post.id);
          
          const { error: deleteError } = await supabase
            .from('blog_posts')
            .delete()
            .in('id', expiredIds);

          if (deleteError) {
            throw deleteError;
          }

          results.cleaned += expiredPosts.length;
          console.log(`🧹 Cleaned up ${expiredPosts.length} expired posts from database`);
        }

      } catch (dbError) {
        console.warn('Database cleanup failed, proceeding with localStorage cleanup:', dbError);
        results.errors.push(`Database cleanup failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }

      // Clean up from localStorage
      try {
        const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        const currentTime = new Date();
        const validPosts: any[] = [];
        let localCleaned = 0;

        for (const blogMeta of allBlogPosts) {
          const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
          if (blogData) {
            const blogPost = JSON.parse(blogData);
            
            // Check if post is expired and unclaimed
            if (blogPost.is_trial_post && 
                !blogPost.user_id && 
                blogPost.expires_at && 
                currentTime > new Date(blogPost.expires_at)) {
              
              // Remove expired post
              localStorage.removeItem(`blog_post_${blogMeta.slug}`);
              localCleaned++;
              console.log(`🗑️ Removed expired post: ${blogPost.title}`);
            } else {
              // Keep valid post
              validPosts.push(blogMeta);
            }
          } else {
            // Remove broken reference
            console.log(`🔧 Removed broken blog reference: ${blogMeta.slug}`);
          }
        }

        // Update the blog posts index
        localStorage.setItem('all_blog_posts', JSON.stringify(validPosts));
        
        if (localCleaned > 0) {
          results.cleaned += localCleaned;
          console.log(`🧹 Cleaned up ${localCleaned} expired posts from localStorage`);
        }

      } catch (storageError) {
        console.error('localStorage cleanup failed:', storageError);
        results.errors.push(`localStorage cleanup failed: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
      }

      console.log(`✅ Cleanup completed. Total cleaned: ${results.cleaned}, Errors: ${results.errors.length}`);
      return results;

    } catch (error) {
      console.error('❌ Cleanup service failed:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  /**
   * Start automatic cleanup timer (runs every hour)
   */
  static startAutomaticCleanup(): void {
    // Run cleanup immediately on start
    this.cleanupExpiredPosts();

    // Set up interval to run every hour
    setInterval(() => {
      console.log('🕒 Running scheduled blog post cleanup...');
      this.cleanupExpiredPosts();
    }, 60 * 60 * 1000); // 1 hour

    console.log('⏰ Automatic blog post cleanup started (runs every hour)');
  }

  /**
   * Get posts that will expire soon (within 2 hours)
   */
  static async getExpiringPosts(): Promise<any[]> {
    const expiringPosts: any[] = [];
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    try {
      // Check database
      try {
        const { data: dbPosts, error: dbError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_trial_post', true)
          .is('user_id', null)
          .not('expires_at', 'is', null)
          .gte('expires_at', new Date().toISOString())
          .lt('expires_at', twoHoursFromNow.toISOString());

        if (dbError) {
          throw dbError;
        }

        expiringPosts.push(...(dbPosts || []));

      } catch (dbError) {
        console.warn('Failed to check expiring posts in database:', dbError);
      }

      // Check localStorage
      try {
        const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');

        for (const blogMeta of allBlogPosts) {
          const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
          if (blogData) {
            const blogPost = JSON.parse(blogData);
            
            if (blogPost.is_trial_post && 
                !blogPost.user_id && 
                blogPost.expires_at) {
              
              const expiresAt = new Date(blogPost.expires_at);
              const now = new Date();
              
              if (expiresAt > now && expiresAt <= twoHoursFromNow) {
                // Check if already exists in results from database
                if (!expiringPosts.find(p => p.slug === blogPost.slug)) {
                  expiringPosts.push(blogPost);
                }
              }
            }
          }
        }

      } catch (storageError) {
        console.warn('Failed to check expiring posts in localStorage:', storageError);
      }

      return expiringPosts;

    } catch (error) {
      console.error('Failed to get expiring posts:', error);
      return [];
    }
  }

  /**
   * Get statistics about blog posts
   */
  static async getCleanupStats(): Promise<{
    totalPosts: number;
    claimedPosts: number;
    unclaimedPosts: number;
    expiringPosts: number;
  }> {
    const stats = {
      totalPosts: 0,
      claimedPosts: 0,
      unclaimedPosts: 0,
      expiringPosts: 0
    };

    try {
      // Get from database
      try {
        const { count: totalCount } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('is_trial_post', true);

        const { count: claimedCount } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('is_trial_post', true)
          .not('user_id', 'is', null);

        stats.totalPosts += totalCount || 0;
        stats.claimedPosts += claimedCount || 0;
        stats.unclaimedPosts += (totalCount || 0) - (claimedCount || 0);

      } catch (dbError) {
        console.warn('Failed to get stats from database:', dbError);
      }

      // Get from localStorage
      try {
        const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
        let localTotal = 0;
        let localClaimed = 0;

        for (const blogMeta of allBlogPosts) {
          const blogData = localStorage.getItem(`blog_post_${blogMeta.slug}`);
          if (blogData) {
            const blogPost = JSON.parse(blogData);
            if (blogPost.is_trial_post) {
              localTotal++;
              if (blogPost.user_id) {
                localClaimed++;
              }
            }
          }
        }

        stats.totalPosts += localTotal;
        stats.claimedPosts += localClaimed;
        stats.unclaimedPosts += localTotal - localClaimed;

      } catch (storageError) {
        console.warn('Failed to get stats from localStorage:', storageError);
      }

      // Get expiring posts count
      const expiringPosts = await this.getExpiringPosts();
      stats.expiringPosts = expiringPosts.length;

      return stats;

    } catch (error) {
      console.error('Failed to get cleanup stats:', error);
      return stats;
    }
  }
}

// Start automatic cleanup when the service is imported
if (typeof window !== 'undefined') {
  // Delay startup to avoid blocking initial app load
  setTimeout(() => {
    BlogCleanupService.startAutomaticCleanup();
  }, 5000); // 5 second delay
}
