/**
 * Comprehensive Blog System Diagnostic
 * This utility helps debug and identify issues with the blog system
 */

import { supabase } from '@/integrations/supabase/client';
import { blogService } from '@/services/blogService';
import { UnifiedClaimService } from '@/services/unifiedClaimService';

export interface DiagnosticResult {
  component: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  error?: any;
}

export class BlogSystemDiagnostic {
  private results: DiagnosticResult[] = [];

  private log(component: string, status: 'success' | 'warning' | 'error', message: string, details?: any, error?: any) {
    const result: DiagnosticResult = { component, status, message, details, error };
    this.results.push(result);
    console.log(`${status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌'} [${component}] ${message}`, details || '');
    if (error) console.error('Error details:', error);
  }

  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    console.log('🔬 Starting comprehensive blog system diagnostic...');
    this.results = [];

    await this.checkSupabaseConnection();
    await this.checkBlogPostsTable();
    await this.checkUserSavedPostsTable();
    await this.checkBlogPostsData();
    await this.checkBlogServices();
    await this.checkRouting();
    await this.generateTestData();

    console.log('🔬 Diagnostic complete!');
    return this.results;
  }

  private async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        this.log('Supabase Connection', 'warning', 'Session error', { error: error.message });
      } else {
        this.log('Supabase Connection', 'success', 'Connected successfully', { hasSession: !!data.session });
      }
    } catch (error: any) {
      this.log('Supabase Connection', 'error', 'Connection failed', {}, error);
    }
  }

  private async checkBlogPostsTable() {
    try {
      // Check if blog_posts table exists
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('id', { count: 'exact', head: true });

      if (error) {
        this.log('blog_posts Table', 'error', 'Table check failed', { 
          errorCode: error.code, 
          errorMessage: error.message 
        }, error);
      } else {
        this.log('blog_posts Table', 'success', 'Table exists and accessible', { 
          postCount: count || 0 
        });
      }
    } catch (error: any) {
      this.log('blog_posts Table', 'error', 'Table access error', {}, error);
    }
  }

  private async checkUserSavedPostsTable() {
    try {
      // Check if user_saved_posts table exists
      const { data, error, count } = await supabase
        .from('user_saved_posts')
        .select('id', { count: 'exact', head: true });

      if (error) {
        this.log('user_saved_posts Table', 'error', 'Table check failed', { 
          errorCode: error.code, 
          errorMessage: error.message 
        }, error);
      } else {
        this.log('user_saved_posts Table', 'success', 'Table exists and accessible', { 
          saveCount: count || 0 
        });
      }
    } catch (error: any) {
      this.log('user_saved_posts Table', 'error', 'Table access error', {}, error);
    }
  }

  private async checkBlogPostsData() {
    try {
      // Get recent blog posts
      const posts = await blogService.getRecentBlogPosts(5);
      
      if (posts.length === 0) {
        this.log('Blog Posts Data', 'warning', 'No blog posts found in database', { 
          postCount: 0 
        });
      } else {
        this.log('Blog Posts Data', 'success', 'Blog posts available', { 
          postCount: posts.length,
          sampleTitles: posts.slice(0, 3).map(p => p.title)
        });

        // Test individual post retrieval
        const firstPost = posts[0];
        const retrievedPost = await UnifiedClaimService.getBlogPostBySlug(firstPost.slug);
        
        if (retrievedPost) {
          this.log('Blog Post Retrieval', 'success', 'Individual post retrieval working', {
            slug: firstPost.slug,
            title: retrievedPost.title
          });
        } else {
          this.log('Blog Post Retrieval', 'warning', 'Individual post retrieval failed', {
            slug: firstPost.slug
          });
        }
      }
    } catch (error: any) {
      this.log('Blog Posts Data', 'error', 'Data access failed', {}, error);
    }
  }

  private async checkBlogServices() {
    try {
      // Test blogService
      const recentPosts = await blogService.getRecentBlogPosts(1);
      this.log('BlogService', 'success', 'Service working', { 
        canFetchPosts: true,
        postsFound: recentPosts.length 
      });
    } catch (error: any) {
      this.log('BlogService', 'error', 'Service failed', {}, error);
    }

    try {
      // Test UnifiedClaimService
      const claimablePosts = await UnifiedClaimService.getClaimablePosts(1);
      this.log('UnifiedClaimService', 'success', 'Service working', { 
        canFetchClaimable: true,
        claimableFound: claimablePosts.length 
      });
    } catch (error: any) {
      this.log('UnifiedClaimService', 'error', 'Service failed', {}, error);
    }
  }

  private async checkRouting() {
    // Check if we're on the blog page
    const currentPath = window.location.pathname;
    const isBlogPath = currentPath.startsWith('/blog');
    
    this.log('Routing', 'success', 'Current route information', {
      currentPath,
      isBlogPath,
      isListingPage: currentPath === '/blog',
      isIndividualPost: currentPath.startsWith('/blog/') && currentPath.split('/').length === 3
    });
  }

  private async generateTestData() {
    try {
      console.log('🧪 Testing blog post creation permissions...');

      // Skip test data generation if network issues persist
      if (window.navigator && !window.navigator.onLine) {
        this.log('Test Data Generation', 'warning', 'Skipping test - no network connection');
        return;
      }

      // Check if we can create a test post (helps identify write permissions)
      const testSlug = `diagnostic-test-${Date.now()}`;

      const testPost = await blogService.createBlogPost({
        title: 'Diagnostic Test Post',
        content: '<p>This is a test post created by the diagnostic system.</p>',
        targetUrl: 'https://example.com',
        wordCount: 100,
        readingTime: 1,
        seoScore: 85
      }, undefined, true);

      this.log('Test Data Generation', 'success', 'Can create test posts', {
        testPostId: testPost.id,
        testPostSlug: testPost.slug
      });

      // Clean up test post
      await blogService.deleteBlogPost(testPost.id);
      this.log('Test Cleanup', 'success', 'Test post cleaned up successfully');

    } catch (error: any) {
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        this.log('Test Data Generation', 'warning', 'Blog post creation blocked by RLS policies', {
          issue: 'Row Level Security policies are too restrictive',
          solution: 'Run RLS policy fix or check database permissions',
          error: error.message
        });
      } else {
        this.log('Test Data Generation', 'error', 'Cannot create test posts - check database permissions', {}, error);
      }
    }
  }

  getResults(): DiagnosticResult[] {
    return this.results;
  }

  getSummary(): { success: number; warning: number; error: number; total: number } {
    const summary = {
      success: this.results.filter(r => r.status === 'success').length,
      warning: this.results.filter(r => r.status === 'warning').length,
      error: this.results.filter(r => r.status === 'error').length,
      total: this.results.length
    };
    return summary;
  }

  printSummary() {
    const summary = this.getSummary();
    console.log('\n🔬 Diagnostic Summary:');
    console.log(`✅ Success: ${summary.success}`);
    console.log(`⚠️ Warnings: ${summary.warning}`);
    console.log(`❌ Errors: ${summary.error}`);
    console.log(`📊 Total: ${summary.total}`);

    const hasErrors = summary.error > 0;
    const hasWarnings = summary.warning > 0;

    if (hasErrors) {
      console.log('\n❌ Critical Issues Found:');
      this.results.filter(r => r.status === 'error').forEach(result => {
        console.log(`  - [${result.component}] ${result.message}`);
      });
    }

    if (hasWarnings) {
      console.log('\n⚠️ Warnings:');
      this.results.filter(r => r.status === 'warning').forEach(result => {
        console.log(`  - [${result.component}] ${result.message}`);
      });
    }

    if (!hasErrors && !hasWarnings) {
      console.log('\n🎉 All systems are working correctly!');
    }
  }
}

// Auto-run diagnostic in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('🔬 Auto-running blog system diagnostic...');
  
  setTimeout(async () => {
    try {
      const diagnostic = new BlogSystemDiagnostic();
      await diagnostic.runFullDiagnostic();
      diagnostic.printSummary();
      
      // Make results available globally for debugging
      (window as any).__blogDiagnostic = diagnostic;
      console.log('🔬 Diagnostic results available at window.__blogDiagnostic');
    } catch (error) {
      console.error('🔬 Diagnostic failed:', error);
    }
  }, 2000);
}

export const blogSystemDiagnostic = new BlogSystemDiagnostic();
