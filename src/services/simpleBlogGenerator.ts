/**
 * Simple Blog Generator - Auto-configured, no validation needed
 */

import { openAI } from './streamlinedOpenAI';

export interface BlogRequest {
  topic: string;
  keywords?: string[];
  targetUrl?: string;
  userId?: string;
}

export interface BlogResult {
  success: boolean;
  title: string;
  content: string;
  excerpt: string;
  keywords: string[];
  slug: string;
}

export class SimpleBlogGenerator {
  async generateBlog(request: BlogRequest): Promise<BlogResult> {
    console.log('🎯 Generating blog via Netlify functions for:', request.topic);

    try {
      // Use the existing generate-openai Netlify function for full blog generation
      const response = await fetch('/.netlify/functions/generate-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: request.topic,
          url: request.targetUrl || 'https://example.com',
          anchorText: request.topic,
          wordCount: 1200,
          contentType: 'article',
          tone: 'professional'
        })
      });

      if (!response.ok) {
        throw new Error(`Netlify function error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Extract title from HTML content
        const titleMatch = result.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const title = titleMatch
          ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
          : request.topic;

        // Create excerpt from first paragraph
        const excerptMatch = result.content.match(/<p[^>]*>(.*?)<\/p>/i);
        const excerpt = excerptMatch
          ? excerptMatch[1].replace(/<[^>]*>/g, '').substring(0, 150) + '...'
          : `A comprehensive guide about ${request.topic}`;

        // Generate additional SEO keywords
        const seoKeywords = await openAI.generateSEOKeywords(request.topic, 8);

        // Create slug from title
        const slug = this.createSlug(title);

        return {
          success: true,
          title,
          content: result.content,
          excerpt,
          keywords: [...(request.keywords || []), ...seoKeywords],
          slug
        };
      } else {
        throw new Error(result.error || 'Content generation failed');
      }
    } catch (error) {
      console.error('Blog generation error:', error);

      // Fallback to ensure something is always returned
      return {
        success: false,
        title: request.topic || 'New Blog Post',
        content: `<h1>${request.topic}</h1><p>Content generation is temporarily unavailable. Please try again in a moment.</p>`,
        excerpt: 'Content generation temporarily unavailable.',
        keywords: request.keywords || [],
        slug: this.createSlug(request.topic || 'new-blog-post')
      };
    }
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async improveExistingContent(content: string, instructions: string = 'Improve and enhance this content'): Promise<string> {
    try {
      return await openAI.improveContent(content, instructions);
    } catch (error) {
      console.error('Content improvement error:', error);
      return content; // Return original if improvement fails
    }
  }

  async generateSEOKeywords(topic: string, count: number = 10): Promise<string[]> {
    try {
      return await openAI.generateSEOKeywords(topic, count);
    } catch (error) {
      console.error('SEO keyword generation error:', error);
      return []; // Return empty array if generation fails
    }
  }
}

// Export singleton instance
export const simpleBlogGenerator = new SimpleBlogGenerator();
export default simpleBlogGenerator;
