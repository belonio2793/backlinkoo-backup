/**
 * OpenAI Service - Server-Side via Netlify Functions
 * All API calls routed through secure Netlify functions
 */

export class OpenAIService {
  constructor() {
    console.log('✅ OpenAI service initialized - using server-side API calls');
  }

  /**
   * Generate content using Netlify function
   */
  public async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const response = await fetch('/.netlify/functions/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          type: 'general',
          maxTokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Netlify function error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          content: result.content
        };
      } else {
        return {
          success: false,
          error: result.error || 'Content generation failed'
        };
      }
    } catch (error) {
      console.error('❌ Content generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Send a prompt to OpenAI via Netlify function
   */
  public async sendPrompt(prompt: string, options: { temperature?: number; max_tokens?: number }) {
    return this.generateContent(prompt, {
      maxTokens: options.max_tokens,
      temperature: options.temperature
    });
  }

  /**
   * Test connection via Netlify function
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/.netlify/functions/check-ai-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: 'OpenAI' })
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.configured || false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if service is configured (server-side)
   */
  public isConfigured(): boolean {
    // Always return true since configuration is handled server-side
    return true;
  }

  /**
   * Get service status
   */
  public getMaskedKey(): string {
    return '[Server-Side Configured]';
  }
}
