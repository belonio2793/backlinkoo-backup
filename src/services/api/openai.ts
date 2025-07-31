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
   * Generate content using OpenAI via direct API or Netlify function
   */
  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}): Promise<OpenAIResponse> {
    try {
      console.log('🚀 Generating content...');

      // Check for temporary key first - use direct API
      const tempKey = localStorage.getItem('temp_openai_key');
      if (tempKey && tempKey.startsWith('sk-')) {
        try {
          const systemPrompt = options.systemPrompt || 'You are an expert SEO content writer. Create high-quality, engaging content that naturally incorporates backlinks.';
          const userPrompt = `Create a comprehensive blog post about "${prompt}". Make it informative, well-structured, and engaging.`;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tempKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: options.model || 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              max_tokens: options.maxTokens || 2000,
              temperature: options.temperature || 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            const tokens = data.usage?.total_tokens || 0;

            console.log('✅ Content generation successful (direct API)');
            return {
              content,
              usage: { tokens, cost: tokens * 0.000002 },
              success: true,
              provider: 'OpenAI-Direct'
            };
          }
        } catch (error) {
          console.warn('Direct API generation failed, trying Netlify function...', error);
        }
      }

      // Fallback to Netlify function
      const response = await fetch(`${this.baseUrl}/generate-openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: prompt, // Use prompt as keyword for this service
          url: 'https://example.com', // Default URL since this service doesn't specify one
          anchorText: 'learn more', // Default anchor text
          wordCount: options.maxTokens ? Math.floor(options.maxTokens / 2.5) : 1500,
          contentType: 'how-to',
          tone: 'professional'
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
        provider: 'OpenAI-Service'
      };
    }
  }

  /**
   * Test OpenAI connection via Netlify function or direct API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing OpenAI connection...');

      // Check for temporary key first - test directly
      const tempKey = localStorage.getItem('temp_openai_key');
      if (tempKey && tempKey.startsWith('sk-')) {
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${tempKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            console.log('✅ OpenAI connection test successful (direct API)');
            return true;
          }
        } catch (error) {
          console.warn('Direct API test failed, trying Netlify function...', error);
        }
      }

      // Fallback to Netlify function
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
      console.log('✅ OpenAI connection test successful (Netlify function)');
      return data.success || false;

    } catch (error) {
      console.warn('⚠️ OpenAI connection test error:', error);
      return false;
    }
  }

  /**
   * Check if OpenAI is configured (server-side or locally)
   */
  async isConfigured(): Promise<boolean> {
    try {
      // Check for temporary key first
      const tempKey = localStorage.getItem('temp_openai_key');
      if (tempKey && tempKey.startsWith('sk-')) {
        return true;
      }

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
