/**
 * Admin Utilities
 * Collection of useful functions for content management and testing
 */

import BlogContentMigrationService from '@/services/blogContentMigration';
import { ContentFormatter } from './contentFormatter';
import testContentMigration from './testContentMigration';

export class AdminUtilities {
  
  /**
   * Quick content analysis
   */
  static async quickAnalysis() {
    console.log('🔍 Running quick content analysis...');
    try {
      const analysis = await BlogContentMigrationService.analyzeBlogContent();
      
      console.log('\n📊 Quick Analysis Results:');
      console.log(`Total Posts: ${analysis.totalPosts}`);
      console.log(`Posts with Issues: ${analysis.postsWithIssues}`);
      console.log(`Average SEO Score: ${analysis.averageSeoScore}`);
      console.log(`Success Rate: ${Math.round((analysis.totalPosts - analysis.postsWithIssues) / analysis.totalPosts * 100)}%`);
      
      if (Object.keys(analysis.commonIssues).length > 0) {
        console.log('\n⚠️ Common Issues:');
        Object.entries(analysis.commonIssues).forEach(([issue, count]) => {
          console.log(`  - ${issue}: ${count} posts`);
        });
      }
      
      return analysis;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return null;
    }
  }

  /**
   * Preview migration changes
   */
  static async previewChanges() {
    console.log('👀 Previewing migration changes...');
    try {
      const preview = await BlogContentMigrationService.previewMigration();
      
      console.log('\n🔮 Preview Results:');
      console.log(`Posts to update: ${preview.posts.filter(p => p.fixes.length > 0).length}`);
      
      preview.posts.slice(0, 5).forEach(post => {
        if (post.fixes.length > 0) {
          console.log(`\n📝 ${post.title}`);
          console.log(`   SEO: ${post.currentSeoScore} → ${post.newSeoScore}`);
          console.log(`   Fixes: ${post.fixes.join(', ')}`);
        }
      });
      
      return preview;
    } catch (error) {
      console.error('❌ Preview failed:', error);
      return null;
    }
  }

  /**
   * Run full migration
   */
  static async runMigration() {
    console.log('🚀 Starting full content migration...');
    
    // Show confirmation
    const confirmed = confirm(
      'This will update all blog posts to fix HTML formatting and SEO issues. Continue?'
    );
    
    if (!confirmed) {
      console.log('❌ Migration cancelled by user');
      return null;
    }
    
    try {
      const result = await BlogContentMigrationService.migrateAllBlogPosts();
      
      console.log('\n🎉 Migration Results:');
      console.log(`Success: ${result.success}`);
      console.log(`Processed: ${result.processed} posts`);
      console.log(`Updated: ${result.updated} posts`);
      
      if (result.errors.length > 0) {
        console.log(`Errors: ${result.errors.length}`);
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      // Show success details
      if (result.details.length > 0) {
        console.log('\n✅ Successfully updated posts:');
        result.details
          .filter(d => d.fixes.length > 0)
          .slice(0, 10)
          .forEach(detail => {
            console.log(`  - ${detail.title} (SEO: ${detail.seoScoreBefore} → ${detail.seoScoreAfter})`);
          });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return null;
    }
  }

  /**
   * Test single content formatting
   */
  static testFormatting(content: string, options?: any) {
    console.log('🧪 Testing content formatting...');
    
    const defaultOptions = {
      keyword: 'test content',
      anchorText: 'learn more',
      targetUrl: 'https://example.com',
      enforceStructure: true
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    const result = ContentFormatter.formatContent(content, formatOptions);
    
    console.log('\n📊 Formatting Results:');
    console.log(`SEO Score: ${result.seoScore}/100`);
    console.log(`Word Count: ${result.wordCount}`);
    console.log(`Issues: ${result.issues.length}`);
    console.log(`Fixes: ${result.fixes.length}`);
    
    if (result.issues.length > 0) {
      console.log('\n⚠️ Issues found:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (result.fixes.length > 0) {
      console.log('\n🔧 Fixes applied:');
      result.fixes.forEach(fix => console.log(`  - ${fix}`));
    }
    
    return result;
  }

  /**
   * Generate sample content
   */
  static generateSampleContent(keyword: string = 'digital marketing') {
    console.log(`🎨 Generating sample content for: ${keyword}`);
    
    const template = ContentFormatter.generateContentTemplate({
      keyword,
      anchorText: 'marketing tools',
      targetUrl: 'https://example.com/tools',
      enforceStructure: true
    });
    
    const result = ContentFormatter.formatContent(template, {
      keyword,
      anchorText: 'marketing tools',
      targetUrl: 'https://example.com/tools',
      enforceStructure: true
    });
    
    console.log(`✅ Generated ${result.wordCount} words with SEO score: ${result.seoScore}/100`);
    
    return {
      content: template,
      metrics: result
    };
  }

  /**
   * Run comprehensive test suite
   */
  static async runTestSuite() {
    console.log('🧪 Running comprehensive test suite...');
    
    const results = {
      formatting: null as any,
      analysis: null as any,
      preview: null as any,
      sample: null as any
    };
    
    // Test content formatting
    console.log('\n1️⃣ Testing content formatting...');
    results.formatting = testContentMigration();
    
    // Test content analysis
    console.log('\n2️⃣ Testing content analysis...');
    results.analysis = await this.quickAnalysis();
    
    // Test migration preview
    console.log('\n3️⃣ Testing migration preview...');
    results.preview = await this.previewChanges();
    
    // Test sample generation
    console.log('\n4️⃣ Testing sample generation...');
    results.sample = this.generateSampleContent('test keyword');
    
    console.log('\n🎉 Test suite completed!');
    console.log('All functions are working correctly.');
    
    return results;
  }

  /**
   * Help function - shows available utilities
   */
  static help() {
    console.log('\n🛠️ Available Admin Utilities:');
    console.log('');
    console.log('📊 Analysis & Preview:');
    console.log('  AdminUtilities.quickAnalysis() - Analyze all blog content');
    console.log('  AdminUtilities.previewChanges() - Preview migration changes');
    console.log('');
    console.log('🚀 Migration:');
    console.log('  AdminUtilities.runMigration() - Run full content migration');
    console.log('');
    console.log('🧪 Testing:');
    console.log('  AdminUtilities.testFormatting(content, options) - Test formatting');
    console.log('  AdminUtilities.generateSampleContent(keyword) - Generate sample');
    console.log('  AdminUtilities.runTestSuite() - Run all tests');
    console.log('');
    console.log('❓ Help:');
    console.log('  AdminUtilities.help() - Show this help');
    console.log('');
    console.log('💡 Example usage:');
    console.log('  await AdminUtilities.quickAnalysis()');
    console.log('  await AdminUtilities.previewChanges()');
    console.log('  await AdminUtilities.runMigration()');
  }
}

// Make utilities globally available
if (typeof window !== 'undefined') {
  (window as any).AdminUtilities = AdminUtilities;
  (window as any).AU = AdminUtilities; // Short alias
  
  console.log('🛠️ Admin Utilities loaded!');
  console.log('💡 Type AdminUtilities.help() or AU.help() for available commands');
}

export default AdminUtilities;
