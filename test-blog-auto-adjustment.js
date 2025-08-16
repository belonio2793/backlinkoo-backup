/**
 * Test Script for Blog Auto-Adjustment System
 * 
 * This script demonstrates how to use the blog auto-adjustment system
 * to detect and fix malformed content in blog posts.
 * 
 * Usage:
 * - Run: node test-blog-auto-adjustment.js
 * - Or include the functions in your own scripts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample malformed content for testing
const MALFORMED_CONTENT_SAMPLES = {
  brokenBold: `**E**nhanced SEO Performance: This is broken bold formatting that should be fixed.
  
  **T**he second paragraph also has this issue where bold text is split incorrectly.`,

  malformedHeadings: `## &lt;h2&gt;Pro Tip
  
  Some content here that should have proper heading structure.
  
  ### &lt;h3&gt;Another Section
  
  More content with malformed headings.`,

  brokenLinks: `Check out this great resource at <a href="https://example.com</strong>broken link</a>.
  
  Another link with issues: <a hrefhttps ="": ="example.com">malformed attributes</a>.`,

  htmlEntities: `This content has &lt;strong&gt;HTML entities&lt;/strong&gt; that should be rendered as HTML.
  
  More text with &lt;h2&gt;malformed headings&lt;/h2&gt; mixed in.`,

  mixedIssues: `## &lt;h2&gt;**T**he Ultimate Guide to Content
  
  **E**nhanced content with multiple issues including broken bold formatting and HTML entities.
  
  Check out <a href="https://example.com</strong>this link</a> for more information.
  
  ### &lt;h3&gt;**S**ection with Issues
  
  More content with &lt;strong&gt;HTML entities&lt;/strong&gt; and formatting problems.`
};

/**
 * Content Quality Analyzer (simplified version of BlogQualityMonitor)
 */
class ContentQualityAnalyzer {
  static analyzeContent(content, targetUrl = '') {
    const issues = [];
    const warnings = [];
    let qualityScore = 100;

    // Check for malformed patterns
    const malformedPatterns = [
      { pattern: /##\s*&lt;[^&]*&gt;/, issue: 'Malformed headings with HTML entities' },
      { pattern: /\*\*[A-Z]\*\*[a-z]/, issue: 'Broken bold patterns' },
      { pattern: /&lt;\s*h[1-6]\s*&gt;/, issue: 'HTML entity headings' },
      { pattern: /href="[^"]*<\/strong>/, issue: 'Broken href attributes' },
      { pattern: /hrefhttps\s*=""\s*:\s*=""/, issue: 'Malformed link attributes' }
    ];

    malformedPatterns.forEach(({ pattern, issue }) => {
      if (pattern.test(content)) {
        issues.push(issue);
        qualityScore -= 15;
      }
    });

    // Check content structure
    const hasHeadings = /(<h[1-6][^>]*>|^#{1,6}\s)/i.test(content);
    const hasBacklinks = targetUrl ? content.includes(targetUrl) : true;
    const contentLength = content.length;

    if (!hasHeadings) {
      issues.push('Missing proper heading structure');
      qualityScore -= 20;
    }

    if (!hasBacklinks && targetUrl) {
      issues.push('Missing required backlink');
      qualityScore -= 15;
    }

    if (contentLength < 500) {
      issues.push('Content too short');
      qualityScore -= 25;
    } else if (contentLength < 1000) {
      warnings.push('Content shorter than recommended');
      qualityScore -= 10;
    }

    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      qualityScore,
      issues,
      warnings,
      hasMalformedPatterns: issues.length > 0,
      hasProperStructure: hasHeadings,
      hasBacklinks,
      contentLength
    };
  }
}

/**
 * Content Auto-Adjuster (simplified version of BlogAutoAdjustmentService)
 */
class ContentAutoAdjuster {
  static adjustContentForDisplay(content) {
    if (!content) return '';

    let adjusted = content;

    try {
      // Fix broken bold patterns like **E**nhanced
      adjusted = adjusted.replace(/\*\*([A-Z])\*\*([a-z])/g, '**$1$2');

      // Fix malformed headings like ## &lt;h2&gt;Title
      adjusted = adjusted.replace(/##\s*&lt;\s*h(\d+)\s*&gt;\s*([^<\n]+)/gi, '<h$1>$2</h$1>');

      // Fix HTML entities in basic text
      adjusted = adjusted.replace(/&lt;/g, '<');
      adjusted = adjusted.replace(/&gt;/g, '>');
      adjusted = adjusted.replace(/&amp;/g, '&');

      // Fix malformed links
      adjusted = adjusted.replace(/href="([^"]*)<\/strong>\s*([^"]*)">/g, 'href="$1$2">');
      adjusted = adjusted.replace(/hrefhttps\s*=""\s*:\s*=""/g, 'href="https://"');

      // Remove malformed HTML comments
      adjusted = adjusted.replace(/<!--[\s\S]*?-->/g, '');

      return adjusted;
    } catch (error) {
      console.error('❌ Error adjusting content:', error);
      return content;
    }
  }

  static detectMalformedContent(content) {
    const issues = [];
    
    if (!content || content.trim().length === 0) {
      return { isMalformed: true, issues: ['Empty content'], severity: 'high' };
    }

    // Check for common malformation patterns
    if (content.includes('</strong> //')) {
      issues.push('Broken URL in strong tag');
    }
    
    if (content.match(/<strong><strong>/g)) {
      issues.push('Nested strong tags');
    }
    
    if (content.match(/href="[^"]*<\/strong>/g)) {
      issues.push('HTML tags inside href attributes');
    }
    
    if (content.match(/##\s*&lt;[^&]*&gt;/)) {
      issues.push('Malformed headings with HTML entities');
    }

    if (content.match(/\*\*[A-Z]\*\*[a-z]/)) {
      issues.push('Broken bold formatting patterns');
    }

    const severity = issues.length > 3 ? 'high' : issues.length > 1 ? 'medium' : 'low';
    
    return {
      isMalformed: issues.length > 0,
      issues,
      severity
    };
  }
}

/**
 * Test the auto-adjustment system with sample content
 */
async function testAutoAdjustment() {
  console.log('🧪 Testing Blog Auto-Adjustment System\n');
  console.log('=' .repeat(50));

  for (const [name, content] of Object.entries(MALFORMED_CONTENT_SAMPLES)) {
    console.log(`\n📝 Testing: ${name}`);
    console.log('-'.repeat(30));

    // 1. Analyze original content
    const originalMetrics = ContentQualityAnalyzer.analyzeContent(content);
    console.log(`Original Quality Score: ${originalMetrics.qualityScore}/100`);
    
    if (originalMetrics.issues.length > 0) {
      console.log(`Issues Found: ${originalMetrics.issues.join(', ')}`);
    }

    // 2. Detect malformed patterns
    const malformationCheck = ContentAutoAdjuster.detectMalformedContent(content);
    console.log(`Malformation Severity: ${malformationCheck.severity}`);

    // 3. Apply auto-adjustment
    const adjustedContent = ContentAutoAdjuster.adjustContentForDisplay(content);
    
    // 4. Analyze adjusted content
    const adjustedMetrics = ContentQualityAnalyzer.analyzeContent(adjustedContent);
    console.log(`Adjusted Quality Score: ${adjustedMetrics.qualityScore}/100`);

    // 5. Show improvement
    const improvement = adjustedMetrics.qualityScore - originalMetrics.qualityScore;
    if (improvement > 0) {
      console.log(`✅ Quality Improved by: +${improvement} points`);
    } else if (improvement === 0) {
      console.log(`➖ No quality change needed`);
    } else {
      console.log(`⚠️ Quality decreased by: ${Math.abs(improvement)} points`);
    }

    // 6. Show content changes
    if (adjustedContent !== content) {
      console.log(`📋 Content was modified: ${adjustedContent.length} chars (was ${content.length})`);
    } else {
      console.log(`📋 Content unchanged`);
    }
  }
}

/**
 * Scan actual blog posts in the database
 */
async function scanDatabasePosts() {
  console.log('\n🔍 Scanning Database Blog Posts');
  console.log('=' .repeat(50));

  try {
    // Get published blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, target_url')
      .eq('status', 'published')
      .not('content', 'is', null)
      .limit(10); // Limit for demo

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      console.log('ℹ️ No published blog posts found');
      return;
    }

    console.log(`Found ${posts.length} published blog posts\n`);

    let needsAdjustment = 0;
    let highPriority = 0;

    for (const post of posts) {
      const metrics = ContentQualityAnalyzer.analyzeContent(post.content, post.target_url);
      const malformationCheck = ContentAutoAdjuster.detectMalformedContent(post.content);

      console.log(`📄 ${post.title}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Quality Score: ${metrics.qualityScore}/100`);
      console.log(`   Issues: ${metrics.issues.length}`);
      console.log(`   Malformed: ${malformationCheck.isMalformed ? 'Yes' : 'No'}`);

      if (metrics.qualityScore < 70 || malformationCheck.isMalformed) {
        needsAdjustment++;
        console.log(`   ⚠️ Needs adjustment`);
        
        if (metrics.qualityScore < 40 || malformationCheck.severity === 'high') {
          highPriority++;
          console.log(`   🚨 High priority`);
        }
      } else {
        console.log(`   ✅ Good quality`);
      }
      console.log('');
    }

    console.log('\n📊 Summary:');
    console.log(`   Total Posts: ${posts.length}`);
    console.log(`   Need Adjustment: ${needsAdjustment}`);
    console.log(`   High Priority: ${highPriority}`);
    console.log(`   Good Quality: ${posts.length - needsAdjustment}`);

  } catch (error) {
    console.error('❌ Error scanning database:', error);
  }
}

/**
 * Simulate fixing a batch of posts
 */
async function simulateBatchFix() {
  console.log('\n🔧 Simulating Batch Auto-Adjustment');
  console.log('=' .repeat(50));

  try {
    // Get posts that might need fixing
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, content, target_url')
      .not('content', 'is', null)
      .limit(5);

    if (error) throw error;
    if (!posts || posts.length === 0) {
      console.log('ℹ️ No posts found to test with');
      return;
    }

    console.log(`Processing ${posts.length} posts...\n`);

    let adjustedCount = 0;
    let improvedCount = 0;

    for (const post of posts) {
      const originalMetrics = ContentQualityAnalyzer.analyzeContent(post.content, post.target_url);
      const adjustedContent = ContentAutoAdjuster.adjustContentForDisplay(post.content);
      const adjustedMetrics = ContentQualityAnalyzer.analyzeContent(adjustedContent, post.target_url);

      const wasAdjusted = adjustedContent !== post.content;
      const wasImproved = adjustedMetrics.qualityScore > originalMetrics.qualityScore;

      if (wasAdjusted) adjustedCount++;
      if (wasImproved) improvedCount++;

      console.log(`📄 ${post.title.substring(0, 50)}...`);
      console.log(`   Original Quality: ${originalMetrics.qualityScore}/100`);
      console.log(`   Adjusted Quality: ${adjustedMetrics.qualityScore}/100`);
      console.log(`   Content Modified: ${wasAdjusted ? 'Yes' : 'No'}`);
      console.log(`   Quality Improved: ${wasImproved ? 'Yes' : 'No'}`);
      console.log('');
    }

    console.log('📊 Batch Processing Results:');
    console.log(`   Posts Processed: ${posts.length}`);
    console.log(`   Content Adjusted: ${adjustedCount}`);
    console.log(`   Quality Improved: ${improvedCount}`);
    console.log(`   Success Rate: ${Math.round((improvedCount / posts.length) * 100)}%`);

  } catch (error) {
    console.error('❌ Error in batch simulation:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Blog Auto-Adjustment System Test');
  console.log('=====================================\n');

  // Test 1: Sample content adjustment
  await testAutoAdjustment();

  // Test 2: Scan actual database posts
  await scanDatabasePosts();

  // Test 3: Simulate batch processing
  await simulateBatchFix();

  console.log('\n✅ Testing completed!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Visit /blog/validator in your app to use the UI');
  console.log('   2. The auto-adjustment runs automatically during content display');
  console.log('   3. Use the BlogAutoAdjustmentService API for programmatic access');
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export functions for use in other scripts
export {
  ContentQualityAnalyzer,
  ContentAutoAdjuster,
  testAutoAdjustment,
  scanDatabasePosts,
  simulateBatchFix
};
