/**
 * Global OpenAI Configuration Service
 * Provides centralized API key management for all users
 */

// Global OpenAI API Key - Available for all users
const GLOBAL_OPENAI_API_KEY = 'sk-proj-rP8YjC8VH1k3lAQIhjx1bWZZY3tqpwEqYkKJGz7Sw8F3xL9A4cYjHQT3BlbkFJGzPvHwmSY5tD6nD8vE3pA9qXmU2sL1rZ0tK5fN7bQ8rT4yW2v';

export class GlobalOpenAIConfig {
  /**
   * Get the global OpenAI API key
   * Available for all users visiting backlinkoo.com
   */
  static getAPIKey(): string {
    // Priority order:
    // 1. Environment variable (production)
    // 2. Global hardcoded key (fallback)
    // 3. Temporary localStorage key (development)
    
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey && envKey.startsWith('sk-')) {
      return envKey;
    }

    if (GLOBAL_OPENAI_API_KEY && GLOBAL_OPENAI_API_KEY.startsWith('sk-')) {
      return GLOBAL_OPENAI_API_KEY;
    }

    // Fallback to temporary key for development
    const tempKey = localStorage.getItem('temp_openai_key');
    if (tempKey && tempKey.startsWith('sk-')) {
      return tempKey;
    }

    throw new Error('No OpenAI API key configured');
  }

  /**
   * Check if OpenAI is configured and available
   */
  static isConfigured(): boolean {
    try {
      const key = this.getAPIKey();
      return key && key.startsWith('sk-');
    } catch {
      return false;
    }
  }

  /**
   * Test the OpenAI API connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const apiKey = this.getAPIKey();
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate content using OpenAI API
   */
  static async generateContent(params: {
    keyword: string;
    anchorText?: string;
    url?: string;
    wordCount?: number;
    contentType?: string;
    tone?: string;
    systemPrompt?: string;
  }): Promise<{
    success: boolean;
    content?: string;
    error?: string;
    usage?: { tokens: number; cost: number };
  }> {
    try {
      const apiKey = this.getAPIKey();
      
      const systemPrompt = params.systemPrompt || `You are an expert SEO content writer specializing in creating high-quality, engaging blog posts. Write in a ${params.tone || 'professional'} tone. Create original, valuable content that helps readers and includes natural backlink integration when provided.`;

      let userPrompt = `Create a comprehensive ${params.wordCount || 1000}-word ${params.contentType || 'blog post'} about "${params.keyword}".

CONTENT REQUIREMENTS:
- Write exactly ${params.wordCount || 1000} words of high-quality, original content
- Focus on "${params.keyword}" as the main topic
- Include practical, actionable advice
- Structure with proper headings (H1, H2, H3)
- Create engaging, informative content that genuinely helps readers`;

      if (params.anchorText && params.url) {
        userPrompt += `
- Natural integration of anchor text "${params.anchorText}" linking to ${params.url}

BACKLINK INTEGRATION:
- Place the backlink "${params.anchorText}" naturally within the content
- Make the link contextually relevant to the surrounding text
- Ensure it adds value to the reader

OUTPUT FORMAT:
Use <a href="${params.url}" target="_blank" rel="noopener noreferrer">${params.anchorText}</a> for the backlink.`;
      }

      userPrompt += `

Focus on creating valuable, informative content with proper HTML structure using <h1>, <h2>, <h3>, <p>, <ul>, <li>, and <strong> tags.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: Math.min(4000, Math.floor((params.wordCount || 1000) * 2.5)),
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      const tokens = data.usage?.total_tokens || 0;
      const cost = tokens * 0.000002; // Approximate cost for gpt-3.5-turbo

      return {
        success: true,
        content,
        usage: { tokens, cost }
      };

    } catch (error) {
      console.error('OpenAI generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      };
    }
  }

  /**
   * Get masked API key for display purposes
   */
  static getMaskedKey(): string {
    try {
      const key = this.getAPIKey();
      return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`;
    } catch {
      return 'Not configured';
    }
  }
}

// Export singleton instance for convenience
export const globalOpenAI = GlobalOpenAIConfig;
