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
  private baseUrl = 'https://api.telegra.ph';
  private accessToken: string | null = null;
  private accountName = 'AutoSEO';
  private authorName = 'SEO Automation';

  constructor() {
    automationLogger.info('system', 'Telegraph service initialized');
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
    const { title, content, campaignId, authorName = this.authorName, authorUrl } = request;

    automationLogger.info('article_submission', 'Posting article to Telegraph', {
      title: title.substring(0, 50),
      contentLength: content.length
    }, campaignId);

    try {
      // Ensure we have an access token
      if (!this.accessToken) {
        await this.createAccount();
      }

      // Convert markdown content to Telegraph format
      const telegraphContent = this.convertMarkdownToTelegraph(content);

      const response = await fetch(`${this.baseUrl}/createPage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          title: title,
          author_name: authorName,
          author_url: authorUrl,
          content: telegraphContent,
          return_content: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegraph API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        // Try to recreate account if token is invalid
        if (data.error === 'ACCESS_TOKEN_INVALID') {
          automationLogger.warn('api', 'Telegraph token invalid, recreating account', {}, campaignId);
          await this.createAccount();
          return this.postArticle(request); // Retry once
        }
        throw new Error(`Telegraph error: ${data.error || 'Unknown error'}`);
      }

      const result = data.result;
      const telegraphUrl = `https://telegra.ph/${result.path}`;

      automationLogger.info('article_submission', 'Article posted successfully to Telegraph', {
        url: telegraphUrl,
        path: result.path,
        title: result.title
      }, campaignId);

      return {
        success: true,
        url: telegraphUrl,
        path: result.path,
        title: result.title,
        description: result.description,
        authorName: result.author_name,
        authorUrl: result.author_url,
        imageUrl: result.image_url,
        content: result.content,
        views: result.views,
        canEdit: result.can_edit
      };

    } catch (error) {
      automationLogger.error('article_submission', 'Failed to post article to Telegraph', {
        title: title.substring(0, 50),
        error: error instanceof Error ? error.message : String(error)
      }, campaignId, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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
