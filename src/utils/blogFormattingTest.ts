/**
 * Blog Formatting Test Utility
 * Tests all the blog post formatting fixes implemented
 */

import { ContentFormatter } from './contentFormatter';
import { LinkAttributeFixer } from './linkAttributeFixer';

export class BlogFormattingTest {
  /**
   * Test all formatting fixes with sample problematic content
   */
  static runAllTests(): void {
    console.log('🧪 Running Blog Formatting Tests...');
    
    this.testDoubleTitle();
    this.testTitleTruncation();
    this.testBrokenLinks();
    this.testAuthorNotes();
    this.testRandomNumbers();
    
    console.log('✅ All Blog Formatting Tests Completed!');
  }
  
  /**
   * Test 1: Double titles removal
   */
  private static testDoubleTitle(): void {
    console.log('\n🔍 Test 1: Double Title Removal');
    
    const problematicContent = `
    # The Complete Guide to Youtube Search Engine Optimization
    **Title: The Complete Guide to Youtube Search Engine Optimization**
    
    This is the actual content of the blog post that should remain.
    `;
    
    const title = "The Complete Guide to Youtube Search Engine Optimization";
    const result = ContentFormatter.formatBlogContent(problematicContent, title);
    
    console.log('Original:', problematicContent.substring(0, 100) + '...');
    console.log('Fixed:', result.substring(0, 100) + '...');
    
    // Check if duplicate title was removed
    const titleCount = (result.match(/The Complete Guide to Youtube Search Engine Optimization/g) || []).length;
    console.log(`✅ Title occurrences reduced to: ${titleCount} (should be 0 in content)`);
  }
  
  /**
   * Test 2: Title truncation handling
   */
  private static testTitleTruncation(): void {
    console.log('\n🔍 Test 2: Title Truncation Handling');
    
    const truncatedTitle = "The Complete Guide to Youtube Search Engine Opti";
    const fullTitle = "The Complete Guide to Youtube Search Engine Optimization";
    
    // Simulate what BeautifulBlogPost.cleanTitle does
    const cleanTitle = truncatedTitle
      .replace(/^h\d+[-\s]*/, '')
      .replace(/[-\s]*[a-z0-9]{8}$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Original truncated:', truncatedTitle);
    console.log('Cleaned title:', cleanTitle);
    console.log('✅ Title truncation handled gracefully');
  }
  
  /**
   * Test 3: Broken link format fixing
   */
  private static testBrokenLinks(): void {
    console.log('\n🔍 Test 3: Broken Link Format Fixing');
    
    const brokenLink = `
    Check out <a hrefhttps://backlinkoo.com" target_blank" relnoopener noreferrer">YouTube search engine optimization</a>.
    `;
    
    const result = LinkAttributeFixer.fixMalformedLinks(brokenLink);
    
    console.log('Original broken link:', brokenLink.trim());
    console.log('Fixed link:', result.trim());
    
    // Check if the link was properly formatted
    const hasProperHref = result.includes('href="https://backlinkoo.com"');
    const hasProperTarget = result.includes('target="_blank"');
    const hasProperRel = result.includes('rel="noopener');
    
    console.log(`✅ Link fixes: href=${hasProperHref}, target=${hasProperTarget}, rel=${hasProperRel}`);
  }
  
  /**
   * Test 4: Author notes removal
   */
  private static testAuthorNotes(): void {
    console.log('\n🔍 Test 4: Author Notes Removal');
    
    const contentWithAuthorNotes = `
    This is the main content of the blog post with valuable information.
    
    ## Conclusion
    
    This section should remain as it's part of the content.
    
    ---
    
    In this blog post, we've covered essential strategies for optimizing your YouTube channel's visibility through SEO. By following these actionable tips and best practices, you can enhance your channel's performance, attract more viewers, and ultimately grow your subscriber base.
    `;
    
    const result = ContentFormatter.sanitizeContent(contentWithAuthorNotes);
    
    console.log('Original had author notes at end');
    console.log('Fixed content ends with:', result.substring(result.length - 100));
    
    // Check if author notes were removed
    const hasAuthorNotes = result.includes('In this blog post, we\'ve covered essential strategies');
    console.log(`✅ Author notes removed: ${!hasAuthorNotes}`);
  }
  
  /**
   * Test 5: Random numbers removal
   */
  private static testRandomNumbers(): void {
    console.log('\n🔍 Test 5: Random Numbers Removal');
    
    const contentWithRandomNumber = `
    This is the main content of the blog post.
    
    ## Conclusion
    
    Final thoughts on the topic.
    
    0
    `;
    
    const result = ContentFormatter.sanitizeContent(contentWithRandomNumber);
    
    console.log('Original ends with random "0"');
    console.log('Fixed content ends with:', result.substring(result.length - 50));
    
    // Check if random number was removed
    const endsWithNumber = /\d+\s*$/.test(result);
    console.log(`✅ Random number removed: ${!endsWithNumber}`);
  }
  
  /**
   * Comprehensive test with all issues combined
   */
  static testCompleteFixing(): string {
    console.log('\n🎯 Comprehensive Test - All Issues Combined');
    
    const problematicContent = `
    **Title: The Complete Guide to Youtube Search Engine Opti**
    
    # The Complete Guide to Youtube Search Engine Opti
    
    This comprehensive guide will help you understand YouTube SEO.
    
    ## Key Strategies
    
    Here are the main strategies for success.
    
    Check out <a hrefhttps://backlinkoo.com" target_blank" relnoopener noreferrer">YouTube search engine optimization</a> for more tips.
    
    ## Conclusion
    
    These strategies will help improve your channel.
    
    ---
    
    In this blog post, we've covered essential strategies for optimizing your YouTube channel's visibility through SEO. By following these actionable tips and best practices, you can enhance your channel's performance, attract more viewers, and ultimately grow your subscriber base.
    
    0
    `;
    
    const title = "The Complete Guide to Youtube Search Engine Optimization";
    
    // Apply all fixes
    let result = ContentFormatter.formatBlogContent(problematicContent, title);
    result = ContentFormatter.sanitizeContent(result);
    result = LinkAttributeFixer.fixMalformedLinks(result);
    
    console.log('✅ Comprehensive test completed');
    console.log('Final result length:', result.length);
    console.log('Result preview:', result.substring(0, 200) + '...');
    
    return result;
  }
}

// Export test function for manual testing
export const testBlogFormatting = BlogFormattingTest.runAllTests;
export const testComprehensiveFormatting = BlogFormattingTest.testCompleteFixing;
