/**
 * Live Campaign Management System
 * Handles real campaign execution with pause/start functionality and platform rotation
 * Replaces demo/mock systems with production-ready automation
 */

import { supabase } from '@/integrations/supabase/client';
import { productionContentTemplate } from './productionContentTemplate';
import { directAutomationExecutor } from './directAutomationExecutor';
import { internalLogger } from './internalLogger';
import { errorResolver } from './errorResolver';

export interface LiveCampaign {
  id: string;
  name: string;
  keywords: string[];
  anchor_texts: string[];
  target_url: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  user_id: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  auto_start?: boolean;
  
  // Campaign metrics
  links_built: number;
  available_sites: number;
  target_sites_used: string[];
  
  // Execution tracking
  current_platform?: string;
  execution_progress?: {
    total_platforms: number;
    completed_platforms: number;
    current_rotation: number;
    started_at: number;
    estimated_completion?: number;
  };
  
  // Results tracking
  published_articles: Array<{
    title: string;
    url: string;
    platform: string;
    published_at: string;
    word_count: number;
    anchor_text_used: string;
  }>;
}

export interface CampaignExecutionResult {
  success: boolean;
  campaign_id: string;
  articles_published: number;
  total_platforms: number;
  execution_time_ms: number;
  published_links: Array<{
    title: string;
    url: string;
    platform: string;
    anchor_text: string;
  }>;
  error?: string;
}

export interface PlatformTarget {
  id: string;
  domain: string;
  name: string;
  domain_rating: number;
  success_rate: number;
  avg_response_time: number;
  is_active: boolean;
  last_used?: string;
  // Enhanced error tracking
  consecutive_failures: number;
  last_failure?: string;
  failure_reasons: Array<{
    timestamp: string;
    error: string;
    error_type: 'api_error' | 'network_error' | 'content_error' | 'auth_error' | 'rate_limit' | 'unknown';
  }>;
  total_attempts: number;
  total_successes: number;
  current_health_status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
  next_retry_after?: string;
}

class LiveCampaignManager {
  private activeCampaigns = new Map<string, LiveCampaign>();
  private executionTimers = new Map<string, NodeJS.Timeout>();
  private platformTargets: PlatformTarget[] = [];

  // Platform error handling configuration
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly PLATFORM_COOLDOWN_MINUTES = 30;
  private readonly MAX_RETRY_ATTEMPTS = 2;
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializePlatformTargets();
    this.loadActiveCampaigns();
  }

  /**
   * Initialize available platform targets for rotation
   */
  private initializePlatformTargets(): void {
    // Multiple publishing platforms for campaign rotation with enhanced error tracking
    this.platformTargets = [
      {
        id: 'telegraph-1',
        domain: 'telegra.ph',
        name: 'Telegraph',
        domain_rating: 85,
        success_rate: 95,
        avg_response_time: 2000,
        is_active: true,
        consecutive_failures: 0,
        failure_reasons: [],
        total_attempts: 0,
        total_successes: 0,
        current_health_status: 'healthy'
      },
      {
        id: 'writeas-1',
        domain: 'write.as',
        name: 'Write.as',
        domain_rating: 75,
        success_rate: 90,
        avg_response_time: 2500,
        is_active: true,
        consecutive_failures: 0,
        failure_reasons: [],
        total_attempts: 0,
        total_successes: 0,
        current_health_status: 'healthy'
      },
      {
        id: 'rentry-1',
        domain: 'rentry.co',
        name: 'Rentry',
        domain_rating: 65,
        success_rate: 85,
        avg_response_time: 1800,
        is_active: true,
        consecutive_failures: 0,
        failure_reasons: [],
        total_attempts: 0,
        total_successes: 0,
        current_health_status: 'healthy'
      },
      {
        id: 'justpaste-1',
        domain: 'justpaste.it',
        name: 'JustPaste.it',
        domain_rating: 60,
        success_rate: 80,
        avg_response_time: 2200,
        is_active: true,
        consecutive_failures: 0,
        failure_reasons: [],
        total_attempts: 0,
        total_successes: 0,
        current_health_status: 'healthy'
      }
    ];

    // Start periodic health checks
    this.startPlatformHealthMonitoring();
  }

  /**
   * Load active campaigns from database
   */
  private async loadActiveCampaigns(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .in('status', ['active', 'paused']);

      if (error) {
        console.error('Failed to load active campaigns:', error);
        return;
      }

      if (data) {
        data.forEach(campaign => {
          this.activeCampaigns.set(campaign.id, {
            ...campaign,
            published_articles: campaign.published_articles || [],
            execution_progress: campaign.execution_progress || undefined
          });
        });
      }
    } catch (error) {
      console.error('Error loading active campaigns:', error);
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(params: {
    name: string;
    keywords: string[];
    anchor_texts: string[];
    target_url: string;
    user_id: string;
    auto_start?: boolean;
  }): Promise<{ success: boolean; campaign?: LiveCampaign; error?: string }> {

    internalLogger.info('campaign_creation', 'Starting campaign creation process', {
      params: {
        ...params,
        keywords: Array.isArray(params.keywords) ? params.keywords : 'NOT_ARRAY',
        anchor_texts: Array.isArray(params.anchor_texts) ? params.anchor_texts : 'NOT_ARRAY'
      }
    });

    try {
      // Enhanced input parameter validation
      if (!Array.isArray(params.keywords)) {
        internalLogger.error('campaign_creation', 'Keywords is not an array', {
          keywords: params.keywords,
          type: typeof params.keywords,
          value: params.keywords
        });
        throw new Error('Keywords must be an array');
      }

      if (params.keywords.length === 0) {
        internalLogger.error('campaign_creation', 'Keywords array is empty', {
          keywords: params.keywords
        });
        throw new Error('Keywords array cannot be empty');
      }

      if (!Array.isArray(params.anchor_texts)) {
        internalLogger.error('campaign_creation', 'Anchor texts is not an array', {
          anchor_texts: params.anchor_texts,
          type: typeof params.anchor_texts,
          value: params.anchor_texts
        });
        throw new Error('Anchor texts must be an array');
      }

      if (params.anchor_texts.length === 0) {
        internalLogger.error('campaign_creation', 'Anchor texts array is empty', {
          anchor_texts: params.anchor_texts
        });
        throw new Error('Anchor texts array cannot be empty');
      }

      // Validate that all array elements are strings
      const invalidKeywords = params.keywords.filter(k => typeof k !== 'string' || !k.trim());
      if (invalidKeywords.length > 0) {
        internalLogger.error('campaign_creation', 'Invalid keywords found', {
          invalidKeywords,
          totalKeywords: params.keywords.length
        });
        throw new Error('All keywords must be non-empty strings');
      }

      const invalidAnchorTexts = params.anchor_texts.filter(a => typeof a !== 'string' || !a.trim());
      if (invalidAnchorTexts.length > 0) {
        internalLogger.error('campaign_creation', 'Invalid anchor texts found', {
          invalidAnchorTexts,
          totalAnchorTexts: params.anchor_texts.length
        });
        throw new Error('All anchor texts must be non-empty strings');
      }

      // Clean and validate arrays (they're already validated above, so this is just trimming)
      const cleanKeywords = params.keywords.map(k => k.trim()).filter(k => k.length > 0);
      const cleanAnchorTexts = params.anchor_texts.map(a => a.trim()).filter(a => a.length > 0);

      // This should never happen after the validation above, but be safe
      if (cleanKeywords.length === 0) {
        internalLogger.error('campaign_creation', 'No valid keywords after cleaning', {
          originalKeywords: params.keywords,
          cleanedKeywords: cleanKeywords
        });
        throw new Error('No valid keywords provided after cleaning');
      }
      if (cleanAnchorTexts.length === 0) {
        internalLogger.error('campaign_creation', 'No valid anchor texts after cleaning', {
          originalAnchorTexts: params.anchor_texts,
          cleanedAnchorTexts: cleanAnchorTexts
        });
        throw new Error('No valid anchor texts provided after cleaning');
      }

      internalLogger.info('campaign_creation', 'Arrays validated and cleaned', {
        originalKeywords: params.keywords.length,
        cleanKeywords: cleanKeywords.length,
        originalAnchorTexts: params.anchor_texts.length,
        cleanAnchorTexts: cleanAnchorTexts.length
      });

      // Get available platforms for this campaign
      const availablePlatforms = this.getAvailablePlatforms();
      internalLogger.debug('campaign_creation', 'Available platforms retrieved', { count: availablePlatforms.length });

      // Base campaign data that should exist in all schema versions
      // Use cleaned arrays that have been validated
      let campaignData: any = {
        name: params.name,
        engine_type: 'web2_platforms', // Required field based on schema
        keywords: cleanKeywords, // Use cleaned keywords array
        anchor_texts: cleanAnchorTexts, // Use cleaned anchor texts array
        target_url: params.target_url,
        user_id: params.user_id,
        status: params.auto_start ? 'active' : 'draft',
        auto_start: params.auto_start || false,
      };

      internalLogger.debug('campaign_creation', 'Base campaign data prepared', { campaignData });

      // Add optional columns if they exist in the schema
      try {
        internalLogger.debug('campaign_creation', 'Testing schema columns existence');

        // Test if the new columns exist by trying a select
        const { error: testError } = await supabase
          .from('automation_campaigns')
          .select('links_built, available_sites, target_sites_used, published_articles, started_at')
          .limit(1);

        if (!testError) {
          internalLogger.info('campaign_creation', 'New schema detected, adding extended fields');

          // New schema with all columns - ensure proper data types
          campaignData = {
            ...campaignData,
            links_built: 0,
            available_sites: availablePlatforms.length,
            target_sites_used: [], // PostgreSQL TEXT[] array - must be empty array, not null
            published_articles: [], // JSONB array - must be empty array, not null
            started_at: params.auto_start ? new Date().toISOString() : null
          };

          // Verify array types before sending to database
          if (!Array.isArray(campaignData.keywords)) {
            throw new Error(`Keywords is not an array: ${typeof campaignData.keywords}`);
          }
          if (!Array.isArray(campaignData.anchor_texts)) {
            throw new Error(`Anchor texts is not an array: ${typeof campaignData.anchor_texts}`);
          }
          if (!Array.isArray(campaignData.target_sites_used)) {
            throw new Error(`Target sites used is not an array: ${typeof campaignData.target_sites_used}`);
          }
          if (!Array.isArray(campaignData.published_articles)) {
            throw new Error(`Published articles is not an array: ${typeof campaignData.published_articles}`);
          }

          internalLogger.debug('campaign_creation', 'Extended campaign data prepared', { campaignData });
        } else {
          internalLogger.warn('campaign_creation', 'Schema test failed, using basic schema', { testError });

          // Try to resolve schema issues automatically
          internalLogger.info('campaign_creation', 'Attempting automatic schema resolution');
          const resolved = await errorResolver.resolveSpecificError('column does not exist');

          if (resolved) {
            internalLogger.info('campaign_creation', 'Schema resolution successful, retrying with extended fields');
            campaignData = {
              ...campaignData,
              links_built: 0,
              available_sites: availablePlatforms.length,
              target_sites_used: [], // Empty array, not null
              published_articles: [], // Empty array, not null
              started_at: params.auto_start ? new Date().toISOString() : null
            };

            // Double-check array types after resolution
            if (!Array.isArray(campaignData.target_sites_used)) {
              campaignData.target_sites_used = [];
            }
            if (!Array.isArray(campaignData.published_articles)) {
              campaignData.published_articles = [];
            }
          } else {
            // Old schema - add started_at if it exists
            if (params.auto_start) {
              campaignData.started_at = new Date().toISOString();
            }
          }
        }
      } catch (e) {
        internalLogger.error('campaign_creation', 'Schema preparation exception', { error: e });

        // Fallback for very old schema
        if (params.auto_start) {
          try {
            campaignData.started_at = new Date().toISOString();
          } catch {
            internalLogger.warn('campaign_creation', 'Could not add started_at field');
          }
        }
      }

      // Final validation before database insert
      const dataValidation = {
        keywords: {
          is_array: Array.isArray(campaignData.keywords),
          length: Array.isArray(campaignData.keywords) ? campaignData.keywords.length : 0,
          all_strings: Array.isArray(campaignData.keywords) ? campaignData.keywords.every(k => typeof k === 'string') : false,
          sample: Array.isArray(campaignData.keywords) ? campaignData.keywords.slice(0, 2) : []
        },
        anchor_texts: {
          is_array: Array.isArray(campaignData.anchor_texts),
          length: Array.isArray(campaignData.anchor_texts) ? campaignData.anchor_texts.length : 0,
          all_strings: Array.isArray(campaignData.anchor_texts) ? campaignData.anchor_texts.every(a => typeof a === 'string') : false,
          sample: Array.isArray(campaignData.anchor_texts) ? campaignData.anchor_texts.slice(0, 2) : []
        },
        target_sites_used: {
          is_array: Array.isArray(campaignData.target_sites_used),
          length: Array.isArray(campaignData.target_sites_used) ? campaignData.target_sites_used.length : 0
        },
        published_articles: {
          is_array: Array.isArray(campaignData.published_articles),
          length: Array.isArray(campaignData.published_articles) ? campaignData.published_articles.length : 0
        }
      };

      internalLogger.info('campaign_creation', 'Attempting database insert with validation', {
        dataValidation,
        campaignName: campaignData.name,
        engineType: campaignData.engine_type,
        userId: campaignData.user_id
      });

      let { data, error } = await supabase
        .from('automation_campaigns')
        .insert(campaignData)
        .select()
        .single();

      internalLogger.debug('campaign_creation', 'Database insert completed', {
        success: !error,
        hasData: !!data,
        errorInfo: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        // Enhanced error logging with more context
        const errorContext = {
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          attemptedData: {
            name: campaignData.name,
            engine_type: campaignData.engine_type,
            keywords_info: {
              type: Array.isArray(campaignData.keywords) ? 'array' : typeof campaignData.keywords,
              length: Array.isArray(campaignData.keywords) ? campaignData.keywords.length : 'N/A',
              sample: Array.isArray(campaignData.keywords) ? campaignData.keywords.slice(0, 2) : 'N/A'
            },
            anchor_texts_info: {
              type: Array.isArray(campaignData.anchor_texts) ? 'array' : typeof campaignData.anchor_texts,
              length: Array.isArray(campaignData.anchor_texts) ? campaignData.anchor_texts.length : 'N/A',
              sample: Array.isArray(campaignData.anchor_texts) ? campaignData.anchor_texts.slice(0, 2) : 'N/A'
            },
            other_arrays: {
              target_sites_used: Array.isArray(campaignData.target_sites_used),
              published_articles: Array.isArray(campaignData.published_articles)
            }
          }
        };

        internalLogger.error('campaign_creation', 'Database insert failed', errorContext);

        // Attempt automatic error resolution
        internalLogger.info('campaign_creation', 'Attempting automatic error resolution');

        // Try to resolve based on specific error types
        let resolved = false;
        if (error.message.includes('expected JSON array')) {
          internalLogger.info('campaign_creation', 'JSON array error detected, attempting schema fix');
          resolved = await errorResolver.resolveSpecificError('expected JSON array');
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          internalLogger.info('campaign_creation', 'Missing column error detected, attempting schema fix');
          resolved = await errorResolver.resolveSpecificError(error.message);
        } else {
          internalLogger.info('campaign_creation', 'General error resolution attempt');
          resolved = await errorResolver.resolveSpecificError(error.message);
        }

        if (resolved) {
          internalLogger.info('campaign_creation', 'Error resolved, retrying insert with fresh data');

          // Create a fresh copy of campaign data to ensure no corruption
          const freshCampaignData = {
            name: params.name,
            engine_type: 'web2_platforms',
            keywords: cleanKeywords,
            anchor_texts: cleanAnchorTexts,
            target_url: params.target_url,
            user_id: params.user_id,
            status: params.auto_start ? 'active' : 'draft',
            auto_start: params.auto_start || false,
            links_built: 0,
            available_sites: availablePlatforms.length,
            target_sites_used: [],
            published_articles: [],
            started_at: params.auto_start ? new Date().toISOString() : null
          };

          // Retry the insert with fresh data
          const { data: retryData, error: retryError } = await supabase
            .from('automation_campaigns')
            .insert(freshCampaignData)
            .select()
            .single();

          if (!retryError && retryData) {
            internalLogger.info('campaign_creation', 'Retry successful after error resolution');
            data = retryData;
            error = null;
          } else {
            internalLogger.error('campaign_creation', 'Retry failed after error resolution', {
              retryError,
              freshDataUsed: freshCampaignData
            });
            throw retryError || error;
          }
        } else {
          internalLogger.error('campaign_creation', 'Error resolution failed, throwing original error');
          throw error;
        }
      }

      const campaign: LiveCampaign = {
        ...data,
        // Provide defaults for potentially missing columns
        links_built: data.links_built ?? 0,
        available_sites: data.available_sites ?? availablePlatforms.length,
        target_sites_used: data.target_sites_used ?? [],
        published_articles: data.published_articles ?? [],
        current_platform: data.current_platform ?? undefined,
        execution_progress: data.execution_progress ?? undefined
      };

      internalLogger.info('campaign_creation', 'Campaign object created successfully', {
        campaignId: campaign.id,
        campaignName: campaign.name
      });

      this.activeCampaigns.set(campaign.id, campaign);

      // Auto-start if requested
      if (params.auto_start) {
        internalLogger.info('campaign_creation', 'Auto-starting campaign', { campaignId: campaign.id });
        await this.startCampaign(campaign.id);
      }

      internalLogger.info('campaign_creation', 'Campaign creation completed successfully', {
        campaignId: campaign.id,
        autoStarted: params.auto_start
      });

      return { success: true, campaign };
    } catch (error) {
      let errorMessage = 'Unknown error';
      let errorCategory = 'unknown';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Categorize known errors
        if (errorMessage.includes('expected JSON array')) {
          errorCategory = 'json_array_error';
          errorMessage = 'Database expects array format for keywords/anchor texts';
        } else if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
          errorCategory = 'missing_column';
          errorMessage = 'Database schema is missing required columns';
        } else if (errorMessage.includes('permission denied') || errorMessage.includes('policy violation')) {
          errorCategory = 'permission_error';
          errorMessage = 'Database permission issue';
        } else if (errorMessage.includes('duplicate key')) {
          errorCategory = 'duplicate_key';
          errorMessage = 'Campaign with similar data already exists';
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.error || errorObj.details ||
                      'Campaign creation failed with no additional details';
      }

      internalLogger.critical('campaign_creation', 'Campaign creation failed completely', {
        originalError: error,
        errorMessage,
        errorCategory,
        params: {
          ...params,
          keywords_validation: {
            is_array: Array.isArray(params.keywords),
            length: Array.isArray(params.keywords) ? params.keywords.length : 'N/A',
            sample: Array.isArray(params.keywords) ? params.keywords.slice(0, 2) : 'N/A'
          },
          anchor_texts_validation: {
            is_array: Array.isArray(params.anchor_texts),
            length: Array.isArray(params.anchor_texts) ? params.anchor_texts.length : 'N/A',
            sample: Array.isArray(params.anchor_texts) ? params.anchor_texts.slice(0, 2) : 'N/A'
          }
        },
        stackTrace: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Start campaign execution with platform rotation
   */
  async startCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = this.activeCampaigns.get(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      if (campaign.status === 'active') {
        return { success: false, error: 'Campaign is already active' };
      }

      // Update campaign status to active
      await this.updateCampaignStatus(campaignId, 'active');
      
      // Initialize execution progress
      const availablePlatforms = this.getAvailablePlatforms();
      const executionProgress = {
        total_platforms: availablePlatforms.length,
        completed_platforms: 0,
        current_rotation: 0,
        started_at: Date.now(),
        estimated_completion: Date.now() + (availablePlatforms.length * 60000) // Estimate 1 min per platform
      };

      campaign.execution_progress = executionProgress;
      campaign.started_at = new Date().toISOString();

      // Start platform rotation execution
      this.executePlatformRotation(campaignId);

      return { success: true };
    } catch (error) {
      console.error('Failed to start campaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Pause campaign execution
   */
  async pauseCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear any running timers
      const timer = this.executionTimers.get(campaignId);
      if (timer) {
        clearTimeout(timer);
        this.executionTimers.delete(campaignId);
      }

      // Update campaign status
      await this.updateCampaignStatus(campaignId, 'paused');

      const campaign = this.activeCampaigns.get(campaignId);
      if (campaign && campaign.execution_progress) {
        // Preserve execution progress for potential resume
        campaign.execution_progress.estimated_completion = undefined;
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute platform rotation for campaign with enhanced error handling and platform skipping
   */
  private async executePlatformRotation(campaignId: string): Promise<void> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign || campaign.status !== 'active') {
      internalLogger.info('platform_rotation', `Campaign ${campaignId} is not active, stopping execution`);
      return;
    }

    const progress = campaign.execution_progress;
    if (!progress || progress.completed_platforms >= progress.total_platforms) {
      await this.completeCampaign(campaignId);
      return;
    }

    // Get healthy platforms first, then fallback to all if none are healthy
    const healthyPlatforms = this.getHealthyPlatforms();
    const availablePlatforms = healthyPlatforms.length > 0 ? healthyPlatforms : this.getAvailablePlatforms();

    if (availablePlatforms.length === 0) {
      internalLogger.error('platform_rotation', `No available platforms for campaign ${campaignId}`);
      await this.pauseCampaign(campaignId);
      return;
    }

    // Try to find the next working platform
    let attemptedPlatforms = 0;
    let maxAttempts = Math.min(availablePlatforms.length * 2, 10); // Prevent infinite loops

    while (attemptedPlatforms < maxAttempts && campaign.status === 'active') {
      const platformIndex = progress.current_rotation % availablePlatforms.length;
      const currentPlatform = availablePlatforms[platformIndex];

      internalLogger.info('platform_rotation', `Attempting campaign ${campaignId} on platform: ${currentPlatform.domain}`, {
        platformHealth: currentPlatform.current_health_status,
        consecutiveFailures: currentPlatform.consecutive_failures,
        attemptNumber: attemptedPlatforms + 1
      });

      // Check if platform is in cooldown
      if (this.isPlatformInCooldown(currentPlatform)) {
        internalLogger.warn('platform_rotation', `Platform ${currentPlatform.domain} is in cooldown, skipping`);
        progress.current_rotation++;
        attemptedPlatforms++;
        continue;
      }

      try {
        // Update current platform in campaign
        campaign.current_platform = currentPlatform.domain;
        await this.updateCampaignInDatabase(campaign);

        // Execute on platform with retry logic
        const result = await this.executeOnPlatformWithRetry(campaign, currentPlatform);

        if (result.success && result.article_url) {
          // Record successful publication
          await this.recordPlatformSuccess(currentPlatform, result);

          const publishedArticle = {
            title: result.article_title || 'Generated Article',
            url: result.article_url,
            platform: currentPlatform.domain,
            published_at: new Date().toISOString(),
            word_count: result.word_count || 0,
            anchor_text_used: result.anchor_text_used || ''
          };

          campaign.published_articles.push(publishedArticle);
          campaign.links_built = campaign.published_articles.length;

          if (!campaign.target_sites_used.includes(currentPlatform.domain)) {
            campaign.target_sites_used.push(currentPlatform.domain);
          }

          progress.completed_platforms++;
          progress.current_rotation++;

          internalLogger.info('platform_rotation', `Successfully published article for campaign ${campaignId}`, {
            url: result.article_url,
            platform: currentPlatform.domain,
            wordCount: result.word_count
          });

          // Update campaign in database
          await this.updateCampaignInDatabase(campaign);

          // Success! Continue to next cycle
          break;
        } else {
          // Record platform failure
          await this.recordPlatformFailure(currentPlatform, result.error || 'Unknown error', result.error_type || 'unknown');

          internalLogger.warn('platform_rotation', `Failed to publish on ${currentPlatform.domain}`, {
            campaignId,
            error: result.error,
            errorType: result.error_type,
            platformHealth: currentPlatform.current_health_status
          });

          progress.current_rotation++;
          attemptedPlatforms++;
        }
      } catch (error) {
        // Record platform error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.recordPlatformFailure(currentPlatform, errorMessage, 'unknown');

        internalLogger.error('platform_rotation', `Error executing campaign on platform ${currentPlatform.domain}`, {
          campaignId,
          error: errorMessage,
          platformHealth: currentPlatform.current_health_status
        });

        progress.current_rotation++;
        attemptedPlatforms++;
      }
    }

    // Update campaign in database
    await this.updateCampaignInDatabase(campaign);

    // Check if campaign should continue
    if (progress.completed_platforms >= progress.total_platforms) {
      await this.completeCampaign(campaignId);
    } else if (campaign.status === 'active') {
      if (attemptedPlatforms >= maxAttempts) {
        // All platforms failed, wait longer before next attempt
        internalLogger.warn('platform_rotation', `All platforms failed for campaign ${campaignId}, extending delay`);

        const delay = 5 * 60 * 1000; // 5 minutes delay when all platforms fail
        const timer = setTimeout(() => {
          this.executePlatformRotation(campaignId);
        }, delay);

        this.executionTimers.set(campaignId, timer);
      } else {
        // Continue with normal delay
        const delay = 30000; // 30 seconds between successful attempts
        const timer = setTimeout(() => {
          this.executePlatformRotation(campaignId);
        }, delay);

        this.executionTimers.set(campaignId, timer);
      }
    }
  }

  /**
   * Get healthy platforms that are available for use
   */
  private getHealthyPlatforms(): PlatformTarget[] {
    return this.platformTargets.filter(platform =>
      platform.is_active &&
      platform.current_health_status === 'healthy' &&
      !this.isPlatformInCooldown(platform)
    );
  }

  /**
   * Check if platform is in cooldown period after failures
   */
  private isPlatformInCooldown(platform: PlatformTarget): boolean {
    if (!platform.next_retry_after) return false;
    return new Date() < new Date(platform.next_retry_after);
  }

  /**
   * Record platform success and update health metrics
   */
  private async recordPlatformSuccess(platform: PlatformTarget, result: any): Promise<void> {
    platform.total_attempts++;
    platform.total_successes++;
    platform.consecutive_failures = 0;
    platform.last_used = new Date().toISOString();
    platform.next_retry_after = undefined;

    // Update success rate
    platform.success_rate = (platform.total_successes / platform.total_attempts) * 100;

    // Update health status
    if (platform.success_rate >= 80) {
      platform.current_health_status = 'healthy';
    } else if (platform.success_rate >= 60) {
      platform.current_health_status = 'degraded';
    } else {
      platform.current_health_status = 'unhealthy';
    }

    internalLogger.info('platform_health', `Platform success recorded`, {
      platform: platform.domain,
      successRate: platform.success_rate,
      healthStatus: platform.current_health_status,
      totalAttempts: platform.total_attempts
    });
  }

  /**
   * Record platform failure and update health metrics
   */
  private async recordPlatformFailure(platform: PlatformTarget, error: string, errorType: string): Promise<void> {
    platform.total_attempts++;
    platform.consecutive_failures++;
    platform.last_failure = new Date().toISOString();

    // Add to failure history (keep last 10 failures)
    platform.failure_reasons.push({
      timestamp: new Date().toISOString(),
      error,
      error_type: errorType as any
    });

    if (platform.failure_reasons.length > 10) {
      platform.failure_reasons = platform.failure_reasons.slice(-10);
    }

    // Update success rate
    platform.success_rate = (platform.total_successes / platform.total_attempts) * 100;

    // Update health status and cooldown
    if (platform.consecutive_failures >= this.MAX_CONSECUTIVE_FAILURES) {
      platform.current_health_status = 'unhealthy';
      // Set cooldown period
      const cooldownMs = this.PLATFORM_COOLDOWN_MINUTES * 60 * 1000;
      platform.next_retry_after = new Date(Date.now() + cooldownMs).toISOString();

      internalLogger.warn('platform_health', `Platform ${platform.domain} marked as unhealthy and placed in cooldown`, {
        consecutiveFailures: platform.consecutive_failures,
        cooldownUntil: platform.next_retry_after,
        error,
        errorType
      });
    } else if (platform.success_rate < 60) {
      platform.current_health_status = 'degraded';
    } else if (platform.success_rate < 80) {
      platform.current_health_status = 'degraded';
    }

    internalLogger.error('platform_health', `Platform failure recorded`, {
      platform: platform.domain,
      error,
      errorType,
      consecutiveFailures: platform.consecutive_failures,
      successRate: platform.success_rate,
      healthStatus: platform.current_health_status
    });
  }

  /**
   * Execute on platform with retry logic
   */
  private async executeOnPlatformWithRetry(campaign: LiveCampaign, platform: PlatformTarget): Promise<{
    success: boolean;
    article_title?: string;
    article_url?: string;
    word_count?: number;
    anchor_text_used?: string;
    error?: string;
    error_type?: string;
  }> {
    let lastError = '';
    let lastErrorType = 'unknown';

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        internalLogger.debug('platform_execution', `Attempt ${attempt} for platform ${platform.domain}`, {
          campaignId: campaign.id,
          platform: platform.domain
        });

        const result = await this.executeOnPlatform(campaign, platform);

        if (result.success) {
          return result;
        } else {
          lastError = result.error || 'Unknown error';
          lastErrorType = this.classifyError(lastError);

          // Don't retry certain error types
          if (lastErrorType === 'auth_error' || lastErrorType === 'content_error') {
            break;
          }

          if (attempt < this.MAX_RETRY_ATTEMPTS) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        lastErrorType = this.classifyError(lastError);

        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      error_type: lastErrorType
    };
  }

  /**
   * Classify error type for better handling
   */
  private classifyError(error: string): 'api_error' | 'network_error' | 'content_error' | 'auth_error' | 'rate_limit' | 'unknown' {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('auth') || errorLower.includes('unauthorized') || errorLower.includes('forbidden')) {
      return 'auth_error';
    }
    if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
      return 'rate_limit';
    }
    if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection')) {
      return 'network_error';
    }
    if (errorLower.includes('content') || errorLower.includes('invalid') || errorLower.includes('format')) {
      return 'content_error';
    }
    if (errorLower.includes('api') || errorLower.includes('server error') || errorLower.includes('500')) {
      return 'api_error';
    }

    return 'unknown';
  }

  /**
   * Start periodic platform health monitoring
   */
  private startPlatformHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Perform periodic health check on platforms
   */
  private async performHealthCheck(): Promise<void> {
    internalLogger.info('platform_health', 'Performing periodic health check');

    for (const platform of this.platformTargets) {
      // Reset platforms that have been in cooldown long enough
      if (platform.next_retry_after && new Date() > new Date(platform.next_retry_after)) {
        platform.next_retry_after = undefined;
        platform.consecutive_failures = Math.max(0, platform.consecutive_failures - 1);

        // Improve health status if failures have been reset
        if (platform.consecutive_failures === 0 && platform.success_rate >= 60) {
          platform.current_health_status = platform.success_rate >= 80 ? 'healthy' : 'degraded';

          internalLogger.info('platform_health', `Platform ${platform.domain} recovered from cooldown`, {
            healthStatus: platform.current_health_status,
            successRate: platform.success_rate
          });
        }
      }
    }
  }

  /**
   * Execute content generation and publishing on specific platform
   */
  private async executeOnPlatform(campaign: LiveCampaign, platform: PlatformTarget): Promise<{
    success: boolean;
    article_title?: string;
    article_url?: string;
    word_count?: number;
    anchor_text_used?: string;
    error?: string;
  }> {
    try {
      // Select random keyword and anchor text for this execution
      const selectedKeyword = campaign.keywords[Math.floor(Math.random() * campaign.keywords.length)];
      const selectedAnchorText = campaign.anchor_texts[Math.floor(Math.random() * campaign.anchor_texts.length)];

      console.log(`Generating content for campaign ${campaign.id}:`, {
        keyword: selectedKeyword,
        anchor_text: selectedAnchorText,
        platform: platform.domain
      });

      // Use direct automation executor for content generation and publishing
      const result = await directAutomationExecutor.executeWorkflow({
        keywords: [selectedKeyword],
        anchor_texts: [selectedAnchorText],
        target_url: campaign.target_url,
        user_id: campaign.user_id
      });

      if (result.success) {
        return {
          success: true,
          article_title: result.article_title,
          article_url: result.article_url,
          word_count: result.word_count,
          anchor_text_used: selectedAnchorText
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown execution error'
        };
      }
    } catch (error) {
      console.error('Platform execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete campaign execution
   */
  private async completeCampaign(campaignId: string): Promise<void> {
    try {
      const campaign = this.activeCampaigns.get(campaignId);
      if (!campaign) return;

      // Clear any running timers
      const timer = this.executionTimers.get(campaignId);
      if (timer) {
        clearTimeout(timer);
        this.executionTimers.delete(campaignId);
      }

      // Update campaign status to completed
      campaign.status = 'completed';
      campaign.completed_at = new Date().toISOString();
      campaign.current_platform = undefined;

      await this.updateCampaignInDatabase(campaign);

      console.log(`Campaign ${campaignId} completed successfully. Published ${campaign.links_built} articles.`);
    } catch (error) {
      console.error(`Failed to complete campaign ${campaignId}:`, error);
    }
  }

  /**
   * Update campaign status in database
   */
  private async updateCampaignStatus(campaignId: string, status: LiveCampaign['status']): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'active') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('automation_campaigns')
      .update(updateData)
      .eq('id', campaignId);

    if (error) {
      console.error('Failed to update campaign status:', error);
      throw error;
    }

    // Update local cache
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign) {
      campaign.status = status;
      if (updateData.started_at) campaign.started_at = updateData.started_at;
      if (updateData.completed_at) campaign.completed_at = updateData.completed_at;
    }
  }

  /**
   * Update complete campaign data in database
   */
  private async updateCampaignInDatabase(campaign: LiveCampaign): Promise<void> {
    // Ensure all arrays are valid before sending to database
    const publishedArticles = Array.isArray(campaign.published_articles) ? campaign.published_articles : [];
    const targetSitesUsed = Array.isArray(campaign.target_sites_used) ? campaign.target_sites_used : [];
    const executionProgress = campaign.execution_progress && typeof campaign.execution_progress === 'object' ? campaign.execution_progress : {};

    const updateData = {
      status: campaign.status,
      links_built: campaign.links_built,
      target_sites_used: targetSitesUsed, // Ensure it's an array
      current_platform: campaign.current_platform,
      execution_progress: executionProgress, // Ensure it's an object
      published_articles: publishedArticles, // Ensure it's an array
      started_at: campaign.started_at,
      completed_at: campaign.completed_at
    };

    // Validate data types before update
    if (!Array.isArray(updateData.target_sites_used)) {
      internalLogger.warn('campaign_update', 'target_sites_used is not an array, fixing', {
        campaignId: campaign.id,
        type: typeof updateData.target_sites_used,
        value: updateData.target_sites_used
      });
      updateData.target_sites_used = [];
    }

    if (!Array.isArray(updateData.published_articles)) {
      internalLogger.warn('campaign_update', 'published_articles is not an array, fixing', {
        campaignId: campaign.id,
        type: typeof updateData.published_articles,
        value: updateData.published_articles
      });
      updateData.published_articles = [];
    }

    internalLogger.debug('campaign_update', 'Updating campaign in database', {
      campaignId: campaign.id,
      status: campaign.status,
      publishedArticlesCount: publishedArticles.length,
      targetSitesUsedCount: targetSitesUsed.length,
      dataValidation: {
        published_articles_is_array: Array.isArray(updateData.published_articles),
        target_sites_used_is_array: Array.isArray(updateData.target_sites_used),
        execution_progress_is_object: typeof updateData.execution_progress === 'object'
      }
    });

    const { error } = await supabase
      .from('automation_campaigns')
      .update(updateData)
      .eq('id', campaign.id);

    if (error) {
      internalLogger.error('campaign_update', 'Failed to update campaign in database', {
        campaignId: campaign.id,
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        },
        updateData
      });
      throw error;
    }
  }

  /**
   * Get available platforms for rotation (includes degraded platforms as fallback)
   */
  private getAvailablePlatforms(): PlatformTarget[] {
    return this.platformTargets.filter(platform =>
      platform.is_active &&
      platform.current_health_status !== 'disabled'
    ).sort((a, b) => {
      // Sort by health status (healthy first, then degraded, then unhealthy)
      const healthOrder = { 'healthy': 0, 'degraded': 1, 'unhealthy': 2, 'disabled': 3 };
      const aOrder = healthOrder[a.current_health_status] || 3;
      const bOrder = healthOrder[b.current_health_status] || 3;

      if (aOrder !== bOrder) return aOrder - bOrder;

      // Then sort by success rate
      return b.success_rate - a.success_rate;
    });
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): LiveCampaign | undefined {
    return this.activeCampaigns.get(campaignId);
  }

  /**
   * Get all campaigns for a user
   */
  async getUserCampaigns(userId: string): Promise<LiveCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(campaign => ({
        ...campaign,
        published_articles: campaign.published_articles || [],
        execution_progress: campaign.execution_progress || undefined
      })) || [];
    } catch (error) {
      console.error('Failed to get user campaigns:', error);
      return [];
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Stop execution if running
      await this.pauseCampaign(campaignId);

      // Delete from database
      const { error } = await supabase
        .from('automation_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (error) throw error;

      // Remove from local cache
      this.activeCampaigns.delete(campaignId);

      return { success: true };
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get campaign execution statistics
   */
  getCampaignStats(campaignId: string): {
    articles_published: number;
    platforms_used: number;
    total_word_count: number;
    avg_execution_time: number;
    success_rate: number;
  } | null {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign) return null;

    const articles = campaign.published_articles;
    const totalWordCount = articles.reduce((sum, article) => sum + article.word_count, 0);
    const platformsUsed = new Set(articles.map(article => article.platform)).size;

    return {
      articles_published: articles.length,
      platforms_used: platformsUsed,
      total_word_count: totalWordCount,
      avg_execution_time: 0, // TODO: Track execution times
      success_rate: campaign.execution_progress ? 
        (articles.length / campaign.execution_progress.current_rotation) * 100 : 0
    };
  }

  /**
   * Get platform health status for monitoring
   */
  getPlatformHealthStatus(): Array<{
    platform: string;
    domain: string;
    health_status: string;
    success_rate: number;
    consecutive_failures: number;
    total_attempts: number;
    total_successes: number;
    last_failure?: string;
    next_retry_after?: string;
    is_in_cooldown: boolean;
    recent_errors: Array<{
      timestamp: string;
      error: string;
      error_type: string;
    }>;
  }> {
    return this.platformTargets.map(platform => ({
      platform: platform.name,
      domain: platform.domain,
      health_status: platform.current_health_status,
      success_rate: Math.round(platform.success_rate * 100) / 100,
      consecutive_failures: platform.consecutive_failures,
      total_attempts: platform.total_attempts,
      total_successes: platform.total_successes,
      last_failure: platform.last_failure,
      next_retry_after: platform.next_retry_after,
      is_in_cooldown: this.isPlatformInCooldown(platform),
      recent_errors: platform.failure_reasons.slice(-5) // Last 5 errors
    }));
  }

  /**
   * Get platform statistics with enhanced health metrics
   */
  getPlatformStats(): Array<{
    platform: string;
    total_articles: number;
    success_rate: number;
    avg_word_count: number;
    health_status: string;
    consecutive_failures: number;
    is_available: boolean;
  }> {
    const platformStats = new Map<string, {
      total: number;
      successful: number;
      total_words: number;
    }>();

    // Aggregate stats from all campaigns
    this.activeCampaigns.forEach(campaign => {
      campaign.published_articles.forEach(article => {
        const stats = platformStats.get(article.platform) || {
          total: 0,
          successful: 0,
          total_words: 0
        };
        
        stats.total++;
        stats.successful++;
        stats.total_words += article.word_count;
        
        platformStats.set(article.platform, stats);
      });
    });

    return Array.from(platformStats.entries()).map(([platformDomain, stats]) => {
      const platformConfig = this.platformTargets.find(p => p.domain === platformDomain);
      return {
        platform: platformDomain,
        total_articles: stats.total,
        success_rate: (stats.successful / stats.total) * 100,
        avg_word_count: stats.total > 0 ? Math.round(stats.total_words / stats.total) : 0,
        health_status: platformConfig?.current_health_status || 'unknown',
        consecutive_failures: platformConfig?.consecutive_failures || 0,
        is_available: platformConfig ?
          platformConfig.is_active &&
          platformConfig.current_health_status !== 'disabled' &&
          !this.isPlatformInCooldown(platformConfig) : false
      };
    });
  }
}

export const liveCampaignManager = new LiveCampaignManager();
export default liveCampaignManager;
