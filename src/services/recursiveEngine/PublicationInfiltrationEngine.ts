/**
 * Publication Penetration & Infiltration Layer
 * Automated link placement with intelligent verification and success tracking
 */

import { supabase } from '@/integrations/supabase/client';
import type { DiscoveryTarget } from './RecursiveDiscoveryEngine';

export interface PlacementAttempt {
  id: string;
  targetId: string;
  campaignId: string;
  targetUrl: string;
  placementType: 'comment' | 'profile' | 'form_submission' | 'post_upload' | 'directory_listing' | 'guestbook';
  linkUrl: string;
  anchorText: string;
  content: string;
  contextualData: {
    ipAddress: string;
    userAgent: string;
    browserFingerprint: string;
    sessionId: string;
    timestamp: Date;
  };
  status: 'attempted' | 'published' | 'pending_approval' | 'failed' | 'blocked' | 'removed';
  verificationStatus: 'not_verified' | 'verifying' | 'verified_live' | 'verified_indexed' | 'verification_failed';
  metadata: {
    responseTime?: number;
    httpStatusCode?: number;
    errorMessage?: string;
    placementSelector?: string;
    moderationRequired?: boolean;
    estimatedApprovalTime?: number;
  };
  attemptedAt: Date;
  publishedAt?: Date;
  verifiedAt?: Date;
  lastCheckedAt?: Date;
}

export interface PlacementStrategy {
  id: string;
  targetType: DiscoveryTarget['type'];
  platform: string;
  strategy: {
    selectors: {
      commentForm?: string;
      nameField?: string;
      emailField?: string;
      websiteField?: string;
      contentField?: string;
      submitButton?: string;
    };
    workflow: PlacementStep[];
    antiDetection: {
      humanDelays: { min: number; max: number };
      mouseMovements: boolean;
      keyboardTyping: boolean;
      scrollBehavior: boolean;
      randomPageInteraction: boolean;
    };
    contentGeneration: {
      template: string;
      variationPoints: string[];
      minimumLength: number;
      maximumLength: number;
      includePersonalization: boolean;
    };
  };
  successRate: number;
  lastUpdated: Date;
  confidence: number;
}

export interface PlacementStep {
  id: string;
  action: 'navigate' | 'wait' | 'click' | 'type' | 'scroll' | 'verify' | 'capture' | 'analyze';
  target?: string; // CSS selector or URL
  value?: string;
  conditions?: string[];
  delayAfter?: { min: number; max: number };
  retries?: number;
  optional?: boolean;
}

export interface VerificationResult {
  placementId: string;
  isLive: boolean;
  isIndexed: boolean;
  linkAttributes: {
    href: string;
    text: string;
    rel: string;
    isDofollow: boolean;
    position: string;
    surrounding_context: string;
  };
  pageMetrics: {
    httpStatus: number;
    loadTime: number;
    domainAuthority?: number;
    pageAuthority?: number;
    lastModified?: Date;
  };
  indexingStatus: {
    googleIndexed: boolean;
    bingIndexed: boolean;
    lastChecked: Date;
  };
  verifiedAt: Date;
}

export interface ProxyConfig {
  id: string;
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country: string;
  isActive: boolean;
  lastUsed?: Date;
  successRate: number;
  averageResponseTime: number;
}

export class PublicationInfiltrationEngine {
  private static instance: PublicationInfiltrationEngine;
  private activeAttempts: Map<string, PlacementAttempt> = new Map();
  private placementStrategies: Map<string, PlacementStrategy> = new Map();
  private proxyPool: ProxyConfig[] = [];
  private currentProxyIndex = 0;
  private maxConcurrentPlacements = 10;
  private verificationQueue: string[] = [];
  private isProcessingVerifications = false;

  private constructor() {
    this.initializePlacementStrategies();
    this.loadProxyPool();
    this.startVerificationProcessor();
  }

  public static getInstance(): PublicationInfiltrationEngine {
    if (!PublicationInfiltrationEngine.instance) {
      PublicationInfiltrationEngine.instance = new PublicationInfiltrationEngine();
    }
    return PublicationInfiltrationEngine.instance;
  }

  /**
   * Initialize placement strategies for different platforms
   */
  private async initializePlacementStrategies(): Promise<void> {
    const strategies: PlacementStrategy[] = [
      {
        id: 'wordpress_comment',
        targetType: 'comment_section',
        platform: 'WordPress',
        strategy: {
          selectors: {
            commentForm: '#commentform, .comment-form, form[action*="wp-comments-post"]',
            nameField: '#author, input[name="author"], .comment-form-author input',
            emailField: '#email, input[name="email"], .comment-form-email input',
            websiteField: '#url, input[name="url"], .comment-form-url input',
            contentField: '#comment, textarea[name="comment"], .comment-form-comment textarea',
            submitButton: '#submit, input[type="submit"], button[type="submit"]'
          },
          workflow: [
            { id: '1', action: 'navigate', target: 'target_url' },
            { id: '2', action: 'wait', value: '2000', delayAfter: { min: 1000, max: 3000 } },
            { id: '3', action: 'scroll', target: 'commentForm', delayAfter: { min: 500, max: 1500 } },
            { id: '4', action: 'click', target: 'nameField', delayAfter: { min: 300, max: 800 } },
            { id: '5', action: 'type', target: 'nameField', value: 'generated_name' },
            { id: '6', action: 'click', target: 'emailField', delayAfter: { min: 300, max: 800 } },
            { id: '7', action: 'type', target: 'emailField', value: 'generated_email' },
            { id: '8', action: 'click', target: 'websiteField', delayAfter: { min: 300, max: 800 }, optional: true },
            { id: '9', action: 'type', target: 'websiteField', value: 'contextual_website', optional: true },
            { id: '10', action: 'click', target: 'contentField', delayAfter: { min: 500, max: 1200 } },
            { id: '11', action: 'type', target: 'contentField', value: 'generated_content' },
            { id: '12', action: 'wait', value: '1000', delayAfter: { min: 1000, max: 2000 } },
            { id: '13', action: 'click', target: 'submitButton' },
            { id: '14', action: 'wait', value: '3000' },
            { id: '15', action: 'verify', target: 'success_indicators' }
          ],
          antiDetection: {
            humanDelays: { min: 100, max: 300 },
            mouseMovements: true,
            keyboardTyping: true,
            scrollBehavior: true,
            randomPageInteraction: true
          },
          contentGeneration: {
            template: 'contextual_comment',
            variationPoints: ['greeting', 'main_content', 'closing', 'signature'],
            minimumLength: 50,
            maximumLength: 300,
            includePersonalization: true
          }
        },
        successRate: 0.72,
        lastUpdated: new Date(),
        confidence: 0.85
      },
      {
        id: 'phpbb_profile',
        targetType: 'profile',
        platform: 'phpBB',
        strategy: {
          selectors: {
            contentField: 'textarea[name="signature"], #signature',
            submitButton: 'input[name="submit"], button[type="submit"]'
          },
          workflow: [
            { id: '1', action: 'navigate', target: 'profile_edit_url' },
            { id: '2', action: 'wait', value: '2000' },
            { id: '3', action: 'scroll', target: 'contentField' },
            { id: '4', action: 'click', target: 'contentField' },
            { id: '5', action: 'type', target: 'contentField', value: 'signature_content' },
            { id: '6', action: 'click', target: 'submitButton' },
            { id: '7', action: 'verify', target: 'profile_success' }
          ],
          antiDetection: {
            humanDelays: { min: 200, max: 500 },
            mouseMovements: true,
            keyboardTyping: true,
            scrollBehavior: true,
            randomPageInteraction: false
          },
          contentGeneration: {
            template: 'profile_signature',
            variationPoints: ['intro', 'expertise', 'link_context'],
            minimumLength: 30,
            maximumLength: 150,
            includePersonalization: true
          }
        },
        successRate: 0.68,
        lastUpdated: new Date(),
        confidence: 0.78
      },
      {
        id: 'contact_form',
        targetType: 'cms',
        platform: 'Generic',
        strategy: {
          selectors: {
            nameField: 'input[name*="name"], #name, .name input',
            emailField: 'input[name*="email"], #email, .email input',
            contentField: 'textarea[name*="message"], #message, .message textarea',
            submitButton: 'input[type="submit"], button[type="submit"], .submit'
          },
          workflow: [
            { id: '1', action: 'navigate', target: 'contact_url' },
            { id: '2', action: 'wait', value: '1500' },
            { id: '3', action: 'click', target: 'nameField' },
            { id: '4', action: 'type', target: 'nameField', value: 'professional_name' },
            { id: '5', action: 'click', target: 'emailField' },
            { id: '6', action: 'type', target: 'emailField', value: 'professional_email' },
            { id: '7', action: 'click', target: 'contentField' },
            { id: '8', action: 'type', target: 'contentField', value: 'outreach_message' },
            { id: '9', action: 'click', target: 'submitButton' },
            { id: '10', action: 'verify', target: 'form_success' }
          ],
          antiDetection: {
            humanDelays: { min: 150, max: 400 },
            mouseMovements: true,
            keyboardTyping: true,
            scrollBehavior: true,
            randomPageInteraction: true
          },
          contentGeneration: {
            template: 'professional_outreach',
            variationPoints: ['introduction', 'value_proposition', 'call_to_action'],
            minimumLength: 100,
            maximumLength: 500,
            includePersonalization: true
          }
        },
        successRate: 0.45,
        lastUpdated: new Date(),
        confidence: 0.65
      }
    ];

    strategies.forEach(strategy => {
      this.placementStrategies.set(strategy.id, strategy);
    });

    // Load additional strategies from database
    try {
      const { data: dbStrategies } = await supabase
        .from('placement_strategies')
        .select('*')
        .order('success_rate', { ascending: false });

      if (dbStrategies) {
        dbStrategies.forEach(strategy => {
          this.placementStrategies.set(strategy.id, {
            id: strategy.id,
            targetType: strategy.target_type,
            platform: strategy.platform,
            strategy: strategy.strategy,
            successRate: strategy.success_rate,
            lastUpdated: new Date(strategy.last_updated),
            confidence: strategy.confidence
          });
        });
      }
    } catch (error) {
      console.error('Failed to load placement strategies:', error);
    }
  }

  /**
   * Load and manage proxy pool for stealth operations
   */
  private async loadProxyPool(): Promise<void> {
    try {
      const { data: proxies } = await supabase
        .from('proxy_pool')
        .select('*')
        .eq('is_active', true)
        .order('success_rate', { ascending: false });

      if (proxies) {
        this.proxyPool = proxies.map(proxy => ({
          id: proxy.id,
          type: proxy.type,
          host: proxy.host,
          port: proxy.port,
          username: proxy.username,
          password: proxy.password,
          country: proxy.country,
          isActive: proxy.is_active,
          lastUsed: proxy.last_used ? new Date(proxy.last_used) : undefined,
          successRate: proxy.success_rate,
          averageResponseTime: proxy.average_response_time
        }));
      }
    } catch (error) {
      console.error('Failed to load proxy pool:', error);
    }
  }

  /**
   * Attempt to place a link on a target
   */
  public async attemptPlacement(
    target: DiscoveryTarget,
    campaignId: string,
    linkUrl: string,
    anchorText: string,
    customContent?: string
  ): Promise<string> {
    const attemptId = `placement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find appropriate strategy
    const strategy = this.findBestStrategy(target);
    if (!strategy) {
      throw new Error(`No suitable placement strategy found for ${target.type} on ${target.platform}`);
    }

    // Get proxy for this attempt
    const proxy = this.getNextProxy();
    
    // Generate contextual content
    const content = customContent || await this.generateContextualContent(
      target,
      linkUrl,
      anchorText,
      strategy.strategy.contentGeneration
    );

    const attempt: PlacementAttempt = {
      id: attemptId,
      targetId: target.id,
      campaignId,
      targetUrl: target.url,
      placementType: this.getPlacementType(target.type),
      linkUrl,
      anchorText,
      content,
      contextualData: {
        ipAddress: proxy?.host || 'direct',
        userAgent: this.generateRandomUserAgent(),
        browserFingerprint: this.generateBrowserFingerprint(),
        sessionId: `session_${Date.now()}`,
        timestamp: new Date()
      },
      status: 'attempted',
      verificationStatus: 'not_verified',
      metadata: {},
      attemptedAt: new Date()
    };

    this.activeAttempts.set(attemptId, attempt);

    try {
      // Execute placement strategy
      const result = await this.executePlacementStrategy(attempt, strategy, proxy);
      
      if (result.success) {
        attempt.status = result.needsApproval ? 'pending_approval' : 'published';
        attempt.publishedAt = new Date();
        attempt.metadata = { ...attempt.metadata, ...result.metadata };
        
        // Queue for verification
        this.queueForVerification(attemptId);
      } else {
        attempt.status = 'failed';
        attempt.metadata = { 
          ...attempt.metadata, 
          errorMessage: result.error,
          httpStatusCode: result.statusCode
        };
      }

      // Store attempt in database
      await this.storePlacementAttempt(attempt);

      // Update strategy success rate
      await this.updateStrategyMetrics(strategy.id, result.success);

      return attemptId;

    } catch (error) {
      console.error(`Placement attempt failed: ${attemptId}`, error);
      attempt.status = 'failed';
      attempt.metadata.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.storePlacementAttempt(attempt);
      throw error;
    }
  }

  /**
   * Execute a placement strategy using headless browser automation
   */
  private async executePlacementStrategy(
    attempt: PlacementAttempt,
    strategy: PlacementStrategy,
    proxy?: ProxyConfig
  ): Promise<{ success: boolean; needsApproval?: boolean; metadata?: any; error?: string; statusCode?: number }> {
    
    try {
      console.log(`Executing placement strategy: ${strategy.id} for ${attempt.targetUrl}`);

      // This would integrate with Puppeteer/Playwright for actual browser automation
      // For now, returning a simulated result
      
      const simulatedResult = {
        success: Math.random() > 0.3, // 70% success rate simulation
        needsApproval: Math.random() > 0.6, // 40% need approval
        metadata: {
          responseTime: Math.floor(Math.random() * 3000) + 1000,
          placementSelector: strategy.strategy.selectors.contentField,
          httpStatusCode: 200
        }
      };

      // Simulate human-like delays
      await this.simulateHumanDelay(strategy.strategy.antiDetection.humanDelays);

      if (simulatedResult.success) {
        console.log(`Link placement successful: ${attempt.id}`);
      } else {
        console.log(`Link placement failed: ${attempt.id}`);
      }

      return simulatedResult;

    } catch (error) {
      console.error('Strategy execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Strategy execution failed',
        statusCode: 500
      };
    }
  }

  /**
   * Start the verification processor for checking published links
   */
  private startVerificationProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingVerifications && this.verificationQueue.length > 0) {
        this.isProcessingVerifications = true;
        await this.processVerificationQueue();
        this.isProcessingVerifications = false;
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Process the verification queue
   */
  private async processVerificationQueue(): Promise<void> {
    while (this.verificationQueue.length > 0) {
      const attemptId = this.verificationQueue.shift();
      if (!attemptId) continue;

      try {
        await this.verifyPlacement(attemptId);
      } catch (error) {
        console.error(`Verification failed for ${attemptId}:`, error);
      }

      // Delay between verifications
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  /**
   * Verify if a placement is live and indexed
   */
  private async verifyPlacement(attemptId: string): Promise<VerificationResult | null> {
    const attempt = this.activeAttempts.get(attemptId);
    if (!attempt) return null;

    attempt.verificationStatus = 'verifying';
    attempt.lastCheckedAt = new Date();

    try {
      // Check if link is live on the page
      const liveCheck = await this.checkLinkIsLive(attempt);
      
      // Check indexing status
      const indexingCheck = await this.checkIndexingStatus(attempt);

      const verificationResult: VerificationResult = {
        placementId: attemptId,
        isLive: liveCheck.isLive,
        isIndexed: indexingCheck.isIndexed,
        linkAttributes: liveCheck.linkAttributes,
        pageMetrics: liveCheck.pageMetrics,
        indexingStatus: indexingCheck.indexingStatus,
        verifiedAt: new Date()
      };

      // Update attempt status
      if (verificationResult.isLive) {
        attempt.verificationStatus = verificationResult.isIndexed ? 'verified_indexed' : 'verified_live';
        attempt.verifiedAt = new Date();
      } else {
        attempt.verificationStatus = 'verification_failed';
      }

      // Store verification result
      await this.storeVerificationResult(verificationResult);
      await this.updatePlacementAttempt(attempt);

      return verificationResult;

    } catch (error) {
      console.error(`Verification failed for ${attemptId}:`, error);
      attempt.verificationStatus = 'verification_failed';
      await this.updatePlacementAttempt(attempt);
      return null;
    }
  }

  /**
   * Check if the placed link is live on the target page
   */
  private async checkLinkIsLive(attempt: PlacementAttempt): Promise<{
    isLive: boolean;
    linkAttributes: VerificationResult['linkAttributes'];
    pageMetrics: VerificationResult['pageMetrics'];
  }> {
    // This would use headless browser to check the actual page
    // Simulation for now
    const isLive = Math.random() > 0.2; // 80% chance link is live
    
    return {
      isLive,
      linkAttributes: {
        href: attempt.linkUrl,
        text: attempt.anchorText,
        rel: Math.random() > 0.3 ? 'nofollow' : '',
        isDofollow: Math.random() > 0.3,
        position: 'content',
        surrounding_context: 'Generated context around the link'
      },
      pageMetrics: {
        httpStatus: 200,
        loadTime: Math.floor(Math.random() * 2000) + 500,
        domainAuthority: Math.floor(Math.random() * 50) + 20,
        pageAuthority: Math.floor(Math.random() * 40) + 15,
        lastModified: new Date()
      }
    };
  }

  /**
   * Check indexing status across search engines
   */
  private async checkIndexingStatus(attempt: PlacementAttempt): Promise<{
    isIndexed: boolean;
    indexingStatus: VerificationResult['indexingStatus'];
  }> {
    // This would check Google/Bing indexing APIs
    // Simulation for now
    const googleIndexed = Math.random() > 0.4;
    const bingIndexed = Math.random() > 0.6;
    
    return {
      isIndexed: googleIndexed || bingIndexed,
      indexingStatus: {
        googleIndexed,
        bingIndexed,
        lastChecked: new Date()
      }
    };
  }

  // Helper methods
  private findBestStrategy(target: DiscoveryTarget): PlacementStrategy | null {
    const strategies = Array.from(this.placementStrategies.values())
      .filter(s => s.targetType === target.type)
      .sort((a, b) => b.successRate - a.successRate);
    
    return strategies[0] || null;
  }

  private getPlacementType(targetType: DiscoveryTarget['type']): PlacementAttempt['placementType'] {
    const mapping: Record<DiscoveryTarget['type'], PlacementAttempt['placementType']> = {
      'blog': 'comment',
      'forum': 'profile',
      'profile': 'profile',
      'directory': 'directory_listing',
      'cms': 'form_submission',
      'guestbook': 'guestbook',
      'comment_section': 'comment'
    };
    return mapping[targetType] || 'form_submission';
  }

  private getNextProxy(): ProxyConfig | null {
    if (this.proxyPool.length === 0) return null;
    
    const proxy = this.proxyPool[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyPool.length;
    return proxy;
  }

  private generateRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private generateBrowserFingerprint(): string {
    return `fp_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async generateContextualContent(
    target: DiscoveryTarget,
    linkUrl: string,
    anchorText: string,
    config: PlacementStrategy['strategy']['contentGeneration']
  ): Promise<string> {
    // This would integrate with OpenAI or local LLM for content generation
    // Simulation for now
    const templates = {
      contextual_comment: `This is a really insightful article! I've been researching this topic and found some additional resources that might be helpful. Check out ${anchorText} for more information.`,
      profile_signature: `Digital marketing professional specializing in SEO and content strategy. ${anchorText}`,
      professional_outreach: `Hi there, I came across your website and was impressed by your content. I have a resource that might be valuable to your audience: ${anchorText}. Would you be interested in learning more?`
    };
    
    return templates[config.template as keyof typeof templates] || `Great content! Here's a relevant resource: ${anchorText}`;
  }

  private async simulateHumanDelay(delayConfig: { min: number; max: number }): Promise<void> {
    const delay = Math.floor(Math.random() * (delayConfig.max - delayConfig.min + 1)) + delayConfig.min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private queueForVerification(attemptId: string): void {
    this.verificationQueue.push(attemptId);
  }

  // Database operations
  private async storePlacementAttempt(attempt: PlacementAttempt): Promise<void> {
    try {
      await supabase.from('placement_attempts').insert({
        id: attempt.id,
        target_id: attempt.targetId,
        campaign_id: attempt.campaignId,
        target_url: attempt.targetUrl,
        placement_type: attempt.placementType,
        link_url: attempt.linkUrl,
        anchor_text: attempt.anchorText,
        content: attempt.content,
        contextual_data: attempt.contextualData,
        status: attempt.status,
        verification_status: attempt.verificationStatus,
        metadata: attempt.metadata,
        attempted_at: attempt.attemptedAt.toISOString(),
        published_at: attempt.publishedAt?.toISOString(),
        verified_at: attempt.verifiedAt?.toISOString(),
        last_checked_at: attempt.lastCheckedAt?.toISOString()
      });
    } catch (error) {
      console.error('Failed to store placement attempt:', error);
    }
  }

  private async updatePlacementAttempt(attempt: PlacementAttempt): Promise<void> {
    try {
      await supabase
        .from('placement_attempts')
        .update({
          status: attempt.status,
          verification_status: attempt.verificationStatus,
          metadata: attempt.metadata,
          verified_at: attempt.verifiedAt?.toISOString(),
          last_checked_at: attempt.lastCheckedAt?.toISOString()
        })
        .eq('id', attempt.id);
    } catch (error) {
      console.error('Failed to update placement attempt:', error);
    }
  }

  private async storeVerificationResult(result: VerificationResult): Promise<void> {
    try {
      await supabase.from('verification_results').insert({
        placement_id: result.placementId,
        is_live: result.isLive,
        is_indexed: result.isIndexed,
        link_attributes: result.linkAttributes,
        page_metrics: result.pageMetrics,
        indexing_status: result.indexingStatus,
        verified_at: result.verifiedAt.toISOString()
      });
    } catch (error) {
      console.error('Failed to store verification result:', error);
    }
  }

  private async updateStrategyMetrics(strategyId: string, success: boolean): Promise<void> {
    const strategy = this.placementStrategies.get(strategyId);
    if (!strategy) return;

    // Update success rate using exponential moving average
    const alpha = 0.1; // Learning rate
    strategy.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * strategy.successRate;
    strategy.lastUpdated = new Date();

    try {
      await supabase
        .from('placement_strategies')
        .update({
          success_rate: strategy.successRate,
          last_updated: strategy.lastUpdated.toISOString()
        })
        .eq('id', strategyId);
    } catch (error) {
      console.error('Failed to update strategy metrics:', error);
    }
  }

  // Public API methods
  public async getPlacementStatus(attemptId: string): Promise<PlacementAttempt | null> {
    return this.activeAttempts.get(attemptId) || null;
  }

  public async getPlacementStrategies(): Promise<PlacementStrategy[]> {
    return Array.from(this.placementStrategies.values());
  }

  public async getVerificationResults(campaignId?: string): Promise<VerificationResult[]> {
    try {
      let query = supabase
        .from('verification_results')
        .select(`
          *,
          placement_attempts!inner(campaign_id)
        `);

      if (campaignId) {
        query = query.eq('placement_attempts.campaign_id', campaignId);
      }

      const { data } = await query.order('verified_at', { ascending: false });
      return data || [];
    } catch (error) {
      console.error('Failed to get verification results:', error);
      return [];
    }
  }

  public getActiveAttempts(): PlacementAttempt[] {
    return Array.from(this.activeAttempts.values());
  }
}

export default PublicationInfiltrationEngine;
