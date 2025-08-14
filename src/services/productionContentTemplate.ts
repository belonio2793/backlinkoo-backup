/**
 * Production Content Generation Template
 * Formats ChatGPT responses with anchor text and hyperlinks for publishing
 * Similar to blog post theme template but optimized for automation
 */

export interface ContentTemplateParams {
  keyword: string;
  anchor_text: string;
  target_url: string;
  generated_content: string;
  word_count_target?: number;
  tone?: 'professional' | 'casual' | 'expert' | 'friendly';
}

export interface FormattedContent {
  title: string;
  content: string;
  word_count: number;
  meta_description: string;
  formatted_html: string;
  anchor_placements: Array<{
    text: string;
    url: string;
    position: number;
  }>;
}

class ProductionContentTemplate {
  
  /**
   * Format generated content with proper structure and anchor text placement
   */
  formatContent(params: ContentTemplateParams): FormattedContent {
    const {
      keyword,
      anchor_text,
      target_url,
      generated_content,
      word_count_target = 800,
      tone = 'professional'
    } = params;

    // Extract title from generated content or create one
    const title = this.extractOrGenerateTitle(generated_content, keyword);
    
    // Clean and structure the content
    const cleanedContent = this.cleanGeneratedContent(generated_content);
    
    // Add strategic anchor text placements
    const contentWithAnchors = this.insertAnchorTexts(
      cleanedContent,
      anchor_text,
      target_url,
      keyword
    );
    
    // Apply blog-style formatting
    const formattedContent = this.applyBlogFormatting(contentWithAnchors, title);
    
    // Generate HTML version
    const htmlContent = this.generateHTML(formattedContent, title);
    
    // Create meta description
    const metaDescription = this.generateMetaDescription(cleanedContent, keyword);
    
    // Track anchor placements
    const anchorPlacements = this.findAnchorPlacements(contentWithAnchors, anchor_text, target_url);
    
    return {
      title,
      content: formattedContent,
      word_count: this.countWords(formattedContent),
      meta_description: metaDescription,
      formatted_html: htmlContent,
      anchor_placements: anchorPlacements
    };
  }

  /**
   * Extract title from content or generate one based on keyword
   */
  private extractOrGenerateTitle(content: string, keyword: string): string {
    // Look for existing title patterns
    const titlePatterns = [
      /^#\s+(.+?)$/m,
      /^(.+?)\n=/m,
      /^(.+?)\n-/m,
      /^(.+?)(?:\n\n)/m
    ];

    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const extractedTitle = match[1].trim();
        if (extractedTitle.length > 10 && extractedTitle.length < 100) {
          return this.enhanceTitle(extractedTitle, keyword);
        }
      }
    }

    // Generate title based on keyword
    return this.generateTitleFromKeyword(keyword);
  }

  /**
   * Enhance title with keyword optimization
   */
  private enhanceTitle(title: string, keyword: string): string {
    // Ensure title includes keyword naturally
    const lowerTitle = title.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    
    if (!lowerTitle.includes(lowerKeyword)) {
      // Add keyword naturally to title
      const titleWords = title.split(' ');
      if (titleWords.length > 3) {
        titleWords.splice(2, 0, `${keyword}:`);
        return titleWords.join(' ');
      } else {
        return `${title}: ${keyword} Guide`;
      }
    }
    
    return title;
  }

  /**
   * Generate title from keyword
   */
  private generateTitleFromKeyword(keyword: string): string {
    const titleTemplates = [
      `The Complete Guide to ${keyword}`,
      `${keyword}: Everything You Need to Know`,
      `Mastering ${keyword} in 2024`,
      `${keyword}: Best Practices and Tips`,
      `Understanding ${keyword}: A Comprehensive Overview`,
      `${keyword} Explained: Expert Insights and Strategies`
    ];
    
    return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  }

  /**
   * Clean and prepare generated content
   */
  private cleanGeneratedContent(content: string): string {
    let cleaned = content
      // Remove multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove leading/trailing whitespace
      .trim()
      // Remove common AI disclaimers
      .replace(/^(As an AI|I'm an AI|As a language model).*?\n/gim, '')
      .replace(/^(Please note|It's important to note|Disclaimer).*?\n/gim, '')
      // Remove title if it's on the first line (we'll handle separately)
      .replace(/^#.*?\n/, '')
      // Fix spacing around headers
      .replace(/\n(#{1,6}\s)/g, '\n\n$1')
      .replace(/(#{1,6}.*?)\n([^#\n])/g, '$1\n\n$2');
    
    return cleaned;
  }

  /**
   * Strategically insert anchor texts throughout content
   */
  private insertAnchorTexts(
    content: string,
    anchor_text: string,
    target_url: string,
    keyword: string
  ): string {
    const paragraphs = content.split('\n\n');
    const totalParagraphs = paragraphs.length;
    
    // Calculate optimal anchor placement positions
    const anchorPositions = this.calculateAnchorPositions(totalParagraphs);
    
    let processedContent = '';
    
    paragraphs.forEach((paragraph, index) => {
      let processedParagraph = paragraph;
      
      // Insert anchor text at strategic positions
      if (anchorPositions.includes(index) && !paragraph.startsWith('#')) {
        processedParagraph = this.insertAnchorInParagraph(
          paragraph,
          anchor_text,
          target_url,
          keyword
        );
      }
      
      processedContent += processedParagraph + '\n\n';
    });
    
    return processedContent.trim();
  }

  /**
   * Calculate optimal positions for anchor text placement
   */
  private calculateAnchorPositions(totalParagraphs: number): number[] {
    const positions: number[] = [];
    
    if (totalParagraphs < 3) {
      // For short content, place in middle
      positions.push(Math.floor(totalParagraphs / 2));
    } else if (totalParagraphs < 6) {
      // For medium content, place in first third and last third
      positions.push(Math.floor(totalParagraphs / 3));
      positions.push(Math.floor(totalParagraphs * 2 / 3));
    } else {
      // For longer content, place strategically throughout
      positions.push(Math.floor(totalParagraphs * 0.25)); // First quarter
      positions.push(Math.floor(totalParagraphs * 0.5));  // Middle
      positions.push(Math.floor(totalParagraphs * 0.75)); // Last quarter
    }
    
    return positions;
  }

  /**
   * Insert anchor text naturally within a paragraph
   */
  private insertAnchorInParagraph(
    paragraph: string,
    anchor_text: string,
    target_url: string,
    keyword: string
  ): string {
    // Create variations of anchor text for natural placement
    const anchorVariations = [
      anchor_text,
      `learn more about ${keyword}`,
      `discover ${keyword} solutions`,
      `explore ${keyword} options`,
      `find the best ${keyword}`,
      `check out these ${keyword} tools`
    ];
    
    const selectedAnchor = anchorVariations[Math.floor(Math.random() * anchorVariations.length)];
    
    const sentences = paragraph.split(/\. /);
    if (sentences.length < 2) {
      // Short paragraph, append anchor text naturally
      return `${paragraph} You can [${selectedAnchor}](${target_url}) for more detailed information.`;
    }
    
    // Find best position for anchor text
    const middleIndex = Math.floor(sentences.length / 2);
    const targetSentence = sentences[middleIndex];
    
    // Insert anchor text contextually
    const anchorPhrase = ` To [${selectedAnchor}](${target_url}), `;
    const insertPosition = targetSentence.length > 50 ? 
      Math.floor(targetSentence.length / 2) : 
      targetSentence.length;
    
    sentences[middleIndex] = 
      targetSentence.slice(0, insertPosition) + 
      anchorPhrase + 
      targetSentence.slice(insertPosition);
    
    return sentences.join('. ');
  }

  /**
   * Apply blog-style formatting to content
   */
  private applyBlogFormatting(content: string, title: string): string {
    let formatted = content;
    
    // Ensure proper heading hierarchy
    formatted = this.normalizeHeadings(formatted);
    
    // Add introduction if missing
    if (!this.hasIntroduction(formatted)) {
      formatted = this.addIntroduction(formatted, title);
    }
    
    // Enhance lists
    formatted = this.enhanceLists(formatted);
    
    // Add conclusion if missing
    if (!this.hasConclusion(formatted)) {
      formatted = this.addConclusion(formatted, title);
    }
    
    return formatted;
  }

  /**
   * Normalize heading structure
   */
  private normalizeHeadings(content: string): string {
    return content
      // Ensure H2s start sections
      .replace(/^### /gm, '## ')
      // Add spacing around headings
      .replace(/\n(#{2,6})/g, '\n\n$1')
      .replace(/(#{2,6}.*?)\n([^#\n])/g, '$1\n\n$2');
  }

  /**
   * Check if content has introduction
   */
  private hasIntroduction(content: string): boolean {
    const firstParagraph = content.split('\n\n')[0];
    return firstParagraph && !firstParagraph.startsWith('#') && firstParagraph.length > 100;
  }

  /**
   * Add introduction paragraph
   */
  private addIntroduction(content: string, title: string): string {
    const intro = `In today's digital landscape, understanding and implementing effective strategies is crucial for success. This comprehensive guide explores the key concepts and practical applications that will help you achieve your goals.\n\n`;
    return intro + content;
  }

  /**
   * Enhance list formatting
   */
  private enhanceLists(content: string): string {
    return content
      // Improve bullet points
      .replace(/^\* /gm, '• ')
      .replace(/^- /gm, '• ')
      // Add spacing around lists
      .replace(/\n(•|\d+\.)/g, '\n\n$1')
      .replace(/(•.*?)\n([^•\d\n])/g, '$1\n\n$2');
  }

  /**
   * Check if content has conclusion
   */
  private hasConclusion(content: string): boolean {
    const lastParagraphs = content.split('\n\n').slice(-2);
    return lastParagraphs.some(p => 
      p.toLowerCase().includes('conclusion') ||
      p.toLowerCase().includes('in summary') ||
      p.toLowerCase().includes('to conclude') ||
      p.toLowerCase().includes('in conclusion')
    );
  }

  /**
   * Add conclusion section
   */
  private addConclusion(content: string, title: string): string {
    const conclusion = `\n\n## Conclusion\n\nImplementing these strategies effectively requires dedication and consistent effort. By following the guidelines outlined in this comprehensive guide, you'll be well-equipped to achieve success in your endeavors. Remember that continuous learning and adaptation are key to staying ahead in today's competitive environment.`;
    return content + conclusion;
  }

  /**
   * Generate HTML version of content
   */
  private generateHTML(content: string, title: string): string {
    // Convert markdown to HTML
    let html = content
      // Headers
      .replace(/^## (.+?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+?)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+?)$/gm, '<h4>$1</h4>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^• (.+?)$/gm, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Wrap in paragraphs
      .replace(/^([^<].+?)$/gm, '<p>$1</p>')
      // Clean up list formatting
      .replace(/(<\/p>)?<li>/g, '<li>')
      .replace(/<\/li>(<p>)?/g, '</li>');

    // Wrap lists properly
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    
    // Clean up paragraph wrapping around headers
    html = html.replace(/<p>(<h[2-6]>.*?<\/h[2-6]>)<\/p>/g, '$1');
    
    return `
      <article class="modern-blog-content">
        <header>
          <h1>${title}</h1>
        </header>
        <div class="content">
          ${html}
        </div>
      </article>
    `;
  }

  /**
   * Generate meta description
   */
  private generateMetaDescription(content: string, keyword: string): string {
    const firstParagraph = content.split('\n\n')[0];
    let description = firstParagraph.substring(0, 150);
    
    // Ensure keyword is included
    if (!description.toLowerCase().includes(keyword.toLowerCase())) {
      description = `Discover comprehensive insights about ${keyword}. ${description}`;
    }
    
    // Clean up and add ellipsis if needed
    if (description.length === 150) {
      description = description.substring(0, 147) + '...';
    }
    
    return description;
  }

  /**
   * Find and track anchor placements
   */
  private findAnchorPlacements(content: string, anchor_text: string, target_url: string): Array<{
    text: string;
    url: string;
    position: number;
  }> {
    const placements: Array<{ text: string; url: string; position: number }> = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      if (match[2] === target_url) {
        placements.push({
          text: match[1],
          url: match[2],
          position: match.index || 0
        });
      }
    }
    
    return placements;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * Validate formatted content quality
   */
  validateContent(formattedContent: FormattedContent): {
    isValid: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 100;

    // Check word count
    if (formattedContent.word_count < 300) {
      issues.push('Content too short (less than 300 words)');
      score -= 20;
    }

    // Check anchor placements
    if (formattedContent.anchor_placements.length === 0) {
      issues.push('No anchor text placements found');
      score -= 30;
    } else if (formattedContent.anchor_placements.length > 5) {
      issues.push('Too many anchor text placements (over-optimization)');
      score -= 15;
    }

    // Check title quality
    if (formattedContent.title.length < 20 || formattedContent.title.length > 80) {
      issues.push('Title length not optimal (should be 20-80 characters)');
      score -= 10;
    }

    // Check meta description
    if (formattedContent.meta_description.length < 120 || formattedContent.meta_description.length > 160) {
      issues.push('Meta description length not optimal (should be 120-160 characters)');
      score -= 10;
    }

    // Check content structure
    if (!formattedContent.content.includes('##')) {
      issues.push('No section headings found (poor structure)');
      score -= 15;
    }

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, score)
    };
  }
}

export const productionContentTemplate = new ProductionContentTemplate();
export default productionContentTemplate;
