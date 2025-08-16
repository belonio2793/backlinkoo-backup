/**
 * Test utility for the RobustBlogProcessor
 * Use this to test and verify that problematic blog content is properly processed
 */

import { RobustBlogProcessor } from './robustBlogProcessor';

// Common problematic patterns found in blog content
const TEST_CONTENT_PATTERNS = {
  malformedBold: `**E**nhanced SEO Performance: This is a test of broken bold formatting.`,
  
  htmlEntities: `<h2>&lt;h2&gt;Pro Tip</h2><p>Some content with &amp;lt; and &amp;gt; entities.</p>`,
  
  duplicateTitle: `# Unleashing the Power of Product Hunt
  
Unleashing the Power of Product Hunt: Your Ultimate Guide

## Introduction
This is the actual content.`,

  mixedMarkdownHtml: `## Pro Tip

Some **bold text** and <strong>html bold</strong> mixed together.

- List item 1
- List item 2

<p>HTML paragraph</p>`,

  emptyTags: `<h2></h2><p>Some content</p><strong></strong>More content<em></em>`,

  malformedHeadings: `## &lt;h2&gt;Pro Tip
Some content here.
## P ro Tip
More content.`
};

export class BlogProcessorTester {
  /**
   * Test all common problematic patterns
   */
  static runAllTests(): void {
    console.log('🧪 Running RobustBlogProcessor tests...\n');

    Object.entries(TEST_CONTENT_PATTERNS).forEach(([name, content]) => {
      this.testPattern(name, content);
    });

    console.log('\n✅ All tests completed. Check console for results.');
  }

  /**
   * Test a specific content pattern
   */
  static testPattern(name: string, content: string): void {
    console.log(`🔍 Testing: ${name}`);
    console.log('📝 Original content:');
    console.log(content);
    console.log('\n🔄 Processing...');

    const result = RobustBlogProcessor.process(content, 'Test Blog Title');

    console.log('✅ Processed content:');
    console.log(result.content);
    
    if (result.wasProcessed) {
      console.log('⚙️ Issues fixed:', result.issues);
    }
    
    if (result.warnings.length > 0) {
      console.log('⚠️ Warnings:', result.warnings);
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }

  /**
   * Test the specific problematic blog post URL mentioned by the user
   */
  static async testProblematicBlogPost(blogService: any): Promise<void> {
    const problemSlug = 'unleashing-the-power-of-product-hunt-your-ultimate-guide-to-launching-success-medqw6lg';
    
    try {
      console.log(`🔍 Testing problematic blog post: ${problemSlug}`);
      
      // Attempt to load the blog post
      const blogPost = await blogService.getBlogPostBySlug(problemSlug);
      
      if (!blogPost) {
        console.log('❌ Blog post not found');
        return;
      }

      console.log('📄 Blog post loaded:');
      console.log('- Title:', blogPost.title);
      console.log('- Content length:', blogPost.content?.length || 0);
      console.log('- Status:', blogPost.status);

      if (blogPost.content) {
        console.log('\n🔄 Processing with RobustBlogProcessor...');
        
        const result = RobustBlogProcessor.process(blogPost.content, blogPost.title, {
          removeTitle: true,
          targetUrl: blogPost.target_url,
          anchorText: blogPost.anchor_text,
          keyword: blogPost.keyword
        });

        console.log('✅ Processing results:');
        console.log('- Was processed:', result.wasProcessed);
        console.log('- Issues found:', result.issues.length);
        console.log('- Warnings:', result.warnings.length);
        
        if (result.issues.length > 0) {
          console.log('- Issues fixed:', result.issues);
        }
        
        if (result.warnings.length > 0) {
          console.log('- Warnings:', result.warnings);
        }

        console.log('\n📝 First 500 characters of processed content:');
        console.log(result.content.substring(0, 500) + '...');
      } else {
        console.log('❌ Blog post has no content');
      }

    } catch (error) {
      console.error('❌ Error testing blog post:', error);
    }
  }

  /**
   * Interactive tester for custom content
   */
  static testCustomContent(content: string, title?: string): void {
    console.log('🧪 Testing custom content...\n');
    
    const result = RobustBlogProcessor.process(content, title);
    
    console.log('📊 Test Results:');
    console.log('- Input length:', content.length);
    console.log('- Output length:', result.content.length);
    console.log('- Was processed:', result.wasProcessed);
    console.log('- Issues found:', result.issues.length);
    console.log('- Warnings:', result.warnings.length);
    
    if (result.issues.length > 0) {
      console.log('\n🔧 Issues fixed:');
      result.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log('\n📝 Processed content:');
    console.log(result.content);
  }
}

// Expose to global scope for browser console testing
if (typeof window !== 'undefined') {
  (window as any).BlogProcessorTester = BlogProcessorTester;
  (window as any).testBlogProcessor = () => BlogProcessorTester.runAllTests();
  (window as any).testCustomBlogContent = (content: string, title?: string) => 
    BlogProcessorTester.testCustomContent(content, title);
}
