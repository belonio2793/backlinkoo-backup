export interface MediumConfig {
  accessToken: string;
  userId?: string;
  publicationId?: string;
}

export interface MediumPostParams {
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

export interface MediumSubmissionResult {
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

export interface MediumUser {
  id: string;
  username: string;
  name: string;
  url: string;
  imageUrl: string;
}

export interface MediumPublication {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
}

export class MediumService {
  private readonly baseUrl = 'https://api.medium.com/v1';
  private config: MediumConfig | null = null;
  private userCache: MediumUser | null = null;

  constructor(config?: MediumConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * Configure Medium connection
   */
  public configure(config: MediumConfig): void {
    this.config = config;
    this.userCache = null; // Clear cache when config changes
  }

  /**
   * Test Medium API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Medium configuration not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Medium connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<MediumUser | null> {
    if (!this.config) {
      throw new Error('Medium configuration not set');
    }

    if (this.userCache) {
      return this.userCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Medium API error: ${response.statusText}`);
      }

      const data = await response.json();
      this.userCache = data.data;
      return this.userCache;

    } catch (error) {
      console.error('Failed to get Medium user:', error);
      return null;
    }
  }

  /**
   * Get user's publications
   */
  async getUserPublications(): Promise<MediumPublication[]> {
    const user = await this.getCurrentUser();
    if (!user) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${user.id}/publications`, {
        headers: {
          'Authorization': `Bearer ${this.config!.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Medium API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('Failed to get Medium publications:', error);
      return [];
    }
  }

  /**
   * Publish content to Medium
   */
  async publishContent(params: MediumPostParams): Promise<MediumSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Medium configuration not set',
          retryable: false
        }
      };
    }

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          requiresModeration: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Unable to get Medium user information',
            retryable: true
          }
        };
      }

      // Determine target (user or publication)
      const targetId = this.config.publicationId || user.id;
      const isPublication = !!this.config.publicationId;
      
      // Process content format
      const contentFormat = params.format === 'markdown' ? 'markdown' : 'html';
      const processedContent = this.optimizeContentForMedium(params.content, params.format);

      // Prepare post data
      const postData = {
        title: params.title,
        contentFormat: contentFormat,
        content: processedContent,
        tags: params.tags.slice(0, 5), // Medium allows max 5 tags
        publishStatus: params.publishImmediately ? 'public' : 'draft',
        notifyFollowers: false, // Conservative approach
        license: 'all-rights-reserved',
        canonicalUrl: params.canonicalUrl
      };

      // Submit post
      const endpoint = isPublication 
        ? `${this.baseUrl}/publications/${targetId}/posts`
        : `${this.baseUrl}/users/${targetId}/posts`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific Medium errors
        if (response.status === 429) {
          return {
            success: false,
            requiresModeration: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Medium API rate limit exceeded',
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
              message: 'Medium access token is invalid or expired',
              retryable: false
            }
          };
        }

        return {
          success: false,
          requiresModeration: false,
          error: {
            code: `MEDIUM_ERROR_${response.status}`,
            message: errorData.errors?.[0]?.message || `Medium API error: ${response.statusText}`,
            retryable: response.status >= 500
          }
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        placementUrl: result.data.url,
        submissionId: result.data.id,
        estimatedApprovalTime: params.publishImmediately ? 0 : 24, // 24 hours for draft review
        requiresModeration: !params.publishImmediately || isPublication
      };

    } catch (error: any) {
      console.error('Medium publishing error:', error);
      
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish to Medium',
          retryable: true
        }
      };
    }
  }

  /**
   * Optimize content for Medium platform
   */
  private optimizeContentForMedium(content: string, format: string): string {
    let optimized = content;

    if (format === 'html') {
      // Convert HTML to Medium-friendly format
      optimized = this.convertHTMLForMedium(content);
    } else {
      // Optimize Markdown for Medium
      optimized = this.optimizeMarkdownForMedium(content);
    }

    return optimized;
  }

  /**
   * Convert HTML to Medium-friendly format
   */
  private convertHTMLForMedium(html: string): string {
    let medium = html;
    
    // Medium prefers clean HTML without excessive styling
    medium = medium.replace(/<div[^>]*>/g, '<p>');
    medium = medium.replace(/<\/div>/g, '</p>');
    
    // Ensure proper paragraph structure
    medium = medium.replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
    
    // Convert code blocks to Medium format
    medium = medium.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```');
    
    // Ensure proper heading hierarchy
    medium = medium.replace(/<h1[^>]*>/g, '# ');
    medium = medium.replace(/<\/h1>/g, '');
    medium = medium.replace(/<h2[^>]*>/g, '## ');
    medium = medium.replace(/<\/h2>/g, '');
    medium = medium.replace(/<h3[^>]*>/g, '### ');
    medium = medium.replace(/<\/h3>/g, '');
    
    return medium;
  }

  /**
   * Optimize Markdown for Medium
   */
  private optimizeMarkdownForMedium(markdown: string): string {
    let optimized = markdown;
    
    // Ensure proper heading hierarchy (Medium starts with ##)
    optimized = optimized.replace(/^# /gm, '## ');
    
    // Add subtitle formatting
    if (!optimized.includes('##')) {
      const lines = optimized.split('\n');
      if (lines.length > 1) {
        lines.splice(1, 0, `## ${lines[0].substring(0, 60)}...`);
        optimized = lines.join('\n');
      }
    }
    
    // Ensure proper code block formatting
    optimized = optimized.replace(/```(\w+)?\n/g, '```\n');
    
    // Add proper spacing around elements
    optimized = optimized.replace(/^(#{2,})/gm, '\n$1');
    optimized = optimized.replace(/^```/gm, '\n```');
    
    return optimized.trim();
  }

  /**
   * Get publication contributors (if using publication)
   */
  async getPublicationContributors(publicationId: string): Promise<any[]> {
    if (!this.config) {
      throw new Error('Medium configuration not set');
    }

    try {
      const response = await fetch(`${this.baseUrl}/publications/${publicationId}/contributors`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Medium API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('Failed to get publication contributors:', error);
      return [];
    }
  }

  /**
   * Validate Medium access token
   */
  async validateToken(token: string): Promise<{valid: boolean, message: string, user?: MediumUser}> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          valid: true,
          message: `Token valid for user: ${data.data.name}`,
          user: data.data
        };
      }

      if (response.status === 401) {
        return {
          valid: false,
          message: 'Invalid or expired access token'
        };
      }

      return {
        valid: false,
        message: `Medium API error: ${response.statusText}`
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Unable to connect to Medium API'
      };
    }
  }

  /**
   * Get OAuth authorization URL
   */
  static getAuthorizationUrl(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'basicProfile,publishPost',
      ...(state && { state })
    });

    return `https://medium.com/m/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string
  ): Promise<{success: boolean, accessToken?: string, error?: string}> {
    try {
      const response = await fetch('https://api.medium.com/v1/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          accessToken: data.access_token
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error_description || 'Failed to exchange code for token'
      };

    } catch (error) {
      return {
        success: false,
        error: 'Network error during token exchange'
      };
    }
  }
}
