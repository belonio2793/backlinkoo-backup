/**
 * Production AI Content Manager
 * Intelligently manages multiple AI providers with fallback, quota monitoring, and cost optimization
 */

import { openAIService } from './api/openai';
import { grokService } from './api/grok';
import { deepAIService } from './api/deepai';
import { huggingFaceService } from './api/huggingface';
import { cohereService } from './api/cohere';
import { rytrService } from './api/rytr';

interface ContentGenerationParams {
  targetUrl: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  contentType: 'blog-post' | 'editorial' | 'guest-post' | 'resource-page';
  wordCount: number;
  tone: string;
  customInstructions?: string;
}

interface GeneratedContent {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  targetUrl: string;
  keywords: string[];
  wordCount: number;
  createdAt: string;
  status: 'draft' | 'published';
  seoScore: number;
  contextualLinks: ContextualLink[];
  provider: string;
  usage: {
    tokens: number;
    cost: number;
    provider: string;
  };
}

interface ContextualLink {
  anchorText: string;
  targetUrl: string;
  position: number;
  context: string;
  seoRelevance: number;
}

interface APIProvider {
  name: string;
  service: any;
  priority: number;
  costPerToken: number;
  isConfigured: () => boolean;
  testConnection: () => Promise<boolean>;
}

export class ProductionAIContentManager {
  private providers: APIProvider[];
  private usageStats: Map<string, { tokens: number; cost: number; requests: number }>;
  private dailyLimits: Map<string, number>;

  constructor() {
    // Initialize providers in order of preference (priority: 1 = highest)
    this.providers = [
      {
        name: 'OpenAI',
        service: openAIService,
        priority: 1,
        costPerToken: 0.00003, // GPT-4 approximate cost
        isConfigured: () => openAIService.isConfigured(),
        testConnection: () => openAIService.testConnection()
      },
      {
        name: 'Grok',
        service: grokService,
        priority: 2,
        costPerToken: 0.000005,
        isConfigured: () => grokService.isConfigured(),
        testConnection: () => grokService.testConnection()
      },
      {
        name: 'Cohere',
        service: cohereService,
        priority: 3,
        costPerToken: 0.000015,
        isConfigured: () => cohereService.isConfigured(),
        testConnection: () => cohereService.testConnection()
      },
      {
        name: 'HuggingFace',
        service: huggingFaceService,
        priority: 4,
        costPerToken: 0, // Free tier
        isConfigured: () => huggingFaceService.isConfigured(),
        testConnection: () => huggingFaceService.testConnection()
      },
      {
        name: 'Rytr',
        service: rytrService,
        priority: 5,
        costPerToken: 0.00001,
        isConfigured: () => rytrService.isConfigured(),
        testConnection: () => rytrService.testConnection()
      },
      {
        name: 'DeepAI',
        service: deepAIService,
        priority: 6,
        costPerToken: 0.000001,
        isConfigured: () => deepAIService.isConfigured(),
        testConnection: () => deepAIService.testConnection()
      }
    ];

    // Initialize usage tracking
    this.usageStats = new Map();
    this.dailyLimits = new Map([
      ['OpenAI', 100000], // 100k tokens per day
      ['Grok', 50000],
      ['Cohere', 25000],
      ['HuggingFace', 1000000], // Higher limit for free tier
      ['Rytr', 50000],
      ['DeepAI', 100000]
    ]);

    this.initializeUsageTracking();
  }

  private initializeUsageTracking(): void {
    this.providers.forEach(provider => {
      this.usageStats.set(provider.name, { tokens: 0, cost: 0, requests: 0 });
    });
  }

  async generateContent(params: ContentGenerationParams): Promise<GeneratedContent> {
    console.log('🚀 Production AI Content Generation Started', {
      primaryKeyword: params.primaryKeyword,
      wordCount: params.wordCount,
      availableProviders: this.getAvailableProviders().map(p => p.name)
    });

    const prompt = this.createOptimizedPrompt(params);
    let lastError: string = '';

    // Try providers in priority order
    const availableProviders = this.getAvailableProviders()
      .filter(p => p.isConfigured() && this.canUseProvider(p.name))
      .sort((a, b) => a.priority - b.priority);

    for (const provider of availableProviders) {
      try {
        console.log(`🔄 Trying ${provider.name}...`);
        
        const result = await this.generateWithProvider(provider, prompt, params);
        
        if (result.success) {
          // Track usage
          this.trackUsage(provider.name, result.usage.tokens, result.usage.cost);
          
          // Parse and enhance content
          const enhancedContent = await this.enhanceContent(result, params, provider.name);
          
          console.log(`✅ Content generated successfully with ${provider.name}`);
          return enhancedContent;
        } else {
          lastError = result.error || 'Unknown error';
          console.warn(`❌ ${provider.name} failed: ${lastError}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ ${provider.name} error:`, error);
        continue;
      }
    }

    // If all providers fail, use fallback content
    console.warn('⚠️ All AI providers failed, using fallback content generator');
    return this.generateFallbackContent(params, lastError);
  }

  private async generateWithProvider(provider: APIProvider, prompt: string, params: ContentGenerationParams): Promise<{
    content: string;
    usage: { tokens: number; cost: number };
    success: boolean;
    error?: string;
  }> {
    const options = {
      maxTokens: Math.min(4000, Math.ceil(params.wordCount * 1.5)), // Rough token estimation
      temperature: this.getToneTemperature(params.tone)
    };

    // Handle different provider interfaces
    switch (provider.name) {
      case 'OpenAI':
        return await provider.service.generateContent(prompt, {
          ...options,
          model: 'gpt-3.5-turbo',
          systemPrompt: this.getSystemPrompt(params.contentType)
        });

      case 'Grok':
        return await provider.service.generateContent(prompt, {
          ...options,
          model: 'grok-2-1212',
          systemPrompt: this.getSystemPrompt(params.contentType)
        });
      
      case 'Cohere':
        return await provider.service.generateText(prompt, options);
      
      case 'HuggingFace':
        return await provider.service.generateText(prompt, {
          ...options,
          model: 'microsoft/DialoGPT-large'
        });
      
      case 'Rytr':
        return await provider.service.generateContent(prompt, {
          useCase: this.mapContentTypeToRytrUseCase(params.contentType),
          tone: this.mapToneToRytr(params.tone),
          maxCharacters: params.wordCount * 6 // Rough character estimation
        });
      
      case 'DeepAI':
        return await provider.service.generateText(prompt);
      
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }
  }

  private createOptimizedPrompt(params: ContentGenerationParams): string {
    return `Write a comprehensive, SEO-optimized ${params.contentType.replace('-', ' ')} about "${params.primaryKeyword}" that naturally mentions and links to ${params.targetUrl}.

REQUIREMENTS:
- ${params.wordCount}+ words
- ${params.tone} tone
- Primary keyword: "${params.primaryKeyword}" (use naturally throughout)
- Secondary keywords: ${params.secondaryKeywords.join(', ')}
- Include 2-3 contextual backlinks to ${params.targetUrl}
- Structure: H1, H2, H3 headings for SEO
- Include actionable tips and insights
- Make it valuable for readers interested in ${params.primaryKeyword}
${params.customInstructions ? `- Additional instructions: ${params.customInstructions}` : ''}

FORMAT: Return as JSON with this exact structure:
{
  "title": "Engaging SEO title with keyword",
  "content": "Full HTML formatted blog post with proper headings and structure",
  "metaDescription": "SEO meta description under 160 characters",
  "excerpt": "Brief excerpt for preview (150 characters max)",
  "contextualLinks": [{"anchor": "anchor text", "url": "${params.targetUrl}"}],
  "seoScore": 85,
  "keywords": ["${params.primaryKeyword}", ${params.secondaryKeywords.map(k => `"${k}"`).join(', ')}]
}`;
  }

  private async enhanceContent(result: any, params: ContentGenerationParams, providerName: string): Promise<GeneratedContent> {
    let parsedContent;
    
    try {
      // Try to parse as JSON first
      parsedContent = JSON.parse(result.content);
    } catch {
      // If not JSON, structure the content manually
      parsedContent = {
        title: `The Ultimate Guide to ${params.primaryKeyword}`,
        content: this.formatContentAsHTML(result.content, params),
        metaDescription: `Comprehensive guide to ${params.primaryKeyword} with expert insights and strategies.`,
        excerpt: `Discover everything about ${params.primaryKeyword} in this ultimate guide.`,
        contextualLinks: [{ anchor: params.primaryKeyword, url: params.targetUrl }],
        seoScore: 80,
        keywords: [params.primaryKeyword, ...params.secondaryKeywords]
      };
    }

    // Ensure backlinks are properly integrated
    const enhancedContent = await this.ensureBacklinkIntegration(parsedContent, params);

    return {
      title: enhancedContent.title,
      slug: this.generateSlug(enhancedContent.title),
      metaDescription: enhancedContent.metaDescription,
      content: enhancedContent.content,
      targetUrl: params.targetUrl,
      keywords: enhancedContent.keywords || [params.primaryKeyword, ...params.secondaryKeywords],
      wordCount: this.countWords(enhancedContent.content),
      createdAt: new Date().toISOString(),
      status: 'published',
      seoScore: enhancedContent.seoScore || 85,
      contextualLinks: this.generateContextualLinks(enhancedContent.content, params),
      provider: providerName,
      usage: result.usage
    };
  }

  private async ensureBacklinkIntegration(content: any, params: ContentGenerationParams): Promise<any> {
    // Check if backlinks are already present
    if (!content.content.includes(params.targetUrl)) {
      const domain = new URL(params.targetUrl).hostname.replace('www.', '');
      
      // Add natural backlinks to the content
      const linkVariations = [
        `<a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer">expert ${params.primaryKeyword} solutions</a>`,
        `<a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer">${domain}</a>`,
        `<a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer">comprehensive ${params.primaryKeyword} guide</a>`
      ];

      // Insert links at strategic positions
      content.content = content.content
        .replace(
          /\. ([A-Z][^.]*?)(expert|professional|comprehensive|leading)([^.]*?)\./,
          `. $1$2$3. For advanced strategies, visit ${linkVariations[0]} for expert guidance.`
        )
        .replace(
          /\. (In conclusion|To summarize|Finally)([^.]*?)\./,
          `. $1$2. Visit ${linkVariations[1]} to learn more about ${params.primaryKeyword}.`
        );
    }

    return content;
  }

  private generateFallbackContent(params: ContentGenerationParams, lastError: string): GeneratedContent {
    const title = `The Ultimate Guide to ${params.primaryKeyword}`;
    const domain = new URL(params.targetUrl).hostname.replace('www.', '');
    
    const content = `
      <h1>${title}</h1>
      
      <p>Understanding <strong>${params.primaryKeyword}</strong> is essential for success in today's competitive landscape. This comprehensive guide provides actionable insights and strategies to help you achieve your goals.</p>
      
      <h2>What is ${params.primaryKeyword}?</h2>
      <p>${params.primaryKeyword} has become increasingly important for businesses and individuals alike. Whether you're new to this field or looking to improve your existing knowledge, this guide covers all essential aspects.</p>
      
      <h2>Key Benefits of ${params.primaryKeyword}</h2>
      <ul>
        <li>Improved performance and measurable results</li>
        <li>Cost-effective solutions for your business</li>
        <li>Enhanced competitive positioning</li>
        <li>Better user experience and satisfaction</li>
      </ul>
      
      <h2>Best Practices for ${params.primaryKeyword}</h2>
      <p>To maximize your results with ${params.primaryKeyword}, it's important to follow proven strategies. <a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer">${domain}</a> offers comprehensive solutions and expert guidance for implementing effective ${params.primaryKeyword} strategies.</p>
      
      <h3>Getting Started</h3>
      <ol>
        <li>Define your objectives and goals</li>
        <li>Research best practices and industry standards</li>
        <li>Implement a strategic approach</li>
        <li>Monitor and optimize your results</li>
      </ol>
      
      <h2>Advanced Strategies</h2>
      <p>For those looking to take their ${params.primaryKeyword} efforts to the next level, consider exploring <a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer">advanced ${params.primaryKeyword} techniques</a> and industry-leading practices.</p>
      
      <h2>Conclusion</h2>
      <p>Mastering ${params.primaryKeyword} requires dedication and the right approach. By following the strategies outlined in this guide and leveraging professional resources like <a href="${params.targetUrl}" target="_blank" rel="noopener noreferrer">${domain}</a>, you'll be well-positioned for success.</p>
    `;

    return {
      title,
      slug: this.generateSlug(title),
      metaDescription: `Master ${params.primaryKeyword} with this comprehensive guide. Learn proven strategies and best practices.`,
      content,
      targetUrl: params.targetUrl,
      keywords: [params.primaryKeyword, ...params.secondaryKeywords],
      wordCount: this.countWords(content),
      createdAt: new Date().toISOString(),
      status: 'published',
      seoScore: 75,
      contextualLinks: this.generateContextualLinks(content, params),
      provider: 'Fallback Generator',
      usage: { tokens: 0, cost: 0, provider: 'Fallback' }
    };
  }

  // Utility methods
  private getAvailableProviders(): APIProvider[] {
    return this.providers.filter(p => p.isConfigured());
  }

  private canUseProvider(providerName: string): boolean {
    const usage = this.usageStats.get(providerName);
    const limit = this.dailyLimits.get(providerName);
    return !usage || !limit || usage.tokens < limit;
  }

  private trackUsage(providerName: string, tokens: number, cost: number): void {
    const current = this.usageStats.get(providerName) || { tokens: 0, cost: 0, requests: 0 };
    this.usageStats.set(providerName, {
      tokens: current.tokens + tokens,
      cost: current.cost + cost,
      requests: current.requests + 1
    });
  }

  private getToneTemperature(tone: string): number {
    const toneMap: Record<string, number> = {
      professional: 0.3,
      casual: 0.7,
      authoritative: 0.4,
      friendly: 0.6,
      academic: 0.2
    };
    return toneMap[tone] || 0.5;
  }

  private getSystemPrompt(contentType: string): string {
    const prompts: Record<string, string> = {
      'blog-post': 'You are a professional SEO content writer who creates engaging, informative blog posts with natural backlink integration.',
      'editorial': 'You are an editorial writer who creates thought-provoking, authoritative content with strategic link placement.',
      'guest-post': 'You are a guest post writer who creates valuable, shareable content that naturally incorporates backlinks.',
      'resource-page': 'You are a content strategist who creates comprehensive resource pages with relevant external links.'
    };
    return prompts[contentType] || prompts['blog-post'];
  }

  private mapContentTypeToRytrUseCase(contentType: string): string {
    const mapping: Record<string, string> = {
      'blog-post': 'blog_idea_outline',
      'editorial': 'blog_idea_outline', 
      'guest-post': 'blog_idea_outline',
      'resource-page': 'blog_idea_outline'
    };
    return mapping[contentType] || 'blog_idea_outline';
  }

  private mapToneToRytr(tone: string): string {
    const mapping: Record<string, string> = {
      professional: 'convincing',
      casual: 'casual',
      authoritative: 'convincing',
      friendly: 'casual',
      academic: 'convincing'
    };
    return mapping[tone] || 'convincing';
  }

  private formatContentAsHTML(content: string, params: ContentGenerationParams): string {
    // Basic HTML formatting for plain text content
    return content
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => `<p>${paragraph}</p>`)
      .join('\n\n');
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private countWords(content: string): number {
    return content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  }

  private generateContextualLinks(content: string, params: ContentGenerationParams): ContextualLink[] {
    const links: ContextualLink[] = [];
    const keywordPhrases = [params.primaryKeyword, ...params.secondaryKeywords];
    
    keywordPhrases.forEach((keyword, index) => {
      const position = content.indexOf(keyword);
      if (position > -1) {
        links.push({
          anchorText: keyword,
          targetUrl: params.targetUrl,
          position,
          context: content.substring(Math.max(0, position - 50), position + 50),
          seoRelevance: index === 0 ? 1.0 : 0.8
        });
      }
    });

    return links.slice(0, 3); // Limit to 3 links
  }

  // Public methods for monitoring and management
  async getProviderStatus(): Promise<{ [key: string]: { configured: boolean; working: boolean; usage: any } }> {
    const status: { [key: string]: { configured: boolean; working: boolean; usage: any } } = {};
    
    for (const provider of this.providers) {
      const configured = provider.isConfigured();
      let working = false;
      
      if (configured) {
        try {
          working = await provider.testConnection();
        } catch {
          working = false;
        }
      }
      
      status[provider.name] = {
        configured,
        working,
        usage: this.usageStats.get(provider.name) || { tokens: 0, cost: 0, requests: 0 }
      };
    }
    
    return status;
  }

  getUsageStats(): { [key: string]: { tokens: number; cost: number; requests: number } } {
    const stats: { [key: string]: { tokens: number; cost: number; requests: number } } = {};
    this.usageStats.forEach((value, key) => {
      stats[key] = { ...value };
    });
    return stats;
  }

  resetDailyUsage(): void {
    this.initializeUsageTracking();
  }
}

// Export singleton instance
export const productionAIContentManager = new ProductionAIContentManager();

// Export types
export type { ContentGenerationParams, GeneratedContent, ContextualLink };
