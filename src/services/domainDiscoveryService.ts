import { supabase } from '@/integrations/supabase/client';
import { EfficientCampaignOperations } from './efficientCampaignOperations';
import { UsageComputeTracker } from './usageComputeTracker';

export interface DomainDiscoveryEngine {
  engine_type: string;
  table_name: string;
  discovery_methods: string[];
  posting_capabilities: PostingCapability[];
  quality_filters: QualityFilter[];
  automation_features: AutomationFeature[];
}

export interface PostingCapability {
  method: string;
  success_rate: number;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'expert';
  requirements: string[];
  automation_supported: boolean;
  rate_limit: number;
  cost_per_post: number;
}

export interface QualityFilter {
  filter_name: string;
  min_value: number;
  max_value: number;
  weight: number;
  critical: boolean;
}

export interface AutomationFeature {
  feature_name: string;
  description: string;
  premium_only: boolean;
  compute_cost: number;
  success_rate_impact: number;
}

export interface DiscoveredDomain {
  id: string;
  engine_type: string;
  domain: string;
  base_url: string;
  discovery_method: string;
  authority_score: number;
  quality_score: number;
  posting_opportunities: PostingOpportunity[];
  verification_status: 'pending' | 'verified' | 'failed' | 'blocked';
  last_verified: string;
  success_history: {
    attempts: number;
    successes: number;
    failures: number;
    last_success: string;
    last_failure: string;
  };
  automation_config: {
    enabled: boolean;
    priority: number;
    retry_limit: number;
    cooldown_hours: number;
  };
  metadata: Record<string, any>;
}

export interface PostingOpportunity {
  id: string;
  domain_id: string;
  opportunity_type: string;
  target_url: string;
  estimated_success_rate: number;
  difficulty_assessment: string;
  posting_requirements: string[];
  content_requirements: {
    min_words: number;
    max_words: number;
    required_elements: string[];
    forbidden_elements: string[];
  };
  automation_feasibility: number; // 0-100 score
  cost_estimate: number;
  discovery_timestamp: string;
  expires_at?: string;
}

export class DomainDiscoveryService {
  private static discoveryEngines: Map<string, DomainDiscoveryEngine> = new Map();
  private static activeScans = new Map<string, any>();
  private static discoveryCache = new Map<string, DiscoveredDomain[]>();

  // Initialize discovery engines for each blog type
  static {
    this.initializeDiscoveryEngines();
  }

  private static initializeDiscoveryEngines(): void {
    const engines: DomainDiscoveryEngine[] = [
      {
        engine_type: 'blog_comments',
        table_name: 'blog_comment_domains',
        discovery_methods: ['wordpress_discovery', 'rss_crawling', 'competitor_analysis', 'google_dorking'],
        posting_capabilities: [
          {
            method: 'wordpress_comment',
            success_rate: 75,
            difficulty_level: 'easy',
            requirements: ['name', 'email', 'comment_text'],
            automation_supported: true,
            rate_limit: 60, // per hour
            cost_per_post: 0.02
          },
          {
            method: 'disqus_comment',
            success_rate: 85,
            difficulty_level: 'medium',
            requirements: ['disqus_account', 'comment_text'],
            automation_supported: true,
            rate_limit: 40,
            cost_per_post: 0.03
          },
          {
            method: 'custom_comment_system',
            success_rate: 60,
            difficulty_level: 'hard',
            requirements: ['manual_analysis', 'custom_script'],
            automation_supported: false,
            rate_limit: 20,
            cost_per_post: 0.05
          }
        ],
        quality_filters: [
          { filter_name: 'domain_authority', min_value: 20, max_value: 100, weight: 0.3, critical: true },
          { filter_name: 'spam_score', min_value: 0, max_value: 30, weight: 0.25, critical: true },
          { filter_name: 'comment_moderation', min_value: 1, max_value: 3, weight: 0.2, critical: false },
          { filter_name: 'comment_activity', min_value: 5, max_value: 100, weight: 0.15, critical: false },
          { filter_name: 'niche_relevance', min_value: 60, max_value: 100, weight: 0.1, critical: false }
        ],
        automation_features: [
          {
            feature_name: 'auto_comment_generation',
            description: 'AI-generated contextual comments',
            premium_only: false,
            compute_cost: 0.01,
            success_rate_impact: 15
          },
          {
            feature_name: 'sentiment_matching',
            description: 'Match comment tone to article',
            premium_only: true,
            compute_cost: 0.02,
            success_rate_impact: 25
          },
          {
            feature_name: 'moderation_bypass',
            description: 'Intelligent moderation avoidance',
            premium_only: true,
            compute_cost: 0.03,
            success_rate_impact: 35
          }
        ]
      },
      {
        engine_type: 'web2_platforms',
        table_name: 'web2_platform_domains',
        discovery_methods: ['platform_api', 'social_crawling', 'influencer_tracking', 'trending_analysis'],
        posting_capabilities: [
          {
            method: 'medium_article',
            success_rate: 90,
            difficulty_level: 'medium',
            requirements: ['medium_account', 'article_content', 'tags'],
            automation_supported: true,
            rate_limit: 5, // per day
            cost_per_post: 0.10
          },
          {
            method: 'linkedin_post',
            success_rate: 80,
            difficulty_level: 'medium',
            requirements: ['linkedin_account', 'professional_content'],
            automation_supported: true,
            rate_limit: 10,
            cost_per_post: 0.08
          },
          {
            method: 'reddit_submission',
            success_rate: 65,
            difficulty_level: 'hard',
            requirements: ['reddit_account', 'subreddit_rules', 'community_engagement'],
            automation_supported: false,
            rate_limit: 3,
            cost_per_post: 0.15
          }
        ],
        quality_filters: [
          { filter_name: 'platform_authority', min_value: 70, max_value: 100, weight: 0.4, critical: true },
          { filter_name: 'audience_size', min_value: 1000, max_value: 1000000, weight: 0.3, critical: false },
          { filter_name: 'engagement_rate', min_value: 2, max_value: 15, weight: 0.2, critical: false },
          { filter_name: 'content_acceptance_rate', min_value: 50, max_value: 100, weight: 0.1, critical: true }
        ],
        automation_features: [
          {
            feature_name: 'content_adaptation',
            description: 'Adapt content for each platform',
            premium_only: false,
            compute_cost: 0.05,
            success_rate_impact: 20
          },
          {
            feature_name: 'optimal_timing',
            description: 'Post at optimal engagement times',
            premium_only: true,
            compute_cost: 0.02,
            success_rate_impact: 30
          },
          {
            feature_name: 'audience_targeting',
            description: 'Target specific audience segments',
            premium_only: true,
            compute_cost: 0.08,
            success_rate_impact: 40
          }
        ]
      },
      {
        engine_type: 'forum_profiles',
        table_name: 'forum_profile_domains',
        discovery_methods: ['forum_crawling', 'niche_discovery', 'competitor_forums', 'directory_search'],
        posting_capabilities: [
          {
            method: 'profile_creation',
            success_rate: 85,
            difficulty_level: 'easy',
            requirements: ['email', 'username', 'basic_info'],
            automation_supported: true,
            rate_limit: 50,
            cost_per_post: 0.03
          },
          {
            method: 'signature_link',
            success_rate: 70,
            difficulty_level: 'medium',
            requirements: ['established_profile', 'post_requirement_met'],
            automation_supported: true,
            rate_limit: 30,
            cost_per_post: 0.04
          },
          {
            method: 'contextual_post',
            success_rate: 80,
            difficulty_level: 'medium',
            requirements: ['topic_relevance', 'community_guidelines'],
            automation_supported: true,
            rate_limit: 25,
            cost_per_post: 0.06
          }
        ],
        quality_filters: [
          { filter_name: 'forum_authority', min_value: 25, max_value: 100, weight: 0.3, critical: true },
          { filter_name: 'member_count', min_value: 100, max_value: 100000, weight: 0.2, critical: false },
          { filter_name: 'activity_level', min_value: 3, max_value: 10, weight: 0.25, critical: false },
          { filter_name: 'link_policy', min_value: 1, max_value: 5, weight: 0.25, critical: true }
        ],
        automation_features: [
          {
            feature_name: 'profile_aging',
            description: 'Gradually build profile reputation',
            premium_only: true,
            compute_cost: 0.04,
            success_rate_impact: 50
          },
          {
            feature_name: 'community_integration',
            description: 'Natural community participation',
            premium_only: true,
            compute_cost: 0.06,
            success_rate_impact: 35
          }
        ]
      },
      {
        engine_type: 'guest_posts',
        table_name: 'guest_post_domains',
        discovery_methods: ['outreach_research', 'content_gap_analysis', 'editor_contact_discovery', 'guest_post_directories'],
        posting_capabilities: [
          {
            method: 'email_pitch',
            success_rate: 15,
            difficulty_level: 'hard',
            requirements: ['editor_email', 'pitch_template', 'writing_samples'],
            automation_supported: true,
            rate_limit: 20,
            cost_per_post: 0.50
          },
          {
            method: 'content_submission',
            success_rate: 85,
            difficulty_level: 'medium',
            requirements: ['accepted_pitch', 'full_article', 'author_bio'],
            automation_supported: false,
            rate_limit: 5,
            cost_per_post: 2.00
          }
        ],
        quality_filters: [
          { filter_name: 'domain_authority', min_value: 40, max_value: 100, weight: 0.4, critical: true },
          { filter_name: 'traffic_estimate', min_value: 5000, max_value: 10000000, weight: 0.3, critical: false },
          { filter_name: 'guest_post_acceptance_rate', min_value: 10, max_value: 50, weight: 0.2, critical: true },
          { filter_name: 'editorial_response_time', min_value: 1, max_value: 30, weight: 0.1, critical: false }
        ],
        automation_features: [
          {
            feature_name: 'pitch_personalization',
            description: 'Personalize outreach emails',
            premium_only: false,
            compute_cost: 0.10,
            success_rate_impact: 100
          },
          {
            feature_name: 'content_research',
            description: 'Research trending topics',
            premium_only: true,
            compute_cost: 0.15,
            success_rate_impact: 80
          }
        ]
      }
    ];

    engines.forEach(engine => {
      this.discoveryEngines.set(engine.engine_type, engine);
    });
  }

  // ==================== DOMAIN DISCOVERY ====================

  static async discoverDomains(
    engineType: string,
    discoveryMethod: string,
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<DiscoveredDomain[]> {
    try {
      const engine = this.discoveryEngines.get(engineType);
      if (!engine) {
        throw new Error(`Unknown engine type: ${engineType}`);
      }

      if (!engine.discovery_methods.includes(discoveryMethod)) {
        throw new Error(`Discovery method ${discoveryMethod} not supported for ${engineType}`);
      }

      // Check cache first
      const cacheKey = `${engineType}_${discoveryMethod}_${JSON.stringify(filters)}`;
      const cached = this.discoveryCache.get(cacheKey);
      if (cached && cached.length > 0) {
        return cached.slice(0, targetCount);
      }

      // Start discovery scan
      const scanId = await this.startDiscoveryScan(engineType, discoveryMethod, targetCount, filters);
      const discovered = await this.executeDiscovery(scanId, engine, discoveryMethod, targetCount, filters);

      // Cache results
      this.discoveryCache.set(cacheKey, discovered);

      return discovered;
    } catch (error: any) {
      console.error('Error discovering domains:', error);
      throw error;
    }
  }

  private static async startDiscoveryScan(
    engineType: string,
    discoveryMethod: string,
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<string> {
    const scanId = `scan_${engineType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scanConfig = {
      id: scanId,
      engine_type: engineType,
      discovery_method: discoveryMethod,
      target_count: targetCount,
      filters: filters || {},
      status: 'active',
      start_time: new Date().toISOString(),
      discovered_count: 0,
      progress: 0
    };

    this.activeScans.set(scanId, scanConfig);
    return scanId;
  }

  private static async executeDiscovery(
    scanId: string,
    engine: DomainDiscoveryEngine,
    discoveryMethod: string,
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<DiscoveredDomain[]> {
    const discovered: DiscoveredDomain[] = [];

    try {
      switch (discoveryMethod) {
        case 'wordpress_discovery':
          discovered.push(...await this.discoverWordPressSites(targetCount, filters));
          break;
        case 'platform_api':
          discovered.push(...await this.discoverThroughPlatformAPI(targetCount, filters));
          break;
        case 'forum_crawling':
          discovered.push(...await this.discoverForums(targetCount, filters));
          break;
        case 'outreach_research':
          discovered.push(...await this.discoverGuestPostSites(targetCount, filters));
          break;
        default:
          discovered.push(...await this.genericDomainDiscovery(engine, targetCount, filters));
      }

      // Apply quality filters
      const filtered = this.applyQualityFilters(discovered, engine.quality_filters);

      // Store discovered domains in database
      await this.storeDomains(filtered, engine.table_name);

      // Update scan progress
      const scan = this.activeScans.get(scanId);
      if (scan) {
        scan.status = 'completed';
        scan.discovered_count = filtered.length;
        scan.progress = 100;
        scan.end_time = new Date().toISOString();
      }

      return filtered;
    } catch (error: any) {
      const scan = this.activeScans.get(scanId);
      if (scan) {
        scan.status = 'failed';
        scan.error = error.message;
        scan.end_time = new Date().toISOString();
      }
      throw error;
    }
  }

  // ==================== SPECIFIC DISCOVERY METHODS ====================

  private static async discoverWordPressSites(
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<DiscoveredDomain[]> {
    const discovered: DiscoveredDomain[] = [];
    
    // Simulate WordPress discovery through various methods
    const wordpressSites = [
      'techblog.example.com',
      'businessinsights.demo.org',
      'industrytrends.sample.net',
      'entrepreneurship.test.com',
      'digitalmarketing.mock.io'
    ];

    for (let i = 0; i < Math.min(targetCount, wordpressSites.length); i++) {
      const domain = wordpressSites[i];
      const discoveredDomain = await this.createDiscoveredDomain(
        'blog_comments',
        domain,
        'wordpress_discovery',
        {
          comment_system: 'wordpress',
          moderation_level: Math.random() > 0.5 ? 'medium' : 'low',
          average_comments_per_post: Math.floor(Math.random() * 20) + 5
        }
      );
      discovered.push(discoveredDomain);
    }

    return discovered;
  }

  private static async discoverThroughPlatformAPI(
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<DiscoveredDomain[]> {
    const discovered: DiscoveredDomain[] = [];
    
    const platforms = ['medium.com', 'dev.to', 'hashnode.com', 'linkedin.com'];
    
    for (let i = 0; i < Math.min(targetCount, platforms.length); i++) {
      const platform = platforms[i];
      const discoveredDomain = await this.createDiscoveredDomain(
        'web2_platforms',
        platform,
        'platform_api',
        {
          platform_type: platform.split('.')[0],
          audience_size: Math.floor(Math.random() * 1000000) + 10000,
          engagement_rate: Math.random() * 10 + 2
        }
      );
      discovered.push(discoveredDomain);
    }

    return discovered;
  }

  private static async discoverForums(
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<DiscoveredDomain[]> {
    const discovered: DiscoveredDomain[] = [];
    
    const forums = [
      'techforum.example.com',
      'businessdiscussion.demo.org',
      'industrycommunity.sample.net',
      'professionaltalk.test.com'
    ];

    for (let i = 0; i < Math.min(targetCount, forums.length); i++) {
      const forum = forums[i];
      const discoveredDomain = await this.createDiscoveredDomain(
        'forum_profiles',
        forum,
        'forum_crawling',
        {
          forum_software: 'phpbb',
          member_count: Math.floor(Math.random() * 50000) + 1000,
          profile_links_allowed: true,
          post_requirement: Math.floor(Math.random() * 20)
        }
      );
      discovered.push(discoveredDomain);
    }

    return discovered;
  }

  private static async discoverGuestPostSites(
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<DiscoveredDomain[]> {
    const discovered: DiscoveredDomain[] = [];
    
    const guestPostSites = [
      'industryblog.example.com',
      'expertinsights.demo.org',
      'thoughtleadership.sample.net'
    ];

    for (let i = 0; i < Math.min(targetCount, guestPostSites.length); i++) {
      const site = guestPostSites[i];
      const discoveredDomain = await this.createDiscoveredDomain(
        'guest_posts',
        site,
        'outreach_research',
        {
          editor_email: `editor@${site}`,
          acceptance_rate: Math.random() * 30 + 10,
          average_response_time: Math.floor(Math.random() * 14) + 1,
          payment_required: Math.random() > 0.7
        }
      );
      discovered.push(discoveredDomain);
    }

    return discovered;
  }

  private static async genericDomainDiscovery(
    engine: DomainDiscoveryEngine,
    targetCount: number,
    filters?: Record<string, any>
  ): Promise<DiscoveredDomain[]> {
    const discovered: DiscoveredDomain[] = [];
    
    // Generic discovery simulation
    for (let i = 0; i < targetCount; i++) {
      const domain = `site${i}.${engine.engine_type}.example.com`;
      const discoveredDomain = await this.createDiscoveredDomain(
        engine.engine_type,
        domain,
        'generic_discovery',
        { generic: true }
      );
      discovered.push(discoveredDomain);
    }

    return discovered;
  }

  // ==================== POSTING CAPABILITIES ====================

  static async assessPostingCapabilities(
    domainId: string,
    engineType: string
  ): Promise<PostingOpportunity[]> {
    try {
      const engine = this.discoveryEngines.get(engineType);
      if (!engine) {
        throw new Error(`Unknown engine type: ${engineType}`);
      }

      const opportunities: PostingOpportunity[] = [];

      for (const capability of engine.posting_capabilities) {
        const opportunity: PostingOpportunity = {
          id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          domain_id: domainId,
          opportunity_type: capability.method,
          target_url: '', // Will be set when used
          estimated_success_rate: capability.success_rate,
          difficulty_assessment: capability.difficulty_level,
          posting_requirements: capability.requirements,
          content_requirements: this.generateContentRequirements(capability.method),
          automation_feasibility: capability.automation_supported ? 90 : 20,
          cost_estimate: capability.cost_per_post,
          discovery_timestamp: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };

        opportunities.push(opportunity);
      }

      return opportunities;
    } catch (error: any) {
      console.error('Error assessing posting capabilities:', error);
      return [];
    }
  }

  private static generateContentRequirements(method: string): PostingOpportunity['content_requirements'] {
    const requirements: Record<string, PostingOpportunity['content_requirements']> = {
      wordpress_comment: {
        min_words: 20,
        max_words: 200,
        required_elements: ['relevant_comment', 'natural_tone'],
        forbidden_elements: ['spam_keywords', 'excessive_links']
      },
      medium_article: {
        min_words: 500,
        max_words: 3000,
        required_elements: ['engaging_title', 'structured_content', 'author_bio'],
        forbidden_elements: ['promotional_content', 'affiliate_links']
      },
      profile_creation: {
        min_words: 50,
        max_words: 300,
        required_elements: ['professional_bio', 'relevant_interests'],
        forbidden_elements: ['spam_content', 'fake_information']
      },
      email_pitch: {
        min_words: 100,
        max_words: 400,
        required_elements: ['personalization', 'value_proposition', 'writing_samples'],
        forbidden_elements: ['generic_templates', 'mass_email_indicators']
      }
    };

    return requirements[method] || {
      min_words: 50,
      max_words: 500,
      required_elements: ['relevant_content'],
      forbidden_elements: ['spam_content']
    };
  }

  // ==================== QUALITY FILTERING ====================

  private static applyQualityFilters(
    domains: DiscoveredDomain[],
    filters: QualityFilter[]
  ): DiscoveredDomain[] {
    return domains.filter(domain => {
      let qualityScore = 0;
      let criticalPass = true;

      for (const filter of filters) {
        const value = this.getDomainFilterValue(domain, filter.filter_name);
        const passes = value >= filter.min_value && value <= filter.max_value;

        if (filter.critical && !passes) {
          criticalPass = false;
          break;
        }

        if (passes) {
          qualityScore += filter.weight * 100;
        }
      }

      domain.quality_score = qualityScore;
      return criticalPass && qualityScore >= 60; // Minimum 60% quality score
    });
  }

  private static getDomainFilterValue(domain: DiscoveredDomain, filterName: string): number {
    switch (filterName) {
      case 'domain_authority':
      case 'platform_authority':
      case 'forum_authority':
        return domain.authority_score;
      case 'spam_score':
        return domain.metadata.spam_score || 0;
      case 'niche_relevance':
        return domain.metadata.niche_relevance || 50;
      case 'audience_size':
        return domain.metadata.audience_size || 0;
      case 'engagement_rate':
        return domain.metadata.engagement_rate || 0;
      case 'member_count':
        return domain.metadata.member_count || 0;
      case 'traffic_estimate':
        return domain.metadata.traffic_estimate || 0;
      default:
        return 50; // Default neutral value
    }
  }

  // ==================== DATABASE OPERATIONS ====================

  private static async storeDomains(
    domains: DiscoveredDomain[],
    tableName: string
  ): Promise<void> {
    try {
      for (const domain of domains) {
        const domainRecord = this.convertToTableFormat(domain, tableName);
        
        // Upsert domain to avoid duplicates
        await supabase
          .from(tableName)
          .upsert(domainRecord, { onConflict: 'domain' });

        // Store posting opportunities
        for (const opportunity of domain.posting_opportunities) {
          await supabase
            .from('link_opportunities')
            .upsert({
              campaign_id: null, // Will be set when used in campaign
              url: `${domain.base_url}/${opportunity.opportunity_type}`,
              type: opportunity.opportunity_type,
              discovery_method: domain.discovery_method,
              authority: domain.authority_score,
              relevance_score: domain.quality_score,
              estimated_cost: opportunity.cost_estimate,
              difficulty_score: this.getDifficultyScore(opportunity.difficulty_assessment),
              status: 'discovered',
              metadata: {
                domain_id: domain.id,
                automation_feasibility: opportunity.automation_feasibility,
                estimated_success_rate: opportunity.estimated_success_rate,
                posting_requirements: opportunity.posting_requirements,
                content_requirements: opportunity.content_requirements
              }
            }, { onConflict: 'url' });
        }
      }
    } catch (error: any) {
      console.error('Error storing domains:', error);
      throw error;
    }
  }

  private static convertToTableFormat(domain: DiscoveredDomain, tableName: string): any {
    const baseRecord = {
      domain: domain.domain,
      authority_score: domain.authority_score,
      status: 'active',
      success_count: domain.success_history.successes,
      failure_count: domain.success_history.failures,
      last_verified: domain.last_verified,
      discovered_at: new Date().toISOString(),
      niche_categories: domain.metadata.niche_categories || [],
      metadata: domain.metadata
    };

    // Add table-specific fields
    switch (tableName) {
      case 'blog_comment_domains':
        return {
          ...baseRecord,
          comment_system: domain.metadata.comment_system || 'custom',
          moderation_level: domain.metadata.moderation_level || 'medium',
          approval_rate: domain.metadata.approval_rate || 75,
          average_approval_time: domain.metadata.average_approval_time || 60
        };
      case 'web2_platform_domains':
        return {
          ...baseRecord,
          platform_name: domain.domain.split('.')[0],
          platform_type: domain.metadata.platform_type || 'blog',
          api_integration: domain.metadata.api_available || false,
          engagement_rate: domain.metadata.engagement_rate || 5
        };
      case 'forum_profile_domains':
        return {
          ...baseRecord,
          forum_name: domain.domain.split('.')[0],
          forum_software: domain.metadata.forum_software || 'custom',
          profile_link_allowed: domain.metadata.profile_links_allowed || true,
          post_requirement: domain.metadata.post_requirement || 0,
          member_count: domain.metadata.member_count || 1000
        };
      case 'guest_post_domains':
        return {
          ...baseRecord,
          site_name: domain.domain.split('.')[0],
          editor_email: domain.metadata.editor_email || '',
          acceptance_rate: domain.metadata.acceptance_rate || 20,
          average_response_time: domain.metadata.average_response_time || 7,
          payment_required: domain.metadata.payment_required || false
        };
      default:
        return baseRecord;
    }
  }

  private static getDifficultyScore(difficulty: string): number {
    const scores = { easy: 25, medium: 50, hard: 75, expert: 90 };
    return scores[difficulty as keyof typeof scores] || 50;
  }

  // ==================== UTILITY FUNCTIONS ====================

  private static async createDiscoveredDomain(
    engineType: string,
    domain: string,
    discoveryMethod: string,
    metadata: Record<string, any>
  ): Promise<DiscoveredDomain> {
    const domainId = `domain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const discoveredDomain: DiscoveredDomain = {
      id: domainId,
      engine_type: engineType,
      domain: domain,
      base_url: `https://${domain}`,
      discovery_method: discoveryMethod,
      authority_score: Math.floor(Math.random() * 60) + 20, // 20-80 range
      quality_score: 0, // Will be calculated by filters
      posting_opportunities: [],
      verification_status: 'pending',
      last_verified: new Date().toISOString(),
      success_history: {
        attempts: 0,
        successes: 0,
        failures: 0,
        last_success: '',
        last_failure: ''
      },
      automation_config: {
        enabled: true,
        priority: Math.floor(Math.random() * 10) + 1,
        retry_limit: 3,
        cooldown_hours: 24
      },
      metadata: {
        spam_score: Math.floor(Math.random() * 30),
        niche_relevance: Math.floor(Math.random() * 40) + 60,
        traffic_estimate: Math.floor(Math.random() * 100000) + 1000,
        ...metadata
      }
    };

    // Add posting opportunities
    discoveredDomain.posting_opportunities = await this.assessPostingCapabilities(
      domainId,
      engineType
    );

    return discoveredDomain;
  }

  // ==================== PUBLIC API ====================

  static getDiscoveryEngine(engineType: string): DomainDiscoveryEngine | null {
    return this.discoveryEngines.get(engineType) || null;
  }

  static getActiveScans(): Map<string, any> {
    return new Map(this.activeScans);
  }

  static async getDomainsByType(
    engineType: string,
    limit: number = 50
  ): Promise<DiscoveredDomain[]> {
    try {
      const engine = this.discoveryEngines.get(engineType);
      if (!engine) {
        throw new Error(`Unknown engine type: ${engineType}`);
      }

      const { data, error } = await supabase
        .from(engine.table_name)
        .select('*')
        .eq('status', 'active')
        .order('authority_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching domains by type:', error);
        return [];
      }

      // Convert to DiscoveredDomain format
      return data?.map(record => this.convertFromTableFormat(record, engineType)) || [];
    } catch (error) {
      console.error('Error in getDomainsByType:', error);
      return [];
    }
  }

  private static convertFromTableFormat(record: any, engineType: string): DiscoveredDomain {
    return {
      id: record.id,
      engine_type: engineType,
      domain: record.domain,
      base_url: `https://${record.domain}`,
      discovery_method: 'database_load',
      authority_score: record.authority_score || 0,
      quality_score: 85, // Default for stored domains
      posting_opportunities: [],
      verification_status: 'verified',
      last_verified: record.last_verified || new Date().toISOString(),
      success_history: {
        attempts: (record.success_count || 0) + (record.failure_count || 0),
        successes: record.success_count || 0,
        failures: record.failure_count || 0,
        last_success: record.last_successful_post || '',
        last_failure: ''
      },
      automation_config: {
        enabled: true,
        priority: 5,
        retry_limit: 3,
        cooldown_hours: 24
      },
      metadata: record.metadata || {}
    };
  }

  static cleanup(): void {
    this.activeScans.clear();
    this.discoveryCache.clear();
  }
}
