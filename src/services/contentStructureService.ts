interface ContentSection {
  id: string;
  title: string;
  content: string;
  level: number;
  wordCount: number;
}

interface ContentMetrics {
  totalWords: number;
  readingTime: number;
  headingCount: number;
  paragraphCount: number;
  linkCount: number;
  imageCount: number;
}

interface StructuredContent {
  introduction: string;
  sections: ContentSection[];
  conclusion: string;
  metrics: ContentMetrics;
  tableOfContents: Array<{ id: string; title: string; level: number }>;
}

export class ContentStructureService {
  /**
   * Analyzes and structures HTML content for better readability
   */
  static analyzeContent(htmlContent: string): StructuredContent {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const sections = this.extractSections(tempDiv);
    const metrics = this.calculateMetrics(tempDiv);
    const { introduction, conclusion } = this.extractIntroAndConclusion(tempDiv);
    const tableOfContents = this.generateTableOfContents(sections);

    return {
      introduction,
      sections,
      conclusion,
      metrics,
      tableOfContents
    };
  }

  /**
   * Enhances HTML content with better structure and formatting
   */
  static enhanceContentStructure(htmlContent: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Add IDs to headings for anchor links
    this.addHeadingIds(tempDiv);
    
    // Improve paragraph spacing and formatting
    this.enhanceParagraphs(tempDiv);
    
    // Add reading markers
    this.addReadingMarkers(tempDiv);
    
    // Enhance lists
    this.enhanceLists(tempDiv);
    
    // Add image captions and formatting
    this.enhanceImages(tempDiv);

    return tempDiv.innerHTML;
  }

  /**
   * Extracts sections from content based on headings
   */
  private static extractSections(element: HTMLElement): ContentSection[] {
    const sections: ContentSection[] = [];
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const title = heading.textContent || '';
      const id = this.generateSlug(title);
      
      // Get content between this heading and the next
      let content = '';
      let nextSibling = heading.nextElementSibling;
      const nextHeading = headings[index + 1];
      
      while (nextSibling && nextSibling !== nextHeading) {
        content += nextSibling.outerHTML || '';
        nextSibling = nextSibling.nextElementSibling;
      }

      sections.push({
        id,
        title,
        content,
        level,
        wordCount: this.countWords(content)
      });
    });

    return sections;
  }

  /**
   * Calculates content metrics
   */
  private static calculateMetrics(element: HTMLElement): ContentMetrics {
    const textContent = element.textContent || '';
    const totalWords = this.countWords(textContent);
    const readingTime = Math.ceil(totalWords / 200); // 200 words per minute

    return {
      totalWords,
      readingTime,
      headingCount: element.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      paragraphCount: element.querySelectorAll('p').length,
      linkCount: element.querySelectorAll('a').length,
      imageCount: element.querySelectorAll('img').length
    };
  }

  /**
   * Extracts introduction and conclusion paragraphs
   */
  private static extractIntroAndConclusion(element: HTMLElement): { introduction: string; conclusion: string } {
    const paragraphs = Array.from(element.querySelectorAll('p'));
    const firstHeading = element.querySelector('h1, h2, h3, h4, h5, h6');
    
    // Introduction: paragraphs before the first heading
    let introduction = '';
    if (firstHeading) {
      const introParas = [];
      let currentElement = element.firstElementChild;
      
      while (currentElement && currentElement !== firstHeading) {
        if (currentElement.tagName === 'P') {
          introParas.push(currentElement.outerHTML);
        }
        currentElement = currentElement.nextElementSibling;
      }
      introduction = introParas.join('');
    } else if (paragraphs.length > 0) {
      introduction = paragraphs[0].outerHTML;
    }

    // Conclusion: last paragraph or paragraphs under a conclusion heading
    let conclusion = '';
    const conclusionHeading = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .find(h => /conclusion|summary|final|ending/i.test(h.textContent || ''));
    
    if (conclusionHeading) {
      let nextSibling = conclusionHeading.nextElementSibling;
      while (nextSibling) {
        if (nextSibling.tagName === 'P') {
          conclusion += nextSibling.outerHTML;
        }
        nextSibling = nextSibling.nextElementSibling;
      }
    } else if (paragraphs.length > 0) {
      conclusion = paragraphs[paragraphs.length - 1].outerHTML;
    }

    return { introduction, conclusion };
  }

  /**
   * Generates table of contents from sections
   */
  private static generateTableOfContents(sections: ContentSection[]): Array<{ id: string; title: string; level: number }> {
    return sections.map(section => ({
      id: section.id,
      title: section.title,
      level: section.level
    }));
  }

  /**
   * Adds unique IDs to headings for anchor links
   */
  private static addHeadingIds(element: HTMLElement): void {
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach(heading => {
      if (!heading.id) {
        const title = heading.textContent || '';
        heading.id = this.generateSlug(title);
      }
    });
  }

  /**
   * Enhances paragraph formatting and spacing
   */
  private static enhanceParagraphs(element: HTMLElement): void {
    const paragraphs = element.querySelectorAll('p');
    
    paragraphs.forEach((p, index) => {
      // Add classes for better styling
      p.classList.add('enhanced-paragraph');
      
      // Add drop cap to first paragraph
      if (index === 0 && p.textContent && p.textContent.length > 50) {
        p.classList.add('drop-cap');
      }
      
      // Mark short paragraphs
      if (p.textContent && p.textContent.length < 50) {
        p.classList.add('short-paragraph');
      }
    });
  }

  /**
   * Adds reading progress markers
   */
  private static addReadingMarkers(element: HTMLElement): void {
    const paragraphs = element.querySelectorAll('p');
    const totalParas = paragraphs.length;
    
    paragraphs.forEach((p, index) => {
      const progress = Math.round((index / totalParas) * 100);
      p.setAttribute('data-reading-progress', progress.toString());
    });
  }

  /**
   * Enhances list formatting
   */
  private static enhanceLists(element: HTMLElement): void {
    const lists = element.querySelectorAll('ul, ol');
    
    lists.forEach(list => {
      list.classList.add('enhanced-list');
      
      const items = list.querySelectorAll('li');
      items.forEach((item, index) => {
        item.classList.add('enhanced-list-item');
        item.setAttribute('data-item-index', (index + 1).toString());
      });
    });
  }

  /**
   * Enhances image formatting and adds captions
   */
  private static enhanceImages(element: HTMLElement): void {
    const images = element.querySelectorAll('img');
    
    images.forEach(img => {
      // Wrap image in figure element if not already
      if (img.parentElement?.tagName !== 'FIGURE') {
        const figure = document.createElement('figure');
        figure.classList.add('enhanced-image');
        
        img.parentElement?.insertBefore(figure, img);
        figure.appendChild(img);
        
        // Add caption if alt text exists
        if (img.alt) {
          const caption = document.createElement('figcaption');
          caption.textContent = img.alt;
          caption.classList.add('enhanced-caption');
          figure.appendChild(caption);
        }
      }
    });
  }

  /**
   * Generates a URL-friendly slug from text
   */
  private static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Counts words in text content
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estimates reading time based on word count
   */
  static estimateReadingTime(content: string): number {
    const words = this.countWords(content);
    return Math.ceil(words / 200); // 200 words per minute average
  }

  /**
   * Extracts key sentences for summary generation
   */
  static extractKeySentences(content: string, count: number = 3): string[] {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || '';
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Simple scoring based on sentence length and position
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position bonus (first and last sentences are often important)
      if (index === 0 || index === sentences.length - 1) score += 2;
      
      // Length bonus (medium-length sentences are often better)
      const wordCount = this.countWords(sentence);
      if (wordCount >= 10 && wordCount <= 25) score += 1;
      
      // Keyword bonus (sentences with key terms)
      const keywords = ['important', 'key', 'essential', 'crucial', 'main', 'primary'];
      if (keywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        score += 1;
      }
      
      return { sentence: sentence.trim(), score };
    });
    
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(s => s.sentence);
  }
}
