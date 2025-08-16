/**
 * Blog Auto-Adjustment Service
 * 
 * Automatically detects and repairs malformed blog content in the /blog section.
 * This service runs both proactively during content generation and reactively
 * when rendering existing posts to ensure consistent, well-formatted content.
 */

import { RobustContentProcessor } from '@/utils/robustContentProcessor';
import { BlogQualityMonitor } from '@/utils/blogQualityMonitor';
import { SimpleContentFormatter } from '@/utils/simpleContentFormatter';
import { LinkAttributeFixer } from '@/utils/linkAttributeFixer';
import { BlogService } from './blogService';
import type { BlogPost } from './blogService';

interface AdjustmentResult {
  success: boolean;
  wasAdjusted: boolean;
  originalContent: string;
  adjustedContent: string;
  issues: string[];
  adjustments: string[];
  qualityScore: {
    before: number;
    after: number;
  };
}

interface BatchAdjustmentResult {
  totalPosts: number;
  processedPosts: number;
  adjustedPosts: number;
  failedPosts: number;
  results: AdjustmentResult[];
}

export class BlogAutoAdjustmentService {
  private static readonly QUALITY_THRESHOLD = 70;
  private static readonly CRITICAL_ISSUES_THRESHOLD = 3;

  /**
   * Auto-detect and fix malformed content in a single blog post
   */
  static async autoAdjustBlogPost(
    blogPost: BlogPost, 
    options: {
      forceAdjustment?: boolean;
      preserveOriginal?: boolean;
      updateDatabase?: boolean;
    } = {}
  ): Promise<AdjustmentResult> {
    const { forceAdjustment = false, preserveOriginal = true, updateDatabase = true } = options;
    
    console.log(`🔍 Auto-adjusting blog post: ${blogPost.slug}`);
    
    const originalContent = blogPost.content || '';
    let adjustedContent = originalContent;
    const adjustments: string[] = [];
    const issues: string[] = [];

    // Step 1: Initial quality assessment
    const initialMetrics = BlogQualityMonitor.analyzeContent(originalContent, blogPost.target_url);
    
    // Step 2: Detect if adjustment is needed
    const needsAdjustment = forceAdjustment || 
      initialMetrics.qualityScore < this.QUALITY_THRESHOLD ||
      initialMetrics.hasMalformedPatterns ||
      initialMetrics.issues.length >= this.CRITICAL_ISSUES_THRESHOLD;

    if (!needsAdjustment) {
      return {
        success: true,
        wasAdjusted: false,
        originalContent,
        adjustedContent: originalContent,
        issues: [],
        adjustments: [],
        qualityScore: {
          before: initialMetrics.qualityScore,
          after: initialMetrics.qualityScore
        }
      };
    }

    // Step 3: Apply progressive content fixes
    try {
      // Phase 1: Detect and log all issues
      const malformationDetection = RobustContentProcessor.detectMalformedContent(originalContent);
      issues.push(...malformationDetection.issues);

      // Phase 2: Fix link attributes first (most critical)
      if (this.hasLinkIssues(originalContent)) {
        adjustedContent = LinkAttributeFixer.fixMalformedLinks(adjustedContent);
        adjustments.push('Fixed malformed link attributes');
      }

      // Phase 3: Apply content processing based on severity
      if (malformationDetection.severity === 'high') {
        // Use robust processor for severe issues
        const robustResult = RobustContentProcessor.autoDetectAndRepair(
          adjustedContent, 
          {
            primaryKeyword: this.extractKeywordFromTitle(blogPost.title),
            targetUrl: blogPost.target_url,
            anchorText: blogPost.anchor_text
          }
        );
        
        if (robustResult.success) {
          adjustedContent = robustResult.content;
          if (robustResult.wasRepaired) {
            adjustments.push('Applied robust content processing for high-severity issues');
          }
        }
      } else {
        // Use simple formatter for minor issues
        adjustedContent = SimpleContentFormatter.formatBlogContent(adjustedContent, blogPost.title);
        adjustments.push('Applied simple content formatting');
      }

      // Phase 4: Validate content structure
      const validationResult = SimpleContentFormatter.validateContent(adjustedContent);
      if (!validationResult.isValid) {
        // Apply additional formatting
        adjustedContent = this.applyStructuralFixes(adjustedContent);
        adjustments.push('Applied structural content fixes');
      }

      // Phase 5: Final quality check
      const finalMetrics = BlogQualityMonitor.analyzeContent(adjustedContent, blogPost.target_url);
      
      // Phase 6: Update database if requested and content was improved
      if (updateDatabase && adjustments.length > 0 && finalMetrics.qualityScore > initialMetrics.qualityScore) {
        await this.updateBlogPostContent(blogPost.id, adjustedContent, preserveOriginal ? originalContent : undefined);
        adjustments.push('Updated database with improved content');
      }

      return {
        success: true,
        wasAdjusted: adjustments.length > 0,
        originalContent,
        adjustedContent,
        issues,
        adjustments,
        qualityScore: {
          before: initialMetrics.qualityScore,
          after: finalMetrics.qualityScore
        }
      };

    } catch (error) {
      console.error('❌ Error during auto-adjustment:', error);
      
      return {
        success: false,
        wasAdjusted: false,
        originalContent,
        adjustedContent: originalContent,
        issues: [...issues, `Adjustment failed: ${error}`],
        adjustments: [],
        qualityScore: {
          before: initialMetrics.qualityScore,
          after: initialMetrics.qualityScore
        }
      };
    }
  }

  /**
   * Batch process multiple blog posts for auto-adjustment
   */
  static async batchAutoAdjustBlogPosts(
    posts: BlogPost[],
    options: {
      maxConcurrent?: number;
      skipHighQuality?: boolean;
      updateDatabase?: boolean;
    } = {}
  ): Promise<BatchAdjustmentResult> {
    const { maxConcurrent = 5, skipHighQuality = true, updateDatabase = true } = options;
    
    console.log(`🔄 Starting batch auto-adjustment for ${posts.length} blog posts`);
    
    const results: AdjustmentResult[] = [];
    let adjustedCount = 0;
    let failedCount = 0;

    // Process posts in batches to avoid overwhelming the system
    for (let i = 0; i < posts.length; i += maxConcurrent) {
      const batch = posts.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (post) => {
        try {
          // Skip high-quality posts if requested
          if (skipHighQuality) {
            const quickQuality = BlogQualityMonitor.analyzeContent(post.content || '', post.target_url);
            if (quickQuality.qualityScore >= 85 && !quickQuality.hasMalformedPatterns) {
              return {
                success: true,
                wasAdjusted: false,
                originalContent: post.content || '',
                adjustedContent: post.content || '',
                issues: [],
                adjustments: ['Skipped - high quality content'],
                qualityScore: { before: quickQuality.qualityScore, after: quickQuality.qualityScore }
              };
            }
          }

          return await this.autoAdjustBlogPost(post, { updateDatabase });
        } catch (error) {
          console.error(`❌ Failed to process post ${post.slug}:`, error);
          failedCount++;
          return {
            success: false,
            wasAdjusted: false,
            originalContent: post.content || '',
            adjustedContent: post.content || '',
            issues: [`Batch processing failed: ${error}`],
            adjustments: [],
            qualityScore: { before: 0, after: 0 }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Count adjustments
      adjustedCount += batchResults.filter(r => r.wasAdjusted).length;
      
      // Small delay between batches to prevent rate limiting
      if (i + maxConcurrent < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      totalPosts: posts.length,
      processedPosts: results.length,
      adjustedPosts: adjustedCount,
      failedPosts: failedCount,
      results
    };
  }

  /**
   * Scan all blog posts and identify those needing adjustment
   */
  static async scanForMalformedContent(): Promise<{
    needsAdjustment: BlogPost[];
    highPriority: BlogPost[];
    report: string;
  }> {
    try {
      // Get all published blog posts
      const blogService = new BlogService();
      const { data: posts } = await blogService.getBlogPosts({ status: 'published' });
      
      if (!posts) {
        return { needsAdjustment: [], highPriority: [], report: 'No posts found' };
      }

      const needsAdjustment: BlogPost[] = [];
      const highPriority: BlogPost[] = [];
      const qualityStats = { excellent: 0, good: 0, poor: 0, critical: 0 };

      for (const post of posts) {
        const metrics = BlogQualityMonitor.analyzeContent(post.content || '', post.target_url);
        
        if (metrics.qualityScore >= 80) {
          qualityStats.excellent++;
        } else if (metrics.qualityScore >= 60) {
          qualityStats.good++;
        } else if (metrics.qualityScore >= 40) {
          qualityStats.poor++;
          needsAdjustment.push(post);
        } else {
          qualityStats.critical++;
          needsAdjustment.push(post);
          highPriority.push(post);
        }

        // Also check for malformed patterns regardless of score
        if (metrics.hasMalformedPatterns) {
          if (!needsAdjustment.includes(post)) needsAdjustment.push(post);
          if (metrics.qualityScore < 30 && !highPriority.includes(post)) {
            highPriority.push(post);
          }
        }
      }

      const report = `
📊 Blog Content Quality Scan Report
====================================

Total Posts Scanned: ${posts.length}
📈 Excellent Quality (80+): ${qualityStats.excellent}
✅ Good Quality (60-79): ${qualityStats.good}
⚠️ Poor Quality (40-59): ${qualityStats.poor}
🚨 Critical Issues (<40): ${qualityStats.critical}

Posts Needing Adjustment: ${needsAdjustment.length}
High Priority Fixes: ${highPriority.length}

Recommendation: ${needsAdjustment.length > 0 ? 
  `Run auto-adjustment on ${needsAdjustment.length} posts` : 
  'No immediate action needed'}
      `.trim();

      return { needsAdjustment, highPriority, report };

    } catch (error) {
      console.error('❌ Error scanning for malformed content:', error);
      return { 
        needsAdjustment: [], 
        highPriority: [], 
        report: `Scan failed: ${error}` 
      };
    }
  }

  /**
   * Helper: Check if content has link-related issues
   */
  private static hasLinkIssues(content: string): boolean {
    const linkIssuePatterns = [
      /href="[^"]*<\/strong>/,         // HTML tags in href
      /hrefhttps\s*=""\s*:\s*=""/,     // Malformed href attributes
      /href="[^"]*\s+[^"]*">/,         // Spaces in href values
      /stylecolor/i,                   // Malformed style attributes
    ];

    return linkIssuePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Helper: Extract primary keyword from title
   */
  private static extractKeywordFromTitle(title: string): string {
    // Simple extraction - take the first meaningful words
    return title
      .replace(/^(the|a|an)\s+/i, '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ')
      .toLowerCase();
  }

  /**
   * Helper: Apply structural fixes to content
   */
  private static applyStructuralFixes(content: string): string {
    let fixed = content;

    // Ensure proper paragraph structure
    if (!fixed.includes('<p>') && !fixed.includes('<h')) {
      // Split by double line breaks and wrap in paragraphs
      const paragraphs = fixed.split(/\n\s*\n/).filter(p => p.trim());
      fixed = paragraphs.map(p => p.trim().startsWith('<') ? p : `<p>${p.trim()}</p>`).join('\n\n');
    }

    // Fix missing title structure
    if (!fixed.includes('<h1>') && !fixed.includes('<h2>')) {
      // Add a basic heading if none exists
      fixed = '<h2>Article Content</h2>\n\n' + fixed;
    }

    // Clean up excessive whitespace
    fixed = fixed.replace(/\n{3,}/g, '\n\n').replace(/\s{3,}/g, ' ');

    return fixed;
  }

  /**
   * Helper: Update blog post content in database
   */
  private static async updateBlogPostContent(
    postId: string, 
    newContent: string, 
    originalContent?: string
  ): Promise<void> {
    const blogService = new BlogService();
    
    const updateData: any = {
      content: newContent,
      updated_at: new Date().toISOString()
    };

    // Store original content for recovery if requested
    if (originalContent) {
      updateData.original_content = originalContent;
    }

    await blogService.updateBlogPost(postId, updateData);
  }

  /**
   * Runtime content adjustment for rendering
   * Use this when displaying content to users without modifying the database
   */
  static adjustContentForDisplay(content: string, post?: Partial<BlogPost>): string {
    if (!content) return '';

    try {
      // Quick quality check
      const metrics = BlogQualityMonitor.analyzeContent(content, post?.target_url);
      
      if (metrics.qualityScore >= 70 && !metrics.hasMalformedPatterns) {
        return content; // Content is fine, return as-is
      }

      // Apply lightweight fixes for display
      let adjusted = content;

      // Fix critical display issues
      if (this.hasLinkIssues(adjusted)) {
        adjusted = LinkAttributeFixer.fixMalformedLinks(adjusted);
      }

      // Fix malformed patterns without heavy processing
      adjusted = this.fixDisplayIssues(adjusted);

      return adjusted;

    } catch (error) {
      console.error('❌ Error adjusting content for display:', error);
      return content; // Return original on error
    }
  }

  /**
   * Helper: Fix critical display issues and convert markdown to HTML
   */
  private static fixDisplayIssues(content: string): string {
    let fixed = content;

    // First, fix broken bold patterns like **E**nhanced
    fixed = fixed.replace(/\*\*([A-Z])\*\*([a-z])/g, '**$1$2');

    // Fix malformed headings like ## &lt;h2&gt;Title
    fixed = fixed.replace(/##\s*&lt;\s*h(\d+)\s*&gt;\s*([^<\n]+)/gi, '<h$1>$2</h$1>');

    // Fix HTML entities in basic text
    fixed = fixed.replace(/&lt;/g, '<');
    fixed = fixed.replace(/&gt;/g, '>');
    fixed = fixed.replace(/&amp;/g, '&');

    // Remove malformed HTML comments
    fixed = fixed.replace(/<!--[\s\S]*?-->/g, '');

    // CRITICAL: Convert basic markdown to HTML if content doesn't already have HTML tags
    const hasHtmlTags = /<[^>]+>/.test(fixed);
    if (!hasHtmlTags) {
      console.log('🔄 Converting markdown to HTML for display');

      // Convert markdown headings to HTML
      fixed = fixed
        // Convert ### to h3
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        // Convert ## to h2
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        // Convert # to h1
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')

        // Convert **bold** to <strong>
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

        // Convert *italic* to <em>
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')

        // Convert [link](url) to <a>
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">$1</a>')

        // Convert plain URLs to links
        .replace(/(^|[^<"'])(https?:\/\/[^\s<>"']+)/gi, '$1<a href="$2" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">$2</a>')

        // Convert line breaks to paragraphs
        .split('\n\n')
        .filter(para => para.trim())
        .map(para => {
          const trimmed = para.trim();
          // Don't wrap headings in paragraphs
          if (trimmed.startsWith('<h')) {
            return trimmed;
          }
          // Handle list items
          if (trimmed.includes('\n- ') || trimmed.includes('\n* ')) {
            const listItems = trimmed.split(/\n[*-]\s+/).filter(item => item.trim());
            const firstPart = listItems.shift() || '';
            const items = listItems.map(item => `<li>${item.trim()}</li>`).join('\n');
            return (firstPart ? `<p>${firstPart}</p>\n` : '') + `<ul>\n${items}\n</ul>`;
          }
          // Handle numbered lists
          if (/\n\d+\.\s+/.test(trimmed)) {
            const parts = trimmed.split(/\n\d+\.\s+/);
            const firstPart = parts.shift() || '';
            const items = parts.map(item => `<li>${item.trim()}</li>`).join('\n');
            return (firstPart ? `<p>${firstPart}</p>\n` : '') + `<ol>\n${items}\n</ol>`;
          }
          // Regular paragraph
          return `<p>${trimmed}</p>`;
        })
        .join('\n\n');
    } else if (hasHtmlTags && /<h[1-6][^>]*>.*?<\/h[1-6]>/.test(fixed)) {
      // Content has HTML but may have mixed markdown headings - fix those
      fixed = fixed
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>');
    }

    return fixed;
  }
}

/**
 * Middleware function to auto-adjust content during blog post creation
 */
export async function autoAdjustOnCreate(content: string, metadata: any): Promise<string> {
  try {
    const dummyPost = {
      content,
      title: metadata.title || 'Untitled',
      target_url: metadata.targetUrl || '',
      anchor_text: metadata.anchorText || ''
    } as BlogPost;

    const result = await BlogAutoAdjustmentService.autoAdjustBlogPost(dummyPost, {
      updateDatabase: false,
      forceAdjustment: true
    });

    if (result.success && result.wasAdjusted) {
      console.log(`✅ Content auto-adjusted during creation. Quality improved from ${result.qualityScore.before} to ${result.qualityScore.after}`);
      return result.adjustedContent;
    }

    return content;
  } catch (error) {
    console.error('❌ Error in auto-adjust middleware:', error);
    return content;
  }
}

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).BlogAutoAdjustmentService = BlogAutoAdjustmentService;
  console.log('🛠️ Blog auto-adjustment service available: window.BlogAutoAdjustmentService');
}
