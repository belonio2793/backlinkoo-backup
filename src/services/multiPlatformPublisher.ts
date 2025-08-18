/**
 * Multi-Platform Publisher
 * Handles content publishing to multiple platforms: Telegraph, Write.as, Rentry.co, JustPaste.it
 */

export interface PublishRequest {
  title: string;
  content: string;
  author_name?: string;
  user_id: string;
  platform: 'telegraph' | 'writeas' | 'rentry' | 'justpaste';
}

export interface PublishResult {
  success: boolean;
  url?: string;
  platform: string;
  publishing_time_ms: number;
  error?: string;
  warning?: string;
}

class MultiPlatformPublisher {

  /**
   * Publish content to specified platform
   */
  async publishToplatform(request: PublishRequest): Promise<PublishResult> {
    const startTime = Date.now();

    try {
      switch (request.platform) {
        case 'telegraph':
          return await this.publishToTelegraph(request, startTime);
        case 'writeas':
          return await this.publishToWriteAs(request, startTime);
        case 'rentry':
          return await this.publishToRentry(request, startTime);
        case 'justpaste':
          return await this.publishToJustPaste(request, startTime);
        default:
          throw new Error(`Unsupported platform: ${request.platform}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Publishing to ${request.platform} failed:`, errorMessage);
      
      return {
        success: false,
        platform: request.platform,
        publishing_time_ms: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  /**
   * Publish to Telegraph (existing implementation)
   */
  private async publishToTelegraph(request: PublishRequest, startTime: number): Promise<PublishResult> {
    try {
      // Use existing Telegraph publishing through Netlify function
      const response = await fetch('/.netlify/functions/publish-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: request.title,
          content: request.content,
          target_site: 'telegraph',
          user_id: request.user_id,
          author_name: request.author_name || 'Content Bot',
          campaign_id: `multi-${Date.now()}`
        }),
      });

      if (!response.ok) {
        // If Netlify function is not available, use client-side fallback
        if (response.status === 404) {
          const { ClientTelegraphPublisher } = await import('./clientTelegraphPublisher');
          const clientResult = await ClientTelegraphPublisher.publishArticle({
            title: request.title,
            content: request.content,
            user_id: request.user_id,
            author_name: request.author_name || 'Content Bot'
          });

          return {
            success: clientResult.success,
            url: clientResult.url || '',
            platform: 'telegraph',
            publishing_time_ms: Date.now() - startTime,
            error: clientResult.error,
            warning: clientResult.warning
          };
        }

        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Telegraph API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Telegraph publishing failed');
      }

      return {
        success: true,
        url: data.data?.url || '',
        platform: 'telegraph',
        publishing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      throw new Error(`Telegraph publishing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Publish to Write.as
   * API Docs: https://developers.write.as/docs/api/
   */
  private async publishToWriteAs(request: PublishRequest, startTime: number): Promise<PublishResult> {
    try {
      // Write.as API endpoint for anonymous posts
      const response = await fetch('https://write.as/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: this.formatContentForWriteAs(request.content, request.title),
          title: request.title,
          // Anonymous posting (no auth required)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Write.as API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data.id) {
        throw new Error('Write.as response missing post ID');
      }

      // Write.as URLs follow the pattern: https://write.as/{post_id}
      const postUrl = `https://write.as/${data.data.id}`;

      return {
        success: true,
        url: postUrl,
        platform: 'writeas',
        publishing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      throw new Error(`Write.as publishing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Publish to Rentry.co
   * API Docs: https://rentry.co/api
   */
  private async publishToRentry(request: PublishRequest, startTime: number): Promise<PublishResult> {
    try {
      // Rentry.co API endpoint
      const response = await fetch('https://rentry.co/api/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: this.formatContentForRentry(request.content, request.title),
          // No edit_code = anonymous post
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Rentry API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Rentry response missing URL');
      }

      return {
        success: true,
        url: data.url,
        platform: 'rentry.co',
        publishing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      throw new Error(`Rentry publishing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Publish to JustPaste.it
   * API Docs: https://justpaste.it/api
   */
  private async publishToJustPaste(request: PublishRequest, startTime: number): Promise<PublishResult> {
    try {
      // JustPaste.it API endpoint
      const response = await fetch('https://justpaste.it/api/v1/paste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          body: this.formatContentForJustPaste(request.content, request.title),
          title: request.title,
          // Anonymous posting (no API key required for basic posts)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`JustPaste.it API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.key) {
        throw new Error('JustPaste.it response missing paste key');
      }

      // JustPaste.it URLs follow the pattern: https://justpaste.it/{key}
      const postUrl = `https://justpaste.it/${data.key}`;

      return {
        success: true,
        url: postUrl,
        platform: 'justpaste.it',
        publishing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      throw new Error(`JustPaste.it publishing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format content for Write.as (supports Markdown)
   */
  private formatContentForWriteAs(content: string, title: string): string {
    // Write.as supports Markdown, so we can use the content mostly as-is
    return content;
  }

  /**
   * Format content for Rentry.co (supports Markdown)
   */
  private formatContentForRentry(content: string, title: string): string {
    // Rentry supports Markdown, add title as header
    return `# ${title}\n\n${content}`;
  }

  /**
   * Format content for JustPaste.it (plain text/HTML)
   */
  private formatContentForJustPaste(content: string, title: string): string {
    // JustPaste.it supports basic HTML, convert markdown to HTML
    let formattedContent = content
      // Convert headers
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      // Convert links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Convert bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Convert line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap in paragraphs
    formattedContent = `<p>${formattedContent}</p>`;

    return formattedContent;
  }

  /**
   * Test platform availability
   */
  async testPlatform(platform: PublishRequest['platform']): Promise<{
    available: boolean;
    response_time_ms: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const testRequest: PublishRequest = {
        title: 'Test Post',
        content: 'This is a test post to verify platform availability.',
        user_id: 'test-user',
        platform: platform
      };

      const result = await this.publishToplatform(testRequest);
      
      return {
        available: result.success,
        response_time_ms: Date.now() - startTime,
        error: result.error
      };

    } catch (error) {
      return {
        available: false,
        response_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get platform-specific formatting requirements
   */
  getPlatformInfo(platform: PublishRequest['platform']): {
    name: string;
    supports_markdown: boolean;
    supports_html: boolean;
    max_content_length?: number;
    api_docs_url: string;
  } {
    switch (platform) {
      case 'telegraph':
        return {
          name: 'Telegraph',
          supports_markdown: true,
          supports_html: true,
          api_docs_url: 'https://telegra.ph/api'
        };
      case 'writeas':
        return {
          name: 'Write.as',
          supports_markdown: true,
          supports_html: false,
          max_content_length: 300000,
          api_docs_url: 'https://developers.write.as/docs/api/'
        };
      case 'rentry':
        return {
          name: 'Rentry',
          supports_markdown: true,
          supports_html: false,
          max_content_length: 100000,
          api_docs_url: 'https://rentry.co/api'
        };
      case 'justpaste':
        return {
          name: 'JustPaste.it',
          supports_markdown: false,
          supports_html: true,
          max_content_length: 50000,
          api_docs_url: 'https://justpaste.it/api'
        };
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
}

export const multiPlatformPublisher = new MultiPlatformPublisher();
export default multiPlatformPublisher;
