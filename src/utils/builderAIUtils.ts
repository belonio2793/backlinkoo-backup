/**
 * Builder.io AI Agent Utilities
 * Custom retry logic for OpenAI content generation with Builder.io integration
 */

import { openAIContentGenerator, ContentGenerationRequest } from '@/services/openAIContentGenerator';

export interface BuilderAIRetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
  retryOnRateLimit?: boolean;
  retryOnServerError?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (attempt: number, content: string) => void;
  onFailure?: (totalAttempts: number, finalError: Error) => void;
}

/**
 * Generate content with Builder.io agent retry logic
 * Use this function in Builder.io custom code blocks or agent workflows
 */
export async function generateContentWithRetry(
  targetUrl: string,
  primaryKeyword: string,
  options: {
    anchorText?: string;
    wordCount?: number;
    tone?: 'professional' | 'casual' | 'technical' | 'friendly' | 'convincing';
    contentType?: 'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion';
    retryConfig?: BuilderAIRetryConfig;
  } = {}
): Promise<{
  success: boolean;
  content?: string;
  title?: string;
  metaDescription?: string;
  seoScore?: number;
  wordCount?: number;
  totalAttempts?: number;
  error?: string;
}> {
  const {
    anchorText,
    wordCount = 1500,
    tone = 'professional',
    contentType = 'how-to',
    retryConfig = {}
  } = options;

  // Default retry configuration optimized for Builder.io agents
  const defaultConfig: BuilderAIRetryConfig = {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    exponentialBackoff: true,
    retryOnRateLimit: true,
    retryOnServerError: true,
    ...retryConfig
  };

  console.log('🤖 Builder.io Agent: Starting content generation with advanced retry logic');

  try {
    const request: ContentGenerationRequest = {
      targetUrl,
      primaryKeyword,
      anchorText,
      wordCount,
      tone,
      contentType,
      retryConfig: {
        maxRetries: defaultConfig.maxRetries,
        baseDelay: defaultConfig.baseDelay,
        maxDelay: defaultConfig.maxDelay,
        exponentialBackoff: defaultConfig.exponentialBackoff,
        retryOnRateLimit: defaultConfig.retryOnRateLimit,
        retryOnServerError: defaultConfig.retryOnServerError
      }
    };

    const result = await openAIContentGenerator.generateContent(request);

    if (defaultConfig.onSuccess) {
      defaultConfig.onSuccess(1, result.content);
    }

    console.log('✅ Builder.io Agent: Content generation successful');

    return {
      success: true,
      content: result.content,
      title: result.title,
      metaDescription: result.metaDescription,
      seoScore: result.seoScore,
      wordCount: result.wordCount,
      totalAttempts: 1
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (defaultConfig.onFailure) {
      defaultConfig.onFailure(defaultConfig.maxRetries || 5, error as Error);
    }

    console.error('❌ Builder.io Agent: Content generation failed after all retries:', errorMessage);

    return {
      success: false,
      totalAttempts: defaultConfig.maxRetries || 5,
      error: errorMessage
    };
  }
}

/**
 * Simple fetch wrapper with retry logic for Builder.io agents
 * Use this for custom OpenAI API calls in Builder.io code blocks
 */
export async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retryConfig: BuilderAIRetryConfig = {}
): Promise<Response> {
  const {
    maxRetries = 5,
    baseDelay = 1500,
    exponentialBackoff = true,
    onRetry
  } = retryConfig;

  let attempt = 0;
  let lastError: Error;

  while (attempt < maxRetries) {
    try {
      console.log(`🔄 Builder.io Agent: Fetch attempt ${attempt + 1}/${maxRetries}`);
      
      const response = await fetch(url, options);
      
      if (response.ok) {
        if (attempt > 0) {
          console.log(`✅ Builder.io Agent: Fetch succeeded on attempt ${attempt + 1}`);
        }
        return response;
      }

      // Handle HTTP errors
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${response.status}`);
      } else if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      } else if (response.status === 401) {
        throw new Error(`Authentication failed: ${response.status}`);
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }

    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      if (attempt >= maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = exponentialBackoff 
        ? Math.min(baseDelay * Math.pow(2, attempt - 1), 30000)
        : baseDelay;

      // Add jitter
      const jitteredDelay = delay + Math.random() * 1000;

      console.warn(`⏳ Builder.io Agent: Attempt ${attempt} failed: ${lastError.message}. Retrying in ${Math.round(jitteredDelay)}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError!;
}

/**
 * Example usage for Builder.io agents:
 * 
 * // In a Builder.io custom code block:
 * import { generateContentWithRetry } from '@/utils/builderAIUtils';
 * 
 * const result = await generateContentWithRetry(
 *   'https://example.com',
 *   'AI automation tools',
 *   {
 *     wordCount: 2000,
 *     tone: 'professional',
 *     contentType: 'how-to',
 *     retryConfig: {
 *       maxRetries: 7,
 *       baseDelay: 2000,
 *       onRetry: (attempt, error) => {
 *         console.log(`Retry attempt ${attempt}: ${error.message}`);
 *       },
 *       onSuccess: (attempts, content) => {
 *         console.log(`Success after ${attempts} attempts. Content length: ${content.length}`);
 *       }
 *     }
 *   }
 * );
 * 
 * if (result.success) {
 *   // Use result.content in your Builder.io component
 *   return result.content;
 * } else {
 *   console.error('Content generation failed:', result.error);
 * }
 */

// Make functions available globally for Builder.io agent usage
if (typeof window !== 'undefined') {
  (window as any).generateContentWithRetry = generateContentWithRetry;
  (window as any).fetchWithRetry = fetchWithRetry;
}
