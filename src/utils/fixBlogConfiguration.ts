/**
 * Utility to fix common blog configuration issues
 */

export async function fixBlogConfiguration() {
  console.log('🔧 Running blog configuration fix...');
  
  try {
    // Step 1: Verify environment variables
    console.log('1️⃣ Checking environment variables...');
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!hasUrl || !hasKey) {
      console.error('❌ Missing environment variables');
      console.log('💡 Fix: Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
      console.log('💡 Current status:', { hasUrl, hasKey });
      
      // Try to reload the page to pick up environment changes
      console.log('🔄 Reloading page to pick up environment variables...');
      setTimeout(() => window.location.reload(), 2000);
      return { success: false, action: 'reloading' };
    }
    
    console.log('✅ Environment variables present');

    // Step 2: Test Supabase connection
    console.log('2️⃣ Testing Supabase connection...');
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      
      if (error.message?.includes('No API key') || error.code === 'PGRST000') {
        console.log('🔧 API key issue detected - attempting fix...');
        
        // Clear any cached connection issues
        if (localStorage.getItem('supabase_connection_error')) {
          localStorage.removeItem('supabase_connection_error');
          console.log('🧹 Cleared cached connection errors');
        }
        
        // Force reload to reinitialize Supabase client
        console.log('🔄 Forcing page reload to reinitialize Supabase...');
        setTimeout(() => window.location.reload(), 1000);
        return { success: false, action: 'reloading_for_api_key' };
      }
      
      return { success: false, error };
    }
    
    console.log('✅ Supabase connection working');

    // Step 3: Test blog tables specifically
    console.log('3️⃣ Testing blog table access...');
    
    let publishedWorking = false;
    let blogWorking = false;
    
    // Test published_blog_posts
    try {
      const { data: pubData, error: pubError } = await supabase
        .from('published_blog_posts')
        .select('id')
        .limit(1);
        
      if (!pubError) {
        publishedWorking = true;
        console.log('✅ published_blog_posts table accessible');
      } else {
        console.log('⚠️ published_blog_posts issue:', pubError.message);
      }
    } catch (err) {
      console.log('⚠️ published_blog_posts error:', err);
    }
    
    // Test blog_posts fallback
    try {
      const { data: blogData, error: blogError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);
        
      if (!blogError) {
        blogWorking = true;
        console.log('✅ blog_posts table accessible');
      } else {
        console.log('⚠️ blog_posts issue:', blogError.message);
      }
    } catch (err) {
      console.log('⚠️ blog_posts error:', err);
    }

    if (!publishedWorking && !blogWorking) {
      console.error('❌ Neither blog table is accessible');
      console.log('💡 This might be a database schema or RLS policy issue');
      return { success: false, issue: 'no_blog_tables_accessible' };
    }

    // Step 4: Test blog services
    console.log('4️⃣ Testing blog services...');
    
    try {
      const { UnifiedClaimService } = await import('@/services/unifiedClaimService');
      const posts = await UnifiedClaimService.getAvailablePosts(1);
      console.log(`✅ Blog services working - found ${posts.length} posts`);
      
      if (posts.length === 0) {
        console.log('ℹ️ No blog posts found - this is why the page shows empty state');
        console.log('💡 You may need to create some blog posts first');
        return { success: true, issue: 'no_posts_available' };
      }
      
    } catch (serviceError: any) {
      console.error('❌ Blog services failed:', serviceError);
      return { success: false, issue: 'service_error', error: serviceError };
    }

    console.log('✅ Blog configuration check complete - everything working!');
    
    // If we get here, the issue might be with the blog page component
    console.log('💡 Blog services work but page shows empty - checking blog component...');
    
    // Trigger a manual reload of blog posts if possible
    try {
      // Look for the blog page's refresh function
      const blogRefreshButton = document.querySelector('[data-testid="refresh-posts-button"]');
      if (blogRefreshButton) {
        console.log('🔄 Triggering blog refresh...');
        (blogRefreshButton as HTMLElement).click();
      } else {
        console.log('🔄 Refresh button not found - trying page reload...');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (refreshError) {
      console.log('⚠️ Could not trigger refresh, reloading page...');
      setTimeout(() => window.location.reload(), 1000);
    }
    
    return { success: true };

  } catch (error: any) {
    console.error('❌ Blog configuration fix failed:', error);
    return { success: false, error };
  }
}

// Auto-run in development if blog page is showing empty state
if (import.meta.env.DEV) {
  (window as any).fixBlogConfiguration = fixBlogConfiguration;
  
  // Auto-run fix if we detect empty blog state
  setTimeout(() => {
    const emptyState = document.querySelector('text-2xl') as HTMLElement;
    if (emptyState && emptyState.textContent?.includes('No blog posts yet')) {
      console.log('🔍 Detected empty blog state - running automatic fix...');
      fixBlogConfiguration();
    }
  }, 6000);
}
