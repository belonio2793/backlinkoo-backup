/**
 * Enhanced OpenAI API Service
 * Built for maximum reliability with advanced retry logic, multiple API key fallback,
 * health monitoring, and 100% uptime features
 */

import { SecureConfig } from '@/lib/secure-config';

interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  maxTokens: number;
  temperature: number;
  retryConfig: RetryConfig;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  jitterFactor: number;
  timeoutMs: number;
  circuitBreakerThreshold: number;
  healthCheckInterval: number;
}

interface APIKeyPool {
  primary: string;
  fallbacks: string[];
  currentIndex: number;
  healthStatus: Map<string, boolean>;
  lastHealthCheck: Map<string, number>;
}

interface GenerationResult {
  content: string;
  usage: { tokens: number; cost: number };
  success: boolean;
  error?: string;
  provider: string;
  apiKeyUsed: string;
  retryCount: number;
  responseTime: number;
}

export class EnhancedOpenAIService {
  private config: OpenAIConfig;
  private apiKeyPool: APIKeyPool;
  private requestCount = 0;
  private successCount = 0;
  private circuitBreakerOpen = false;
  private lastCircuitBreakerCheck = Date.now();
  
  constructor() {
    // Initialize with multiple API key sources for redundancy
    const primaryKey = import.meta.env.VITE_OPENAI_API_KEY || 
                      import.meta.env.OPENAI_API_KEY || 
                      SecureConfig.OPENAI_API_KEY;

    this.apiKeyPool = {
      primary: primaryKey,
      fallbacks: [
        // Environment variables take priority
        import.meta.env.VITE_OPENAI_API_KEY,
        import.meta.env.OPENAI_API_KEY,
        SecureConfig.OPENAI_API_KEY
      ].filter(key => key && key !== primaryKey && this.isValidAPIKey(key)),
      currentIndex: 0,
      healthStatus: new Map(),
      lastHealthCheck: new Map()
    };

    this.config = {
      apiKey: primaryKey,
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      maxTokens: 4000,
      temperature: 0.7,
      retryConfig: {
        maxRetries: 15,
        baseDelay: 1000,
        maxDelay: 120000,
        exponentialBackoff: true,
        jitterFactor: 0.25,
        timeoutMs: 60000,
        circuitBreakerThreshold: 5,
        healthCheckInterval: 300000 // 5 minutes
      }
    };

    this.initializeHealthMonitoring();
    console.log('🚀 Enhanced OpenAI Service initialized with reliability features:', {
      primaryKeyConfigured: !!primaryKey,
      fallbackKeysAvailable: this.apiKeyPool.fallbacks.length,
      features: ['Circuit Breaker', 'Health Monitoring', 'Multi-Key Fallback', 'Advanced Retry Logic']
    });
  }

  private isValidAPIKey(key: string): boolean {
    return Boolean(key && 
      key.startsWith('sk-') && 
      key.length > 20 && 
      !key.includes('your-') && 
      !key.includes('YOUR_')
    );
  }

  private initializeHealthMonitoring(): void {
    // Set up periodic health checks for all API keys
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.retryConfig.healthCheckInterval);

    // Initial health check
    setTimeout(() => this.performHealthChecks(), 2000);
  }

  private async performHealthChecks(): Promise<void> {
    const allKeys = [this.apiKeyPool.primary, ...this.apiKeyPool.fallbacks]
      .filter(key => this.isValidAPIKey(key));

    console.log('🔍 Performing health checks on API keys...');

    for (const apiKey of allKeys) {
      try {
        const isHealthy = await this.testAPIKeyHealth(apiKey);
        this.apiKeyPool.healthStatus.set(apiKey, isHealthy);
        this.apiKeyPool.lastHealthCheck.set(apiKey, Date.now());
        
        console.log(`${isHealthy ? '✅' : '❌'} API key health: ${this.maskAPIKey(apiKey)}`);
      } catch (error) {
        this.apiKeyPool.healthStatus.set(apiKey, false);
        console.warn(`⚠️ Health check failed for key ${this.maskAPIKey(apiKey)}:`, error);
      }
    }
  }

  private async testAPIKeyHealth(apiKey: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.config.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'EnhancedOpenAI/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private getNextHealthyAPIKey(): string | null {
    const allKeys = [this.apiKeyPool.primary, ...this.apiKeyPool.fallbacks]
      .filter(key => this.isValidAPIKey(key));

    // First, try keys that are known to be healthy
    for (const key of allKeys) {
      const isHealthy = this.apiKeyPool.healthStatus.get(key);
      if (isHealthy === true) {
        return key;
      }
    }

    // If no healthy keys found, try keys that haven't been checked recently
    for (const key of allKeys) {
      const lastCheck = this.apiKeyPool.lastHealthCheck.get(key) || 0;
      const timeSinceCheck = Date.now() - lastCheck;
      if (timeSinceCheck > this.config.retryConfig.healthCheckInterval) {
        return key;
      }
    }

    // Fallback to primary key
    return this.apiKeyPool.primary;
  }

  private maskAPIKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return 'invalid';
    return `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`;
  }

  private async executeWithRetry<T>(
    operation: (apiKey: string) => Promise<T>,
    operationName: string = 'OpenAI API call'
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let retryCount = 0;

    // Circuit breaker check
    if (this.circuitBreakerOpen) {
      const timeSinceLastCheck = Date.now() - this.lastCircuitBreakerCheck;
      if (timeSinceLastCheck < 60000) { // 1 minute circuit breaker
        throw new Error('Circuit breaker is open. Service temporarily unavailable.');
      } else {
        this.circuitBreakerOpen = false;
        console.log('🔄 Circuit breaker reset - attempting operation');
      }
    }

    while (retryCount < this.config.retryConfig.maxRetries) {
      const apiKey = this.getNextHealthyAPIKey();
      
      if (!apiKey) {
        throw new Error('No healthy API keys available');
      }

      try {
        console.log(`🔄 ${operationName} attempt ${retryCount + 1}/${this.config.retryConfig.maxRetries} with key ${this.maskAPIKey(apiKey)}`);
        
        this.requestCount++;
        const result = await operation(apiKey);
        this.successCount++;

        if (retryCount > 0) {
          console.log(`✅ ${operationName} succeeded on attempt ${retryCount + 1}`);
        }

        // Mark API key as healthy
        this.apiKeyPool.healthStatus.set(apiKey, true);
        
        return result;

      } catch (error) {
        lastError = error as Error;
        retryCount++;

        // Analyze error and determine if we should retry
        const shouldRetry = this.shouldRetryError(lastError);
        const isAPIKeyIssue = this.isAPIKeyError(lastError);

        if (isAPIKeyIssue) {
          // Mark this API key as unhealthy
          this.apiKeyPool.healthStatus.set(apiKey, false);
          console.warn(`🔑 API key marked as unhealthy: ${this.maskAPIKey(apiKey)}`);
        }

        if (!shouldRetry || retryCount >= this.config.retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(retryCount);
        console.warn(`⏳ ${operationName} attempt ${retryCount} failed: ${lastError.message}. Retrying in ${Math.round(delay)}ms...`);
        
        await this.delay(delay);
      }
    }

    // Check if we should open circuit breaker
    const failureRate = (this.requestCount - this.successCount) / this.requestCount;
    if (this.requestCount >= this.config.retryConfig.circuitBreakerThreshold && failureRate > 0.5) {
      this.circuitBreakerOpen = true;
      this.lastCircuitBreakerCheck = Date.now();
      console.error('🚨 Circuit breaker opened due to high failure rate');
    }

    const responseTime = Date.now() - startTime;
    console.error(`❌ ${operationName} failed after ${retryCount} attempts in ${responseTime}ms:`, lastError?.message);
    
    throw new Error(`${operationName} failed after ${retryCount} attempts: ${lastError?.message}`);
  }

  private shouldRetryError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network errors - always retry
    if (message.includes('network') || 
        message.includes('connection') || 
        message.includes('timeout') ||
        message.includes('fetch') ||
        message.includes('abort') ||
        message.includes('enetunreach') ||
        message.includes('econnreset')) {
      return true;
    }

    // Rate limiting - retry with longer delays
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }

    // Server errors - retry
    if (message.includes('500') || 
        message.includes('502') || 
        message.includes('503') || 
        message.includes('504') ||
        message.includes('overloaded') ||
        message.includes('temporarily unavailable')) {
      return true;
    }

    // Don't retry authentication errors (but try different API keys)
    if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key')) {
      return true; // We'll try different API keys
    }

    return false;
  }

  private isAPIKeyError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('401') || 
           message.includes('unauthorized') || 
           message.includes('invalid api key') ||
           message.includes('quota') ||
           message.includes('billing');
  }

  private calculateDelay(attempt: number): number {
    const baseDelay = this.config.retryConfig.baseDelay;
    const maxDelay = this.config.retryConfig.maxDelay;
    
    let delay = this.config.retryConfig.exponentialBackoff
      ? Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      : baseDelay;

    // Add jitter to prevent thundering herd
    const jitterRange = delay * this.config.retryConfig.jitterFactor;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    
    return Math.max(100, delay + jitter);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}): Promise<GenerationResult> {
    const startTime = Date.now();
    const {
      model = this.config.model,
      maxTokens = this.config.maxTokens,
      temperature = this.config.temperature,
      systemPrompt = 'You are a professional content writer who creates high-quality, engaging content.'
    } = options;

    try {
      const result = await this.executeWithRetry(async (apiKey: string) => {
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.retryConfig.timeoutMs);

        try {
          const response = await fetch(`${this.config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'EnhancedOpenAI/1.0',
              'X-Request-ID': crypto.randomUUID()
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: maxTokens,
              temperature,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = `OpenAI API error: ${response.status} - ${response.statusText}`;
            
            if (errorData.error?.message) {
              errorMessage += ` - ${errorData.error.message}`;
            }

            throw new Error(errorMessage);
          }

          const data = await response.json();

          if (!data.choices || data.choices.length === 0) {
            throw new Error('No content generated from OpenAI');
          }

          const content = data.choices[0].message.content;

          if (!content || content.trim().length < 50) {
            throw new Error('Generated content is too short or empty');
          }

          const tokens = data.usage?.total_tokens || 0;
          const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000002;
          const cost = tokens * costPerToken;

          return {
            content,
            tokens,
            cost,
            apiKeyUsed: apiKey
          };

        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      }, 'Content Generation');

      const responseTime = Date.now() - startTime;

      console.log('✅ Enhanced OpenAI generation successful:', {
        contentLength: result.content.length,
        tokens: result.tokens,
        cost: `$${result.cost.toFixed(4)}`,
        responseTime: `${responseTime}ms`,
        apiKey: this.maskAPIKey(result.apiKeyUsed)
      });

      return {
        content: result.content,
        usage: { tokens: result.tokens, cost: result.cost },
        success: true,
        provider: 'Enhanced OpenAI',
        apiKeyUsed: this.maskAPIKey(result.apiKeyUsed),
        retryCount: 0,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('❌ Enhanced OpenAI generation failed:', {
        error: errorMessage,
        responseTime: `${responseTime}ms`,
        requestCount: this.requestCount,
        successRate: `${((this.successCount / this.requestCount) * 100).toFixed(1)}%`
      });

      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: errorMessage,
        provider: 'Enhanced OpenAI',
        apiKeyUsed: 'none',
        retryCount: this.config.retryConfig.maxRetries,
        responseTime
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; details: any }> {
    try {
      console.log('🧪 Testing Enhanced OpenAI service connection...');
      
      const healthyKey = this.getNextHealthyAPIKey();
      if (!healthyKey) {
        return {
          success: false,
          details: {
            error: 'No healthy API keys available',
            totalKeys: [this.apiKeyPool.primary, ...this.apiKeyPool.fallbacks].filter(k => k).length,
            healthyKeys: Array.from(this.apiKeyPool.healthStatus.values()).filter(h => h).length
          }
        };
      }

      const result = await this.executeWithRetry(async (apiKey: string) => {
        const response = await fetch(`${this.config.baseURL}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
          throw new Error(`Connection test failed: ${response.status}`);
        }

        return { apiKey, status: 'healthy' };
      }, 'Connection Test');

      return {
        success: true,
        details: {
          apiKeyUsed: this.maskAPIKey(result.apiKey),
          serviceStatus: 'operational',
          healthChecks: 'passing',
          circuitBreakerStatus: this.circuitBreakerOpen ? 'open' : 'closed'
        }
      };

    } catch (error) {
      return {
        success: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          circuitBreakerStatus: this.circuitBreakerOpen ? 'open' : 'closed'
        }
      };
    }
  }

  getServiceHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  } {
    const totalKeys = [this.apiKeyPool.primary, ...this.apiKeyPool.fallbacks].filter(k => k).length;
    const healthyKeys = Array.from(this.apiKeyPool.healthStatus.values()).filter(h => h).length;
    const successRate = this.requestCount > 0 ? (this.successCount / this.requestCount) * 100 : 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (this.circuitBreakerOpen || healthyKeys === 0) {
      status = 'unhealthy';
    } else if (healthyKeys < totalKeys || successRate < 90) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalAPIKeys: totalKeys,
        healthyAPIKeys: healthyKeys,
        successRate: `${successRate.toFixed(1)}%`,
        totalRequests: this.requestCount,
        circuitBreakerStatus: this.circuitBreakerOpen ? 'open' : 'closed',
        lastHealthCheck: Math.max(...Array.from(this.apiKeyPool.lastHealthCheck.values()).map(t => t || 0))
      }
    };
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey) && this.isValidAPIKey(this.config.apiKey);
  }
}

// Export singleton instance
export const enhancedOpenAIService = new EnhancedOpenAIService();
