/**
 * Cohere API Service
 * Fallback provider for content generation
 */

interface CohereRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

interface CohereResponse {
  id: string;
  generations: Array<{
    text: string;
    finish_reason: string;
  }>;
  meta: {
    api_version: {
      version: string;
    };
  };
}

export class CohereService {
  private apiKey: string;
  private baseURL = 'https://api.cohere.ai/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_COHERE_API_KEY || '';
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
        error: 'Cohere API key not configured'
      };
    }

    const {
      maxTokens = 3500,
      temperature = 0.7,
      systemPrompt = ''
    } = options;

    try {
      console.log('🔶 Attempting Cohere content generation...');

      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

      const requestBody: CohereRequest = {
        prompt: fullPrompt,
        max_tokens: maxTokens,
        temperature,
        model: 'command-xlarge-nightly'
      };

      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'BacklinkooBot/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `Cohere API error: ${response.status}`;
        
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
        
        throw new Error(errorMessage);
      }

      const data: CohereResponse = await response.json();

      if (!data.generations || data.generations.length === 0) {
        throw new Error('No content generated from Cohere');
      }

      const content = data.generations[0].text;

      if (!content || content.trim().length < 100) {
        throw new Error('Generated content is too short or empty');
      }

      // Estimate tokens and cost (Cohere pricing approximation)
      const tokens = Math.ceil(content.length / 4);
      const cost = tokens * 0.000002; // Approximate cost

      console.log('✅ Cohere generation successful:', {
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
      console.error('❌ Cohere API failed:', error);
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
      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Test connection',
          max_tokens: 10
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Cohere connection test failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}

export const cohereService = new CohereService();
