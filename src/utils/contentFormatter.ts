/**
 * Content formatting utilities for blog posts
 * Ensures proper paragraph, headline, and spacing structure
 */

export class ContentFormatter {
  /**
   * Format blog content with proper paragraph and headline structure
   */
  static formatBlogContent(content: string, title?: string): string {
    if (!content) return '';

    // Split content into lines and clean up
    let formattedContent = content
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace but preserve paragraph breaks
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Process the content in correct order
    formattedContent = this.convertMarkdownToHtml(formattedContent);
    formattedContent = this.removeDuplicateTitle(formattedContent, title);
    formattedContent = this.processHeadings(formattedContent);
    formattedContent = this.processParagraphs(formattedContent);
    formattedContent = this.processLists(formattedContent);
    formattedContent = this.processBlockquotes(formattedContent);
    formattedContent = this.fixSpacing(formattedContent);

    return formattedContent;
  }

  /**
   * Remove duplicate title from content if it appears at the beginning
   */
  private static removeDuplicateTitle(content: string, title?: string): string {
    if (!title) return content;

    // Clean the title for comparison - handle multiple formats and remove all * symbols
    const cleanTitle = title
      .replace(/^\*\*H1\*\*:\s*/i, '')
      .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
      .replace(/^\*\*(.+?)\*\*$/i, '$1') // Handle **title** format
      .replace(/^Title:\s*/i, '') // Remove "Title:" prefix
      .replace(/\*\*/g, '') // Remove all ** symbols
      .replace(/\*/g, '') // Remove all * symbols
      .replace(/^#{1,6}\s+/, '')
      .trim();

    // Remove "Title: " prefix patterns at the beginning
    content = content.replace(/^[\s\n]*Title:\s*/i, '');

    // Remove H1 tags that contain the same title at the beginning of content
    const titlePattern = new RegExp(`^\\s*<h1[^>]*>\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/h1>\\s*`, 'i');
    content = content.replace(titlePattern, '');

    // Remove H1 with "Title:" prefix pattern: <h1>Title: actual title</h1>
    const titlePrefixPattern = new RegExp(`^\\s*<h1[^>]*>\\s*Title:\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/h1>\\s*`, 'i');
    content = content.replace(titlePrefixPattern, '');

    // Remove H1 with strong tags pattern: <h1><strong>title</strong></h1>
    const strongTitlePattern = new RegExp(`^\\s*<h1[^>]*>\\s*<strong[^>]*>\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/strong>\\s*<\\/h1>\\s*`, 'i');
    content = content.replace(strongTitlePattern, '');

    // Remove H1 with strong tags and Title prefix: <h1><strong>Title: title</strong></h1>
    const strongTitlePrefixPattern = new RegExp(`^\\s*<h1[^>]*>\\s*<strong[^>]*>\\s*Title:\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/strong>\\s*<\\/h1>\\s*`, 'i');
    content = content.replace(strongTitlePrefixPattern, '');

    // Also remove markdown H1 that matches the title
    const markdownTitlePattern = new RegExp(`^\\s*#\\s+${this.escapeRegex(cleanTitle)}\\s*\\n`, 'i');
    content = content.replace(markdownTitlePattern, '');

    // Remove markdown H1 with Title prefix
    const markdownTitlePrefixPattern = new RegExp(`^\\s*#\\s+Title:\\s*${this.escapeRegex(cleanTitle)}\\s*\\n`, 'i');
    content = content.replace(markdownTitlePrefixPattern, '');

    // Remove **H1**: title pattern at the beginning
    const boldTitlePattern = new RegExp(`^\\s*\\*\\*H1\\*\\*:\\s*${this.escapeRegex(cleanTitle)}\\s*\\n?`, 'i');
    content = content.replace(boldTitlePattern, '');

    // Remove **title** pattern at the beginning (for cases like **The Unforgettable Legacy...**)
    const starTitlePattern = new RegExp(`^\\s*\\*\\*${this.escapeRegex(cleanTitle)}\\*\\*\\s*\\n?`, 'i');
    content = content.replace(starTitlePattern, '');

    // Remove **Title: title** pattern at the beginning
    const starTitlePrefixPattern = new RegExp(`^\\s*\\*\\*Title:\\s*${this.escapeRegex(cleanTitle)}\\*\\*\\s*\\n?`, 'i');
    content = content.replace(starTitlePrefixPattern, '');

    // Remove any remaining "Title:" patterns at the beginning of content
    content = content.replace(/^[\s\n]*Title:\s*[^\n]*\n?/i, '');

    return content.trim();
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Convert markdown syntax to HTML
   */
  private static convertMarkdownToHtml(content: string): string {
    return content
      // Convert markdown links [text](url) to <a> tags
      .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Convert **H1**: patterns to <h1> tags
      .replace(/\*\*H1\*\*:\s*(.+?)(?=\n|$)/gi, '<h1>$1</h1>')
      // Convert **text**: patterns at start of line to <h2> tags (common heading pattern)
      .replace(/^\*\*([^*]+?)\*\*:\s*(.+?)(?=\n|$)/gmi, '<h2>$1: $2</h2>')
      // Convert **text** patterns at start of line to <h2> tags (standalone bold headings)
      .replace(/^\*\*([^*]+?)\*\*(?=\s*\n|$)/gmi, '<h2>$1</h2>')
      // Convert remaining **text** to <strong> tags (inline bold)
      .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
      // Convert *text* to <em> tags (italic)
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      // Convert ### headings to h3
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // Convert ## headings to h2
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      // Convert # headings to h1
      .replace(/^# (.+)$/gm, '<h1>$1</h1>');
  }

  /**
   * Process and format headings with proper structure
   */
  private static processHeadings(content: string): string {
    return content
      // Normalize H3 to H2 for consistent styling (except main title H1)
      .replace(/<h3([^>]*)>(.*?)<\/h3>/gi, '<h2$1>$2</h2>')
      // Ensure HTML headings have proper spacing before and after
      .replace(/\n*(<h[1-6][^>]*>.*?<\/h[1-6]>)\n*/gi, '\n\n$1\n\n')
      // Ensure any remaining markdown headings have proper spacing
      .replace(/\n*(#{1,6})\s*(.+?)\n*/g, '\n\n$1 $2\n\n')
      // Fix heading hierarchy - normalize H3+ to H2
      .replace(/\n#{3,6}/g, '\n##')
      // Ensure remaining markdown heading text is properly capitalized
      .replace(/(#{1,6})\s*(.+)/g, (match, hashes, text) => {
        const cleanText = text.trim();
        return `${hashes} ${this.capitalizeHeading(cleanText)}`;
      });
  }

  /**
   * Process paragraphs with proper spacing
   */
  private static processParagraphs(content: string): string {
    return content
      // Split into paragraphs and process each
      .split(/\n\s*\n/)
      .map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';

        // Skip HTML headings, lists, and blockquotes
        if (paragraph.match(/^<h[1-6]|^<\/h[1-6]|^#{1,6}\s|^[\*\-\+]\s|^>\s|^\d+\.\s|^<(ul|ol|blockquote)/i)) {
          return paragraph;
        }

        // Wrap regular paragraphs in <p> tags if they aren't already wrapped in block elements
        if (!paragraph.match(/^<(p|div|h[1-6]|ul|ol|blockquote|pre)/i)) {
          return `<p>${paragraph}</p>`;
        }

        return paragraph;
      })
      .filter(p => p.length > 0)
      .join('\n\n');
  }

  /**
   * Process lists with proper formatting
   */
  private static processLists(content: string): string {
    // Process unordered lists
    content = content.replace(
      /((^[\*\-\+]\s.+\n?)+)/gm,
      (match) => {
        const items = match.trim().split('\n')
          .map(line => {
            const cleanLine = line.replace(/^[\*\-\+]\s/, '').trim();
            return `  <li>${cleanLine}</li>`;
          })
          .join('\n');
        return `\n<ul>\n${items}\n</ul>\n\n`;
      }
    );

    // Process ordered lists
    content = content.replace(
      /((^\d+\.\s.+\n?)+)/gm,
      (match) => {
        const items = match.trim().split('\n')
          .map(line => {
            const cleanLine = line.replace(/^\d+\.\s/, '').trim();
            return `  <li>${cleanLine}</li>`;
          })
          .join('\n');
        return `\n<ol>\n${items}\n</ol>\n\n`;
      }
    );

    return content;
  }

  /**
   * Process blockquotes with proper formatting
   */
  private static processBlockquotes(content: string): string {
    return content.replace(
      /((^>\s.+\n?)+)/gm,
      (match) => {
        const quote = match.trim()
          .split('\n')
          .map(line => line.replace(/^>\s/, '').trim())
          .join(' ');
        return `\n<blockquote><p>${quote}</p></blockquote>\n\n`;
      }
    );
  }

  /**
   * Fix spacing throughout the content
   */
  private static fixSpacing(content: string): string {
    return content
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Ensure proper spacing around block elements
      .replace(/(<\/?(h[1-6]|p|div|ul|ol|blockquote)[^>]*>)\s*\n?\s*/g, '$1\n\n')
      // Clean up start and end
      .trim();
  }

  /**
   * Capitalize heading text properly
   */
  private static capitalizeHeading(text: string): string {
    // List of words that should remain lowercase unless they're the first word
    const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'];
    
    return text
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Always capitalize first word
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        
        // Keep lowercase words lowercase unless they're important
        if (lowercaseWords.includes(word)) {
          return word;
        }
        
        // Capitalize other words
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  /**
   * Add proper spacing between sections
   */
  static addSectionSpacing(content: string): string {
    return content
      // Add spacing before headings
      .replace(/(\n|^)(#{1,6}\s)/g, '\n\n$2')
      // Add spacing after paragraphs before headings
      .replace(/(<\/p>)\s*(#{1,6}\s)/g, '$1\n\n$2')
      // Add spacing around lists
      .replace(/(<\/(ul|ol)>)\s*(<p>)/g, '$1\n\n$3')
      .replace(/(<\/p>)\s*(<(ul|ol)>)/g, '$1\n\n$2')
      // Clean up multiple line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Sanitize and clean content for display
   */
  static sanitizeContent(content: string): string {
    return content
      // Remove dangerous HTML tags but keep formatting
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      // Fix common HTML issues
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // Normalize quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
}
