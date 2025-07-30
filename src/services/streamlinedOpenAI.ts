/**
 * Streamlined OpenAI Service - Server-Side via Netlify Functions
 * All API calls handled securely on the server
 */

class StreamlinedOpenAI {
  private async callNetlifyFunction(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`/.netlify/functions/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Netlify function error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  async generateContent(prompt: string, options: {
    keyword?: string;
    url?: string;
    wordCount?: number;
    tone?: string;
  } = {}): Promise<string> {
    try {
      // Use the generate-openai Netlify function
      const result = await this.callNetlifyFunction('generate-openai', {
        keyword: options.keyword || 'Content Generation',
        url: options.url || 'https://example.com',
        anchorText: options.keyword || 'generated content',
        wordCount: options.wordCount || 1000,
        contentType: 'article',
        tone: options.tone || 'professional'
      });

      if (result.success) {
        return result.content;
      } else {
        throw new Error(result.error || 'Content generation failed');
      }
    } catch (error) {
      console.error('Content generation error:', error);
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
