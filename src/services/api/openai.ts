import { environmentVariablesService } from '@/services/environmentVariablesService';
import { SecureConfig } from '@/lib/secure-config';

export class OpenAIService {
  private apiKey: string = '';

  constructor() {
    // Load fallback API key from environment or secure config
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || SecureConfig.OPENAI_API_KEY;
    this.initializeApiKey(); // Attempt to override with admin value
  }

  /**
   * Dynamically initialize API key from admin environment variable service
   */
  private async initializeApiKey() {
    try {
      const adminApiKey = await environmentVariablesService.getVariable('VITE_OPENAI_API_KEY');
      if (adminApiKey && adminApiKey.startsWith('sk-')) {
        this.apiKey = adminApiKey;
        console.log('✅ OpenAI API key loaded from admin environment variables');
        console.log('🔑 Key preview:', this.apiKey.substring(0, 10) + '...');
        return;
      }
    } catch (error) {
      console.warn('⚠️ Could not load API key from admin environment variables:', error);
    }

    const invalidKeys = [
      'your-openai-api-key-here',
      'sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE',
      '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'
    ];

    if (!this.apiKey || invalidKeys.includes(this.apiKey)) {
      console.warn('❌ OpenAI API key not configured or is invalid.');
      this.apiKey = '';
    } else if (!this.apiKey.startsWith('sk-')) {
      console.warn('❌ OpenAI API key format is incorrect. It should start with "sk-".');
      console.warn('📋 Current key preview:', this.apiKey.substring(0, 10) + '...');
      console.warn('🔁 Update your environment variable in Netlify or Admin Dashboard');
      this.apiKey = '';
    } else {
      console.log('✅ OpenAI API key configured successfully');
      console.log('🔑 Key preview:', this.apiKey.substring(0, 10) + '...');
    }
  }

  /**
   * Example function to send a prompt to OpenAI (you can expand this)
   */
  public async sendPrompt(prompt: string, options: { temperature?: number; max_tokens?: number }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-davinci-003',
          prompt,
          max_tokens: options.max_tokens || 100,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ OpenAI API request failed:', error);
      throw error;
    }
  }

  /**
   * Utility: Check if the key is valid and ready
   */
  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }

  /**
   * Utility: Get masked preview of key
   */
  public getMaskedKey(): string {
    return this.apiKey ? this.apiKey.substring(0, 10) + '...' : '[Not Set]';
  }
}
