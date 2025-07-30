/**
 * Test utility to validate blog claiming functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { BlogClaimService } from '@/services/blogClaimService';

export interface ClaimTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export class BlogClaimingTester {
  /**
   * Test if a localStorage blog post can be claimed
   */
  static async testLocalStorageClaim(slug: string): Promise<ClaimTestResult> {
    try {
      console.log('🧪 Testing localStorage blog claim for slug:', slug);
      
      // Get the blog post from localStorage
      const blogPostKey = `blog_post_${slug}`;
      const localBlogPost = localStorage.getItem(blogPostKey);
      
      if (!localBlogPost) {
        return {
          success: false,
          message: `Blog post with slug "${slug}" not found in localStorage`,
          details: {
            searchedKey: blogPostKey,
            availableKeys: Object.keys(localStorage).filter(key => key.startsWith('blog_post_'))
          }
        };
      }
      
      const blogPostData = JSON.parse(localBlogPost);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return {
          success: false,
          message: 'User authentication required for claiming',
          details: { userError: userError?.message }
        };
      }
      
      // Test the claim process (dry run - we'll revert it)
      console.log('📝 Blog post data found:', {
        id: blogPostData.id,
        title: blogPostData.title,
        slug: blogPostData.slug,
        is_trial_post: blogPostData.is_trial_post
      });
      
      return {
        success: true,
        message: 'Blog post found and ready for claiming',
        details: {
          postId: blogPostData.id,
          title: blogPostData.title,
          slug: blogPostData.slug,
          userId: user.id,
          userEmail: user.email
        }
      };
      
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        details: { error: error.message, stack: error.stack }
      };
    }
  }
  
  /**
   * Test database connectivity for claiming
   */
  static async testDatabaseClaim(): Promise<ClaimTestResult> {
    try {
      console.log('🧪 Testing database claim functionality...');
      
      // Test database connection by fetching published posts
      const { data: posts, error } = await supabase
        .from('published_blog_posts')
        .select('id, slug, title, user_id, is_trial_post')
        .limit(1);
        
      if (error) {
        return {
          success: false,
          message: 'Database connection failed',
          details: { error: error.message }
        };
      }
      
      return {
        success: true,
        message: `Database connection successful. Found ${posts?.length || 0} published posts`,
        details: { postsCount: posts?.length || 0 }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Database test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }
  
  /**
   * Test complete claiming workflow
   */
  static async testCompleteClaimWorkflow(slug: string): Promise<ClaimTestResult> {
    try {
      console.log('🧪 Testing complete claim workflow for slug:', slug);
      
      // Step 1: Test localStorage access
      const localTest = await this.testLocalStorageClaim(slug);
      if (!localTest.success) {
        return localTest;
      }
      
      // Step 2: Test database access
      const dbTest = await this.testDatabaseClaim();
      if (!dbTest.success) {
        return dbTest;
      }
      
      // Step 3: Test BlogClaimService methods
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: 'User authentication required'
        };
      }
      
      const blogPostKey = `blog_post_${slug}`;
      const localBlogPost = localStorage.getItem(blogPostKey);
      const blogPostData = JSON.parse(localBlogPost!);
      
      // Check if user can claim more posts
      const claimCheck = await BlogClaimService.canUserClaimMore(user);
      
      return {
        success: true,
        message: 'Complete workflow test successful',
        details: {
          localStorage: localTest.details,
          database: dbTest.details,
          canClaim: claimCheck.canClaim,
          claimedCount: claimCheck.claimedCount,
          maxClaims: claimCheck.maxClaims,
          reason: claimCheck.reason
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Workflow test failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }
}

// Export a simple test function for console use
export const testBlogClaiming = {
  async testSlug(slug: string) {
    console.log('🔍 Testing blog claiming for slug:', slug);
    const result = await BlogClaimingTester.testCompleteClaimWorkflow(slug);
    console.log('📊 Test result:', result);
    return result;
  },
  
  async testDatabase() {
    console.log('🔍 Testing database connectivity...');
    const result = await BlogClaimingTester.testDatabaseClaim();
    console.log('📊 Database test result:', result);
    return result;
  },
  
  async listLocalPosts() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('blog_post_'));
    console.log('📋 Available localStorage blog posts:', keys);
    
    const posts = [];
    for (const key of keys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        posts.push({
          key,
          slug: data.slug,
          title: data.title,
          is_trial_post: data.is_trial_post,
          expires_at: data.expires_at
        });
      } catch (error) {
        console.warn('Failed to parse:', key, error);
      }
    }
    
    console.table(posts);
    return posts;
  }
};

// Make available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).testBlogClaiming = testBlogClaiming;
  console.log('🧪 Blog claiming test utilities available via window.testBlogClaiming');
}
