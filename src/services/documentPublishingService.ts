import { promptManager, type PromptTemplate } from './promptManager';
import { documentGenerationService, type DocumentConfig, type GeneratedDocument, type DocumentTemplate } from './documentGenerationService';
import { cloudStorageService, type CloudStorageConfig, type UploadResult, type CloudProvider } from './cloudStorageService';
import { platformDiscoveryService } from './platformDiscoveryService';

export interface DocumentPublishingRequest {
  keyword: string;
  targetUrl: string;
  anchorText: string;
  contentPrompt?: string; // Generated content from AI
  selectedProviders: CloudProvider[];
  documentFormats: ('pdf' | 'html')[];
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
  };
  credentials: Record<CloudProvider, any>; // API credentials for each provider
}

export interface DocumentPublishingResult {
  success: boolean;
  totalDocuments: number;
  successfulUploads: number;
  failedUploads: number;
  results: PublishedDocument[];
  errors: string[];
  summary: {
    totalBacklinks: number;
    highAuthorityLinks: number;
    estimatedSEOValue: number;
  };
}

export interface PublishedDocument {
  provider: CloudProvider;
  format: string;
  uploadResult: UploadResult;
  documentInfo: {
    filename: string;
    size: number;
    template: string;
  };
  backlinkUrls: {
    shareUrl: string;
    directUrl: string;
    embedUrl?: string;
  };
  seoMetrics: {
    domainRating: number;
    estimated_traffic: number;
    link_juice_value: number;
  };
}

export interface DocumentCampaignStrategy {
  keyword: string;
  recommendedProviders: CloudProvider[];
  optimalFormats: string[];
  contentStrategy: {
    primaryPrompt: PromptTemplate;
    alternativePrompts: PromptTemplate[];
    documentTemplates: DocumentTemplate[];
  };
  estimatedResults: {
    totalBacklinks: number;
    seoValue: number;
    reachPotential: number;
  };
}

class DocumentPublishingService {
  
  // Generate comprehensive document publishing strategy
  generateDocumentStrategy(keyword: string, targetUrl: string, anchorText: string): DocumentCampaignStrategy {
    // Get content strategy from platform discovery
    const contentStrategy = platformDiscoveryService.generateContentStrategy(keyword, targetUrl, anchorText);
    
    // Filter for cloud storage platforms
    const cloudPlatforms = contentStrategy.platformOpportunities
      .filter(opp => this.isCloudStoragePlatform(opp.platform.name))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 cloud platforms

    const recommendedProviders: CloudProvider[] = cloudPlatforms.map(p => 
      this.platformNameToProvider(p.platform.name)
    ).filter(Boolean) as CloudProvider[];

    // Get optimal prompts for document creation
    const documentPrompts = promptManager.getAllPrompts().filter(prompt => 
      prompt.platforms.some(platform => recommendedProviders.includes(platform as CloudProvider))
    );

    // Get document templates
    const documentTemplates = recommendedProviders.flatMap(provider => 
      documentGenerationService.getTemplatesForPlatform(provider)
    );

    // Calculate estimated results
    const totalBacklinks = recommendedProviders.length * 2; // 2 formats per provider
    const avgDomainRating = cloudPlatforms.reduce((sum, p) => sum + p.platform.domainRating, 0) / cloudPlatforms.length;
    const seoValue = (avgDomainRating / 100) * totalBacklinks * 10; // Scoring formula
    const reachPotential = cloudPlatforms.reduce((sum, p) => sum + p.estimatedReach, 0);

    return {
      keyword,
      recommendedProviders,
      optimalFormats: ['pdf', 'html'],
      contentStrategy: {
        primaryPrompt: documentPrompts[0] || promptManager.getAllPrompts()[0],
        alternativePrompts: documentPrompts.slice(1, 4),
        documentTemplates: documentTemplates
      },
      estimatedResults: {
        totalBacklinks,
        seoValue,
        reachPotential
      }
    };
  }

  // Publish documents to multiple cloud storage platforms
  async publishDocuments(request: DocumentPublishingRequest): Promise<DocumentPublishingResult> {
    const results: PublishedDocument[] = [];
    const errors: string[] = [];
    let successfulUploads = 0;
    let failedUploads = 0;

    try {
      // Generate content if not provided
      let content = request.contentPrompt;
      if (!content) {
        content = await this.generateOptimalContent(request.keyword, request.targetUrl, request.anchorText);
      }

      // Generate documents for each format and provider combination
      for (const provider of request.selectedProviders) {
        for (const format of request.documentFormats) {
          try {
            const result = await this.publishSingleDocument(
              provider,
              format,
              content,
              request,
              request.credentials[provider]
            );
            
            results.push(result);
            successfulUploads++;
          } catch (error) {
            console.error(`Failed to publish to ${provider} in ${format} format:`, error);
            errors.push(`${provider} (${format}): ${error.message}`);
            failedUploads++;
          }
        }
      }

      // Calculate summary
      const summary = this.calculateSummary(results);

      return {
        success: successfulUploads > 0,
        totalDocuments: request.selectedProviders.length * request.documentFormats.length,
        successfulUploads,
        failedUploads,
        results,
        errors,
        summary
      };

    } catch (error) {
      console.error('Document publishing failed:', error);
      return {
        success: false,
        totalDocuments: 0,
        successfulUploads: 0,
        failedUploads: request.selectedProviders.length * request.documentFormats.length,
        results: [],
        errors: [`Critical error: ${error.message}`],
        summary: {
          totalBacklinks: 0,
          highAuthorityLinks: 0,
          estimatedSEOValue: 0
        }
      };
    }
  }

  // Publish single document to specific provider
  private async publishSingleDocument(
    provider: CloudProvider,
    format: 'pdf' | 'html',
    content: string,
    request: DocumentPublishingRequest,
    credentials: any
  ): Promise<PublishedDocument> {
    
    // Get optimal template for provider
    const template = documentGenerationService.getOptimalTemplate('long-form-blog', provider);
    
    // Generate document
    const documentConfig: DocumentConfig = {
      title: `${request.keyword} - Comprehensive Guide`,
      content,
      targetUrl: request.targetUrl,
      anchorText: request.anchorText,
      keyword: request.keyword,
      format,
      template,
      metadata: {
        author: request.metadata?.author || 'Content Creator',
        description: request.metadata?.description || `Comprehensive guide about ${request.keyword}`,
        keywords: request.metadata?.tags || [request.keyword],
        subject: request.keyword
      }
    };

    const generatedDocument = await documentGenerationService.generateDocument(documentConfig);

    // Upload to cloud storage
    const storageConfig: CloudStorageConfig = {
      provider,
      credentials,
      uploadOptions: {
        makePublic: true,
        description: `Document about ${request.keyword} with valuable insights and resources`,
        tags: request.metadata?.tags || [request.keyword]
      }
    };

    const uploadResult = await cloudStorageService.uploadDocument(generatedDocument, storageConfig);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    // Generate sharing URLs
    const sharingUrls = cloudStorageService.generateSharingUrls(uploadResult);
    
    // Get provider info for SEO metrics
    const providerInfo = cloudStorageService.getProviderInfo(provider)!;

    return {
      provider,
      format,
      uploadResult,
      documentInfo: {
        filename: generatedDocument.filename,
        size: generatedDocument.size,
        template: template.name
      },
      backlinkUrls: {
        shareUrl: sharingUrls.viewUrl,
        directUrl: sharingUrls.downloadUrl,
        embedUrl: sharingUrls.embedUrl
      },
      seoMetrics: {
        domainRating: providerInfo.domainRating,
        estimated_traffic: this.estimateTraffic(providerInfo.domainRating),
        link_juice_value: this.calculateLinkJuiceValue(providerInfo.domainRating, format)
      }
    };
  }

  // Generate optimal content using prompts
  private async generateOptimalContent(keyword: string, targetUrl: string, anchorText: string): Promise<string> {
    // For now, return a template content
    // In production, this would call an AI service like OpenAI
    
    const documentPrompts = promptManager.getAllPrompts().filter(p => 
      p.platforms.includes('google-drive') || p.platforms.includes('dropbox')
    );

    const selectedPrompt = documentPrompts[0] || promptManager.getAllPrompts()[0];
    
    const variables = {
      KEYWORD: keyword,
      TARGET_URL: targetUrl,
      ANCHOR_TEXT: anchorText
    };

    const promptText = promptManager.generatePrompt(selectedPrompt, variables);
    
    // This would typically call an AI service
    // For now, return a structured content based on the prompt
    return this.generateMockContent(keyword, targetUrl, anchorText);
  }

  // Generate mock content (replace with AI service call)
  private generateMockContent(keyword: string, targetUrl: string, anchorText: string): string {
    return `
    <h2>Introduction to ${keyword}</h2>
    <p>In today's rapidly evolving digital landscape, understanding ${keyword} has become crucial for professionals and businesses alike. This comprehensive guide explores the key aspects, best practices, and strategic implementations that can drive success.</p>

    <h2>Understanding the Fundamentals</h2>
    <p>The foundation of effective ${keyword} lies in understanding its core principles and applications. By examining current trends and emerging technologies, we can better appreciate the transformative potential of this field.</p>

    <h2>Best Practices and Implementation</h2>
    <p>Successful implementation of ${keyword} strategies requires careful planning and execution. Industry experts recommend starting with a comprehensive assessment of current capabilities and identifying areas for improvement.</p>
    
    <p>For organizations looking to enhance their ${keyword} capabilities, <a href="${targetUrl}">${anchorText}</a> provides valuable insights and practical solutions that have been proven effective across various industries.</p>

    <h2>Strategic Considerations</h2>
    <p>When developing a ${keyword} strategy, it's essential to consider both immediate needs and long-term objectives. This holistic approach ensures sustainable growth and competitive advantage.</p>

    <h2>Future Outlook</h2>
    <p>As we look toward the future, ${keyword} will continue to evolve and present new opportunities. Organizations that stay informed and adapt quickly will be best positioned to capitalize on these developments.</p>

    <h2>Conclusion</h2>
    <p>The strategic implementation of ${keyword} principles can drive significant value for organizations of all sizes. By leveraging proven methodologies and staying current with industry trends, businesses can achieve sustainable success.</p>
    
    <p>For additional resources and expert guidance on ${keyword}, visit <a href="${targetUrl}">${anchorText}</a> to access comprehensive tools and insights that can accelerate your success.</p>
    `;
  }

  // Helper methods
  private isCloudStoragePlatform(platformName: string): boolean {
    const cloudPlatforms = ['Google Drive', 'Dropbox', 'OneDrive', 'Box', 'Mega.nz'];
    return cloudPlatforms.includes(platformName);
  }

  private platformNameToProvider(platformName: string): CloudProvider | null {
    const mapping: Record<string, CloudProvider> = {
      'Google Drive': 'google-drive',
      'Dropbox': 'dropbox',
      'OneDrive': 'onedrive',
      'Box': 'box',
      'Mega.nz': 'mega'
    };
    return mapping[platformName] || null;
  }

  private estimateTraffic(domainRating: number): number {
    return Math.floor(domainRating * 100); // Simple estimation
  }

  private calculateLinkJuiceValue(domainRating: number, format: string): number {
    const baseValue = domainRating / 10;
    const formatMultiplier = format === 'pdf' ? 1.2 : 1.0; // PDFs often rank higher
    return Math.floor(baseValue * formatMultiplier);
  }

  private calculateSummary(results: PublishedDocument[]) {
    const totalBacklinks = results.length;
    const highAuthorityLinks = results.filter(r => r.seoMetrics.domainRating >= 90).length;
    const estimatedSEOValue = results.reduce((sum, r) => sum + r.seoMetrics.link_juice_value, 0);

    return {
      totalBacklinks,
      highAuthorityLinks,
      estimatedSEOValue
    };
  }

  // Get available cloud providers
  getAvailableProviders(): CloudProvider[] {
    return cloudStorageService.getAllProviders().map(p => p.provider);
  }

  // Validate credentials for all providers
  async validateAllCredentials(credentials: Record<CloudProvider, any>): Promise<Record<CloudProvider, boolean>> {
    const validationResults: Record<CloudProvider, boolean> = {} as any;
    
    for (const [provider, creds] of Object.entries(credentials)) {
      try {
        validationResults[provider as CloudProvider] = await cloudStorageService.validateCredentials(
          provider as CloudProvider, 
          creds
        );
      } catch (error) {
        validationResults[provider as CloudProvider] = false;
      }
    }

    return validationResults;
  }
}

export const documentPublishingService = new DocumentPublishingService();
export default documentPublishingService;
