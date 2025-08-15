// Debug script to check blog post
const slug = 'unlocking-the-power-of-forum-profile-backlinks-a-definitive-guide-me9uwo9p';

console.log('🔍 Debugging blog post:', slug);

// Check if we can access Supabase
async function debugBlogPost() {
  try {
    // Import Supabase client
    const { supabase } = await import('./src/integrations/supabase/client.ts');
    
    console.log('📡 Testing database connection...');
    
    // Check if the specific post exists
    console.log('🔍 Looking for specific slug:', slug);
    const { data: specificPost, error: specificError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug);
    
    if (specificError) {
      console.error('❌ Error querying specific post:', specificError);
    } else {
      console.log('📄 Specific post results:', specificPost?.length || 0, 'posts found');
      if (specificPost && specificPost.length > 0) {
        const post = specificPost[0];
        console.log('📝 Post details:');
        console.log('  - Title:', post.title?.substring(0, 50) + '...');
        console.log('  - Status:', post.status);
        console.log('  - Content length:', post.content?.length || 0);
        console.log('  - Created:', post.created_at);
        console.log('  - Has content:', !!post.content);
        console.log('  - Content preview:', post.content?.substring(0, 100) + '...');
      }
    }
    
    // Check for similar posts
    console.log('🔍 Looking for similar posts...');
    const { data: similarPosts, error: similarError } = await supabase
      .from('blog_posts')
      .select('slug, title, status, created_at')
      .ilike('slug', '%forum-profile-backlinks%')
      .limit(5);
    
    if (similarError) {
      console.error('❌ Error querying similar posts:', similarError);
    } else {
      console.log('🔎 Similar posts found:', similarPosts?.length || 0);
      similarPosts?.forEach(post => {
        console.log(`  - ${post.slug} (${post.status})`);
      });
    }
    
    // Check all recent posts to see what's in the database
    console.log('📋 Recent posts in database...');
    const { data: recentPosts, error: recentError } = await supabase
      .from('blog_posts')
      .select('slug, title, status, created_at, content')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('❌ Error querying recent posts:', recentError);
    } else {
      console.log('📚 Recent posts found:', recentPosts?.length || 0);
      recentPosts?.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.slug} (${post.status}) - Content: ${post.content?.length || 0} chars`);
      });
    }
    
  } catch (error) {
    console.error('💥 Debug script failed:', error);
  }
}

// Run the debug
debugBlogPost();
