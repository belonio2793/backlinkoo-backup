export interface GhostConfig {
  apiUrl: string;
  adminApiKey: string;
  contentApiKey?: string;
}

export interface GhostPostParams {
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

export interface GhostSubmissionResult {
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

export interface GhostUser {
  id: string;
  name: string;
  slug: string;
  email: string;
  profile_image: string;
  cover_image: string;
  bio: string;
  website: string;
  location: string;
  status: string;
  roles: Array<{name: string, description: string}>;
}

export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string;
  comment_id: string;
  feature_image: string;
  featured: boolean;
  visibility: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  custom_excerpt: string;
  codeinjection_head: string;
  codeinjection_foot: string;
  og_image: string;
  og_title: string;
  og_description: string;
  twitter_image: string;
  twitter_title: string;
  twitter_description: string;
  meta_title: string;
  meta_description: string;
  url: string;
  excerpt: string;
  reading_time: number;
  tags: Array<{id: string, name: string, slug: string}>;
  authors: Array<GhostUser>;
}

export class GhostService {
  private config: GhostConfig | null = null;
  private userCache: GhostUser | null = null;

  constructor(config?: GhostConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * Configure Ghost connection
   */
  public configure(config: GhostConfig): void {
    this.config = config;
    this.userCache = null; // Clear cache when config changes
  }

  /**
   * Test Ghost API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Ghost configuration not set');
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/ghost/api/admin/users/me/`, {
        headers: {
          'Authorization': `Ghost ${this.generateJWT()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Ghost connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<GhostUser | null> {
    if (!this.config) {
      throw new Error('Ghost configuration not set');
    }

    if (this.userCache) {
      return this.userCache;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/ghost/api/admin/users/me/`, {
        headers: {
          'Authorization': `Ghost ${this.generateJWT()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Ghost API error: ${response.statusText}`);
      }

      const data = await response.json();
      this.userCache = data.users[0];
      return this.userCache;

    } catch (error) {
      console.error('Failed to get Ghost user:', error);
      return null;
    }
  }

  /**
   * Publish content to Ghost
   */
  async publishContent(params: GhostPostParams): Promise<GhostSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Ghost configuration not set',
          retryable: false
        }
      };
    }

    try {
      // Get current user for author assignment
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          requiresModeration: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Unable to get Ghost user information',
            retryable: true
          }
        };
      }

      // Process content for Ghost
      const processedContent = this.optimizeContentForGhost(params.content, params.format);
      
      // Create or get tags
      const tagIds = await this.getOrCreateTags(params.tags);

      // Prepare post data
      const postData = {
        posts: [{
          title: params.title,
          html: processedContent,
          status: params.publishImmediately ? 'published' : 'draft',
          featured: false,
          page: false,
          meta_title: params.title,
          meta_description: params.metadata.description,
          custom_excerpt: params.metadata.description,
          canonical_url: params.canonicalUrl,
          tags: tagIds.map(id => ({id})),
          authors: [{id: user.id}],
          visibility: 'public'
        }]
      };

      // Submit post
      const response = await fetch(`${this.config.apiUrl}/ghost/api/admin/posts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Ghost ${this.generateJWT()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific Ghost errors
        if (response.status === 401) {
          return {
            success: false,
            requiresModeration: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Ghost Admin API key is invalid or expired',
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
              message: errorData.errors?.[0]?.message || 'Post validation failed',
              retryable: false
            }
          };
        }

        return {
          success: false,
          requiresModeration: false,
          error: {
            code: `GHOST_ERROR_${response.status}`,
            message: errorData.errors?.[0]?.message || `Ghost API error: ${response.statusText}`,
            retryable: response.status >= 500
          }
        };
      }

      const result = await response.json();
      const post = result.posts[0];
      
      return {
        success: true,
        placementUrl: post.url,
        submissionId: post.id,
        estimatedApprovalTime: params.publishImmediately ? 0 : 24, // 24 hours for draft review
        requiresModeration: !params.publishImmediately
      };

    } catch (error: any) {
      console.error('Ghost publishing error:', error);
      
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish to Ghost',
          retryable: true
        }
      };
    }
  }

  /**
   * Generate JWT token for Ghost Admin API
   */
  private generateJWT(): string {
    if (!this.config) {
      throw new Error('Ghost configuration not set');
    }

    // Parse the Admin API key
    const [id, secret] = this.config.adminApiKey.split(':');
    
    if (!id || !secret) {
      throw new Error('Invalid Ghost Admin API key format');
    }

    // Create JWT header and payload
    const header = {
      alg: 'HS256',
      typ: 'JWT',
      kid: id
    };

    const payload = {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
      aud: '/admin/'
    };

    // Simple JWT implementation (in production, use a proper JWT library)
    const base64Header = this.base64UrlEncode(JSON.stringify(header));
    const base64Payload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.createSignature(`${base64Header}.${base64Payload}`, secret);
    
    return `${base64Header}.${base64Payload}.${signature}`;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Create HMAC signature (simplified implementation)
   */
  private createSignature(data: string, secret: string): string {
    // This is a simplified implementation
    // In production, use crypto.createHmac or a proper JWT library
    const secretBytes = new TextEncoder().encode(secret);
    const dataBytes = new TextEncoder().encode(data);
    
    // Simple hash for demo - replace with proper HMAC-SHA256
    let hash = 0;
    for (let i = 0; i < dataBytes.length; i++) {
      hash = ((hash << 5) - hash + dataBytes[i]) & 0xffffffff;
    }
    
    return this.base64UrlEncode(hash.toString());
  }

  /**
   * Get or create tags
   */
  private async getOrCreateTags(tagNames: string[]): Promise<string[]> {
    if (!this.config) throw new Error('Configuration not set');

    const tagIds: string[] = [];

    for (const tagName of tagNames.slice(0, 5)) { // Limit to 5 tags
      try {
        // Search for existing tag
        const searchResponse = await fetch(
          `${this.config.apiUrl}/ghost/api/admin/tags/slug/${encodeURIComponent(tagName.toLowerCase().replace(/\s+/g, '-'))}/`,
          {
            headers: {
              'Authorization': `Ghost ${this.generateJWT()}`
            }
          }
        );

        if (searchResponse.ok) {
          const tagData = await searchResponse.json();
          if (tagData.tags && tagData.tags.length > 0) {
            tagIds.push(tagData.tags[0].id);
            continue;
          }
        }

        // Create new tag
        const createResponse = await fetch(`${this.config.apiUrl}/ghost/api/admin/tags/`, {
          method: 'POST',
          headers: {
            'Authorization': `Ghost ${this.generateJWT()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tags: [{
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            }]
          })
        });

        if (createResponse.ok) {
          const newTagData = await createResponse.json();
          if (newTagData.tags && newTagData.tags.length > 0) {
            tagIds.push(newTagData.tags[0].id);
          }
        }

      } catch (error) {
        console.warn(`Failed to create tag "${tagName}":`, error);
      }
    }

    return tagIds;
  }

  /**
   * Optimize content for Ghost platform
   */
  private optimizeContentForGhost(content: string, format: string): string {
    let optimized = content;

    if (format === 'markdown') {
      // Convert Markdown to HTML for Ghost
      optimized = this.convertMarkdownToHTML(content);
    }

    // Add Ghost specific optimizations
    optimized = this.addGhostOptimizations(optimized);

    return optimized;
  }

  /**
   * Convert Markdown to HTML (simple implementation)
   */
  private convertMarkdownToHTML(markdown: string): string {
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
   * Add Ghost specific optimizations
   */
  private addGhostOptimizations(html: string): string {
    let optimized = html;
    
    // Ensure proper HTML structure for Ghost editor
    optimized = optimized.replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
    
    // Add proper spacing
    optimized = optimized.replace(/<\/p>\s*<h/g, '</p>\n<h');
    optimized = optimized.replace(/<\/h([1-6])>\s*<p>/g, '</h$1>\n<p>');
    
    return optimized;
  }

  /**
   * Get user's posts
   */
  async getUserPosts(limit: number = 15, status: string = 'all'): Promise<GhostPost[]> {
    if (!this.config) {
      throw new Error('Ghost configuration not set');
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        include: 'tags,authors',
        ...(status !== 'all' && { filter: `status:${status}` })
      });

      const response = await fetch(`${this.config.apiUrl}/ghost/api/admin/posts/?${params}`, {
        headers: {
          'Authorization': `Ghost ${this.generateJWT()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Ghost API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.posts || [];

    } catch (error) {
      console.error('Failed to get Ghost posts:', error);
      return [];
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, updates: Partial<GhostPostParams>): Promise<GhostSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Ghost configuration not set',
          retryable: false
        }
      };
    }

    try {
      // Get current post data
      const currentPost = await this.getPost(postId);
      if (!currentPost) {
        return {
          success: false,
          requiresModeration: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: 'Post not found',
            retryable: false
          }
        };
      }

      const updateData: any = {
        posts: [{
          ...currentPost,
          updated_at: currentPost.updated_at // Required for updates
        }]
      };

      if (updates.title) updateData.posts[0].title = updates.title;
      if (updates.content) {
        updateData.posts[0].html = this.optimizeContentForGhost(updates.content, updates.format || 'html');
      }
      if (updates.tags) {
        const tagIds = await this.getOrCreateTags(updates.tags);
        updateData.posts[0].tags = tagIds.map(id => ({id}));
      }
      if (updates.canonicalUrl) updateData.posts[0].canonical_url = updates.canonicalUrl;
      if (updates.publishImmediately !== undefined) {
        updateData.posts[0].status = updates.publishImmediately ? 'published' : 'draft';
      }

      const response = await fetch(`${this.config.apiUrl}/ghost/api/admin/posts/${postId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Ghost ${this.generateJWT()}`,
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
            code: `GHOST_UPDATE_ERROR_${response.status}`,
            message: errorData.errors?.[0]?.message || `Failed to update post: ${response.statusText}`,
            retryable: response.status >= 500
          }
        };
      }

      const result = await response.json();
      const post = result.posts[0];
      
      return {
        success: true,
        placementUrl: post.url,
        submissionId: post.id,
        estimatedApprovalTime: 0,
        requiresModeration: false
      };

    } catch (error: any) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update Ghost post',
          retryable: true
        }
      };
    }
  }

  /**
   * Get a single post
   */
  private async getPost(postId: string): Promise<GhostPost | null> {
    if (!this.config) return null;

    try {
      const response = await fetch(`${this.config.apiUrl}/ghost/api/admin/posts/${postId}/`, {
        headers: {
          'Authorization': `Ghost ${this.generateJWT()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.posts[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to get Ghost post:', error);
      return null;
    }
  }

  /**
   * Validate Ghost configuration
   */
  async validateConfig(config: GhostConfig): Promise<{valid: boolean, message: string, user?: GhostUser}> {
    try {
      const tempConfig = this.config;
      this.config = config;

      const user = await this.getCurrentUser();
      
      this.config = tempConfig; // Restore original config

      if (user) {
        return {
          valid: true,
          message: `Configuration valid for user: ${user.name} (${user.email})`,
          user
        };
      }

      return {
        valid: false,
        message: 'Invalid Ghost configuration'
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Unable to connect to Ghost API'
      };
    }
  }
}
