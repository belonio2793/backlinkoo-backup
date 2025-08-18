import type { GeneratedDocument } from './documentGenerationService';

export interface CloudStorageConfig {
  provider: CloudProvider;
  credentials: CloudCredentials;
  uploadOptions?: UploadOptions;
}

export type CloudProvider = 'google-drive' | 'dropbox' | 'onedrive' | 'box' | 'mega';

export interface CloudCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  // Mega specific
  email?: string;
  password?: string;
}

export interface UploadOptions {
  folder?: string;
  makePublic?: boolean;
  description?: string;
  tags?: string[];
  sharePermissions?: 'view' | 'edit' | 'comment';
}

export interface UploadResult {
  success: boolean;
  fileId: string;
  fileName: string;
  publicUrl?: string;
  shareUrl?: string;
  webViewUrl?: string;
  downloadUrl?: string;
  provider: CloudProvider;
  uploadedAt: string;
  fileSize: number;
  error?: string;
}

export interface CloudProviderInfo {
  name: string;
  provider: CloudProvider;
  domainRating: number;
  features: {
    publicSharing: boolean;
    directLinks: boolean;
    embedding: boolean;
    apiAvailable: boolean;
  };
  linkFormats: {
    share: string;
    embed: string;
    download: string;
  };
  rateLimits: {
    requestsPerMinute: number;
    uploadSizeLimit: string;
  };
  seoValue: 'high' | 'medium' | 'low';
}

class CloudStorageService {
  private providers: Map<CloudProvider, CloudProviderInfo>;

  constructor() {
    this.providers = new Map([
      ['google-drive', {
        name: 'Google Drive',
        provider: 'google-drive',
        domainRating: 100,
        features: {
          publicSharing: true,
          directLinks: true,
          embedding: true,
          apiAvailable: true
        },
        linkFormats: {
          share: 'https://drive.google.com/file/d/{fileId}/view?usp=sharing',
          embed: 'https://drive.google.com/file/d/{fileId}/preview',
          download: 'https://drive.google.com/uc?id={fileId}&export=download'
        },
        rateLimits: {
          requestsPerMinute: 100,
          uploadSizeLimit: '5TB'
        },
        seoValue: 'high'
      }],
      ['dropbox', {
        name: 'Dropbox',
        provider: 'dropbox',
        domainRating: 94,
        features: {
          publicSharing: true,
          directLinks: true,
          embedding: true,
          apiAvailable: true
        },
        linkFormats: {
          share: 'https://www.dropbox.com/s/{shareId}/{filename}?dl=0',
          embed: 'https://www.dropbox.com/s/{shareId}/{filename}?dl=0&raw=1',
          download: 'https://www.dropbox.com/s/{shareId}/{filename}?dl=1'
        },
        rateLimits: {
          requestsPerMinute: 120,
          uploadSizeLimit: '350GB'
        },
        seoValue: 'high'
      }],
      ['onedrive', {
        name: 'Microsoft OneDrive',
        provider: 'onedrive',
        domainRating: 96,
        features: {
          publicSharing: true,
          directLinks: true,
          embedding: true,
          apiAvailable: true
        },
        linkFormats: {
          share: 'https://1drv.ms/b/{shareId}',
          embed: 'https://onedrive.live.com/embed?cid={cid}&resid={resId}',
          download: 'https://1drv.ms/b/{shareId}?download=1'
        },
        rateLimits: {
          requestsPerMinute: 60,
          uploadSizeLimit: '250GB'
        },
        seoValue: 'high'
      }],
      ['box', {
        name: 'Box',
        provider: 'box',
        domainRating: 88,
        features: {
          publicSharing: true,
          directLinks: true,
          embedding: true,
          apiAvailable: true
        },
        linkFormats: {
          share: 'https://app.box.com/s/{shareId}',
          embed: 'https://app.box.com/embed/s/{shareId}',
          download: 'https://app.box.com/shared/static/{shareId}'
        },
        rateLimits: {
          requestsPerMinute: 60,
          uploadSizeLimit: '5GB'
        },
        seoValue: 'medium'
      }],
      ['mega', {
        name: 'Mega.nz',
        provider: 'mega',
        domainRating: 85,
        features: {
          publicSharing: true,
          directLinks: true,
          embedding: false,
          apiAvailable: true
        },
        linkFormats: {
          share: 'https://mega.nz/file/{fileId}#{key}',
          embed: '', // Mega doesn't support embedding
          download: 'https://mega.nz/file/{fileId}#{key}'
        },
        rateLimits: {
          requestsPerMinute: 30,
          uploadSizeLimit: '50GB'
        },
        seoValue: 'medium'
      }]
    ]);
  }

  // Upload document to cloud storage
  async uploadDocument(
    document: GeneratedDocument,
    config: CloudStorageConfig
  ): Promise<UploadResult> {
    try {
      switch (config.provider) {
        case 'google-drive':
          return await this.uploadToGoogleDrive(document, config);
        case 'dropbox':
          return await this.uploadToDropbox(document, config);
        case 'onedrive':
          return await this.uploadToOneDrive(document, config);
        case 'box':
          return await this.uploadToBox(document, config);
        case 'mega':
          return await this.uploadToMega(document, config);
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } catch (error) {
      console.error(`Upload to ${config.provider} failed:`, error);
      return {
        success: false,
        fileId: '',
        fileName: document.filename,
        provider: config.provider,
        uploadedAt: new Date().toISOString(),
        fileSize: document.size,
        error: error.message
      };
    }
  }

  // Google Drive upload
  private async uploadToGoogleDrive(
    document: GeneratedDocument,
    config: CloudStorageConfig
  ): Promise<UploadResult> {
    const formData = new FormData();
    
    // Metadata
    const metadata = {
      name: document.filename,
      description: config.uploadOptions?.description || `Document about ${document.metadata?.subject || 'topic'}`,
      parents: config.uploadOptions?.folder ? [config.uploadOptions.folder] : undefined
    };
    
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', document.blob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Make file public if requested
    let publicUrl = '';
    if (config.uploadOptions?.makePublic) {
      await this.makeGoogleDriveFilePublic(result.id, config.credentials.accessToken);
      publicUrl = this.providers.get('google-drive')!.linkFormats.share.replace('{fileId}', result.id);
    }

    return {
      success: true,
      fileId: result.id,
      fileName: document.filename,
      publicUrl,
      shareUrl: publicUrl,
      webViewUrl: `https://drive.google.com/file/d/${result.id}/view`,
      downloadUrl: this.providers.get('google-drive')!.linkFormats.download.replace('{fileId}', result.id),
      provider: 'google-drive',
      uploadedAt: new Date().toISOString(),
      fileSize: document.size
    };
  }

  // Dropbox upload
  private async uploadToDropbox(
    document: GeneratedDocument,
    config: CloudStorageConfig
  ): Promise<UploadResult> {
    const path = config.uploadOptions?.folder 
      ? `/${config.uploadOptions.folder}/${document.filename}`
      : `/${document.filename}`;

    // Upload file
    const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'add',
          autorename: true
        })
      },
      body: document.blob
    });

    if (!uploadResponse.ok) {
      throw new Error(`Dropbox upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();

    // Create sharing link if requested
    let shareUrl = '';
    if (config.uploadOptions?.makePublic) {
      const shareResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: uploadResult.path_lower,
          settings: {
            requested_visibility: 'public'
          }
        })
      });

      if (shareResponse.ok) {
        const shareResult = await shareResponse.json();
        shareUrl = shareResult.url;
      }
    }

    return {
      success: true,
      fileId: uploadResult.id,
      fileName: document.filename,
      publicUrl: shareUrl,
      shareUrl,
      webViewUrl: shareUrl,
      downloadUrl: shareUrl?.replace('?dl=0', '?dl=1') || '',
      provider: 'dropbox',
      uploadedAt: new Date().toISOString(),
      fileSize: document.size
    };
  }

  // OneDrive upload
  private async uploadToOneDrive(
    document: GeneratedDocument,
    config: CloudStorageConfig
  ): Promise<UploadResult> {
    const path = config.uploadOptions?.folder 
      ? `/drive/root:/${config.uploadOptions.folder}/${document.filename}:/content`
      : `/drive/root:/${document.filename}:/content`;

    const uploadResponse = await fetch(`https://graph.microsoft.com/v1.0/me${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`,
        'Content-Type': document.mimeType
      },
      body: document.blob
    });

    if (!uploadResponse.ok) {
      throw new Error(`OneDrive upload failed: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();

    // Create sharing link if requested
    let shareUrl = '';
    if (config.uploadOptions?.makePublic) {
      const shareResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${result.id}/createLink`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'view',
          scope: 'anonymous'
        })
      });

      if (shareResponse.ok) {
        const shareResult = await shareResponse.json();
        shareUrl = shareResult.link.webUrl;
      }
    }

    return {
      success: true,
      fileId: result.id,
      fileName: document.filename,
      publicUrl: shareUrl,
      shareUrl,
      webViewUrl: result.webUrl,
      downloadUrl: result['@microsoft.graph.downloadUrl'] || '',
      provider: 'onedrive',
      uploadedAt: new Date().toISOString(),
      fileSize: document.size
    };
  }

  // Box upload
  private async uploadToBox(
    document: GeneratedDocument,
    config: CloudStorageConfig
  ): Promise<UploadResult> {
    const formData = new FormData();
    const attributes = {
      name: document.filename,
      parent: {
        id: config.uploadOptions?.folder || '0' // 0 is root folder
      }
    };

    formData.append('attributes', JSON.stringify(attributes));
    formData.append('file', document.blob);

    const uploadResponse = await fetch('https://upload.box.com/api/2.0/files/content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.credentials.accessToken}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error(`Box upload failed: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    const fileId = result.entries[0].id;

    // Create shared link if requested
    let shareUrl = '';
    if (config.uploadOptions?.makePublic) {
      const shareResponse = await fetch(`https://api.box.com/2.0/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.credentials.accessToken}`,
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

      if (shareResponse.ok) {
        const shareResult = await shareResponse.json();
        shareUrl = shareResult.shared_link.url;
      }
    }

    return {
      success: true,
      fileId,
      fileName: document.filename,
      publicUrl: shareUrl,
      shareUrl,
      webViewUrl: shareUrl,
      downloadUrl: shareUrl,
      provider: 'box',
      uploadedAt: new Date().toISOString(),
      fileSize: document.size
    };
  }

  // Mega upload (placeholder - requires mega SDK)
  private async uploadToMega(
    document: GeneratedDocument,
    config: CloudStorageConfig
  ): Promise<UploadResult> {
    // Note: Mega requires their SDK which isn't available as a simple REST API
    // This would need the mega.js library for browser or mega SDK for Node.js
    
    // For now, return a mock implementation
    // In production, you'd integrate with mega.js
    
    console.warn('Mega upload not implemented - requires mega.js SDK');
    
    return {
      success: false,
      fileId: '',
      fileName: document.filename,
      provider: 'mega',
      uploadedAt: new Date().toISOString(),
      fileSize: document.size,
      error: 'Mega upload requires mega.js SDK integration'
    };
  }

  // Make Google Drive file public
  private async makeGoogleDriveFilePublic(fileId: string, accessToken: string): Promise<void> {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  }

  // Get provider info
  getProviderInfo(provider: CloudProvider): CloudProviderInfo | undefined {
    return this.providers.get(provider);
  }

  // Get all providers
  getAllProviders(): CloudProviderInfo[] {
    return Array.from(this.providers.values());
  }

  // Get providers by SEO value
  getProvidersBySEOValue(seoValue: 'high' | 'medium' | 'low'): CloudProviderInfo[] {
    return Array.from(this.providers.values()).filter(p => p.seoValue === seoValue);
  }

  // Get optimal providers for backlinks
  getOptimalProvidersForBacklinks(): CloudProviderInfo[] {
    return Array.from(this.providers.values())
      .filter(p => p.features.publicSharing && p.features.directLinks)
      .sort((a, b) => b.domainRating - a.domainRating);
  }

  // Generate sharing URLs
  generateSharingUrls(uploadResult: UploadResult): {
    viewUrl: string;
    downloadUrl: string;
    embedUrl?: string;
  } {
    const provider = this.providers.get(uploadResult.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${uploadResult.provider}`);
    }

    const viewUrl = uploadResult.shareUrl || uploadResult.publicUrl || '';
    const downloadUrl = uploadResult.downloadUrl || viewUrl;
    const embedUrl = provider.features.embedding 
      ? provider.linkFormats.embed.replace('{fileId}', uploadResult.fileId)
      : undefined;

    return {
      viewUrl,
      downloadUrl,
      embedUrl
    };
  }

  // Validate credentials for provider
  async validateCredentials(provider: CloudProvider, credentials: CloudCredentials): Promise<boolean> {
    try {
      switch (provider) {
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
        
        case 'onedrive':
          const odResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
          });
          return odResponse.ok;
        
        case 'box':
          const boxResponse = await fetch('https://api.box.com/2.0/users/me', {
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
          });
          return boxResponse.ok;
        
        case 'mega':
          // Mega validation would require SDK
          return true; // Placeholder
        
        default:
          return false;
      }
    } catch (error) {
      console.error(`Credential validation failed for ${provider}:`, error);
      return false;
    }
  }
}

export const cloudStorageService = new CloudStorageService();
export default cloudStorageService;
