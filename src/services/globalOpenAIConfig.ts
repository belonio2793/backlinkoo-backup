/**
 * Global OpenAI Configuration Service
 * Provides centralized API key management for all users
 */

// Global OpenAI API Key - Available for all users
// Note: Hardcoded key has been removed - now syncs with admin configuration
const GLOBAL_OPENAI_API_KEY = '';

export class GlobalOpenAIConfig {
  /**
   * Get the global OpenAI API key
   * Prioritizes environment variables (Edge Function Secrets)
   */
  static getAPIKey(): string {
    console.log('🔍 Getting OpenAI API key...');

    // 1. Environment variable (Netlify OPENAI_API_KEY - production priority)
    const envKey = import.meta.env.OPENAI_API_KEY;
    if (envKey && envKey.startsWith('sk-') && envKey.length > 20) {
      console.log('✅ Using Netlify environment variable key ending with:', envKey.slice(-4));
      return envKey;
    }

    // 2. Admin configured key from localStorage
    const adminKey = this.getAdminConfiguredKey();
    if (adminKey && adminKey.startsWith('sk-') && adminKey.length > 20) {
      console.log('✅ Using admin configured key ending with:', adminKey.slice(-4));
      return adminKey;
    }

    // 3. Permanent storage
    const permanentKey = this.getPermanentKey();
    if (permanentKey && permanentKey.startsWith('sk-') && permanentKey.length > 20) {
      console.log('✅ Using permanent storage key ending with:', permanentKey.slice(-4));
      return permanentKey;
    }

    // 4. Temporary key for development
    const tempKey = localStorage.getItem('temp_openai_key');
    if (tempKey && tempKey.startsWith('sk-') && tempKey.length > 20) {
      console.log('✅ Using temporary key ending with:', tempKey.slice(-4));
      return tempKey;
    }

    console.log('❌ No valid OpenAI API key found');
    throw new Error('AI service configuration error - Please contact support if this issue persists');
  }

  /**
   * Get API key from admin configuration
   */
  private static getAdminConfiguredKey(): string | null {
    try {
      const adminConfig = localStorage.getItem('admin_api_configurations');
      if (!adminConfig) return null;

      const configs = JSON.parse(adminConfig);
      const openaiConfig = configs.find((config: any) => 
        config.service === 'OpenAI' && 
        config.isActive && 
        config.apiKey && 
        config.apiKey.startsWith('sk-')
      );

      return openaiConfig ? openaiConfig.apiKey : null;
    } catch (error) {
      console.warn('Failed to get admin configured key:', error);
      return null;
    }
  }

  /**
   * Get API key from permanent storage
   */
  private static getPermanentKey(): string | null {
    try {
      // Check permanent configurations
      const permanentConfigs = JSON.parse(localStorage.getItem('permanent_api_configs') || '[]');
      const openaiConfig = permanentConfigs.find((config: any) =>
        config.service === 'OpenAI' && config.isActive && config.apiKey.startsWith('sk-')
      );

      return openaiConfig ? openaiConfig.apiKey : null;
    } catch (error) {
      console.warn('Failed to get permanent key:', error);
      return null;
    }
  }

  /**
   * Check if OpenAI is configured and available
   */
  static isConfigured(): boolean {
    try {
      const key = this.getAPIKey();
      return key && key.startsWith('sk-') && key.length > 20;
    } catch {
      return false;
    }
  }

  /**
   * Test the OpenAI API connection with production safety
   */
  static async testConnection(): Promise<boolean> {
    try {
      // Skip testing if no API key is configured
      if (!this.isConfigured()) {
        console.log('⚠️ OpenAI not configured - skipping connection test');
        return false;
      }

      const apiKey = this.getAPIKey();

      // Use a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const isValid = response.ok;

      if (isValid) {
        console.log('✅ OpenAI API connection successful');
        localStorage.removeItem('openai_key_invalid');
      } else {
        console.warn('⚠️ OpenAI API key test failed');
        localStorage.setItem('openai_key_invalid', 'true');
      }

      return isValid;
    } catch (error) {
      // Handle different types of fetch errors gracefully
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('⚠️ OpenAI connection test failed due to network/CORS - this is expected in development');
      } else if (error.name === 'AbortError') {
        console.warn('⚠️ OpenAI connection test timed out');
      } else {
        console.warn('⚠️ OpenAI connection test failed:', error.message);
      }
      
      localStorage.setItem('openai_key_invalid', 'true');
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
    usage?: { tokens: number; cost: number };
    error?: string;
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
- Naturally incorporate "${params.anchorText}" as a hyperlink to ${params.url} within the content`;
      }

      userPrompt += `

Please provide only the HTML content without any markdown formatting or code blocks.`;

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
          max_tokens: 3000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('OpenAI API key is invalid');
        }

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
        error: error instanceof Error ? error.message : 'Content generation failed'
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

  /**
   * Get health status without testing connection to avoid fetch errors
   */
  static async getHealthStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    healthScore: number;
    lastTested?: string;
  }> {
    try {
      const configured = this.isConfigured();
      // Return status without actually testing connection to avoid fetch errors
      const connected = configured && localStorage.getItem('openai_key_invalid') !== 'true';
      const healthScore = configured ? (connected ? 100 : 50) : 0;

      return {
        configured,
        connected,
        healthScore,
        lastTested: new Date().toISOString()
      };
    } catch (error) {
      return {
        configured: false,
        connected: false,
        healthScore: 0
      };
    }
  }
}

// Export singleton instance for convenience
export const globalOpenAI = GlobalOpenAIConfig;
