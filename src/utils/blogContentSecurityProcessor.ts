/**
 * Enhanced Blog Content Security Processor
 * 
 * Provides comprehensive security mechanisms for blog posts to prevent:
 * - HTML injection attacks
 * - Special character exploits  
 * - Double title issues
 * - Malformed content structure
 * - XSS vulnerabilities
 */

export interface SecurityProcessingResult {
  content: string;
  wasProcessed: boolean;
  securityIssues: string[];
  fixes: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  originalContent: string;
}

export interface TitleAnalysis {
  pageTitle: string;
  contentTitles: string[];
  duplicates: string[];
  isDuplicated: boolean;
  cleanedContent: string;
}

export class BlogContentSecurityProcessor {
  
  // Dangerous HTML patterns that should be sanitized
  private static readonly DANGEROUS_PATTERNS = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /<object[^>]*>[\s\S]*?<\/object>/gi,
    /<embed[^>]*>[\s\S]*?<\/embed>/gi,
    /<form[^>]*>[\s\S]*?<\/form>/gi,
    /<input[^>]*>/gi,
    /<textarea[^>]*>[\s\S]*?<\/textarea>/gi,
    /<select[^>]*>[\s\S]*?<\/select>/gi,
    /<button[^>]*>[\s\S]*?<\/button>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
    /onerror\s*=/gi,
    /onmouseover\s*=/gi,
    /onfocus\s*=/gi,
    /onblur\s*=/gi,
    /onchange\s*=/gi,
    /onsubmit\s*=/gi
  ];

  // Special characters that can cause display issues
  private static readonly PROBLEMATIC_CHARS = [
    { pattern: /[\u0000-\u001F\u007F]/g, replacement: '', name: 'Control characters' },
    { pattern: /[\u200B-\u200D\uFEFF]/g, replacement: '', name: 'Zero-width characters' },
    { pattern: /[\u2028\u2029]/g, replacement: '\n', name: 'Line/paragraph separators' },
    { pattern: /\u00A0/g, replacement: ' ', name: 'Non-breaking spaces' },
    { pattern: /[""]/g, replacement: '"', name: 'Smart quotes' },
    { pattern: /['']/g, replacement: "'", name: 'Smart apostrophes' },
    { pattern: /[…]/g, replacement: '...', name: 'Ellipsis' },
    { pattern: /[–—]/g, replacement: '-', name: 'Em/en dashes' }
  ];

  // HTML entities that should be normalized
  private static readonly HTML_ENTITIES = [
    { pattern: /&lt;/g, replacement: '<' },
    { pattern: /&gt;/g, replacement: '>' },
    { pattern: /&amp;/g, replacement: '&' },
    { pattern: /&quot;/g, replacement: '"' },
    { pattern: /&#39;/g, replacement: "'" },
    { pattern: /&nbsp;/g, replacement: ' ' }
  ];

  /**
   * Main security processing method
   */
  static processContent(content: string, pageTitle?: string): SecurityProcessingResult {
    const originalContent = content || '';
    let processedContent = originalContent;
    const securityIssues: string[] = [];
    const fixes: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (!content || content.trim().length === 0) {
      return {
        content: '',
        wasProcessed: false,
        securityIssues: ['Empty content'],
        fixes: [],
        riskLevel: 'low',
        originalContent
      };
    }

    // Step 1: Detect and remove dangerous HTML patterns
    const htmlScanResult = this.scanForDangerousHTML(processedContent);
    if (htmlScanResult.hasDangerousContent) {
      processedContent = htmlScanResult.cleanedContent;
      securityIssues.push(...htmlScanResult.issues);
      fixes.push(...htmlScanResult.fixes);
      riskLevel = 'critical';
    }

    // Step 2: Normalize special characters
    const charResult = this.normalizeSpecialCharacters(processedContent);
    if (charResult.wasProcessed) {
      processedContent = charResult.content;
      fixes.push('Normalized special characters');
    }

    // Step 3: Fix HTML entities
    const entityResult = this.fixHTMLEntities(processedContent);
    if (entityResult.wasProcessed) {
      processedContent = entityResult.content;
      fixes.push('Fixed HTML entities');
    }

    // Step 4: Remove duplicate titles
    if (pageTitle) {
      const titleResult = this.removeDuplicateTitles(processedContent, pageTitle);
      if (titleResult.isDuplicated) {
        processedContent = titleResult.cleanedContent;
        securityIssues.push(...titleResult.duplicates.map(d => `Duplicate title found: ${d}`));
        fixes.push('Removed duplicate titles from content');
        if (riskLevel === 'low') riskLevel = 'medium';
      }
    }

    // Step 5: Sanitize and validate HTML structure
    const structureResult = this.validateHTMLStructure(processedContent);
    if (structureResult.hasIssues) {
      processedContent = structureResult.cleanedContent;
      securityIssues.push(...structureResult.issues);
      fixes.push(...structureResult.fixes);
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Step 6: Final security scan
    const finalScan = this.performFinalSecurityScan(processedContent);
    if (finalScan.hasRisks) {
      securityIssues.push(...finalScan.risks);
      if (finalScan.riskLevel === 'high' && riskLevel !== 'critical') {
        riskLevel = 'high';
      }
    }

    return {
      content: processedContent,
      wasProcessed: processedContent !== originalContent,
      securityIssues,
      fixes,
      riskLevel,
      originalContent
    };
  }

  /**
   * Scan for dangerous HTML patterns and remove them
   */
  private static scanForDangerousHTML(content: string): {
    hasDangerousContent: boolean;
    cleanedContent: string;
    issues: string[];
    fixes: string[];
  } {
    let cleanedContent = content;
    const issues: string[] = [];
    const fixes: string[] = [];
    let hasDangerousContent = false;

    for (const pattern of this.DANGEROUS_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        hasDangerousContent = true;
        issues.push(`Dangerous HTML pattern detected: ${pattern.toString()}`);
        cleanedContent = cleanedContent.replace(pattern, '');
        fixes.push(`Removed dangerous HTML: ${matches.length} occurrence(s)`);
      }
    }

    // Additional specific checks
    if (content.includes('javascript:')) {
      issues.push('JavaScript protocol detected in links');
      cleanedContent = cleanedContent.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
      fixes.push('Neutralized JavaScript links');
      hasDangerousContent = true;
    }

    if (content.includes('data:text/html')) {
      issues.push('Data URI with HTML detected');
      cleanedContent = cleanedContent.replace(/data:text\/html[^"'\s>]*/gi, '#');
      fixes.push('Removed HTML data URIs');
      hasDangerousContent = true;
    }

    return {
      hasDangerousContent,
      cleanedContent,
      issues,
      fixes
    };
  }

  /**
   * Normalize problematic special characters
   */
  private static normalizeSpecialCharacters(content: string): {
    content: string;
    wasProcessed: boolean;
  } {
    let processedContent = content;
    let wasProcessed = false;

    for (const { pattern, replacement } of this.PROBLEMATIC_CHARS) {
      if (pattern.test(processedContent)) {
        processedContent = processedContent.replace(pattern, replacement);
        wasProcessed = true;
      }
    }

    return {
      content: processedContent,
      wasProcessed
    };
  }

  /**
   * Fix HTML entities
   */
  private static fixHTMLEntities(content: string): {
    content: string;
    wasProcessed: boolean;
  } {
    let processedContent = content;
    let wasProcessed = false;

    for (const { pattern, replacement } of this.HTML_ENTITIES) {
      if (pattern.test(processedContent)) {
        processedContent = processedContent.replace(pattern, replacement);
        wasProcessed = true;
      }
    }

    return {
      content: processedContent,
      wasProcessed
    };
  }

  /**
   * Analyze and remove duplicate titles
   */
  private static removeDuplicateTitles(content: string, pageTitle: string): TitleAnalysis {
    const cleanPageTitle = this.cleanTitleForComparison(pageTitle);
    const contentTitles: string[] = [];
    const duplicates: string[] = [];

    // Extract potential titles from content
    const titlePatterns = [
      /<h1[^>]*>(.*?)<\/h1>/gi,
      /<h2[^>]*>(.*?)<\/h2>/gi,
      /^#{1,2}\s+(.+)$/gm,
      /^\*\*(.+?)\*\*$/gm,
      /^(.+?):?\s*$/gm
    ];

    for (const pattern of titlePatterns) {
      const matches = Array.from(content.matchAll(pattern));
      for (const match of matches) {
        const titleCandidate = this.cleanTitleForComparison(match[1] || match[0]);
        if (titleCandidate.length > 5) { // Only consider substantial titles
          contentTitles.push(titleCandidate);
        }
      }
    }

    // Find duplicates
    const isDuplicated = contentTitles.some(title => {
      const similarity = this.calculateTitleSimilarity(cleanPageTitle, title);
      if (similarity > 0.8) {
        duplicates.push(title);
        return true;
      }
      return false;
    });

    // Remove duplicates from content
    let cleanedContent = content;
    if (isDuplicated) {
      for (const duplicate of duplicates) {
        // Remove various forms of the duplicate title
        const patterns = [
          new RegExp(`<h1[^>]*>\\s*${this.escapeRegex(duplicate)}\\s*<\\/h1>`, 'gi'),
          new RegExp(`<h2[^>]*>\\s*${this.escapeRegex(duplicate)}\\s*<\\/h2>`, 'gi'),
          new RegExp(`^#{1,2}\\s+${this.escapeRegex(duplicate)}\\s*$`, 'gm'),
          new RegExp(`^\\*\\*${this.escapeRegex(duplicate)}\\*\\*\\s*$`, 'gm'),
          new RegExp(`^${this.escapeRegex(duplicate)}:?\\s*$`, 'gm')
        ];

        for (const pattern of patterns) {
          cleanedContent = cleanedContent.replace(pattern, '');
        }
      }

      // Clean up extra whitespace left by removals
      cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim();
    }

    return {
      pageTitle: cleanPageTitle,
      contentTitles,
      duplicates,
      isDuplicated,
      cleanedContent
    };
  }

  /**
   * Validate and fix HTML structure
   */
  private static validateHTMLStructure(content: string): {
    hasIssues: boolean;
    cleanedContent: string;
    issues: string[];
    fixes: string[];
  } {
    let cleanedContent = content;
    const issues: string[] = [];
    const fixes: string[] = [];
    let hasIssues = false;

    // Check for unclosed HTML tags
    const tagPairs = [
      { open: /<strong>/g, close: /<\/strong>/g, name: 'strong' },
      { open: /<em>/g, close: /<\/em>/g, name: 'em' },
      { open: /<p>/g, close: /<\/p>/g, name: 'p' },
      { open: /<div>/g, close: /<\/div>/g, name: 'div' },
      { open: /<span>/g, close: /<\/span>/g, name: 'span' }
    ];

    for (const { open, close, name } of tagPairs) {
      const openCount = (content.match(open) || []).length;
      const closeCount = (content.match(close) || []).length;

      if (openCount !== closeCount) {
        hasIssues = true;
        issues.push(`Mismatched ${name} tags: ${openCount} open, ${closeCount} close`);

        if (openCount > closeCount) {
          const diff = openCount - closeCount;
          cleanedContent += `</${name}>`.repeat(diff);
          fixes.push(`Added ${diff} closing ${name} tag(s)`);
        } else {
          const diff = closeCount - openCount;
          cleanedContent = `<${name}>`.repeat(diff) + cleanedContent;
          fixes.push(`Added ${diff} opening ${name} tag(s)`);
        }
      }
    }

    // Fix malformed attributes
    const malformedAttrPattern = /(\w+)=([^"'\s>]+)(?=\s|>)/g;
    if (malformedAttrPattern.test(content)) {
      hasIssues = true;
      issues.push('Malformed HTML attributes detected');
      cleanedContent = cleanedContent.replace(malformedAttrPattern, '$1="$2"');
      fixes.push('Fixed malformed HTML attributes');
    }

    // Remove empty tags
    const emptyTagPattern = /<(\w+)[^>]*>\s*<\/\1>/g;
    if (emptyTagPattern.test(content)) {
      cleanedContent = cleanedContent.replace(emptyTagPattern, '');
      fixes.push('Removed empty HTML tags');
    }

    return {
      hasIssues,
      cleanedContent,
      issues,
      fixes
    };
  }

  /**
   * Perform final security scan
   */
  private static performFinalSecurityScan(content: string): {
    hasRisks: boolean;
    risks: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const risks: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for potential XSS vectors
    const xssPatterns = [
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /srcdoc=/i,
      /<[^>]*on\w+\s*=/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(content)) {
        risks.push(`Potential XSS vector: ${pattern.toString()}`);
        riskLevel = 'high';
      }
    }

    // Check for suspicious URLs
    const suspiciousUrlPattern = /(https?:\/\/[^\s"'<>]+\.(?:tk|ml|ga|cf|bit\.ly|tinyurl|t\.co))/gi;
    const suspiciousUrls = content.match(suspiciousUrlPattern);
    if (suspiciousUrls) {
      risks.push(`Suspicious URLs detected: ${suspiciousUrls.length}`);
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check for excessive nesting
    const nestingDepth = this.calculateMaxNestingDepth(content);
    if (nestingDepth > 10) {
      risks.push(`Excessive HTML nesting detected: ${nestingDepth} levels`);
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    return {
      hasRisks: risks.length > 0,
      risks,
      riskLevel
    };
  }

  /**
   * Clean title for comparison
   */
  private static cleanTitleForComparison(title: string): string {
    return title
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toLowerCase()
      .trim();
  }

  /**
   * Calculate similarity between two titles
   */
  private static calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = title1.split(' ').filter(w => w.length > 2);
    const words2 = title2.split(' ').filter(w => w.length > 2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  /**
   * Calculate maximum HTML nesting depth
   */
  private static calculateMaxNestingDepth(content: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const isClosing = match[0].startsWith('</');
      
      if (isClosing) {
        currentDepth--;
      } else {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
    }

    return maxDepth;
  }

  /**
   * Escape regex special characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Create a secure content sanitizer for React dangerouslySetInnerHTML
   */
  static createSecureHTML(content: string, pageTitle?: string): {
    __html: string;
    securityInfo: SecurityProcessingResult;
  } {
    const securityResult = this.processContent(content, pageTitle);
    
    // Log security processing results
    if (securityResult.securityIssues.length > 0) {
      console.warn('🔒 Blog content security issues detected:', {
        riskLevel: securityResult.riskLevel,
        issues: securityResult.securityIssues,
        fixes: securityResult.fixes
      });
    }

    return {
      __html: securityResult.content,
      securityInfo: securityResult
    };
  }

  /**
   * Quick security check without processing
   */
  static quickSecurityCheck(content: string): {
    isSafe: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    issues: string[];
  } {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Quick scan for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        issues.push(`Dangerous pattern: ${pattern.toString()}`);
        riskLevel = 'critical';
      }
    }

    // Quick XSS check
    if (/javascript:|vbscript:|data:text\/html/i.test(content)) {
      issues.push('Potential XSS vector detected');
      if (riskLevel !== 'critical') riskLevel = 'high';
    }

    return {
      isSafe: issues.length === 0,
      riskLevel,
      issues
    };
  }
}

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).BlogContentSecurityProcessor = BlogContentSecurityProcessor;
  console.log('🔒 Blog Content Security Processor available globally');
}
