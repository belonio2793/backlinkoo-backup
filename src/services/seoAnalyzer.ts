/**
 * SEO Analyzer Service
 * Calculates comprehensive SEO scores based on content analysis
 */

export interface SEOAnalysisResult {
  overallScore: number; // 0-100
  titleScore: number; // 0-100
  contentScore: number; // 0-100
  keywordScore: number; // 0-100
  structureScore: number; // 0-100
  readabilityScore: number; // 0-100
  metaScore: number; // 0-100
  recommendations: string[];
  details: {
    title: {
      length: number;
      optimalLength: boolean;
      hasKeywords: boolean;
      isDescriptive: boolean;
    };
    content: {
      wordCount: number;
      optimalLength: boolean;
      hasHeadings: boolean;
      hasList: boolean;
      keywordDensity: number;
      readingLevel: string;
    };
    structure: {
      hasH1: boolean;
      hasH2: boolean;
      hasH3: boolean;
      paragraphCount: number;
      averageParagraphLength: number;
    };
    meta: {
      hasMetaDescription: boolean;
      metaDescriptionLength: number;
      hasTargetKeyword: boolean;
    };
  };
}

export class SEOAnalyzer {
  /**
   * Analyze content and calculate SEO score
   */
  static analyzeBlogPost(
    title: string,
    content: string,
    metaDescription?: string,
    targetKeyword?: string
  ): SEOAnalysisResult {
    const titleAnalysis = this.analyzeTitle(title, targetKeyword);
    const contentAnalysis = this.analyzeContent(content, targetKeyword);
    const structureAnalysis = this.analyzeStructure(content);
    const readabilityAnalysis = this.analyzeReadability(content);
    const metaAnalysis = this.analyzeMeta(metaDescription, targetKeyword);

    const recommendations: string[] = [];

    // Calculate individual scores
    const titleScore = this.calculateTitleScore(titleAnalysis, recommendations);
    const contentScore = this.calculateContentScore(contentAnalysis, recommendations);
    const structureScore = this.calculateStructureScore(structureAnalysis, recommendations);
    const readabilityScore = this.calculateReadabilityScore(readabilityAnalysis, recommendations);
    const metaScore = this.calculateMetaScore(metaAnalysis, recommendations);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      titleScore * 0.25 +
      contentScore * 0.30 +
      structureScore * 0.20 +
      readabilityScore * 0.15 +
      metaScore * 0.10
    );

    return {
      overallScore,
      titleScore,
      contentScore,
      keywordScore: this.calculateKeywordScore(content, targetKeyword),
      structureScore,
      readabilityScore,
      metaScore,
      recommendations,
      details: {
        title: titleAnalysis,
        content: contentAnalysis,
        structure: structureAnalysis,
        meta: metaAnalysis
      }
    };
  }

  /**
   * Analyze title for SEO optimization
   */
  private static analyzeTitle(title: string, targetKeyword?: string) {
    const length = title.length;
    const optimalLength = length >= 30 && length <= 60;
    const hasKeywords = targetKeyword ? title.toLowerCase().includes(targetKeyword.toLowerCase()) : false;
    const isDescriptive = this.isDescriptiveTitle(title);

    return {
      length,
      optimalLength,
      hasKeywords,
      isDescriptive
    };
  }

  /**
   * Analyze content for SEO optimization
   */
  private static analyzeContent(content: string, targetKeyword?: string) {
    const cleanContent = this.stripHtml(content);
    const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const optimalLength = wordCount >= 300 && wordCount <= 3000;
    const hasHeadings = /<h[1-6]>/i.test(content);
    const hasList = /<(ul|ol)>/i.test(content);
    
    let keywordDensity = 0;
    if (targetKeyword) {
      const keywordOccurrences = (cleanContent.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), 'g')) || []).length;
      keywordDensity = (keywordOccurrences / wordCount) * 100;
    }

    const readingLevel = this.calculateReadingLevel(cleanContent);

    return {
      wordCount,
      optimalLength,
      hasHeadings,
      hasList,
      keywordDensity,
      readingLevel
    };
  }

  /**
   * Analyze content structure
   */
  private static analyzeStructure(content: string) {
    const hasH1 = /<h1>/i.test(content);
    const hasH2 = /<h2>/i.test(content);
    const hasH3 = /<h3>/i.test(content);
    
    const paragraphs = content.split(/<\/p>/i).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    
    const avgLength = paragraphs.reduce((sum, p) => {
      const cleanP = this.stripHtml(p);
      return sum + cleanP.length;
    }, 0) / Math.max(paragraphCount, 1);

    return {
      hasH1,
      hasH2,
      hasH3,
      paragraphCount,
      averageParagraphLength: Math.round(avgLength)
    };
  }

  /**
   * Analyze readability
   */
  private static analyzeReadability(content: string) {
    const cleanContent = this.stripHtml(content);
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = cleanContent.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    // Flesch Reading Ease Score
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgSyllablesPerWord = syllables / Math.max(words.length, 1);
    
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    let readingLevel = 'Graduate';
    if (fleschScore >= 90) readingLevel = 'Very Easy';
    else if (fleschScore >= 80) readingLevel = 'Easy';
    else if (fleschScore >= 70) readingLevel = 'Fairly Easy';
    else if (fleschScore >= 60) readingLevel = 'Standard';
    else if (fleschScore >= 50) readingLevel = 'Fairly Difficult';
    else if (fleschScore >= 30) readingLevel = 'Difficult';

    return {
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      readingLevel,
      avgWordsPerSentence,
      avgSyllablesPerWord
    };
  }

  /**
   * Analyze meta description
   */
  private static analyzeMeta(metaDescription?: string, targetKeyword?: string) {
    const hasMetaDescription = !!metaDescription && metaDescription.length > 0;
    const metaDescriptionLength = metaDescription?.length || 0;
    const hasTargetKeyword = targetKeyword && metaDescription ? 
      metaDescription.toLowerCase().includes(targetKeyword.toLowerCase()) : false;

    return {
      hasMetaDescription,
      metaDescriptionLength,
      hasTargetKeyword
    };
  }

  /**
   * Calculate title score
   */
  private static calculateTitleScore(analysis: any, recommendations: string[]): number {
    let score = 0;

    if (analysis.optimalLength) {
      score += 40;
    } else {
      recommendations.push(`Title should be 30-60 characters (currently ${analysis.length})`);
    }

    if (analysis.hasKeywords) {
      score += 30;
    } else {
      recommendations.push('Include target keyword in title');
    }

    if (analysis.isDescriptive) {
      score += 30;
    } else {
      recommendations.push('Make title more descriptive and engaging');
    }

    return Math.min(100, score);
  }

  /**
   * Calculate content score
   */
  private static calculateContentScore(analysis: any, recommendations: string[]): number {
    let score = 0;

    if (analysis.optimalLength) {
      score += 30;
    } else {
      recommendations.push(`Content should be 300-3000 words (currently ${analysis.wordCount})`);
    }

    if (analysis.hasHeadings) {
      score += 25;
    } else {
      recommendations.push('Add heading tags (H2, H3) to structure content');
    }

    if (analysis.hasList) {
      score += 15;
    } else {
      recommendations.push('Consider adding bullet points or numbered lists');
    }

    if (analysis.keywordDensity >= 0.5 && analysis.keywordDensity <= 3) {
      score += 30;
    } else if (analysis.keywordDensity > 0) {
      recommendations.push(`Keyword density is ${analysis.keywordDensity.toFixed(1)}% (optimal: 0.5-3%)`);
    } else {
      recommendations.push('Include target keyword naturally in content');
    }

    return Math.min(100, score);
  }

  /**
   * Calculate structure score
   */
  private static calculateStructureScore(analysis: any, recommendations: string[]): number {
    let score = 0;

    if (analysis.hasH1) {
      score += 25;
    } else {
      recommendations.push('Add an H1 heading tag');
    }

    if (analysis.hasH2) {
      score += 25;
    } else {
      recommendations.push('Add H2 heading tags for better structure');
    }

    if (analysis.hasH3) {
      score += 20;
    }

    if (analysis.paragraphCount >= 3) {
      score += 15;
    } else {
      recommendations.push('Break content into more paragraphs for better readability');
    }

    if (analysis.averageParagraphLength <= 150) {
      score += 15;
    } else {
      recommendations.push('Shorten paragraphs for better readability');
    }

    return Math.min(100, score);
  }

  /**
   * Calculate readability score
   */
  private static calculateReadabilityScore(analysis: any, recommendations: string[]): number {
    let score = 0;

    if (analysis.fleschScore >= 60) {
      score += 50;
    } else {
      recommendations.push('Improve readability by using shorter sentences and simpler words');
    }

    if (analysis.avgWordsPerSentence <= 20) {
      score += 25;
    } else {
      recommendations.push('Use shorter sentences for better readability');
    }

    if (analysis.avgSyllablesPerWord <= 1.6) {
      score += 25;
    } else {
      recommendations.push('Use simpler words with fewer syllables');
    }

    return Math.min(100, score);
  }

  /**
   * Calculate meta score
   */
  private static calculateMetaScore(analysis: any, recommendations: string[]): number {
    let score = 0;

    if (analysis.hasMetaDescription) {
      score += 50;
      
      if (analysis.metaDescriptionLength >= 150 && analysis.metaDescriptionLength <= 160) {
        score += 25;
      } else {
        recommendations.push(`Meta description should be 150-160 characters (currently ${analysis.metaDescriptionLength})`);
      }

      if (analysis.hasTargetKeyword) {
        score += 25;
      } else {
        recommendations.push('Include target keyword in meta description');
      }
    } else {
      recommendations.push('Add a meta description for better SEO');
    }

    return Math.min(100, score);
  }

  /**
   * Calculate keyword score
   */
  private static calculateKeywordScore(content: string, targetKeyword?: string): number {
    if (!targetKeyword) return 50; // Neutral score if no keyword provided

    const cleanContent = this.stripHtml(content).toLowerCase();
    const keyword = targetKeyword.toLowerCase();
    const wordCount = cleanContent.split(/\s+/).length;
    const keywordOccurrences = (cleanContent.match(new RegExp(keyword, 'g')) || []).length;
    const density = (keywordOccurrences / wordCount) * 100;

    if (density >= 0.5 && density <= 3) return 100;
    if (density >= 0.1 && density <= 5) return 75;
    if (density > 0) return 50;
    return 0;
  }

  /**
   * Helper methods
   */
  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private static isDescriptiveTitle(title: string): boolean {
    const descriptiveWords = ['how', 'what', 'why', 'when', 'where', 'guide', 'tips', 'best', 'top', 'ultimate', 'complete'];
    const lowerTitle = title.toLowerCase();
    return descriptiveWords.some(word => lowerTitle.includes(word)) || title.length > 20;
  }

  private static countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllableCount = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllableCount++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      syllableCount--;
    }
    
    return Math.max(1, syllableCount);
  }

  private static calculateReadingLevel(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    
    if (avgWordsPerSentence <= 10) return 'Easy';
    if (avgWordsPerSentence <= 15) return 'Standard';
    if (avgWordsPerSentence <= 20) return 'Difficult';
    return 'Very Difficult';
  }
}
