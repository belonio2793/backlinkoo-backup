/**
 * Live Campaign Management System
 * Handles real campaign execution with pause/start functionality and platform rotation
 * Replaces demo/mock systems with production-ready automation
 */

import { supabase } from '@/integrations/supabase/client';
import { productionContentTemplate } from './productionContentTemplate';
import { directAutomationExecutor } from './directAutomationExecutor';

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
}

class LiveCampaignManager {
  private activeCampaigns = new Map<string, LiveCampaign>();
  private executionTimers = new Map<string, NodeJS.Timeout>();
  private platformTargets: PlatformTarget[] = [];

  constructor() {
    this.initializePlatformTargets();
    this.loadActiveCampaigns();
  }

  /**
   * Initialize available platform targets for rotation
   */
  private initializePlatformTargets(): void {
    // Multiple publishing platforms for campaign rotation
    this.platformTargets = [
      {
        id: 'telegraph-1',
        domain: 'telegra.ph',
        name: 'Telegraph',
        domain_rating: 85,
        success_rate: 95,
        avg_response_time: 2000,
        is_active: true
      },
      {
        id: 'writeas-1',
        domain: 'write.as',
        name: 'Write.as',
        domain_rating: 75,
        success_rate: 90,
        avg_response_time: 2500,
        is_active: true
      },
      {
        id: 'rentry-1',
        domain: 'rentry.co',
        name: 'Rentry',
        domain_rating: 65,
        success_rate: 85,
        avg_response_time: 1800,
        is_active: true
      },
      {
        id: 'justpaste-1',
        domain: 'justpaste.it',
        name: 'JustPaste.it',
        domain_rating: 60,
        success_rate: 80,
        avg_response_time: 2200,
        is_active: true
      }
    ];
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
    try {
      // Get available platforms for this campaign
      const availablePlatforms = this.getAvailablePlatforms();
      
      const campaignData = {
        name: params.name,
        keywords: params.keywords,
        anchor_texts: params.anchor_texts,
        target_url: params.target_url,
        user_id: params.user_id,
        status: params.auto_start ? 'active' : 'draft',
        links_built: 0,
        available_sites: availablePlatforms.length,
        target_sites_used: [],
        auto_start: params.auto_start || false,
        published_articles: [],
        started_at: params.auto_start ? new Date().toISOString() : undefined
      };

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;

      const campaign: LiveCampaign = {
        ...data,
        published_articles: [],
        execution_progress: undefined
      };

      this.activeCampaigns.set(campaign.id, campaign);

      // Auto-start if requested
      if (params.auto_start) {
        await this.startCampaign(campaign.id);
      }

      return { success: true, campaign };
    } catch (error) {
      console.error('Failed to create campaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
   * Execute platform rotation for campaign
   */
  private async executePlatformRotation(campaignId: string): Promise<void> {
    const campaign = this.activeCampaigns.get(campaignId);
    if (!campaign || campaign.status !== 'active') {
      console.log(`Campaign ${campaignId} is not active, stopping execution`);
      return;
    }

    const availablePlatforms = this.getAvailablePlatforms();
    const progress = campaign.execution_progress;
    
    if (!progress || progress.completed_platforms >= progress.total_platforms) {
      // Campaign completed
      await this.completeCampaign(campaignId);
      return;
    }

    const currentPlatform = availablePlatforms[progress.current_rotation % availablePlatforms.length];
    console.log(`Executing campaign ${campaignId} on platform: ${currentPlatform.domain}`);

    try {
      // Update current platform in campaign
      campaign.current_platform = currentPlatform.domain;
      await this.updateCampaignInDatabase(campaign);

      // Generate and publish content
      const result = await this.executeOnPlatform(campaign, currentPlatform);

      if (result.success && result.article_url) {
        // Record successful publication
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

        // Update progress
        progress.completed_platforms++;
        progress.current_rotation++;

        console.log(`Successfully published article for campaign ${campaignId}: ${result.article_url}`);
      } else {
        console.warn(`Failed to publish on ${currentPlatform.domain} for campaign ${campaignId}: ${result.error}`);
        // Still increment rotation to try next platform
        progress.current_rotation++;
      }

      // Update campaign in database
      await this.updateCampaignInDatabase(campaign);

      // Check if campaign should continue
      if (progress.completed_platforms >= progress.total_platforms) {
        await this.completeCampaign(campaignId);
      } else if (campaign.status === 'active') {
        // Schedule next platform execution (with delay for rate limiting)
        const delay = 30000; // 30 seconds between platforms
        const timer = setTimeout(() => {
          this.executePlatformRotation(campaignId);
        }, delay);
        
        this.executionTimers.set(campaignId, timer);
      }

    } catch (error) {
      console.error(`Error executing campaign ${campaignId} on platform ${currentPlatform.domain}:`, error);
      
      // Continue to next platform after error
      if (progress) {
        progress.current_rotation++;
        await this.updateCampaignInDatabase(campaign);
        
        // Schedule retry with next platform
        const timer = setTimeout(() => {
          this.executePlatformRotation(campaignId);
        }, 60000); // 1 minute delay after error
        
        this.executionTimers.set(campaignId, timer);
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
    const { error } = await supabase
      .from('automation_campaigns')
      .update({
        status: campaign.status,
        links_built: campaign.links_built,
        target_sites_used: campaign.target_sites_used,
        current_platform: campaign.current_platform,
        execution_progress: campaign.execution_progress,
        published_articles: campaign.published_articles,
        started_at: campaign.started_at,
        completed_at: campaign.completed_at
      })
      .eq('id', campaign.id);

    if (error) {
      console.error('Failed to update campaign in database:', error);
      throw error;
    }
  }

  /**
   * Get available platforms for rotation
   */
  private getAvailablePlatforms(): PlatformTarget[] {
    return this.platformTargets.filter(platform => platform.is_active);
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
   * Get platform statistics
   */
  getPlatformStats(): Array<{
    platform: string;
    total_articles: number;
    success_rate: number;
    avg_word_count: number;
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

    return Array.from(platformStats.entries()).map(([platform, stats]) => ({
      platform,
      total_articles: stats.total,
      success_rate: (stats.successful / stats.total) * 100,
      avg_word_count: stats.total > 0 ? Math.round(stats.total_words / stats.total) : 0
    }));
  }
}

export const liveCampaignManager = new LiveCampaignManager();
export default liveCampaignManager;
