import { BaseEngine, type EngineTask, type LinkPlacementResult, type PlacementOpportunity, type GeneratedContent, type SubmissionResult } from './BaseEngine';
import { WordPressService } from '../platforms/WordPressService';
import { MediumService } from '../platforms/MediumService';
import { DevToService } from '../platforms/DevToService';
import { HashnodeService } from '../platforms/HashnodeService';
import { GhostService } from '../platforms/GhostService';
import { getTelegraphService } from '../telegraphService';

export interface PlatformConfig {
  id: string;
  name: string;
  enabled: boolean;
  domainAuthority: number;
  apiKey?: string;
  authToken?: string;
  baseUrl?: string;
  rateLimits: {
    postsPerHour: number;
    postsPerDay: number;
  };
  requirements: {
    minContentLength: number;
    supportedFormats: string[];
    requiresAuthentication: boolean;
    allowsAnonymous: boolean;
  };
}

export class Web2PlatformsEngine extends BaseEngine {
  readonly engineType = 'web2_platforms' as const;
  readonly supportedPlacements = ['web2_post'] as const;
  readonly averageProcessingTime = 30000; // 30 seconds
  readonly maxConcurrentTasks = 15;

  private platforms: Map<string, any> = new Map();
  private platformConfigs: Map<string, PlatformConfig> = new Map();

  constructor() {
    super();
    this.initializePlatforms();
  }

  private initializePlatforms(): void {
    // Initialize platform services
    this.platforms.set('wordpress', new WordPressService());
    this.platforms.set('medium', new MediumService());
    this.platforms.set('devto', new DevToService());
    this.platforms.set('hashnode', new HashnodeService());
    this.platforms.set('ghost', new GhostService());
    this.platforms.set('telegraph', getTelegraphService());

    // Initialize platform configurations
    this.platformConfigs.set('wordpress', {
      id: 'wordpress',
      name: 'WordPress',
      enabled: true,
      domainAuthority: 85,
      rateLimits: { postsPerHour: 5, postsPerDay: 20 },
      requirements: {
        minContentLength: 300,
        supportedFormats: ['html', 'markdown'],
        requiresAuthentication: true,
        allowsAnonymous: false
      }
    });

    this.platformConfigs.set('medium', {
      id: 'medium',
      name: 'Medium',
      enabled: true,
      domainAuthority: 96,
      rateLimits: { postsPerHour: 3, postsPerDay: 10 },
      requirements: {
        minContentLength: 400,
        supportedFormats: ['markdown', 'html'],
        requiresAuthentication: true,
        allowsAnonymous: false
      }
    });

    this.platformConfigs.set('devto', {
      id: 'devto',
      name: 'Dev.to',
      enabled: true,
      domainAuthority: 90,
      rateLimits: { postsPerHour: 4, postsPerDay: 15 },
      requirements: {
        minContentLength: 350,
        supportedFormats: ['markdown'],
        requiresAuthentication: true,
        allowsAnonymous: false
      }
    });

    this.platformConfigs.set('hashnode', {
      id: 'hashnode',
      name: 'Hashnode',
      enabled: true,
      domainAuthority: 88,
      rateLimits: { postsPerHour: 4, postsPerDay: 12 },
      requirements: {
        minContentLength: 400,
        supportedFormats: ['markdown'],
        requiresAuthentication: true,
        allowsAnonymous: false
      }
    });

    this.platformConfigs.set('ghost', {
      id: 'ghost',
      name: 'Ghost CMS',
      enabled: true,
      domainAuthority: 85,
      rateLimits: { postsPerHour: 6, postsPerDay: 25 },
      requirements: {
        minContentLength: 300,
        supportedFormats: ['html', 'markdown'],
        requiresAuthentication: true,
        allowsAnonymous: false
      }
    });

    this.platformConfigs.set('telegraph', {
      id: 'telegraph',
      name: 'Telegraph',
      enabled: true,
      domainAuthority: 91,
      rateLimits: { postsPerHour: 10, postsPerDay: 50 },
      requirements: {
        minContentLength: 200,
        supportedFormats: ['html'],
        requiresAuthentication: false,
        allowsAnonymous: true
      }
    });
  }

  async execute(task: EngineTask): Promise<LinkPlacementResult> {
    const startTime = Date.now();
    let attemptsCount = 0;
    const resourcesUsed: string[] = [];

    try {
      // 1. Validate task
      const validation = await this.validateTask(task);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: validation.errors.join(', '),
            retryable: false
          },
          metrics: {
            processingTimeMs: Date.now() - startTime,
            attemptsCount: 0,
            resourcesUsed: []
          }
        };
      }

      // 2. Discover platform opportunities
      resourcesUsed.push('platform_discovery');
      const opportunities = await this.discoverOpportunities(task);
      
      if (opportunities.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_OPPORTUNITIES',
            message: 'No suitable platforms available for publishing',
            retryable: true,
            retryAfter: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
          },
          metrics: {
            processingTimeMs: Date.now() - startTime,
            attemptsCount: 0,
            resourcesUsed
          }
        };
      }

      // 3. Try each platform opportunity until successful - attempt ALL available platforms
      const failedPlatforms: string[] = [];
      const platformErrors: { platform: string; error: string; retryable: boolean }[] = [];

      for (const opportunity of opportunities) { // Try ALL platforms, not just top 3
        attemptsCount++;

        try {
          console.log(`🔄 Attempting platform ${opportunity.domain} (attempt ${attemptsCount}/${opportunities.length})`);

          // Generate platform-specific content
          resourcesUsed.push('content_generation');
          const content = await this.generateContent(opportunity, task);

          // Assess content quality
          const quality = await this.assessContentQuality(content.content, task);
          if (quality.score < 0.7) {
            console.warn(`⚠️ Content quality too low for ${opportunity.domain} (score: ${quality.score}), trying next platform`);
            failedPlatforms.push(`${opportunity.domain} (low quality)`);
            continue; // Try next platform
          }

          // Submit to platform
          resourcesUsed.push(`${opportunity.domain}_submission`);
          const submission = await this.submitPlacement(content, opportunity);

          if (submission.success) {
            console.log(`✅ Successfully published to ${opportunity.domain} after ${attemptsCount} attempts`);

            const placement = {
              sourceUrl: submission.placementUrl!,
              sourceDomain: opportunity.domain,
              targetUrl: task.targetUrl,
              anchorText: task.anchorText,
              placementType: 'web2_post' as const,
              status: submission.requiresModeration ? 'pending' : 'live' as const,
              domainAuthority: opportunity.domainAuthority,
              pageAuthority: opportunity.pageAuthority,
              qualityScore: quality.score * 100,
              cost: opportunity.estimatedCost,
              placementDate: new Date(),
              verificationScheduled: new Date(Date.now() + (submission.estimatedApprovalTime || 1) * 60 * 60 * 1000),
              engineData: {
                platform: opportunity.domain,
                postId: submission.submissionId,
                moderationRequired: submission.requiresModeration,
                contentFormat: content.metadata.format || 'html',
                platformSpecific: {
                  wordCount: content.metadata.wordCount,
                  readabilityScore: content.metadata.readabilityScore,
                  sentiment: content.metadata.sentiment
                },
                failedPlatforms, // Track which platforms failed before success
                totalAttempts: attemptsCount
              },
              contentSnippet: content.content.substring(0, 200) + '...'
            };

            const result: LinkPlacementResult = {
              success: true,
              placement,
              metrics: {
                processingTimeMs: Date.now() - startTime,
                attemptsCount,
                resourcesUsed
              }
            };

            // Post-processing
            await this.postProcess(result, task);

            return result;
          } else {
            // Submission failed but service responded
            const errorMsg = submission.error?.message || 'Unknown submission error';
            const isRetryable = submission.error?.retryable !== false;

            console.warn(`❌ Platform ${opportunity.domain} failed: ${errorMsg}`);
            failedPlatforms.push(opportunity.domain);
            platformErrors.push({
              platform: opportunity.domain,
              error: errorMsg,
              retryable: isRetryable
            });

            // Continue to next platform instead of stopping
            continue;
          }
        } catch (opportunityError: any) {
          console.warn(`💥 Platform ${opportunity.domain} threw error: ${opportunityError.message}`);
          failedPlatforms.push(opportunity.domain);
          platformErrors.push({
            platform: opportunity.domain,
            error: opportunityError.message,
            retryable: true
          });

          // Continue to next platform instead of stopping
          continue;
        }
      }

      // If all platforms failed
      console.error(`💀 All ${opportunities.length} platforms failed for task ${task.id}:`, failedPlatforms);

      // Check if any errors were retryable
      const hasRetryableErrors = platformErrors.some(error => error.retryable);
      const errorDetails = platformErrors.map(e => `${e.platform}: ${e.error}`).join('; ');

      return {
        success: false,
        error: {
          code: 'ALL_PLATFORMS_EXHAUSTED',
          message: `Exhausted all ${opportunities.length} available platforms. Failed platforms: ${failedPlatforms.join(', ')}. Errors: ${errorDetails}`,
          retryable: hasRetryableErrors,
          retryAfter: hasRetryableErrors ? new Date(Date.now() + 1 * 60 * 60 * 1000) : undefined // 1 hour if retryable
        },
        metrics: {
          processingTimeMs: Date.now() - startTime,
          attemptsCount,
          resourcesUsed,
          platformAttempts: {
            totalPlatforms: opportunities.length,
            failedPlatforms: failedPlatforms,
            platformErrors: platformErrors
          }
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ENGINE_ERROR',
          message: error.message,
          retryable: true
        },
        metrics: {
          processingTimeMs: Date.now() - startTime,
          attemptsCount,
          resourcesUsed
        }
      };
    }
  }

  protected async discoverOpportunities(task: EngineTask): Promise<PlacementOpportunity[]> {
    const opportunities: PlacementOpportunity[] = [];

    // Get available platforms based on task requirements
    const availablePlatforms = await this.getAvailablePlatforms(task);

    console.log(`🔍 Discovering opportunities from ${availablePlatforms.size} available platforms`);

    for (const [platformId, config] of availablePlatforms) {
      try {
        // Check if platform is enabled
        if (!config.enabled) {
          console.log(`⏸️  Platform ${platformId} is disabled, skipping`);
          continue;
        }

        // Check rate limits (but don't skip if unknown)
        const canPublish = await this.checkRateLimits(platformId);
        if (canPublish === false) {
          console.log(`⏱️  Platform ${platformId} rate limited, skipping`);
          continue;
        }

        // Check platform suitability for task (lowered threshold for more options)
        const suitabilityScore = this.calculatePlatformSuitability(config, task);
        if (suitabilityScore < 0.3) { // Lowered from 0.5 to 0.3 for more options
          console.log(`📊 Platform ${platformId} suitability too low (${suitabilityScore}), skipping`);
          continue;
        }

        // Check if platform has required credentials (for non-anonymous platforms)
        if (config.requirements.requiresAuthentication && !this.hasValidCredentials(platformId)) {
          console.log(`🔐 Platform ${platformId} missing credentials, skipping`);
          continue;
        }

        const opportunity = {
          id: `${platformId}_${Date.now()}`,
          domain: platformId,
          url: config.baseUrl || `https://${platformId}.com`,
          placementType: 'web2_post' as const,
          domainAuthority: config.domainAuthority,
          pageAuthority: config.domainAuthority - 5, // Estimate PA
          estimatedCost: this.calculateCost(config),
          difficultyScore: this.calculateDifficulty(config, task),
          requirements: {
            platform: platformId,
            minContentLength: config.requirements.minContentLength,
            supportedFormats: config.requirements.supportedFormats,
            authentication: config.requirements.requiresAuthentication,
            anonymous: config.requirements.allowsAnonymous,
            suitabilityScore // Add for debugging
          },
          discoveredAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        opportunities.push(opportunity);
        console.log(`✅ Added platform ${platformId} (DA: ${config.domainAuthority}, Suitability: ${suitabilityScore.toFixed(2)})`);

      } catch (error) {
        console.warn(`⚠️  Error evaluating platform ${platformId}:`, error);
        // Don't skip on error, but log it
      }
    }

    console.log(`📋 Found ${opportunities.length} viable platform opportunities`);

    // Sort by opportunity score with multiple factors
    const sortedOpportunities = opportunities.sort((a, b) => {
      const scoreA = this.calculateOpportunityScore(a, task);
      const scoreB = this.calculateOpportunityScore(b, task);
      return scoreB - scoreA;
    });

    // Log the order for debugging
    console.log(`📊 Platform priority order:`, sortedOpportunities.map(o =>
      `${o.domain} (DA:${o.domainAuthority}, Score:${this.calculateOpportunityScore(o, task).toFixed(1)})`
    ));

    return sortedOpportunities;
  }

  protected async generateContent(opportunity: PlacementOpportunity, task: EngineTask): Promise<GeneratedContent> {
    const platformId = opportunity.domain;
    const platformConfig = this.platformConfigs.get(platformId);
    
    if (!platformConfig) {
      throw new Error(`Platform configuration not found for ${platformId}`);
    }

    // Determine optimal content format for platform
    const contentFormat = this.selectOptimalFormat(platformConfig, task);
    
    // Generate platform-specific content
    const generationParams = {
      type: 'article' as const,
      topic: task.keywords[0], // Primary keyword as topic
      keywords: task.keywords,
      tone: task.requirements.contentTone,
      length: task.requirements.contentLength,
      format: contentFormat,
      platform: platformId,
      targetUrl: task.targetUrl,
      anchorText: task.anchorText,
      minLength: platformConfig.requirements.minContentLength,
      niche: task.niche
    };

    const content = await this.contentGenerator.generate(generationParams);
    
    // Enhance with platform-specific optimizations
    const enhancedContent = await this.optimizeForPlatform(content, platformConfig, task);
    
    return {
      ...enhancedContent,
      metadata: {
        ...enhancedContent.metadata,
        format: contentFormat,
        platform: platformId
      }
    };
  }

  protected async submitPlacement(content: GeneratedContent, opportunity: PlacementOpportunity): Promise<SubmissionResult> {
    const platformId = opportunity.domain;
    const platform = this.platforms.get(platformId);
    
    if (!platform) {
      throw new Error(`Platform service not found for ${platformId}`);
    }

    const submissionParams = {
      title: content.title || this.generateTitleFromKeywords(content.metadata.keywords || []),
      content: content.content,
      format: content.metadata.format || 'html',
      tags: content.metadata.keywords || [],
      canonicalUrl: opportunity.url,
      publishImmediately: true,
      metadata: {
        author: 'Content Creator',
        description: content.content.substring(0, 150) + '...',
        category: this.inferCategory(content.metadata.keywords || [])
      }
    };

    // Platform-specific submission
    return await platform.publishContent(submissionParams);
  }

  // Helper methods
  private async getAvailablePlatforms(task: EngineTask): Promise<Map<string, PlatformConfig>> {
    const available = new Map<string, PlatformConfig>();

    for (const [platformId, config] of this.platformConfigs) {
      // Check if platform meets basic task requirements
      if (task.requirements.maxCostPerLink < this.calculateCost(config)) {
        console.log(`💰 Platform ${platformId} too expensive: $${this.calculateCost(config)} > $${task.requirements.maxCostPerLink}`);
        continue;
      }

      // Check minimum domain authority if specified
      if (task.requirements.minDomainAuthority && config.domainAuthority < task.requirements.minDomainAuthority) {
        console.log(`📊 Platform ${platformId} DA too low: ${config.domainAuthority} < ${task.requirements.minDomainAuthority}`);
        continue;
      }

      available.set(platformId, config);
    }

    console.log(`🎯 ${available.size}/${this.platformConfigs.size} platforms meet basic requirements`);
    return available;
  }

  private async checkRateLimits(platformId: string): Promise<boolean | null> {
    // Check if we've hit rate limits for this platform
    const rateLimitKey = `rate_limit_${platformId}`;

    try {
      // Try to get rate limit status from localStorage or memory
      const lastUsed = localStorage.getItem(`${rateLimitKey}_last_used`);
      const usageCount = localStorage.getItem(`${rateLimitKey}_count`);

      if (!lastUsed || !usageCount) {
        return true; // No rate limit data, assume OK
      }

      const lastUsedTime = new Date(lastUsed);
      const currentHour = new Date();
      currentHour.setMinutes(0, 0, 0);

      // Reset counter if it's a new hour
      if (lastUsedTime < currentHour) {
        localStorage.removeItem(`${rateLimitKey}_count`);
        return true;
      }

      const config = this.platformConfigs.get(platformId);
      if (!config) return null;

      const hourlyLimit = config.rateLimits.postsPerHour;
      const currentCount = parseInt(usageCount);

      if (currentCount >= hourlyLimit) {
        console.log(`⏱️  Platform ${platformId} rate limited: ${currentCount}/${hourlyLimit} posts this hour`);
        return false;
      }

      return true;

    } catch (error) {
      console.warn(`Rate limit check failed for ${platformId}:`, error);
      return null; // Unknown status, don't block
    }
  }

  private hasValidCredentials(platformId: string): boolean {
    try {
      // Check for stored credentials in localStorage
      const credentials = localStorage.getItem('platform_credentials');
      if (!credentials) return false;

      const parsedCredentials = JSON.parse(credentials);
      const platformCreds = parsedCredentials[platformId];

      if (!platformCreds) return false;

      // Check if required credential fields are present
      switch (platformId) {
        case 'wordpress':
          return !!(platformCreds.baseUrl && platformCreds.username && platformCreds.applicationPassword);
        case 'medium':
          return !!(platformCreds.accessToken);
        case 'devto':
          return !!(platformCreds.apiKey);
        case 'hashnode':
          return !!(platformCreds.accessToken);
        case 'ghost':
          return !!(platformCreds.apiUrl && platformCreds.adminApiKey);
        case 'telegraph':
          return true; // No credentials required
        default:
          return false;
      }
    } catch (error) {
      console.warn(`Credential check failed for ${platformId}:`, error);
      return false;
    }
  }

  private recordPlatformUsage(platformId: string): void {
    try {
      const rateLimitKey = `rate_limit_${platformId}`;
      const now = new Date().toISOString();
      const countKey = `${rateLimitKey}_count`;

      localStorage.setItem(`${rateLimitKey}_last_used`, now);

      const currentCount = parseInt(localStorage.getItem(countKey) || '0');
      localStorage.setItem(countKey, (currentCount + 1).toString());

    } catch (error) {
      console.warn(`Failed to record usage for ${platformId}:`, error);
    }
  }

  private calculatePlatformSuitability(config: PlatformConfig, task: EngineTask): number {
    let score = 0.5; // Base score
    
    // Domain authority factor
    score += (config.domainAuthority / 100) * 0.3;
    
    // Content length compatibility
    const requiredLength = this.getRequiredContentLength(task.requirements.contentLength);
    if (requiredLength >= config.requirements.minContentLength) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }

  private calculateCost(config: PlatformConfig): number {
    // Base cost calculation (could be enhanced with real pricing)
    const baseCost = 2.0; // $2 base
    const daCost = (config.domainAuthority - 50) * 0.1; // $0.10 per DA point above 50
    return Math.max(baseCost + daCost, 1.0);
  }

  private calculateDifficulty(config: PlatformConfig, task: EngineTask): number {
    let difficulty = 20; // Base difficulty
    
    // Authentication requirement
    if (config.requirements.requiresAuthentication) difficulty += 30;
    
    // Content length requirement
    if (config.requirements.minContentLength > 400) difficulty += 20;
    
    // Rate limits
    if (config.rateLimits.postsPerDay < 10) difficulty += 15;
    
    return Math.min(difficulty, 100);
  }

  private calculateOpportunityScore(opportunity: PlacementOpportunity, task: EngineTask): number {
    let score = 0;
    
    // Domain authority (40%)
    score += opportunity.domainAuthority * 0.4;
    
    // Low difficulty (30%)
    score += (100 - opportunity.difficultyScore) * 0.3;
    
    // Cost efficiency (20%)
    const maxCost = task.requirements.maxCostPerLink;
    const costEfficiency = Math.max(0, (maxCost - opportunity.estimatedCost) / maxCost);
    score += costEfficiency * 100 * 0.2;
    
    // Freshness (10%)
    const hoursSinceDiscovery = (Date.now() - opportunity.discoveredAt.getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 100 - hoursSinceDiscovery);
    score += freshnessScore * 0.1;
    
    return score;
  }

  private selectOptimalFormat(config: PlatformConfig, task: EngineTask): string {
    // Prefer markdown for developer platforms, HTML for others
    if (config.id === 'devto' || config.id === 'hashnode') {
      return 'markdown';
    }
    
    if (config.requirements.supportedFormats.includes('html')) {
      return 'html';
    }
    
    return config.requirements.supportedFormats[0] || 'html';
  }

  private async optimizeForPlatform(content: GeneratedContent, config: PlatformConfig, task: EngineTask): Promise<GeneratedContent> {
    let optimizedContent = content.content;
    
    // Platform-specific optimizations
    switch (config.id) {
      case 'medium':
        optimizedContent = this.optimizeForMedium(content.content, task);
        break;
      case 'devto':
        optimizedContent = this.optimizeForDevTo(content.content, task);
        break;
      case 'hashnode':
        optimizedContent = this.optimizeForHashnode(content.content, task);
        break;
      case 'telegraph':
        optimizedContent = this.optimizeForTelegraph(content.content, task);
        break;
    }
    
    return {
      ...content,
      content: optimizedContent
    };
  }

  private optimizeForMedium(content: string, task: EngineTask): string {
    // Medium-specific optimizations (better formatting, subtitles, etc.)
    let optimized = content;
    
    // Ensure proper heading structure
    optimized = optimized.replace(/^# /gm, '## ');
    optimized = optimized.replace(/^## /gm, '### ');
    
    // Add engaging intro if missing
    if (!optimized.startsWith('*')) {
      optimized = `*${task.keywords[0]} is becoming increasingly important in today's digital landscape.*\n\n${optimized}`;
    }
    
    return optimized;
  }

  private optimizeForDevTo(content: string, task: EngineTask): string {
    // Dev.to specific optimizations (code blocks, developer tone)
    let optimized = content;
    
    // Ensure proper markdown formatting
    optimized = optimized.replace(/<code>/g, '`');
    optimized = optimized.replace(/<\/code>/g, '`');
    
    // Add front matter tags if missing
    const tags = task.keywords.slice(0, 4).map(k => k.toLowerCase().replace(/\s+/g, ''));
    if (!optimized.includes('---')) {
      optimized = `---\ntitle: "${task.keywords[0]} Guide"\ntags: [${tags.join(', ')}]\n---\n\n${optimized}`;
    }
    
    return optimized;
  }

  private optimizeForHashnode(content: string, task: EngineTask): string {
    // Hashnode specific optimizations
    let optimized = content;
    
    // Ensure proper markdown structure
    optimized = optimized.replace(/^# /gm, '## ');
    
    // Add call-to-action if missing
    if (!optimized.includes('What do you think')) {
      optimized += `\n\n---\n\nWhat do you think about ${task.keywords[0]}? Share your thoughts in the comments below!`;
    }
    
    return optimized;
  }

  private optimizeForTelegraph(content: string, task: EngineTask): string {
    // Telegraph specific optimizations (clean HTML)
    let optimized = content;
    
    // Ensure clean HTML structure
    optimized = optimized.replace(/\n\n/g, '</p><p>');
    optimized = optimized.replace(/^/, '<p>');
    optimized = optimized.replace(/$/, '</p>');
    
    return optimized;
  }

  private getRequiredContentLength(length: string): number {
    switch (length) {
      case 'short': return 200;
      case 'medium': return 400;
      case 'long': return 800;
      default: return 400;
    }
  }

  private generateTitleFromKeywords(keywords: string[]): string {
    const templates = [
      `The Complete Guide to ${keywords[0]}`,
      `Understanding ${keywords[0]}: A Comprehensive Overview`,
      `${keywords[0]}: Best Practices and Tips`,
      `Mastering ${keywords[0]} in 2024`,
      `Everything You Need to Know About ${keywords[0]}`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private inferCategory(keywords: string[]): string {
    const techTerms = ['javascript', 'python', 'react', 'node', 'api', 'database', 'web'];
    const businessTerms = ['marketing', 'seo', 'business', 'strategy', 'growth'];
    
    const primaryKeyword = keywords[0]?.toLowerCase() || '';
    
    if (techTerms.some(term => primaryKeyword.includes(term))) {
      return 'Technology';
    }
    
    if (businessTerms.some(term => primaryKeyword.includes(term))) {
      return 'Business';
    }
    
    return 'General';
  }

  // Public methods for platform management
  public getPlatformConfigs(): Map<string, PlatformConfig> {
    return new Map(this.platformConfigs);
  }

  public updatePlatformConfig(platformId: string, updates: Partial<PlatformConfig>): void {
    const existing = this.platformConfigs.get(platformId);
    if (existing) {
      this.platformConfigs.set(platformId, { ...existing, ...updates });
    }
  }

  public enablePlatform(platformId: string): void {
    this.updatePlatformConfig(platformId, { enabled: true });
  }

  public disablePlatform(platformId: string): void {
    this.updatePlatformConfig(platformId, { enabled: false });
  }
}
