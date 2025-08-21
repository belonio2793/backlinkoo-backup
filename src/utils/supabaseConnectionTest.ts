/**
 * Supabase Connection Test Utility
 * Tests the Supabase connection and API key configuration
 */

import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Check environment variables
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Environment check:', {
      hasUrl,
      hasKey,
      url: import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 30)}...` : 'missing',
      keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'missing'
    });

    if (!hasUrl || !hasKey) {
      return {
        success: false,
        error: 'Missing environment variables',
        details: { hasUrl, hasKey }
      };
    }

    // Test basic connection
    console.log('🔗 Testing basic Supabase connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('✅ Supabase connection test successful');
    return {
      success: true,
      details: { hasUrl, hasKey, dataReturned: !!data }
    };

  } catch (error: any) {
    console.error('❌ Supabase connection test error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error
    };
  }
}

export async function testBlogTablesAccess(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  try {
    console.log('📖 Testing blog tables access...');

    // Test published_blog_posts
    console.log('Testing published_blog_posts table...');
    const { data: publishedData, error: publishedError } = await supabase
      .from('published_blog_posts')
      .select('id, title')
      .limit(1);

    // Test blog_posts fallback
    console.log('Testing blog_posts table...');
    const { data: blogData, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title')
      .limit(1);

    const results = {
      published_blog_posts: {
        accessible: !publishedError,
        error: publishedError?.message,
        hasData: !!publishedData?.length
      },
      blog_posts: {
        accessible: !blogError,
        error: blogError?.message,
        hasData: !!blogData?.length
      }
    };

    console.log('📊 Blog tables test results:', results);

    const success = results.published_blog_posts.accessible || results.blog_posts.accessible;

    return {
      success,
      error: success ? undefined : 'Neither blog table is accessible',
      details: results
    };

  } catch (error: any) {
    console.error('❌ Blog tables test error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      details: error
    };
  }
}

// Auto-run tests in development
if (import.meta.env.DEV) {
  setTimeout(async () => {
    console.log('🚀 Running Supabase connection tests...');
    
    const connectionTest = await testSupabaseConnection();
    console.log('Connection test result:', connectionTest);
    
    if (connectionTest.success) {
      const blogTest = await testBlogTablesAccess();
      console.log('Blog tables test result:', blogTest);
    }
  }, 3000);
}
