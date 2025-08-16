/**
 * Robust Content Processor - Fixes malformed HTML and detects content issues
 * Addresses the systematic formatting problems in blog posts
 */

export class RobustContentProcessor {
  
  /**
   * Detect if content is malformed and needs repair
   */
  static detectMalformedContent(content: string): {
    isMalformed: boolean;
    issues: string[];
    severity: 'low' | 'medium' | 'high';
  } {
    const issues: string[] = [];
    
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
    
    if (content.match(/<\/strong>\s*<strong>/g)) {
      issues.push('Adjacent strong tags that should be merged');
    }
    
    if (content.match(/href="[^"]*<\/strong>/g)) {
      issues.push('HTML tags inside href attributes');
    }
    
    if (content.match(/^[A-Z][^.!?]*:\s*$/m)) {
      issues.push('Orphaned section headers');
    }
    
    if (!content.includes('<h1>') && !content.includes('<h2>')) {
      issues.push('Missing proper heading structure');
    }
    
    if (content.split('<strong>').length > 15) {
      issues.push('Excessive bold formatting');
    }
    
    if (content.includes('Navigating the Product Hunt Ecosystem:') && 
        content.indexOf('Navigating the Product Hunt Ecosystem:') !== 
        content.lastIndexOf('Navigating the Product Hunt Ecosystem:')) {
      issues.push('Duplicate section headers');
    }
    
    const severity = issues.length > 3 ? 'high' : issues.length > 1 ? 'medium' : 'low';
    
    return {
      isMalformed: issues.length > 0,
      issues,
      severity
    };
  }
  
  /**
   * Sanitize and repair malformed HTML content
   */
  static sanitizeAndRepair(content: string): string {
    if (!content) return '';
    
    console.log('🔧 RobustContentProcessor: Sanitizing content...');
    
    let repaired = content;
    
    // Step 1: Fix broken URLs in strong tags
    repaired = repaired.replace(/href="([^"]*)<\/strong>\s*([^"]*)">/g, 'href="$1$2">');
    repaired = repaired.replace(/href="([^"]*)<strong>([^"]*)">/g, 'href="$1$2">');
    
    // Step 2: Remove nested and adjacent strong tags
    repaired = repaired.replace(/<strong><strong>/g, '<strong>');
    repaired = repaired.replace(/<\/strong><\/strong>/g, '</strong>');
    repaired = repaired.replace(/<\/strong>\s*<strong>/g, ' ');
    
    // Step 3: Fix malformed list structures
    repaired = repaired.replace(/<strong>(\d+\.)\s*([^<]*?):\s*<\/strong>/g, '<li><strong>$2:</strong>');
    
    // Step 4: Remove duplicate section headers
    const sections = ['Navigating the Product Hunt Ecosystem:', 'Crafting the Perfect Launch Strategy:', 'Optimizing Your Product Page:', 'Engaging with the Community:'];
    sections.forEach(section => {
      const regex = new RegExp(`${this.escapeRegex(section)}.*?${this.escapeRegex(section)}`, 'g');
      repaired = repaired.replace(regex, section);
    });
    
    // Step 5: Fix broken HTML structure
    repaired = this.fixHTMLStructure(repaired);
    
    // Step 6: Ensure proper heading hierarchy
    repaired = this.fixHeadingHierarchy(repaired);
    
    // Step 7: Clean up formatting artifacts
    repaired = this.cleanupFormattingArtifacts(repaired);
    
    console.log('✅ Content sanitization complete');
    return repaired.trim();
  }
  
  /**
   * Fix HTML structure issues
   */
  private static fixHTMLStructure(content: string): string {
    let fixed = content;
    
    // Fix unclosed tags
    const openStrongTags = (fixed.match(/<strong>/g) || []).length;
    const closeStrongTags = (fixed.match(/<\/strong>/g) || []).length;
    
    if (openStrongTags > closeStrongTags) {
      const diff = openStrongTags - closeStrongTags;
      fixed += '</strong>'.repeat(diff);
    } else if (closeStrongTags > openStrongTags) {
      const diff = closeStrongTags - openStrongTags;
      fixed = '<strong>'.repeat(diff) + fixed;
    }
    
    // Fix malformed links
    fixed = fixed.replace(/href="([^"]*)\s+([^"]*)">/g, 'href="$1$2">');
    fixed = fixed.replace(/href="https:\s*\/\/([^"]*)">/g, 'href="https://$1">');
    
    return fixed;
  }
  
  /**
   * Fix heading hierarchy and structure
   */
  private static fixHeadingHierarchy(content: string): string {
    let fixed = content;
    
    // Ensure we have proper heading structure
    if (!fixed.includes('<h1>')) {
      // Convert first strong tag that looks like a title to h1
      fixed = fixed.replace(/^<strong>([^<]*?):<\/strong>/, '<h1>$1</h1>');
    }
    
    // Convert section headers to proper h2 tags
    const sectionHeaders = [
      'Navigating the Product Hunt Ecosystem',
      'Crafting the Perfect Launch Strategy',
      'Optimizing Your Product Page',
      'Engaging with the Community',
      'The Power of Product Hunt Launches'
    ];
    
    sectionHeaders.forEach(header => {
      const regex = new RegExp(`<strong>${this.escapeRegex(header)}:?</strong>`, 'gi');
      fixed = fixed.replace(regex, `<h2>${header}</h2>`);
    });
    
    // Convert numbered items to proper h3 or list items
    fixed = fixed.replace(/<strong>(\d+\.\s*[^:]*?):\s*<\/strong>/g, '<h3>$1</h3>');
    
    return fixed;
  }
  
  /**
   * Clean up formatting artifacts and inconsistencies
   */
  private static cleanupFormattingArtifacts(content: string): string {
    let cleaned = content;
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s{3,}/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Fix spacing around HTML tags
    cleaned = cleaned.replace(/>\s+</g, '><');
    cleaned = cleaned.replace(/\s+>/g, '>');
    cleaned = cleaned.replace(/<\s+/g, '<');
    
    // Ensure proper paragraph breaks
    cleaned = cleaned.replace(/\n\n+/g, '</p><p>');
    
    // Wrap content without tags in paragraphs
    if (!cleaned.startsWith('<')) {
      cleaned = '<p>' + cleaned;
    }
    if (!cleaned.endsWith('>')) {
      cleaned = cleaned + '</p>';
    }
    
    return cleaned;
  }
  
  /**
   * Generate well-formatted replacement content if repair fails
   */
  static generateReplacementContent(originalRequest: any): string {
    const { primaryKeyword, targetUrl, anchorText } = originalRequest;
    
    return `
<h1>${primaryKeyword}: Complete Guide</h1>

<p>Welcome to the comprehensive guide on ${primaryKeyword}. This resource provides expert insights and practical strategies to help you succeed.</p>

<h2>Understanding ${primaryKeyword}</h2>

<p>${primaryKeyword} represents a crucial element in today's digital landscape. By implementing proven strategies and best practices, you can achieve remarkable results.</p>

<h3>Key Benefits</h3>

<ul>
<li><strong>Enhanced Performance:</strong> Improved outcomes through strategic implementation</li>
<li><strong>Competitive Advantage:</strong> Stay ahead with cutting-edge approaches</li>
<li><strong>Sustainable Growth:</strong> Build lasting success with proven methodologies</li>
<li><strong>Measurable Results:</strong> Track progress with clear metrics and KPIs</li>
</ul>

<h2>Implementation Strategies</h2>

<p>Success with ${primaryKeyword} requires careful planning and execution. Professional tools and expert guidance, such as those available through <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText || primaryKeyword}</a>, can significantly accelerate your progress.</p>

<h3>Best Practices</h3>

<ul>
<li>Start with clear objectives and measurable goals</li>
<li>Implement changes systematically and monitor results</li>
<li>Leverage professional tools and expert resources</li>
<li>Continuously optimize based on performance data</li>
</ul>

<h2>Measuring Success</h2>

<p>Track your ${primaryKeyword} performance using key metrics that align with your business objectives. Regular monitoring enables timely adjustments and continuous improvement.</p>

<h2>Getting Started</h2>

<p>Ready to implement ${primaryKeyword} strategies? Begin with a comprehensive assessment of your current situation and develop a strategic roadmap for success.</p>

<p>For expert guidance and proven solutions, explore the comprehensive resources available at <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText || primaryKeyword}</a>.</p>
`;
  }
  
  /**
   * Auto-detect and attempt repair of malformed content
   */
  static autoDetectAndRepair(content: string, originalRequest?: any): {
    success: boolean;
    content: string;
    wasRepaired: boolean;
    issues: string[];
  } {
    const detection = this.detectMalformedContent(content);
    
    if (!detection.isMalformed) {
      return {
        success: true,
        content,
        wasRepaired: false,
        issues: []
      };
    }
    
    console.log('🚨 Malformed content detected:', detection.issues);
    
    if (detection.severity === 'high') {
      console.log('⚠️ Severe malformation detected, generating replacement content');
      return {
        success: true,
        content: originalRequest ? this.generateReplacementContent(originalRequest) : content,
        wasRepaired: true,
        issues: detection.issues
      };
    }
    
    // Attempt repair
    const repairedContent = this.sanitizeAndRepair(content);
    const recheck = this.detectMalformedContent(repairedContent);
    
    if (recheck.isMalformed && recheck.severity === 'high') {
      console.log('🔄 Repair failed, using replacement content');
      return {
        success: true,
        content: originalRequest ? this.generateReplacementContent(originalRequest) : content,
        wasRepaired: true,
        issues: detection.issues
      };
    }
    
    return {
      success: true,
      content: repairedContent,
      wasRepaired: true,
      issues: detection.issues
    };
  }
  
  /**
   * Escape regex special characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).RobustContentProcessor = RobustContentProcessor;
  console.log('🛠️ Robust content processor available: window.RobustContentProcessor');
}
