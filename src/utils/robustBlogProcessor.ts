/**
 * Robust Blog Content Processor
 * 
 * A reliable, simple approach to processing OpenAI-generated blog content
 * that eliminates common formatting issues without over-processing.
 * 
 * Key principles:
 * 1. Minimal processing - let OpenAI generate good HTML
 * 2. Fix only common, known issues
 * 3. Preserve content integrity
 * 4. No aggressive pattern matching that can break valid content
 */

interface ProcessingOptions {
  removeTitle?: boolean;
  targetUrl?: string;
  anchorText?: string;
  keyword?: string;
}

interface ProcessingResult {
  content: string;
  wasProcessed: boolean;
  issues: string[];
  warnings: string[];
}

export class RobustBlogProcessor {
  
  /**
   * Main entry point for processing blog content
   */
  static process(content: string, title?: string, options: ProcessingOptions = {}): ProcessingResult {
    if (!content || content.trim().length === 0) {
      return {
        content: '<div class="text-center py-8 text-gray-500"><p>No content available</p></div>',
        wasProcessed: false,
        issues: ['Empty content'],
        warnings: []
      };
    }

    let processedContent = content;
    const issues: string[] = [];
    const warnings: string[] = [];
    let wasProcessed = false;

    console.log('🔄 RobustBlogProcessor: Starting processing...', {
      contentLength: content.length,
      hasTitle: !!title,
      options
    });

    // Step 1: Basic cleanup (safe operations only)
    const cleanupResult = this.basicCleanup(processedContent, title, options);
    processedContent = cleanupResult.content;
    issues.push(...cleanupResult.issues);
    warnings.push(...cleanupResult.warnings);
    if (cleanupResult.wasProcessed) wasProcessed = true;

    // Step 2: Fix common HTML entity issues
    const entityResult = this.fixHtmlEntities(processedContent);
    processedContent = entityResult.content;
    issues.push(...entityResult.issues);
    if (entityResult.wasProcessed) wasProcessed = true;

    // Step 3: Fix known OpenAI formatting patterns
    const patternResult = this.fixKnownPatterns(processedContent);
    processedContent = patternResult.content;
    issues.push(...patternResult.issues);
    if (patternResult.wasProcessed) wasProcessed = true;

    // Step 4: Ensure proper paragraph structure
    const structureResult = this.ensureProperStructure(processedContent);
    processedContent = structureResult.content;
    issues.push(...structureResult.issues);
    if (structureResult.wasProcessed) wasProcessed = true;

    // Step 5: Final validation and safety check
    const validationResult = this.validateAndSanitize(processedContent);
    processedContent = validationResult.content;
    warnings.push(...validationResult.warnings);

    console.log('✅ RobustBlogProcessor: Processing complete', {
      wasProcessed,
      issuesFound: issues.length,
      warningsFound: warnings.length
    });

    return {
      content: processedContent,
      wasProcessed,
      issues,
      warnings
    };
  }

  /**
   * Step 1: Basic cleanup - remove obvious artifacts and duplicates
   */
  private static basicCleanup(content: string, title?: string, options: ProcessingOptions = {}) {
    let cleanContent = content;
    const issues: string[] = [];
    const warnings: string[] = [];
    let wasProcessed = false;

    // Remove markdown frontmatter if present
    if (cleanContent.includes('---')) {
      cleanContent = cleanContent.replace(/^---[\s\S]*?---\s*/m, '');
      if (cleanContent !== content) {
        issues.push('Removed markdown frontmatter');
        wasProcessed = true;
      }
    }

    // SAFE title removal - only remove if we're confident it's a duplicate
    if (title && options.removeTitle === true) {
      const cleanTitle = title.replace(/[*#]/g, '').trim();
      const originalLength = cleanContent.length;

      // Only remove title if it's clearly at the beginning and matches exactly
      const titlePatterns = [
        new RegExp(`^\\s*<h1[^>]*>\\s*${this.escapeRegex(cleanTitle)}\\s*</h1>\\s*\n?`, 'i'),
        new RegExp(`^\\s*#+\\s*${this.escapeRegex(cleanTitle)}\\s*\n`, 'i'),
        new RegExp(`^\\s*\\*\\*${this.escapeRegex(cleanTitle)}\\*\\*\\s*\n`, 'i')
      ];

      // Test each pattern and only remove if it matches at the very beginning
      for (const pattern of titlePatterns) {
        if (pattern.test(cleanContent)) {
          const newContent = cleanContent.replace(pattern, '');
          // Safety check: only apply if it doesn't remove too much content
          if (newContent.trim().length > originalLength * 0.8) {
            cleanContent = newContent;
            issues.push('Removed duplicate title');
            wasProcessed = true;
            break; // Only remove once
          }
        }
      }

      // Extra safety: if content became too short, restore it
      if (cleanContent.trim().length < 100 && originalLength > 500) {
        console.warn('Title removal removed too much content, restoring original');
        cleanContent = content;
        warnings.push('Title removal was too aggressive, kept original content');
      }
    }

    // Remove common OpenAI generation artifacts
    const artifacts = [
      /^\s*Title:\s*[^\n]*\n?/i,
      /^\s*\*\*Title:\s*[^\n]*\*\*\n?/i,
      /^\s*H[1-6]:\s*/gmi,
      /^\s*\*\*H[1-6]\*\*:\s*/gmi,
      /^\s*Call-to-Action:\s*/gmi,
      /^\s*\*\*Call-to-Action:\*\*\s*/gmi,
      /^\s*Strategic Backlink Placement:\s*/gmi,
      /---[\s\S]*?This content piece follows[\s\S]*?on the topic\.[\s\n]*/gi
    ];

    artifacts.forEach((pattern, index) => {
      const before = cleanContent;
      cleanContent = cleanContent.replace(pattern, '');
      if (cleanContent !== before) {
        issues.push(`Removed artifact pattern ${index + 1}`);
        wasProcessed = true;
      }
    });

    // Normalize line endings
    cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return {
      content: cleanContent.trim(),
      issues,
      warnings,
      wasProcessed
    };
  }

  /**
   * Step 2: Fix HTML entity encoding issues
   */
  private static fixHtmlEntities(content: string) {
    let fixedContent = content;
    const issues: string[] = [];
    let wasProcessed = false;

    // Common HTML entity fixes
    const entityFixes = [
      { from: /&amp;lt;/g, to: '<', name: '&amp;lt; entities' },
      { from: /&amp;gt;/g, to: '>', name: '&amp;gt; entities' },
      { from: /&amp;amp;/g, to: '&', name: '&amp;amp; entities' },
      { from: /&amp;quot;/g, to: '"', name: '&amp;quot; entities' },
      { from: /&lt;/g, to: '<', name: '&lt; entities' },
      { from: /&gt;/g, to: '>', name: '&gt; entities' },
      { from: /&quot;/g, to: '"', name: '&quot; entities' },
      { from: /&nbsp;/g, to: ' ', name: 'non-breaking spaces' },
      { from: /&#39;/g, to: "'", name: 'apostrophe entities' }
    ];

    entityFixes.forEach(fix => {
      if (fix.from.test(fixedContent)) {
        fixedContent = fixedContent.replace(fix.from, fix.to);
        issues.push(`Fixed ${fix.name}`);
        wasProcessed = true;
      }
    });

    return {
      content: fixedContent,
      issues,
      wasProcessed
    };
  }

  /**
   * Step 3: Fix known problematic patterns from OpenAI
   */
  private static fixKnownPatterns(content: string) {
    let fixedContent = content;
    const issues: string[] = [];
    let wasProcessed = false;

    // Fix broken bold patterns like **E**nhanced -> **Enhanced
    const boldPattern = /\*\*([A-Z])\*\*([a-z][^:*\n]*:)/g;
    if (boldPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(boldPattern, '**$1$2**');
      issues.push('Fixed broken bold patterns');
      wasProcessed = true;
    }

    // Fix broken headings with HTML entities
    const brokenHeadingPattern = /##\s*&lt;.*?&gt;\s*(Pro\s*Tip|.*?)/gi;
    if (brokenHeadingPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(brokenHeadingPattern, '## $1');
      issues.push('Fixed broken heading patterns');
      wasProcessed = true;
    }

    // Fix malformed HTML in headings
    const malformedHeadingPattern = /<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;\s*(.*?)\s*<\/p>/gi;
    if (malformedHeadingPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(malformedHeadingPattern, '<h2>$1</h2>');
      issues.push('Fixed malformed HTML headings');
      wasProcessed = true;
    }

    // Remove empty or malformed tags
    const emptyTags = [
      /<h[1-6][^>]*>\s*<\/h[1-6]>/gi,
      /<p[^>]*>\s*<\/p>/gi,
      /<strong>\s*<\/strong>/gi,
      /<em>\s*<\/em>/gi
    ];

    emptyTags.forEach((pattern, index) => {
      if (pattern.test(fixedContent)) {
        fixedContent = fixedContent.replace(pattern, '');
        issues.push(`Removed empty tags (pattern ${index + 1})`);
        wasProcessed = true;
      }
    });

    return {
      content: fixedContent,
      issues,
      wasProcessed
    };
  }

  /**
   * Step 4: Ensure proper paragraph and structure
   */
  private static ensureProperStructure(content: string) {
    let structuredContent = content;
    const issues: string[] = [];
    let wasProcessed = false;

    // If content doesn't have proper HTML structure, convert basic markdown
    if (!structuredContent.includes('<p>') && !structuredContent.includes('<h')) {
      // Convert markdown-style headers
      structuredContent = structuredContent
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>');

      // Convert paragraphs (split on double newlines)
      const paragraphs = structuredContent.split(/\n\s*\n/);
      structuredContent = paragraphs
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => {
          // Don't wrap already wrapped content
          if (p.startsWith('<') || p.includes('<h')) {
            return p;
          }
          return `<p>${p}</p>`;
        })
        .join('\n\n');

      issues.push('Added basic HTML structure');
      wasProcessed = true;
    }

    // Ensure proper spacing around headings
    structuredContent = structuredContent.replace(/<\/h[1-6]>\s*<p>/g, '</h1>\n\n<p>');
    structuredContent = structuredContent.replace(/<\/p>\s*<h[1-6]>/g, '</p>\n\n<h2>');

    return {
      content: structuredContent,
      issues,
      wasProcessed
    };
  }

  /**
   * Step 5: Final validation and sanitization
   */
  private static validateAndSanitize(content: string) {
    let safeContent = content;
    const warnings: string[] = [];

    // Remove potentially dangerous content (security)
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<style[^>]*>.*?<\/style>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(safeContent)) {
        safeContent = safeContent.replace(pattern, '');
        warnings.push(`Removed potentially dangerous content (pattern ${index + 1})`);
      }
    });

    // Validate basic HTML structure
    const hasContent = safeContent.trim().length > 0;
    const hasHeadings = /<h[1-6]/.test(safeContent);
    const hasParagraphs = /<p/.test(safeContent) || safeContent.includes('\n\n');

    if (!hasContent) {
      warnings.push('Content appears to be empty after processing');
    }
    if (!hasHeadings && !hasParagraphs) {
      warnings.push('Content may lack proper structure');
    }

    return {
      content: safeContent,
      warnings
    };
  }

  /**
   * Utility: Escape regex special characters
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Quick check if content needs processing
   */
  static needsProcessing(content: string): boolean {
    const indicators = [
      /&lt;|&gt;|&amp;/,
      /\*\*[A-Z]\*\*[a-z]/,
      /##\s*&lt;/,
      /^---/m,
      /^\s*Title:/m,
      /^\s*H[1-6]:/m
    ];

    return indicators.some(pattern => pattern.test(content));
  }

  /**
   * Process content only if needed (performance optimization)
   */
  static processIfNeeded(content: string, title?: string, options: ProcessingOptions = {}): ProcessingResult {
    // Critical safety check - never process empty content
    if (!content || content.trim().length === 0) {
      console.error('RobustBlogProcessor: Received empty content!');
      return {
        content: content || '',
        wasProcessed: false,
        issues: ['Empty content received'],
        warnings: ['Content was empty, no processing performed']
      };
    }

    if (!this.needsProcessing(content)) {
      return {
        content,
        wasProcessed: false,
        issues: [],
        warnings: []
      };
    }

    const result = this.process(content, title, options);

    // Final safety check - if processing made content empty, return original
    if (!result.content || result.content.trim().length === 0) {
      console.error('RobustBlogProcessor: Processing resulted in empty content, returning original');
      return {
        content,
        wasProcessed: false,
        issues: ['Processing resulted in empty content'],
        warnings: ['Returned original content to prevent data loss']
      };
    }

    return result;
  }
}
