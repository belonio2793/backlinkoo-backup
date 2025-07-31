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
   * Available for all users visiting backlinkoo.com
   * Now syncs directly with admin configuration
   */
  static getAPIKey(): string {
    // Priority order:
    // 1. Environment variable (production)
    // 2. Admin saved configuration (primary source)
    // 3. Permanent storage (backup)
    // 4. Temporary localStorage key (development)

    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey && envKey.startsWith('sk-') && envKey.length > 20) {
      return envKey;
    }

    // Check admin configuration first
    const adminKey = this.getAdminConfiguredKey();
    if (adminKey && adminKey.startsWith('sk-') && adminKey.length > 20) {
      return adminKey;
    }

    // Check permanent storage
    const permanentKey = this.getPermanentKey();
    if (permanentKey && permanentKey.startsWith('sk-') && permanentKey.length > 20) {
      return permanentKey;
    }

    // Fallback to temporary key for development
    const tempKey = localStorage.getItem('temp_openai_key');
    if (tempKey && tempKey.startsWith('sk-') && tempKey.length > 20) {
      return tempKey;
    }

    throw new Error('Global OpenAI configuration not available - Please configure API key in admin dashboard');
  }

  /**
   * Get API key from admin configuration
   */
  private static getAdminConfiguredKey(): string | null {
    try {
      // Check admin dashboard saved configurations
      const adminConfigs = JSON.parse(localStorage.getItem('admin_api_configs') || '{}');
      const openaiConfig = adminConfigs['VITE_OPENAI_API_KEY'];

      if (openaiConfig && openaiConfig.startsWith('sk-') && openaiConfig.length > 20) {
        return openaiConfig;
      }

      return null;
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
      const envBackup = JSON.parse(localStorage.getItem('environment_backup') || '{}');
      const openaiBackup = envBackup['VITE_OPENAI_API_KEY'];

      if (openaiBackup && openaiBackup.value && openaiBackup.value.startsWith('sk-')) {
        return openaiBackup.value;
      }

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

  /**
   * Permanently save the current configuration
   */
  static async savePermanently(): Promise<{ success: boolean; error?: string }> {
    try {
      const apiKey = this.getAPIKey();
      const isConnected = await this.testConnection();

      // Save to permanent storage
      const now = new Date().toISOString();
      const config = {
        service: 'OpenAI',
        apiKey,
        isActive: true,
        lastTested: now,
        healthScore: isConnected ? 100 : 0,
        metadata: {
          version: 'gpt-3.5-turbo',
          environment: import.meta.env.MODE || 'development',
          savedAt: now
        }
      };

      // Save to multiple locations for redundancy
      const permanentConfigs = JSON.parse(localStorage.getItem('permanent_api_configs') || '[]');
      const updatedConfigs = permanentConfigs.filter((c: any) => c.service !== 'OpenAI');
      updatedConfigs.push(config);
      localStorage.setItem('permanent_api_configs', JSON.stringify(updatedConfigs));

      // Save to environment backup
      const envBackup = JSON.parse(localStorage.getItem('environment_backup') || '{}');
      envBackup['VITE_OPENAI_API_KEY'] = {
        value: apiKey,
        service: 'OpenAI',
        savedAt: now,
        healthScore: config.healthScore
      };
      localStorage.setItem('environment_backup', JSON.stringify(envBackup));

      // Also sync to admin configuration for immediate access
      this.syncToAdminConfig(apiKey);

      console.log('✅ OpenAI configuration saved permanently and synced to admin');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to save OpenAI configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync API key to admin configuration
   */
  private static syncToAdminConfig(apiKey: string): void {
    try {
      const adminConfigs = JSON.parse(localStorage.getItem('admin_api_configs') || '{}');
      adminConfigs['VITE_OPENAI_API_KEY'] = apiKey;
      localStorage.setItem('admin_api_configs', JSON.stringify(adminConfigs));
      console.log('✅ Synced to admin configuration');
    } catch (error) {
      console.warn('Failed to sync to admin config:', error);
    }
  }

  /**
   * Get configuration health status
   */
  static async getHealthStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    healthScore: number;
    lastTested?: string;
  }> {
    try {
      const configured = this.isConfigured();
      const connected = configured ? await this.testConnection() : false;
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
