export interface WordPressConfig {
  baseUrl: string;
  username: string;
  applicationPassword: string;
  authorId?: number;
}

export interface WordPressPostParams {
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

export interface WordPressSubmissionResult {
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

export class WordPressService {
  private config: WordPressConfig | null = null;

  constructor(config?: WordPressConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * Configure WordPress connection
   */
  public configure(config: WordPressConfig): void {
    this.config = config;
  }

  /**
   * Test WordPress connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('WordPress configuration not set');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }

  /**
   * Publish content to WordPress
   */
  async publishContent(params: WordPressPostParams): Promise<WordPressSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'WordPress configuration not set',
          retryable: false
        }
      };
    }

    try {
      // Convert content format if needed
      const processedContent = params.format === 'markdown' ? 
        this.convertMarkdownToHTML(params.content) : 
        params.content;

      // Create categories and tags
      const categoryId = await this.getOrCreateCategory(params.metadata.category);
      const tagIds = await this.getOrCreateTags(params.tags);

      // Prepare post data
      const postData = {
        title: params.title,
        content: processedContent,
        status: params.publishImmediately ? 'publish' : 'draft',
        author: this.config.authorId || 1,
        categories: [categoryId],
        tags: tagIds,
        excerpt: params.metadata.description,
        meta: {
          canonical_url: params.canonicalUrl
        }
      };

      // Submit post
      const response = await fetch(`${this.config.baseUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          requiresModeration: false,
          error: {
            code: `WP_ERROR_${response.status}`,
            message: errorData.message || `WordPress API error: ${response.statusText}`,
            retryable: response.status >= 500
          }
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        placementUrl: result.link,
        submissionId: result.id.toString(),
        estimatedApprovalTime: params.publishImmediately ? 0 : 24, // 24 hours for draft review
        requiresModeration: !params.publishImmediately
      };

    } catch (error: any) {
      console.error('WordPress publishing error:', error);
      
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish to WordPress',
          retryable: true
        }
      };
    }
  }

  /**
   * Get or create category
   */
  private async getOrCreateCategory(categoryName: string): Promise<number> {
    if (!this.config) throw new Error('Configuration not set');

    try {
      // Search for existing category
      const searchResponse = await fetch(
        `${this.config.baseUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const categories = await searchResponse.json();
        if (categories.length > 0) {
          return categories[0].id;
        }
      }

      // Create new category
      const createResponse = await fetch(`${this.config.baseUrl}/wp-json/wp/v2/categories`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/\s+/g, '-')
        })
      });

      if (createResponse.ok) {
        const newCategory = await createResponse.json();
        return newCategory.id;
      }

      // Fallback to "Uncategorized" (ID 1)
      return 1;

    } catch (error) {
      console.warn('Category creation failed, using default:', error);
      return 1; // Default "Uncategorized" category
    }
  }

  /**
   * Get or create tags
   */
  private async getOrCreateTags(tagNames: string[]): Promise<number[]> {
    if (!this.config) throw new Error('Configuration not set');

    const tagIds: number[] = [];

    for (const tagName of tagNames.slice(0, 5)) { // Limit to 5 tags
      try {
        // Search for existing tag
        const searchResponse = await fetch(
          `${this.config.baseUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`,
          {
            headers: {
              'Authorization': this.getAuthHeader(),
              'Content-Type': 'application/json'
            }
          }
        );

        if (searchResponse.ok) {
          const tags = await searchResponse.json();
          if (tags.length > 0) {
            tagIds.push(tags[0].id);
            continue;
          }
        }

        // Create new tag
        const createResponse = await fetch(`${this.config.baseUrl}/wp-json/wp/v2/tags`, {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-')
          })
        });

        if (createResponse.ok) {
          const newTag = await createResponse.json();
          tagIds.push(newTag.id);
        }

      } catch (error) {
        console.warn(`Failed to create tag "${tagName}":`, error);
      }
    }

    return tagIds;
  }

  /**
   * Convert Markdown to HTML
   */
  private convertMarkdownToHTML(markdown: string): string {
    // Basic Markdown to HTML conversion
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Lists
    html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // Paragraphs
    html = html.split('\n\n').map(paragraph => {
      if (paragraph.trim() && 
          !paragraph.includes('<h1>') && 
          !paragraph.includes('<h2>') && 
          !paragraph.includes('<h3>') &&
          !paragraph.includes('<ul>') &&
          !paragraph.includes('<pre>')) {
        return `<p>${paragraph.trim()}</p>`;
      }
      return paragraph;
    }).join('\n');
    
    return html;
  }

  /**
   * Get authentication header
   */
  private getAuthHeader(): string {
    if (!this.config) throw new Error('Configuration not set');
    
    const credentials = btoa(`${this.config.username}:${this.config.applicationPassword}`);
    return `Basic ${credentials}`;
  }

  /**
   * Get available sites (for WordPress.com)
   */
  async getAvailableSites(): Promise<Array<{id: string, name: string, url: string}>> {
    if (!this.config) return [];

    try {
      const response = await fetch(`${this.config.baseUrl}/wp-json/wp/v2/`, {
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const siteInfo = await response.json();
        return [{
          id: siteInfo.url,
          name: siteInfo.name,
          url: siteInfo.url
        }];
      }

      return [];
    } catch (error) {
      console.error('Failed to get WordPress site info:', error);
      return [];
    }
  }

  /**
   * Validate WordPress site
   */
  async validateSite(url: string): Promise<{valid: boolean, message: string}> {
    try {
      // Check if WordPress REST API is available
      const response = await fetch(`${url}/wp-json/wp/v2/`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: `WordPress site "${data.name}" is accessible`
        };
      }

      return {
        valid: false,
        message: 'WordPress REST API not available at this URL'
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Unable to connect to WordPress site'
      };
    }
  }
}
