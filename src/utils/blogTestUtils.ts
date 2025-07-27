import { PublishedBlogService } from '../services/publishedBlogService';

/**
 * Test utility to verify blog post creation and retrieval
 */
export const testBlogPostSystem = async () => {
  console.log('🧪 Testing blog post system...');
  
  try {
    const blogService = new PublishedBlogService();
    
    // Create a test blog post
    console.log('📝 Creating test blog post...');
    const testPost = await blogService.createBlogPost({
      keyword: 'test-blog-system',
      targetUrl: 'https://example.com',
      userId: undefined, // Trial post
      isTrialPost: true,
      wordCount: 800
    });
    
    console.log('✅ Test blog post created:', {
      slug: testPost.slug,
      id: testPost.id,
      title: testPost.title,
      publishedUrl: testPost.published_url,
      isTrialPost: testPost.is_trial_post
    });
    
    // Test retrieval
    console.log('🔍 Testing blog post retrieval...');
    const retrievedPost = await blogService.getBlogPostBySlug(testPost.slug);
    
    if (retrievedPost) {
      console.log('✅ Blog post retrieval successful:', {
        slug: retrievedPost.slug,
        title: retrievedPost.title,
        viewCount: retrievedPost.view_count
      });
    } else {
      console.error('❌ Blog post retrieval failed');
      return false;
    }
    
    // Test blog URL accessibility
    const blogUrl = `/blog/${testPost.slug}`;
    console.log(`✅ Blog post should be accessible at: ${window.location.origin}${blogUrl}`);
    
    return {
      success: true,
      testPost,
      blogUrl,
      message: 'Blog post system is working correctly'
    };
    
  } catch (error) {
    console.error('❌ Blog post test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Blog post system test failed'
    };
  }
};

/**
 * Test if a specific blog post exists and is accessible
 */
export const testBlogPostAccess = async (slug: string) => {
  console.log(`🔍 Testing access to blog post: ${slug}`);
  
  try {
    const blogService = new PublishedBlogService();
    const post = await blogService.getBlogPostBySlug(slug);
    
    if (post) {
      console.log('✅ Blog post found and accessible:', {
        slug: post.slug,
        title: post.title,
        status: post.status,
        isTrialPost: post.is_trial_post,
        expiresAt: post.expires_at
      });
      return { success: true, post };
    } else {
      console.warn('⚠️ Blog post not found or expired');
      return { success: false, error: 'Blog post not found or expired' };
    }
  } catch (error) {
    console.error('❌ Error testing blog post access:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Add to window for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testBlogSystem = testBlogPostSystem;
  (window as any).testBlogAccess = testBlogPostAccess;
}

export default { testBlogPostSystem, testBlogPostAccess };
