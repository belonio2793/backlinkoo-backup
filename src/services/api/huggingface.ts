/**
 * HuggingFace API Service
 * Handles various NLP tasks including text generation, summarization, and classification
 */

interface HuggingFaceRequest {
  inputs: string;
  parameters?: {
    max_length?: number;
    temperature?: number;
    do_sample?: boolean;
    top_p?: number;
    num_return_sequences?: number;
  };
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

interface HuggingFaceResponse {
  generated_text?: string;
  summary_text?: string;
  label?: string;
  score?: number;
}

export class HuggingFaceService {
  private token: string;
  private baseURL = 'https://api-inference.huggingface.co/models';

  constructor() {
    this.token = import.meta.env.VITE_HUGGINGFACE_TOKEN || 
                 (typeof process !== 'undefined' ? process.env.HUGGINGFACE_TOKEN : '') ||
                 '';
    
    if (!this.token) {
      console.warn('HuggingFace token not configured');
    }
  }

  async generateText(prompt: string, options: {
    model?: string;
    maxLength?: number;
    temperature?: number;
  } = {}): Promise<{
    content: string;
    usage: { tokens: number; cost: number };
    success: boolean;
    error?: string;
  }> {
    if (!this.token) {
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: 'HuggingFace token not configured'
      };
    }

    const {
      model = 'microsoft/DialoGPT-large',
      maxLength = 3000,
      temperature = 0.7
    } = options;

    try {
      console.log('🤗 HuggingFace API Request:', { model, maxLength, temperature });

      const requestBody: HuggingFaceRequest = {
        inputs: prompt,
        parameters: {
          max_length: maxLength,
          temperature,
          do_sample: true,
          top_p: 0.95,
          num_return_sequences: 1
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      };

      const response = await fetch(`${this.baseURL}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HuggingFace API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data: HuggingFaceResponse[] = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No content generated from HuggingFace');
      }

      const content = data[0].generated_text || data[0].summary_text || '';
      
      if (!content) {
        throw new Error('Empty response from HuggingFace model');
      }

      // Remove the original prompt from the response if it's included
      const cleanContent = content.replace(prompt, '').trim();
      
      const estimatedTokens = Math.ceil(cleanContent.length / 4);
      const cost = 0; // HuggingFace Inference API is free for most models

      console.log('✅ HuggingFace generation successful:', { estimatedTokens, cost: 'Free' });

      return {
        content: cleanContent,
        usage: { tokens: estimatedTokens, cost },
        success: true
      };

    } catch (error) {
      console.error('❌ HuggingFace API error:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async summarizeText(text: string, options: {
    model?: string;
    maxLength?: number;
    minLength?: number;
  } = {}): Promise<{
    summary: string;
    success: boolean;
    error?: string;
  }> {
    if (!this.token) {
      return {
        summary: '',
        success: false,
        error: 'HuggingFace token not configured'
      };
    }

    const {
      model = 'facebook/bart-large-cnn',
      maxLength = 300,
      minLength = 50
    } = options;

    try {
      const requestBody: HuggingFaceRequest = {
        inputs: text,
        parameters: {
          max_length: maxLength,
        }
      };

      const response = await fetch(`${this.baseURL}/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HuggingFace summarization error: ${response.status}`);
      }

      const data: HuggingFaceResponse[] = await response.json();
      const summary = data[0]?.summary_text || '';

      return {
        summary,
        success: true
      };

    } catch (error) {
      console.error('❌ HuggingFace summarization error:', error);
      return {
        summary: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseURL}/microsoft/DialoGPT-medium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: 'test',
          parameters: { max_length: 10 }
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.token);
  }
}

export const huggingFaceService = new HuggingFaceService();
