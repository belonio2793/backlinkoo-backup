/**
 * Enhanced AI Content Engine
 * Implements the ChatGPT conversation requirements for original content generation
 * using multiple AI providers with sophisticated prompt templates
 */

import { openAIService } from './api/openai';
import { grokService } from './api/grok';
import { cohereService } from './api/cohere';

export interface ContentGenerationRequest {
  keyword: string;
  targetUrl: string;
  anchorText?: string;
  userLocation?: string;
  contentLength?: 'short' | 'medium' | 'long';
  contentTone?: 'professional' | 'casual' | 'technical' | 'friendly';
  seoFocus?: 'high' | 'medium' | 'balanced';
  industry?: string;
  targetAudience?: string;
}

export interface AIProviderResult {
  content: string;
  provider: string;
  success: boolean;
  usage: { tokens: number; cost: number };
  error?: string;
  generationTime: number;
}

export interface EnhancedContentResult {
  finalContent: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  seoScore: number;
  wordCount: number;
  readingTime: number;
  providers: AIProviderResult[];
  bestProvider: string;
  totalCost: number;
}

export class EnhancedAIContentEngine {
  private providers = [
    { name: 'openai', service: openAIService, weight: 0.4 },
    { name: 'grok', service: grokService, weight: 0.35 },
    { name: 'cohere', service: cohereService, weight: 0.25 }
  ];

  /**
   * Generate sophisticated prompt templates based on ChatGPT conversation
   */
  private generatePromptTemplates(request: ContentGenerationRequest): {
    primary: string;
    secondary: string;
    creative: string;
  } {
    const { keyword, targetUrl, anchorText, contentLength, seoFocus, industry, targetAudience } = request;
    const anchor = anchorText || keyword;
    const wordCount = this.getWordCountTarget(contentLength);
    const currentYear = new Date().getFullYear();

    const primaryPrompt = `Write ${wordCount} words on "${keyword}" and hyperlink the anchor text "${anchor}" with the URL ${targetUrl} in a search engine optimized manner.

REQUIREMENTS:
- Create original, high-quality content that demonstrates expertise
- Naturally integrate the backlink "${anchor}" pointing to ${targetUrl}
- Follow SEO best practices with proper heading structure (H1, H2, H3)
- Include relevant keywords and semantic variations
- Write engaging, user-focused content that provides genuine value
- Use professional tone with clear, actionable insights
${industry ? `- Focus on ${industry} industry context` : ''}
${targetAudience ? `- Target audience: ${targetAudience}` : ''}

CONTENT STRUCTURE:
1. Compelling introduction that hooks the reader
2. Main content sections with clear subheadings
3. Practical tips and actionable advice
4. Natural integration of the backlink within relevant context
5. Strong conclusion with call-to-action

SEO FOCUS: ${seoFocus || 'high'} - ensure optimal keyword density and semantic relevance.`;

    const secondaryPrompt = `Create a ${wordCount} word original blog post that encapsulates user intent and website correlation based on "${keyword}" and hyperlink the anchor text "${anchor}" with the URL ${targetUrl} following search engine optimized principles and abide by strict grammar and punctuality.

ADVANCED REQUIREMENTS:
- Conduct thorough research on ${keyword} to provide comprehensive coverage
- Create content that matches user search intent and provides complete answers
- Establish topical authority through depth and expertise
- Use natural language processing friendly structure
- Implement E-A-T (Expertise, Authoritativeness, Trustworthiness) principles
- Include related keywords and LSI terms naturally
- Optimize for featured snippets and voice search
- Ensure mobile-friendly readability

CONTENT GOALS:
- Answer user questions comprehensively
- Provide unique insights and perspectives
- Build trust through accurate, well-researched information
- Drive engagement through compelling storytelling
- Convert readers through strategic backlink placement

The content should feel natural and authoritative while serving both users and search engines effectively.`;

    const creativePrompt = `Craft an innovative ${wordCount} word article exploring "${keyword}" that captivates readers while strategically incorporating "${anchor}" linked to ${targetUrl}. 

CREATIVE APPROACH:
- Use storytelling elements to engage readers emotionally
- Present unique angles and fresh perspectives on ${keyword}
- Include case studies, examples, or real-world applications
- Balance creativity with SEO optimization
- Create memorable, shareable content
- Use varied sentence structures and engaging vocabulary
- Incorporate current trends and ${currentYear} insights

STRATEGIC ELEMENTS:
- Hook readers with compelling opening
- Build anticipation throughout the content
- Use psychological triggers and persuasive elements
- Create natural link placement opportunities
- End with powerful call-to-action
- Optimize for social sharing and backlink generation

The goal is to create content so valuable and engaging that other sites want to reference and link to it naturally.`;

    return {
      primary: primaryPrompt,
      secondary: secondaryPrompt,
      creative: creativePrompt
    };
  }

  private getWordCountTarget(length?: string): number {
    switch (length) {
      case 'short': return 800;
      case 'medium': return 1500;
      case 'long': return 2500;
      default: return 2000;
    }
  }

  /**
   * Generate content using multiple AI providers with different prompt approaches
   */
  async generateContent(request: ContentGenerationRequest): Promise<EnhancedContentResult> {
    console.log('🚀 Starting enhanced AI content generation:', request);
    
    const prompts = this.generatePromptTemplates(request);
    const results: AIProviderResult[] = [];

    // Generate content from multiple providers in parallel
    const generationPromises = this.providers.map(async (provider, index) => {
      const startTime = Date.now();
      
      try {
        console.log(`🤖 Generating content with ${provider.name}...`);
        
        // Use different prompts for variety
        const promptVariations = [prompts.primary, prompts.secondary, prompts.creative];
        const selectedPrompt = promptVariations[index % promptVariations.length];
        
        const systemPrompt = this.getSystemPrompt(provider.name, request);
        
        let result;
        if (provider.name === 'openai') {
          result = await provider.service.generateContent(selectedPrompt, {
            model: 'gpt-3.5-turbo',
            maxTokens: this.getMaxTokens(request.contentLength),
            temperature: 0.7,
            systemPrompt
          });
        } else if (provider.name === 'grok') {
          result = await provider.service.generateContent(selectedPrompt, {
            model: 'grok-2-1212',
            maxTokens: this.getMaxTokens(request.contentLength),
            temperature: 0.7,
            systemPrompt
          });
        } else if (provider.name === 'cohere') {
          const fullPrompt = `${systemPrompt}\n\n${selectedPrompt}`;
          result = await provider.service.generateText(fullPrompt, {
            model: 'command',
            maxTokens: this.getMaxTokens(request.contentLength),
            temperature: 0.7
          });
        }

        const generationTime = Date.now() - startTime;

        return {
          content: result?.content || '',
          provider: provider.name,
          success: result?.success || false,
          usage: result?.usage || { tokens: 0, cost: 0 },
          error: result?.error,
          generationTime
        };

      } catch (error) {
        console.error(`❌ Error with ${provider.name}:`, error);
        return {
          content: '',
          provider: provider.name,
          success: false,
          usage: { tokens: 0, cost: 0 },
          error: error instanceof Error ? error.message : 'Unknown error',
          generationTime: Date.now() - startTime
        };
      }
    });

    // Wait for all generations to complete
    const generationResults = await Promise.all(generationPromises);
    results.push(...generationResults);

    // Select the best content based on quality metrics
    const bestResult = this.selectBestContent(results, request);
    
    // Enhance and optimize the selected content
    const enhancedContent = await this.enhanceContent(bestResult.content, request);
    
    // Generate metadata
    const metadata = this.generateMetadata(enhancedContent, request);

    const totalCost = results.reduce((sum, r) => sum + r.usage.cost, 0);

    console.log('✅ Enhanced AI content generation complete:', {
      bestProvider: bestResult.provider,
      wordCount: metadata.wordCount,
      totalCost: `$${totalCost.toFixed(4)}`
    });

    return {
      finalContent: enhancedContent,
      ...metadata,
      providers: results,
      bestProvider: bestResult.provider,
      totalCost
    };
  }

  private getSystemPrompt(provider: string, request: ContentGenerationRequest): string {
    const basePrompt = `You are a world-class SEO content writer and digital marketing expert. Create original, high-quality content that ranks well in search engines while providing genuine value to readers.`;
    
    switch (provider) {
      case 'openai':
        return `${basePrompt} Focus on expertise, authoritativeness, and trustworthiness. Use data-driven insights and professional tone.`;
      case 'grok':
        return `${basePrompt} Bring wit and engaging personality while maintaining professionalism. Use current trends and real-world examples.`;
      case 'cohere':
        return `${basePrompt} Emphasize clarity, coherence, and logical flow. Create well-structured, easy-to-read content.`;
      default:
        return basePrompt;
    }
  }

  private getMaxTokens(length?: string): number {
    switch (length) {
      case 'short': return 1200;
      case 'medium': return 2200;
      case 'long': return 3500;
      default: return 2800;
    }
  }

  /**
   * Select the best content based on quality metrics
   */
  private selectBestContent(results: AIProviderResult[], request: ContentGenerationRequest): AIProviderResult {
    const successfulResults = results.filter(r => r.success && r.content.length > 100);
    
    if (successfulResults.length === 0) {
      // Return the first result as fallback
      return results[0] || {
        content: this.generateFallbackContent(request),
        provider: 'fallback',
        success: true,
        usage: { tokens: 0, cost: 0 },
        generationTime: 0
      };
    }

    // Score each result based on multiple factors
    const scoredResults = successfulResults.map(result => {
      let score = 0;
      
      // Content length score (prefer target word count)
      const targetWords = this.getWordCountTarget(request.contentLength);
      const actualWords = result.content.split(/\s+/).length;
      const lengthRatio = Math.min(actualWords / targetWords, targetWords / actualWords);
      score += lengthRatio * 30;
      
      // Keyword presence score
      const keywordPresence = this.countKeywordMentions(result.content, request.keyword);
      score += Math.min(keywordPresence * 5, 20);
      
      // Link integration score
      const hasProperLink = result.content.includes(request.targetUrl) || 
                           result.content.includes(request.anchorText || request.keyword);
      score += hasProperLink ? 20 : 0;
      
      // Structure score (headings, paragraphs)
      const hasHeadings = /#{1,3}\s/.test(result.content) || /<h[1-6]/.test(result.content);
      const hasParagraphs = result.content.split('\n\n').length > 3;
      score += (hasHeadings ? 15 : 0) + (hasParagraphs ? 10 : 0);
      
      // Provider weight
      const provider = this.providers.find(p => p.name === result.provider);
      score += (provider?.weight || 0) * 100;
      
      return { ...result, score };
    });

    // Return the highest scoring result
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults[0];
  }

  private countKeywordMentions(content: string, keyword: string): number {
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    return (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
  }

  /**
   * Enhance and optimize the selected content
   */
  private async enhanceContent(content: string, request: ContentGenerationRequest): Promise<string> {
    let enhanced = content;

    // Ensure proper link integration if missing
    const hasTargetUrl = enhanced.includes(request.targetUrl);
    const anchorText = request.anchorText || request.keyword;
    
    if (!hasTargetUrl) {
      // Add the link naturally in the content
      const linkHtml = `<a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
      
      // Find a good place to insert the link (preferably in middle sections)
      const sections = enhanced.split('\n\n');
      if (sections.length > 2) {
        const midIndex = Math.floor(sections.length / 2);
        const targetSection = sections[midIndex];
        if (targetSection.toLowerCase().includes(request.keyword.toLowerCase())) {
          sections[midIndex] = targetSection.replace(
            new RegExp(`\\b${request.keyword}\\b`, 'i'),
            linkHtml
          );
          enhanced = sections.join('\n\n');
        } else {
          // Add a new paragraph with the link
          const linkParagraph = `\nFor comprehensive ${request.keyword} solutions, ${linkHtml} provides expert tools and guidance.\n`;
          sections.splice(midIndex, 0, linkParagraph);
          enhanced = sections.join('\n\n');
        }
      }
    }

    // Ensure proper heading structure
    if (!enhanced.includes('<h1>') && !enhanced.includes('# ')) {
      enhanced = `# ${request.keyword}: Complete Guide\n\n${enhanced}`;
    }

    // Clean up formatting
    enhanced = enhanced
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert markdown bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert markdown italic
      .replace(/#{1,6}\s/g, (match) => {
        const level = match.trim().length;
        return `<h${level}>`;
      })
      .replace(/(<h[1-6]>)(.*?)(\n|$)/g, '$1$2</h$1>$3'); // Close heading tags

    return enhanced.trim();
  }

  /**
   * Generate metadata for the content
   */
  private generateMetadata(content: string, request: ContentGenerationRequest) {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Extract or generate title
    const titleMatch = content.match(/<h1>(.*?)<\/h1>|^#\s(.+)/m);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : 
                 `${request.keyword}: Complete Guide ${new Date().getFullYear()}`;

    // Generate keywords
    const keywords = [
      request.keyword,
      `${request.keyword} guide`,
      `${request.keyword} tips`,
      `best ${request.keyword}`,
      `${request.keyword} strategies`,
      `${request.keyword} ${new Date().getFullYear()}`
    ];

    // Generate meta description
    const metaDescription = `Comprehensive ${request.keyword} guide with expert insights, practical tips, and proven strategies. ${request.userLocation ? `Optimized for ${request.userLocation}.` : ''} Learn from industry experts.`.substring(0, 160);

    // Calculate SEO score based on various factors
    let seoScore = 70; // Base score
    
    if (wordCount >= 800) seoScore += 10;
    if (wordCount >= 1500) seoScore += 5;
    if (content.includes(request.targetUrl)) seoScore += 10;
    if (content.includes('<h1>') || content.includes('# ')) seoScore += 5;
    if ((content.match(/<h[2-6]>/g) || []).length >= 3) seoScore += 5;
    if (this.countKeywordMentions(content, request.keyword) >= 3) seoScore += 5;
    
    seoScore = Math.min(seoScore, 100);

    return {
      title,
      metaDescription,
      keywords,
      seoScore,
      wordCount,
      readingTime
    };
  }

  /**
   * Generate fallback content when all AI providers fail
   */
  private generateFallbackContent(request: ContentGenerationRequest): string {
    const { keyword, targetUrl, anchorText } = request;
    const anchor = anchorText || keyword;
    const currentYear = new Date().getFullYear();

    return `# ${keyword}: Your Complete ${currentYear} Guide

## Introduction

Welcome to the comprehensive guide on ${keyword}. In today's digital landscape, understanding ${keyword} is crucial for success. This guide will provide you with everything you need to know to master ${keyword} effectively.

## What is ${keyword}?

${keyword} represents a fundamental aspect of modern business strategy. Whether you're just starting out or looking to improve your existing approach, ${keyword} offers numerous opportunities for growth and development.

## Key Benefits of ${keyword}

- **Enhanced Performance**: Implementing ${keyword} strategies can significantly improve your results
- **Competitive Advantage**: Stay ahead with advanced ${keyword} techniques  
- **Cost Efficiency**: Optimize your resources through strategic ${keyword} implementation
- **Long-term Growth**: Build sustainable success with proven ${keyword} methodologies

## Best Practices for ${keyword}

### Getting Started
Begin your ${keyword} journey with a solid foundation. Understanding the basics is essential before moving to advanced techniques.

### Advanced Strategies
For those ready to take their ${keyword} efforts to the next level, consider exploring [${anchor}](${targetUrl}) for comprehensive solutions and expert guidance.

### Common Mistakes to Avoid
- Neglecting proper planning and research
- Focusing on quantity over quality
- Ignoring user experience considerations
- Failing to adapt to industry changes

## Implementation Tips

1. **Start Small**: Begin with manageable goals and scale gradually
2. **Monitor Progress**: Track your results and adjust strategies accordingly
3. **Stay Updated**: Keep up with the latest ${keyword} trends and best practices
4. **Seek Expert Help**: Consider professional guidance when needed

## Conclusion

${keyword} success requires dedication, strategy, and the right tools. By following the guidelines in this comprehensive guide, you'll be well-positioned to achieve your ${keyword} objectives.

Ready to get started? [Explore our ${keyword} solutions](${targetUrl}) and take your efforts to the next level.

---

*This guide provides foundational knowledge for ${keyword} success. For advanced strategies and personalized guidance, consider consulting with industry experts.*`;
  }

  /**
   * Test connectivity to all AI providers
   */
  async testAllProviders(): Promise<{
    [provider: string]: { available: boolean; configured: boolean }
  }> {
    const results: { [key: string]: { available: boolean; configured: boolean } } = {};

    for (const provider of this.providers) {
      const configured = provider.service.isConfigured();
      let available = false;

      if (configured) {
        try {
          available = await provider.service.testConnection();
        } catch (error) {
          console.warn(`Test failed for ${provider.name}:`, error);
        }
      }

      results[provider.name] = { available, configured };
    }

    return results;
  }
}

export const enhancedAIContentEngine = new EnhancedAIContentEngine();
