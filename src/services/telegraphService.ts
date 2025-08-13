/**
 * Telegraph Posting Service
 * Handles article submission via Netlify functions
 */

import { automationLogger } from './automationLogger';

export interface TelegraphPostRequest {
  title: string;
  content: string;
  campaignId: string;
  authorName?: string;
  authorUrl?: string;
}

export interface TelegraphPostResult {
  success: boolean;
  url?: string;
  path?: string;
  title?: string;
  description?: string;
  authorName?: string;
  authorUrl?: string;
  imageUrl?: string;
  content?: any[];
  views?: number;
  canEdit?: boolean;
  error?: string;
}

class TelegraphService {
  private netlifyFunctionUrl = '/.netlify/functions/publish-article';

  constructor() {
    automationLogger.info('system', 'Telegraph service initialized (using Netlify functions)');
  }

  async postArticle(request: TelegraphPostRequest): Promise<TelegraphPostResult> {
    const { title, content, campaignId, authorName = 'SEO Content Bot' } = request;

    automationLogger.info('article_submission', 'Posting article via Netlify function', {
      title: title.substring(0, 50),
      contentLength: content.length
    }, campaignId);

    try {
      // Call Netlify function for publishing
      const response = await fetch(this.netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          content: content,
          campaign_id: campaignId,
          target_site: 'telegraph',
          author_name: authorName,
          user_id: this.getCurrentUserId() // Helper to get current user ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Netlify function error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Article publishing failed');
      }

      const result = data.data;

      automationLogger.info('article_submission', 'Article posted successfully via Netlify', {
        url: result.url,
        title: result.title,
        target_site: result.target_site
      }, campaignId);

      return {
        success: true,
        url: result.url,
        title: result.title,
        description: result.metadata?.description,
        authorName: result.metadata?.author_name,
        views: result.metadata?.views || 0,
        canEdit: result.metadata?.can_edit || false
      };

    } catch (error) {
      automationLogger.error('article_submission', 'Failed to post article via Netlify function', {
        title: title.substring(0, 50),
        error: error instanceof Error ? error.message : String(error)
      }, campaignId, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private getCurrentUserId(): string | undefined {
    // Helper to get current user ID from auth context
    // This will be passed from the calling component
    return undefined;
  }

  // Test method for development
  async testPost(campaignId: string): Promise<TelegraphPostResult> {
    automationLogger.info('api', 'Running test Telegraph post via Netlify', {}, campaignId);
    
    return this.postArticle({
      title: 'Test Article - SEO Tools Guide',
      content: `# SEO Tools Guide

This is a test article about **SEO tools** and digital marketing.

## Introduction

Digital marketing requires the right tools to succeed. Here are some key points:

- Search engine optimization
- Content marketing strategies  
- [Link building techniques](https://example.com)

## Conclusion

Using the right SEO tools can significantly improve your online presence.`,
      campaignId,
      authorName: 'SEO Test Bot'
    });
  }

  // Get service status
  getStatus(): { configured: boolean; message: string } {
    return {
      configured: true,
      message: 'Telegraph publishing ready via Netlify functions'
    };
  }
}

export const telegraphService = new TelegraphService();

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).telegraphService = telegraphService;
  console.log('🔧 Telegraph service available at window.telegraphService');
}

export default telegraphService;
