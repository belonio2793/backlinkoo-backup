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
      // For content improvement, use a simple keyword approach
      const result = await this.generateContent('', {
        keyword: `Content Improvement: ${instructions}`,
        url: 'https://example.com',
        wordCount: Math.min(content.length * 1.2, 2000),
        tone: 'professional'
      });

      return result;
    } catch (error) {
      console.error('Content improvement error:', error);
      return content; // Return original if improvement fails
    }
  }

  async generateSEOKeywords(topic: string, count: number = 10): Promise<string[]> {
    try {
      // Generate content focused on keywords
      const result = await this.generateContent('', {
        keyword: `SEO Keywords for ${topic}`,
        url: 'https://example.com',
        wordCount: 300,
        tone: 'technical'
      });

      // Extract potential keywords from the generated content
      const words = result
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .toLowerCase()
        .match(/\b[a-z]{3,}\b/g) || [];

      // Filter and deduplicate keywords
      const uniqueKeywords = [...new Set(words)]
        .filter(word => word.length > 3 && word !== topic.toLowerCase())
        .slice(0, count);

      return uniqueKeywords.length > 0
        ? uniqueKeywords
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
