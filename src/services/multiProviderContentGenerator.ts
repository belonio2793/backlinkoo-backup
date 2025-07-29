/**
 * Multi-Provider Content Generator
 * Intelligent fallback system that tries multiple AI providers
 * to ensure content generation "always works"
 */

import { openAIService } from './api/openai';
import { cohereService } from './api/cohere';
import { deepAIService } from './api/deepai';
import { netlifyContentGenerator } from './netlifyContentGenerator';
import { retryEventEmitter } from './retryEventEmitter';

export interface MultiProviderRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'convincing';
  contentType?: 'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion';
  providerOrder?: ('openai' | 'cohere' | 'deepai')[];
}

export interface ProviderResult {
  content: string;
  usage: { tokens: number; cost: number };
  success: boolean;
  error?: string;
  provider: string;
  attemptNumber: number;
  timestamp: string;
}

export interface MultiProviderResponse {
  success: boolean;
  result?: ProviderResult;
  attemptLog: Array<{
    provider: string;
    success: boolean;
    error?: string;
    timestamp: string;
  }>;
  fallbacksUsed: string[];
  totalAttempts: number;
}

export class MultiProviderContentGenerator {
  private providers = {
    openai: openAIService,
    cohere: cohereService,
    deepai: deepAIService
  };

  private defaultProviderOrder: ('openai' | 'cohere' | 'deepai')[] = [
    'openai',
    'cohere', 
    'deepai'
  ];

  async generateContent(request: MultiProviderRequest): Promise<MultiProviderResponse> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const attemptLog: MultiProviderResponse['attemptLog'] = [];
    const fallbacksUsed: string[] = [];
    
    // Determine provider order (randomize for load balancing)
    const providerOrder = request.providerOrder || this.getRandomizedProviderOrder();
    
    console.log('🚀 Starting multi-provider content generation:', {
      requestId,
      providerOrder,
      keyword: request.primaryKeyword
    });

    // Emit start event
    retryEventEmitter.emit({
      type: 'retry',
      attempt: 0,
      maxAttempts: providerOrder.length,
      timestamp: new Date().toISOString(),
      requestId
    });

    // Try client-side providers first
    for (let i = 0; i < providerOrder.length; i++) {
      const provider = providerOrder[i];
      const attemptNumber = i + 1;
      const isClientSideAttempt = true;

      console.log(`🔄 Attempting provider ${attemptNumber}/${providerOrder.length}: ${provider}`);

      try {
        // Emit retry event
        retryEventEmitter.emit({
          type: 'retry',
          attempt: attemptNumber,
          maxAttempts: providerOrder.length,
          timestamp: new Date().toISOString(),
          requestId
        });

        const result = await this.attemptGeneration(provider, request);
        
        if (result.success && result.content) {
          console.log(`✅ Success with ${provider} on attempt ${attemptNumber}`);
          
          // Log successful attempt
          attemptLog.push({
            provider,
            success: true,
            timestamp: new Date().toISOString()
          });

          // Track fallbacks used
          if (attemptNumber > 1) {
            fallbacksUsed.push(...providerOrder.slice(0, attemptNumber - 1));
          }

          // Emit success event
          retryEventEmitter.emit({
            type: 'success',
            attempt: attemptNumber,
            maxAttempts: providerOrder.length,
            timestamp: new Date().toISOString(),
            requestId
          });

          return {
            success: true,
            result: {
              ...result,
              provider,
              attemptNumber,
              timestamp: new Date().toISOString()
            },
            attemptLog,
            fallbacksUsed,
            totalAttempts: attemptNumber
          };
        } else {
          throw new Error(result.error || `${provider} generation failed`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`❌ ${provider} failed (attempt ${attemptNumber}):`, errorMessage);

        // Log failed attempt
        attemptLog.push({
          provider,
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        });

        // Emit error event
        retryEventEmitter.emit({
          type: 'error',
          attempt: attemptNumber,
          maxAttempts: providerOrder.length,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          requestId
        });

        // If this is the last client-side provider, try Netlify functions as ultra-fallback
        if (i === providerOrder.length - 1) {
          console.log('🌐 All client-side providers failed, trying Netlify functions ultra-fallback...');

          try {
            if (netlifyContentGenerator.isAvailable()) {
              const netlifyRequest = {
                keyword: request.primaryKeyword,
                url: request.targetUrl,
                anchorText: request.anchorText,
                wordCount: request.wordCount,
                contentType: request.contentType,
                tone: request.tone
              };

              const netlifyResult = await netlifyContentGenerator.generateContent(netlifyRequest);

              if (netlifyResult.success && netlifyResult.content) {
                console.log('✅ Netlify functions ultra-fallback succeeded!');

                // Log successful attempt
                attemptLog.push({
                  provider: 'netlify-fallback',
                  success: true,
                  timestamp: new Date().toISOString()
                });

                return {
                  success: true,
                  result: {
                    content: netlifyResult.content,
                    usage: netlifyResult.usage || { tokens: 0, cost: 0 },
                    success: true,
                    provider: netlifyResult.provider || 'netlify-fallback',
                    attemptNumber: providerOrder.length + 1,
                    timestamp: new Date().toISOString()
                  },
                  attemptLog,
                  fallbacksUsed: [...providerOrder, ...(netlifyResult.fallbacksUsed || [])],
                  totalAttempts: providerOrder.length + (netlifyResult.totalAttempts || 1)
                };
              } else {
                throw new Error(netlifyResult.error || 'Netlify functions failed');
              }
            } else {
              console.log('🚫 Netlify functions not available in this environment');
            }
          } catch (netlifyError) {
            console.warn('❌ Netlify functions ultra-fallback failed:', netlifyError);

            attemptLog.push({
              provider: 'netlify-fallback',
              success: false,
              error: netlifyError instanceof Error ? netlifyError.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
          }

          console.error('💀 All providers (including Netlify functions) failed');

          return {
            success: false,
            attemptLog,
            fallbacksUsed: [...providerOrder, 'netlify-fallback'],
            totalAttempts: providerOrder.length + 1
          };
        }

        // Add exponential backoff between providers
        const backoffDelay = Math.min(1000 * Math.pow(2, i), 5000);
        console.log(`⏳ Waiting ${backoffDelay}ms before trying next provider...`);
        await this.delay(backoffDelay);
      }
    }

    // This shouldn't be reached, but just in case
    return {
      success: false,
      attemptLog,
      fallbacksUsed: providerOrder,
      totalAttempts: providerOrder.length
    };
  }

  private async attemptGeneration(
    providerName: keyof typeof this.providers, 
    request: MultiProviderRequest
  ): Promise<ProviderResult> {
    const provider = this.providers[providerName];
    
    if (!provider.isConfigured()) {
      throw new Error(`${providerName} is not configured`);
    }

    // Create optimized prompt
    const prompt = this.createPrompt(request);
    const systemPrompt = this.createSystemPrompt(request.contentType || 'how-to', request.tone || 'professional');

    // Provider-specific options
    const options = {
      maxTokens: Math.min(4000, Math.floor((request.wordCount || 1500) * 2.5)),
      temperature: 0.7,
      systemPrompt
    };

    // Add retry configuration for OpenAI
    if (providerName === 'openai') {
      (options as any).retryConfig = {
        maxRetries: 5, // Fewer retries per provider to allow fallbacks
        baseDelay: 1000,
        maxDelay: 10000,
        exponentialBackoff: true,
        retryOnRateLimit: true,
        retryOnServerError: true
      };
    }

    const result = await provider.generateContent(prompt, options);
    
    return {
      content: result.content,
      usage: result.usage,
      success: result.success,
      error: result.error,
      provider: providerName,
      attemptNumber: 0, // Will be set by caller
      timestamp: new Date().toISOString()
    };
  }

  private getRandomizedProviderOrder(): ('openai' | 'cohere' | 'deepai')[] {
    // Start with configured providers only
    const availableProviders = this.defaultProviderOrder.filter(provider => 
      this.providers[provider].isConfigured()
    );

    if (availableProviders.length === 0) {
      return ['openai']; // Fallback to openai even if not configured
    }

    // Randomize but prefer OpenAI if available
    const shuffled = [...availableProviders];
    
    // 70% chance to put OpenAI first if it's available
    if (shuffled.includes('openai') && Math.random() > 0.3) {
      shuffled.splice(shuffled.indexOf('openai'), 1);
      shuffled.unshift('openai');
    }

    return shuffled;
  }

  private createPrompt(request: MultiProviderRequest): string {
    const {
      targetUrl,
      primaryKeyword,
      anchorText,
      wordCount = 1500,
      contentType = 'how-to'
    } = request;

    return `Create a comprehensive ${wordCount}-word ${contentType} blog post about "${primaryKeyword}" that naturally incorporates a backlink.

CONTENT REQUIREMENTS:
- Write exactly ${wordCount} words of high-quality, original content
- Focus on "${primaryKeyword}" as the main topic
- Include practical, actionable advice
- Structure with proper headings (H1, H2, H3)
- Natural integration of anchor text "${anchorText || primaryKeyword}" linking to ${targetUrl}

CONTENT STRUCTURE:
1. Compelling H1 title with the primary keyword
2. Engaging introduction that hooks the reader
3. 4-6 main sections with H2 headings
4. Subsections with H3 headings where appropriate
5. Natural placement of backlink: "${anchorText || primaryKeyword}" → ${targetUrl}
6. Strong conclusion with actionable takeaways

SEO OPTIMIZATION:
- Include primary keyword "${primaryKeyword}" naturally throughout
- Use semantic keywords and related terms
- Include numbered lists or bullet points
- Write compelling meta description

BACKLINK INTEGRATION:
- Place the backlink "${anchorText || primaryKeyword}" naturally within the content
- Make the link contextually relevant to the surrounding text
- Ensure it adds value to the reader

OUTPUT FORMAT:
Return the content as HTML with proper tags:
- Use <h1> for main title
- Use <h2> for main sections
- Use <h3> for subsections
- Use <p> for paragraphs
- Use <ul>/<ol> and <li> for lists
- Use <strong> for emphasis
- Use <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${anchorText || primaryKeyword}</a> for the backlink

Focus on creating valuable, informative content that genuinely helps readers.`;
  }

  private createSystemPrompt(contentType: string, tone: string): string {
    const basePrompt = `You are an expert SEO content writer specializing in creating high-quality, engaging blog posts that rank well in search engines.`;

    const contentTypePrompts = {
      'how-to': 'Focus on step-by-step instructions, practical tips, and actionable advice.',
      'listicle': 'Create numbered or bulleted lists with detailed explanations for each point.',
      'review': 'Provide balanced analysis with pros, cons, and honest recommendations.',
      'comparison': 'Compare options objectively with clear criteria and recommendations.',
      'news': 'Present information clearly with context and analysis.',
      'opinion': 'Share insights and perspectives while backing up claims with evidence.'
    };

    const tonePrompts = {
      'professional': 'Use formal, authoritative language suitable for business contexts.',
      'casual': 'Write in a friendly, conversational tone that feels approachable.',
      'technical': 'Use precise terminology and detailed explanations for technical audiences.',
      'friendly': 'Maintain warmth and approachability while being informative.',
      'convincing': 'Use persuasive language and compelling arguments.'
    };

    return `${basePrompt} ${contentTypePrompts[contentType as keyof typeof contentTypePrompts] || contentTypePrompts['how-to']} ${tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts['professional']} Always create original, valuable content that genuinely helps readers and ensures natural, contextual backlink integration.`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get status of all providers
   */
  getProviderStatus(): Record<string, boolean> {
    return {
      openai: this.providers.openai.isConfigured(),
      cohere: this.providers.cohere.isConfigured(),
      deepai: this.providers.deepai.isConfigured()
    };
  }

  /**
   * Test all provider connections
   */
  async testAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        results[name] = await provider.testConnection();
      } catch (error) {
        results[name] = false;
      }
    }
    
    return results;
  }
}

export const multiProviderContentGenerator = new MultiProviderContentGenerator();
