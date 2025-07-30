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
    console.log('🎯 Generating blog automatically for:', request.topic);

    try {
      // Generate the blog post
      const blogPost = await openAI.generateBlogPost(request.topic, request.keywords);
      
      // Generate SEO keywords
      const seoKeywords = await openAI.generateSEOKeywords(request.topic, 8);
      
      // Create slug from title
      const slug = this.createSlug(blogPost.title);
      
      return {
        success: true,
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        keywords: [...(request.keywords || []), ...seoKeywords],
        slug
      };
    } catch (error) {
      console.error('Blog generation error:', error);
      
      // Fallback to ensure something is always returned
      return {
        success: false,
        title: request.topic || 'New Blog Post',
        content: `# ${request.topic}\n\nContent generation is temporarily unavailable. Please try again in a moment.`,
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
