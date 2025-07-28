/**
 * Cohere API Service
 * Handles text generation, classification, and embeddings
 */

interface CohereGenerateRequest {
  model: string;
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  k?: number;
  p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
  return_likelihoods?: string;
}

interface CohereGenerateResponse {
  id: string;
  generations: Array<{
    id: string;
    text: string;
    likelihood?: number;
    token_likelihoods?: Array<{
      token: string;
      likelihood: number;
    }>;
  }>;
  prompt: string;
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
    this.apiKey = import.meta.env.VITE_COHERE_API_KEY || 
                  (typeof process !== 'undefined' ? process.env.COHERE_API_KEY : '') ||
                  '';
    
    if (!this.apiKey) {
      console.warn('Cohere API key not configured');
    }
  }

  async generateText(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
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
      model = 'command',
      maxTokens = 3000,
      temperature = 0.7
    } = options;

    try {
      console.log('🔥 Cohere API Request:', { model, maxTokens, temperature });

      const requestBody: CohereGenerateRequest = {
        model,
        prompt,
        max_tokens: maxTokens,
        temperature,
        k: 0,
        p: 0.75,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      };

      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Cohere-Version': '2022-12-06'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cohere API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data: CohereGenerateResponse = await response.json();
      
      if (!data.generations || data.generations.length === 0) {
        throw new Error('No content generated from Cohere');
      }

      const content = data.generations[0].text.trim();
      const estimatedTokens = Math.ceil(content.length / 4);
      
      // Cohere pricing (approximate)
      const cost = estimatedTokens * 0.000015; // $15 per 1M tokens for command model

      console.log('✅ Cohere generation successful:', { estimatedTokens, cost: `$${cost.toFixed(4)}` });

      return {
        content,
        usage: { tokens: estimatedTokens, cost },
        success: true
      };

    } catch (error) {
      console.error('❌ Cohere API error:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async classifyText(texts: string[], examples: Array<{
    text: string;
    label: string;
  }>): Promise<{
    classifications: Array<{
      input: string;
      prediction: string;
      confidence: number;
    }>;
    success: boolean;
    error?: string;
  }> {
    if (!this.apiKey) {
      throw new Error('Cohere API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/classify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'medium',
          inputs: texts,
          examples
        })
      });

      if (!response.ok) {
        throw new Error(`Cohere classification error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        classifications: data.classifications.map((c: any) => ({
          input: c.input,
          prediction: c.prediction,
          confidence: c.confidence
        })),
        success: true
      };

    } catch (error) {
      console.error('❌ Cohere classification error:', error);
      return {
        classifications: [],
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
          model: 'command',
          prompt: 'test',
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

export const cohereService = new CohereService();
