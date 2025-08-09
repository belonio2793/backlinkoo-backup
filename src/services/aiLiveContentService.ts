/**
 * AI Live Content Generation Service
 * Handles OpenAI API integration for real-time blog generation
 */

interface GenerationResult {
  content: string;
  wordCount: number;
  provider: string;
  success: boolean;
  error?: string;
}

class AILiveContentService {
  private apiKey: string;
  private endpoint = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-3.5-turbo';

  constructor() {
    this.apiKey = import.meta.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('AI service not available - configuration pending.');
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.apiKey) {
      console.error('OpenAI API key not configured');
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI health check failed:', error.message || error.toString() || JSON.stringify(error));
      return false;
    }
  }

  async generateContent(
    prompt: string,
    keyword: string,
    anchorText: string,
    url: string,
    retryCount: number = 3
  ): Promise<GenerationResult> {
    if (!this.apiKey) {
      return {
        content: '',
        wordCount: 0,
        provider: 'OpenAI',
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    try {
      const systemPrompt = `You are a professional content writer specializing in SEO-optimized blog posts. Create high-quality, engaging content that:

1. Meets the minimum 1000-word requirement
2. Uses proper SEO formatting with H1, H2, and H3 headers
3. Includes short, readable paragraphs
4. Incorporates bullet points or numbered lists where appropriate
5. Uses natural keyword placement (avoid keyword stuffing)
6. Creates valuable, informative content for readers
7. Includes the specified anchor text as a natural hyperlink to the target URL

Format the content in clean HTML with proper heading tags, paragraph tags, and list elements.`;

      const userPrompt = `${prompt}

Additional requirements:
- Target keyword: "${keyword}"
- Anchor text to link: "${anchorText}"
- Link destination: "${url}"
- Minimum 1000 words
- Professional, engaging tone
- SEO-optimized structure with clear headings
- Include practical tips, insights, or examples related to the topic

Please create a comprehensive, well-structured blog post that naturally incorporates the anchor text "${anchorText}" as a clickable link to "${url}".`;

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      };

      console.log('Generating content with OpenAI...', { prompt: userPrompt.substring(0, 100) });

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      let data;
      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.error || 'Unknown error'}`;
        } catch {
          // If JSON parsing fails, use status only
        }
        throw new Error(errorMessage);
      } else {
        data = await response.json();
      }
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }

      const content = data.choices[0].message.content;
      const wordCount = content.split(/\s+/).length;

      console.log(`Content generated successfully: ${wordCount} words`);

      return {
        content,
        wordCount,
        provider: 'OpenAI',
        success: true
      };

    } catch (error) {
      console.error('OpenAI content generation failed:', error.message || error.toString() || JSON.stringify(error));

      // Retry logic with exponential backoff
      if (retryCount > 0 && (error instanceof Error &&
          (error.message.includes('429') || error.message.includes('500') || error.message.includes('502')))) {
        console.log(`Retrying in ${(4 - retryCount) * 1000}ms... (${retryCount} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, (4 - retryCount) * 1000));
        return this.generateContent(prompt, keyword, anchorText, url, retryCount - 1);
      }

      return {
        content: '',
        wordCount: 0,
        provider: 'OpenAI',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  generateSlug(keyword: string): string {
    const baseSlug = keyword.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  }

  validateContent(content: string, keyword: string, anchorText: string, url: string) {
    const issues = [];
    let score = 0;

    // Check word count
    const wordCount = content.split(/\s+/).length;
    if (wordCount < 1000) {
      issues.push(`Content too short: ${wordCount} words (minimum 1000 required)`);
    } else {
      score += 30;
    }

    // Check keyword presence
    const keywordRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const keywordMatches = content.match(keywordRegex);
    if (!keywordMatches || keywordMatches.length === 0) {
      issues.push('Target keyword not found in content');
    } else if (keywordMatches.length > 10) {
      issues.push('Potential keyword stuffing detected');
      score += 10;
    } else {
      score += 25;
    }

    // Check anchor text and URL
    if (!content.includes(anchorText)) {
      issues.push('Anchor text not found in content');
    } else {
      score += 25;
    }

    if (!content.includes(url)) {
      issues.push('Target URL not found in content');
    } else {
      score += 20;
    }

    // Check for basic HTML structure
    if (content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>')) {
      score += 10;
    } else {
      issues.push('No proper heading structure detected');
    }

    return {
      score,
      isValid: score >= 70 && issues.length === 0,
      issues,
      wordCount
    };
  }
}

export const aiLiveContentService = new AILiveContentService();
