/**
 * Website Validation Service
 * Validates websites for accessibility, WordPress presence, and comment forms
 */

export interface ValidationResult {
  url: string;
  isAccessible: boolean;
  statusCode?: number;
  isWordPress: boolean;
  hasCommentForm: boolean;
  responseTime: number;
  wordPressIndicators: string[];
  errors: string[];
  lastChecked: Date;
}

export interface BulkValidationResult {
  total: number;
  accessible: number;
  wordpress: number;
  commentForms: number;
  removed404s: number;
  results: ValidationResult[];
}

class WebsiteValidationService {
  
  private readonly TIMEOUT_MS = 10000; // 10 second timeout
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  
  // WordPress detection patterns
  private readonly WP_INDICATORS = {
    meta_tags: [
      'name="generator" content="WordPress',
      'content="WordPress',
      'wp-content/themes/',
      'wp-content/plugins/',
      'wp-includes/'
    ],
    paths: [
      '/wp-content/',
      '/wp-admin/',
      '/wp-login.php',
      '/wp-includes/',
      '/xmlrpc.php'
    ],
    strings: [
      'wp-content',
      'wp-admin', 
      'wordpress',
      '/wp-',
      'powered by wordpress'
    ]
  };

  // Comment form indicators
  private readonly COMMENT_INDICATORS = [
    'wp-comments-post.php',
    'comment-form',
    'commentform',
    'leave a comment',
    'leave a reply',
    'post a comment',
    'your email address will not be published',
    'awaiting moderation',
    'name="comment"',
    'id="comment"'
  ];

  /**
   * Validate a single website
   */
  async validateWebsite(url: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Validating: ${url}`);
      
      // Ensure URL has protocol
      const fullUrl = this.normalizeUrl(url);
      
      // Check accessibility and get content
      const response = await this.fetchWithTimeout(fullUrl);
      const responseTime = Date.now() - startTime;
      
      const result: ValidationResult = {
        url: fullUrl,
        isAccessible: response.ok,
        statusCode: response.status,
        isWordPress: false,
        hasCommentForm: false,
        responseTime,
        wordPressIndicators: [],
        errors: [],
        lastChecked: new Date()
      };

      if (!response.ok) {
        result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
        console.log(`❌ ${url} - ${response.status} ${response.statusText}`);
        return result;
      }

      // Get page content for analysis
      const content = await response.text();
      
      // Check for WordPress indicators
      const wpIndicators = this.detectWordPress(content, fullUrl);
      result.isWordPress = wpIndicators.length > 0;
      result.wordPressIndicators = wpIndicators;
      
      // Check for comment forms
      result.hasCommentForm = this.detectCommentForm(content);
      
      console.log(`✅ ${url} - WordPress: ${result.isWordPress}, Comments: ${result.hasCommentForm}`);
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.log(`💥 ${url} - Error: ${error.message}`);
      
      return {
        url: this.normalizeUrl(url),
        isAccessible: false,
        isWordPress: false,
        hasCommentForm: false,
        responseTime,
        wordPressIndicators: [],
        errors: [error.message],
        lastChecked: new Date()
      };
    }
  }

  /**
   * Validate multiple websites in parallel with rate limiting
   */
  async validateWebsites(urls: string[], maxConcurrent: number = 5): Promise<BulkValidationResult> {
    console.log(`🚀 Starting bulk validation of ${urls.length} websites...`);
    
    const results: ValidationResult[] = [];
    let accessible = 0;
    let wordpress = 0;
    let commentForms = 0;
    let removed404s = 0;

    // Process URLs in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      
      console.log(`Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(urls.length / maxConcurrent)}`);
      
      // Validate batch in parallel
      const batchPromises = batch.map(url => this.validateWebsite(url));
      const batchResults = await Promise.all(batchPromises);
      
      // Process results
      for (const result of batchResults) {
        results.push(result);
        
        if (result.isAccessible) {
          accessible++;
        } else {
          removed404s++;
        }
        
        if (result.isWordPress) {
          wordpress++;
        }
        
        if (result.hasCommentForm) {
          commentForms++;
        }
      }
      
      // Rate limiting between batches
      if (i + maxConcurrent < urls.length) {
        await this.delay(1000); // 1 second between batches
      }
    }
    
    console.log(`✅ Validation complete: ${accessible}/${urls.length} accessible, ${removed404s} 404s removed`);
    
    return {
      total: urls.length,
      accessible,
      wordpress,
      commentForms,
      removed404s,
      results
    };
  }

  /**
   * Filter out invalid websites and return only accessible WordPress sites
   */
  filterValidWebsites(results: ValidationResult[], requireCommentForm: boolean = true): ValidationResult[] {
    return results.filter(result => {
      // Must be accessible
      if (!result.isAccessible) return false;
      
      // Must be WordPress
      if (!result.isWordPress) return false;
      
      // Optionally require comment form
      if (requireCommentForm && !result.hasCommentForm) return false;
      
      return true;
    });
  }

  /**
   * Check if URL is accessible (quick check)
   */
  async quickAccessibilityCheck(url: string): Promise<{ accessible: boolean; statusCode?: number; error?: string }> {
    try {
      const fullUrl = this.normalizeUrl(url);
      
      // Just HEAD request for quick check
      const response = await fetch(fullUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': this.USER_AGENT
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout for quick check
      });
      
      return {
        accessible: response.ok,
        statusCode: response.status
      };
      
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Detect WordPress indicators in page content
   */
  private detectWordPress(content: string, url: string): string[] {
    const indicators: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check meta tags and HTML content
    for (const indicator of this.WP_INDICATORS.meta_tags) {
      if (lowerContent.includes(indicator.toLowerCase())) {
        indicators.push(`meta: ${indicator}`);
      }
    }
    
    // Check for WordPress paths
    for (const path of this.WP_INDICATORS.paths) {
      if (lowerContent.includes(path)) {
        indicators.push(`path: ${path}`);
      }
    }
    
    // Check for WordPress strings
    for (const str of this.WP_INDICATORS.strings) {
      if (lowerContent.includes(str)) {
        indicators.push(`string: ${str}`);
      }
    }
    
    // Check URL structure
    if (url.includes('wp-content') || url.includes('wp-admin')) {
      indicators.push('url: WordPress path detected');
    }
    
    return indicators;
  }

  /**
   * Detect comment form in page content
   */
  private detectCommentForm(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    for (const indicator of this.COMMENT_INDICATORS) {
      if (lowerContent.includes(indicator)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Normalize URL to include protocol
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Fetch with timeout and proper headers
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(results: ValidationResult[]): {
    total: number;
    accessible: number;
    wordpress: number;
    commentForms: number;
    avgResponseTime: number;
    errorTypes: Record<string, number>;
  } {
    const stats = {
      total: results.length,
      accessible: 0,
      wordpress: 0,
      commentForms: 0,
      avgResponseTime: 0,
      errorTypes: {} as Record<string, number>
    };
    
    let totalResponseTime = 0;
    
    for (const result of results) {
      if (result.isAccessible) stats.accessible++;
      if (result.isWordPress) stats.wordpress++;
      if (result.hasCommentForm) stats.commentForms++;
      
      totalResponseTime += result.responseTime;
      
      // Count error types
      for (const error of result.errors) {
        const errorType = error.split(':')[0]; // Get error type (HTTP 404, etc.)
        stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
      }
    }
    
    stats.avgResponseTime = stats.total > 0 ? Math.round(totalResponseTime / stats.total) : 0;
    
    return stats;
  }

  /**
   * Check if website is likely a real blog vs placeholder/parked domain
   */
  async checkWebsiteQuality(url: string): Promise<{
    isRealWebsite: boolean;
    qualityScore: number;
    indicators: string[];
  }> {
    try {
      const validation = await this.validateWebsite(url);
      
      if (!validation.isAccessible) {
        return {
          isRealWebsite: false,
          qualityScore: 0,
          indicators: ['Site not accessible']
        };
      }
      
      // Get page content for quality analysis
      const response = await this.fetchWithTimeout(url);
      const content = await response.text();
      
      const indicators: string[] = [];
      let qualityScore = 0;
      
      // Check for real content indicators
      if (content.length > 5000) {
        qualityScore += 20;
        indicators.push('Substantial content');
      }
      
      if (validation.isWordPress) {
        qualityScore += 30;
        indicators.push('WordPress detected');
      }
      
      if (validation.hasCommentForm) {
        qualityScore += 25;
        indicators.push('Comment form found');
      }
      
      // Check for blog-like content
      const blogIndicators = [
        'article', 'post', 'blog', 'entry', 'archive',
        'category', 'tag', 'author', 'date'
      ];
      
      const foundBlogIndicators = blogIndicators.filter(indicator => 
        content.toLowerCase().includes(indicator)
      );
      
      if (foundBlogIndicators.length >= 3) {
        qualityScore += 15;
        indicators.push('Blog structure detected');
      }
      
      // Check for navigation and real structure
      const structureIndicators = ['nav', 'menu', 'header', 'footer', 'sidebar'];
      const foundStructure = structureIndicators.filter(indicator => 
        content.toLowerCase().includes(indicator)
      );
      
      if (foundStructure.length >= 3) {
        qualityScore += 10;
        indicators.push('Proper site structure');
      }
      
      // Penalty for placeholder indicators
      const placeholderIndicators = [
        'under construction', 'coming soon', 'parked domain',
        'this domain is for sale', 'default web page'
      ];
      
      for (const placeholder of placeholderIndicators) {
        if (content.toLowerCase().includes(placeholder)) {
          qualityScore -= 50;
          indicators.push(`Placeholder detected: ${placeholder}`);
        }
      }
      
      return {
        isRealWebsite: qualityScore >= 50,
        qualityScore: Math.max(0, Math.min(100, qualityScore)),
        indicators
      };
      
    } catch (error) {
      return {
        isRealWebsite: false,
        qualityScore: 0,
        indicators: [`Error: ${error.message}`]
      };
    }
  }

  /**
   * Utility: Add delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const websiteValidationService = new WebsiteValidationService();
export default websiteValidationService;
