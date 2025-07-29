/**
 * AI Content Engine
 * Comprehensive implementation based on ChatGPT conversation requirements
 * Integrates OpenAI, xAI Grok, DeepAI, HuggingFace, Cohere, and Rytr APIs
 * for original content generation with dynamic prompts
 */

import { openAIService } from './api/openai';
import { grokService } from './api/grok';
import { deepAIService } from './api/deepai';
import { huggingFaceService } from './api/huggingface';
import { cohereService } from './api/cohere';
import { rytrService } from './api/rytr';

export interface ContentRequest {
  keyword: string;
  targetUrl: string;
  anchorText?: string;
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'convincing';
  userLocation?: string;
  industry?: string;
  seoFocus?: boolean;
}

export interface ProviderResult {
  provider: string;
  content: string;
  success: boolean;
  usage: { tokens: number; cost: number };
  generationTime: number;
  error?: string;
  quality?: number;
}

export interface AIContentResult {
  bestContent: string;
  allResults: ProviderResult[];
  selectedProvider: string;
  metadata: {
    title: string;
    metaDescription: string;
    keywords: string[];
    wordCount: number;
    readingTime: number;
    seoScore: number;
  };
  totalCost: number;
  processingTime: number;
}

export class AIContentEngine {
  private readonly providers = [
    {
      name: 'openai',
      service: openAIService,
      weight: 0.25,
      model: 'gpt-3.5-turbo',
      maxTokens: 3500
    },
    {
      name: 'grok',
      service: grokService,
      weight: 0.20,
      model: 'grok-2-1212',
      maxTokens: 3000
    },
    { 
      name: 'deepai', 
      service: deepAIService, 
      weight: 0.15,
      model: 'text-generator',
      maxTokens: 0 // DeepAI doesn't use token limits in the same way
    },
    { 
      name: 'huggingface', 
      service: huggingFaceService, 
      weight: 0.15,
      model: 'microsoft/DialoGPT-large',
      maxTokens: 2000
    },
    { 
      name: 'cohere', 
      service: cohereService, 
      weight: 0.15,
      model: 'command',
      maxTokens: 3000
    },
    { 
      name: 'rytr', 
      service: rytrService, 
      weight: 0.10,
      model: 'blog_idea_outline',
      maxTokens: 15000 // Rytr uses characters
    }
  ];

  /**
   * Generate sophisticated prompts based on ChatGPT conversation
   * Implements the exact prompt templates requested
   */
  private generatePrompts(request: ContentRequest): {
    primary: string;
    secondary: string;
    creative: string;
    seoOptimized: string;
  } {
    const { keyword, targetUrl, anchorText, wordCount = 2000 } = request;
    const anchor = anchorText || keyword;
    const currentYear = new Date().getFullYear();

    // Primary prompt - Direct from ChatGPT conversation
    const primary = `Write ${wordCount} words on "${keyword}" and hyperlink the anchor text "${anchor}" with the URL ${targetUrl} in a search engine optimized manner.

REQUIREMENTS:
- Create comprehensive, original content demonstrating expertise
- Natural integration of backlink "${anchor}" → ${targetUrl}
- SEO-optimized structure with proper headings (H1, H2, H3)
- Engaging, value-driven content for target audience
- Professional tone with actionable insights
- Include relevant examples and practical tips

CONTENT STRUCTURE:
1. Compelling introduction with hook
2. Main sections with clear subheadings  
3. Natural backlink integration in context
4. Practical implementation guidance
5. Strong conclusion with clear CTA

Focus on user intent satisfaction while maintaining search engine optimization best practices.`;

    // Secondary prompt - Enhanced version from conversation
    const secondary = `Create a ${wordCount} word original blog post that encapsulates user intent and website correlation based on "${keyword}" and hyperlink the anchor text "${anchor}" with the URL ${targetUrl} following search engine optimized principles and abide by strict grammar and punctuality.

ADVANCED REQUIREMENTS:
- Thorough research and comprehensive topic coverage
- E-A-T principles (Expertise, Authoritativeness, Trustworthiness)
- Natural language processing optimization
- Featured snippet and voice search optimization
- Semantic keyword integration
- Mobile-friendly content structure
- User experience focused writing

CONTENT GOALS:
- Answer user questions completely
- Establish topical authority
- Build reader trust through accuracy
- Drive engagement and conversions
- Natural backlink integration that adds value

The content should serve both users and search engines while maintaining exceptional quality and readability.`;

    // Creative approach prompt
    const creative = `Craft an innovative ${wordCount} word article exploring "${keyword}" that captivates readers while strategically incorporating "${anchor}" linked to ${targetUrl}.

CREATIVE APPROACH:
- Use storytelling elements and emotional engagement
- Present unique perspectives and fresh insights
- Include compelling case studies and examples
- Balance creativity with SEO optimization
- Create memorable, shareable content
- Use varied sentence structures and engaging vocabulary
- Incorporate ${currentYear} trends and data

STRATEGIC ELEMENTS:
- Hook readers with compelling opening
- Build anticipation and maintain interest
- Use psychological triggers appropriately
- Create natural link placement opportunities
- End with powerful, actionable CTA
- Optimize for social sharing potential

Goal: Create content so valuable that others naturally want to reference and link to it.`;

    // SEO-focused prompt
    const seoOptimized = `Generate a ${wordCount} word SEO-optimized article about "${keyword}" that naturally includes "${anchor}" linking to ${targetUrl}.

SEO SPECIFICATIONS:
- Target keyword density: 1-2%
- Include LSI and semantic keywords
- Optimize for user search intent
- Structure for featured snippets
- Include FAQ section if relevant
- Optimize meta elements
- Use proper schema markup structure
- Mobile-first content approach

TECHNICAL REQUIREMENTS:
- Clear heading hierarchy (H1, H2, H3)
- Optimal paragraph length (3-4 sentences)
- Bullet points and numbered lists
- Internal topic clustering
- Natural backlink integration
- Call-to-action optimization
- Readability score: 60+ (Flesch-Kincaid)

Focus on ranking factors while maintaining user value and engagement.`;

    return { primary, secondary, creative, seoOptimized };
  }

  /**
   * Generate system prompts tailored to each provider
   */
  private getSystemPrompt(provider: string, request: ContentRequest): string {
    const basePrompt = `You are a world-class SEO content writer and digital marketing expert specializing in creating original, high-quality content that ranks well while providing genuine value.`;

    const providerPrompts = {
      openai: `${basePrompt} Focus on expertise, authoritativeness, and trustworthiness. Use data-driven insights, professional tone, and comprehensive coverage. Create content that demonstrates deep subject matter expertise.`,
      
      grok: `${basePrompt} Bring wit, personality, and engaging elements while maintaining professionalism. Use current trends, real-world examples, and make complex topics accessible. Add your unique perspective.`,
      
      deepai: `${basePrompt} Focus on creating structured, logical content with clear progression. Emphasize practical value and actionable insights. Keep the content well-organized and easy to follow.`,
      
      huggingface: `${basePrompt} Create coherent, well-structured content with natural flow. Focus on readability and user experience. Ensure logical progression and clear communication throughout.`,
      
      cohere: `${basePrompt} Emphasize clarity, coherence, and natural language. Create content that flows well and maintains reader engagement. Focus on answering user questions comprehensively.`,
      
      rytr: `${basePrompt} Focus on persuasive, conversion-oriented content. Use convincing tone and compelling arguments. Create content that drives action while maintaining SEO value.`
    };

    return providerPrompts[provider as keyof typeof providerPrompts] || basePrompt;
  }

  /**
   * Generate content from all available providers
   */
  async generateContent(request: ContentRequest): Promise<AIContentResult> {
    const startTime = Date.now();
    console.log('🚀 Starting multi-provider AI content generation:', request);

    const prompts = this.generatePrompts(request);
    const promptVariations = [prompts.primary, prompts.secondary, prompts.creative, prompts.seoOptimized];
    
    const results: ProviderResult[] = [];

    // Generate content from all providers in parallel
    const generationPromises = this.providers.map(async (provider, index) => {
      const providerStartTime = Date.now();
      
      try {
        console.log(`🤖 Generating content with ${provider.name}...`);
        
        // Use different prompt variations for diversity
        const selectedPrompt = promptVariations[index % promptVariations.length];
        const systemPrompt = this.getSystemPrompt(provider.name, request);
        
        let result;
        
        switch (provider.name) {
          case 'openai':
            result = await provider.service.generateContent(selectedPrompt, {
              model: provider.model,
              maxTokens: provider.maxTokens,
              temperature: 0.7,
              systemPrompt
            });
            break;
            
          case 'grok':
            result = await provider.service.generateContent(selectedPrompt, {
              model: provider.model,
              maxTokens: provider.maxTokens,
              temperature: 0.7,
              systemPrompt
            });
            break;
            
          case 'deepai':
            const deepAIPrompt = `${systemPrompt}\n\n${selectedPrompt}`;
            result = await provider.service.generateText(deepAIPrompt);
            break;
            
          case 'huggingface':
            const hfPrompt = `${systemPrompt}\n\n${selectedPrompt}`;
            result = await provider.service.generateText(hfPrompt, {
              model: provider.model,
              maxLength: provider.maxTokens,
              temperature: 0.7
            });
            break;
            
          case 'cohere':
            const coherePrompt = `${systemPrompt}\n\n${selectedPrompt}`;
            result = await provider.service.generateText(coherePrompt, {
              model: provider.model,
              maxTokens: provider.maxTokens,
              temperature: 0.7
            });
            break;
            
          case 'rytr':
            result = await provider.service.generateContent(selectedPrompt, {
              useCase: 'blog_idea_outline',
              tone: request.tone || 'convincing',
              maxCharacters: provider.maxTokens,
              variations: 1
            });
            break;
            
          default:
            throw new Error(`Unknown provider: ${provider.name}`);
        }

        const generationTime = Date.now() - providerStartTime;
        const quality = this.assessContentQuality(result?.content || '', request);

        return {
          provider: provider.name,
          content: result?.content || '',
          success: result?.success || false,
          usage: result?.usage || { tokens: 0, cost: 0 },
          generationTime,
          error: result?.error,
          quality
        };

      } catch (error) {
        console.error(`❌ Error with ${provider.name}:`, error);
        return {
          provider: provider.name,
          content: '',
          success: false,
          usage: { tokens: 0, cost: 0 },
          generationTime: Date.now() - providerStartTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          quality: 0
        };
      }
    });

    // Wait for all generations
    const generationResults = await Promise.all(generationPromises);
    results.push(...generationResults);

    // Select best content
    const bestResult = this.selectBestContent(results, request);
    
    // Enhance the selected content
    const enhancedContent = this.enhanceContent(bestResult.content, request);
    
    // Generate metadata
    const metadata = this.generateMetadata(enhancedContent, request);
    
    const totalCost = results.reduce((sum, r) => sum + r.usage.cost, 0);
    const processingTime = Date.now() - startTime;

    console.log('✅ Multi-provider content generation complete:', {
      selectedProvider: bestResult.provider,
      totalProviders: results.length,
      successfulProviders: results.filter(r => r.success).length,
      processingTime: `${processingTime}ms`,
      totalCost: `$${totalCost.toFixed(4)}`
    });

    return {
      bestContent: enhancedContent,
      allResults: results,
      selectedProvider: bestResult.provider,
      metadata,
      totalCost,
      processingTime
    };
  }

  /**
   * Assess content quality based on multiple factors
   */
  private assessContentQuality(content: string, request: ContentRequest): number {
    if (!content || content.length < 100) return 0;

    let score = 0;
    const words = content.split(/\s+/).length;
    const targetWords = request.wordCount || 2000;

    // Length score (30 points max)
    const lengthRatio = Math.min(words / targetWords, targetWords / words);
    score += lengthRatio * 30;

    // Keyword presence (20 points max)
    const keywordCount = (content.toLowerCase().match(new RegExp(request.keyword.toLowerCase(), 'g')) || []).length;
    score += Math.min(keywordCount * 3, 20);

    // Structure score (25 points max)
    const hasHeadings = /#{1,6}\s|<h[1-6]/.test(content);
    const hasParagraphs = content.split('\n\n').length > 3;
    const hasLists = /[-*+]\s|\d+\.\s|<[uo]l>/.test(content);
    score += (hasHeadings ? 10 : 0) + (hasParagraphs ? 10 : 0) + (hasLists ? 5 : 0);

    // URL integration (15 points max)
    const hasTargetUrl = content.includes(request.targetUrl);
    const hasAnchorText = content.includes(request.anchorText || request.keyword);
    score += (hasTargetUrl ? 10 : 0) + (hasAnchorText ? 5 : 0);

    // Readability (10 points max)
    const avgWordsPerSentence = words / (content.split(/[.!?]+/).length || 1);
    const readabilityScore = avgWordsPerSentence < 20 ? 10 : Math.max(0, 10 - (avgWordsPerSentence - 20) / 2);
    score += readabilityScore;

    return Math.min(score, 100);
  }

  /**
   * Select the best content from all provider results
   */
  private selectBestContent(results: ProviderResult[], request: ContentRequest): ProviderResult {
    const successfulResults = results.filter(r => r.success && r.content.length > 100);

    if (successfulResults.length === 0) {
      return {
        provider: 'fallback',
        content: this.generateFallbackContent(request),
        success: true,
        usage: { tokens: 0, cost: 0 },
        generationTime: 0,
        quality: 70
      };
    }

    // Calculate weighted scores
    const scoredResults = successfulResults.map(result => {
      const provider = this.providers.find(p => p.name === result.provider);
      const providerWeight = provider?.weight || 0;
      
      // Combine quality score with provider weight and generation time
      const timeBonus = Math.max(0, 5 - (result.generationTime / 1000)); // Bonus for speed
      const weightedScore = (result.quality || 0) + (providerWeight * 100) + timeBonus;
      
      return { ...result, weightedScore };
    });

    // Sort by weighted score and return the best
    scoredResults.sort((a, b) => b.weightedScore - a.weightedScore);
    return scoredResults[0];
  }

  /**
   * Enhance content with proper formatting and link integration
   */
  private enhanceContent(content: string, request: ContentRequest): string {
    let enhanced = content;

    // Ensure proper link integration
    const hasTargetUrl = enhanced.includes(request.targetUrl);
    if (!hasTargetUrl) {
      const anchorText = request.anchorText || request.keyword;
      const linkHtml = `<a href="${request.targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
      
      // Find appropriate place to insert link
      const sections = enhanced.split('\n\n');
      if (sections.length > 2) {
        const midIndex = Math.floor(sections.length / 2);
        const linkParagraph = `For comprehensive ${request.keyword} solutions and expert guidance, ${linkHtml} offers advanced tools and proven strategies.`;
        sections.splice(midIndex, 0, linkParagraph);
        enhanced = sections.join('\n\n');
      }
    }

    // Clean up formatting
    enhanced = enhanced
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^#+\s(.+)$/gm, (match, title) => {
        const level = match.split(' ')[0].length;
        return `<h${level}>${title}</h${level}>`;
      });

    return enhanced.trim();
  }

  /**
   * Generate metadata for the content
   */
  private generateMetadata(content: string, request: ContentRequest) {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200);

    // Extract title
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
    const metaDescription = `Comprehensive ${request.keyword} guide with expert insights and proven strategies. Get started today.`.substring(0, 160);

    // Calculate SEO score
    let seoScore = 70;
    if (wordCount >= 1000) seoScore += 10;
    if (wordCount >= 1500) seoScore += 5;
    if (content.includes(request.targetUrl)) seoScore += 10;
    if (content.includes('<h1>')) seoScore += 5;
    
    return {
      title,
      metaDescription,
      keywords,
      wordCount,
      readingTime,
      seoScore: Math.min(seoScore, 100)
    };
  }

  /**
   * Generate fallback content when all providers fail
   */
  private generateFallbackContent(request: ContentRequest): string {
    const { keyword, targetUrl, anchorText } = request;
    const anchor = anchorText || keyword;
    
    return `# ${keyword}: Your Ultimate Guide

## Introduction

Understanding ${keyword} is essential in today's digital landscape. This comprehensive guide will provide you with everything you need to know about ${keyword}, from basic concepts to advanced strategies.

## What is ${keyword}?

${keyword} represents a crucial element that can significantly impact your success. Whether you're a beginner or experienced professional, mastering ${keyword} will give you a competitive advantage.

## Key Benefits

- **Enhanced Performance**: Improve your results with proven ${keyword} strategies
- **Expert Guidance**: Learn from industry professionals
- **Practical Solutions**: Get actionable insights you can implement immediately
- **Long-term Success**: Build sustainable growth through ${keyword}

## Getting Started

The best approach to ${keyword} combines theoretical knowledge with practical application. For comprehensive resources and expert tools, [${anchor}](${targetUrl}) provides everything you need to succeed.

## Best Practices

1. Start with a solid foundation in ${keyword} fundamentals
2. Implement strategies systematically
3. Monitor your progress regularly
4. Stay updated with latest trends
5. Seek professional guidance when needed

## Conclusion

Mastering ${keyword} requires dedication and the right resources. Take the first step toward success by exploring the comprehensive solutions available at [${anchor}](${targetUrl}).

Ready to excel in ${keyword}? Start your journey today!`;
  }

  /**
   * Test all provider connections
   */
  async testProviders(): Promise<{ [provider: string]: { available: boolean; configured: boolean } }> {
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

  /**
   * Get available providers status
   */
  getProvidersStatus(): { name: string; configured: boolean; weight: number }[] {
    return this.providers.map(provider => ({
      name: provider.name,
      configured: provider.service.isConfigured(),
      weight: provider.weight
    }));
  }
}

export const aiContentEngine = new AIContentEngine();
