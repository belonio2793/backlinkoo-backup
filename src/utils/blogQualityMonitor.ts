/**
 * Blog Content Quality Monitor
 * 
 * Monitors and validates blog content quality to prevent the issues
 * that caused empty/broken blog posts. This runs automatically and
 * provides alerts when content quality degrades.
 */

interface QualityMetrics {
  contentLength: number;
  hasHeadings: boolean;
  hasBacklinks: boolean;
  hasProperStructure: boolean;
  hasMalformedPatterns: boolean;
  qualityScore: number;
  issues: string[];
  warnings: string[];
}

interface QualityThresholds {
  minContentLength: number;
  minQualityScore: number;
  requiredElements: string[];
}

export class BlogQualityMonitor {
  
  private static readonly DEFAULT_THRESHOLDS: QualityThresholds = {
    minContentLength: 1000,
    minQualityScore: 75,
    requiredElements: ['h1', 'h2', 'p', 'backlink']
  };

  /**
   * Analyze content quality and return detailed metrics
   */
  static analyzeContent(content: string, targetUrl?: string): QualityMetrics {
    const issues: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    // Basic content checks
    const contentLength = content?.length || 0;
    const hasHeadings = /(<h[1-6][^>]*>|^#{1,6}\s)/i.test(content || '');
    const hasBacklinks = targetUrl ? content?.includes(targetUrl) || false : true;
    const hasProperStructure = this.checkStructure(content || '');
    const hasMalformedPatterns = this.checkMalformedPatterns(content || '');

    // Quality scoring
    if (contentLength === 0) {
      issues.push('Content is completely empty');
      qualityScore = 0;
    } else if (contentLength < 500) {
      issues.push('Content is too short (< 500 characters)');
      qualityScore -= 40;
    } else if (contentLength < 1000) {
      warnings.push('Content is shorter than recommended (< 1000 characters)');
      qualityScore -= 10;
    }

    if (!hasHeadings) {
      issues.push('Content lacks proper heading structure');
      qualityScore -= 20;
    }

    if (!hasBacklinks && targetUrl) {
      issues.push('Content missing required backlink');
      qualityScore -= 15;
    }

    if (!hasProperStructure) {
      warnings.push('Content structure could be improved');
      qualityScore -= 10;
    }

    if (hasMalformedPatterns) {
      issues.push('Content contains malformed patterns');
      qualityScore -= 25;
    }

    // Content quality checks
    const paragraphCount = (content?.match(/<p[^>]*>/g) || []).length;
    if (paragraphCount < 3) {
      warnings.push('Content has very few paragraphs');
      qualityScore -= 5;
    }

    const wordCount = this.estimateWordCount(content || '');
    if (wordCount < 300) {
      issues.push('Content has too few words (< 300)');
      qualityScore -= 15;
    }

    qualityScore = Math.max(0, Math.min(100, qualityScore));

    return {
      contentLength,
      hasHeadings,
      hasBacklinks,
      hasProperStructure,
      hasMalformedPatterns,
      qualityScore,
      issues,
      warnings
    };
  }

  /**
   * Check if content meets minimum quality standards
   */
  static meetsQualityStandards(content: string, targetUrl?: string, thresholds = this.DEFAULT_THRESHOLDS): boolean {
    const metrics = this.analyzeContent(content, targetUrl);
    
    return (
      metrics.contentLength >= thresholds.minContentLength &&
      metrics.qualityScore >= thresholds.minQualityScore &&
      metrics.issues.length === 0
    );
  }

  /**
   * Generate a quality report for content
   */
  static generateQualityReport(content: string, targetUrl?: string): string {
    const metrics = this.analyzeContent(content, targetUrl);
    
    let report = `📊 Blog Content Quality Report\n`;
    report += `${'='.repeat(35)}\n\n`;
    
    report += `📏 Content Length: ${metrics.contentLength} characters\n`;
    report += `📝 Word Count: ~${this.estimateWordCount(content)} words\n`;
    report += `🏆 Quality Score: ${metrics.qualityScore}/100\n\n`;
    
    report += `✅ Structure Checks:\n`;
    report += `  • Headings: ${metrics.hasHeadings ? '✅' : '❌'}\n`;
    report += `  • Backlinks: ${metrics.hasBacklinks ? '✅' : '❌'}\n`;
    report += `  • Proper Structure: ${metrics.hasProperStructure ? '✅' : '❌'}\n`;
    report += `  • No Malformed Patterns: ${!metrics.hasMalformedPatterns ? '✅' : '❌'}\n\n`;
    
    if (metrics.issues.length > 0) {
      report += `🚨 Issues Found:\n`;
      metrics.issues.forEach(issue => report += `  • ${issue}\n`);
      report += '\n';
    }
    
    if (metrics.warnings.length > 0) {
      report += `⚠️ Warnings:\n`;
      metrics.warnings.forEach(warning => report += `  • ${warning}\n`);
      report += '\n';
    }
    
    report += `🎯 Overall Status: ${metrics.qualityScore >= 80 ? 'EXCELLENT' : 
                                    metrics.qualityScore >= 60 ? 'GOOD' : 
                                    metrics.qualityScore >= 40 ? 'NEEDS IMPROVEMENT' : 'POOR'}\n`;
    
    return report;
  }

  /**
   * Monitor blog generation in real-time
   */
  static monitorGeneration(blogPost: any): { passed: boolean; report: string; recommendations: string[] } {
    const content = blogPost.content || '';
    const targetUrl = blogPost.target_url || blogPost.targetUrl;
    
    const metrics = this.analyzeContent(content, targetUrl);
    const passed = this.meetsQualityStandards(content, targetUrl);
    const report = this.generateQualityReport(content, targetUrl);
    
    const recommendations: string[] = [];
    
    if (metrics.contentLength < 1000) {
      recommendations.push('Increase content length to at least 1000 characters');
    }
    
    if (!metrics.hasHeadings) {
      recommendations.push('Add proper heading structure (H1, H2, H3)');
    }
    
    if (!metrics.hasBacklinks && targetUrl) {
      recommendations.push('Include the required backlink to target URL');
    }
    
    if (metrics.hasMalformedPatterns) {
      recommendations.push('Fix malformed HTML patterns and formatting issues');
    }
    
    if (metrics.qualityScore < 60) {
      recommendations.push('Consider regenerating content with better AI prompts');
    }

    return { passed, report, recommendations };
  }

  /**
   * Check for proper content structure
   */
  private static checkStructure(content: string): boolean {
    const hasTitle = /(<h1[^>]*>|^#\s)/i.test(content);
    const hasSubheadings = /(<h[2-6][^>]*>|^#{2,6}\s)/i.test(content);
    const hasParagraphs = /<p[^>]*>/i.test(content) || content.split('\n\n').length > 2;
    
    return hasTitle && hasSubheadings && hasParagraphs;
  }

  /**
   * Check for malformed patterns that caused previous issues
   */
  private static checkMalformedPatterns(content: string): boolean {
    const malformedPatterns = [
      /##\s*&lt;[^&]*&gt;/,           // Malformed headings like "## &lt; h2&gt;"
      /\*\*[A-Z]\*\*[a-z]/,           // Broken bold patterns like "**E**nhanced"
      /&lt;\s*h[1-6]\s*&gt;/,         // HTML entity headings
      /href="[^"]*<\/strong>/,         // Broken href attributes
      /hrefhttps\s*=""\s*:\s*=""/      // Malformed link attributes
    ];
    
    return malformedPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Estimate word count from content
   */
  private static estimateWordCount(content: string): number {
    // Remove HTML tags and count words
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return textContent ? textContent.split(' ').length : 0;
  }

  /**
   * Log quality metrics for monitoring
   */
  static logQualityMetrics(blogPost: any): void {
    const metrics = this.analyzeContent(blogPost.content, blogPost.target_url);
    
    console.log('📊 Blog Quality Metrics:', {
      id: blogPost.id,
      slug: blogPost.slug,
      qualityScore: metrics.qualityScore,
      contentLength: metrics.contentLength,
      issues: metrics.issues.length,
      warnings: metrics.warnings.length,
      timestamp: new Date().toISOString()
    });
    
    if (metrics.issues.length > 0) {
      console.warn('🚨 Quality Issues Detected:', metrics.issues);
    }
    
    if (metrics.warnings.length > 0) {
      console.warn('⚠️ Quality Warnings:', metrics.warnings);
    }
  }
}
