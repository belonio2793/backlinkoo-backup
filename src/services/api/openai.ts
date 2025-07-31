/**
 * OpenAI Service with Global Configuration
 * Uses global API key available for all users
 */

import { globalOpenAI } from '../globalOpenAIConfig';

interface OpenAIRequest {
  prompt: string;
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  };
}

interface OpenAIResponse {
  content: string;
  usage: { tokens: number; cost: number };
  success: boolean;
  error?: string;
  provider?: string;
}

export class OpenAIService {
  private baseUrl: string;

  constructor() {
    // Use Netlify functions base URL
    this.baseUrl = '/.netlify/functions';
  }

  /**
   * Generate content using global OpenAI configuration
   */
  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}): Promise<OpenAIResponse> {
    try {
      console.log('🚀 Generating content with global OpenAI configuration...');

      const result = await globalOpenAI.generateContent({
        keyword: prompt,
        wordCount: options.maxTokens ? Math.floor(options.maxTokens / 2.5) : 1000,
        systemPrompt: options.systemPrompt
      });

      if (result.success && result.content) {
        console.log('✅ Content generation successful');
        return {
          content: result.content,
          usage: result.usage || { tokens: 0, cost: 0 },
          success: true,
          provider: 'GlobalOpenAI'
        };
      } else {
        throw new Error(result.error || 'Content generation failed');
      }

    } catch (error) {
      console.error('❌ OpenAI service error:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'GlobalOpenAI'
      };
    }
  }

  /**
   * Test OpenAI connection using global configuration
   */
  async testConnection(): Promise<boolean> {
    return await globalOpenAI.testConnection();
  }

  /**
   * Check if OpenAI is configured (uses global configuration)
   */
  async isConfigured(): Promise<boolean> {
    return globalOpenAI.isConfigured();
  }

  /**
   * Get masked preview (not applicable for server-side)
   */
  getMaskedKey(): string {
    return '[Server-side only]';
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
