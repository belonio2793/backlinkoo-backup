/**
 * Enhanced Content Generator with SEO Auto-Formatting
 * Integrates ChatGPT content generation with advanced SEO formatting
 * Implements intent-based logic and keyword relevance optimization
 */

import { openAIService } from '@/services/api/openai';
import { seoAutoFormattingEngine, type SEOFormattingOptions, type FormattedContent } from './seoAutoFormattingEngine';
import { formatBlogTitle } from '@/utils/textFormatting';
import { supabase } from '@/integrations/supabase/client';

export interface ContentGenerationRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  secondaryKeywords?: string[];
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'authoritative' | 'friendly' | 'academic';
  contentType?: 'how-to' | 'guide' | 'review' | 'comparison' | 'listicle' | 'news';
  targetAudience?: 'beginners' | 'intermediate' | 'advanced' | 'general';
  includeCallToAction?: boolean;
  optimizeForFeaturedSnippets?: boolean;
  keywordDensity?: 'low' | 'medium' | 'high';
}

export interface GeneratedContentResult {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  wordCount: number;
  readingTime: number;
  seoScore: number;
  readabilityScore: number;
  structuredData?: string;
  suggestions: string[];
  publishedUrl?: string;
  anchorText: string;
  targetUrl: string;
}

export class EnhancedContentGenerator {
  private chatGPTService = openAIService;

  /**
   * Generate high-quality content with advanced SEO optimization
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContentResult> {
    console.log('🚀 Starting enhanced content generation with SEO optimization...');

    const {
      targetUrl,
      primaryKeyword,
      anchorText = primaryKeyword,
      secondaryKeywords = [],
      wordCount = 1500,
      tone = 'professional',
      contentType = 'guide',
      targetAudience = 'general',
      includeCallToAction = true,
      optimizeForFeaturedSnippets = true,
      keywordDensity = 'medium'
    } = request;

    try {
      // Step 1: Generate raw content using ChatGPT with intent-based prompts
      const rawContent = await this.generateRawContent(request);

      // Step 2: Generate SEO-optimized title
      const title = await this.generateSEOTitle(primaryKeyword, contentType, targetAudience);

      // Step 3: Apply SEO auto-formatting engine
      const seoOptions: SEOFormattingOptions = {
        targetUrl,
        primaryKeywords: [primaryKeyword],
        secondaryKeywords,
        contentType: this.mapContentTypeForSEO(contentType),
        targetReadingLevel: this.mapAudienceToReadingLevel(targetAudience),
        includeStructuredData: true,
        optimizeForFeaturedSnippets,
        addCallToAction: includeCallToAction,
        keywordDensity
      };

      const formattedContent = await seoAutoFormattingEngine.formatContent(
        rawContent,
        title,
        seoOptions
      );

      // Step 4: Generate URL-friendly slug
      const slug = this.generateSlug(primaryKeyword, title);

      // Step 5: Integrate backlink naturally into content
      const contentWithBacklink = this.integrateBacklink(
        formattedContent.content,
        targetUrl,
        anchorText,
        primaryKeyword
      );

      // Step 6: Final content optimization
      const finalContent = await this.finalizeContent(contentWithBacklink, request);

      console.log('✅ Enhanced content generation completed:', {
        wordCount: formattedContent.wordCount,
        seoScore: formattedContent.seoScore,
        readabilityScore: formattedContent.readabilityScore,
        slug
      });

      return {
        title: formattedContent.title,
        slug,
        content: finalContent,
        metaDescription: formattedContent.metaDescription,
        keywords: formattedContent.keywords,
        wordCount: formattedContent.wordCount,
        readingTime: formattedContent.readingTime,
        seoScore: formattedContent.seoScore,
        readabilityScore: formattedContent.readabilityScore,
        structuredData: formattedContent.structuredData,
        suggestions: formattedContent.suggestions,
        anchorText,
        targetUrl
      };

    } catch (error) {
      console.error('❌ Enhanced content generation failed:', error);
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate raw content using ChatGPT with intent-based prompts
   */
  private async generateRawContent(request: ContentGenerationRequest): Promise<string> {
    const {
      primaryKeyword,
      secondaryKeywords = [],
      wordCount,
      tone,
      contentType,
      targetAudience,
      targetUrl
    } = request;

    // Create intent-based prompt that ensures quality and relevance
    const prompt = this.createIntentBasedPrompt(request);

    const result = await this.chatGPTService.generateContent(prompt, {
      model: 'gpt-4',
      maxTokens: Math.min(4000, Math.ceil(wordCount * 1.5)), // Allow for more tokens for longer content
      temperature: this.getToneTemperature(tone),
      systemPrompt: this.getSystemPrompt(contentType, targetAudience)
    });

    if (!result.success || !result.content) {
      throw new Error(`ChatGPT content generation failed: ${result.error || 'No content generated'}`);
    }

    // Validate content quality
    if (result.content.length < 500) {
      throw new Error('Generated content is too short. Please try again with different parameters.');
    }

    // Check for keyword relevance
    if (!this.validateKeywordRelevance(result.content, primaryKeyword, secondaryKeywords)) {
      throw new Error('Generated content does not adequately cover the specified keywords. Please try again.');
    }

    return result.content;
  }

  /**
   * Create intent-based prompt for high-quality content generation
   */
  private createIntentBasedPrompt(request: ContentGenerationRequest): string {
    const {
      primaryKeyword,
      secondaryKeywords = [],
      wordCount,
      tone,
      contentType,
      targetAudience,
      targetUrl
    } = request;

    // Analyze target URL domain to understand context
    const domain = this.extractDomain(targetUrl);
    const urlContext = this.analyzeUrlContext(targetUrl);

    const prompt = `
Create a comprehensive ${wordCount}-word ${contentType} about "${primaryKeyword}" with the following specifications:

CONTENT REQUIREMENTS:
- Primary focus: ${primaryKeyword}
- Secondary topics: ${secondaryKeywords.join(', ')}
- Target audience: ${targetAudience}
- Tone: ${tone}
- Content type: ${contentType}
- Word count: Approximately ${wordCount} words

INTENT & PURPOSE:
- The content should serve users searching for "${primaryKeyword}" information
- Address the specific problems and questions people have about this topic
- Provide actionable, valuable insights that users can immediately apply
- Context: This content will link to ${domain} which appears to be ${urlContext}

SEO & STRUCTURE REQUIREMENTS:
- Use proper HTML heading hierarchy (H1, H2, H3)
- Include an engaging introduction that hooks the reader
- Organize content with clear sections and subsections
- Add practical examples, tips, and actionable advice
- Include a strong conclusion that summarizes key points
- Natural keyword integration throughout (avoid keyword stuffing)

QUALITY STANDARDS:
- Write for humans first, search engines second
- Ensure content is factually accurate and up-to-date
- Make it engaging and easy to read with varied sentence lengths
- Include specific, actionable advice rather than generic information
- Ensure content matches the expertise level of the target audience

TARGET KEYWORDS TO NATURALLY INCLUDE:
- Primary: ${primaryKeyword}
- Secondary: ${secondaryKeywords.join(', ')}

CONTENT STRUCTURE:
1. Compelling introduction that addresses user intent
2. Main sections with detailed explanations
3. Practical tips and actionable advice
4. Real-world examples and case studies
5. Common mistakes to avoid
6. Best practices and expert recommendations
7. Conclusion with key takeaways

Please create content that genuinely helps users while naturally supporting SEO goals. Focus on providing real value rather than just hitting keyword targets.

Return only the HTML-formatted content with proper heading structure and paragraphs.
`;

    return prompt;
  }

  /**
   * Get system prompt based on content type and audience
   */
  private getSystemPrompt(contentType: string, targetAudience: string): string {
    const expertiseLevel = {
      beginners: 'basic concepts with clear explanations',
      intermediate: 'detailed information with some technical depth',
      advanced: 'comprehensive technical coverage with expert insights',
      general: 'accessible information suitable for most readers'
    };

    const contentTypeInstructions = {
      'how-to': 'step-by-step instructional content with clear actionable steps',
      'guide': 'comprehensive informational content with detailed explanations',
      'review': 'evaluative content with pros, cons, and recommendations',
      'comparison': 'side-by-side analysis with clear comparisons',
      'listicle': 'numbered or bulleted list format with detailed explanations',
      'news': 'timely, factual content with current information'
    };

    return `You are an expert content writer specializing in creating ${contentTypeInstructions[contentType] || 'high-quality informational content'} for ${targetAudience} audience. Focus on ${expertiseLevel[targetAudience] || 'clear, helpful information'}. Always prioritize user value and natural readability while incorporating SEO best practices organically.`;
  }

  /**
   * Get temperature setting based on tone
   */
  private getToneTemperature(tone: string): number {
    const temperatureMap = {
      professional: 0.3,
      casual: 0.7,
      authoritative: 0.2,
      friendly: 0.6,
      academic: 0.1
    };

    return temperatureMap[tone] || 0.5;
  }

  /**
   * Generate SEO-optimized title using ChatGPT
   */
  private async generateSEOTitle(keyword: string, contentType: string, audience: string): Promise<string> {
    const prompt = `
Create an SEO-optimized title for a ${contentType} about "${keyword}" targeting ${audience} audience.

Requirements:
- 50-60 characters for optimal SEO
- Include the primary keyword "${keyword}"
- Make it compelling and click-worthy
- Match the content type (${contentType})
- Appeal to ${audience} readers

Return only the title text, no quotes or additional formatting.
`;

    try {
      const result = await this.chatGPTService.generateContent(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 50,
        temperature: 0.5,
        systemPrompt: 'You are an SEO expert who creates compelling, click-worthy titles that rank well in search engines.'
      });

      if (result.success && result.content) {
        const title = result.content.trim().replace(/^["']|["']$/g, '');
        if (title.length <= 70) {
          return formatBlogTitle(title);
        }
      }
    } catch (error) {
      console.warn('⚠️ ChatGPT title generation failed, using fallback:', error);
    }

    // Fallback title generation
    const titleTemplates = {
      'how-to': `How to Master ${keyword}: Complete ${audience} Guide`,
      'guide': `Ultimate ${keyword} Guide for ${audience}`,
      'review': `${keyword} Review: Is It Worth It?`,
      'comparison': `${keyword} vs Alternatives: Complete Comparison`,
      'listicle': `Top ${keyword} Tips Every ${audience} Should Know`,
      'news': `Latest ${keyword} Updates and Trends`
    };

    return formatBlogTitle(titleTemplates[contentType] || `Complete ${keyword} Guide`);
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(keyword: string, title: string): string {
    // Use title for more descriptive slug, fallback to keyword
    const baseText = title || keyword;
    
    return baseText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50); // Limit slug length
  }

  /**
   * Integrate backlink naturally into content
   */
  private integrateBacklink(content: string, targetUrl: string, anchorText: string, keyword: string): string {
    // Find natural places to insert the backlink
    const insertionPoints = this.findNaturalBacklinkPoints(content, keyword);
    
    if (insertionPoints.length === 0) {
      // Add a natural backlink at the end if no good insertion points found
      const backlinkSentence = `For more detailed information and expert resources on ${keyword}, visit <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a> to learn more.`;
      return content + '\n\n<p>' + backlinkSentence + '</p>';
    }

    // Insert backlink at the best natural point
    const insertionPoint = insertionPoints[0];
    const backlink = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
    
    return content.replace(insertionPoint.text, insertionPoint.text.replace(anchorText, backlink));
  }

  /**
   * Find natural points to insert backlinks
   */
  private findNaturalBacklinkPoints(content: string, keyword: string): Array<{ text: string; position: number }> {
    const points: Array<{ text: string; position: number }> = [];
    
    // Look for sentences that mention the keyword or related terms
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    
    sentences.forEach((sentence, index) => {
      if (sentence.toLowerCase().includes(keyword.toLowerCase()) && 
          !sentence.includes('<a ') && // Don't add links where links already exist
          sentence.length > 50) { // Avoid very short sentences
        points.push({
          text: sentence.trim(),
          position: index
        });
      }
    });

    return points.slice(0, 3); // Return up to 3 potential insertion points
  }

  /**
   * Validate keyword relevance in generated content
   */
  private validateKeywordRelevance(content: string, primaryKeyword: string, secondaryKeywords: string[]): boolean {
    const lowerContent = content.toLowerCase();
    const primaryCount = (lowerContent.match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
    
    // Primary keyword should appear at least 3 times in good content
    if (primaryCount < 3) {
      return false;
    }

    // At least 50% of secondary keywords should appear in content
    const secondaryAppearances = secondaryKeywords.filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    ).length;

    return secondaryKeywords.length === 0 || secondaryAppearances >= secondaryKeywords.length * 0.5;
  }

  /**
   * Extract domain from URL for context analysis
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Analyze URL context to understand the target site
   */
  private analyzeUrlContext(url: string): string {
    const domain = this.extractDomain(url).toLowerCase();
    
    if (domain.includes('shop') || domain.includes('store') || url.includes('/product')) {
      return 'an e-commerce/shopping site';
    } else if (domain.includes('blog') || url.includes('/blog')) {
      return 'a blog or content site';
    } else if (domain.includes('service') || url.includes('/service')) {
      return 'a service provider site';
    } else if (domain.includes('tool') || domain.includes('app')) {
      return 'a tool or application site';
    } else {
      return 'a business/informational website';
    }
  }

  /**
   * Map content type for SEO engine
   */
  private mapContentTypeForSEO(contentType: string): 'blog' | 'article' | 'guide' | 'review' | 'comparison' {
    const mapping = {
      'how-to': 'guide' as const,
      'guide': 'guide' as const,
      'review': 'review' as const,
      'comparison': 'comparison' as const,
      'listicle': 'article' as const,
      'news': 'article' as const
    };

    return mapping[contentType] || 'article';
  }

  /**
   * Map audience to reading level
   */
  private mapAudienceToReadingLevel(audience: string): 'elementary' | 'middle' | 'high-school' | 'college' {
    const mapping = {
      beginners: 'high-school' as const,
      intermediate: 'high-school' as const,
      advanced: 'college' as const,
      general: 'high-school' as const
    };

    return mapping[audience] || 'high-school';
  }

  /**
   * Finalize content with additional optimizations
   */
  private async finalizeContent(content: string, request: ContentGenerationRequest): Promise<string> {
    let finalContent = content;

    // Add semantic HTML improvements
    finalContent = this.addSemanticHTML(finalContent);

    // Ensure proper internal structure
    finalContent = this.optimizeInternalStructure(finalContent, request.primaryKeyword);

    return finalContent;
  }

  /**
   * Add semantic HTML improvements
   */
  private addSemanticHTML(content: string): string {
    let semanticContent = content;

    // Wrap important paragraphs in semantic tags
    semanticContent = semanticContent.replace(
      /(<p>.*?conclusion.*?<\/p>)/gi,
      '<div class="conclusion-section">$1</div>'
    );

    semanticContent = semanticContent.replace(
      /(<p>.*?introduction.*?<\/p>)/gi,
      '<div class="introduction-section">$1</div>'
    );

    // Add emphasis to important terms
    semanticContent = semanticContent.replace(
      /\b(important|crucial|essential|key|vital)\b/gi,
      '<strong>$1</strong>'
    );

    return semanticContent;
  }

  /**
   * Optimize internal structure for better SEO
   */
  private optimizeInternalStructure(content: string, primaryKeyword: string): string {
    let optimizedContent = content;

    // Ensure first paragraph includes primary keyword
    const firstParagraphMatch = optimizedContent.match(/<p>(.*?)<\/p>/);
    if (firstParagraphMatch && !firstParagraphMatch[1].toLowerCase().includes(primaryKeyword.toLowerCase())) {
      optimizedContent = optimizedContent.replace(
        firstParagraphMatch[0],
        `<p>When exploring ${primaryKeyword}, ${firstParagraphMatch[1]}</p>`
      );
    }

    // Add schema markup for better search understanding
    optimizedContent = `<article itemscope itemtype="https://schema.org/Article">
${optimizedContent}
</article>`;

    return optimizedContent;
  }

  /**
   * Test connection to ChatGPT service
   */
  async testConnection(): Promise<boolean> {
    return this.chatGPTService.testConnection();
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return this.chatGPTService.isConfigured();
  }

  /**
   * Get provider status for debugging
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    return {
      configured: this.isConfigured(),
      serviceHealth: this.chatGPTService.getServiceHealth(),
      keyStatuses: this.chatGPTService.getKeyStatuses()
    };
  }
}

export const enhancedContentGenerator = new EnhancedContentGenerator();
