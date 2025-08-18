export interface HashnodeConfig {
  accessToken: string;
  publicationId?: string;
  hostname?: string;
}

export interface HashnodePostParams {
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

export interface HashnodeSubmissionResult {
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

export interface HashnodeUser {
  id: string;
  username: string;
  name: string;
  bio: string;
  profilePicture: string;
  location: string;
  website: string;
}

export interface HashnodePublication {
  id: string;
  title: string;
  displayTitle: string;
  url: string;
  metaTags: string;
  favicon: string;
  isTeam: boolean;
  author: HashnodeUser;
}

export interface HashnodePost {
  id: string;
  title: string;
  slug: string;
  url: string;
  publishedAt: string;
  updatedAt: string;
  tags: Array<{name: string, slug: string}>;
  brief: string;
  readTimeInMinutes: number;
}

export class HashnodeService {
  private readonly baseUrl = 'https://gql.hashnode.com';
  private config: HashnodeConfig | null = null;
  private userCache: HashnodeUser | null = null;

  constructor(config?: HashnodeConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * Configure Hashnode connection
   */
  public configure(config: HashnodeConfig): void {
    this.config = config;
    this.userCache = null; // Clear cache when config changes
  }

  /**
   * Test Hashnode API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Hashnode configuration not set');
    }

    try {
      const query = `
        query {
          me {
            id
            username
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);
      return !!response?.data?.me;

    } catch (error) {
      console.error('Hashnode connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<HashnodeUser | null> {
    if (!this.config) {
      throw new Error('Hashnode configuration not set');
    }

    if (this.userCache) {
      return this.userCache;
    }

    try {
      const query = `
        query {
          me {
            id
            username
            name
            bio {
              markdown
            }
            profilePicture
            location
            socialMediaLinks {
              website
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);
      
      if (response?.data?.me) {
        this.userCache = {
          id: response.data.me.id,
          username: response.data.me.username,
          name: response.data.me.name,
          bio: response.data.me.bio?.markdown || '',
          profilePicture: response.data.me.profilePicture,
          location: response.data.me.location || '',
          website: response.data.me.socialMediaLinks?.website || ''
        };
        return this.userCache;
      }

      return null;

    } catch (error) {
      console.error('Failed to get Hashnode user:', error);
      return null;
    }
  }

  /**
   * Get user's publications
   */
  async getUserPublications(): Promise<HashnodePublication[]> {
    const user = await this.getCurrentUser();
    if (!user) {
      return [];
    }

    try {
      const query = `
        query {
          me {
            publications(first: 10) {
              edges {
                node {
                  id
                  title
                  displayTitle
                  url
                  metaTags
                  favicon
                  isTeam
                  author {
                    id
                    username
                    name
                  }
                }
              }
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);
      
      if (response?.data?.me?.publications?.edges) {
        return response.data.me.publications.edges.map((edge: any) => edge.node);
      }

      return [];

    } catch (error) {
      console.error('Failed to get Hashnode publications:', error);
      return [];
    }
  }

  /**
   * Publish content to Hashnode
   */
  async publishContent(params: HashnodePostParams): Promise<HashnodeSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Hashnode configuration not set',
          retryable: false
        }
      };
    }

    try {
      // Get publication ID if not provided
      let publicationId = this.config.publicationId;
      
      if (!publicationId) {
        const publications = await this.getUserPublications();
        if (publications.length > 0) {
          publicationId = publications[0].id;
        } else {
          return {
            success: false,
            requiresModeration: false,
            error: {
              code: 'NO_PUBLICATION',
              message: 'No publication found. Please create a publication first.',
              retryable: false
            }
          };
        }
      }

      // Process content for Hashnode
      const processedContent = this.optimizeContentForHashnode(params.content, params.format);
      
      // Create tags array
      const tagsInput = params.tags.slice(0, 5).map(tag => ({
        name: tag.toLowerCase().replace(/\s+/g, ''),
        slug: tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));

      // Prepare mutation
      const mutation = `
        mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) {
            post {
              id
              title
              slug
              url
              publishedAt
              tags {
                name
                slug
              }
            }
          }
        }
      `;

      const variables = {
        input: {
          title: params.title,
          contentMarkdown: processedContent,
          tags: tagsInput,
          publicationId: publicationId,
          ...(params.canonicalUrl && { canonicalUrl: params.canonicalUrl }),
          ...(params.metadata.description && { subtitle: params.metadata.description }),
          publishedAt: params.publishImmediately ? new Date().toISOString() : null,
          publishAs: params.publishImmediately ? 'PUBLISHED' : 'DRAFT'
        }
      };

      const response = await this.executeGraphQLQuery(mutation, variables);

      if (response?.errors) {
        const errorMessage = response.errors.map((e: any) => e.message).join(', ');
        
        return {
          success: false,
          requiresModeration: false,
          error: {
            code: 'GRAPHQL_ERROR',
            message: errorMessage,
            retryable: !errorMessage.includes('authentication') && !errorMessage.includes('authorization')
          }
        };
      }

      if (response?.data?.publishPost?.post) {
        const post = response.data.publishPost.post;
        
        return {
          success: true,
          placementUrl: post.url,
          submissionId: post.id,
          estimatedApprovalTime: params.publishImmediately ? 0 : 24,
          requiresModeration: !params.publishImmediately
        };
      }

      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to publish post - no data returned',
          retryable: true
        }
      };

    } catch (error: any) {
      console.error('Hashnode publishing error:', error);
      
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'PUBLISH_ERROR',
          message: error.message || 'Failed to publish to Hashnode',
          retryable: true
        }
      };
    }
  }

  /**
   * Execute GraphQL query
   */
  private async executeGraphQLQuery(query: string, variables?: any): Promise<any> {
    if (!this.config) {
      throw new Error('Hashnode configuration not set');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.accessToken
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`Hashnode API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Optimize content for Hashnode platform
   */
  private optimizeContentForHashnode(content: string, format: string): string {
    let optimized = content;

    if (format === 'html') {
      // Convert HTML to Markdown for Hashnode
      optimized = this.convertHTMLToMarkdown(content);
    }

    // Add Hashnode specific optimizations
    optimized = this.addHashnodeOptimizations(optimized);

    return optimized;
  }

  /**
   * Convert HTML to Markdown (similar to Dev.to but with Hashnode specifics)
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
   * Add Hashnode specific optimizations
   */
  private addHashnodeOptimizations(markdown: string): string {
    let optimized = markdown;
    
    // Ensure proper heading hierarchy
    optimized = optimized.replace(/^# /gm, '## '); // Hashnode prefers starting with h2
    
    // Add proper spacing around elements
    optimized = optimized.replace(/^(#{2,})/gm, '\n$1');
    optimized = optimized.replace(/^```/gm, '\n```');
    optimized = optimized.replace(/^>/gm, '\n>'); // Blockquotes
    
    // Add call-to-action if missing
    if (!optimized.includes('What do you think') && !optimized.includes('Share your thoughts')) {
      optimized += '\n\n---\n\nWhat are your thoughts on this? Share your experience in the comments below!';
    }
    
    return optimized.trim();
  }

  /**
   * Get user's posts
   */
  async getUserPosts(first: number = 10): Promise<HashnodePost[]> {
    if (!this.config) {
      throw new Error('Hashnode configuration not set');
    }

    try {
      const query = `
        query {
          me {
            posts(first: ${first}) {
              edges {
                node {
                  id
                  title
                  slug
                  url
                  publishedAt
                  updatedAt
                  tags {
                    name
                    slug
                  }
                  brief
                  readTimeInMinutes
                }
              }
            }
          }
        }
      `;

      const response = await this.executeGraphQLQuery(query);
      
      if (response?.data?.me?.posts?.edges) {
        return response.data.me.posts.edges.map((edge: any) => edge.node);
      }

      return [];

    } catch (error) {
      console.error('Failed to get Hashnode posts:', error);
      return [];
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: string, updates: Partial<HashnodePostParams>): Promise<HashnodeSubmissionResult> {
    if (!this.config) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'CONFIG_MISSING',
          message: 'Hashnode configuration not set',
          retryable: false
        }
      };
    }

    try {
      const mutation = `
        mutation UpdatePost($input: UpdatePostInput!) {
          updatePost(input: $input) {
            post {
              id
              title
              slug
              url
              updatedAt
            }
          }
        }
      `;

      const updateInput: any = { id: postId };

      if (updates.title) updateInput.title = updates.title;
      if (updates.content) {
        updateInput.contentMarkdown = this.optimizeContentForHashnode(updates.content, updates.format || 'markdown');
      }
      if (updates.tags) {
        updateInput.tags = updates.tags.slice(0, 5).map(tag => ({
          name: tag.toLowerCase().replace(/\s+/g, ''),
          slug: tag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        }));
      }
      if (updates.canonicalUrl) updateInput.canonicalUrl = updates.canonicalUrl;

      const variables = { input: updateInput };

      const response = await this.executeGraphQLQuery(mutation, variables);

      if (response?.errors) {
        const errorMessage = response.errors.map((e: any) => e.message).join(', ');
        
        return {
          success: false,
          requiresModeration: false,
          error: {
            code: 'UPDATE_ERROR',
            message: errorMessage,
            retryable: true
          }
        };
      }

      if (response?.data?.updatePost?.post) {
        const post = response.data.updatePost.post;
        
        return {
          success: true,
          placementUrl: post.url,
          submissionId: post.id,
          estimatedApprovalTime: 0,
          requiresModeration: false
        };
      }

      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to update post - no data returned',
          retryable: true
        }
      };

    } catch (error: any) {
      return {
        success: false,
        requiresModeration: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to update Hashnode post',
          retryable: true
        }
      };
    }
  }

  /**
   * Validate Hashnode access token
   */
  async validateToken(token: string): Promise<{valid: boolean, message: string, user?: HashnodeUser}> {
    try {
      const tempConfig = { ...this.config, accessToken: token };
      const originalConfig = this.config;
      this.config = tempConfig;

      const user = await this.getCurrentUser();
      
      this.config = originalConfig; // Restore original config

      if (user) {
        return {
          valid: true,
          message: `Token valid for user: ${user.name} (@${user.username})`,
          user
        };
      }

      return {
        valid: false,
        message: 'Invalid access token'
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Unable to connect to Hashnode API'
      };
    }
  }

  /**
   * Search posts by tag
   */
  async searchPostsByTag(tag: string, first: number = 10): Promise<HashnodePost[]> {
    try {
      const query = `
        query SearchPosts($tag: String!, $first: Int!) {
          feed(tag: $tag, first: $first) {
            edges {
              node {
                id
                title
                slug
                url
                publishedAt
                updatedAt
                tags {
                  name
                  slug
                }
                brief
                readTimeInMinutes
              }
            }
          }
        }
      `;

      const variables = { tag, first };
      const response = await this.executeGraphQLQuery(query, variables);
      
      if (response?.data?.feed?.edges) {
        return response.data.feed.edges.map((edge: any) => edge.node);
      }

      return [];

    } catch (error) {
      console.error('Failed to search Hashnode posts:', error);
      return [];
    }
  }
}
