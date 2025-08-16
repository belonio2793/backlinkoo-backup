/**
 * Blog Content Standardization Service
 * 
 * Applies consistent formatting standards to all blog posts based on the
 * premium design system established in the codebase. This ensures all
 * blog posts follow the same high-quality formatting protocols.
 */

import { BlogContentSecurityProcessor } from '@/utils/blogContentSecurityProcessor';
import { BlogAutoAdjustmentService } from './blogAutoAdjustmentService';
import { blogService } from './blogService';
import type { BlogPost } from './blogService';

export interface FormattingStandards {
  headingStructure: {
    h1: { fontSize: string; fontWeight: string; margin: string; lineHeight: string };
    h2: { fontSize: string; fontWeight: string; margin: string; lineHeight: string };
    h3: { fontSize: string; fontWeight: string; margin: string; lineHeight: string };
  };
  contentFormatting: {
    paragraphs: { fontSize: string; lineHeight: string; margin: string };
    lists: { margin: string; padding: string; itemSpacing: string };
    links: { decoration: string; color: string; hoverEffects: boolean };
    code: { backgroundColor: string; padding: string; borderRadius: string };
  };
  structure: {
    dropCap: boolean;
    readingProgress: boolean;
    enhancedImages: boolean;
    premiumBlockquotes: boolean;
  };
}

export interface StandardizationResult {
  success: boolean;
  originalContent: string;
  standardizedContent: string;
  improvementsApplied: string[];
  qualityScore: {
    before: number;
    after: number;
  };
  standards: FormattingStandards;
}

export interface BulkStandardizationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: Array<{
    postId: string;
    postTitle: string;
    result: StandardizationResult;
    error?: string;
  }>;
}

export class BlogContentStandardizationService {
  
  // Premium formatting standards extracted from the CSS design system
  private static readonly PREMIUM_STANDARDS: FormattingStandards = {
    headingStructure: {
      h1: {
        fontSize: '3.5rem',
        fontWeight: '900',
        margin: '3rem 0 2rem 0',
        lineHeight: '1.1'
      },
      h2: {
        fontSize: '2.5rem',
        fontWeight: '800',
        margin: '4rem 0 1.5rem 0',
        lineHeight: '1.2'
      },
      h3: {
        fontSize: '1.875rem',
        fontWeight: '700',
        margin: '3rem 0 1.25rem 0',
        lineHeight: '1.3'
      }
    },
    contentFormatting: {
      paragraphs: {
        fontSize: '1.25rem',
        lineHeight: '1.9',
        margin: '2rem 0'
      },
      lists: {
        margin: '2.5rem 0',
        padding: '0 0 0 2rem',
        itemSpacing: '1rem 0'
      },
      links: {
        decoration: 'none',
        color: 'rgb(59, 130, 246)',
        hoverEffects: true
      },
      code: {
        backgroundColor: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
        padding: '0.4rem 0.8rem',
        borderRadius: '12px'
      }
    },
    structure: {
      dropCap: true,
      readingProgress: true,
      enhancedImages: true,
      premiumBlockquotes: true
    }
  };

  /**
   * Standardize a single blog post to match premium formatting standards
   */
  static async standardizeBlogPost(
    postId: string,
    options: {
      applyToDatabase?: boolean;
      preserveOriginal?: boolean;
      forceStandardization?: boolean;
    } = {}
  ): Promise<StandardizationResult> {
    const { applyToDatabase = true, preserveOriginal = true, forceStandardization = false } = options;
    
    try {
      // Get the blog post
      const blogServiceInstance = new blogService();
      const { data: post, error } = await blogServiceInstance.getBlogPost(postId);
      
      if (error || !post) {
        throw new Error(`Failed to fetch blog post: ${error?.message || 'Post not found'}`);
      }

      const originalContent = post.content || '';
      
      // Calculate initial quality score
      const initialQuality = this.calculateContentQuality(originalContent);
      
      // Skip if already high quality and not forced
      if (initialQuality >= 90 && !forceStandardization) {
        return {
          success: true,
          originalContent,
          standardizedContent: originalContent,
          improvementsApplied: ['Content already meets high standards'],
          qualityScore: {
            before: initialQuality,
            after: initialQuality
          },
          standards: this.PREMIUM_STANDARDS
        };
      }

      console.log(`📊 Standardizing blog post: ${post.title} (Quality: ${initialQuality}/100)`);

      // Apply standardization process
      const standardizedContent = await this.applyFormattingStandards(originalContent, post.title || '');
      const improvementsApplied = this.getAppliedImprovements(originalContent, standardizedContent);
      
      // Calculate final quality score
      const finalQuality = this.calculateContentQuality(standardizedContent);
      
      // Update database if requested and there are improvements
      if (applyToDatabase && improvementsApplied.length > 0) {
        const updateData: any = {
          content: standardizedContent,
          updated_at: new Date().toISOString()
        };

        // Store original content for recovery if requested
        if (preserveOriginal) {
          updateData.original_content = originalContent;
        }

        const { error: updateError } = await blogServiceInstance.updateBlogPost(postId, updateData);
        
        if (updateError) {
          console.error(`Failed to update post ${postId}:`, updateError);
          // Continue but note the database update failed
          improvementsApplied.push('Note: Database update failed');
        } else {
          improvementsApplied.push('Content updated in database');
        }
      }

      return {
        success: true,
        originalContent,
        standardizedContent,
        improvementsApplied,
        qualityScore: {
          before: initialQuality,
          after: finalQuality
        },
        standards: this.PREMIUM_STANDARDS
      };

    } catch (error) {
      console.error('Standardization error:', error);
      return {
        success: false,
        originalContent: '',
        standardizedContent: '',
        improvementsApplied: [],
        qualityScore: { before: 0, after: 0 },
        standards: this.PREMIUM_STANDARDS
      };
    }
  }

  /**
   * Apply premium formatting standards to content
   */
  private static async applyFormattingStandards(content: string, title: string): Promise<string> {
    let formattedContent = content;

    // Step 1: Security processing first
    const securityResult = BlogContentSecurityProcessor.processContent(formattedContent, title);
    formattedContent = securityResult.content;

    // Step 2: Fix HTML structure and hierarchy
    formattedContent = this.standardizeHtmlStructure(formattedContent);

    // Step 3: Apply premium typography
    formattedContent = this.applyPremiumTypography(formattedContent);

    // Step 4: Enhance lists and formatting
    formattedContent = this.enhanceLists(formattedContent);

    // Step 5: Standardize links
    formattedContent = this.standardizeLinks(formattedContent);

    // Step 6: Enhance images and media
    formattedContent = this.enhanceImages(formattedContent);

    // Step 7: Standardize blockquotes
    formattedContent = this.enhanceBlockquotes(formattedContent);

    // Step 8: Apply consistent spacing
    formattedContent = this.applyConsistentSpacing(formattedContent);

    // Step 9: Final cleanup and validation
    formattedContent = this.finalCleanup(formattedContent);

    return formattedContent;
  }

  /**
   * Standardize HTML structure and hierarchy
   */
  private static standardizeHtmlStructure(content: string): string {
    let formatted = content;

    // Ensure proper heading hierarchy
    formatted = formatted
      // Fix improperly nested headings
      .replace(/<h([1-6])[^>]*>\s*<h([1-6])[^>]*>/gi, '<h$1>')
      .replace(/<\/h([1-6])>\s*<\/h([1-6])>/gi, '</h$1>')
      
      // Remove duplicate titles (common issue)
      .replace(/(<h1[^>]*>[^<]*<\/h1>)\s*\1/gi, '$1')
      
      // Fix malformed heading attributes
      .replace(/<h([1-6])([^>]*)class="[^"]*"([^>]*)>/gi, '<h$1$2$3>')
      
      // Ensure proper paragraph structure
      .replace(/([^<>\n]+)\n\n([^<>\n]+)/g, '<p>$1</p>\n\n<p>$2</p>');

    // Fix list structure
    formatted = formatted
      .replace(/<\/li>\s*([^<\n]+)\s*<li>/gi, '</li><li>$1</li><li>')
      .replace(/<ul>\s*([^<]+)\s*<li>/gi, '<ul><li>$1</li><li>')
      .replace(/<\/li>\s*([^<]+)\s*<\/ul>/gi, '</li><li>$1</li></ul>');

    return formatted;
  }

  /**
   * Apply premium typography standards
   */
  private static applyPremiumTypography(content: string): string {
    let formatted = content;

    // Enhance headings with proper structure
    formatted = formatted
      .replace(/<h1([^>]*)>(.*?)<\/h1>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        return `<h1 class="elite-blog-h1"${attrs}>${cleanText}</h1>`;
      })
      .replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        return `<h2 class="elite-blog-h2"${attrs}>${cleanText}</h2>`;
      })
      .replace(/<h3([^>]*)>(.*?)<\/h3>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        return `<h3 class="elite-blog-h3"${attrs}>${cleanText}</h3>`;
      });

    // Enhance paragraphs
    formatted = formatted
      .replace(/<p([^>]*)>(.*?)<\/p>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        if (cleanText.length === 0) return '';
        return `<p class="elite-blog-paragraph"${attrs}>${cleanText}</p>`;
      });

    // Add drop cap class to first paragraph
    formatted = formatted.replace(
      /<p class="elite-blog-paragraph"([^>]*)>(.*?)<\/p>/,
      '<p class="elite-blog-paragraph elite-blog-first-paragraph"$1>$2</p>'
    );

    return formatted;
  }

  /**
   * Enhance lists with premium styling
   */
  private static enhanceLists(content: string): string {
    let formatted = content;

    // Enhanced unordered lists
    formatted = formatted
      .replace(/<ul([^>]*)>/gi, '<ul class="elite-blog-list elite-blog-unordered-list"$1>')
      .replace(/<ol([^>]*)>/gi, '<ol class="elite-blog-list elite-blog-ordered-list"$1>')
      .replace(/<li([^>]*)>(.*?)<\/li>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        return `<li class="elite-blog-list-item"${attrs}>${cleanText}</li>`;
      });

    // Handle nested lists
    formatted = formatted
      .replace(/(<ul[^>]*>.*?<li[^>]*>.*?)<ul class="elite-blog-list/gi, '$1<ul class="elite-blog-list elite-blog-nested-list')
      .replace(/(<ol[^>]*>.*?<li[^>]*>.*?)<ol class="elite-blog-list/gi, '$1<ol class="elite-blog-list elite-blog-nested-list');

    return formatted;
  }

  /**
   * Standardize links with premium styling
   */
  private static standardizeLinks(content: string): string {
    let formatted = content;

    // Enhance all links with proper attributes and classes
    formatted = formatted.replace(
      /<a([^>]*?)href="([^"]*)"([^>]*?)>(.*?)<\/a>/gi,
      (match, preAttrs, href, postAttrs, text) => {
        // Don't modify if already has target="_blank"
        if (match.includes('target="_blank"')) {
          return `<a class="elite-blog-link"${preAttrs}href="${href}"${postAttrs}>${text}</a>`;
        }
        
        // Add target="_blank" for external links
        const isExternal = href.startsWith('http') && !href.includes(window.location?.hostname || '');
        const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        
        return `<a class="elite-blog-link"${preAttrs}href="${href}"${postAttrs}${targetAttr}>${text}</a>`;
      }
    );

    return formatted;
  }

  /**
   * Enhance images with premium styling
   */
  private static enhanceImages(content: string): string {
    let formatted = content;

    // Enhance images with wrapper and classes
    formatted = formatted.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/gi,
      (match, preAttrs, src, postAttrs) => {
        const altMatch = match.match(/alt="([^"]*)"/);
        const alt = altMatch ? altMatch[1] : '';
        
        return `<div class="elite-blog-image-wrapper">
          <img class="elite-blog-image"${preAttrs}src="${src}"${postAttrs} loading="lazy">
          ${alt ? `<div class="elite-blog-image-caption">${alt}</div>` : ''}
        </div>`;
      }
    );

    return formatted;
  }

  /**
   * Enhance blockquotes with premium styling
   */
  private static enhanceBlockquotes(content: string): string {
    let formatted = content;

    formatted = formatted.replace(
      /<blockquote([^>]*)>(.*?)<\/blockquote>/gis,
      (match, attrs, text) => {
        const cleanText = text.trim();
        return `<blockquote class="elite-blog-blockquote"${attrs}>${cleanText}</blockquote>`;
      }
    );

    return formatted;
  }

  /**
   * Apply consistent spacing throughout the content
   */
  private static applyConsistentSpacing(content: string): string {
    let formatted = content;

    // Remove excessive whitespace
    formatted = formatted
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<');

    // Ensure proper spacing around block elements
    formatted = formatted
      .replace(/(<\/h[1-6]>)\s*(<p)/gi, '$1\n\n$2')
      .replace(/(<\/p>)\s*(<h[1-6])/gi, '$1\n\n$2')
      .replace(/(<\/ul>|<\/ol>)\s*(<p)/gi, '$1\n\n$2')
      .replace(/(<\/p>)\s*(<ul>|<ol>)/gi, '$1\n\n$2');

    return formatted;
  }

  /**
   * Final cleanup and validation
   */
  private static finalCleanup(content: string): string {
    let formatted = content;

    // Remove empty elements
    formatted = formatted
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      .replace(/<li[^>]*>\s*<\/li>/gi, '')
      .replace(/<div[^>]*>\s*<\/div>/gi, '');

    // Ensure proper document structure
    if (formatted && !formatted.includes('<p>') && !formatted.includes('<h')) {
      // Wrap plain text in paragraphs
      const lines = formatted.split('\n').filter(line => line.trim());
      formatted = lines.map(line => `<p class="elite-blog-paragraph">${line.trim()}</p>`).join('\n\n');
    }

    return formatted.trim();
  }

  /**
   * Calculate content quality score
   */
  private static calculateContentQuality(content: string): number {
    let score = 0;
    const factors = [];

    // HTML structure (30 points)
    if (content.includes('<h1>') || content.includes('<h2>')) {
      score += 15;
      factors.push('Has proper headings');
    }
    if (content.includes('<p>')) {
      score += 10;
      factors.push('Has paragraph structure');
    }
    if (!content.match(/<[^>]*>/g)?.some(tag => !tag.match(/^<\/?(h[1-6]|p|div|span|strong|em|a|ul|ol|li|blockquote|img|br)\b/))) {
      score += 5;
      factors.push('Uses semantic HTML');
    }

    // Content organization (25 points)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    if (wordCount > 300) {
      score += 10;
      factors.push('Sufficient content length');
    }
    if (content.includes('<ul>') || content.includes('<ol>')) {
      score += 8;
      factors.push('Has organized lists');
    }
    if (content.includes('<blockquote>')) {
      score += 7;
      factors.push('Has blockquotes');
    }

    // Links and media (20 points)
    const links = content.match(/<a[^>]*>/g) || [];
    if (links.length > 0) {
      score += 10;
      factors.push('Has links');
      if (links.some(link => link.includes('target="_blank"'))) {
        score += 5;
        factors.push('Proper link attributes');
      }
    }
    if (content.includes('<img')) {
      score += 5;
      factors.push('Has images');
    }

    // Typography and styling (15 points)
    if (content.includes('class=')) {
      score += 8;
      factors.push('Has CSS classes');
    }
    if (!content.includes('<script>') && !content.includes('javascript:')) {
      score += 7;
      factors.push('Security compliant');
    }

    // Formatting consistency (10 points)
    const inconsistencies = [
      content.includes('<h1>') && content.match(/<h1>/g)?.length! > 1,
      content.includes('<br><br>') || content.includes('<br/><br/>'),
      content.match(/\s{3,}/),
      content.match(/<p>\s*<\/p>/)
    ].filter(Boolean).length;

    score += Math.max(0, 10 - (inconsistencies * 2));
    if (inconsistencies === 0) {
      factors.push('Consistent formatting');
    }

    return Math.min(100, score);
  }

  /**
   * Get list of improvements applied
   */
  private static getAppliedImprovements(originalContent: string, standardizedContent: string): string[] {
    const improvements: string[] = [];

    if (originalContent !== standardizedContent) {
      improvements.push('Content formatting standardized');
    }

    // Check specific improvements
    if (!originalContent.includes('class="elite-blog-') && standardizedContent.includes('class="elite-blog-')) {
      improvements.push('Premium CSS classes applied');
    }

    if (originalContent.match(/<h[1-6]>/g)?.length !== standardizedContent.match(/<h[1-6]>/g)?.length) {
      improvements.push('Heading structure optimized');
    }

    if (!originalContent.includes('target="_blank"') && standardizedContent.includes('target="_blank"')) {
      improvements.push('External links standardized');
    }

    if (originalContent.match(/\s{3,}/) && !standardizedContent.match(/\s{3,}/)) {
      improvements.push('Spacing normalized');
    }

    if (originalContent.includes('<img') && standardizedContent.includes('elite-blog-image-wrapper')) {
      improvements.push('Images enhanced with premium styling');
    }

    if (originalContent.includes('<blockquote') && standardizedContent.includes('elite-blog-blockquote')) {
      improvements.push('Blockquotes enhanced');
    }

    if (improvements.length === 0) {
      improvements.push('Content validated and confirmed to standards');
    }

    return improvements;
  }

  /**
   * Bulk standardize multiple blog posts
   */
  static async bulkStandardizeBlogPosts(
    postIds?: string[],
    options: {
      applyToDatabase?: boolean;
      preserveOriginal?: boolean;
      batchSize?: number;
      skipHighQuality?: boolean;
    } = {}
  ): Promise<BulkStandardizationResult> {
    const { 
      applyToDatabase = true, 
      preserveOriginal = true, 
      batchSize = 10,
      skipHighQuality = true 
    } = options;

    try {
      let postsToProcess: BlogPost[] = [];

      if (postIds) {
        // Process specific posts
        const blogServiceInstance = new blogService();
        for (const postId of postIds) {
          const { data: post } = await blogServiceInstance.getBlogPost(postId);
          if (post) postsToProcess.push(post);
        }
      } else {
        // Process all published posts
        const blogServiceInstance = new blogService();
        const { data: posts } = await blogServiceInstance.getBlogPosts({ status: 'published' });
        postsToProcess = posts || [];
      }

      console.log(`📊 Starting bulk standardization for ${postsToProcess.length} blog posts`);

      const results: BulkStandardizationResult['results'] = [];
      let successful = 0;
      let failed = 0;

      // Process posts in batches
      for (let i = 0; i < postsToProcess.length; i += batchSize) {
        const batch = postsToProcess.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (post) => {
          try {
            // Skip high quality posts if requested
            if (skipHighQuality) {
              const quality = this.calculateContentQuality(post.content || '');
              if (quality >= 85) {
                return {
                  postId: post.id,
                  postTitle: post.title || 'Untitled',
                  result: {
                    success: true,
                    originalContent: post.content || '',
                    standardizedContent: post.content || '',
                    improvementsApplied: ['Skipped - already high quality'],
                    qualityScore: { before: quality, after: quality },
                    standards: this.PREMIUM_STANDARDS
                  }
                };
              }
            }

            const result = await this.standardizeBlogPost(post.id, {
              applyToDatabase,
              preserveOriginal,
              forceStandardization: !skipHighQuality
            });

            if (result.success) successful++;
            else failed++;

            return {
              postId: post.id,
              postTitle: post.title || 'Untitled',
              result
            };

          } catch (error) {
            failed++;
            return {
              postId: post.id,
              postTitle: post.title || 'Untitled',
              result: {
                success: false,
                originalContent: '',
                standardizedContent: '',
                improvementsApplied: [],
                qualityScore: { before: 0, after: 0 },
                standards: this.PREMIUM_STANDARDS
              },
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches
        if (i + batchSize < postsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        totalProcessed: postsToProcess.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      console.error('Bulk standardization error:', error);
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        results: []
      };
    }
  }

  /**
   * Get formatting standards currently being applied
   */
  static getFormattingStandards(): FormattingStandards {
    return { ...this.PREMIUM_STANDARDS };
  }

  /**
   * Preview standardization without applying to database
   */
  static async previewStandardization(content: string, title: string = ''): Promise<{
    preview: string;
    improvements: string[];
    qualityImprovement: { before: number; after: number };
  }> {
    const before = this.calculateContentQuality(content);
    const preview = await this.applyFormattingStandards(content, title);
    const after = this.calculateContentQuality(preview);
    const improvements = this.getAppliedImprovements(content, preview);

    return {
      preview,
      improvements,
      qualityImprovement: { before, after }
    };
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).BlogContentStandardizationService = BlogContentStandardizationService;
  console.log('📊 Blog Content Standardization Service available globally');
}
