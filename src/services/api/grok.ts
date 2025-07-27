/**
 * Grok (X.AI) API Service
 * Handles real-time AI content generation with Grok models
 */

interface GrokRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GrokService {
  private apiKey: string;
  private baseURL = 'https://api.x.ai/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_GROK_API_KEY || 
                  (typeof process !== 'undefined' ? process.env.GROK_API_KEY : '') ||
                  '';
    
    if (!this.apiKey) {
      console.warn('Grok API key not configured');
    }
  }

  async generateContent(prompt: string, options: {
    model?: string;
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
      throw new Error('Grok API key not configured');
    }

    const {
      model = 'grok-beta',
      maxTokens = 3000,
      temperature = 0.7,
      systemPrompt = 'You are Grok, a witty and knowledgeable AI assistant. Create engaging, SEO-optimized content with natural backlink integration.'
    } = options;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      const requestBody: GrokRequest = {
        messages,
        model,
        stream: false,
        temperature,
        max_tokens: maxTokens
      };

      console.log('⚡ Grok API Request:', { model, maxTokens, temperature });

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Grok API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: GrokResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No content generated from Grok');
      }

      const content = data.choices[0].message.content;
      const tokens = data.usage.total_tokens;
      
      // Estimate cost (pricing may vary, this is approximate)
      const cost = tokens * 0.000005; // Estimated cost per token

      console.log('✅ Grok generation successful:', { tokens, cost: `$${cost.toFixed(4)}` });

      return {
        content,
        usage: { tokens, cost },
        success: true
      };

    } catch (error) {
      console.error('❌ Grok API error:', error);
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
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          model: 'grok-beta',
          max_tokens: 10
        })
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

export const grokService = new GrokService();
