import { createClient } from '@supabase/supabase-js';

// You'll need to update these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupRLSTestPosts() {
  console.log('🧹 Cleaning up RLS test posts...');
  
  try {
    // Find all RLS test posts
    const { data: testPosts, error: findError } = await supabase
      .from('blog_posts')
      .select('id, title, slug')
      .or('title.eq.RLS Test Post,slug.like.rls-test-%');
    
    if (findError) {
      console.error('❌ Error finding test posts:', findError.message);
      return;
    }

    if (!testPosts || testPosts.length === 0) {
      console.log('✅ No RLS test posts found to clean up');
      return;
    }

    console.log(`📊 Found ${testPosts.length} RLS test posts to delete`);

    // Delete all test posts
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .or('title.eq.RLS Test Post,slug.like.rls-test-%');

    if (deleteError) {
      console.error('❌ Error deleting test posts:', deleteError.message);
      return;
    }

    console.log(`✅ Successfully deleted ${testPosts.length} RLS test posts`);

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error.message);
  }
}

cleanupRLSTestPosts();
