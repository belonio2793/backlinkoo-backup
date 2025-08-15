/**
 * Enhanced Blog Cleaner - Specifically designed to fix blog post formatting issues
 * Addresses user complaints about duplicate titles and "Call to Action:" text
 */

export class EnhancedBlogCleaner {
  
  /**
   * Clean blog post content by removing duplicate titles and problematic text
   */
  static cleanContent(content: string, title?: string): string {
    if (!content) return '';

    let cleaned = content;

    // Step 1: Remove title if it appears at the beginning of content
    if (title) {
      cleaned = this.removeDuplicateTitle(cleaned, title);
    }

    // Step 2: Remove "Call to Action:" and variants aggressively
    cleaned = this.removeCallToActionText(cleaned);

    // Step 3: Remove other problematic section headers
    cleaned = this.removeSectionHeaders(cleaned);

    // Step 4: Clean up formatting artifacts
    cleaned = this.cleanFormattingArtifacts(cleaned);

    return cleaned.trim();
  }

  /**
   * Remove duplicate title from the beginning of content
   */
  static removeDuplicateTitle(content: string, title: string): string {
    if (!content || !title) return content;

    const cleanTitle = (text: string) => text
      .replace(/^#+\s*/, '') // Remove markdown headers
      .replace(/^H[1-6]:\s*/i, '') // Remove H1:, H2:, etc.
      .replace(/^Title:\s*/i, '') // Remove Title:
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.+?)\*/g, '$1') // Remove italic markdown
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();

    const cleanedTitle = cleanTitle(title);
    const lines = content.split('\n');
    
    // Check first 3 lines for title matches
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const lineText = cleanTitle(lines[i]);
      
      if (lineText && (
        lineText === cleanedTitle ||
        cleanedTitle.includes(lineText) ||
        lineText.includes(cleanedTitle) ||
        this.isSimilarTitle(lineText, cleanedTitle)
      )) {
        // Remove this line and return the rest
        return lines.slice(i + 1).join('\n').trim();
      }
    }

    return content;
  }

  /**
   * Check if two titles are similar enough to be considered duplicates
   */
  static isSimilarTitle(title1: string, title2: string): boolean {
    if (!title1 || !title2) return false;
    
    // Remove common words and check similarity
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    const normalize = (text: string) => text
      .split(' ')
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .join(' ');
    
    const norm1 = normalize(title1);
    const norm2 = normalize(title2);
    
    if (norm1.length === 0 || norm2.length === 0) return false;
    
    // Check if one contains the other (after normalization)
    return norm1.includes(norm2) || norm2.includes(norm1);
  }

  /**
   * Remove "Call to Action:" text and variants
   */
  static removeCallToActionText(content: string): string {
    return content
      // Remove bold call to action headers
      .replace(/\*\*Call[\s-]*to[\s-]*Action:?\*\*/gi, '')
      .replace(/\*\*CTA:?\*\*/gi, '')
      
      // Remove plain call to action headers at line start
      .replace(/^Call[\s-]*to[\s-]*Action:?\s*/gim, '')
      .replace(/^CTA:?\s*/gim, '')
      
      // Remove call to action headers anywhere in content
      .replace(/Call[\s-]*to[\s-]*Action:?\s*/gi, '')
      .replace(/CTA:?\s*/gi, '')
      
      // Remove specific patterns that might appear
      .replace(/\*\*Call to Action\*\*:?\s*/gi, '')
      .replace(/\*\*Call-to-Action\*\*:?\s*/gi, '')
      .replace(/Call to Action:?\s*/gi, '')
      .replace(/Call-to-Action:?\s*/gi, '');
  }

  /**
   * Remove other problematic section headers
   */
  static removeSectionHeaders(content: string): string {
    return content
      // Remove bold section headers
      .replace(/\*\*(Introduction|Conclusion|Summary|Overview|Abstract|Hook Introduction):?\*\*/gi, '')
      .replace(/\*\*Section \d+[^*]*:?\*\*/gi, '')
      
      // Remove plain section headers at line start
      .replace(/^(Introduction|Conclusion|Summary|Overview|Abstract|Hook Introduction):?\s*/gim, '')
      .replace(/^Section \d+[^:]*:?\s*/gim, '')
      
      // Remove HTML-style section markers
      .replace(/^H[1-6]:?\s*/gim, '')
      .replace(/^Title:?\s*/gim, '')
      .replace(/^Header:?\s*/gim, '');
  }

  /**
   * Clean up formatting artifacts
   */
  static cleanFormattingArtifacts(content: string): string {
    return content
      // Remove excessive markdown symbols
      .replace(/\*{3,}/g, '')
      .replace(/_{3,}/g, '')
      .replace(/-{3,}/g, '')
      .replace(/={3,}/g, '')
      
      // Remove empty lines with just symbols
      .replace(/^[\s*_=-]+$/gm, '')
      
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+$/gm, '') // Remove lines with only whitespace
      
      // Remove trailing whitespace from lines
      .replace(/[ \t]+$/gm, '');
  }

  /**
   * Clean title text by removing formatting artifacts
   */
  static cleanTitle(title: string): string {
    if (!title) return '';
    
    return title
      // Remove common prefixes
      .replace(/^(Title|Header|Heading|H[1-6]):\s*/i, '')
      .replace(/^(Blog|Post|Article):\s*/i, '')
      
      // Remove markdown formatting
      .replace(/^#+\s*/, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
}
