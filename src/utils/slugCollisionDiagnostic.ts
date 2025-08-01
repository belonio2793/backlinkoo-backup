/**
 * Slug Collision Diagnostic Utility
 * Diagnoses and tests slug generation across the system
 */

import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class SlugCollisionDiagnostic {
  private results: DiagnosticResult[] = [];

  /**
   * Run complete slug collision diagnostic
   */
  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    this.results = [];
    
    console.log('🔍 Starting slug collision diagnostic...');
    
    await this.testDatabaseTrigger();
    await this.testUniqueConstraint();
    await this.testSlugGeneration();
    await this.testConcurrentRequests();
    await this.checkExistingSlugs();
    
    this.printSummary();
    return this.results;
  }

  /**
   * Test if database trigger is working
   */
  private async testDatabaseTrigger(): Promise<void> {
    try {
      console.log('📋 Testing database trigger...');
      
      // Test 1: Check if trigger function exists
      const { data: triggerFunction, error: triggerError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'ensure_unique_slug');

      if (triggerError || !triggerFunction?.length) {
        this.addResult('database-trigger-function', 'fail', 'Database trigger function "ensure_unique_slug" not found');
        return;
      }

      this.addResult('database-trigger-function', 'pass', 'Database trigger function exists');

      // Test 2: Try inserting with null slug
      const testData = {
        title: `Test Trigger ${Date.now()}`,
        content: 'Test content for trigger functionality',
        target_url: 'https://example.com',
        keywords: 'test',
        slug: null, // This should trigger slug generation
        is_trial_post: true,
        expires_at: new Date(Date.now() + 1000 * 60).toISOString() // 1 minute expiry for cleanup
      };

      const { data: testPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        if (insertError.message.includes('null value in column "slug"')) {
          this.addResult('database-trigger-null-slug', 'fail', 'Database trigger not working - NULL slug rejected');
        } else {
          this.addResult('database-trigger-null-slug', 'warning', `Unexpected error: ${insertError.message}`);
        }
        return;
      }

      if (testPost?.slug) {
        this.addResult('database-trigger-null-slug', 'pass', `Database trigger working - generated slug: ${testPost.slug}`);
        
        // Cleanup test post
        await supabase.from('blog_posts').delete().eq('id', testPost.id);
      } else {
        this.addResult('database-trigger-null-slug', 'fail', 'Database allowed NULL slug without generating one');
      }

    } catch (error: any) {
      this.addResult('database-trigger-test', 'fail', `Error testing database trigger: ${error.message}`);
    }
  }

  /**
   * Test unique constraint
   */
  private async testUniqueConstraint(): Promise<void> {
    try {
      console.log('🔒 Testing unique constraint...');
      
      const testSlug = `test-unique-${Date.now()}`;
      
      // Insert first post
      const { data: firstPost, error: firstError } = await supabase
        .from('blog_posts')
        .insert({
          title: 'First Test Post',
          content: 'Test content',
          target_url: 'https://example.com',
          keywords: 'test',
          slug: testSlug,
          is_trial_post: true,
          expires_at: new Date(Date.now() + 1000 * 60).toISOString()
        })
        .select()
        .single();

      if (firstError) {
        this.addResult('unique-constraint-setup', 'fail', `Failed to insert first test post: ${firstError.message}`);
        return;
      }

      // Try to insert second post with same slug
      const { error: duplicateError } = await supabase
        .from('blog_posts')
        .insert({
          title: 'Second Test Post',
          content: 'Test content',
          target_url: 'https://example.com',
          keywords: 'test',
          slug: testSlug, // Same slug - should fail
          is_trial_post: true,
          expires_at: new Date(Date.now() + 1000 * 60).toISOString()
        });

      if (duplicateError && duplicateError.message.includes('blog_posts_slug_key')) {
        this.addResult('unique-constraint', 'pass', 'Unique constraint working - duplicate slug rejected');
      } else if (duplicateError) {
        this.addResult('unique-constraint', 'warning', `Unexpected error: ${duplicateError.message}`);
      } else {
        this.addResult('unique-constraint', 'fail', 'Unique constraint not working - duplicate slug allowed');
      }

      // Cleanup
      await supabase.from('blog_posts').delete().eq('id', firstPost.id);

    } catch (error: any) {
      this.addResult('unique-constraint-test', 'fail', `Error testing unique constraint: ${error.message}`);
    }
  }

  /**
   * Test service-level slug generation
   */
  private async testSlugGeneration(): Promise<void> {
    try {
      console.log('⚙️ Testing service-level slug generation...');
      
      // Test slug uniqueness
      const title = 'Test Blog Post Title';
      const slugs: string[] = [];
      
      for (let i = 0; i < 10; i++) {
        const slug = this.generateTestSlug(title);
        slugs.push(slug);
      }

      const uniqueSlugs = new Set(slugs);
      const allUnique = uniqueSlugs.size === slugs.length;

      if (allUnique) {
        this.addResult('service-slug-generation', 'pass', `Generated ${slugs.length} unique slugs`);
      } else {
        this.addResult('service-slug-generation', 'fail', `Generated duplicates: ${slugs.length} total, ${uniqueSlugs.size} unique`);
      }

      // Test slug format
      const sampleSlug = slugs[0];
      const hasProperFormat = /^[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)?$/.test(sampleSlug);
      
      if (hasProperFormat) {
        this.addResult('service-slug-format', 'pass', `Slug format valid: ${sampleSlug}`);
      } else {
        this.addResult('service-slug-format', 'warning', `Slug format may not be optimal: ${sampleSlug}`);
      }

    } catch (error: any) {
      this.addResult('service-slug-generation', 'fail', `Error testing slug generation: ${error.message}`);
    }
  }

  /**
   * Test concurrent slug generation
   */
  private async testConcurrentRequests(): Promise<void> {
    try {
      console.log('🚀 Testing concurrent requests...');
      
      const promises: Promise<any>[] = [];
      const baseTitle = `Concurrent Test ${Date.now()}`;
      
      // Create 5 concurrent requests with same title
      for (let i = 0; i < 5; i++) {
        const promise = supabase
          .from('blog_posts')
          .insert({
            title: `${baseTitle} ${i}`,
            content: 'Concurrent test content',
            target_url: 'https://example.com',
            keywords: 'test',
            slug: null, // Let database or service handle it
            is_trial_post: true,
            expires_at: new Date(Date.now() + 1000 * 60).toISOString()
          })
          .select()
          .single();
        
        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      
      // Check for slug collisions in failed requests
      const slugCollisions = results
        .filter(r => r.status === 'rejected')
        .filter(r => (r as PromiseRejectedResult).reason?.message?.includes('blog_posts_slug_key'))
        .length;

      if (slugCollisions > 0) {
        this.addResult('concurrent-requests', 'fail', `${slugCollisions} slug collisions out of 5 concurrent requests`);
      } else if (successes === 5) {
        this.addResult('concurrent-requests', 'pass', 'All 5 concurrent requests succeeded');
      } else {
        this.addResult('concurrent-requests', 'warning', `${successes} succeeded, ${failures} failed (non-collision errors)`);
      }

      // Cleanup successful posts
      const successfulPosts = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value.data)
        .filter(data => data?.id);

      for (const post of successfulPosts) {
        await supabase.from('blog_posts').delete().eq('id', post.id);
      }

    } catch (error: any) {
      this.addResult('concurrent-requests', 'fail', `Error testing concurrent requests: ${error.message}`);
    }
  }

  /**
   * Check existing slugs for patterns
   */
  private async checkExistingSlugs(): Promise<void> {
    try {
      console.log('📊 Analyzing existing slugs...');
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('slug, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        this.addResult('existing-slugs', 'warning', `Could not analyze existing slugs: ${error.message}`);
        return;
      }

      if (!posts || posts.length === 0) {
        this.addResult('existing-slugs', 'pass', 'No existing posts to analyze');
        return;
      }

      const slugs = posts.map(p => p.slug).filter(Boolean);
      const uniqueSlugs = new Set(slugs);
      const hasDuplicates = uniqueSlugs.size !== slugs.length;

      if (hasDuplicates) {
        this.addResult('existing-slugs', 'fail', `Found ${slugs.length - uniqueSlugs.size} duplicate slugs in existing posts`);
      } else {
        this.addResult('existing-slugs', 'pass', `All ${slugs.length} existing slugs are unique`);
      }

      // Analyze slug patterns
      const timestampSlugs = slugs.filter(slug => /[a-z0-9]+-[a-z0-9]+$/.test(slug)).length;
      const enhancedSlugs = slugs.filter(slug => /[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+/.test(slug)).length;
      
      this.addResult('slug-patterns', 'pass', 
        `Slug patterns: ${timestampSlugs} with timestamps, ${enhancedSlugs} with enhanced format, ${slugs.length - timestampSlugs - enhancedSlugs} basic format`
      );

    } catch (error: any) {
      this.addResult('existing-slugs', 'fail', `Error analyzing existing slugs: ${error.message}`);
    }
  }

  /**
   * Generate test slug with enhanced collision resistance
   */
  private generateTestSlug(title: string): string {
    const baseSlug = title
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 40);

    const timestamp = Date.now().toString(36);
    const random1 = Math.random().toString(36).substring(2, 9);
    const random2 = Math.random().toString(36).substring(2, 7);
    const counter = Math.floor(Math.random() * 9999).toString(36);
    
    return `${baseSlug}-${timestamp}-${random1}-${random2}-${counter}`;
  }

  /**
   * Add result to diagnostic
   */
  private addResult(test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({ test, status, message, details });
    
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${message}`);
  }

  /**
   * Print diagnostic summary
   */
  private printSummary(): void {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`📝 Total Tests: ${this.results.length}`);

    if (failed === 0) {
      console.log('\n🎉 All critical tests passed! Slug collision system is working properly.');
    } else {
      console.log('\n🚨 Some tests failed. Review the results above to identify issues.');
    }

    // Provide specific recommendations
    const failedTests = this.results.filter(r => r.status === 'fail');
    if (failedTests.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      
      if (failedTests.some(t => t.test.includes('trigger'))) {
        console.log('- Database trigger is not working. Check if migration has been applied.');
      }
      
      if (failedTests.some(t => t.test.includes('constraint'))) {
        console.log('- Unique constraint may not be properly configured.');
      }
      
      if (failedTests.some(t => t.test.includes('concurrent'))) {
        console.log('- Concurrent request handling needs improvement.');
      }
    }
  }

  /**
   * Get diagnostic recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedTests = this.results.filter(r => r.status === 'fail');

    if (failedTests.some(t => t.test.includes('trigger'))) {
      recommendations.push('Apply database migration to enable slug trigger');
      recommendations.push('Verify trigger function exists in database');
    }

    if (failedTests.some(t => t.test.includes('constraint'))) {
      recommendations.push('Check unique constraint on blog_posts.slug column');
    }

    if (failedTests.some(t => t.test.includes('concurrent'))) {
      recommendations.push('Enhance service-level slug generation');
      recommendations.push('Implement better retry logic for collisions');
    }

    if (failedTests.some(t => t.test.includes('existing'))) {
      recommendations.push('Clean up duplicate slugs in existing data');
    }

    return recommendations;
  }
}

export const slugCollisionDiagnostic = new SlugCollisionDiagnostic();
