/**
 * OpenAI API Service
 * Handles GPT-4 content generation, text completion, and chat completions
 */

interface OpenAIRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenAIResponse {
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

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                  (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : '') ||
                  '';
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not configured');
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
      throw new Error('OpenAI API key not configured');
    }

    const {
      model = 'gpt-4',
      maxTokens = 3500,
      temperature = 0.7,
      systemPrompt = 'You are a professional SEO content writer who creates high-quality, engaging blog posts with natural backlink integration.'
    } = options;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];

      const requestBody: OpenAIRequest = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      };

      console.log('🤖 OpenAI API Request:', { model, maxTokens, temperature });

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
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No content generated from OpenAI');
      }

      const content = data.choices[0].message.content;
      const tokens = data.usage.total_tokens;
      
      // Estimate cost based on model (approximate pricing)
      const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000002;
      const cost = tokens * costPerToken;

      console.log('✅ OpenAI generation successful:', { tokens, cost: `$${cost.toFixed(4)}` });

      return {
        content,
        usage: { tokens, cost },
        success: true
      };

    } catch (error) {
      console.error('❌ OpenAI API error:', error);
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
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
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

export const openAIService = new OpenAIService();
