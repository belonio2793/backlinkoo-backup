/**
 * Rytr API Service
 * Handles SEO-friendly copywriting and content generation
 */

interface RytrRequest {
  language: string;
  tone: string;
  use_case: string;
  input_text: string;
  creativity_level: string;
  variations: number;
  max_characters: number;
  format_text: boolean;
}

interface RytrResponse {
  status: string;
  data: Array<{
    text: string;
    keywords: string[];
    word_count: number;
  }>;
  message?: string;
}

export class RytrService {
  private apiKey: string;
  private baseURL = 'https://api.rytr.me/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_RYTR_API_KEY || 
                  (typeof process !== 'undefined' ? process.env.RYTR_API_KEY : '') ||
                  '';
    
    if (!this.apiKey) {
      console.warn('Rytr API key not configured');
    }
  }

  async generateContent(prompt: string, options: {
    useCase?: string;
    tone?: string;
    language?: string;
    creativityLevel?: string;
    maxCharacters?: number;
    variations?: number;
  } = {}): Promise<{
    content: string;
    usage: { tokens: number; cost: number };
    success: boolean;
    error?: string;
  }> {
    if (!this.apiKey) {
      throw new Error('Rytr API key not configured');
    }

    const {
      useCase = 'blog_idea_outline',
      tone = 'convincing',
      language = 'en',
      creativityLevel = 'default',
      maxCharacters = 15000,
      variations = 1
    } = options;

    try {
      console.log('✍️ Rytr API Request:', { useCase, tone, maxCharacters });

      const requestBody: RytrRequest = {
        language,
        tone,
        use_case: useCase,
        input_text: prompt,
        creativity_level: creativityLevel,
        variations,
        max_characters: maxCharacters,
        format_text: true
      };

      const response = await fetch(`${this.baseURL}/ryte`, {
        method: 'POST',
        headers: {
          'Authentication': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Rytr API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const data: RytrResponse = await response.json();
      
      if (data.status !== 'success' || !data.data || data.data.length === 0) {
        throw new Error(data.message || 'No content generated from Rytr');
      }

      const content = data.data[0].text;
      const wordCount = data.data[0].word_count || Math.ceil(content.length / 5);
      const estimatedTokens = Math.ceil(wordCount * 1.3); // Rough conversion from words to tokens
      
      // Rytr pricing is character-based, estimated cost
      const cost = (content.length / 1000) * 0.01; // Rough estimate

      console.log('✅ Rytr generation successful:', { wordCount, estimatedTokens, cost: `$${cost.toFixed(4)}` });

      return {
        content,
        usage: { tokens: estimatedTokens, cost },
        success: true
      };

    } catch (error) {
      console.error('❌ Rytr API error:', error);
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUseCases(): Promise<{
    useCases: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    success: boolean;
    error?: string;
  }> {
    if (!this.apiKey) {
      throw new Error('Rytr API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/use-cases`, {
        headers: {
          'Authentication': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Rytr use cases error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        useCases: data.data || [],
        success: true
      };

    } catch (error) {
      console.error('❌ Rytr use cases error:', error);
      return {
        useCases: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseURL}/use-cases`, {
        headers: {
          'Authentication': `Bearer ${this.apiKey}`
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

export const rytrService = new RytrService();
