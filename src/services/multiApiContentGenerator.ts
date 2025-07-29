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

    grok: {
      name: 'xAI Grok',
      baseUrl: 'https://api.x.ai/v1',
      endpoint: '/chat/completions',
      model: 'grok-beta',
      getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GROK_API_KEY || process.env.GROK_API_KEY || ''}`
      }),
      getBody: (prompt: string) => ({
        model: 'grok-beta',
        messages: [{ role: 'user', content: prompt }]
      }),
      parseResponse: (data: any) => data.choices?.[0]?.message?.content || 'No content generated'
    },

    deepai: {
      name: 'DeepAI',
      baseUrl: 'https://api.deepai.org/api',
      endpoint: '/text-generator',
      getHeaders: () => ({
        'api-key': import.meta.env.VITE_DEEPAI_API_KEY || process.env.DEEPAI_API_KEY || ''
      }),
      getBody: (prompt: string) => new URLSearchParams({ text: prompt }),
      parseResponse: (data: any) => data.output || 'No content generated',
      method: 'POST'
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
   * Detect keyword category for appropriate content prompts
   */
  private detectKeywordCategory(keyword: string): string {
    const keywordLower = keyword.toLowerCase();

    // Food and cuisine keywords
    if (['sushi', 'pizza', 'pasta', 'burger', 'tacos', 'ramen', 'curry', 'salad', 'sandwich', 'soup', 'steak', 'chicken', 'seafood', 'dessert', 'cake', 'coffee', 'tea', 'wine', 'beer', 'cocktail', 'recipe', 'cooking', 'cuisine', 'restaurant', 'food'].some(food => keywordLower.includes(food))) {
      return 'food';
    }

    // Technology keywords
    if (['software', 'app', 'technology', 'computer', 'mobile', 'ai', 'artificial intelligence', 'machine learning', 'coding', 'programming', 'web development', 'database', 'cloud', 'cybersecurity', 'tech', 'digital'].some(tech => keywordLower.includes(tech))) {
      return 'technology';
    }

    // Health and fitness keywords
    if (['health', 'fitness', 'exercise', 'workout', 'nutrition', 'diet', 'wellness', 'medicine', 'doctor', 'therapy', 'mental health', 'yoga', 'meditation', 'medical'].some(health => keywordLower.includes(health))) {
      return 'health';
    }

    // Travel keywords
    if (['travel', 'vacation', 'tourism', 'hotel', 'flight', 'destination', 'trip', 'adventure', 'backpacking', 'cruise', 'resort', 'city', 'country', 'place'].some(travel => keywordLower.includes(travel))) {
      return 'travel';
    }

    // Education keywords
    if (['learn', 'study', 'education', 'course', 'tutorial', 'training', 'school', 'university', 'skill', 'knowledge'].some(edu => keywordLower.includes(edu))) {
      return 'education';
    }

    // Business and marketing keywords
    if (['marketing', 'business', 'strategy', 'seo', 'analytics', 'sales', 'entrepreneur', 'startup', 'investment', 'finance', 'management'].some(biz => keywordLower.includes(biz))) {
      return 'business';
    }

    return 'informational';
  }

  /**
   * Generate context-appropriate prompts based on keyword category
   */
  private generateCategoryPrompt(keyword: string, targetUrl: string, anchorText: string, category: string): string {
    const currentYear = new Date().getFullYear();

    switch (category) {
      case 'food':
        return `Write a comprehensive, engaging article about "${keyword}" that food enthusiasts will love. This should be a culinary guide covering:

        - The origins and cultural significance of ${keyword}
        - Different varieties and styles
        - How to properly enjoy and appreciate ${keyword}
        - Where to find the best ${keyword}
        - Tips for making ${keyword} at home
        - Nutritional aspects and benefits

        The article should be at least 1000 words, written in an enthusiastic food lover's tone, and naturally incorporate a helpful link to ${targetUrl} using the anchor text "${anchorText}" where it makes sense for readers seeking more information or resources.

        Format with proper HTML headers (h1, h2, h3) and ensure the content is genuinely useful for people interested in ${keyword}. Avoid business jargon - this is about food, not corporate strategies.`;

      case 'technology':
        return `Write a comprehensive, technical guide about "${keyword}" for ${currentYear}. Cover:

        - What ${keyword} is and how it works
        - Key features and capabilities
        - Implementation best practices
        - Real-world applications and use cases
        - Getting started with ${keyword}
        - Future trends and developments

        The article should be at least 1000 words, technically accurate but accessible, and naturally incorporate a link to ${targetUrl} using the anchor text "${anchorText}" where it provides value to readers.

        Format with proper HTML headers and ensure content is genuinely helpful for those learning about ${keyword}.`;

      case 'health':
        return `Write a comprehensive, evidence-based health guide about "${keyword}" for ${currentYear}. Include:

        - Understanding what ${keyword} means for health
        - Scientific benefits and research
        - Safe practices and recommendations
        - How to get started safely
        - Professional guidance and resources
        - Creating sustainable healthy habits

        The article should be at least 1000 words, health-focused and responsible, and naturally incorporate a link to ${targetUrl} using the anchor text "${anchorText}" for additional resources.

        Format with proper HTML headers and ensure all health advice is general and encourages professional consultation.`;

      case 'travel':
        return `Write an inspiring travel guide about "${keyword}" for ${currentYear}. Cover:

        - Why ${keyword} is worth visiting/experiencing
        - Planning and preparation tips
        - What to expect and highlights
        - Best times to visit
        - Budget considerations
        - Safety and practical advice

        The article should be at least 1000 words, inspiring yet practical, and naturally incorporate a link to ${targetUrl} using the anchor text "${anchorText}" for travel planning resources.

        Format with proper HTML headers and write from a traveler's perspective.`;

      case 'education':
        return `Write a comprehensive learning guide about "${keyword}" for ${currentYear}. Include:

        - Understanding the fundamentals of ${keyword}
        - Learning pathways and methods
        - Practical applications and benefits
        - Resources for continued learning
        - Tips for effective study and practice
        - Career and personal development opportunities

        The article should be at least 1000 words, educational and motivating, and naturally incorporate a link to ${targetUrl} using the anchor text "${anchorText}" for additional learning resources.

        Format with proper HTML headers and focus on genuine educational value.`;

      case 'business':
        return `Write a comprehensive business guide about "${keyword}" for ${currentYear}. Cover:

        - Understanding ${keyword} in business context
        - Strategic implementation approaches
        - Benefits and ROI considerations
        - Best practices and methodologies
        - Common challenges and solutions
        - Future trends and opportunities

        The article should be at least 1000 words, professional and actionable, and naturally incorporate a link to ${targetUrl} using the anchor text "${anchorText}" for business solutions.

        Format with proper HTML headers and focus on practical business value.`;

      default: // informational
        return `Write a comprehensive, informative guide about "${keyword}" for ${currentYear}. Cover:

        - Introduction and fundamental concepts
        - Key aspects and important considerations
        - Practical applications and examples
        - Getting started guidance
        - Tips for success and common pitfalls
        - Future outlook and developments

        The article should be at least 1000 words, informative and well-structured, and naturally incorporate a link to ${targetUrl} using the anchor text "${anchorText}" where it provides value.

        Format with proper HTML headers and ensure content is genuinely useful for readers interested in ${keyword}.`;
    }
  }

  /**
   * Generate blog content with SEO optimization and smart categorization
   */
  async generateBlogContent(keyword: string, targetUrl: string, anchorText: string): Promise<ContentGenerationResult> {
    // Detect keyword category for appropriate content
    const category = this.detectKeywordCategory(keyword);
    console.log(`🎯 Detected keyword category for "${keyword}": ${category}`);

    // Generate category-appropriate prompt
    const prompt = this.generateCategoryPrompt(keyword, targetUrl, anchorText, category);

    return this.generateContent({
      prompt,
      maxConcurrent: 3 // Limit to avoid rate limits
    });
  }
}

export const multiApiContentGenerator = new MultiApiContentGenerator();
