/**
 * SEO Content Formatter Service
 * Automatically formats blog content with proper SEO structure, headings, and formatting
 */

export interface SEOFormattingOptions {
  targetKeyword?: string;
  anchorText?: string;
  targetUrl?: string;
  maxHeadingLevel?: number;
  includeTableOfContents?: boolean;
  optimizeForReadability?: boolean;
  addSchemaMarkup?: boolean;
}

export interface FormattedContent {
  content: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  headings: Array<{
    level: number;
    text: string;
    id: string;
  }>;
  readingTime: number;
  wordCount: number;
  seoScore: number;
}

export class SEOContentFormatter {
  private static readonly WORDS_PER_MINUTE = 200;
  private static readonly IDEAL_PARAGRAPH_LENGTH = 150;
  private static readonly IDEAL_SENTENCE_LENGTH = 20;

  /**
   * Formats content with proper SEO structure
   */
  static formatContent(
    rawContent: string, 
    title: string, 
    options: SEOFormattingOptions = {}
  ): FormattedContent {
    const {
      targetKeyword,
      anchorText,
      targetUrl,
      maxHeadingLevel = 3,
      optimizeForReadability = true
    } = options;

    // Parse and clean content
    let formattedContent = this.cleanContent(rawContent);
    
    // Add proper heading structure
    formattedContent = this.addHeadingStructure(formattedContent, maxHeadingLevel);
    
    // Optimize paragraphs for readability
    if (optimizeForReadability) {
      formattedContent = this.optimizeReadability(formattedContent);
    }
    
    // Add emphasis and formatting
    formattedContent = this.addTextFormatting(formattedContent, targetKeyword);
    
    // Insert anchor text naturally
    if (anchorText && targetUrl) {
      formattedContent = this.insertAnchorText(formattedContent, anchorText, targetUrl);
    }
    
    // Extract metadata
    const headings = this.extractHeadings(formattedContent);
    const keywords = this.extractKeywords(formattedContent, targetKeyword);
    const metaDescription = this.generateMetaDescription(formattedContent, title);
    const wordCount = this.getWordCount(formattedContent);
    const readingTime = Math.ceil(wordCount / this.WORDS_PER_MINUTE);
    const seoScore = this.calculateSEOScore(formattedContent, title, options);

    return {
      content: formattedContent,
      title: this.optimizeTitle(title, targetKeyword),
      metaDescription,
      keywords,
      headings,
      readingTime,
      wordCount,
      seoScore
    };
  }

  /**
   * Cleans and normalizes content
   */
  private static cleanContent(content: string): string {
    return content
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Fix common punctuation issues
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/([.,!?;:])\s*([A-Z])/g, '$1 $2')
      // Ensure proper sentence endings
      .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
      .trim();
  }

  /**
   * Adds proper heading structure for SEO
   */
  private static addHeadingStructure(content: string, maxLevel: number): string {
    const paragraphs = content.split('\n\n');
    let formattedParagraphs: string[] = [];
    let currentLevel = 2; // Start with H2 since H1 is the title

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (!paragraph) continue;

      // Identify potential headings (longer sentences that could be section titles)
      if (this.isPotentialHeading(paragraph, paragraphs, i)) {
        const headingLevel = Math.min(currentLevel, maxLevel);
        formattedParagraphs.push(`<h${headingLevel}>${paragraph}</h${headingLevel}>`);
        
        // Increase level for subsequent headings (but cap at maxLevel)
        if (currentLevel < maxLevel) {
          currentLevel++;
        }
      } else {
        // Reset heading level for new sections
        if (paragraph.length > 200) {
          currentLevel = 2;
        }
        formattedParagraphs.push(`<p>${paragraph}</p>`);
      }
    }

    return formattedParagraphs.join('\n\n');
  }

  /**
   * Determines if a paragraph should be a heading
   */
  private static isPotentialHeading(
    paragraph: string, 
    allParagraphs: string[], 
    index: number
  ): boolean {
    // Short paragraphs that end without punctuation could be headings
    if (paragraph.length < 100 && !paragraph.match(/[.!?]$/)) {
      return true;
    }

    // First paragraph of a section (after a longer paragraph)
    if (index > 0 && allParagraphs[index - 1].length > 200 && paragraph.length < 150) {
      return true;
    }

    // Contains question words or "how to" patterns
    if (paragraph.match(/^(How|What|Why|When|Where|Who)\s/i) && paragraph.length < 120) {
      return true;
    }

    return false;
  }

  /**
   * Optimizes content for readability
   */
  private static optimizeReadability(content: string): string {
    // Split long paragraphs
    content = content.replace(/<p>([^<]{300,})<\/p>/g, (match, paragraph) => {
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      const splitParagraphs: string[] = [];
      let currentParagraph = '';

      for (const sentence of sentences) {
        if ((currentParagraph + sentence).length > this.IDEAL_PARAGRAPH_LENGTH && currentParagraph) {
          splitParagraphs.push(`<p>${currentParagraph.trim()}</p>`);
          currentParagraph = sentence;
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + sentence;
        }
      }

      if (currentParagraph) {
        splitParagraphs.push(`<p>${currentParagraph.trim()}</p>`);
      }

      return splitParagraphs.join('\n\n');
    });

    // Add lists for items that should be lists
    content = content.replace(/<p>([^<]*(?:first|second|third|next|finally|additionally|also|furthermore)[^<]*)<\/p>/gi, 
      (match, paragraph) => {
        const items = paragraph.split(/(?:first|second|third|next|finally|additionally|also|furthermore)/i);
        if (items.length > 2) {
          const listItems = items.slice(1).map(item => `<li>${item.trim()}</li>`).join('');
          return `<ul>${listItems}</ul>`;
        }
        return match;
      }
    );

    return content;
  }

  /**
   * Adds proper text formatting (bold, italic, underline)
   */
  private static addTextFormatting(content: string, targetKeyword?: string): string {
    // Bold important terms and target keyword
    if (targetKeyword) {
      const keywordRegex = new RegExp(`\\b${targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      content = content.replace(keywordRegex, '<strong>$&</strong>');
    }

    // Bold other important terms
    const importantTerms = [
      'important', 'crucial', 'essential', 'key', 'critical', 'significant',
      'major', 'primary', 'main', 'best', 'top', 'excellent', 'outstanding'
    ];

    importantTerms.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      content = content.replace(regex, '<strong>$1</strong>');
    });

    // Italicize emphasis words
    const emphasisWords = [
      'very', 'really', 'truly', 'particularly', 'especially', 'specifically',
      'notably', 'remarkably', 'incredibly', 'extremely'
    ];

    emphasisWords.forEach(word => {
      const regex = new RegExp(`\\b(${word})\\b(?!<\/strong>)`, 'gi');
      content = content.replace(regex, '<em>$1</em>');
    });

    // Underline actionable items
    const actionWords = [
      'click here', 'learn more', 'get started', 'sign up', 'download', 'try now',
      'start today', 'join now', 'contact us', 'call us'
    ];

    actionWords.forEach(action => {
      const regex = new RegExp(`\\b(${action})\\b`, 'gi');
      content = content.replace(regex, '<u>$1</u>');
    });

    return content;
  }

  /**
   * Inserts anchor text naturally into content
   */
  private static insertAnchorText(content: string, anchorText: string, targetUrl: string): string {
    // Find the best paragraph to insert the anchor text
    const paragraphs = content.split('</p>');
    const middleIndex = Math.floor(paragraphs.length / 2);
    
    // Look for a paragraph around the middle that mentions related terms
    let insertIndex = middleIndex;
    for (let i = middleIndex; i < Math.min(middleIndex + 3, paragraphs.length); i++) {
      if (paragraphs[i].includes('professional') || paragraphs[i].includes('expert') || 
          paragraphs[i].includes('help') || paragraphs[i].includes('service')) {
        insertIndex = i;
        break;
      }
    }

    // Insert the anchor text naturally
    if (insertIndex < paragraphs.length - 1) {
      const paragraph = paragraphs[insertIndex];
      const anchorLink = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer"><strong>${anchorText}</strong></a>`;
      
      // Add a natural transition sentence
      const transitions = [
        `For professional guidance, consider ${anchorLink}.`,
        `To learn more about this topic, visit ${anchorLink}.`,
        `For expert assistance, check out ${anchorLink}.`,
        `Get comprehensive help from ${anchorLink}.`
      ];
      
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      paragraphs[insertIndex] = paragraph + ` ${transition}</p>`;
    }

    return paragraphs.join('</p>');
  }

  /**
   * Extracts headings from formatted content
   */
  private static extractHeadings(content: string): Array<{level: number, text: string, id: string}> {
    const headingRegex = /<h([1-6])(?:[^>]*)>(.*?)<\/h\1>/gi;
    const headings: Array<{level: number, text: string, id: string}> = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, ''); // Remove any HTML tags
      const id = this.generateSlug(text);
      headings.push({ level, text, id });
    }

    return headings;
  }

  /**
   * Extracts keywords from content
   */
  private static extractKeywords(content: string, targetKeyword?: string): string[] {
    const text = content.replace(/<[^>]*>/g, '').toLowerCase();
    const words = text.split(/\s+/);
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3 && !stopWords.has(cleaned)) {
        wordCount.set(cleaned, (wordCount.get(cleaned) || 0) + 1);
      }
    });

    // Get most frequent words
    const keywords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Add target keyword if provided
    if (targetKeyword && !keywords.includes(targetKeyword.toLowerCase())) {
      keywords.unshift(targetKeyword.toLowerCase());
    }

    return keywords;
  }

  /**
   * Generates meta description from content
   */
  private static generateMetaDescription(content: string, title: string): string {
    const text = content.replace(/<[^>]*>/g, '');

    // Remove title from beginning of content first
    const cleanTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titlePattern = new RegExp(`^\\s*${cleanTitle}\\s*`, 'i');
    const cleanedText = text.replace(titlePattern, '').trim();

    const sentences = cleanedText.split(/[.!?]+/);

    let description = '';
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed && (description + trimmed).length < 140) {
        description += (description ? ' ' : '') + trimmed;
      } else {
        break;
      }
    }

    // Generate unique description if empty, don't use title
    if (!description) {
      return `Comprehensive guide with expert insights and practical tips for better results.`;
    }

    return description;
  }

  /**
   * Optimizes title for SEO
   */
  private static optimizeTitle(title: string, targetKeyword?: string): string {
    // Ensure target keyword is in title
    if (targetKeyword && !title.toLowerCase().includes(targetKeyword.toLowerCase())) {
      return `${title} - ${targetKeyword}`;
    }

    // Add power words if title is short
    if (title.length < 40) {
      const powerWords = ['Ultimate', 'Complete', 'Essential', 'Comprehensive', 'Expert'];
      const randomPowerWord = powerWords[Math.floor(Math.random() * powerWords.length)];
      return `${randomPowerWord} ${title}`;
    }

    return title;
  }

  /**
   * Calculates SEO score based on content quality
   */
  private static calculateSEOScore(
    content: string, 
    title: string, 
    options: SEOFormattingOptions
  ): number {
    let score = 0;

    // Title optimization (20 points)
    if (title.length >= 30 && title.length <= 60) score += 10;
    if (options.targetKeyword && title.toLowerCase().includes(options.targetKeyword.toLowerCase())) score += 10;

    // Content length (20 points)
    const wordCount = this.getWordCount(content);
    if (wordCount >= 300) score += 10;
    if (wordCount >= 1000) score += 10;

    // Heading structure (20 points)
    const headings = this.extractHeadings(content);
    if (headings.length >= 3) score += 10;
    if (headings.some(h => h.level === 2)) score += 10;

    // Keyword optimization (20 points)
    if (options.targetKeyword) {
      const keywordRegex = new RegExp(options.targetKeyword, 'gi');
      const matches = content.match(keywordRegex);
      const density = matches ? (matches.length / wordCount) * 100 : 0;
      if (density >= 0.5 && density <= 2.5) score += 20;
    }

    // Formatting and readability (20 points)
    if (content.includes('<strong>')) score += 5;
    if (content.includes('<em>')) score += 5;
    if (content.includes('<ul>') || content.includes('<ol>')) score += 5;
    if (options.anchorText && options.targetUrl) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Gets word count from content
   */
  private static getWordCount(content: string): number {
    return content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generates URL-friendly slug
   */
  private static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
