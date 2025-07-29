/**
 * OpenAI API Service
 * Handles GPT-4 content generation, text completion, and chat completions
 */

interface OpenAIRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';
  private defaultRetryConfig = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBackoff: true,
    retryOnRateLimit: true,
    retryOnServerError: true
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY ||
                  (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : '') ||
                  '';

    if (!this.apiKey) {
      console.warn('OpenAI API key not configured');
    }
  }

  /**
   * Retry function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: typeof this.defaultRetryConfig = this.defaultRetryConfig
  ): Promise<T> {
    let attempt = 0;
    let lastError: Error;

    while (attempt < config.maxRetries) {
      try {
        console.log(`🔄 OpenAI API attempt ${attempt + 1}/${config.maxRetries}`);
        const result = await fn();

        if (attempt > 0) {
          console.log(`✅ OpenAI API succeeded on attempt ${attempt + 1}`);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if we should retry based on error type
        const shouldRetry = this.shouldRetryError(error as Error, config);

        if (!shouldRetry || attempt >= config.maxRetries) {
          console.error(`❌ OpenAI API failed after ${attempt} attempts:`, lastError.message);
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = config.exponentialBackoff
          ? Math.min(config.baseDelay * Math.pow(2, attempt - 1), config.maxDelay)
          : config.baseDelay;

        // Add some jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        console.warn(`⏳ OpenAI API attempt ${attempt} failed: ${lastError.message}. Retrying in ${Math.round(jitteredDelay)}ms...`);

        await this.delay(jitteredDelay);
      }
    }

    throw lastError!;
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetryError(error: Error, config: typeof this.defaultRetryConfig): boolean {
    const message = error.message.toLowerCase();

    // Always retry on network errors
    if (message.includes('network error') || message.includes('fetch error')) {
      return true;
    }

    // Retry on rate limits if configured
    if (config.retryOnRateLimit && (message.includes('429') || message.includes('rate limit'))) {
      return true;
    }

    // Retry on server errors if configured
    if (config.retryOnServerError && (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('internal server error') ||
      message.includes('bad gateway') ||
      message.includes('service unavailable') ||
      message.includes('gateway timeout')
    )) {
      return true;
    }

    // Retry on timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return true;
    }

    // Don't retry on authentication errors
    if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key')) {
      return false;
    }

    // Don't retry on quota exceeded
    if (message.includes('quota') || message.includes('insufficient_quota')) {
      return false;
    }

    // Don't retry on model not found
    if (message.includes('404') || message.includes('model not found')) {
      return false;
    }

    // Default to no retry for unknown errors
    return false;
  }

  /**
   * Simple delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
    retryConfig?: Partial<typeof this.defaultRetryConfig>;
  } = {}): Promise<{
    content: string;
    usage: { tokens: number; cost: number };
    success: boolean;
    error?: string;
  }> {
    if (!this.apiKey) {
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 3500,
      temperature = 0.7,
      systemPrompt = 'You are a professional SEO content writer who creates high-quality, engaging blog posts with natural backlink integration.',
      retryConfig = {}
    } = options;

    const finalRetryConfig = { ...this.defaultRetryConfig, ...retryConfig };

    try {
      console.log('🚀 Starting OpenAI content generation with retry logic:', {
        model,
        maxTokens,
        temperature,
        maxRetries: finalRetryConfig.maxRetries
      });

      const result = await this.retryWithBackoff(async () => {
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ];

        const requestBody: OpenAIRequest = {
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        };

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = `OpenAI API error: ${response.status}`;

          if (response.status === 404) {
            errorMessage += ' - Model not found. Check if the model name is correct and available.';
          } else if (response.status === 401) {
            errorMessage += ' - Invalid API key. Check your OpenAI API key.';
          } else if (response.status === 429) {
            errorMessage += ' - Rate limit exceeded. Will retry automatically.';
          } else if (errorData.error?.message) {
            errorMessage += ` - ${errorData.error.message}`;
          } else {
            errorMessage += ` - ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        const data: OpenAIResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
          throw new Error('No content generated from OpenAI');
        }

        const content = data.choices[0].message.content;

        // Validate content quality - retry if content is too short or empty
        if (!content || content.trim().length < 100) {
          throw new Error('Generated content is too short or empty, retrying...');
        }

        const tokens = data.usage.total_tokens;

        // Estimate cost based on model (approximate pricing)
        const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000002;
        const cost = tokens * costPerToken;

        console.log('✅ OpenAI generation successful:', {
          contentLength: content.length,
          tokens,
          cost: `$${cost.toFixed(4)}`
        });

        return {
          content,
          usage: { tokens, cost },
          success: true
        };
      }, finalRetryConfig);

      return result;

    } catch (error) {
      console.error('❌ OpenAI API failed after all retries:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      console.log('🔍 Testing OpenAI connection with retry logic...');

      const result = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseURL}/models`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (!response.ok) {
          throw new Error(`Connection test failed: ${response.status} - ${response.statusText}`);
        }

        return response.ok;
      }, {
        ...this.defaultRetryConfig,
        maxRetries: 3, // Use fewer retries for connection test
        baseDelay: 500
      });

      console.log('✅ OpenAI connection test successful');
      return result;
    } catch (error) {
      console.error('❌ OpenAI connection test failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}

export const openAIService = new OpenAIService();
