/**
 * Secure OpenAI Service - Server-side only
 * All OpenAI API calls go through Netlify functions for security
 */

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
   * Generate content using OpenAI via secure Netlify function
   */
  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}): Promise<OpenAIResponse> {
    try {
      console.log('🚀 Generating content via secure Netlify function...');

      const response = await fetch(`${this.baseUrl}/generate-openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          options: {
            model: options.model || 'gpt-3.5-turbo',
            maxTokens: options.maxTokens || 3500,
            temperature: options.temperature || 0.7,
            systemPrompt: options.systemPrompt || 'You are a professional content writer.'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Netlify function error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Content generation failed');
      }

      console.log('✅ Content generation successful via Netlify function');
      return data;

    } catch (error) {
      console.error('❌ OpenAI service error:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'Netlify-OpenAI'
      };
    }
  }

  /**
   * Test OpenAI connection via Netlify function
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing OpenAI connection via Netlify function...');

      const response = await fetch(`${this.baseUrl}/check-ai-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'OpenAI'
        })
      });

      if (!response.ok) {
        console.warn('⚠️ OpenAI connection test failed:', response.status);
        return false;
      }

      const data = await response.json();
      console.log('✅ OpenAI connection test successful');
      return data.success || false;

    } catch (error) {
      console.warn('⚠️ OpenAI connection test error:', error);
      return false;
    }
  }

  /**
   * Check if OpenAI is configured (server-side)
   */
  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api-status`);
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.providerStatus?.OpenAI?.configured || false;
    } catch {
      return false;
    }
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
