/**
 * OpenAI API Service
 * Handles GPT-4 content generation, text completion, and chat completions
 */

import { SecureConfig } from '@/lib/secure-config';

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
    maxRetries: 12,
    baseDelay: 1000,
    maxDelay: 60000,
    exponentialBackoff: true,
    retryOnRateLimit: true,
    retryOnServerError: true,
    timeoutMs: 45000,
    jitterFactor: 0.15,
    retryOnNetworkError: true,
    retryOnTimeout: true
  };

  constructor() {
    // Get API key from environment variables or secure config
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || SecureConfig.OPENAI_API_KEY;

    // List of known invalid/placeholder keys
    const invalidKeys = [
      'your-openai-api-key-here',
      'sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE',
      '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'
    ];

    if (!this.apiKey || invalidKeys.includes(this.apiKey)) {
      console.warn('❌ OpenAI API key not configured or invalid. Please set a valid VITE_OPENAI_API_KEY environment variable.');
      console.warn('📋 Get your API key from: https://platform.openai.com/api-keys');
      this.apiKey = ''; // Clear invalid key
    } else if (!this.apiKey.startsWith('sk-')) {
      console.warn('❌ OpenAI API key appears to be invalid format. Keys should start with "sk-"');
      console.warn('📋 Current key preview:', this.apiKey.substring(0, 10) + '...');
      this.apiKey = ''; // Clear invalid key
    } else {
      console.log('✅ OpenAI API key configured successfully');
      console.log('🔑 Key preview:', this.apiKey.substring(0, 10) + '...');
    }
  }

  /**
   * Serialize error to prevent [object Object] logging
   */
  private serializeError(error: any): { message: string; details: any } {
    if (!error) {
      return { message: 'Unknown error', details: {} };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        details: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause ? this.serializeError(error.cause) : undefined
        }
      };
    }

    if (typeof error === 'object') {
      try {
        return {
          message: error.message || error.error || 'API Error',
          details: {
            ...error,
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            toString: () => JSON.stringify(error, null, 2)
          }
        };
      } catch {
        return {
          message: 'Error serialization failed',
          details: { original: String(error) }
        };
      }
    }

    return {
      message: String(error),
      details: { original: error }
    };
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
        console.log(`🔄 OpenAI API attempt ${attempt + 1}/${config.maxRetries}${attempt > 0 ? ' (retry)' : ''}`);
        const result = await fn();

        if (attempt > 0) {
          console.log(`✅ OpenAI API succeeded on attempt ${attempt + 1}`);
        }

        return result;
      } catch (error) {
        // Ensure we always have a proper Error object
        if (error instanceof Error) {
          lastError = error;
        } else {
          lastError = new Error(`API error: ${String(error)}`);
          lastError.cause = error;
        }
        attempt++;

        // Check if we should retry based on error type
        const shouldRetry = this.shouldRetryError(lastError, config);

        if (!shouldRetry || attempt >= config.maxRetries) {
          const errorDetails = this.serializeError(lastError);
          console.error(`❌ OpenAI API failed after ${attempt} attempts:`, {
            error: errorDetails.message,
            details: errorDetails,
            stack: lastError?.stack,
            attempt,
            maxRetries: config.maxRetries,
            shouldRetry
          });
          // Add more detailed error information for debugging
          const errorMessage = errorDetails.message;
          const enhancedError = new Error(`OpenAI API failed after ${attempt} attempts: ${errorMessage}`);
          enhancedError.cause = lastError;
          throw enhancedError;
        }

        // Calculate delay with exponential backoff
        const delay = config.exponentialBackoff
          ? Math.min(config.baseDelay * Math.pow(2, attempt - 1), config.maxDelay)
          : config.baseDelay;

        // Add jitter to prevent thundering herd (more sophisticated)
        const jitterRange = delay * config.jitterFactor;
        const jitteredDelay = delay + (Math.random() * 2 - 1) * jitterRange;

        const errorDetails = this.serializeError(lastError);
        console.warn(`⏳ OpenAI API attempt ${attempt} failed: ${errorDetails.message}. Retrying in ${Math.round(jitteredDelay)}ms...`, {
          error: errorDetails.message,
          details: errorDetails,
          attempt,
          maxRetries: config.maxRetries,
          delay: Math.round(jitteredDelay),
          shouldRetry
        });

        await this.delay(jitteredDelay);
      }
    }

    // Ensure we always throw a proper Error with a string message
    const errorDetails = this.serializeError(lastError);
    const finalError = new Error(`OpenAI API failed: ${errorDetails.message}`);
    finalError.cause = lastError;
    throw finalError;
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetryError(error: Error, config: typeof this.defaultRetryConfig): boolean {
    const message = error.message.toLowerCase();

    // Always retry on network errors
    if (message.includes('network error') ||
        message.includes('fetch error') ||
        message.includes('connection refused') ||
        message.includes('connection reset') ||
        message.includes('econnreset') ||
        message.includes('enotfound') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('connection timed out') ||
        message.includes('socket hang up')) {
      console.log('🔄 Retrying due to network error:', message);
      return true;
    }

    // Retry on rate limits if configured
    if (config.retryOnRateLimit && (message.includes('429') || message.includes('rate limit'))) {
      console.log('🔄 Retrying due to rate limit:', message);
      return true;
    }

    // Retry on server errors if configured
    if (config.retryOnServerError && (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('507') ||
      message.includes('508') ||
      message.includes('520') ||
      message.includes('521') ||
      message.includes('522') ||
      message.includes('523') ||
      message.includes('524') ||
      message.includes('internal server error') ||
      message.includes('bad gateway') ||
      message.includes('service unavailable') ||
      message.includes('gateway timeout') ||
      message.includes('server overloaded')
    )) {
      return true;
    }

    // Retry on timeout errors
    if (message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('request timeout') ||
        message.includes('read timeout') ||
        message.includes('aborterror') ||
        message.includes('operation timed out')) {
      console.log('🔄 Retrying due to timeout error:', message);
      return true;
    }

    // Retry on temporary OpenAI issues
    if (message.includes('overloaded') ||
        message.includes('temporarily unavailable') ||
        message.includes('try again later') ||
        message.includes('service unavailable') ||
        message.includes('temporarily_unavailable') ||
        message.includes('model_overloaded')) {
      console.log('🔄 Retrying due to temporary OpenAI issue:', message);
      return true;
    }

    // Don't retry on authentication errors (but log them)
    if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key') || error.name === 'AuthenticationError') {
      console.error('🔑 Authentication error - check API key validity');
      return false;
    }

    // Don't retry on quota exceeded
    if (message.includes('quota') || message.includes('insufficient_quota')) {
      console.error('💳 Quota exceeded - check billing');
      return false;
    }

    // Don't retry on model not found
    if (message.includes('404') || message.includes('model not found')) {
      console.error('🤖 Model not found - check model availability');
      return false;
    }

    // Don't retry on content policy violations
    if (message.includes('content_filter') || message.includes('policy')) {
      console.error('🚫 Content policy violation');
      return false;
    }

    // Default to retry for unknown errors (defensive approach)
    console.warn('🔄 Unknown error, attempting retry:', message);
    return true;
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
    if (!this.isConfigured()) {
      const errorMessage = 'OpenAI API key not configured. Please visit https://platform.openai.com/api-keys to get a valid API key and set the VITE_OPENAI_API_KEY environment variable.';
      console.warn('❌', errorMessage);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: errorMessage
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

        // Enhanced fetch with timeout and abort controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalRetryConfig.timeoutMs || 30000);

        let response;
        try {
          response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'BacklinkooBot/1.0',
              'X-Request-ID': crypto.randomUUID()
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error(`Request timeout after ${finalRetryConfig.timeoutMs}ms`);
          }

          // Ensure we throw a proper Error object
          if (fetchError instanceof Error) {
            throw fetchError;
          } else {
            throw new Error(`Fetch error: ${String(fetchError)}`);
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = `OpenAI API error: ${response.status}`;
          let fullErrorContext = {
            status: response.status,
            statusText: response.statusText || 'No status text',
            errorData,
            timestamp: new Date().toISOString()
          };

          if (response.status === 404) {
            errorMessage += ' - Model not found. Check if the model name is correct and available.';
          } else if (response.status === 401) {
            errorMessage += ' - Invalid API key. Check your OpenAI API key.';
            // For 401 errors, we want to fail fast and not retry
            console.error('🔴 OpenAI API Authentication Error:', JSON.stringify(fullErrorContext, null, 2));
            const authError = new Error(errorMessage);
            authError.name = 'AuthenticationError';
            (authError as any).context = fullErrorContext;
            throw authError;
          } else if (response.status === 429) {
            errorMessage += ' - Rate limit exceeded. Will retry automatically.';
            if (errorData.error?.message) {
              errorMessage += ` Details: ${errorData.error.message}`;
            }
          } else if (response.status === 403) {
            errorMessage += ' - Access forbidden. Check your API key permissions or billing status.';
          } else if (response.status >= 500) {
            errorMessage += ' - OpenAI server error. Will retry automatically.';
          } else if (errorData.error?.message) {
            errorMessage += ` - ${errorData.error.message}`;
          } else {
            errorMessage += ` - ${response.statusText}`;
          }

          console.error('🔴 OpenAI API Error Details:', JSON.stringify(fullErrorContext, null, 2));
          const apiError = new Error(errorMessage);
          (apiError as any).context = fullErrorContext;
          throw apiError;
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
      const errorDetails = this.serializeError(error);
      console.error('❌ OpenAI API failed after all retries:', {
        error: errorDetails.message,
        details: errorDetails,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      let detailedError = 'Unknown error occurred';
      if (error instanceof Error) {
        detailedError = error.message;
        // Add context information if available
        if ((error as any).context) {
          const ctx = (error as any).context;
          detailedError += ` (Status: ${ctx.status}, Time: ${ctx.timestamp})`;
        }
      }

      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: detailedError
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.startsWith('sk-')) {
      console.log('⚠️ Skipping OpenAI connection test - no valid API key configured');
      return false;
    }

    try {
      console.log('🔍 Testing OpenAI connection with retry logic...');

      const result = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.baseURL}/models`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Connection test failed: ${response.status} - ${errorText}`);
        }

        return response.ok;
      }, {
        ...this.defaultRetryConfig,
        maxRetries: 1, // Only try once for connection test to avoid spam
        baseDelay: 1000
      });

      console.log('✅ OpenAI connection test successful');
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ OpenAI connection test failed:', errorMsg);
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith('sk-') && this.apiKey.length > 20);
  }
}

export const openAIService = new OpenAIService();

// Also export enhanced service for components that need maximum reliability
export { enhancedOpenAIService } from './enhancedOpenAI';
