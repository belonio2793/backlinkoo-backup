/**
 * SEO Auto-Formatting Engine
 * Advanced content formatting with built-in SEO principles and ChatGPT integration
 * Ensures proper headline tagging, content spacing, and keyword optimization
 */

import { formatBlogContent, formatBlogTitle, capitalizeSentences, calculateWordCount } from '@/utils/textFormatting';
import { multiKeyOpenAIService } from '@/services/api/multiKeyOpenAI';

export interface SEOFormattingOptions {
  targetUrl?: string;
  primaryKeywords?: string[];
  secondaryKeywords?: string[];
  contentType?: 'blog' | 'article' | 'guide' | 'review' | 'comparison';
  targetReadingLevel?: 'elementary' | 'middle' | 'high-school' | 'college';
  includeStructuredData?: boolean;
  optimizeForFeaturedSnippets?: boolean;
  addCallToAction?: boolean;
  keywordDensity?: 'low' | 'medium' | 'high';
}

export interface FormattedContent {
  title: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  headingStructure: HeadingAnalysis;
  seoScore: number;
  readabilityScore: number;
  wordCount: number;
  readingTime: number;
  structuredData?: string;
  suggestions: string[];
}

export interface HeadingAnalysis {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  hierarchyValid: boolean;
  keywordUsage: Record<string, number>;
}

export class SEOAutoFormattingEngine {
  private chatGPTService = multiKeyOpenAIService;

  /**
   * Main formatting method that applies all SEO principles
   */
  async formatContent(
    rawContent: string, 
    title: string = '', 
    options: SEOFormattingOptions = {}
  ): Promise<FormattedContent> {
    console.log('🔧 Starting SEO auto-formatting process...');

    const {
      targetUrl = '',
      primaryKeywords = [],
      secondaryKeywords = [],
      contentType = 'article',
      targetReadingLevel = 'high-school',
      includeStructuredData = true,
      optimizeForFeaturedSnippets = true,
      addCallToAction = true,
      keywordDensity = 'medium'
    } = options;

    // Step 1: Basic text formatting
    let formattedContent = formatBlogContent(rawContent);
    let formattedTitle = formatBlogTitle(title);

    // Step 2: Enhanced heading structure optimization
    formattedContent = await this.optimizeHeadingStructure(formattedContent, primaryKeywords);

    // Step 3: Keyword optimization and density control
    formattedContent = this.optimizeKeywordDensity(formattedContent, primaryKeywords, secondaryKeywords, keywordDensity);

    // Step 4: Add proper spacing and line breaks
    formattedContent = this.addProperSpacing(formattedContent);

    // Step 5: Optimize for featured snippets
    if (optimizeForFeaturedSnippets) {
      formattedContent = this.optimizeForFeaturedSnippets(formattedContent, primaryKeywords);
    }

    // Step 6: Add call-to-action if requested
    if (addCallToAction && targetUrl) {
      formattedContent = this.addCallToAction(formattedContent, targetUrl, primaryKeywords[0] || '');
    }

    // Step 7: Generate meta description if not provided
    const metaDescription = await this.generateMetaDescription(formattedContent, primaryKeywords);

    // Step 8: Analyze heading structure
    const headingStructure = this.analyzeHeadingStructure(formattedContent, primaryKeywords);

    // Step 9: Calculate SEO and readability scores
    const seoScore = this.calculateSEOScore(formattedContent, formattedTitle, metaDescription, primaryKeywords, headingStructure);
    const readabilityScore = this.calculateReadabilityScore(formattedContent, targetReadingLevel);

    // Step 10: Generate structured data if requested
    let structuredData: string | undefined;
    if (includeStructuredData) {
      structuredData = this.generateStructuredData(formattedTitle, metaDescription, contentType, targetUrl);
    }

    // Step 11: Generate improvement suggestions
    const suggestions = this.generateSuggestions(formattedContent, formattedTitle, seoScore, readabilityScore, headingStructure);

    const wordCount = calculateWordCount(formattedContent);
    const readingTime = Math.ceil(wordCount / 200);

    console.log('✅ SEO auto-formatting completed:', {
      wordCount,
      seoScore,
      readabilityScore,
      headingStructure: `H1:${headingStructure.h1Count} H2:${headingStructure.h2Count} H3:${headingStructure.h3Count}`,
      suggestionsCount: suggestions.length
    });

    return {
      title: formattedTitle,
      content: formattedContent,
      metaDescription,
      keywords: [...primaryKeywords, ...secondaryKeywords],
      headingStructure,
      seoScore,
      readabilityScore,
      wordCount,
      readingTime,
      structuredData,
      suggestions
    };
  }

  /**
   * Optimize heading structure with proper hierarchy and keyword placement
   */
  private async optimizeHeadingStructure(content: string, keywords: string[]): Promise<string> {
    let optimizedContent = content;

    // Ensure proper H1 usage (only one H1)
    const h1Matches = content.match(/<h1[^>]*>.*?<\/h1>/gi);
    if (h1Matches && h1Matches.length > 1) {
      // Convert additional H1s to H2s
      let firstH1Found = false;
      optimizedContent = optimizedContent.replace(/<h1([^>]*)>(.*?)<\/h1>/gi, (match, attrs, text) => {
        if (!firstH1Found) {
          firstH1Found = true;
          return match;
        }
        return `<h2${attrs}>${text}</h2>`;
      });
    }

    // Add line breaks before and after headings
    optimizedContent = optimizedContent.replace(/(<h[1-6][^>]*>)/gi, '\n\n$1');
    optimizedContent = optimizedContent.replace(/(<\/h[1-6]>)/gi, '$1\n\n');

    // Ensure headings have proper keyword placement
    if (keywords.length > 0) {
      optimizedContent = await this.enhanceHeadingsWithKeywords(optimizedContent, keywords);
    }

    return optimizedContent;
  }

  /**
   * Enhance headings with natural keyword integration using ChatGPT
   */
  private async enhanceHeadingsWithKeywords(content: string, keywords: string[]): Promise<string> {
    try {
      const prompt = `
Analyze the following HTML content and improve the headings to naturally include these keywords: ${keywords.join(', ')}.

Requirements:
1. Keep the heading hierarchy (H1, H2, H3, etc.)
2. Make keywords sound natural, not forced
3. Maintain readability and flow
4. Don't over-optimize (max 1-2 keywords per heading)
5. Preserve the original meaning and structure
6. Add proper line breaks before and after headings

Content to optimize:
${content}

Return only the optimized HTML content with improved headings.`;

      const result = await this.chatGPTService.generateContent(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.3,
        systemPrompt: 'You are an SEO expert who optimizes content headings for better search rankings while maintaining natural readability.'
      });

      if (result.success && result.content) {
        return result.content;
      }
    } catch (error) {
      console.warn('⚠️ ChatGPT heading optimization failed, using fallback:', error);
    }

    // Fallback: Manual keyword enhancement
    return this.manuallyEnhanceHeadings(content, keywords);
  }

  /**
   * Manual heading enhancement fallback
   */
  private manuallyEnhanceHeadings(content: string, keywords: string[]): string {
    let enhancedContent = content;
    const primaryKeyword = keywords[0];

    if (!primaryKeyword) return content;

    // Enhance H2 headings with primary keyword if not already present
    enhancedContent = enhancedContent.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, text) => {
      if (!text.toLowerCase().includes(primaryKeyword.toLowerCase())) {
        // Try to naturally integrate the keyword
        const enhancedText = `${text} for ${primaryKeyword}`;
        return match.replace(text, enhancedText);
      }
      return match;
    });

    return enhancedContent;
  }

  /**
   * Optimize keyword density throughout content
   */
  private optimizeKeywordDensity(
    content: string, 
    primaryKeywords: string[], 
    secondaryKeywords: string[], 
    density: 'low' | 'medium' | 'high'
  ): string {
    if (primaryKeywords.length === 0) return content;

    const densityTargets = {
      low: { primary: 0.8, secondary: 0.3 },
      medium: { primary: 1.5, secondary: 0.5 },
      high: { primary: 2.2, secondary: 0.8 }
    };

    const target = densityTargets[density];
    let optimizedContent = content;

    // Calculate current keyword density
    const wordCount = calculateWordCount(content);
    
    primaryKeywords.forEach(keyword => {
      const currentCount = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      const currentDensity = (currentCount / wordCount) * 100;
      const targetCount = Math.round((target.primary / 100) * wordCount);

      if (currentCount < targetCount) {
        // Need to add more instances
        optimizedContent = this.addKeywordInstances(optimizedContent, keyword, targetCount - currentCount);
      } else if (currentCount > targetCount * 1.5) {
        // Too many instances, reduce some
        optimizedContent = this.reduceKeywordInstances(optimizedContent, keyword, currentCount - targetCount);
      }
    });

    return optimizedContent;
  }

  /**
   * Add keyword instances naturally throughout content
   */
  private addKeywordInstances(content: string, keyword: string, instancesToAdd: number): string {
    // This is a simplified implementation
    // In a real scenario, you'd use more sophisticated NLP to add keywords naturally
    return content;
  }

  /**
   * Reduce keyword instances to avoid over-optimization
   */
  private reduceKeywordInstances(content: string, keyword: string, instancesToRemove: number): string {
    // This is a simplified implementation
    // In a real scenario, you'd replace some keyword instances with synonyms
    return content;
  }

  /**
   * Add proper spacing and line breaks for better readability
   */
  private addProperSpacing(content: string): string {
    let spacedContent = content;

    // Add double line breaks after paragraphs
    spacedContent = spacedContent.replace(/<\/p>/gi, '</p>\n\n');

    // Add line breaks after list items
    spacedContent = spacedContent.replace(/<\/li>/gi, '</li>\n');

    // Add spacing around blockquotes
    spacedContent = spacedContent.replace(/<blockquote/gi, '\n\n<blockquote');
    spacedContent = spacedContent.replace(/<\/blockquote>/gi, '</blockquote>\n\n');

    // Ensure proper spacing around bullet points
    spacedContent = spacedContent.replace(/^- /gm, '\n- ');

    // Clean up excessive whitespace
    spacedContent = spacedContent.replace(/\n{3,}/g, '\n\n');
    spacedContent = spacedContent.trim();

    return spacedContent;
  }

  /**
   * Optimize content for featured snippets
   */
  private optimizeForFeaturedSnippets(content: string, keywords: string[]): string {
    if (keywords.length === 0) return content;

    let optimizedContent = content;
    const primaryKeyword = keywords[0];

    // Add a concise answer section near the beginning
    const answerSection = `
<div class="featured-snippet-optimization">
<h2>Quick Answer: ${primaryKeyword}</h2>
<p><strong>${primaryKeyword}</strong> is a comprehensive topic that involves multiple aspects. This guide provides everything you need to know, including practical steps, best practices, and expert insights to help you succeed.</p>
</div>

`;

    // Insert the quick answer after the first paragraph
    optimizedContent = optimizedContent.replace(/(<p>.*?<\/p>)/, `$1\n\n${answerSection}`);

    // Add FAQ section if not present
    if (!optimizedContent.includes('FAQ') && !optimizedContent.includes('Frequently Asked Questions')) {
      const faqSection = `
<h2>Frequently Asked Questions About ${primaryKeyword}</h2>

<h3>What is ${primaryKeyword}?</h3>
<p>${primaryKeyword} refers to the practices and strategies that help achieve specific goals and outcomes in this domain.</p>

<h3>How do you get started with ${primaryKeyword}?</h3>
<p>Getting started with ${primaryKeyword} involves understanding the fundamentals, identifying your specific needs, and implementing best practices step by step.</p>

<h3>Why is ${primaryKeyword} important?</h3>
<p>${primaryKeyword} is important because it directly impacts results and helps achieve desired outcomes more efficiently and effectively.</p>
`;

      optimizedContent += '\n\n' + faqSection;
    }

    return optimizedContent;
  }

  /**
   * Add call-to-action with natural link integration
   */
  private addCallToAction(content: string, targetUrl: string, keyword: string): string {
    const ctaSection = `
<div class="call-to-action-section">
<h2>Ready to Take Action?</h2>
<p>Now that you understand the fundamentals of ${keyword}, it's time to put this knowledge into practice. For more detailed guidance and expert resources, visit <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">our comprehensive ${keyword} resources</a> to get started today.</p>

<p>Whether you're just beginning your journey or looking to enhance your existing knowledge, having access to quality resources and expert guidance can make all the difference in your success.</p>
</div>
`;

    return content + '\n\n' + ctaSection;
  }

  /**
   * Generate SEO-optimized meta description using ChatGPT
   */
  private async generateMetaDescription(content: string, keywords: string[]): Promise<string> {
    try {
      const prompt = `
Based on the following content, create an SEO-optimized meta description that:
1. Is 150-160 characters long
2. Includes the primary keyword: ${keywords[0] || ''}
3. Is compelling and encourages clicks
4. Accurately summarizes the content
5. Uses action-oriented language

Content excerpt:
${content.substring(0, 500)}...

Return only the meta description text, no quotes or additional formatting.`;

      const result = await this.chatGPTService.generateContent(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0.5,
        systemPrompt: 'You are an SEO copywriter who creates compelling meta descriptions that drive clicks and improve search rankings.'
      });

      if (result.success && result.content) {
        const metaDesc = result.content.trim().replace(/^["']|["']$/g, '');
        if (metaDesc.length <= 160) {
          return metaDesc;
        }
      }
    } catch (error) {
      console.warn('⚠️ ChatGPT meta description generation failed, using fallback:', error);
    }

    // Fallback meta description
    const primaryKeyword = keywords[0] || 'this topic';
    return `Learn everything about ${primaryKeyword} with this comprehensive guide. Get expert tips, best practices, and actionable insights to achieve success.`;
  }

  /**
   * Analyze heading structure and keyword usage
   */
  private analyzeHeadingStructure(content: string, keywords: string[]): HeadingAnalysis {
    const headingCounts = {
      h1Count: (content.match(/<h1[^>]*>/gi) || []).length,
      h2Count: (content.match(/<h2[^>]*>/gi) || []).length,
      h3Count: (content.match(/<h3[^>]*>/gi) || []).length,
      h4Count: (content.match(/<h4[^>]*>/gi) || []).length,
      h5Count: (content.match(/<h5[^>]*>/gi) || []).length,
      h6Count: (content.match(/<h6[^>]*>/gi) || []).length,
    };

    // Check if hierarchy is valid (H1 -> H2 -> H3, etc.)
    const hierarchyValid = headingCounts.h1Count === 1 && headingCounts.h2Count >= 1;

    // Analyze keyword usage in headings
    const keywordUsage: Record<string, number> = {};
    keywords.forEach(keyword => {
      const headingMatches = content.match(new RegExp(`<h[1-6][^>]*>.*?${keyword}.*?</h[1-6]>`, 'gi')) || [];
      keywordUsage[keyword] = headingMatches.length;
    });

    return {
      ...headingCounts,
      hierarchyValid,
      keywordUsage
    };
  }

  /**
   * Calculate comprehensive SEO score
   */
  private calculateSEOScore(
    content: string, 
    title: string, 
    metaDescription: string, 
    keywords: string[], 
    headingStructure: HeadingAnalysis
  ): number {
    let score = 0;

    // Title optimization (20 points)
    if (title.length >= 30 && title.length <= 60) score += 10;
    if (keywords.length > 0 && title.toLowerCase().includes(keywords[0].toLowerCase())) score += 10;

    // Meta description optimization (15 points)
    if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 8;
    if (keywords.length > 0 && metaDescription.toLowerCase().includes(keywords[0].toLowerCase())) score += 7;

    // Content length (15 points)
    const wordCount = calculateWordCount(content);
    if (wordCount >= 1000) score += 15;
    else if (wordCount >= 500) score += 10;
    else if (wordCount >= 300) score += 5;

    // Heading structure (20 points)
    if (headingStructure.h1Count === 1) score += 10;
    if (headingStructure.h2Count >= 2) score += 5;
    if (headingStructure.hierarchyValid) score += 5;

    // Keyword optimization (20 points)
    if (keywords.length > 0) {
      const primaryKeyword = keywords[0];
      const keywordCount = (content.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
      const density = (keywordCount / wordCount) * 100;
      
      if (density >= 0.5 && density <= 2.5) score += 15;
      else if (density >= 0.3 && density <= 3.5) score += 10;
      else if (density > 0) score += 5;
      
      if (headingStructure.keywordUsage[primaryKeyword] > 0) score += 5;
    }

    // Internal/external links (10 points)
    const linkMatches = content.match(/<a [^>]*href/gi) || [];
    if (linkMatches.length >= 2) score += 10;
    else if (linkMatches.length >= 1) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Calculate readability score based on target reading level
   */
  private calculateReadabilityScore(content: string, targetLevel: string): number {
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

    // Convert to target level score
    const targetRanges = {
      'elementary': { min: 90, max: 100 },
      'middle': { min: 70, max: 90 },
      'high-school': { min: 50, max: 70 },
      'college': { min: 30, max: 50 }
    };

    const targetRange = targetRanges[targetLevel] || targetRanges['high-school'];
    
    if (fleschScore >= targetRange.min && fleschScore <= targetRange.max) {
      return 100;
    } else {
      const distance = Math.min(
        Math.abs(fleschScore - targetRange.min),
        Math.abs(fleschScore - targetRange.max)
      );
      return Math.max(0, 100 - distance);
    }
  }

  /**
   * Count syllables in a word (simplified algorithm)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    return Math.max(1, count);
  }

  /**
   * Generate structured data for SEO
   */
  private generateStructuredData(title: string, description: string, contentType: string, url: string): string {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": contentType === 'article' ? 'Article' : 'BlogPosting',
      "headline": title,
      "description": description,
      "url": url,
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "Backlinkoo Expert Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Backlinkoo",
        "logo": {
          "@type": "ImageObject",
          "url": "https://backlinkoo.com/logo.png"
        }
      }
    };

    return JSON.stringify(structuredData, null, 2);
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    content: string, 
    title: string, 
    seoScore: number, 
    readabilityScore: number, 
    headingStructure: HeadingAnalysis
  ): string[] {
    const suggestions: string[] = [];

    if (seoScore < 80) {
      if (title.length < 30) suggestions.push('Consider making your title longer (30-60 characters) for better SEO');
      if (title.length > 60) suggestions.push('Consider shortening your title (30-60 characters) for better SEO');
      if (headingStructure.h1Count !== 1) suggestions.push('Use exactly one H1 heading for optimal SEO');
      if (headingStructure.h2Count < 2) suggestions.push('Add more H2 headings to improve content structure');
      if (calculateWordCount(content) < 1000) suggestions.push('Consider expanding content to at least 1000 words for better search rankings');
    }

    if (readabilityScore < 70) {
      suggestions.push('Consider using shorter sentences and simpler words to improve readability');
      suggestions.push('Break up long paragraphs into smaller, more digestible chunks');
    }

    if (!content.includes('<a ')) {
      suggestions.push('Add relevant internal and external links to improve SEO value');
    }

    return suggestions;
  }
}

export const seoAutoFormattingEngine = new SEOAutoFormattingEngine();
