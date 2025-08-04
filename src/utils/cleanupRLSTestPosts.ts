import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to clean up RLS test posts from the database
 */
export class RLSTestPostsCleanup {
  
  /**
   * Remove all RLS test posts from the database
   */
  static async cleanupTestPosts(): Promise<{ 
    success: boolean; 
    deletedCount: number; 
    error?: string 
  }> {
    console.log('🧹 Cleaning up RLS test posts...');
    
    try {
      // Find all RLS test posts
      const { data: testPosts, error: findError } = await supabase
        .from('blog_posts')
        .select('id, title, slug')
        .or('title.eq.RLS Test Post,slug.like.rls-test-%');
      
      if (findError) {
        console.error('❌ Error finding test posts:', findError.message);
        return { success: false, deletedCount: 0, error: findError.message };
      }

      if (!testPosts || testPosts.length === 0) {
        console.log('✅ No RLS test posts found to clean up');
        return { success: true, deletedCount: 0 };
      }

      console.log(`📊 Found ${testPosts.length} RLS test posts to delete`);

      // Delete all test posts
      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .or('title.eq.RLS Test Post,slug.like.rls-test-%');

      if (deleteError) {
        console.error('❌ Error deleting test posts:', deleteError.message);
        return { success: false, deletedCount: 0, error: deleteError.message };
      }

      console.log(`✅ Successfully deleted ${testPosts.length} RLS test posts`);
      return { success: true, deletedCount: testPosts.length };

    } catch (error: any) {
      console.error('❌ Unexpected error during cleanup:', error.message);
      return { success: false, deletedCount: 0, error: error.message };
    }
  }

  /**
   * Clean up test posts and log results
   */
  static async runCleanup(): Promise<void> {
    const result = await this.cleanupTestPosts();
    
    if (result.success) {
      if (result.deletedCount > 0) {
        console.log(`🎉 Cleanup complete! Removed ${result.deletedCount} RLS test posts.`);
      } else {
        console.log('✨ No test posts found - database is clean!');
      }
    } else {
      console.error(`❌ Cleanup failed: ${result.error}`);
    }
  }
}

// Export convenience function
export const cleanupRLSTestPosts = () => RLSTestPostsCleanup.runCleanup();
