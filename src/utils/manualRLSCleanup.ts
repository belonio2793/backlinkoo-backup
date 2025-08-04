import { supabase } from '@/integrations/supabase/client';

/**
 * Manual cleanup function that can be called from browser console
 */
export async function manualCleanupRLSTestPosts() {
  console.log('🧹 Starting manual cleanup of RLS test posts...');
  
  try {
    // Find all RLS test posts
    const { data: testPosts, error: findError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, created_at')
      .or('title.eq.RLS Test Post,slug.like.rls-test-%');
    
    if (findError) {
      console.error('❌ Error finding test posts:', findError.message);
      return { success: false, error: findError.message };
    }

    if (!testPosts || testPosts.length === 0) {
      console.log('✅ No RLS test posts found to clean up');
      return { success: true, deletedCount: 0 };
    }

    console.log(`📊 Found ${testPosts.length} RLS test posts:`);
    testPosts.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title} (${post.slug}) - Created: ${post.created_at}`);
    });

    // Delete all test posts
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .or('title.eq.RLS Test Post,slug.like.rls-test-%');

    if (deleteError) {
      console.error('❌ Error deleting test posts:', deleteError.message);
      return { success: false, error: deleteError.message };
    }

    console.log(`✅ Successfully deleted ${testPosts.length} RLS test posts`);
    return { success: true, deletedCount: testPosts.length };

  } catch (error: any) {
    console.error('❌ Unexpected error during cleanup:', error.message);
    return { success: false, error: error.message };
  }
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).cleanupRLSTestPosts = manualCleanupRLSTestPosts;
  console.log('🔧 RLS cleanup utility available: window.cleanupRLSTestPosts()');
}
