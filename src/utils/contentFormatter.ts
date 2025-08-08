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

    // VERY EARLY preprocessing to fix critical issues before any HTML processing
    content = content
      // Fix the specific issue: ## &lt; h2&gt;Pro Tip pattern
      .replace(/##\s*&lt;\s*h[1-6]\s*&gt;\s*Pro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*&lt;\s*\/\s*h[1-6]\s*&gt;\s*Pro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*&lt;\s*$/gm, '') // Remove lines that are just ## &lt;

      // Remove empty heading lines (just ##)
      .replace(/^\s*##\s*$/gm, '')
      .replace(/^\s*###\s*$/gm, '')
      .replace(/^\s*####\s*$/gm, '')

      // Fix malformed HTML entities that break headings
      .replace(/##\s*&lt;[^&]*&gt;\s*([A-Za-z][^\n]*)/gi, '## $1')
      .replace(/&lt;\s*\/\s*[a-zA-Z]+\s*&gt;/g, '') // Remove &lt;/tag&gt; patterns
      .replace(/&lt;\s*[a-zA-Z]+[^&]*&gt;/g, '') // Remove &lt;tag&gt; patterns

      // Fix Pro Tip issue immediately - most aggressive patterns
      .replace(/##\s*P\s*[\n\r\s]*ro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P\s*<[^>]*>\s*ro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P\s*(?:<[^>]*>)?\s*ro\s*(?:<[^>]*>)?\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P\s*\n?\s*ro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P\s+ro\s*Tip/gi, '## Pro Tip')

      // Clean up malformed sentences and links
      .replace(/([A-Za-z])\s*&lt;[^&]*&gt;\s*([A-Za-z])/g, '$1 $2') // Remove HTML entities between words
      .replace(/\.\s*&lt;[^&]*&gt;\s*([A-Z])/g, '. $1'); // Clean sentence breaks

    // Split content into lines and clean up
    let formattedContent = content
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace but preserve paragraph breaks
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Process the content in correct order - add comprehensive cleanup first
    formattedContent = this.removeSpecificMalformedPatterns(formattedContent);
    formattedContent = this.cleanupMarkdownArtifacts(formattedContent);
    formattedContent = this.convertMarkdownToHtml(formattedContent);
    formattedContent = this.removeDuplicateTitle(formattedContent, title);
    formattedContent = this.fixContentIssues(formattedContent);
    formattedContent = this.cleanMalformedLinks(formattedContent);
    formattedContent = this.processHeadings(formattedContent);
    formattedContent = this.processParagraphs(formattedContent);
    formattedContent = this.processLists(formattedContent);
    formattedContent = this.processBlockquotes(formattedContent);
    formattedContent = this.fixSpacing(formattedContent);

    return formattedContent;
  }

  /**
   * Clean up markdown artifacts and formatting issues
   */
  private static cleanupMarkdownArtifacts(content: string): string {
    return content
      // Remove markdown frontmatter (YAML frontmatter between triple hyphens)
      .replace(/^---[\s\S]*?---\s*/m, '')
      // Remove standalone triple hyphens (horizontal rules)
      .replace(/^---+\s*$/gm, '')
      .replace(/\n---+\n/g, '\n\n')
      .replace(/\n---+$/gm, '')
      // Remove malformed headings that are just single letters or abbreviations
      .replace(/^##?\s+[A-Z]\.\s*(Assessment|needed|required|evaluation)\s*$/gmi, '')
      // Fix common markdown formatting issues
      .replace(/^\s*\*\*([A-Z])\.\s*([A-Za-z\s]*)\*\*\s*$/gmi, (match, letter, rest) => {
        // Convert malformed bold patterns to regular text
        if (rest.trim().length < 5) {
          return `**${letter}.** ${rest}`;
        }
        return match;
      })
      // Remove empty markdown headings
      .replace(/^#{1,6}\s*$$/gm, '')
      // Clean up excessive markdown symbols
      .replace(/\*{3,}/g, '**')
      .replace(/_{3,}/g, '__')
      // Remove orphaned colons from headings
      .replace(/^(#{1,6})\s*([^:]+):\s*$/gm, '$1 $2')
      // Clean up whitespace around hyphens
      .replace(/\s*---+\s*/g, ' ')
      .trim();
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

    // First, aggressively remove any "Title:" patterns at the very beginning
    content = content.replace(/^[\s\n]*Title:\s*[^\n]*\n?/i, '');

    // Remove any lines that are just "Title:" followed by the actual title
    content = content.replace(/^[\s\n]*Title:\s*(.+?)\n?/i, '');

    // Remove H2 tags that contain title with "Title:" prefix (most common issue)
    const h2TitlePrefixPattern = new RegExp(`^\\s*<h2[^>]*>\\s*Title:\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/h2>\\s*`, 'i');
    content = content.replace(h2TitlePrefixPattern, '');

    // Remove H1 tags that contain the same title at the beginning of content
    const titlePattern = new RegExp(`^\\s*<h1[^>]*>\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/h1>\\s*`, 'i');
    content = content.replace(titlePattern, '');

    // Remove H1 with "Title:" prefix pattern: <h1>Title: actual title</h1>
    const titlePrefixPattern = new RegExp(`^\\s*<h1[^>]*>\\s*Title:\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/h1>\\s*`, 'i');
    content = content.replace(titlePrefixPattern, '');

    // Remove H2 with exact title match
    const h2TitlePattern = new RegExp(`^\\s*<h2[^>]*>\\s*${this.escapeRegex(cleanTitle)}\\s*<\\/h2>\\s*`, 'i');
    content = content.replace(h2TitlePattern, '');

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

    // Final cleanup - remove any remaining "Title:" patterns at the beginning of content
    content = content.replace(/^[\s\n]*Title:\s*[^\n]*\n?/gi, '');

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
      // Fix "## P" + "ro Tip" pattern early (before any other processing)
      .replace(/##\s*P\s*[\n\r\s]*ro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P\s*<[^>]*>\s*ro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P\s*(?:<[^>]*>)?\s*ro\s*(?:<[^>]*>)?\s*Tip/gi, '## Pro Tip')
      // Fix already separated HTML structure: "## P <p>ro Tip"
      .replace(/##\s*P\s*<p[^>]*>\s*ro\s*Tip/gi, '<h2>Pro Tip</h2>')
      .replace(/##\s*P\s*<p[^>]*>\s*ro\s*Tip/gi, '<h2>Pro Tip</h2><p>')

      // Fix malformed HTML entity patterns in headings
      .replace(/##\s*&lt;\s*h[1-6]\s*&gt;\s*([^&<]+)/gi, '## $1')
      .replace(/##\s*&lt;\s*\/\s*h[1-6]\s*&gt;\s*([^&<]+)/gi, '## $1')

      // Remove markdown frontmatter separators (triple hyphens)
      .replace(/^---[\s\S]*?---/gm, '')
      .replace(/^---.*$/gm, '')
      .replace(/\n---\n/g, '\n')
      .replace(/\n---$/gm, '')
      // Remove any "Title:" patterns at the very beginning of content (most aggressive)
      .replace(/^[\s\n]*Title:\s*[^\n]*\n?/i, '')
      // Convert markdown links [text](url) to <a> tags with proper styling
      .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:500;">$1</a>')

      // Convert plain URLs to clickable links
      .replace(/(^|[^<"'])(https?:\/\/[^\s<>"']+)/gi, '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:500;">$2</a>')

      // Handle specific case: "Play now at Runescape.com" pattern
      .replace(/(Play now at\s+)([a-zA-Z0-9.-]+\.com)/gi, '$1<a href="https://$2" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:500;">$2</a>')

      // Handle malformed "Claim your place" patterns that may be broken by HTML entities
      .replace(/Claim\s+your\s+place\s+among\s+the\s+legends[^.]*\.\s*Play\s+now\s+at\s+([a-zA-Z0-9.-]+\.com)/gi,
        'Claim your place among the legends. Play now at <a href="https://$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:500;">$1</a>.')
      // Convert **H1**: patterns to <h1> tags
      .replace(/\*\*H1\*\*:\s*(.+?)(?=\n|$)/gi, '<h1>$1</h1>')
      // Convert **Title**: patterns to nothing (remove completely since it's duplicate)
      .replace(/^\*\*Title\*\*:\s*(.+?)(?=\n|$)/gmi, '')
      // Fix specific case: "## P" should be "## Pro Tip" (comprehensive patterns)
      .replace(/^##\s*P\s*$/gmi, '## Pro Tip')
      .replace(/^##\s*P\s*ro\s*Tip.*$/gmi, '## Pro Tip')
      .replace(/##\s*P\s*\n?\s*ro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P\s*<[^>]*>\s*ro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*P[\s\n\r]*ro\s*Tip/gi, '## Pro Tip')
      // Handle cases where HTML tags are already present
      .replace(/<[^>]*>##\s*P\s*<\/[^>]*>\s*<[^>]*>\s*ro\s*Tip/gi, '<h2>Pro Tip</h2>')
      .replace(/##\s*P\s*<\/[^>]*>\s*ro\s*Tip/gi, '## Pro Tip')

      // Fix malformed headings like "## P. Assessment" - only create proper headings from meaningful text
      .replace(/^##?\s+([A-Z])\.\s*([A-Za-z\s]{0,15})\s*$/gmi, (match, letter, rest) => {
        // If it's a single letter followed by a short word, it's likely malformed - convert to paragraph
        if (rest.trim().length < 3 || /^(Assessment|needed|required)$/i.test(rest.trim())) {
          return `<p><strong>${letter}. ${rest}</strong></p>`;
        }
        return `<h2>${letter}. ${rest}</h2>`;
      })
      // Convert **text**: patterns at start of line to <h2> tags (common heading pattern)
      // But avoid single letters with colons that create malformed headings
      .replace(/^\*\*([^*]+?)\*\*:\s*(.+?)(?=\n|$)/gmi, (match, prefix, content) => {
        // If prefix is just a single letter, treat as regular text
        if (prefix.trim().length === 1) {
          return `<p><strong>${prefix}:</strong> ${content}</p>`;
        }
        return `<h2>${prefix}: ${content}</h2>`;
      })
      // Convert **text** patterns at start of line to <h2> tags (standalone bold headings)
      .replace(/^\*\*([^*]+?)\*\*(?=\s*\n|$)/gmi, '<h2>$1</h2>')
      // Convert remaining **text** to <strong> tags (inline bold) - use simpler markup initially
      .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
      // Convert *text* to <em> tags (italic)
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      // Convert ### headings to h3
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // Convert ## headings to h2, but filter out malformed ones
      .replace(/^## (.+)$/gm, (match, content) => {
        // Skip if it's a malformed heading like "P. Assessment"
        if (/^[A-Z]\.\s*[A-Za-z\s]{0,15}$/.test(content.trim())) {
          return `<p><strong>${content}</strong></p>`;
        }
        return `<h2>${content}</h2>`;
      })
      // Convert # headings to h1
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Remove any remaining standalone "Title:" patterns at start of lines
      .replace(/^Title:\s*[^\n]*\n?/gmi, '')
      // Clean up any remaining triple hyphens that might be inline
      .replace(/---+/g, '');
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

      // FIRST: Decode all levels of HTML entity encoding immediately
      .replace(/&amp;lt;/g, '<')
      .replace(/&amp;gt;/g, '>')
      .replace(/&amp;amp;/g, '&')
      .replace(/&amp;quot;/g, '"')

      // EARLIEST CATCH: Fix specific Pro Tip pattern before any other processing
      .replace(/<h2[^>]*>\s*&lt;\s*<\/h2>\s*<p[^>]*>\s*h2&gt;\s*Pro\s*Tip[\s\S]*?<\/p>/gi, '<h2>Pro Tip</h2>')
      .replace(/<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;\s*Pro\s*Tip[\s\S]*?<\/p>/gi, '<h2>Pro Tip</h2>')

      // AGGRESSIVE removal of the specific malformed pattern first
      .replace(/##\s*(&amp;lt;|&lt;)[\s\S]*?h[1-6]\s*(&amp;gt;|&gt;)\s*Pro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*(&amp;lt;|&lt;).*$/gm, '') // Remove any line starting with ## <

      // Fix malformed HTML entities first (most critical)
      .replace(/&lt;\s*\/\s*[a-zA-Z]+\s*&gt;/g, '') // Remove &lt;/tag&gt; patterns
      .replace(/&lt;\s*[a-zA-Z]+[^&]*&gt;/g, '') // Remove &lt;tag&gt; patterns
      .replace(/##\s*&lt;\s*h[1-6]\s*&gt;\s*(Pro\s*Tip|[^<]*)/gi, '## $1') // Fix ## &lt;h2&gt;Pro Tip patterns
      .replace(/&lt;\s*\/\s*p\s*&gt;\s*#\s*\d+\s*&lt;\s*p\s*&gt;/g, '') // Remove malformed p tag patterns

      // Clean up corrupted style attributes with malformed content
      .replace(/style="[^"]*&lt;[^"]*&gt;[^"]*"/gi, 'style="color:#2563eb;font-weight:500;"')
      .replace(/style="[^"]*color:[^#]*#[^0-9a-f]*([0-9a-f]{6})[^"]*"/gi, 'style="color:#$1;font-weight:500;"')

      // Remove any remaining markdown artifacts
      .replace(/---+/g, '')
      .replace(/^\s*---\s*$/gm, '')
      // Remove malformed HTML headings with single letters
      .replace(/<h[1-6][^>]*>\s*[A-Z]\.\s*(Assessment|needed|required|evaluation)\s*<\/h[1-6]>/gi, '')
      // Remove empty headings
      .replace(/<h[1-6][^>]*>\s*<\/h[1-6]>/gi, '')

      // Final cleanup for remaining malformed markdown headings
      .replace(/^\s*#{1,6}\s*&lt;[^&>]*&gt;\s*$/gm, '') // Remove headings that are just ## &lt;tag&gt;
      .replace(/^\s*#{1,6}\s*$/gm, '') // Remove empty headings like just ##

      // Fix common HTML issues
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

      // Very careful HTML entity decoding to preserve our generated HTML
      .replace(/&amp;(?!lt;|gt;|amp;|quot;|#\d)/g, '&')

      // Only decode &lt; and &gt; in very specific safe contexts
      .replace(/&lt;(?=\s+[^a-zA-Z])/g, '<')  // Decode only if followed by space + non-letter
      .replace(/&gt;(?=\s+[^a-zA-Z])/g, '>') // Decode only if followed by space + non-letter
      .replace(/&lt;(?=\s*$)/g, '<')  // Decode at end of line
      .replace(/&gt;(?=\s*$)/g, '>') // Decode at end of line

      // Normalize quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')

      // Remove excessive whitespace but preserve paragraph structure
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Fix content issues including Pro Tip headings and link styling
   */
  private static fixContentIssues(content: string): string {
    return content
      // Fix malformed HTML entities in headings first
      .replace(/##\s*&lt;\s*h[1-6]\s*&gt;\s*(Pro\s*Tip|[^<]*)/gi, '## $1')
      .replace(/##\s*&lt;\s*\/\s*h[1-6]\s*&gt;\s*(Pro\s*Tip|[^<]*)/gi, '## $1')

      // Fix Pro Tip heading issues
      .replace(/##\s*P\s*<p[^>]*>\s*ro\s*Tip/gi, '<h2>Pro Tip</h2><p>')
      .replace(/##\s*P\s*<p[^>]*data-[^>]*>\s*ro\s*Tip/gi, '<h2>Pro Tip</h2><p>')
      .replace(/##\s*P\s*(?:<[^>]*>)?\s*ro\s*(?:<[^>]*>)?\s*Tip/gi, '<h2>Pro Tip</h2>')
      // Fix literal "## P" text that's not being processed as markdown
      .replace(/^##\s*P\s+/gm, '<h2>Pro Tip</h2>\n')
      .replace(/##\s*P\s+/g, '<h2>Pro Tip</h2> ')

      // Fix corrupted color styles (e.g., "color:&lt;/p&gt; # 2 &lt;p&gt; 563eb;")
      .replace(/style="[^"]*color:[^#]*#[^0-9a-f]*([0-9a-f]{6})[^"]*"/gi, 'style="color:#$1;font-weight:500;"')
      .replace(/style="[^"]*&lt;[^"]*&gt;[^"]*"/gi, 'style="color:#2563eb;font-weight:500;"')

      // Remove unwanted text-decoration and hover events from existing links
      .replace(/(<a[^>]*) onmouseover="[^"]*"/gi, '$1')
      .replace(/(<a[^>]*) onmouseout="[^"]*"/gi, '$1')
      .replace(/(<a[^>]*) onmouseenter="[^"]*"/gi, '$1')
      .replace(/(<a[^>]*) onmouseleave="[^"]*"/gi, '$1')
      .replace(/(<a[^>]*style="[^"]*);?\s*text-decoration:[^;"]*;?([^"]*"[^>]*>)/gi, '$1$2')

      // Clean up link text that contains malformed HTML entities
      .replace(/>([^<]*&lt;[^<]*&gt;[^<]*)</g, (match, linkText) => {
        const cleanText = linkText.replace(/&lt;[^&]*&gt;/g, '').trim();
        return `>${cleanText}<`;
      })

      // Fix links missing color entirely
      .replace(/<a([^>]*href[^>]*)style="([^"]*)"([^>]*)>/gi, (match, beforeStyle, styleContent, afterStyle) => {
        // If style doesn't contain color, add it
        if (!styleContent.includes('color:')) {
          const newStyle = `color:#2563eb;font-weight:500;${styleContent}`;
          return `<a${beforeStyle}style="${newStyle}"${afterStyle}>`;
        }
        return match;
      })

      // Ensure all links without any style have proper styling and remove hover attributes
      .replace(/<a([^>]*href[^>]*)(?!.*style=)([^>]*)>/gi, '<a$1 style="color:#2563eb;font-weight:500;"$2>');
  }

  /**
   * Clean malformed links, especially gaming site patterns
   */
  private static cleanMalformedLinks(content: string): string {
    return content
      // Fix the specific ## &lt; h2&gt;Pro Tip issue that gets split
      .replace(/##\s*&lt;\s*[\n\r]*\s*h[1-6]\s*&gt;\s*Pro\s*Tip/gi, '## Pro Tip')
      .replace(/##\s*&lt;\s*[\n\r]*\s*([A-Za-z][^\n]*)/gi, '## $1')

      // Remove standalone ## &lt; patterns
      .replace(/^\s*##\s*&lt;\s*$/gm, '')
      .replace(/^\s*##\s*&lt;[^&>]*&gt;\s*$/gm, '')

      // Fix text with malformed HTML entities breaking up words
      .replace(/([A-Za-z])\s*&lt;[^&]*&gt;\s*([a-zA-Z0-9.-]+\.com)/g, '$1 $2')
      .replace(/([A-Za-z])\s*&lt;[^&]*&gt;\s*([A-Za-z])/g, '$1$2')

      // Fix specific gaming site patterns like "Play now at Runescape.com"
      .replace(/(Play\s+now\s+at)\s*&lt;[^&]*&gt;\s*([a-zA-Z0-9.-]+\.com)/gi,
        '$1 <a href="https://$2" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:500;">$2</a>')

      // Fix "Claim your place among the legends" patterns
      .replace(/Claim\s+your\s+place\s+among\s+the\s+legends[^.]*\.\s*Play\s+now\s+at\s+([a-zA-Z0-9.-]+\.com)/gi,
        'Claim your place among the legends. Play now at <a href="https://$1" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:500;">$1</a>.')

      // General cleanup of malformed HTML entities in text
      .replace(/&lt;\s*\/\s*[a-zA-Z]+\s*&gt;/g, '') // Remove &lt;/tag&gt; patterns
      .replace(/&lt;\s*[a-zA-Z]+[^&]*&gt;/g, '') // Remove &lt;tag&gt; patterns

      // Fix broken sentences caused by HTML entities
      .replace(/\.\s*&lt;[^&]*&gt;\s*([A-Z])/g, '. $1')
      .replace(/([.!?])\s*&lt;[^&]*&gt;\s*([A-Z])/g, '$1 $2')

      // Final cleanup: remove any remaining empty headings
      .replace(/^\s*#{1,6}\s*$/gm, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean up multiple line breaks
  }

  /**
   * Remove specific malformed patterns that cause rendering issues
   */
  private static removeSpecificMalformedPatterns(content: string): string {
    return content
      // FIRST: Decode all levels of HTML entity encoding
      .replace(/&amp;lt;/g, '<')
      .replace(/&amp;gt;/g, '>')
      .replace(/&amp;amp;/g, '&')
      .replace(/&amp;quot;/g, '"')

      // ULTIMATE AGGRESSIVE: Remove the exact pattern that persists
      // Pattern: ## &lt; <p>h2&gt;Pro Tip </p>
      .replace(/##\s*(&amp;lt;|&lt;)\s*<p[^>]*>\s*h[1-6]\s*(&amp;gt;|&gt;)\s*Pro\s*Tip[\s\S]*?<\/p>/gi, '## Pro Tip')
      .replace(/##\s*(&amp;lt;|&lt;)\s*h[1-6]\s*(&amp;gt;|&gt;)\s*Pro\s*Tip/gi, '## Pro Tip')

      // Remove any standalone ## with encoded entities
      .replace(/^\s*##\s*(&amp;lt;|&lt;)\s*$/gm, '')
      .replace(/##\s*(&amp;lt;|&lt;)(?!.*Pro\s*Tip).*$/gm, '') // Remove ## < lines that don't contain Pro Tip

      // MOST AGGRESSIVE: Remove any ## followed by encoded HTML
      .replace(/##\s*(&amp;lt;|&lt;)[\s\S]*?h[1-6]\s*(&amp;gt;|&gt;)\s*Pro\s*Tip[\s\S]*?$/gm, '## Pro Tip')
      .replace(/##\s*(&amp;lt;|&lt;).*$/gm, '') // Remove any line starting with ## <

      // Remove any content that looks like HTML entities after ##
      .replace(/##\s*(&amp;lt;|&lt;)[^&>]*(&amp;gt;|&gt;)[^\n]*/g, '')

      // Clean up corrupted inline styles with any level of encoding
      .replace(/style="[^"]*(&amp;lt;|&lt;)[^"]*(&amp;gt;|&gt;)[^"]*"/gi, 'style="color:#2563eb;font-weight:500;"')

      // Remove orphaned HTML entity fragments (all encoding levels)
      .replace(/(&amp;lt;|&lt;)\s*\/?\s*[a-zA-Z]+[^&>]*(&amp;gt;|&gt;)/g, '')

      // Clean up any remaining malformed heading patterns
      .replace(/^\s*##\s*(&amp;lt;|&lt;).*$/gm, '')
      .replace(/^\s*##\s*$/gm, '');
  }

  /**
   * Pre-process content to fix specific malformed patterns before main processing
   */
  static preProcessMalformedHtml(content: string): string {
    return content
      // Fix the EXACT patterns we see in the DOM:

      // 1. Fix "strong&gt;text" pattern (missing opening < and closing tag)
      .replace(/(\s*)strong&gt;([^<>\n]+)/gi, '$1<strong class="font-bold text-inherit">$2</strong>')

      // 2. Fix "&lt;" at start of content
      .replace(/(\s*)&lt;(\s*)/gi, '$1<$2')

      // 3. Fix pattern with class: "strong class="..." missing opening <
      .replace(/(\s*)strong\s+class="[^"]*"&gt;([^<>\n&]+)/gi, '$1<strong class="font-bold text-inherit">$2</strong>')

      // 4. Fix fully encoded strong tags
      .replace(/&lt;strong\s+class="[^"]*"&gt;([^<&]+)&lt;\/strong&gt;/gi, '<strong class="font-bold text-inherit">$1</strong>')

      // 5. Fix standalone &lt; and &gt; that appear as text
      .replace(/(\s+)&lt;(\s+)/g, '$1<$2')
      .replace(/(\s+)&gt;(\s+)/g, '$1>$2')

      // 6. Remove stray encoded brackets at line starts
      .replace(/^\s*&gt;/gm, '')
      .replace(/^\s*&lt;(?!\w)/gm, '');
  }

  /**
   * Clean up any HTML that's being displayed as text instead of rendered
   */
  static fixDisplayedHtmlAsText(content: string): string {
    // Final aggressive fix for HTML displaying as text
    return content
      // Fix the most common broken patterns from the DOM:

      // 1. "strong&gt;text" -> "<strong>text</strong>"
      .replace(/(\s*)strong&gt;([^<>\n&]+?)(?=\s|$|\n)/gi, '$1<strong class="font-bold text-inherit">$2</strong>')

      // 2. "&lt;" at start of lines or content
      .replace(/(^|\s)&lt;/gm, '$1<')

      // 3. "strong class="..."&gt;text" -> "<strong class="...">text</strong>"
      .replace(/(\s*)strong\s+class="[^"]*"&gt;([^<>\n&]+)/gi, '$1<strong class="font-bold text-inherit">$2</strong>')

      // 4. Standalone &gt; that should be >
      .replace(/&gt;(?=\s|$)/g, '>')

      // 5. Any remaining encoded HTML tags
      .replace(/&lt;(\/?(?:strong|em|h[1-6]|p|a|ul|ol|li|blockquote|span|div)[^&>]*)&gt;/gi, '<$1>')

      // 6. Fix malformed opening tags missing <
      .replace(/(\s*)([a-zA-Z]+)\s+(class|style|id)="[^"]*"&gt;/gi, '$1<$2 $3>')

      // 7. Clean up any remaining stray entities
      .replace(/(\s+)&lt;(\s+)/g, '$1<$2')
      .replace(/(\s+)&gt;(\s+)/g, '$1>$2')
      .replace(/^&gt;\s*/gm, '')
      .replace(/^\s*&lt;(?!\w)/gm, '')

      // 8. Final pass: fix any text that looks like HTML
      .replace(/(\s+)(strong|em|h[1-6]|p|a|span|div)&gt;([^<>&\n]+)/gi, '$1<$2 class="font-bold text-inherit">$3</$2>');
  }

  /**
   * Final post-processing cleanup to catch patterns that slip through
   */
  static postProcessCleanup(content: string): string {
    return content
      // ULTIMATE FIX: Handle double-encoded HTML entities first
      .replace(/&amp;lt;/g, '<')
      .replace(/&amp;gt;/g, '>')
      .replace(/&amp;amp;/g, '&')

      // Handle the exact pattern showing in DOM: ## &lt; <p>h2&gt;Pro Tip</p>
      .replace(/##\s*&lt;\s*<p[^>]*>\s*h[1-6]\s*&gt;\s*Pro\s*Tip[\s\S]*?<\/p>/gi, '<h2>Pro Tip</h2>')

      // Remove specific malformed heading patterns from DOM: <h2>&lt;</h2> <p> h2&gt;Pro Tip </p>
      .replace(/<h[1-6][^>]*>&lt;<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;\s*Pro\s*Tip[\s\S]*?<\/p>/gi, '<h2>Pro Tip</h2>')
      .replace(/<h[1-6][^>]*>&lt;<\/h[1-6]>/gi, '') // Remove headings that just contain &lt;

      // Fix pattern where content is split: <h2>&lt;</h2> followed by <p> h2&gt;content </p>
      .replace(/<h[1-6][^>]*>&lt;<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;([^<]*)<\/p>/gi, '<h2>$1</h2>')

      // Handle all variations of the malformed pattern
      .replace(/##\s*&amp;lt;[\s\S]*?h[1-6]\s*&amp;gt;[\s\S]*?Pro\s*Tip[\s\S]*?/gi, '<h2>Pro Tip</h2>')
      .replace(/##\s*&lt;[\s\S]*?h[1-6]\s*&gt;[\s\S]*?Pro\s*Tip[\s\S]*?/gi, '<h2>Pro Tip</h2>')

      // Remove any line starting with ## and containing HTML entities
      .replace(/^\s*##\s*&amp;lt;.*$/gm, '')
      .replace(/^\s*##\s*&lt;.*$/gm, '')

      // Ultimate pattern removal - any ## followed by encoded tags
      .replace(/##\s*(&amp;lt;|&lt;)[^\n]*/g, '')

      // Fix corrupted style attributes with multiple encoding levels
      .replace(/style="[^"]*(&amp;lt;|&lt;)[^"]*(&amp;gt;|&gt;)[^"]*"/gi, 'style="color:#2563eb;font-weight:500;"')

      // Fix highly corrupted style attributes with embedded HTML
      .replace(/style="[^"]*&lt;\/p&gt;[^"]*&lt;h[1-6]&gt;[^"]*&lt;\/h[1-6]&gt;[^"]*&lt;p&gt;[^"]*"/gi, 'style="color:#2563eb;font-weight:500;"')
      .replace(/style="[^"]*color:[^"]*&lt;[^"]*&gt;[^"]*"/gi, 'style="color:#2563eb;font-weight:500;"')

      // Clean up any remaining double-encoded entities
      .replace(/&amp;lt;\s*\/?\s*[a-zA-Z]+[^&]*&amp;gt;/g, '')
      .replace(/&lt;\s*\/?\s*[a-zA-Z]+[^&]*&gt;/g, '')

      // Remove empty paragraphs and malformed content
      .replace(/<p[^>]*>\s*<\/p>/gi, '') // Empty paragraphs
      .replace(/<p[^>]*>\s*&lt;[^&>]*&gt;\s*<\/p>/gi, '') // Paragraphs with only HTML entities
      .replace(/<p[^>]*>\s*h[1-6]&gt;\s*<\/p>/gi, '') // Paragraphs with malformed heading fragments
      .replace(/\n{3,}/g, '\n\n')

      // Clean up any remaining malformed headings that contain only symbols
      .replace(/<h[1-6][^>]*>\s*[&<>]+\s*<\/h[1-6]>/gi, '')

      // REMOVE DISPLAYED HTML ENTITY TEXT - no code should be visible
      .replace(/<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>/gi, '') // Remove headings showing just &lt;
      .replace(/<p[^>]*>\s*h[1-6]&gt;[^<]*<\/p>/gi, '') // Remove paragraphs showing h2&gt; text
      .replace(/<[^>]*>\s*&lt;\s*<\/[^>]*>/gi, '') // Remove any tag containing just &lt;
      .replace(/<[^>]*>\s*&gt;\s*<\/[^>]*>/gi, '') // Remove any tag containing just &gt;

      // ULTIMATE REMOVAL: The exact pattern from the image/DOM
      .replace(/<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;\s*Pro\s*Tip\s*<\/p>/gi, '<h2>Pro Tip</h2>')
      .replace(/<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;[^<]*<\/p>/gi, '') // Remove any similar pattern

      // SPECIFIC FIX: Remove broken <h2>&lt;</h2> and reformat following Pro Tip paragraph
      .replace(/<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;\s*Pro\s*Tip[^<]*<\/p>/gi, '<h2>Pro Tip</h2>')
      .replace(/<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*>\s*h[1-6]&gt;([^<]*)<\/p>/gi, '<h2>$1</h2>')

      // Handle the exact pattern with data-loc attributes from the DOM
      .replace(/<h[1-6][^>]*data-loc[^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*data-loc[^>]*>\s*h[1-6]&gt;\s*Pro\s*Tip[^<]*<\/p>/gi, '<h2>Pro Tip</h2>')
      .replace(/<h[1-6][^>]*data-loc[^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*data-loc[^>]*>\s*h[1-6]&gt;([^<]*)<\/p>/gi, '<h2>$1</h2>')

      // MOST AGGRESSIVE: Catch any h2 containing just &lt; followed by p containing h2&gt;
      .replace(/<h2[^>]*>\s*&lt;\s*<\/h2>\s*<p[^>]*>\s*h2&gt;\s*Pro\s*Tip[^<]*<\/p>/gi, '<h2>Pro Tip</h2>')
      .replace(/<h2[^>]*>\s*&lt;\s*<\/h2>\s*<p[^>]*>\s*h2&gt;([^<]*)<\/p>/gi, '<h2>$1</h2>')

      // Ultra specific for the exact DOM pattern visible
      .replace(/<h2[^>]*>&lt;<\/h2>\s*<p[^>]*>\s*h2&gt;Pro\s*Tip\s*<\/p>/gi, '<h2>Pro Tip</h2>')

      // Remove standalone malformed heading + paragraph combinations
      .replace(/<h[1-6][^>]*>\s*&lt;\s*<\/h[1-6]>\s*<p[^>]*>[^<]*h[1-6]&gt;[^<]*<\/p>/gi, '')

      // Remove text fragments that are HTML entities being displayed
      .replace(/&lt;\s*h[1-6]\s*&gt;/gi, '') // Remove &lt; h2&gt; type patterns
      .replace(/&lt;\s*\/\s*h[1-6]\s*&gt;/gi, '') // Remove &lt;/h2&gt; type patterns
      .replace(/&lt;\s*p\s*&gt;/gi, '') // Remove &lt;p&gt; patterns
      .replace(/&lt;\s*\/\s*p\s*&gt;/gi, '') // Remove &lt;/p&gt; patterns

      // Final pass: ensure any remaining ## patterns become proper headings
      .replace(/^\s*##\s+([A-Za-z][^\n]*)/gm, '<h2>$1</h2>')

      // COMPREHENSIVE HEADLINE PROTOCOL ENFORCEMENT
      // Ensure all headings follow proper HTML structure
      .replace(/<h([1-6])[^>]*>\s*([^<]*?)\s*<\/h[1-6]>/gi, (match, level, text) => {
        const cleanText = text.trim().replace(/[*#]+/g, '').trim();
        if (cleanText) {
          return `<h${level}>${cleanText}</h${level}>`;
        }
        return ''; // Remove empty headings
      })

      // Convert any remaining markdown-style headings to HTML
      .replace(/^\s*(#{1,6})\s+(.+?)\s*$/gm, (match, hashes, text) => {
        const level = Math.min(hashes.length, 6);
        const cleanText = text.trim().replace(/[*#]+/g, '').trim();
        if (cleanText) {
          return `<h${level}>${cleanText}</h${level}>`;
        }
        return ''; // Remove empty headings
      })

      // Fix any remaining malformed strong tag patterns that might show as text
      .replace(/strong\s+class="font-bold\s+text-inherit"&gt;([^<]+)/gi, '<strong class="font-bold text-inherit">$1</strong>')
      .replace(/&lt;strong\s+class="font-bold\s+text-inherit"&gt;([^<]+)&lt;\/strong&gt;/gi, '<strong class="font-bold text-inherit">$1</strong>')
      .replace(/&lt;strong([^&>]*)&gt;([^<]+)&lt;\/strong&gt;/gi, '<strong$1>$2</strong>')

      // Ensure all strong tags have proper classes for bold styling (safer approach)
      .replace(/<strong>/gi, '<strong class="font-bold text-inherit">')
      .replace(/<strong(\s+[^>]*?)>/gi, (match, attrs) => {
        // If it already has classes, don't override
        if (attrs.includes('class=')) {
          return match;
        }
        return `<strong class="font-bold text-inherit"${attrs}>`;
      });
  }
}
