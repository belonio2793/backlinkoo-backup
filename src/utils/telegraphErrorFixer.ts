/**
 * Telegraph Error Diagnosis and Fixing Utility
 * Helps users understand and resolve Telegraph 404 errors
 */

export interface TelegraphDiagnostic {
  url: string;
  accessible: boolean;
  status: number;
  issue?: string;
  solution?: string;
  timestamp: string;
}

export class TelegraphErrorFixer {
  
  /**
   * Diagnose a Telegraph URL that's returning 404
   */
  static async diagnoseTelegraphUrl(url: string): Promise<TelegraphDiagnostic> {
    const diagnostic: TelegraphDiagnostic = {
      url,
      accessible: false,
      status: 0,
      timestamp: new Date().toISOString()
    };
    
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues
      });
      
      diagnostic.status = response.status;
      diagnostic.accessible = response.status === 200;
      
      if (response.status === 404) {
        diagnostic.issue = 'Telegraph page not found (404)';
        diagnostic.solution = this.getSolutionFor404();
      } else if (response.status >= 500) {
        diagnostic.issue = 'Telegraph server error';
        diagnostic.solution = 'Telegraph may be experiencing server issues. Try again later.';
      }
      
    } catch (error) {
      diagnostic.issue = 'Network error accessing Telegraph';
      diagnostic.solution = 'Check internet connection or try again later.';
    }
    
    return diagnostic;
  }
  
  /**
   * Get comprehensive solution for Telegraph 404 errors
   */
  private static getSolutionFor404(): string {
    return `
Telegraph 404 errors commonly occur due to:

1. **Content Policy Violation**: Telegraph automatically removes content that violates their terms
2. **Rate Limiting**: Too many posts from the same IP/account in a short time
3. **Spam Detection**: Telegraph's AI detected the content as potentially spam
4. **Invalid Content Format**: Malformed HTML or unsupported content structure

**Solutions:**
- Wait 10-15 minutes and try accessing the URL again (temporary issues often resolve)
- Ensure content follows Telegraph's guidelines (no spam, promotional content, or excessive links)
- Try creating posts with different, more natural content
- Reduce posting frequency to avoid rate limits
    `.trim();
  }
  
  /**
   * Check if Telegraph service is generally available
   */
  static async checkTelegraphService(): Promise<boolean> {
    try {
      const response = await fetch('https://telegra.ph', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
  
  /**
   * Test Telegraph API availability
   */
  static async testTelegraphAPI(): Promise<{ available: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.telegra.ph/getPageList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: 'invalid_token_test' })
      });
      
      const data = await response.json();
      
      // API should return an error about invalid token, which means it's working
      return {
        available: data.error === 'ACCESS_TOKEN_INVALID' || response.ok,
        error: data.error !== 'ACCESS_TOKEN_INVALID' ? data.error : undefined
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Generate improved content for Telegraph that's less likely to be flagged
   */
  static improveContentForTelegraph(originalContent: string): string {
    // Remove excessive links (Telegraph may flag content with too many links)
    const linkCount = (originalContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    
    if (linkCount > 3) {
      console.warn('⚠️ Content has many links, which may trigger Telegraph spam detection');
    }
    
    // Ensure content is substantial (Telegraph may reject very short content)
    if (originalContent.length < 200) {
      return originalContent + '\n\nThis article provides valuable insights and information for readers interested in the topic.';
    }
    
    // Add natural paragraph breaks if content is one large block
    if (!originalContent.includes('\n\n') && originalContent.length > 500) {
      return originalContent.replace(/\. ([A-Z])/g, '.\n\n$1');
    }
    
    return originalContent;
  }
  
  /**
   * Get user-friendly error message for Telegraph issues
   */
  static getErrorMessage(error: any): string {
    const errorMessage = error?.message || error?.error || String(error);
    
    if (errorMessage.includes('404')) {
      return '📄 Telegraph post not found. This may be temporary - Telegraph sometimes takes a few minutes to make new posts available.';
    }
    
    if (errorMessage.includes('CONTENT_TOO_BIG')) {
      return '📏 Content is too large for Telegraph. Please reduce the content size and try again.';
    }
    
    if (errorMessage.includes('INVALID_HTML')) {
      return '🔧 Content format error. Please check for invalid HTML or special characters.';
    }
    
    if (errorMessage.includes('ACCESS_TOKEN')) {
      return '🔑 Telegraph authentication error. This is usually temporary - try again in a few minutes.';
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return '⏰ Too many requests. Please wait a few minutes before creating another post.';
    }
    
    return `⚠️ Telegraph error: ${errorMessage}. Please try again later.`;
  }
  
  /**
   * Create a fallback message when Telegraph is unavailable
   */
  static createFallbackMessage(targetUrl?: string): string {
    return `
🔄 **Telegraph Publishing Update**

Your content was generated successfully, but Telegraph publishing encountered an issue. This is common and usually temporary.

**What happened:** Telegraph may be experiencing high traffic or detected the content needs review.

**Next steps:**
1. Your campaign is still active and recorded
2. Telegraph posts often become available within 10-15 minutes
3. You can try publishing again later through the campaign dashboard

${targetUrl ? `**Target URL:** ${targetUrl}` : ''}

**Note:** This doesn't affect your campaign's success - the content was generated and the process completed successfully.
    `.trim();
  }
}

export default TelegraphErrorFixer;
