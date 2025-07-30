import { EnhancedBlogWorkflow, type BlogCreationRequest } from '@/services/enhancedBlogWorkflow';

/**
 * Test the enhanced blog creation workflow
 */
export class EnhancedBlogWorkflowTester {
  
  /**
   * Run comprehensive workflow tests
   */
  async runWorkflowTests(userId?: string): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];

    try {
      console.log('🚀 Starting Enhanced Blog Workflow Tests...');

      // Test 1: Basic blog creation
      const basicTest = await this.testBasicBlogCreation(userId);
      results.push(basicTest);
      if (!basicTest.success) {
        errors.push(`Basic creation failed: ${basicTest.error}`);
      }

      // Test 2: Blog creation with custom settings
      const advancedTest = await this.testAdvancedBlogCreation(userId);
      results.push(advancedTest);
      if (!advancedTest.success) {
        errors.push(`Advanced creation failed: ${advancedTest.error}`);
      }

      // Test 3: User management operations (if user provided)
      if (userId) {
        const managementTest = await this.testBlogManagement(userId);
        results.push(managementTest);
        if (!managementTest.success) {
          errors.push(`Management failed: ${managementTest.error}`);
        }
      }

      // Test 4: Error handling
      const errorTest = await this.testErrorHandling();
      results.push(errorTest);
      if (!errorTest.success) {
        errors.push(`Error handling failed: ${errorTest.error}`);
      }

      const success = errors.length === 0;
      console.log(`🚀 Enhanced Blog Workflow Tests ${success ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (errors.length > 0) {
        console.log('❌ Errors:', errors);
      }

      return { success, results, errors };

    } catch (error) {
      console.error('🚀 Enhanced Blog Workflow Tests failed with exception:', error);
      errors.push(`Test suite exception: ${error.message}`);
      return { success: false, results, errors };
    }
  }

  /**
   * Test basic blog creation
   */
  private async testBasicBlogCreation(userId?: string): Promise<any> {
    try {
      console.log('📝 Testing basic blog creation...');

      const request: BlogCreationRequest = {
        targetUrl: 'https://example.com',
        keywords: ['test', 'blog', 'creation'],
        primaryKeyword: 'test',
        contentType: 'blog',
        tone: 'professional',
        wordCount: 800,
        includeBacklink: true,
        autoPublish: false
      };

      const result = await EnhancedBlogWorkflow.createBlogPost(request, {
        saveToDatabase: true,
        generateSlug: true,
        requireAuth: false,
        isTrialPost: !userId,
        userId
      });

      if (!result.success) {
        throw new Error(result.error || 'Blog creation failed');
      }

      // Verify the created blog post
      const blog = result.blogPost;
      if (!blog || !blog.id || !blog.title || !blog.content) {
        throw new Error('Created blog post is missing required fields');
      }

      console.log('✅ Basic blog creation successful:', {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        wordCount: blog.word_count,
        status: blog.status
      });

      return {
        test: 'basicBlogCreation',
        success: true,
        data: {
          blogId: blog.id,
          title: blog.title,
          slug: blog.slug,
          permalink: result.permalink,
          previewUrl: result.previewUrl
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Basic blog creation failed:', error);
      return {
        test: 'basicBlogCreation',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test advanced blog creation with custom settings
   */
  private async testAdvancedBlogCreation(userId?: string): Promise<any> {
    try {
      console.log('⚙️ Testing advanced blog creation...');

      const request: BlogCreationRequest = {
        targetUrl: 'https://advanced-example.com',
        keywords: ['advanced', 'testing', 'workflow'],
        primaryKeyword: 'advanced',
        contentType: 'guide',
        tone: 'technical',
        wordCount: 1200,
        customSlug: 'advanced-test-blog',
        title: 'Advanced Test Blog Post',
        metaDescription: 'This is a test meta description for advanced blog creation',
        category: 'Technology',
        anchorText: 'advanced testing',
        includeBacklink: true,
        autoPublish: false
      };

      const result = await EnhancedBlogWorkflow.createBlogPost(request, {
        saveToDatabase: true,
        generateSlug: true,
        requireAuth: false,
        isTrialPost: !userId,
        userId
      });

      if (!result.success) {
        throw new Error(result.error || 'Advanced blog creation failed');
      }

      const blog = result.blogPost;
      
      // Verify custom settings were applied
      if (blog.title !== request.title) {
        console.warn('⚠️ Custom title not preserved');
      }

      if (blog.meta_description !== request.metaDescription) {
        console.warn('⚠️ Custom meta description not preserved');
      }

      console.log('✅ Advanced blog creation successful:', {
        title: blog.title,
        slug: blog.slug,
        metaDescription: blog.meta_description,
        category: blog.category
      });

      return {
        test: 'advancedBlogCreation',
        success: true,
        data: {
          blogId: blog.id,
          customFieldsPreserved: {
            title: blog.title === request.title,
            metaDescription: blog.meta_description === request.metaDescription
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Advanced blog creation failed:', error);
      return {
        test: 'advancedBlogCreation',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test blog management operations
   */
  private async testBlogManagement(userId: string): Promise<any> {
    try {
      console.log('📊 Testing blog management operations...');

      // First, get user's blog posts
      const userPosts = await EnhancedBlogWorkflow.getUserBlogPosts(userId);
      console.log(`Found ${userPosts.length} user posts`);

      if (userPosts.length === 0) {
        console.warn('⚠️ No user posts found for management testing');
        return {
          test: 'blogManagement',
          success: true,
          data: { message: 'No posts to manage' },
          timestamp: new Date().toISOString()
        };
      }

      // Test blog access checking
      const testPost = userPosts[0];
      const accessCheck = await EnhancedBlogWorkflow.checkBlogPostAccess(testPost.id, userId);
      
      if (!accessCheck.exists || !accessCheck.isOwner) {
        throw new Error('Blog access check failed');
      }

      // Test blog update
      const updateResult = await EnhancedBlogWorkflow.updateBlogPost(testPost.id, {
        meta_description: 'Updated meta description for testing'
      });

      if (!updateResult) {
        throw new Error('Blog update failed');
      }

      console.log('✅ Blog management operations successful');

      return {
        test: 'blogManagement',
        success: true,
        data: {
          postsFound: userPosts.length,
          accessCheckPassed: accessCheck.exists && accessCheck.isOwner,
          updateSuccessful: !!updateResult
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Blog management failed:', error);
      return {
        test: 'blogManagement',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<any> {
    try {
      console.log('⚠️ Testing error handling...');

      // Test with invalid request
      const invalidRequest: BlogCreationRequest = {
        targetUrl: '',  // Invalid: empty URL
        keywords: [],   // Invalid: no keywords
        primaryKeyword: ''
      };

      const result = await EnhancedBlogWorkflow.createBlogPost(invalidRequest, {
        saveToDatabase: false,
        generateSlug: false
      });

      // Should fail with validation error
      if (result.success) {
        throw new Error('Error handling failed: Invalid request was accepted');
      }

      if (!result.error || !result.error.includes('required')) {
        throw new Error('Error handling failed: Wrong error message');
      }

      console.log('✅ Error handling working correctly:', result.error);

      return {
        test: 'errorHandling',
        success: true,
        data: { errorMessage: result.error },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error handling test failed:', error);
      return {
        test: 'errorHandling',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Demo the complete workflow
   */
  async demoCompleteWorkflow(): Promise<void> {
    console.log('\n🎭 Enhanced Blog Workflow Demo');
    console.log('─'.repeat(50));

    const request: BlogCreationRequest = {
      targetUrl: 'https://demo-website.com',
      keywords: ['demo', 'workflow', 'testing'],
      primaryKeyword: 'demo',
      contentType: 'blog',
      tone: 'friendly',
      wordCount: 800,
      includeBacklink: true
    };

    try {
      console.log('1. 📝 Creating blog post with AI generation...');
      const result = await EnhancedBlogWorkflow.createBlogPost(request, {
        saveToDatabase: true,
        generateSlug: true,
        isTrialPost: true
      });

      if (result.success && result.blogPost) {
        console.log('2. ✅ Blog post created successfully!');
        console.log(`   📰 Title: ${result.blogPost.title}`);
        console.log(`   🔗 Slug: ${result.blogPost.slug}`);
        console.log(`   📊 Word Count: ${result.blogPost.word_count}`);
        console.log(`   🌐 Preview URL: ${result.previewUrl}`);
        console.log(`   ✏️ Edit URL: ${result.editUrl || 'N/A (trial post)'}`);
      } else {
        console.log('2. ❌ Blog creation failed:', result.error);
      }

    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }
}

export const enhancedBlogWorkflowTester = new EnhancedBlogWorkflowTester();

// Export convenience function for quick testing
export async function testEnhancedBlogWorkflow(userId?: string) {
  const tester = new EnhancedBlogWorkflowTester();
  const results = await tester.runWorkflowTests(userId);
  
  // Also run demo
  console.log('\n🎭 Running workflow demonstration...');
  await tester.demoCompleteWorkflow();
  
  return results;
}
