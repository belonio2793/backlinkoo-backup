/**
 * Blog Template Engine - DEPRECATED
 * This file has been replaced with fresh AI generation
 * All content is now generated using the AI Live system
 */

// This service is deprecated - all blog content should now be generated fresh using AI
// Redirect users to the AI Live Blog Generator at /ai-live

export class BlogTemplateEngine {
  async generateBlogPost(keyword: string, targetUrl: string, wordCount: number = 1200) {
    console.warn('BlogTemplateEngine is deprecated. Please use the AI Live Blog Generator at /ai-live for fresh content generation.');
    
    // Return a notice directing users to the new system
    return {
      title: `Please use AI Live Generator for: ${keyword}`,
      slug: `ai-live-redirect-${Date.now()}`,
      content: `<div style="padding: 2rem; background: #f8f9fa; border-left: 4px solid #007bff; margin: 1rem 0;">
        <h2>🚀 Fresh AI Content Available!</h2>
        <p>This content was generated using a template system. For fresh, AI-generated content, please visit:</p>
        <p><strong><a href="/ai-live" style="color: #007bff;">AI Live Blog Generator</a></strong></p>
        <p>The new system generates unique, high-quality content every time using advanced AI technology.</p>
      </div>`,
      wordCount: 50,
      excerpt: 'Please use the AI Live Blog Generator for fresh content.',
      metaDescription: 'Redirecting to AI Live Blog Generator for fresh content.',
      contextualLinks: [],
      readingTime: 1,
      seoScore: 0,
      template: { id: 'deprecated', name: 'Deprecated Template' }
    };
  }

  getRandomTemplate() {
    console.warn('BlogTemplateEngine is deprecated. Use /ai-live for fresh AI content.');
    return { id: 'deprecated', name: 'Deprecated Template' };
  }
}

export const blogTemplateEngine = new BlogTemplateEngine();
export type { GeneratedBlogPost, BlogTemplate } from './types';

// Types are preserved for compatibility but should not be used for new content
interface BlogTemplate {
  id: string;
  name: string;
}

interface GeneratedBlogPost {
  template: BlogTemplate;
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  contextualLinks: any[];
  readingTime: number;
  wordCount: number;
  seoScore: number;
}
