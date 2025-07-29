/**
 * Multi-API Content Generation Service
 * Fetches content from multiple AI providers for enhanced blog generation
 * Based on ChatGPT conversation specifications
 */

export interface ApiProvider {
  name: string;
  baseUrl: string;
  endpoint: string;
  model?: string;
  available: boolean;
}

export interface ApiResponse {
  provider: string;
  content: string;
  success: boolean;
  error?: string;
  processingTime: number;
}

export interface ContentGenerationRequest {
  prompt: string;
  providers?: string[];
  maxConcurrent?: number;
}

export interface ContentGenerationResult {
  success: boolean;
  responses: ApiResponse[];
  bestResponse?: ApiResponse;
  aggregatedContent?: string;
  processingTime: number;
}

export class MultiApiContentGenerator {
  private apiConfigs = {
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      endpoint: '/chat/completions',
      model: 'gpt-4o',
      getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''}`
      }),
      getBody: (prompt: string) => ({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000
      }),
      parseResponse: (data: any) => data.choices?.[0]?.message?.content || 'No content generated'
    },





    huggingface: {
      name: 'Hugging Face',
      baseUrl: 'https://router.huggingface.co/v1',
      endpoint: '/chat/completions',
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_HF_ACCESS_TOKEN || process.env.HF_ACCESS_TOKEN || ''}`
      }),
      getBody: (prompt: string) => ({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        messages: [{ role: 'user', content: prompt }]
      }),
      parseResponse: (data: any) => data.choices?.[0]?.message?.content || 'No content generated'
    },

    cohere: {
      name: 'Cohere',
      baseUrl: 'https://api.cohere.ai/v1',
      endpoint: '/chat',
      getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_COHERE_API_KEY || process.env.COHERE_API_KEY || ''}`
      }),
      getBody: (prompt: string) => ({
        message: prompt
      }),
      parseResponse: (data: any) => data.text || 'No content generated'
    },

    rytr: {
      name: 'Rytr',
      baseUrl: 'https://api.rytr.me/v1',
      endpoint: '/contents',
      getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_RYTR_API_KEY || process.env.RYTR_API_KEY || ''}`
      }),
      getBody: (prompt: string) => ({
        useCaseId: 'blog-idea',
        input: { topic: prompt },
        toneId: 'formal',
        languageId: 'en'
      }),
      parseResponse: (data: any) => data.data?.output || data.output || 'No content generated'
    }
  };

  /**
   * Get available API providers with configuration status
   */
  async getAvailableProviders(): Promise<ApiProvider[]> {
    return Object.entries(this.apiConfigs).map(([key, config]) => ({
      name: config.name,
      baseUrl: config.baseUrl,
      endpoint: config.endpoint,
      model: config.model,
      available: this.hasApiKey(key)
    }));
  }

  /**
   * Check if API key is available for a provider
   */
  private hasApiKey(provider: string): boolean {
    const envKeys = {
      openai: import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      grok: import.meta.env.VITE_GROK_API_KEY || process.env.GROK_API_KEY,
      deepai: import.meta.env.VITE_DEEPAI_API_KEY || process.env.DEEPAI_API_KEY,
      huggingface: import.meta.env.VITE_HF_ACCESS_TOKEN || process.env.HF_ACCESS_TOKEN,
      cohere: import.meta.env.VITE_COHERE_API_KEY || process.env.COHERE_API_KEY,
      rytr: import.meta.env.VITE_RYTR_API_KEY || process.env.RYTR_API_KEY
    };

    return Boolean(envKeys[provider as keyof typeof envKeys]);
  }

  /**
   * Fetch content from a single API provider
   */
  private async fetchFromProvider(provider: string, prompt: string): Promise<ApiResponse> {
    const startTime = Date.now();
    const config = this.apiConfigs[provider as keyof typeof this.apiConfigs];

    if (!config) {
      return {
        provider,
        content: '',
        success: false,
        error: 'Provider not configured',
        processingTime: Date.now() - startTime
      };
    }

    if (!this.hasApiKey(provider)) {
      return {
        provider: config.name,
        content: '',
        success: false,
        error: 'API key not configured',
        processingTime: Date.now() - startTime
      };
    }

    try {
      const headers = config.getHeaders();
      const body = config.getBody(prompt);
      const method = config.method || 'POST';

      const response = await fetch(`${config.baseUrl}${config.endpoint}`, {
        method,
        headers,
        body: body instanceof URLSearchParams ? body : JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = config.parseResponse(data);

      return {
        provider: config.name,
        content,
        success: true,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`Error fetching from ${config.name}:`, error);
      return {
        provider: config.name,
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate content from multiple API providers concurrently
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    
    // Determine which providers to use
    const requestedProviders = request.providers || Object.keys(this.apiConfigs);
    const availableProviders = requestedProviders.filter(provider => this.hasApiKey(provider));
    
    console.log('🚀 Multi-API Content Generation:', {
      requested: requestedProviders,
      available: availableProviders,
      prompt: request.prompt.substring(0, 50) + '...'
    });

    if (availableProviders.length === 0) {
      return {
        success: false,
        responses: [],
        processingTime: Date.now() - startTime
      };
    }

    // Limit concurrent requests
    const maxConcurrent = request.maxConcurrent || 3;
    const providersToUse = availableProviders.slice(0, maxConcurrent);

    // Fetch from all providers concurrently
    const providerPromises = providersToUse.map(provider => 
      this.fetchFromProvider(provider, request.prompt)
    );

    const responses = await Promise.all(providerPromises);
    const successfulResponses = responses.filter(r => r.success);

    // Find the best response (longest content that's successful)
    const bestResponse = successfulResponses.reduce((best, current) => {
      if (!best || (current.content.length > best.content.length)) {
        return current;
      }
      return best;
    }, undefined as ApiResponse | undefined);

    // Create aggregated content
    const aggregatedContent = this.aggregateResponses(successfulResponses);

    const result: ContentGenerationResult = {
      success: successfulResponses.length > 0,
      responses,
      bestResponse,
      aggregatedContent,
      processingTime: Date.now() - startTime
    };

    console.log('✅ Multi-API Generation Complete:', {
      total: responses.length,
      successful: successfulResponses.length,
      bestProvider: bestResponse?.provider,
      totalTime: `${result.processingTime}ms`
    });

    return result;
  }

  /**
   * Aggregate responses from multiple providers into a single content piece
   */
  private aggregateResponses(responses: ApiResponse[]): string {
    if (responses.length === 0) return '';
    if (responses.length === 1) return responses[0].content;

    // Use the longest response as the base and add insights from others
    const sortedByLength = responses.sort((a, b) => b.content.length - a.content.length);
    const primary = sortedByLength[0];
    
    // For now, just return the best response
    // In future, could implement content merging logic
    return primary.content;
  }

  /**
   * Test API connectivity for all providers
   */
  async testProviders(): Promise<{ [provider: string]: { available: boolean; configured: boolean; error?: string } }> {
    const testPrompt = "Test connection";
    const results: { [provider: string]: { available: boolean; configured: boolean; error?: string } } = {};

    for (const [key, config] of Object.entries(this.apiConfigs)) {
      const hasKey = this.hasApiKey(key);
      results[config.name] = {
        available: false,
        configured: hasKey,
        error: hasKey ? undefined : 'API key not configured'
      };

      if (hasKey) {
        try {
          const response = await this.fetchFromProvider(key, testPrompt);
          results[config.name].available = response.success;
          if (!response.success) {
            results[config.name].error = response.error;
          }
        } catch (error) {
          results[config.name].error = error instanceof Error ? error.message : 'Connection test failed';
        }
      }
    }

    return results;
  }

  /**
   * Generate blog content with SEO optimization
   */
  async generateBlogContent(keyword: string, targetUrl: string, anchorText: string): Promise<ContentGenerationResult> {
    const prompt = `Write a comprehensive, SEO-optimized blog post about "${keyword}". The article should be at least 1000 words and naturally incorporate a link to ${targetUrl} using the anchor text "${anchorText}". Include proper headings, engaging content, and valuable information for readers. Format with markdown headers and ensure high-quality, grammatically correct content.`;

    return this.generateContent({
      prompt,
      maxConcurrent: 3 // Limit to avoid rate limits
    });
  }
}

export const multiApiContentGenerator = new MultiApiContentGenerator();
