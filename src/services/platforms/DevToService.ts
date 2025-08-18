export interface DevToConfig {
  apiKey: string;
  organizationId?: number;
}

export interface DevToPostParams {
  title: string;
  content: string;
  format: 'html' | 'markdown';
  tags: string[];
  canonicalUrl?: string;
  publishImmediately: boolean;
  metadata: {
    author: string;
    description: string;
    category: string;
  };
}

export interface DevToSubmissionResult {
  success: boolean;
  placementUrl?: string;
  submissionId?: string;
  estimatedApprovalTime?: number;
  requiresModeration: boolean;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface DevToUser {
  id: number;
  username: string;
  name: string;
  summary: string;
  location: string;
  website_url: string;
  joined_at: string;
  profile_image: string;
}

export interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  slug: string;
  path: string;
  published: boolean;
  published_at: string;
  tags: string[];
  reading_time_minutes: number;
}

export class DevToService {
  private readonly baseUrl = 'https://dev.to/api';
  private config: DevToConfig | null = null;
  private userCache: DevToUser | null = null;

  constructor(config?: DevToConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * Configure Dev.to connection
   */
  public configure(config: DevToConfig): void {
    this.config = config;
    this.userCache = null; // Clear cache when config changes
  }

  /**
   * Test Dev.to API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Dev.to configuration not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Dev.to connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<DevToUser | null> {
    if (!this.config) {
      throw new Error('Dev.to configuration not set');
    }

    if (this.userCache) {
      return this.userCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.statusText}`);
      }

      this.userCache = await response.json();
      return this.userCache;

    } catch (error) {
      console.error('Failed to get Dev.to user:', error);
      return null;
    }
  }

  /**
   * Publish content to Dev.to
   */
  async publishContent(params: DevToPostParams): Promise<DevToSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Dev.to configuration not set',
          retryable: false
        }
      };
    }

    try {
      // Process content for Dev.to
      const processedContent = this.optimizeContentForDevTo(params.content, params.format);
      
      // Prepare article data
      const articleData = {
        article: {
          title: params.title,
          published: params.publishImmediately,
          body_markdown: processedContent,
          tags: this.processTags(params.tags),
          series: null,
          canonical_url: params.canonicalUrl,
          description: params.metadata.description,
          organization_id: this.config.organizationId || null
        }
      };

      // Submit article
      const response = await fetch(`${this.baseUrl}/articles`, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(articleData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific Dev.to errors
        if (response.status === 429) {
          return {
            success: false,
            requiresModeration: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Dev.to API rate limit exceeded',
              retryable: true
            }
          };
        }

        if (response.status === 401) {
          return {
            success: false,
            requiresModeration: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Dev.to API key is invalid',
              retryable: false
            }
          };
        }

        if (response.status === 422) {
          return {
            success: false,
            requiresModeration: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: errorData.error || 'Article validation failed',
              retryable: false
            }
          };
        }

        return {
          success: false,
          requiresModeration: false,
          error: {
            code: `DEVTO_ERROR_${response.status}`,
            message: errorData.error || `Dev.to API error: ${response.statusText}`,
            retryable: response.status >= 500
          }
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        placementUrl: `https://dev.to${result.path}`,
        submissionId: result.id.toString(),
        estimatedApprovalTime: params.publishImmediately ? 0 : 24, // 24 hours for review
        requiresModeration: !params.publishImmediately
      };

    } catch (error: any) {
      console.error('Dev.to publishing error:', error);
      
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish to Dev.to',
          retryable: true
        }
      };
    }
  }

  /**
   * Optimize content for Dev.to platform
   */
  private optimizeContentForDevTo(content: string, format: string): string {
    let optimized = content;

    if (format === 'html') {
      // Convert HTML to Markdown for Dev.to
      optimized = this.convertHTMLToMarkdown(content);
    }

    // Add Dev.to specific optimizations
    optimized = this.addDevToOptimizations(optimized);

    return optimized;
  }

  /**
   * Convert HTML to Markdown
   */
  private convertHTMLToMarkdown(html: string): string {
    let markdown = html;
    
    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/g, '#### $1');
    
    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*');
    
    // Links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)');
    
    // Code blocks
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```');
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/g, '`$1`');
    
    // Lists
    markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');
    });
    
    markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/g, () => `${counter++}. $1\n`);
    });
    
    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n');
    
    // Line breaks
    markdown = markdown.replace(/<br[^>]*>/g, '\n');
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim();
  }

  /**
   * Add Dev.to specific optimizations
   */
  private addDevToOptimizations(markdown: string): string {
    let optimized = markdown;
    
    // Ensure proper heading hierarchy
    optimized = optimized.replace(/^# /gm, '## '); // Dev.to prefers starting with h2
    
    // Add front matter if missing (Dev.to supports it)
    if (!optimized.startsWith('---')) {
      optimized = `---\ntitle: "Article Title"\npublished: false\n---\n\n${optimized}`;
    }
    
    // Optimize code blocks for Dev.to
    optimized = optimized.replace(/```(\w+)?\n/g, (match, lang) => {
      return lang ? `\`\`\`${lang}\n` : '```\n';
    });
    
    // Add proper spacing around elements
    optimized = optimized.replace(/^(#{2,})/gm, '\n$1');
    optimized = optimized.replace(/^```/gm, '\n```');
    optimized = optimized.replace(/^>/gm, '\n>'); // Blockquotes
    
    return optimized.trim();
  }

  /**
   * Process tags for Dev.to (max 4 tags, specific format)
   */
  private processTags(tags: string[]): string[] {
    return tags
      .slice(0, 4) // Dev.to allows max 4 tags
      .map(tag => tag.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''))
      .filter(tag => tag.length >= 2 && tag.length <= 20) // Dev.to tag requirements
      .filter(Boolean);
  }

  /**
   * Get user's published articles
   */
  async getUserArticles(page: number = 1, per_page: number = 30): Promise<DevToArticle[]> {
    if (!this.config) {
      throw new Error('Dev.to configuration not set');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/articles/me/published?page=${page}&per_page=${per_page}`,
        {
          headers: {
            'api-key': this.config.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to get Dev.to articles:', error);
      return [];
    }
  }

  /**
   * Update an existing article
   */
  async updateArticle(articleId: number, updates: Partial<DevToPostParams>): Promise<DevToSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Dev.to configuration not set',
          retryable: false
        }
      };
    }

    try {
      const updateData: any = {
        article: {}
      };

      if (updates.title) updateData.article.title = updates.title;
      if (updates.content) {
        updateData.article.body_markdown = this.optimizeContentForDevTo(updates.content, updates.format || 'markdown');
      }
      if (updates.tags) updateData.article.tags = this.processTags(updates.tags);
      if (updates.canonicalUrl) updateData.article.canonical_url = updates.canonicalUrl;
      if (updates.publishImmediately !== undefined) updateData.article.published = updates.publishImmediately;

      const response = await fetch(`${this.baseUrl}/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'api-key': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          requiresModeration: false,
          error: {
            code: `DEVTO_UPDATE_ERROR_${response.status}`,
            message: errorData.error || `Failed to update article: ${response.statusText}`,
            retryable: response.status >= 500
          }
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        placementUrl: `https://dev.to${result.path}`,
        submissionId: result.id.toString(),
        estimatedApprovalTime: 0,
        requiresModeration: false
      };

    } catch (error: any) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update Dev.to article',
          retryable: true
        }
      };
    }
  }

  /**
   * Validate Dev.to API key
   */
  async validateApiKey(apiKey: string): Promise<{valid: boolean, message: string, user?: DevToUser}> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        return {
          valid: true,
          message: `API key valid for user: ${user.name} (@${user.username})`,
          user
        };
      }

      if (response.status === 401) {
        return {
          valid: false,
          message: 'Invalid API key'
        };
      }

      return {
        valid: false,
        message: `Dev.to API error: ${response.statusText}`
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Unable to connect to Dev.to API'
      };
    }
  }

  /**
   * Get popular tags from Dev.to
   */
  async getPopularTags(page: number = 1, per_page: number = 20): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags?page=${page}&per_page=${per_page}`);
      
      if (response.ok) {
        const tags = await response.json();
        return tags.map((tag: any) => tag.name);
      }

      return [];
    } catch (error) {
      console.error('Failed to get Dev.to tags:', error);
      return [];
    }
  }

  /**
   * Search articles by tag
   */
  async searchArticlesByTag(tag: string, page: number = 1, per_page: number = 30): Promise<DevToArticle[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/articles?tag=${encodeURIComponent(tag)}&page=${page}&per_page=${per_page}`
      );
      
      if (response.ok) {
        return await response.json();
      }

      return [];
    } catch (error) {
      console.error('Failed to search Dev.to articles:', error);
      return [];
    }
  }
}
