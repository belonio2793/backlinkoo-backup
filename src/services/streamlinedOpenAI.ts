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
    type?: string;
    maxTokens?: number;
    temperature?: number;
    topic?: string;
    keywords?: string[];
  } = {}): Promise<string> {
    try {
      const result = await this.callNetlifyFunction('generate-content', {
        prompt,
        type: options.type || 'general',
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        topic: options.topic,
        keywords: options.keywords || []
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
    try {
      const contentResult = await this.generateContent('', {
        type: 'blog_post',
        topic: topic,
        keywords: keywords,
        maxTokens: 2000,
        temperature: 0.7
      });

      // Extract title from content or use topic
      const titleMatch = contentResult.match(/^#\s+(.+)/m) || contentResult.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const title = titleMatch
        ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
        : `${topic}: Complete Guide`;

      // Create excerpt from first paragraph
      const sentences = contentResult
        .replace(/<[^>]*>/g, ' ')
        .replace(/#+\s+[^\n]*\n/g, '')
        .trim()
        .split('.')
        .slice(0, 2);

      const excerpt = sentences.join('.').substring(0, 150) + '...';

      return {
        title,
        content: contentResult,
        excerpt
      };
    } catch (error) {
      console.error('Blog post generation error:', error);

      // Fallback response
      return {
        title: topic,
        content: `# ${topic}\n\nContent generation is temporarily unavailable. Please try again later.`,
        excerpt: 'Content generation temporarily unavailable.'
      };
    }
  }

  async improveContent(content: string, instructions: string = 'Improve this content'): Promise<string> {
    try {
      const result = await this.generateContent(`${instructions}\n\nOriginal content:\n${content}\n\nProvide the improved version:`, {
        type: 'content_improvement',
        maxTokens: Math.min(content.length * 1.5, 2000),
        temperature: 0.6
      });

      return result;
    } catch (error) {
      console.error('Content improvement error:', error);
      return content; // Return original if improvement fails
    }
  }

  async generateSEOKeywords(topic: string, count: number = 10): Promise<string[]> {
    try {
      const result = await this.generateContent('', {
        type: 'seo_keywords',
        topic: topic,
        maxTokens: 200,
        temperature: 0.5
      });

      // Parse keywords from the response
      const keywords = result
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+\./)) // Remove numbered lists
        .map(line => line.replace(/^[-*•]\s*/, '')) // Remove bullet points
        .slice(0, count);

      return keywords.length > 0
        ? keywords
        : [topic, `${topic} guide`, `${topic} tips`, `${topic} 2024`]; // Fallback keywords
    } catch (error) {
      console.error('SEO keywords generation error:', error);
      return [topic, `${topic} guide`, `${topic} tips`]; // Simple fallback
    }
  }
}

// Export singleton instance
export const openAI = new StreamlinedOpenAI();
export default openAI;
