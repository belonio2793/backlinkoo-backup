/**
 * Multi-Key OpenAI Service
 * Supports multiple API keys with automatic failover for 100% reliability
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

export class MultiKeyOpenAIService {
  private apiKeys: string[] = [];
  
  private baseURL = 'https://api.openai.com/v1';
  private currentKeyIndex = 0;
  private keyStatus: Record<string, { working: boolean; lastTested: Date; errors: number }> = {};

  constructor() {
    // Load API keys from environment
    const primaryKey = import.meta.env.VITE_OPENAI_API_KEY || SecureConfig.OPENAI_API_KEY;
    if (primaryKey) {
      this.apiKeys = [primaryKey];
    }

    // Initialize key status tracking
    this.apiKeys.forEach(key => {
      this.keyStatus[key] = {
        working: true,
        lastTested: new Date(),
        errors: 0
      };
    });

    console.log(`🔑 MultiKeyOpenAI initialized with ${this.apiKeys.length} API keys`);
  }

  /**
   * Get the next working API key
   */
  private getNextWorkingKey(): string | null {
    // First, try keys that are known to be working
    for (let i = 0; i < this.apiKeys.length; i++) {
      const key = this.apiKeys[i];
      const status = this.keyStatus[key];
      if (status.working && status.errors < 3) {
        this.currentKeyIndex = i;
        return key;
      }
    }

    // If no "working" keys, try all keys (maybe they recovered)
    for (let i = 0; i < this.apiKeys.length; i++) {
      const key = this.apiKeys[i];
      this.currentKeyIndex = i;
      return key;
    }

    return null;
  }

  /**
   * Mark a key as failed
   */
  private markKeyFailed(key: string, error: string): void {
    if (this.keyStatus[key]) {
      this.keyStatus[key].errors += 1;
      this.keyStatus[key].lastTested = new Date();
      
      // Mark as non-working if too many errors or specific error types
      if (this.keyStatus[key].errors >= 3 || 
          error.includes('401') || 
          error.includes('invalid_api_key') ||
          error.includes('insufficient_quota')) {
        this.keyStatus[key].working = false;
      }
    }
    console.warn(`🔴 OpenAI key failed (${this.keyStatus[key]?.errors || 0} errors): ${key.substring(0, 10)}... - ${error}`);
  }

  /**
   * Mark a key as working
   */
  private markKeyWorking(key: string): void {
    if (this.keyStatus[key]) {
      this.keyStatus[key].working = true;
      this.keyStatus[key].errors = 0;
      this.keyStatus[key].lastTested = new Date();
    }
    console.log(`✅ OpenAI key working: ${key.substring(0, 10)}...`);
  }

  /**
   * Make API request with automatic key rotation
   */
  private async makeRequestWithFailover<T>(
    endpoint: string, 
    options: RequestInit,
    maxAttempts: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    let attemptCount = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentKey = this.getNextWorkingKey();
      
      if (!currentKey) {
        throw new Error('All OpenAI API keys have been exhausted or are invalid');
      }

      attemptCount++;
      console.log(`🔄 OpenAI attempt ${attemptCount}/${maxAttempts} using key ${currentKey.substring(0, 10)}...`);

      try {
        const requestOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${currentKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'BacklinkooBot/1.0',
          }
        };

        const response = await fetch(`${this.baseURL}${endpoint}`, requestOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = `HTTP ${response.status}: ${errorData.error?.message || response.statusText}`;
          
          // Mark key as failed and try next one
          this.markKeyFailed(currentKey, errorMessage);
          lastError = new Error(errorMessage);
          
          // Move to next key for next attempt
          this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
          continue;
        }

        // Success! Mark key as working
        this.markKeyWorking(currentKey);
        const data = await response.json();
        return data as T;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.markKeyFailed(currentKey, errorMessage);
        lastError = error instanceof Error ? error : new Error(errorMessage);
        
        // Move to next key for next attempt
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      }
    }

    // All attempts failed
    throw lastError || new Error('All OpenAI API requests failed');
  }

  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}): Promise<{
    content: string;
    usage: { tokens: number; cost: number };
    success: boolean;
    error?: string;
    provider?: string;
    apiKeyUsed?: string;
    retryCount?: number;
  }> {
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 3500,
      temperature = 0.7,
      systemPrompt = 'You are a professional SEO content writer who creates high-quality, engaging blog posts with natural backlink integration.',
    } = options;

    const startTime = Date.now();

    try {
      console.log('🚀 Starting multi-key OpenAI content generation:', {
        model,
        maxTokens,
        temperature,
        availableKeys: this.apiKeys.length,
        workingKeys: Object.values(this.keyStatus).filter(s => s.working).length
      });

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

      const data = await this.makeRequestWithFailover<OpenAIResponse>(
        '/chat/completions',
        {
          method: 'POST',
          body: JSON.stringify(requestBody)
        }
      );

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No content generated from OpenAI');
      }

      const content = data.choices[0].message.content;

      // Validate content quality
      if (!content || content.trim().length < 100) {
        throw new Error('Generated content is too short or empty');
      }

      const tokens = data.usage.total_tokens;
      const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.0000015;
      const cost = tokens * costPerToken;

      const currentKey = this.apiKeys[this.currentKeyIndex];

      console.log('✅ Multi-key OpenAI generation successful:', {
        contentLength: content.length,
        tokens,
        cost: `$${cost.toFixed(4)}`,
        keyUsed: currentKey.substring(0, 10) + '...',
        responseTime: `${Date.now() - startTime}ms`
      });

      return {
        content,
        usage: { tokens, cost },
        success: true,
        provider: 'Multi-Key OpenAI',
        apiKeyUsed: currentKey.substring(0, 10) + '...',
        retryCount: 0
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Multi-key OpenAI API failed after all attempts:', {
        error: errorMessage,
        keyStatuses: Object.entries(this.keyStatus).map(([key, status]) => ({
          key: key.substring(0, 10) + '...',
          working: status.working,
          errors: status.errors
        })),
        responseTime: `${Date.now() - startTime}ms`
      });

      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: errorMessage,
        provider: 'Multi-Key OpenAI'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing multi-key OpenAI connection...');

      const result = await this.makeRequestWithFailover<any>(
        '/models',
        { method: 'GET' },
        this.apiKeys.length // Try all keys
      );

      console.log('✅ Multi-key OpenAI connection test successful');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ Multi-key OpenAI connection test failed:', errorMsg);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.apiKeys.length > 0 && this.apiKeys.some(key => key.startsWith('sk-'));
  }

  /**
   * Get status of all API keys
   */
  getKeyStatuses(): Record<string, any> {
    return Object.entries(this.keyStatus).reduce((acc, [key, status]) => {
      acc[key.substring(0, 10) + '...'] = {
        working: status.working,
        errors: status.errors,
        lastTested: status.lastTested.toISOString()
      };
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Get service health information
   */
  getServiceHealth(): { status: string; details: any } {
    const workingKeys = Object.values(this.keyStatus).filter(s => s.working).length;
    const totalKeys = this.apiKeys.length;

    return {
      status: workingKeys > 0 ? 'healthy' : 'unhealthy',
      details: {
        totalKeys,
        workingKeys,
        keyStatuses: this.getKeyStatuses(),
        currentKeyIndex: this.currentKeyIndex
      }
    };
  }
}

export const multiKeyOpenAIService = new MultiKeyOpenAIService();
