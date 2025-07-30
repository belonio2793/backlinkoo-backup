/**
 * Streamlined OpenAI Service
 * Auto-configured, no validation needed - just works
 */

import { SecureConfig } from '@/lib/secure-config';

class StreamlinedOpenAI {
  private getApiKey(): string {
    // Try multiple sources for API key
    const key = import.meta.env.VITE_OPENAI_API_KEY || 
                SecureConfig.OPENAI_API_KEY || 
                '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';
    
    return key;
  }

  async generateContent(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}): Promise<string> {
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7
    } = options;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw error;
    }
  }

  async generateBlogPost(topic: string, keywords: string[] = []): Promise<{
    title: string;
    content: string;
    excerpt: string;
  }> {
    const keywordText = keywords.length > 0 ? `\nKeywords to include: ${keywords.join(', ')}` : '';
    
    const prompt = `Write a comprehensive blog post about "${topic}".${keywordText}

Please structure the response as a JSON object with:
- title: A compelling blog post title
- content: Full blog post content (800-1200 words) with proper markdown formatting
- excerpt: A brief summary (100-150 words)

Make the content engaging, informative, and SEO-friendly.`;

    try {
      const response = await this.generateContent(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.8
      });

      // Try to parse as JSON, fallback to structured text if needed
      try {
        return JSON.parse(response);
      } catch {
        // Fallback: create structured response from text
        const lines = response.split('\n');
        const title = lines.find(line => line.toLowerCase().includes('title'))?.replace(/.*title[:\-]\s*/i, '') || topic;
        
        return {
          title,
          content: response,
          excerpt: response.substring(0, 150) + '...'
        };
      }
    } catch (error) {
      console.error('Blog post generation error:', error);
      throw error;
    }
  }

  async improveContent(content: string, instructions: string = 'Improve this content'): Promise<string> {
    const prompt = `${instructions}

Original content:
${content}

Please provide the improved version:`;

    return this.generateContent(prompt, {
      model: 'gpt-3.5-turbo',
      maxTokens: 1500,
      temperature: 0.6
    });
  }

  async generateSEOKeywords(topic: string, count: number = 10): Promise<string[]> {
    const prompt = `Generate ${count} SEO-friendly keywords for the topic: "${topic}"

Return only the keywords, one per line, without numbering or bullets.`;

    try {
      const response = await this.generateContent(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 200,
        temperature: 0.5
      });

      return response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, count);
    } catch (error) {
      console.error('SEO keywords generation error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const openAI = new StreamlinedOpenAI();
export default openAI;
