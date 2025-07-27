/**
 * DeepAI Service
 * Handles text generation, image generation, and content moderation
 */

interface DeepAITextRequest {
  text: string;
}

interface DeepAIResponse {
  output: string;
  id: string;
  status: string;
}

export class DeepAIService {
  private apiKey: string;
  private baseURL = 'https://api.deepai.org/api';

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPAI_API_KEY || 
                  (typeof process !== 'undefined' ? process.env.DEEPAI_API_KEY : '') ||
                  '';
    
    if (!this.apiKey) {
      console.warn('DeepAI API key not configured');
    }
  }

  async generateText(prompt: string, options: {
    model?: string;
  } = {}): Promise<{
    content: string;
    usage: { tokens: number; cost: number };
    success: boolean;
    error?: string;
  }> {
    if (!this.apiKey) {
      throw new Error('DeepAI API key not configured');
    }

    const { model = 'text-generator' } = options;

    try {
      console.log('🧠 DeepAI API Request:', { model });

      const formData = new FormData();
      formData.append('text', prompt);

      const response = await fetch(`${this.baseURL}/${model}`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepAI API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data: DeepAIResponse = await response.json();
      
      if (!data.output) {
        throw new Error('No content generated from DeepAI');
      }

      const content = data.output;
      const estimatedTokens = Math.ceil(content.length / 4); // Rough token estimation
      const cost = estimatedTokens * 0.000001; // Estimated cost

      console.log('✅ DeepAI generation successful:', { estimatedTokens, cost: `$${cost.toFixed(4)}` });

      return {
        content,
        usage: { tokens: estimatedTokens, cost },
        success: true
      };

    } catch (error) {
      console.error('❌ DeepAI API error:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async moderateContent(text: string): Promise<{
    isNSFW: boolean;
    confidence: number;
    success: boolean;
    error?: string;
  }> {
    if (!this.apiKey) {
      throw new Error('DeepAI API key not configured');
    }

    try {
      const formData = new FormData();
      formData.append('text', text);

      const response = await fetch(`${this.baseURL}/nsfw-detector`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`DeepAI moderation error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        isNSFW: data.output?.nsfw_score > 0.5,
        confidence: data.output?.nsfw_score || 0,
        success: true
      };

    } catch (error) {
      console.error('❌ DeepAI moderation error:', error);
      return {
        isNSFW: false,
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const formData = new FormData();
      formData.append('text', 'test');

      const response = await fetch(`${this.baseURL}/text-generator`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey
        },
        body: formData
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}

export const deepAIService = new DeepAIService();
