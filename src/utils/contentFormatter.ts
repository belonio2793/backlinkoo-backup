/**
 * Content Formatter Utility
 * Ensures all blog content follows consistent HTML formatting and SEO best practices
 */

export interface ContentFormattingOptions {
  keyword: string;
  anchorText: string;
  targetUrl: string;
  enforceStructure?: boolean;
  maxH1Count?: number;
}

export interface FormattedContent {
  content: string;
  title: string;
  seoScore: number;
  wordCount: number;
  issues: string[];
  fixes: string[];
}

export class ContentFormatter {
  
  /**
   * Format and fix content to follow proper HTML structure
   */
  static formatContent(rawContent: string, options: ContentFormattingOptions): FormattedContent {
    let content = rawContent;
    const issues: string[] = [];
    const fixes: string[] = [];

    // 1. Fix multiple H1 tags (CRITICAL SEO ISSUE)
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    if (h1Count > 1) {
      issues.push(`Found ${h1Count} H1 tags (should be only 1)`);
      content = this.fixMultipleH1Tags(content);
      fixes.push('Converted extra H1 tags to H2 tags');
    } else if (h1Count === 0) {
      issues.push('Missing H1 tag');
      content = this.addH1Tag(content, options.keyword);
      fixes.push('Added proper H1 tag');
    }

    // 2. Ensure proper heading hierarchy
    content = this.fixHeadingHierarchy(content);

    // 3. Ensure proper paragraph structure
    content = this.fixParagraphStructure(content);

    // 4. Fix anchor text integration
    const { updatedContent, anchorCount } = this.ensureAnchorTextIntegration(content, options);
    content = updatedContent;
    
    if (anchorCount < 2) {
      issues.push(`Only ${anchorCount} anchor text instances found (recommended: 2-3)`);
      fixes.push('Added additional anchor text instances');
    }

    // 5. Add proper HTML structure elements
    content = this.addProperHTMLStructure(content);

    // 6. Extract title
    const title = this.extractTitle(content, options.keyword);

    // 7. Calculate metrics
    const wordCount = this.countWords(content);
    const seoScore = this.calculateSEOScore(content, options.keyword);

    // 8. Validate minimum content requirements
    if (wordCount < 800) {
      issues.push(`Content too short: ${wordCount} words (minimum: 800)`);
    }

    return {
      content,
      title,
      seoScore,
      wordCount,
      issues,
      fixes
    };
  }

  /**
   * Fix multiple H1 tags by converting extras to H2
   */
  private static fixMultipleH1Tags(content: string): string {
    const h1Matches = content.match(/<h1[^>]*>.*?<\/h1>/gi);
    if (!h1Matches || h1Matches.length <= 1) return content;

    // Keep the first H1, convert others to H2
    let firstH1Found = false;
    return content.replace(/<h1([^>]*)>(.*?)<\/h1>/gi, (match, attributes, text) => {
      if (!firstH1Found) {
        firstH1Found = true;
        return match; // Keep the first H1
      }
      return `<h2${attributes}>${text}</h2>`; // Convert others to H2
    });
  }

  /**
   * Add H1 tag if missing
   */
  private static addH1Tag(content: string, keyword: string): string {
    const title = `Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
    
    // If content starts with a heading, replace it with H1
    if (content.match(/^\s*<h[2-6]/i)) {
      return content.replace(/^(\s*)<h[2-6]([^>]*)>(.*?)<\/h[2-6]>/i, `$1<h1$2>${title}</h1>`);
    }
    
    // Otherwise, prepend H1
    return `<h1>${title}</h1>\n\n${content}`;
  }

  /**
   * Fix heading hierarchy (H1 > H2 > H3 > etc.)
   */
  private static fixHeadingHierarchy(content: string): string {
    // This is a complex operation, for now we'll ensure basic structure
    // Convert any H4+ to H3 to maintain simple hierarchy
    content = content.replace(/<h([4-6])([^>]*)>(.*?)<\/h[4-6]>/gi, '<h3$2>$3</h3>');
    
    return content;
  }

  /**
   * Fix paragraph structure
   */
  private static fixParagraphStructure(content: string): string {
    // Split content by double line breaks and wrap in paragraphs
    let lines = content.split(/\n\s*\n/);
    
    return lines.map(line => {
      line = line.trim();
      
      // Skip if already wrapped in a tag or is empty
      if (!line || 
          line.startsWith('<h') || 
          line.startsWith('<ul') || 
          line.startsWith('<ol') || 
          line.startsWith('<div') ||
          line.startsWith('<p>')) {
        return line;
      }
      
      // Wrap in paragraph tags
      return `<p>${line}</p>`;
    }).join('\n\n');
  }

  /**
   * Ensure anchor text is properly integrated
   */
  private static ensureAnchorTextIntegration(content: string, options: ContentFormattingOptions): { updatedContent: string; anchorCount: number } {
    const { anchorText, targetUrl } = options;
    const properLink = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
    
    // Count existing anchor text instances
    const existingCount = (content.match(new RegExp(anchorText, 'gi')) || []).length;
    
    if (existingCount >= 2) {
      // Replace any unlinked instances with proper links
      const linkRegex = new RegExp(`(?<!href=["'][^"']*?)\\b${anchorText}\\b(?![^<]*<\/a>)`, 'gi');
      const updatedContent = content.replace(linkRegex, properLink);
      return { updatedContent, anchorCount: existingCount };
    }

    // Add anchor text instances if not enough
    let updatedContent = content;
    
    // Add to introduction if present
    const introMatch = updatedContent.match(/(<h1[^>]*>.*?<\/h1>\s*<p[^>]*>)(.*?)(<\/p>)/i);
    if (introMatch && !introMatch[2].includes(anchorText)) {
      const enhancedIntro = `${introMatch[2]} Learn more about ${properLink} for advanced strategies.`;
      updatedContent = updatedContent.replace(introMatch[0], `${introMatch[1]}${enhancedIntro}${introMatch[3]}`);
    }

    // Add to conclusion or end of content
    if (!updatedContent.includes(anchorText) || updatedContent.split(anchorText).length - 1 < 2) {
      const conclusionText = `\n\n<p>For more detailed information and expert insights, explore our comprehensive resources on ${properLink} to enhance your understanding and implementation.</p>`;
      updatedContent += conclusionText;
    }

    const finalCount = (updatedContent.match(new RegExp(anchorText, 'gi')) || []).length;
    return { updatedContent, anchorCount: finalCount };
  }

  /**
   * Add proper HTML structure elements
   */
  private static addProperHTMLStructure(content: string): string {
    // Ensure emphasis tags are used
    if (!content.includes('<strong>')) {
      // Add strong tags to first few important phrases
      content = content.replace(/\b(important|key|essential|critical|vital|crucial)\s+([^<.!?]*[.!?])/gi, 
        '<strong>$1 $2</strong>');
    }

    // Ensure we have at least one list for better structure
    if (!content.includes('<ul>') && !content.includes('<ol>')) {
      // Try to convert simple bullet points or numbered items to proper lists
      content = content.replace(/(\n|^)([•\-\*]|\d+\.)\s+([^\n]+)/g, '\n<li>$3</li>');
      if (content.includes('<li>')) {
        content = content.replace(/(<li>.*<\/li>)/s, '<ul>\n$1\n</ul>');
      }
    }

    return content;
  }

  /**
   * Extract title from content
   */
  private static extractTitle(content: string, keyword: string): string {
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].replace(/<[^>]*>/g, '').trim();
    }
    return `Complete Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`;
  }

  /**
   * Count words in content
   */
  private static countWords(content: string): number {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }

  /**
   * Calculate comprehensive SEO score
   */
  private static calculateSEOScore(content: string, keyword: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // 1. Single H1 tag (20 points)
    const h1Count = (content.match(/<h1[^>]*>/g) || []).length;
    if (h1Count === 1) score += 20;
    else if (h1Count > 1) score -= 15; // Heavy penalty for multiple H1s

    // 2. Proper heading hierarchy (15 points)
    const h2Count = (content.match(/<h2[^>]*>/g) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/g) || []).length;
    if (h2Count >= 2 && h3Count >= 1) score += 15;
    else if (h2Count >= 1) score += 10;

    // 3. Keyword optimization (20 points)
    const keywordCount = (lowerContent.match(new RegExp(lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (keywordCount >= 3 && keywordCount <= 8) score += 20;
    else if (keywordCount >= 2) score += 15;
    else if (keywordCount >= 1) score += 10;

    // Check keyword in H1
    const h1Text = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Text && h1Text[1].toLowerCase().includes(lowerKeyword)) score += 5;

    // 4. Content length (15 points)
    const wordCount = this.countWords(content);
    if (wordCount >= 1200) score += 15;
    else if (wordCount >= 1000) score += 12;
    else if (wordCount >= 800) score += 8;
    else if (wordCount >= 600) score += 5;

    // 5. HTML structure (10 points)
    if (content.includes('<p>') && content.includes('</p>')) score += 3;
    if (content.includes('<strong>')) score += 3;
    if (content.includes('<ul>') || content.includes('<ol>')) score += 2;
    if (content.includes('<em>')) score += 2;

    // 6. Link optimization (10 points)
    const linkCount = (content.match(/<a [^>]*href=/g) || []).length;
    if (linkCount >= 2) score += 10;
    else if (linkCount >= 1) score += 6;

    // Check for proper link attributes
    if (content.includes('target="_blank"') && content.includes('rel="noopener')) score += 3;

    // 7. Text emphasis and readability (5 points)
    const strongCount = (content.match(/<strong>/g) || []).length;
    const paragraphCount = (content.match(/<p>/g) || []).length;
    
    if (strongCount >= 3 && paragraphCount >= 5) score += 5;
    else if (strongCount >= 2 && paragraphCount >= 3) score += 3;

    // 8. Content organization (5 points)
    if (h2Count >= 3 && (content.includes('<ul>') || content.includes('<ol>'))) score += 5;
    else if (h2Count >= 2) score += 3;

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Generate consistent content template
   */
  static generateContentTemplate(options: ContentFormattingOptions): string {
    const { keyword, anchorText, targetUrl } = options;
    
    return `<h1>The Complete Guide to ${keyword}</h1>

<p><strong>${keyword}</strong> has become increasingly important in today's digital landscape. This comprehensive guide will help you understand everything you need to know about ${keyword.toLowerCase()}, including best practices, implementation strategies, and expert insights.</p>

<p>Whether you're just getting started or looking to improve your existing approach, this guide covers essential concepts and actionable strategies. You'll discover how <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> can enhance your overall strategy and drive better results.</p>

<h2>Understanding ${keyword}</h2>

<p><strong>The fundamentals</strong> of ${keyword.toLowerCase()} are essential for success in today's competitive environment. Let's explore the key components and core principles that make this approach effective.</p>

<h3>Key Components</h3>

<ul>
<li><strong>Strategic Planning:</strong> Developing clear objectives and measurable goals</li>
<li><strong>Implementation:</strong> Executing your plan with precision and consistency</li>
<li><strong>Optimization:</strong> Continuously improving and refining your approach</li>
<li><strong>Measurement:</strong> Tracking progress and analyzing results</li>
</ul>

<h2>Benefits and Advantages</h2>

<p>Organizations that successfully implement ${keyword.toLowerCase()} strategies typically experience significant improvements across multiple areas. <em>The most successful approaches</em> combine strategic thinking with practical execution.</p>

<h3>Primary Benefits</h3>

<ol>
<li><strong>Increased Efficiency:</strong> Streamlined processes and better resource allocation</li>
<li><strong>Better Results:</strong> Improved outcomes and measurable success</li>
<li><strong>Competitive Advantage:</strong> Staying ahead in your industry</li>
<li><strong>Long-term Growth:</strong> Sustainable strategies for continued success</li>
</ol>

<h2>Implementation Best Practices</h2>

<p>Successfully implementing ${keyword.toLowerCase()} requires careful planning and execution. Many organizations find it beneficial to work with <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> to ensure they follow proven methodologies and avoid common pitfalls.</p>

<h3>Getting Started</h3>

<p><strong>Begin with assessment:</strong> Evaluate your current situation and identify areas for improvement. This foundation will guide your strategy and help you prioritize efforts for maximum impact.</p>

<h3>Common Challenges</h3>

<p>While implementing ${keyword.toLowerCase()}, organizations often face several challenges:</p>

<ul>
<li>Resource allocation and budget constraints</li>
<li>Change management and stakeholder buy-in</li>
<li>Technical implementation complexities</li>
<li>Measuring and tracking progress effectively</li>
</ul>

<h2>Future Trends and Considerations</h2>

<p>The landscape of ${keyword.toLowerCase()} continues to evolve rapidly. <strong>Staying current</strong> with trends and emerging best practices is crucial for long-term success.</p>

<p>Organizations that invest in understanding and implementing comprehensive ${keyword.toLowerCase()} strategies position themselves for sustainable growth and competitive advantage.</p>

<h2>Conclusion</h2>

<p>${keyword} represents a powerful approach to achieving your objectives and driving meaningful results. <strong>Success requires commitment</strong>, proper planning, and continuous improvement.</p>

<p>Start your ${keyword.toLowerCase()} journey today by implementing the strategies outlined in this guide. For additional resources and expert guidance, explore <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> to enhance your understanding and accelerate your success.</p>`;
  }
}

export default ContentFormatter;
