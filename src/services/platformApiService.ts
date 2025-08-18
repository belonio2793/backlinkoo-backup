export interface PlatformConfig {
  name: string;
  apiType: 'rest' | 'graphql' | 'cloud-storage';
  authType: 'oauth2' | 'api-key' | 'jwt' | 'oauth1';
  baseUrl: string;
  endpoints: {
    auth?: string;
    create: string;
    upload?: string;
    share?: string;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay?: number;
    postsPerDay?: number;
  };
  requiredScopes?: string[];
  isActive: boolean;
}

export interface PostingRequest {
  platform: string;
  contentType: 'blog-post' | 'document' | 'social-post' | 'forum-post';
  title: string;
  content: string;
  targetUrl: string;
  anchorText: string;
  tags?: string[];
  publishImmediately?: boolean;
  credentials: PlatformCredentials;
}

export interface PlatformCredentials {
  // OAuth 2.0
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  
  // API Key
  apiKey?: string;
  username?: string;
  
  // JWT (Ghost)
  integrationId?: string;
  integrationSecret?: string;
  
  // OAuth 1.0a (Tumblr)
  consumerKey?: string;
  consumerSecret?: string;
  oauthToken?: string;
  oauthTokenSecret?: string;
  
  // Platform specific
  blogIdentifier?: string; // Tumblr
  publicationId?: string; // Hashnode
  siteUrl?: string; // WordPress, Ghost
}

export interface PostingResult {
  success: boolean;
  platformName: string;
  postId?: string;
  postUrl?: string;
  shareUrl?: string;
  downloadUrl?: string;
  embedUrl?: string;
  publishedAt?: string;
  error?: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: string;
  };
}

class PlatformApiService {
  private platforms: Map<string, PlatformConfig>;

  constructor() {
    this.platforms = new Map([
      // Cloud Storage Platforms
      ['google-drive', {
        name: 'Google Drive',
        apiType: 'cloud-storage',
        authType: 'oauth2',
        baseUrl: 'https://www.googleapis.com',
        endpoints: {
          auth: 'https://accounts.google.com/o/oauth2/auth',
          create: '/upload/drive/v3/files',
          share: '/drive/v3/files/{fileId}/permissions'
        },
        rateLimits: { requestsPerMinute: 6000 },
        requiredScopes: ['https://www.googleapis.com/auth/drive.file'],
        isActive: true
      }],
      
      ['dropbox', {
        name: 'Dropbox',
        apiType: 'cloud-storage',
        authType: 'oauth2',
        baseUrl: 'https://api.dropboxapi.com',
        endpoints: {
          auth: 'https://www.dropbox.com/oauth2/authorize',
          upload: 'https://content.dropboxapi.com/2/files/upload',
          share: '/2/sharing/create_shared_link_with_settings'
        },
        rateLimits: { requestsPerMinute: 120 },
        isActive: true
      }],
      
      ['onedrive', {
        name: 'OneDrive',
        apiType: 'cloud-storage',
        authType: 'oauth2',
        baseUrl: 'https://graph.microsoft.com',
        endpoints: {
          auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
          upload: '/v1.0/me/drive/root:/{filename}:/content',
          share: '/v1.0/me/drive/items/{itemId}/createLink'
        },
        rateLimits: { requestsPerMinute: 600 },
        requiredScopes: ['Files.ReadWrite'],
        isActive: true
      }],
      
      ['box', {
        name: 'Box',
        apiType: 'cloud-storage',
        authType: 'oauth2',
        baseUrl: 'https://api.box.com',
        endpoints: {
          auth: 'https://account.box.com/api/oauth2/authorize',
          upload: 'https://upload.box.com/api/2.0/files/content',
          share: '/2.0/files/{fileId}'
        },
        rateLimits: { requestsPerMinute: 1000 },
        isActive: true
      }],
      
      // Blogging Platforms
      ['dev.to', {
        name: 'Dev.to',
        apiType: 'rest',
        authType: 'api-key',
        baseUrl: 'https://dev.to/api',
        endpoints: {
          create: '/articles'
        },
        rateLimits: { requestsPerMinute: 60 },
        isActive: true
      }],
      
      ['hashnode', {
        name: 'Hashnode',
        apiType: 'graphql',
        authType: 'api-key',
        baseUrl: 'https://gql.hashnode.com',
        endpoints: {
          create: '/'
        },
        rateLimits: { requestsPerMinute: 60 },
        isActive: true
      }],
      
      ['wordpress', {
        name: 'WordPress.com',
        apiType: 'rest',
        authType: 'oauth2',
        baseUrl: 'https://public-api.wordpress.com',
        endpoints: {
          auth: 'https://public-api.wordpress.com/oauth2/authorize',
          create: '/rest/v1.1/sites/{siteId}/posts/new'
        },
        rateLimits: { requestsPerMinute: 150 },
        requiredScopes: ['posts'],
        isActive: true
      }],
      
      ['ghost', {
        name: 'Ghost CMS',
        apiType: 'rest',
        authType: 'jwt',
        baseUrl: '{siteUrl}/ghost/api/admin',
        endpoints: {
          create: '/posts/'
        },
        rateLimits: { requestsPerMinute: 300 },
        isActive: true
      }],
      
      // Social Platforms
      ['tumblr', {
        name: 'Tumblr',
        apiType: 'rest',
        authType: 'oauth1',
        baseUrl: 'https://api.tumblr.com',
        endpoints: {
          create: '/v2/blog/{blogIdentifier}/post'
        },
        rateLimits: { requestsPerMinute: 16, requestsPerDay: 1000, postsPerDay: 250 },
        isActive: true
      }],
      
      // Forum Platforms
      ['discourse', {
        name: 'Discourse',
        apiType: 'rest',
        authType: 'api-key',
        baseUrl: '{siteUrl}',
        endpoints: {
          create: '/posts.json'
        },
        rateLimits: { requestsPerMinute: 60 },
        isActive: true
      }]
    ]);
  }

  // Post content to a specific platform
  async postToPlatform(request: PostingRequest): Promise<PostingResult> {
    const platform = this.platforms.get(request.platform);
    if (!platform) {
      return {
        success: false,
        platformName: request.platform,
        error: `Platform ${request.platform} not found`
      };
    }

    if (!platform.isActive) {
      return {
        success: false,
        platformName: platform.name,
        error: `Platform ${platform.name} is not active`
      };
    }

    try {
      switch (platform.apiType) {
        case 'cloud-storage':
          return await this.postToCloudStorage(platform, request);
        case 'rest':
          return await this.postToRestApi(platform, request);
        case 'graphql':
          return await this.postToGraphQL(platform, request);
        default:
          throw new Error(`Unsupported API type: ${platform.apiType}`);
      }
    } catch (error) {
      console.error(`Error posting to ${platform.name}:`, error);
      return {
        success: false,
        platformName: platform.name,
        error: error.message
      };
    }
  }

  // Post to cloud storage platforms
  private async postToCloudStorage(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    switch (request.platform) {
      case 'google-drive':
        return await this.postToGoogleDrive(platform, request);
      case 'dropbox':
        return await this.postToDropbox(platform, request);
      case 'onedrive':
        return await this.postToOneDrive(platform, request);
      case 'box':
        return await this.postToBox(platform, request);
      default:
        throw new Error(`Cloud storage platform ${request.platform} not implemented`);
    }
  }

  // Google Drive implementation
  private async postToGoogleDrive(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    const formData = new FormData();
    
    // Create HTML document
    const htmlContent = this.generateHtmlDocument(request.title, request.content, request.targetUrl, request.anchorText);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    const metadata = {
      name: `${request.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`,
      description: `Document about ${request.title}`,
      parents: ['root'] // Upload to root folder
    };
    
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const response = await fetch(`${platform.baseUrl}${platform.endpoints.create}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Make file public
    await fetch(`${platform.baseUrl}/drive/v3/files/${result.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });

    return {
      success: true,
      platformName: platform.name,
      postId: result.id,
      postUrl: `https://drive.google.com/file/d/${result.id}/view`,
      shareUrl: `https://drive.google.com/file/d/${result.id}/view?usp=sharing`,
      downloadUrl: `https://drive.google.com/uc?id=${result.id}&export=download`,
      publishedAt: new Date().toISOString()
    };
  }

  // Dropbox implementation
  private async postToDropbox(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    const htmlContent = this.generateHtmlDocument(request.title, request.content, request.targetUrl, request.anchorText);
    const filename = `${request.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    
    // Upload file
    const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: `/${filename}`,
          mode: 'add',
          autorename: true
        })
      },
      body: htmlContent
    });

    if (!uploadResponse.ok) {
      throw new Error(`Dropbox upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();

    // Create sharing link
    const shareResponse = await fetch(`${platform.baseUrl}/2/sharing/create_shared_link_with_settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: uploadResult.path_lower,
        settings: {
          requested_visibility: 'public'
        }
      })
    });

    const shareResult = shareResponse.ok ? await shareResponse.json() : null;
    const shareUrl = shareResult?.url || '';

    return {
      success: true,
      platformName: platform.name,
      postId: uploadResult.id,
      postUrl: shareUrl,
      shareUrl: shareUrl,
      downloadUrl: shareUrl?.replace('?dl=0', '?dl=1') || '',
      publishedAt: new Date().toISOString()
    };
  }

  // OneDrive implementation
  private async postToOneDrive(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    const htmlContent = this.generateHtmlDocument(request.title, request.content, request.targetUrl, request.anchorText);
    const filename = `${request.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    
    // Upload file
    const uploadResponse = await fetch(`${platform.baseUrl}/v1.0/me/drive/root:/${filename}:/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`,
        'Content-Type': 'text/html'
      },
      body: htmlContent
    });

    if (!uploadResponse.ok) {
      throw new Error(`OneDrive upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();

    // Create sharing link
    const shareResponse = await fetch(`${platform.baseUrl}/v1.0/me/drive/items/${uploadResult.id}/createLink`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'view',
        scope: 'anonymous'
      })
    });

    const shareResult = shareResponse.ok ? await shareResponse.json() : null;
    const shareUrl = shareResult?.link?.webUrl || uploadResult.webUrl;

    return {
      success: true,
      platformName: platform.name,
      postId: uploadResult.id,
      postUrl: shareUrl,
      shareUrl: shareUrl,
      downloadUrl: uploadResult['@microsoft.graph.downloadUrl'] || '',
      publishedAt: new Date().toISOString()
    };
  }

  // Box implementation
  private async postToBox(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    const htmlContent = this.generateHtmlDocument(request.title, request.content, request.targetUrl, request.anchorText);
    const filename = `${request.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    
    const formData = new FormData();
    const attributes = {
      name: filename,
      parent: { id: '0' } // Root folder
    };

    formData.append('attributes', JSON.stringify(attributes));
    formData.append('file', new Blob([htmlContent], { type: 'text/html' }));

    const uploadResponse = await fetch('https://upload.box.com/api/2.0/files/content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error(`Box upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    const fileId = uploadResult.entries[0].id;

    // Create shared link
    const shareResponse = await fetch(`${platform.baseUrl}/2.0/files/${fileId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${request.credentials.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shared_link: {
          access: 'open',
          permissions: {
            can_download: true,
            can_preview: true
          }
        }
      })
    });

    const shareResult = shareResponse.ok ? await shareResponse.json() : null;
    const shareUrl = shareResult?.shared_link?.url || '';

    return {
      success: true,
      platformName: platform.name,
      postId: fileId,
      postUrl: shareUrl,
      shareUrl: shareUrl,
      downloadUrl: shareUrl,
      publishedAt: new Date().toISOString()
    };
  }

  // Post to REST APIs
  private async postToRestApi(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    switch (request.platform) {
      case 'dev.to':
        return await this.postToDevTo(platform, request);
      case 'wordpress':
        return await this.postToWordPress(platform, request);
      case 'ghost':
        return await this.postToGhost(platform, request);
      case 'tumblr':
        return await this.postToTumblr(platform, request);
      case 'discourse':
        return await this.postToDiscourse(platform, request);
      default:
        throw new Error(`REST platform ${request.platform} not implemented`);
    }
  }

  // Dev.to implementation
  private async postToDevTo(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    const articleData = {
      article: {
        title: request.title,
        body_markdown: this.convertToMarkdown(request.content, request.targetUrl, request.anchorText),
        published: request.publishImmediately || false,
        tags: request.tags || [],
        description: `Learn about ${request.title}`
      }
    };

    const response = await fetch(`${platform.baseUrl}${platform.endpoints.create}`, {
      method: 'POST',
      headers: {
        'api-key': request.credentials.apiKey!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(articleData)
    });

    if (!response.ok) {
      throw new Error(`Dev.to posting failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      platformName: platform.name,
      postId: result.id.toString(),
      postUrl: result.url,
      shareUrl: result.url,
      publishedAt: result.published_at
    };
  }

  // GraphQL implementation for Hashnode
  private async postToGraphQL(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    if (request.platform === 'hashnode') {
      return await this.postToHashnode(platform, request);
    }
    throw new Error(`GraphQL platform ${request.platform} not implemented`);
  }

  // Hashnode implementation
  private async postToHashnode(platform: PlatformConfig, request: PostingRequest): Promise<PostingResult> {
    const mutation = `
      mutation CreatePublishPost($input: CreatePostInput!) {
        createPublishPost(input: $input) {
          post {
            id
            title
            slug
            url
          }
        }
      }
    `;

    const variables = {
      input: {
        title: request.title,
        contentMarkdown: this.convertToMarkdown(request.content, request.targetUrl, request.anchorText),
        publicationId: request.credentials.publicationId!,
        tags: request.tags || []
      }
    };

    const response = await fetch(platform.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.credentials.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: mutation,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`Hashnode posting failed: ${response.statusText}`);
    }

    const result = await response.json();
    const post = result.data.createPublishPost.post;

    return {
      success: true,
      platformName: platform.name,
      postId: post.id,
      postUrl: post.url,
      shareUrl: post.url,
      publishedAt: new Date().toISOString()
    };
  }

  // Helper methods
  private generateHtmlDocument(title: string, content: string, targetUrl: string, anchorText: string): string {
    // Embed backlink naturally in content
    const contentWithBacklink = content.includes(targetUrl) 
      ? content 
      : content + `\n\n<p>For more information, visit <a href="${targetUrl}">${anchorText}</a></p>`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        p { margin-bottom: 15px; }
        a { color: #007acc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${contentWithBacklink}
</body>
</html>
    `.trim();
  }

  private convertToMarkdown(content: string, targetUrl: string, anchorText: string): string {
    // Convert HTML to markdown and embed backlink
    let markdown = content
      .replace(/<h2>/g, '## ')
      .replace(/<\/h2>/g, '')
      .replace(/<h3>/g, '### ')
      .replace(/<\/h3>/g, '')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<strong>/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<em>/g, '*')
      .replace(/<\/em>/g, '*');

    // Add backlink if not present
    if (!markdown.includes(targetUrl)) {
      markdown += `\n\nFor more information, check out [${anchorText}](${targetUrl}).`;
    }

    return markdown.trim();
  }

  // Get platform configuration
  getPlatformConfig(platformName: string): PlatformConfig | undefined {
    return this.platforms.get(platformName);
  }

  // Get all active platforms
  getActivePlatforms(): PlatformConfig[] {
    return Array.from(this.platforms.values()).filter(p => p.isActive);
  }

  // Validate credentials for a platform
  async validateCredentials(platformName: string, credentials: PlatformCredentials): Promise<boolean> {
    const platform = this.platforms.get(platformName);
    if (!platform) return false;

    try {
      switch (platformName) {
        case 'google-drive':
          const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
          });
          return response.ok;
        
        case 'dropbox':
          const dbResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
          });
          return dbResponse.ok;
        
        case 'dev.to':
          const devResponse = await fetch('https://dev.to/api/users/me', {
            headers: { 'api-key': credentials.apiKey! }
          });
          return devResponse.ok;
        
        default:
          return true; // Assume valid for non-implemented validations
      }
    } catch (error) {
      console.error(`Credential validation failed for ${platformName}:`, error);
      return false;
    }
  }
}

export const platformApiService = new PlatformApiService();
export default platformApiService;
