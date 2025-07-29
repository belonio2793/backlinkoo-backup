/**
 * Simple OpenAI API Service
 * Basic content generation without complex retry logic
 */

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
}

export class SimpleOpenAIService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                  import.meta.env.OPENAI_API_KEY || 
                  '';
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
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 3500,
      temperature = 0.7,
      systemPrompt = 'You are a professional content writer.'
    } = options;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || 0;
      const cost = tokens * (model.includes('gpt-4') ? 0.00003 : 0.000002);

      return {
        content,
        usage: { tokens, cost },
        success: true
      };

    } catch (error) {
      return {
        content: '',
        usage: { tokens: 0, cost: 0 },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}

export const simpleOpenAIService = new SimpleOpenAIService();
