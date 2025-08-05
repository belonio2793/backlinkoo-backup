/**
 * Comprehensive excerpt cleaning utility
 * Removes titles, HTML/markdown formatting, and special characters from blog excerpts
 */

export class ExcerptCleaner {
  /**
   * Generate a clean excerpt from blog content, removing duplicate titles and formatting
   */
  static getCleanExcerpt(content: string, title?: string, maxLength: number = 150): string {
    if (!content) return '';

    let cleanText = content;

    // Remove HTML tags first
    cleanText = cleanText.replace(/<[^>]*>/g, '');

    // Remove the title from the beginning of content if it appears
    if (title) {
      const cleanTitle = this.cleanTitle(title);
      // Create multiple patterns to match title variations and partial matches
      const titlePatterns = [
        new RegExp(`^\\s*#\\s*${this.escapeRegex(cleanTitle)}\\s*`, 'i'),
        new RegExp(`^\\s*${this.escapeRegex(cleanTitle)}\\s*`, 'i'),
        new RegExp(`^\\s*\\*\\*H1\\*\\*:\\s*${this.escapeRegex(cleanTitle)}\\s*`, 'i'),
        new RegExp(`^\\s*\\*\\*Title\\*\\*:\\s*${this.escapeRegex(cleanTitle)}\\s*`, 'i'),
        new RegExp(`^\\s*Title:\\s*${this.escapeRegex(cleanTitle)}\\s*`, 'i'),
        // Catch partial title matches (first 20+ characters)
        new RegExp(`^\\s*${this.escapeRegex(cleanTitle.substring(0, Math.min(cleanTitle.length, 30)))}`, 'i'),
        // Catch title fragments at sentence start
        new RegExp(`^[^.!?]*?${this.escapeRegex(cleanTitle.split(' ').slice(0, 4).join(' '))}[^.!?]*?[.!?]\\s*`, 'i'),
      ];

      for (const pattern of titlePatterns) {
        cleanText = cleanText.replace(pattern, '');
      }
    }

    // Remove all markdown and formatting artifacts
    cleanText = this.removeMarkdownFormatting(cleanText);

    // Remove special characters and clean up
    cleanText = this.removeSpecialCharacters(cleanText);

    // Additional cleaning for fragments and repetitive content
    cleanText = this.removeContentFragments(cleanText, title);

    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    // Truncate to desired length
    if (cleanText.length > maxLength) {
      cleanText = cleanText.substring(0, maxLength).trim();
      // Try to end at a word boundary
      const lastSpaceIndex = cleanText.lastIndexOf(' ');
      if (lastSpaceIndex > maxLength * 0.8) {
        cleanText = cleanText.substring(0, lastSpaceIndex);
      }
      cleanText += '...';
    }

    return cleanText;
  }

  /**
   * Clean title from markdown artifacts
   */
  static cleanTitle(title: string): string {
    if (!title) return '';
    
    return title
      .replace(/^\s*\*\*Title:\s*([^*]*)\*\*\s*/i, '$1')
      .replace(/^\*\*H1\*\*:\s*/i, '')
      .replace(/^\*\*Title\*\*:\s*/i, '')
      .replace(/^Title:\s*/gi, '')
      .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
      .replace(/^\*\*(.+?)\*\*$/i, '$1')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^#{1,6}\s+/, '')
      .replace(/^Title:\s*/gi, '')
      .trim();
  }

  /**
   * Remove all markdown formatting
   */
  private static removeMarkdownFormatting(text: string): string {
    return text
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove **H1**: patterns
      .replace(/\*\*H1\*\*:\s*/gi, '')
      // Remove **Title**: patterns
      .replace(/\*\*Title\*\*:\s*/gi, '')
      // Remove **Introduction**, **Conclusion** etc patterns
      .replace(/\*\*([A-Za-z]+)\*\*:\s*/g, '')
      .replace(/\*\*([A-Za-z]+)\*\*\s/g, '')
      // Remove common section headers at start of content
      .replace(/^Introduction\s*:?\s*/gi, '')
      .replace(/^Overview\s*:?\s*/gi, '')
      .replace(/^Summary\s*:?\s*/gi, '')
      .replace(/^Abstract\s*:?\s*/gi, '')
      .replace(/^Preface\s*:?\s*/gi, '')
      // Remove remaining **text** bold formatting
      .replace(/\*\*([^*]+?)\*\*/g, '$1')
      // Remove *text* italic formatting
      .replace(/\*([^*]+?)\*/g, '$1')
      // Remove remaining asterisks
      .replace(/\*/g, '')
      // Remove markdown links [text](url)
      .replace(/\[([^\]]+?)\]\([^)]+?\)/g, '$1')
      // Remove code blocks ```
      .replace(/```[\s\S]*?```/g, '')
      .replace(/```[^`]*$/g, '')
      .replace(/^[^`]*```/g, '')
      // Remove inline code `text`
      .replace(/`([^`]+?)`/g, '$1')
      // Remove Title: patterns at line start
      .replace(/^Title:\s*[^\n]*/gmi, '')
      // Remove standalone Title: patterns
      .replace(/\bTitle:\s*/gi, '')
      // Remove HTML entities
      .replace(/&[a-zA-Z]+;/g, ' ')
      .replace(/&#?\w+;/g, ' ');
  }

  /**
   * Remove special characters and symbols
   */
  private static removeSpecialCharacters(text: string): string {
    return text
      // Remove triple hyphens and horizontal rules
      .replace(/---+/g, ' ')
      .replace(/___+/g, ' ')
      // Remove excessive punctuation
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      .replace(/[.]{3,}/g, '...')
      // Remove brackets and special symbols
      .replace(/[\[\]{}]/g, '')
      .replace(/[""'']/g, '"')
      .replace(/[–—]/g, '-')
      // Clean up spacing around punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([,.!?;:])\s+/g, '$1 ')
      // Remove multiple consecutive spaces
      .replace(/\s{2,}/g, ' ');
  }

  /**
   * Remove content fragments and repetitive patterns
   */
  private static removeContentFragments(text: string, title?: string): string {
    if (!text) return text;

    let cleanText = text;

    // Remove sentences that are just repetitions of title words
    if (title) {
      const titleWords = title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      titleWords.forEach(word => {
        // Remove sentences that start with title words followed by content
        const pattern = new RegExp(`^[^.!?]*?\\b${this.escapeRegex(word)}\\b[^.!?]*?[.!?]\\s*`, 'gi');
        cleanText = cleanText.replace(pattern, '');
      });
    }

    // Remove content that starts with common article patterns
    cleanText = cleanText
      .replace(/^(In this article|In this guide|This article|This guide|In this post)[^.!?]*?[.!?]\s*/gi, '')
      .replace(/^(Are you|Do you|Have you)[^.!?]*?[.!?]\s*/gi, '')
      .replace(/^(Welcome to|Introduction to)[^.!?]*?[.!?]\s*/gi, '');

    return cleanText;
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
