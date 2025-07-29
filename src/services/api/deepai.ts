/**
 * DeepAI API Service
 * Additional fallback provider for content generation
 */

interface DeepAIRequest {
  text: string;
}

interface DeepAIResponse {
  output: string;
  id: string;
}

export class DeepAIService {
  private apiKey: string;
  private baseURL = 'https://api.deepai.org/api';

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPAI_API_KEY || '';
  }

  async generateContent(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}): Promise<{
    content: string;
    usage: { tokens: number; cost: number };
    success: boolean;
    error?: string;
  }> {
    if (!this.apiKey) {
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: 'DeepAI API key not configured'
      };
    }

    const { systemPrompt = '' } = options;

    try {
      console.log('🟣 Attempting DeepAI content generation...');

      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const formData = new FormData();
      formData.append('text', fullPrompt);

      const response = await fetch(`${this.baseURL}/text-generator`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'User-Agent': 'BacklinkooBot/1.0'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`DeepAI API error: ${response.status} - ${errorText}`);
      }

      const data: DeepAIResponse = await response.json();

      if (!data.output) {
        throw new Error('No content generated from DeepAI');
      }

      let content = data.output.trim();

      if (content.length < 100) {
        throw new Error('Generated content is too short');
      }

      // Estimate tokens and cost (DeepAI pricing approximation)
      const tokens = Math.ceil(content.length / 4);
      const cost = tokens * 0.000001; // Approximate cost

      console.log('✅ DeepAI generation successful:', {
        contentLength: content.length,
        tokens,
        cost: `$${cost.toFixed(4)}`
      });

      return {
        content,
        usage: { tokens, cost },
        success: true
      };

    } catch (error) {
      console.error('❌ DeepAI API failed:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const formData = new FormData();
      formData.append('text', 'Test connection');

      const response = await fetch(`${this.baseURL}/text-generator`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey
        },
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('DeepAI connection test failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}

export const deepAIService = new DeepAIService();
