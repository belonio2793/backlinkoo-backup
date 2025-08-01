/**
 * Debug Claim System - Comprehensive testing and debugging utility
 * for the unified blog claim functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { UnifiedClaimService } from '@/services/unifiedClaimService';
import type { User } from '@supabase/supabase-js';

export interface DebugResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class DebugClaimSystem {
  /**
   * Run comprehensive claim system tests
   */
  static async runFullDiagnostic(): Promise<DebugResult[]> {
    const results: DebugResult[] = [];
    
    console.log('🔧 Starting comprehensive claim system diagnostic...');

    // Test 1: Database connectivity
    results.push(await this.testDatabaseConnectivity());
    
    // Test 2: Blog posts table structure
    results.push(await this.testTableStructure());
    
    // Test 3: Get claimable posts
    results.push(await this.testGetClaimablePosts());
    
    // Test 4: Authentication check
    results.push(await this.testAuthenticationState());
    
    // Test 5: Test post lookup by slug
    results.push(await this.testPostLookup());
    
    // Test 6: Test claim statistics (if user available)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      results.push(await this.testUserClaimStats(user.id));
    }

    // Test 7: Test claim validation logic
    results.push(await this.testClaimValidation());

    console.log('🔧 Diagnostic complete. Results:', results);
    return results;
  }

  /**
   * Test database connectivity
   */
  private static async testDatabaseConnectivity(): Promise<DebugResult> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('count')
        .limit(1);

      if (error) {
        return {
          test: 'Database Connectivity',
          success: false,
          message: 'Failed to connect to database',
          error: error.message
        };
      }

      return {
        test: 'Database Connectivity',
        success: true,
        message: 'Successfully connected to database'
      };
    } catch (error) {
      return {
        test: 'Database Connectivity',
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test blog_posts table structure
   */
  private static async testTableStructure(): Promise<DebugResult> {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, is_trial_post, user_id, expires_at, status')
        .limit(1);

      if (error) {
        return {
          test: 'Table Structure',
          success: false,
          message: 'Failed to query blog_posts table structure',
          error: error.message
        };
      }

      return {
        test: 'Table Structure',
        success: true,
        message: 'blog_posts table structure is correct',
        data: data?.length ? 'Has data' : 'Empty table'
      };
    } catch (error) {
      return {
        test: 'Table Structure',
        success: false,
        message: 'Table structure test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test getting claimable posts
   */
  private static async testGetClaimablePosts(): Promise<DebugResult> {
    try {
      const posts = await UnifiedClaimService.getClaimablePosts(5);
      
      return {
        test: 'Get Claimable Posts',
        success: true,
        message: `Found ${posts.length} claimable posts`,
        data: posts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          is_trial_post: p.is_trial_post,
          user_id: p.user_id,
          expires_at: p.expires_at
        }))
      };
    } catch (error) {
      return {
        test: 'Get Claimable Posts',
        success: false,
        message: 'Failed to get claimable posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test authentication state
   */
  private static async testAuthenticationState(): Promise<DebugResult> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return {
          test: 'Authentication State',
          success: false,
          message: 'Failed to get authentication state',
          error: error.message
        };
      }

      return {
        test: 'Authentication State',
        success: true,
        message: user ? `User authenticated: ${user.email}` : 'No user authenticated',
        data: user ? { id: user.id, email: user.email } : null
      };
    } catch (error) {
      return {
        test: 'Authentication State',
        success: false,
        message: 'Authentication check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test post lookup by slug
   */
  private static async testPostLookup(): Promise<DebugResult> {
    try {
      // First get a claimable post to test with
      const posts = await UnifiedClaimService.getClaimablePosts(1);
      
      if (posts.length === 0) {
        return {
          test: 'Post Lookup',
          success: true,
          message: 'No posts available to test lookup',
          data: 'No test data'
        };
      }

      const testPost = posts[0];
      const foundPost = await UnifiedClaimService.getBlogPostBySlug(testPost.slug);
      
      if (!foundPost) {
        return {
          test: 'Post Lookup',
          success: false,
          message: `Failed to find post by slug: ${testPost.slug}`
        };
      }

      return {
        test: 'Post Lookup',
        success: true,
        message: `Successfully found post: ${foundPost.title}`,
        data: {
          slug: foundPost.slug,
          title: foundPost.title,
          is_trial_post: foundPost.is_trial_post
        }
      };
    } catch (error) {
      return {
        test: 'Post Lookup',
        success: false,
        message: 'Post lookup test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test user claim statistics
   */
  private static async testUserClaimStats(userId: string): Promise<DebugResult> {
    try {
      const stats = await UnifiedClaimService.getUserClaimStats(userId);
      
      return {
        test: 'User Claim Stats',
        success: true,
        message: `User has claimed ${stats.claimedCount}/${stats.maxClaims} posts`,
        data: stats
      };
    } catch (error) {
      return {
        test: 'User Claim Stats',
        success: false,
        message: 'Failed to get user claim statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test claim validation logic
   */
  private static async testClaimValidation(): Promise<DebugResult> {
    try {
      // Get a claimable post to test validation
      const posts = await UnifiedClaimService.getClaimablePosts(1);
      
      if (posts.length === 0) {
        return {
          test: 'Claim Validation',
          success: true,
          message: 'No posts available to test claim validation',
          data: 'No test data'
        };
      }

      const testPost = posts[0];
      const validation = await UnifiedClaimService.isPostClaimable(testPost.slug);
      
      return {
        test: 'Claim Validation',
        success: true,
        message: `Post claimable: ${validation.claimable}. Reason: ${validation.reason || 'Available for claiming'}`,
        data: validation
      };
    } catch (error) {
      return {
        test: 'Claim Validation',
        success: false,
        message: 'Claim validation test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test actual claim process (DESTRUCTIVE - only run with test data)
   */
  static async testClaimProcess(postSlug: string, user: User): Promise<DebugResult> {
    try {
      console.log(`🧪 Testing claim process for post: ${postSlug}`);
      
      // First check if post is claimable
      const validation = await UnifiedClaimService.isPostClaimable(postSlug, user.id);
      
      if (!validation.claimable) {
        return {
          test: 'Claim Process Test',
          success: false,
          message: `Post not claimable: ${validation.reason}`,
          data: validation
        };
      }

      // Attempt to claim the post
      const result = await UnifiedClaimService.claimBlogPost(postSlug, user);
      
      return {
        test: 'Claim Process Test',
        success: result.success,
        message: result.message,
        data: result
      };
    } catch (error) {
      return {
        test: 'Claim Process Test',
        success: false,
        message: 'Claim process test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate diagnostic report
   */
  static generateReport(results: DebugResult[]): string {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    let report = `🔧 CLAIM SYSTEM DIAGNOSTIC REPORT\n`;
    report += `====================================\n`;
    report += `Tests Passed: ${passed}\n`;
    report += `Tests Failed: ${failed}\n`;
    report += `Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n\n`;
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      report += `${index + 1}. ${status} ${result.test}\n`;
      report += `   ${result.message}\n`;
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      if (result.data) {
        report += `   Data: ${typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}\n`;
      }
      report += `\n`;
    });
    
    return report;
  }
}

// Make debugging available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugClaimSystem = DebugClaimSystem;
}
