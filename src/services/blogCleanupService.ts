/**
 * Simple Blog Cleanup Service
 * Automatically removes expired unclaimed blog posts
 */

export class BlogCleanupService {
  /**
   * Clean up expired unclaimed blog posts
   */
  static async cleanupExpiredPosts(): Promise<{ cleaned: number; errors: string[] }> {
    const results = { cleaned: 0, errors: [] as string[] };
    
    try {
      // Clean up from database first
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
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

            if (!deleteError) {
              results.cleaned += expiredPosts.length;
              console.log(`🧹 Cleaned up ${expiredPosts.length} expired posts from database`);
            }
          }
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
}

// Start automatic cleanup when the service is imported
if (typeof window !== 'undefined') {
  // Delay startup to avoid blocking initial app load
  setTimeout(() => {
    BlogCleanupService.startAutomaticCleanup();
  }, 5000); // 5 second delay
}
