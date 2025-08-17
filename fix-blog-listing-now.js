/**
 * Emergency Blog Listing Fix
 * Run this script to immediately fix the blog listing issue
 * 
 * Usage:
 * 1. Open browser console on your site
 * 2. Copy and paste this entire script
 * 3. Press Enter to run
 */

(async function fixBlogListingNow() {
  console.log('🚀 Emergency Blog Listing Fix - Starting...');
  
  try {
    // Step 1: Check if we're on the site and have access to the necessary modules
    if (typeof window === 'undefined') {
      console.error('❌ This script must be run in a browser console');
      return;
    }

    console.log('✅ Running in browser environment');

    // Step 2: Set table preference to use blog_posts (where new posts are created)
    localStorage.setItem('blog_table_preference', 'blog_posts');
    console.log('✅ Set table preference to blog_posts');

    // Step 3: Clear any cached blog data that might be outdated
    const keysToRemove = [
      'all_blog_posts',
      'blog_cache',
      'published_blog_posts_cache',
      'blog_posts_cache'
    ];

    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Cleared ${key} from localStorage`);
      }
    });

    // Step 4: If we're on the blog page, trigger a refresh
    if (window.location.pathname === '/blog') {
      console.log('📍 Detected we are on the blog page');
      
      // Try to trigger a reload of the blog component
      if (window.location.reload) {
        console.log('🔄 Refreshing page to apply fixes...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } else {
      console.log('💡 Navigate to /blog to see the fixed blog listing');
    }

    // Step 5: If Supabase client is available, test the connection
    if (window.supabase || window.supabaseClient) {
      console.log('🔍 Testing database connection...');
      
      try {
        const supabase = window.supabase || window.supabaseClient;
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, title, status')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.warn('⚠️ Database query error:', error.message);
        } else {
          console.log(`✅ Found ${data?.length || 0} published posts in blog_posts table`);
          if (data && data.length > 0) {
            console.log('📝 Recent posts:', data.map(p => p.title?.substring(0, 50)));
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Database test failed:', dbError);
      }
    }

    // Step 6: Provide next steps
    console.log('\n🎉 Emergency fix completed!');
    console.log('📋 Summary of changes:');
    console.log('  ✅ Set table preference to blog_posts');
    console.log('  ✅ Cleared cached blog data');
    console.log('  ✅ Ready to show new posts');
    
    if (window.location.pathname !== '/blog') {
      console.log('\n💡 Next steps:');
      console.log('  1. Navigate to /blog to see the updated blog listing');
      console.log('  2. New posts should now be visible');
    }

    console.log('\n🔧 If posts still don\'t appear:');
    console.log('  1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)');
    console.log('  2. Clear browser cache');
    console.log('  3. Check browser console for any errors');

    return {
      success: true,
      message: 'Blog listing fix applied successfully',
      changes: {
        tablePreference: 'blog_posts',
        clearedCache: keysToRemove,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    
    console.log('\n🆘 Manual fallback steps:');
    console.log('  1. Open browser localStorage (DevTools > Application > Storage)');
    console.log('  2. Set blog_table_preference = "blog_posts"');
    console.log('  3. Clear any blog-related cache entries');
    console.log('  4. Refresh the /blog page');
    
    return {
      success: false,
      error: error.message,
      fallbackSteps: 'Check console for manual steps'
    };
  }
})();

// Additional helper functions for manual debugging
window.blogDebugHelpers = {
  /**
   * Quick test to see what's in each table
   */
  async testTables() {
    if (!window.supabase && !window.supabaseClient) {
      console.error('❌ Supabase client not available');
      return;
    }

    const supabase = window.supabase || window.supabaseClient;
    
    console.log('🔍 Testing both blog tables...');

    // Test blog_posts
    try {
      const { data: blogPosts, error: blogError } = await supabase
        .from('blog_posts')
        .select('id, title, status, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('📊 blog_posts results:');
      if (blogError) {
        console.error('  ❌ Error:', blogError.message);
      } else {
        console.log(`  ✅ Found ${blogPosts?.length || 0} posts`);
        if (blogPosts) {
          blogPosts.forEach(post => {
            console.log(`    - ${post.title?.substring(0, 50)}... (${post.created_at})`);
          });
        }
      }
    } catch (error) {
      console.error('  ❌ blog_posts query failed:', error);
    }

    // Test published_blog_posts
    try {
      const { data: publishedPosts, error: publishedError } = await supabase
        .from('published_blog_posts')
        .select('id, title, status, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      console.log('📊 published_blog_posts results:');
      if (publishedError) {
        console.error('  ❌ Error:', publishedError.message);
      } else {
        console.log(`  ✅ Found ${publishedPosts?.length || 0} posts`);
        if (publishedPosts) {
          publishedPosts.forEach(post => {
            console.log(`    - ${post.title?.substring(0, 50)}... (${post.created_at})`);
          });
        }
      }
    } catch (error) {
      console.error('  ❌ published_blog_posts query failed:', error);
    }
  },

  /**
   * Force refresh blog listing if on blog page
   */
  refreshBlogPage() {
    if (window.location.pathname === '/blog') {
      console.log('🔄 Refreshing blog page...');
      window.location.reload();
    } else {
      console.log('💡 Navigate to /blog first');
    }
  },

  /**
   * Reset all blog-related settings
   */
  resetBlogSettings() {
    const keys = ['blog_table_preference', 'all_blog_posts', 'blog_cache'];
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 Removed ${key}`);
    });
    console.log('✅ All blog settings reset');
  }
};

console.log('🔧 Blog debug helpers available as window.blogDebugHelpers');
console.log('💡 Try: blogDebugHelpers.testTables() to see what\'s in each table');
