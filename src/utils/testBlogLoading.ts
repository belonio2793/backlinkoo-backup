/**
 * Test utility specifically for debugging blog loading issues
 */

import { UnifiedClaimService } from '@/services/unifiedClaimService';
import { ClaimableBlogService } from '@/services/claimableBlogService';

export async function testBlogLoading() {
  console.log('🔍 Testing blog loading functionality...');
  
  try {
    // Test 1: Check environment variables
    console.log('📋 Environment Check:');
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log(`  - VITE_SUPABASE_URL: ${hasUrl ? '✅ Present' : '❌ Missing'}`);
    console.log(`  - VITE_SUPABASE_ANON_KEY: ${hasKey ? '✅ Present' : '❌ Missing'}`);
    
    if (!hasUrl || !hasKey) {
      console.error('❌ Environment variables missing - this will cause "No API key found" errors');
      return { success: false, issue: 'missing_env_vars' };
    }

    // Test 2: Test Supabase client initialization
    console.log('🔗 Testing Supabase client...');
    const { supabase } = await import('@/integrations/supabase/client');
    console.log('✅ Supabase client imported successfully');

    // Test 3: Test basic connection with profiles table
    console.log('🧪 Testing basic Supabase connection...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.error('❌ Basic connection test failed:', {
        message: profilesError.message,
        code: profilesError.code,
        details: profilesError.details
      });
      return { success: false, issue: 'connection_failed', error: profilesError };
    }
    
    console.log('✅ Basic Supabase connection working');

    // Test 4: Test UnifiedClaimService.getAvailablePosts
    console.log('📖 Testing UnifiedClaimService.getAvailablePosts...');
    try {
      const posts1 = await UnifiedClaimService.getAvailablePosts(5);
      console.log(`�� UnifiedClaimService returned ${posts1.length} posts`);
      
      if (posts1.length > 0) {
        console.log('📝 Sample post:', {
          id: posts1[0].id,
          title: posts1[0].title?.substring(0, 50) + '...',
          slug: posts1[0].slug,
          status: posts1[0].status
        });
      }
    } catch (unifiedError: any) {
      console.error('❌ UnifiedClaimService.getAvailablePosts failed:', unifiedError);
      console.log('🔄 Trying fallback service...');
    }

    // Test 5: Test ClaimableBlogService.getClaimablePosts fallback
    console.log('📚 Testing ClaimableBlogService.getClaimablePosts...');
    try {
      const posts2 = await ClaimableBlogService.getClaimablePosts(5);
      console.log(`✅ ClaimableBlogService returned ${posts2.length} posts`);
      
      if (posts2.length > 0) {
        console.log('📝 Sample post:', {
          id: posts2[0].id,
          title: posts2[0].title?.substring(0, 50) + '...',
          slug: posts2[0].slug,
          status: posts2[0].status
        });
      }
    } catch (claimableError: any) {
      console.error('❌ ClaimableBlogService.getClaimablePosts failed:', claimableError);
    }

    // Test 6: Test individual table access
    console.log('🗄️ Testing direct table access...');
    
    // Test published_blog_posts
    try {
      const { data: publishedData, error: publishedError } = await supabase
        .from('published_blog_posts')
        .select('id, title, status')
        .limit(3);

      if (publishedError) {
        console.log('⚠️ published_blog_posts access failed:', {
          message: publishedError.message,
          code: publishedError.code
        });
      } else {
        console.log(`✅ published_blog_posts accessible: ${publishedData?.length || 0} records`);
      }
    } catch (publishedErr) {
      console.log('⚠️ published_blog_posts table error:', publishedErr);
    }

    // Test blog_posts fallback
    try {
      const { data: blogData, error: blogError } = await supabase
        .from('blog_posts')
        .select('id, title, status')
        .limit(3);

      if (blogError) {
        console.log('⚠️ blog_posts access failed:', {
          message: blogError.message,
          code: blogError.code
        });
      } else {
        console.log(`✅ blog_posts accessible: ${blogData?.length || 0} records`);
      }
    } catch (blogErr) {
      console.log('⚠️ blog_posts table error:', blogErr);
    }

    // Test 7: Check localStorage for any cached posts
    console.log('💾 Checking localStorage for cached posts...');
    try {
      const cachedPosts = localStorage.getItem('all_blog_posts');
      if (cachedPosts) {
        const parsed = JSON.parse(cachedPosts);
        console.log(`✅ Found ${Array.isArray(parsed) ? parsed.length : 0} cached posts in localStorage`);
      } else {
        console.log('ℹ️ No cached posts in localStorage');
      }
    } catch (storageErr) {
      console.log('⚠️ localStorage check failed:', storageErr);
    }

    console.log('✅ Blog loading test completed');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Blog loading test failed:', error);
    return { success: false, error };
  }
}

// Auto-run in development
if (import.meta.env.DEV) {
  (window as any).testBlogLoading = testBlogLoading;
  
  // Auto-run test after other diagnostics
  setTimeout(testBlogLoading, 4000);
}
