import { blogService, BlogPostGenerationData } from '@/services/blogService';

/**
 * Test the blog system functionality
 * This utility helps test blog creation, reading, updating, and deletion
 */
export class BlogSystemTester {
  private testPostIds: string[] = [];

  /**
   * Run comprehensive blog system tests
   */
  async runTests(userId?: string): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];

    try {
      console.log('🧪 Starting Blog System Tests...');

      // Test 1: Create a test blog post
      const createResult = await this.testCreateBlogPost(userId);
      results.push(createResult);
      if (!createResult.success) {
        errors.push(`Create test failed: ${createResult.error}`);
      }

      // Test 2: Retrieve the created post
      if (createResult.success && createResult.data) {
        const readResult = await this.testReadBlogPost(createResult.data.slug);
        results.push(readResult);
        if (!readResult.success) {
          errors.push(`Read test failed: ${readResult.error}`);
        }

        // Test 3: Update the blog post
        const updateResult = await this.testUpdateBlogPost(createResult.data.id);
        results.push(updateResult);
        if (!updateResult.success) {
          errors.push(`Update test failed: ${updateResult.error}`);
        }

        // Test 4: Search functionality
        const searchResult = await this.testSearchBlogPosts('test');
        results.push(searchResult);
        if (!searchResult.success) {
          errors.push(`Search test failed: ${searchResult.error}`);
        }

        // Test 5: Get user's posts (if userId provided)
        if (userId) {
          const userPostsResult = await this.testGetUserPosts(userId);
          results.push(userPostsResult);
          if (!userPostsResult.success) {
            errors.push(`User posts test failed: ${userPostsResult.error}`);
          }
        }

        // Test 6: Get recent posts
        const recentPostsResult = await this.testGetRecentPosts();
        results.push(recentPostsResult);
        if (!recentPostsResult.success) {
          errors.push(`Recent posts test failed: ${recentPostsResult.error}`);
        }

        // Clean up: Delete test post
        const deleteResult = await this.testDeleteBlogPost(createResult.data.id);
        results.push(deleteResult);
        if (!deleteResult.success) {
          errors.push(`Delete test failed: ${deleteResult.error}`);
        }
      }

      const success = errors.length === 0;
      console.log(`🧪 Blog System Tests ${success ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (errors.length > 0) {
        console.log('❌ Errors:', errors);
      }

      return { success, results, errors };

    } catch (error) {
      console.error('🧪 Blog System Tests failed with exception:', error);
      errors.push(`Test suite exception: ${error.message}`);
      return { success: false, results, errors };
    }
  }

  /**
   * Test creating a blog post
   */
  private async testCreateBlogPost(userId?: string): Promise<any> {
    try {
      console.log('🔨 Testing blog post creation...');

      const testData: BlogPostGenerationData = {
        title: 'Test Blog Post - Auto Generated',
        content: `<h1>Test Blog Post</h1>
        <p>This is a test blog post created automatically to test the blog system functionality.</p>
        <p>It includes some <strong>formatted text</strong> and <a href="https://example.com">links</a>.</p>
        <h2>Features Tested</h2>
        <ul>
          <li>Blog post creation</li>
          <li>Content formatting</li>
          <li>SEO optimization</li>
          <li>Database integration</li>
        </ul>`,
        keywords: ['test', 'blog', 'automated', 'system'],
        targetUrl: 'https://example.com',
        anchorText: 'test link',
        wordCount: 150,
        readingTime: 1,
        seoScore: 85,
        metaDescription: 'This is a test blog post for system validation',
        contextualLinks: []
      };

      const blogPost = await blogService.createBlogPost(testData, userId, !userId);
      this.testPostIds.push(blogPost.id);

      console.log('✅ Blog post created successfully:', blogPost.slug);
      return {
        test: 'createBlogPost',
        success: true,
        data: blogPost,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blog post creation failed:', error);
      return {
        test: 'createBlogPost',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test reading a blog post by slug
   */
  private async testReadBlogPost(slug: string): Promise<any> {
    try {
      console.log('📖 Testing blog post reading...');

      const blogPost = await blogService.getBlogPostBySlug(slug);
      
      if (!blogPost) {
        throw new Error('Blog post not found');
      }

      console.log('✅ Blog post read successfully:', blogPost.title);
      return {
        test: 'readBlogPost',
        success: true,
        data: { slug: blogPost.slug, title: blogPost.title, viewCount: blogPost.view_count },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blog post reading failed:', error);
      return {
        test: 'readBlogPost',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test updating a blog post
   */
  private async testUpdateBlogPost(postId: string): Promise<any> {
    try {
      console.log('✏️ Testing blog post update...');

      const updates = {
        title: 'Test Blog Post - Updated',
        meta_description: 'Updated meta description for testing'
      };

      const updatedPost = await blogService.updateBlogPost(postId, updates);

      console.log('✅ Blog post updated successfully:', updatedPost.title);
      return {
        test: 'updateBlogPost',
        success: true,
        data: { id: updatedPost.id, title: updatedPost.title },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blog post update failed:', error);
      return {
        test: 'updateBlogPost',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test searching blog posts
   */
  private async testSearchBlogPosts(query: string): Promise<any> {
    try {
      console.log('🔍 Testing blog post search...');

      const results = await blogService.searchBlogPosts(query, 10);

      console.log(`✅ Search completed, found ${results.length} posts`);
      return {
        test: 'searchBlogPosts',
        success: true,
        data: { query, resultCount: results.length },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blog post search failed:', error);
      return {
        test: 'searchBlogPosts',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test getting user's blog posts
   */
  private async testGetUserPosts(userId: string): Promise<any> {
    try {
      console.log('👤 Testing user blog posts retrieval...');

      const posts = await blogService.getUserBlogPosts(userId);

      console.log(`✅ User posts retrieved, found ${posts.length} posts`);
      return {
        test: 'getUserPosts',
        success: true,
        data: { userId, postCount: posts.length },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ User posts retrieval failed:', error);
      return {
        test: 'getUserPosts',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test getting recent blog posts
   */
  private async testGetRecentPosts(): Promise<any> {
    try {
      console.log('📰 Testing recent posts retrieval...');

      const posts = await blogService.getRecentBlogPosts(10);

      console.log(`✅ Recent posts retrieved, found ${posts.length} posts`);
      return {
        test: 'getRecentPosts',
        success: true,
        data: { postCount: posts.length },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Recent posts retrieval failed:', error);
      return {
        test: 'getRecentPosts',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test deleting a blog post
   */
  private async testDeleteBlogPost(postId: string): Promise<any> {
    try {
      console.log('🗑️ Testing blog post deletion...');

      await blogService.deleteBlogPost(postId);

      // Try to read the deleted post to confirm deletion
      try {
        const deletedPost = await blogService.getBlogPostById(postId);
        if (deletedPost) {
          throw new Error('Post still exists after deletion');
        }
      } catch (error) {
        // Expected error when post is not found
      }

      console.log('✅ Blog post deleted successfully');
      return {
        test: 'deleteBlogPost',
        success: true,
        data: { deletedPostId: postId },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blog post deletion failed:', error);
      return {
        test: 'deleteBlogPost',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clean up any remaining test posts
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test posts...');
    
    for (const postId of this.testPostIds) {
      try {
        await blogService.deleteBlogPost(postId);
        console.log(`✅ Cleaned up test post: ${postId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clean up test post ${postId}:`, error);
      }
    }
    
    this.testPostIds = [];
  }

  /**
   * Test blog post statistics
   */
  async testBlogStats(userId?: string): Promise<any> {
    try {
      console.log('📊 Testing blog statistics...');

      const stats = await blogService.getBlogPostStats(userId);

      console.log('✅ Blog statistics retrieved:', stats);
      return {
        test: 'getBlogStats',
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blog statistics failed:', error);
      return {
        test: 'getBlogStats',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const blogSystemTester = new BlogSystemTester();

// Export convenience function for quick testing
export async function testBlogSystem(userId?: string) {
  const tester = new BlogSystemTester();
  const results = await tester.runTests(userId);
  
  // Also test stats
  const statsResult = await tester.testBlogStats(userId);
  results.results.push(statsResult);
  
  return results;
}
