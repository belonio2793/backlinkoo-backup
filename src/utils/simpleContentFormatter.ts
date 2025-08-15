/**
 * Simplified content formatter that focuses on essential formatting
 * without over-processing that can corrupt content
 */

export class SimpleContentFormatter {
  /**
   * Format blog content with minimal, safe processing
   */
  static formatBlogContent(content: string, title?: string): string {
    if (!content) return '';

    console.log('SimpleContentFormatter: Processing content of length:', content.length);

    // Step 1: Basic cleanup - remove obvious artifacts
    let formattedContent = content
      // Remove markdown frontmatter
      .replace(/^---[\s\S]*?---\s*/m, '')
      // Remove title duplicates at the beginning
      .replace(/^[\s\n]*Title:\s*[^\n]*\n?/i, '')
      // Remove H1/H2 prefix patterns
      .replace(/^\*\*H[1-6]\*\*:\s*/gmi, '')
      .replace(/^H[1-6]:\s*/gmi, '')
      // Clean up line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // Step 2: Remove duplicate title if provided
    if (title) {
      const cleanTitle = title.replace(/[*#]/g, '').trim();
      const titlePattern = new RegExp(`^\\s*${this.escapeRegex(cleanTitle)}\\s*\\n?`, 'i');
      formattedContent = formattedContent.replace(titlePattern, '');
    }

    // Step 3: Convert basic markdown to HTML
    formattedContent = this.convertBasicMarkdown(formattedContent);

    // Step 4: Wrap content in paragraphs
    formattedContent = this.wrapInParagraphs(formattedContent);

    // Step 5: Basic link fixes
    formattedContent = this.fixBasicLinks(formattedContent);

    console.log('SimpleContentFormatter: Final content has HTML tags:', 
      formattedContent.includes('<p>') || formattedContent.includes('<h'));

    return formattedContent;
  }

  /**
   * Convert basic markdown to HTML - essential patterns only
   */
  private static convertBasicMarkdown(content: string): string {
    return content
      // Convert headings (##, ###)
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      
      // Convert bold text **text**
      .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
      
      // Convert italic text *text*
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      
      // Convert links [text](url)
      .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, 
        '<a href="$2" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">$1</a>')
      
      // Convert plain URLs
      .replace(/(^|[^<"'])(https?:\/\/[^\s<>"']+)/gi, 
        '$1<a href="$2" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">$2</a>');
  }

  /**
   * Wrap content in proper paragraph tags
   */
  private static wrapInParagraphs(content: string): string {
    // Split by double line breaks for paragraphs
    const paragraphs = content.split(/\n\s*\n/);
    const result: string[] = [];
    let i = 0;

    while (i < paragraphs.length) {
      let paragraph = paragraphs[i].trim();
      if (!paragraph) {
        i++;
        continue;
      }

      // Skip if already wrapped in HTML tags
      if (paragraph.match(/^<(h[1-6]|ul|ol|blockquote|div)/i)) {
        result.push(paragraph);
        i++;
        continue;
      }

      // Check if this starts a numbered list
      if (paragraph.match(/^\d+\.\s/)) {
        // Collect consecutive numbered items
        const listItems: string[] = [paragraph];
        let j = i + 1;

        while (j < paragraphs.length) {
          const nextPara = paragraphs[j].trim();
          if (nextPara.match(/^\d+\.\s/)) {
            listItems.push(nextPara);
            j++;
          } else {
            break;
          }
        }

        // Process as ordered list
        const processedList = this.processOrderedList(listItems);
        result.push(processedList);
        i = j;
        continue;
      }

      // Check if this starts a bullet list
      if (paragraph.match(/^[\*\-\+]\s/)) {
        // Collect consecutive bullet items
        const listItems: string[] = [paragraph];
        let j = i + 1;

        while (j < paragraphs.length) {
          const nextPara = paragraphs[j].trim();
          if (nextPara.match(/^[\*\-\+]\s/)) {
            listItems.push(nextPara);
            j++;
          } else {
            break;
          }
        }

        // Process as unordered list
        const processedList = this.processUnorderedList(listItems);
        result.push(processedList);
        i = j;
        continue;
      }

      // Regular paragraph
      result.push(`<p>${paragraph}</p>`);
      i++;
    }

    return result.filter(p => p.length > 0).join('\n\n');
  }

  /**
   * Process ordered list items
   */
  private static processOrderedList(items: string[]): string {
    const listItems = items
      .map(item => {
        const cleanItem = item.replace(/^\d+\.\s+/, '').trim();
        return cleanItem ? `  <li>${cleanItem}</li>` : '';
      })
      .filter(item => item)
      .join('\n');

    return `<ol>\n${listItems}\n</ol>`;
  }

  /**
   * Process unordered list items
   */
  private static processUnorderedList(items: string[]): string {
    const listItems = items
      .map(item => {
        const cleanItem = item.replace(/^[\*\-\+]\s+/, '').trim();
        return cleanItem ? `  <li>${cleanItem}</li>` : '';
      })
      .filter(item => item)
      .join('\n');

    return `<ul>\n${listItems}\n</ul>`;
  }

  /**
   * Process simple lists (legacy method for backward compatibility)
   */
  private static processList(content: string): string {
    const lines = content.split('\n');
    const isOrdered = lines[0].match(/^\d+\.\s/);

    const listItems = lines
      .map(line => {
        // Remove numbered list markers (1., 2., etc.) or bullet markers (*, -, +)
        const cleanLine = line.replace(/^(?:\d+\.|[\*\-\+])\s+/, '').trim();
        return cleanLine ? `  <li>${cleanLine}</li>` : '';
      })
      .filter(item => item)
      .join('\n');

    const tag = isOrdered ? 'ol' : 'ul';
    return `<${tag}>\n${listItems}\n</${tag}>`;
  }

  /**
   * Fix basic link issues
   */
  private static fixBasicLinks(content: string): string {
    return content
      // Ensure all links have proper attributes
      .replace(/<a href="([^"]*)"(?![^>]*target=)/g, '<a href="$1" target="_blank" rel="noopener"')
      .replace(/<a href="([^"]*)"(?![^>]*style=)/g, '<a href="$1" style="color:#2563eb;text-decoration:underline;"');
  }

  /**
   * Escape regex special characters
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate content structure
   */
  static validateContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.length < 10) {
      errors.push('Content is too short');
    }

    if (!content.includes('<p>') && !content.includes('<h')) {
      errors.push('No HTML structure detected');
    }

    if (content.includes('&lt;') || content.includes('&gt;')) {
      errors.push('Contains unprocessed HTML entities');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
