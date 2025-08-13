/**
 * Telegraph Posting Service
 * Handles article submission to Telegraph platform
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

  async createAccount(): Promise<string> {
    try {
      automationLogger.debug('api', 'Creating Telegraph account');
      
      const response = await fetch(`${this.baseUrl}/createAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          short_name: this.accountName,
          author_name: this.authorName,
          author_url: 'https://autoseo.app'
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegraph API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegraph error: ${data.error || 'Unknown error'}`);
      }

      this.accessToken = data.result.access_token;
      automationLogger.info('api', 'Telegraph account created successfully');
      
      return this.accessToken;
    } catch (error) {
      automationLogger.error('api', 'Failed to create Telegraph account', {}, undefined, error as Error);
      throw error;
    }
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

  private convertMarkdownToTelegraph(markdown: string): any[] {
    // Convert markdown to Telegraph's DOM format
    const lines = markdown.split('\n').filter(line => line.trim());
    const telegraphContent: any[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;

      // Headers
      if (trimmedLine.startsWith('##')) {
        telegraphContent.push({
          tag: 'h3',
          children: [this.parseInlineMarkdown(trimmedLine.replace(/^#+\s*/, ''))]
        });
      } else if (trimmedLine.startsWith('#')) {
        telegraphContent.push({
          tag: 'h3',
          children: [this.parseInlineMarkdown(trimmedLine.replace(/^#+\s*/, ''))]
        });
      }
      // Lists
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        telegraphContent.push({
          tag: 'p',
          children: ['• ' + this.parseInlineMarkdown(trimmedLine.replace(/^[-*]\s*/, ''))]
        });
      }
      // Regular paragraphs
      else {
        const parsedContent = this.parseInlineMarkdown(trimmedLine);
        telegraphContent.push({
          tag: 'p',
          children: Array.isArray(parsedContent) ? parsedContent : [parsedContent]
        });
      }
    }

    return telegraphContent;
  }

  private parseInlineMarkdown(text: string): any {
    // Handle links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    if (linkRegex.test(text)) {
      const parts: any[] = [];
      let lastIndex = 0;
      
      text.replace(linkRegex, (match, linkText, url, index) => {
        // Add text before link
        if (index > lastIndex) {
          const beforeText = text.substring(lastIndex, index);
          if (beforeText) {
            parts.push(this.parseTextFormatting(beforeText));
          }
        }
        
        // Add link
        parts.push({
          tag: 'a',
          attrs: { href: url },
          children: [linkText]
        });
        
        lastIndex = index + match.length;
        return match;
      });
      
      // Add remaining text
      if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        if (remainingText) {
          parts.push(this.parseTextFormatting(remainingText));
        }
      }
      
      return parts.length === 1 ? parts[0] : parts;
    }
    
    return this.parseTextFormatting(text);
  }

  private parseTextFormatting(text: string): any {
    // Handle bold **text**
    if (text.includes('**')) {
      const parts: any[] = [];
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let lastIndex = 0;
      
      text.replace(boldRegex, (match, boldText, index) => {
        // Add text before bold
        if (index > lastIndex) {
          parts.push(text.substring(lastIndex, index));
        }
        
        // Add bold text
        parts.push({
          tag: 'strong',
          children: [boldText]
        });
        
        lastIndex = index + match.length;
        return match;
      });
      
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts.length === 1 ? parts[0] : parts;
    }
    
    // Handle italic *text*
    if (text.includes('*')) {
      const italicRegex = /\*([^*]+)\*/g;
      if (italicRegex.test(text)) {
        return text.replace(italicRegex, (match, italicText) => {
          return {
            tag: 'em',
            children: [italicText]
          };
        });
      }
    }
    
    return text;
  }

  // Test method for development
  async testPost(campaignId: string): Promise<TelegraphPostResult> {
    automationLogger.info('api', 'Running test Telegraph post', {}, campaignId);
    
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
  getStatus(): { configured: boolean; message: string; hasToken: boolean } {
    return {
      configured: true,
      message: 'Telegraph service ready (will create account automatically)',
      hasToken: this.accessToken !== null
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
