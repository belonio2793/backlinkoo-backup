/**
 * Blog Security Middleware
 * 
 * Provides a consistent interface for all blog components to ensure
 * content is properly secured and processed before rendering.
 */

import { BlogContentSecurityProcessor } from './blogContentSecurityProcessor';
import { BlogAutoAdjustmentService } from '@/services/blogAutoAdjustmentService';
import { BlogQualityMonitor } from './blogQualityMonitor';

export interface SecureBlogContent {
  secureHtml: string;
  originalContent: string;
  securityReport: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    issues: string[];
    fixes: string[];
    wasProcessed: boolean;
  };
  qualityReport: {
    score: number;
    issues: string[];
    hasMalformedPatterns: boolean;
  };
  processingLog: {
    securityProcessed: boolean;
    qualityProcessed: boolean;
    originalLength: number;
    finalLength: number;
    processingTime: number;
  };
}

export interface BlogSecurityConfig {
  enableTitleDuplicateRemoval?: boolean;
  enableQualityProcessing?: boolean;
  logProcessing?: boolean;
  fallbackOnError?: boolean;
  minQualityThreshold?: number;
}

export class BlogSecurityMiddleware {
  private static readonly DEFAULT_CONFIG: BlogSecurityConfig = {
    enableTitleDuplicateRemoval: true,
    enableQualityProcessing: true,
    logProcessing: true,
    fallbackOnError: true,
    minQualityThreshold: 70
  };

  /**
   * Main method to securely process blog content for rendering
   */
  static processForRender(
    content: string, 
    pageTitle?: string, 
    config: BlogSecurityConfig = {}
  ): SecureBlogContent {
    const startTime = performance.now();
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      // Step 1: Security processing (always enabled)
      const securityResult = BlogContentSecurityProcessor.processContent(
        content, 
        finalConfig.enableTitleDuplicateRemoval ? pageTitle : undefined
      );

      // Step 2: Quality assessment
      const qualityMetrics = BlogQualityMonitor.analyzeContent(
        securityResult.content, 
        undefined // target URL not needed for security processing
      );

      // Step 3: Quality processing if needed
      let finalContent = securityResult.content;
      let qualityProcessed = false;

      if (finalConfig.enableQualityProcessing && 
          (qualityMetrics.qualityScore < finalConfig.minQualityThreshold! || 
           qualityMetrics.hasMalformedPatterns)) {
        finalContent = BlogAutoAdjustmentService.adjustContentForDisplay(finalContent);
        qualityProcessed = true;
      }

      const processingTime = performance.now() - startTime;

      // Step 4: Create result object
      const result: SecureBlogContent = {
        secureHtml: finalContent,
        originalContent: content,
        securityReport: {
          riskLevel: securityResult.riskLevel,
          issues: securityResult.securityIssues,
          fixes: securityResult.fixes,
          wasProcessed: securityResult.wasProcessed
        },
        qualityReport: {
          score: qualityMetrics.qualityScore,
          issues: qualityMetrics.issues,
          hasMalformedPatterns: qualityMetrics.hasMalformedPatterns
        },
        processingLog: {
          securityProcessed: securityResult.wasProcessed,
          qualityProcessed,
          originalLength: content.length,
          finalLength: finalContent.length,
          processingTime
        }
      };

      // Step 5: Logging
      if (finalConfig.logProcessing) {
        this.logProcessingResults(result);
      }

      return result;

    } catch (error) {
      console.error('🚨 Blog security processing failed:', error);
      
      if (finalConfig.fallbackOnError) {
        return this.createFallbackResult(content, error as Error, performance.now() - startTime);
      } else {
        throw error;
      }
    }
  }

  /**
   * Quick security check without full processing
   */
  static quickSecurityCheck(content: string): {
    isSafe: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    issues: string[];
    recommendation: string;
  } {
    const check = BlogContentSecurityProcessor.quickSecurityCheck(content);
    
    let recommendation = 'Content appears safe';
    if (check.riskLevel === 'critical') {
      recommendation = 'CRITICAL: Content must be processed before display';
    } else if (check.riskLevel === 'high') {
      recommendation = 'HIGH RISK: Content should be processed before display';
    } else if (check.riskLevel === 'medium') {
      recommendation = 'MEDIUM RISK: Content processing recommended';
    }

    return {
      isSafe: check.isSafe,
      riskLevel: check.riskLevel,
      issues: check.issues,
      recommendation
    };
  }

  /**
   * Create secure HTML for React dangerouslySetInnerHTML
   */
  static createSecureHtml(
    content: string, 
    pageTitle?: string, 
    config: BlogSecurityConfig = {}
  ): { __html: string } {
    const processed = this.processForRender(content, pageTitle, config);
    
    // Final safety check
    if (!processed.secureHtml || processed.secureHtml.trim().length === 0) {
      console.error('🚨 Content became empty after security processing!');
      return {
        __html: '<div style="padding: 20px; color: #ef4444; border: 1px solid #fca5a5; background: #fef2f2; border-radius: 4px;">Content could not be safely processed for display.</div>'
      };
    }

    return { __html: processed.secureHtml };
  }

  /**
   * Validate blog content before saving to database
   */
  static validateForStorage(content: string, title?: string): {
    isValid: boolean;
    sanitizedContent: string;
    warnings: string[];
    errors: string[];
  } {
    const securityResult = BlogContentSecurityProcessor.processContent(content, title);
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for critical security issues
    if (securityResult.riskLevel === 'critical') {
      errors.push('Content contains critical security vulnerabilities');
    } else if (securityResult.riskLevel === 'high') {
      warnings.push('Content contains high-risk security issues');
    }

    // Check content quality
    const qualityMetrics = BlogQualityMonitor.analyzeContent(securityResult.content);
    if (qualityMetrics.qualityScore < 40) {
      warnings.push('Content quality is very low');
    }

    if (qualityMetrics.hasMalformedPatterns) {
      warnings.push('Content contains malformed patterns');
    }

    return {
      isValid: errors.length === 0,
      sanitizedContent: securityResult.content,
      warnings,
      errors
    };
  }

  /**
   * Bulk process multiple blog posts
   */
  static async bulkProcess(
    posts: Array<{ content: string; title?: string; id?: string }>,
    config: BlogSecurityConfig = {}
  ): Promise<Array<{ id?: string; result: SecureBlogContent; error?: Error }>> {
    const results = [];
    
    for (const post of posts) {
      try {
        const result = this.processForRender(post.content, post.title, config);
        results.push({ id: post.id, result });
      } catch (error) {
        results.push({ 
          id: post.id, 
          result: this.createFallbackResult(post.content, error as Error), 
          error: error as Error 
        });
      }
    }

    return results;
  }

  /**
   * Log processing results
   */
  private static logProcessingResults(result: SecureBlogContent): void {
    const { securityReport, qualityReport, processingLog } = result;

    if (securityReport.issues.length > 0) {
      console.warn('🔒 Blog content security processing:', {
        riskLevel: securityReport.riskLevel,
        issues: securityReport.issues,
        fixes: securityReport.fixes,
        processingTime: processingLog.processingTime.toFixed(2) + 'ms'
      });
    }

    if (qualityReport.issues.length > 0) {
      console.info('📊 Blog content quality report:', {
        score: qualityReport.score,
        issues: qualityReport.issues,
        hasMalformedPatterns: qualityReport.hasMalformedPatterns
      });
    }

    if (processingLog.securityProcessed || processingLog.qualityProcessed) {
      console.log('✅ Blog content processing complete:', {
        securityProcessed: processingLog.securityProcessed,
        qualityProcessed: processingLog.qualityProcessed,
        lengthChange: `${processingLog.originalLength} → ${processingLog.finalLength}`,
        processingTime: processingLog.processingTime.toFixed(2) + 'ms'
      });
    }
  }

  /**
   * Create fallback result when processing fails
   */
  private static createFallbackResult(
    content: string, 
    error: Error, 
    processingTime = 0
  ): SecureBlogContent {
    return {
      secureHtml: `<div style="padding: 20px; color: #dc2626; border: 1px solid #fca5a5; background: #fef2f2; border-radius: 4px;">
        <h3 style="margin-bottom: 8px;">Content Processing Error</h3>
        <p style="margin-bottom: 8px;">This content could not be safely processed: ${error.message}</p>
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; font-weight: 600;">Raw Content</summary>
          <pre style="margin-top: 8px; white-space: pre-wrap; font-size: 12px; background: white; padding: 8px; border-radius: 4px;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </details>
      </div>`,
      originalContent: content,
      securityReport: {
        riskLevel: 'critical',
        issues: [`Processing failed: ${error.message}`],
        fixes: [],
        wasProcessed: false
      },
      qualityReport: {
        score: 0,
        issues: ['Content processing failed'],
        hasMalformedPatterns: true
      },
      processingLog: {
        securityProcessed: false,
        qualityProcessed: false,
        originalLength: content.length,
        finalLength: 0,
        processingTime
      }
    };
  }
}

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).BlogSecurityMiddleware = BlogSecurityMiddleware;
  console.log('🔒 Blog Security Middleware available globally for debugging');
}
