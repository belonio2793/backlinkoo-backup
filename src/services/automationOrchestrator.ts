import { supabase } from '@/integrations/supabase/client';
import { getContentService, type ContentGenerationParams } from './automationContentService';
import { getTelegraphService } from './telegraphService';
import { workingCampaignProcessor } from './workingCampaignProcessor';
import { ProgressStep, CampaignProgress } from '@/components/CampaignProgressTracker';
import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';
import { realTimeFeedService } from './realTimeFeedService';
import { campaignNetworkLogger } from './campaignNetworkLogger';
import { PlatformConfigService, AVAILABLE_PLATFORMS, type PublishingPlatform } from './platformConfigService';
// Removed campaignErrorHandler import - using simplified error handling

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface CampaignProgressInfo {
  campaign_id: string;
  current_step: string;
  total_steps: number;
  completed_steps: number;
  status: string;
  error?: string;
}

// Re-export platform types and constants from centralized service
export type { PublishingPlatform } from './platformConfigService';
export { AVAILABLE_PLATFORMS } from './platformConfigService';

export interface CampaignPlatformProgress {
  campaignId: string;
  platformId: string;
  isCompleted: boolean;
  publishedUrl?: string;
  publishedAt?: string;
}

export class AutomationOrchestrator {
  private contentService = getContentService();
  private telegraphService = getTelegraphService();
  private progressListeners: Map<string, (progress: CampaignProgress) => void> = new Map();
  private campaignProgressMap: Map<string, CampaignProgress> = new Map();
  private platformProgressMap: Map<string, CampaignPlatformProgress[]> = new Map();

  /**
   * Validate Supabase client is available for database operations
   */
  private validateSupabaseClient(): boolean {
    if (!supabase) {
      console.error('❌ AutomationOrchestrator: Supabase client not available');
      return false;
    }

    if (!supabase.from) {
      console.error('❌ AutomationOrchestrator: Supabase.from method not available - using mock client?');
      return false;
    }

    return true;
  }

  /**
   * Safe database operation wrapper to handle response body errors
   */
  private async safeDbOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
    try {
      return await operation();
    } catch (error: any) {
      if (error.message?.includes('body stream already read') ||
          error.message?.includes('body used already')) {
        console.warn(`⚠️ Response body error in ${operationName}, retrying...`);
        // Wait a bit and try once more
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          return await operation();
        } catch (retryError) {
          console.error(`❌ ${operationName} failed on retry:`, formatErrorForLogging(retryError, operationName));
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Get active publishing platforms
   */
  getActivePlatforms(): PublishingPlatform[] {
    return PlatformConfigService.getActivePlatforms();
  }

  /**
   * Get next available platform for a campaign (continuous rotation)
   */
  getNextPlatformForCampaign(campaignId: string): PublishingPlatform | null {
    const activePlatforms = this.getActivePlatforms();
    const campaignProgress = this.platformProgressMap.get(campaignId) || [];

    if (activePlatforms.length === 0) {
      return null;
    }

    // Count posts per platform for this campaign
    const platformCounts = new Map<string, number>();

    // Initialize counts
    activePlatforms.forEach(platform => {
      platformCounts.set(platform.id, 0);
    });

    // Count existing posts
    campaignProgress.forEach(progress => {
      if (progress.isCompleted) {
        const currentCount = platformCounts.get(progress.platformId) || 0;
        platformCounts.set(progress.platformId, currentCount + 1);
      }
    });

    // Find platform with minimum posts (round-robin rotation)
    let selectedPlatform = activePlatforms[0];
    let minCount = platformCounts.get(selectedPlatform.id) || 0;

    for (const platform of activePlatforms) {
      const count = platformCounts.get(platform.id) || 0;
      if (count < minCount) {
        selectedPlatform = platform;
        minCount = count;
      }
    }

    return selectedPlatform; // Always return a platform for continuous rotation
  }

  /**
   * Get next available platform for a campaign (async version that checks database)
   */
  async getNextPlatformForCampaignAsync(campaignId: string): Promise<PublishingPlatform | null> {
    const activePlatforms = this.getActivePlatforms();

    if (activePlatforms.length === 0) {
      return null;
    }

    // Get published links from database to check platform usage counts
    const campaignWithLinks = await this.getCampaignWithLinks(campaignId);
    const publishedLinks = campaignWithLinks?.automation_published_links || [];

    // Count posts per platform from database
    const platformCounts = new Map<string, number>();

    // Initialize counts
    activePlatforms.forEach(platform => {
      platformCounts.set(platform.id, 0);
    });

    // Count existing posts from database
    publishedLinks.forEach(link => {
      const platform = link.platform.toLowerCase();
      // Normalize legacy platform names
      let normalizedPlatform = platform;
      if (platform === 'write.as' || platform === 'writeas') normalizedPlatform = 'writeas';
      if (platform === 'telegraph.ph' || platform === 'telegraph') normalizedPlatform = 'telegraph';

      const currentCount = platformCounts.get(normalizedPlatform) || 0;
      platformCounts.set(normalizedPlatform, currentCount + 1);
    });

    // Also check in-memory progress map as backup
    const campaignProgress = this.platformProgressMap.get(campaignId) || [];
    campaignProgress.forEach(progress => {
      if (progress.isCompleted) {
        const currentCount = platformCounts.get(progress.platformId) || 0;
        platformCounts.set(progress.platformId, currentCount + 1);
      }
    });

    // Find platform with minimum posts (round-robin rotation)
    let selectedPlatform = activePlatforms[0];
    let minCount = platformCounts.get(selectedPlatform.id) || 0;

    for (const platform of activePlatforms) {
      const count = platformCounts.get(platform.id) || 0;
      if (count < minCount) {
        selectedPlatform = platform;
        minCount = count;
      }
    }

    return selectedPlatform; // Always return a platform for continuous rotation
  }

  /**
   * Check if campaign should auto-pause (never auto-pause for continuous rotation)
   */
  shouldAutoPauseCampaign(campaignId: string): boolean {
    // For continuous rotation, campaigns should never auto-pause
    // They should only be paused manually by the user or due to errors
    return false;
  }

  /**
   * Mark platform as completed for a campaign
   */
  markPlatformCompleted(campaignId: string, platformId: string, publishedUrl: string): void {
    const campaignProgress = this.platformProgressMap.get(campaignId) || [];

    // Remove any existing entry for this platform
    const filteredProgress = campaignProgress.filter(p => p.platformId !== platformId);

    // Add the completed entry
    filteredProgress.push({
      campaignId,
      platformId,
      isCompleted: true,
      publishedUrl,
      publishedAt: new Date().toISOString()
    });

    this.platformProgressMap.set(campaignId, filteredProgress);
  }

  /**
   * Get platform progress for a campaign
   */
  getCampaignPlatformProgress(campaignId: string): CampaignPlatformProgress[] {
    return this.platformProgressMap.get(campaignId) || [];
  }

  /**
   * Get campaign progress (public access to private map)
   */
  getCampaignProgress(campaignId: string): CampaignProgress | undefined {
    return this.campaignProgressMap.get(campaignId);
  }

  /**
   * Subscribe to campaign progress updates
   */
  subscribeToProgress(campaignId: string, callback: (progress: CampaignProgress) => void): () => void {
    this.progressListeners.set(campaignId, callback);

    // Send current progress if available
    const currentProgress = this.campaignProgressMap.get(campaignId);
    if (currentProgress) {
      callback(currentProgress);
    }

    // Return unsubscribe function
    return () => {
      this.progressListeners.delete(campaignId);
      this.campaignProgressMap.delete(campaignId);
    };
  }

  /**
   * Update campaign progress and notify listeners
   */
  private updateProgress(campaignId: string, updates: Partial<CampaignProgress>): void {
    const existing = this.campaignProgressMap.get(campaignId);
    if (!existing) return;

    const updated: CampaignProgress = {
      ...existing,
      ...updates
    };

    this.campaignProgressMap.set(campaignId, updated);

    const listener = this.progressListeners.get(campaignId);
    if (listener) {
      listener(updated);
    }
  }

  /**
   * Update a specific step in the progress
   */
  private updateStep(campaignId: string, stepId: string, updates: Partial<ProgressStep>): void {
    const progress = this.campaignProgressMap.get(campaignId);
    if (!progress) return;

    const stepIndex = progress.steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const updatedSteps = [...progress.steps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      ...updates,
      timestamp: updates.status ? new Date() : updatedSteps[stepIndex].timestamp
    };

    this.updateProgress(campaignId, {
      steps: updatedSteps,
      currentStep: stepIndex + 1
    });
  }

  /**
   * Initialize progress tracking for a campaign
   */
  private initializeProgress(campaign: Campaign): CampaignProgress {
    const steps: ProgressStep[] = [
      {
        id: 'create-campaign',
        title: 'Campaign Created',
        description: 'Setting up your link building campaign',
        status: 'completed',
        timestamp: new Date()
      },
      {
        id: 'generate-content',
        title: 'Generate Content',
        description: 'Creating unique AI-generated content with your keyword and anchor text',
        status: 'pending'
      },
      {
        id: 'publish-content',
        title: 'Publish Content',
        description: PlatformConfigService.getPlatformRotationDescription(),
        status: 'pending'
      },
      {
        id: 'complete-campaign',
        title: 'Campaign Complete',
        description: 'Finalizing campaign and collecting published URLs',
        status: 'pending'
      }
    ];

    const progress: CampaignProgress = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      targetUrl: campaign.target_url,
      keyword: campaign.keywords[0] || '',
      anchorText: campaign.anchor_texts[0] || '',
      steps,
      currentStep: 1,
      isComplete: false,
      isError: false,
      publishedUrls: [],
      startTime: new Date()
    };

    this.campaignProgressMap.set(campaign.id, progress);
    return progress;
  }

  /**
   * Create a new campaign
   */
  async createCampaign(params: {
    target_url: string;
    keyword: string;
    anchor_text: string;
  }): Promise<Campaign> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert({
          user_id: user.id,
          name: `Campaign for ${params.keyword}`,
          target_url: params.target_url,
          keywords: [params.keyword],
          anchor_texts: [params.anchor_text],
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', formatErrorForLogging(error, 'createCampaign'));

        // Extract error message safely using utility
        const errorMessage = formatErrorForUI(error);

        // Handle specific database errors
        if (errorMessage.includes('violates row-level security policy')) {
          throw new Error('Authentication required: Please log in to create campaigns');
        }

        if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
          throw new Error('Database schema error: Please contact administrator');
        }

        throw new Error(`Failed to create campaign: ${errorMessage}`);
      }

      await this.logActivity(data.id, 'info', 'Campaign created successfully');

      // Emit real-time feed event for campaign creation
      realTimeFeedService.emitCampaignCreated(
        data.id,
        data.name,
        params.keyword,
        params.target_url,
        user.id
      );

      // Initialize progress tracking
      this.initializeProgress(data);

      // Start network monitoring for this campaign
      campaignNetworkLogger.startMonitoring(data.id);
      campaignNetworkLogger.setCurrentCampaignId(data.id);

      // Start processing the campaign asynchronously
      this.processCampaignWithErrorHandling(data.id).catch(error => {
        console.error('Unhandled campaign processing error:', formatErrorForLogging(error, 'createCampaign'));
      });

      return data;
    } catch (error) {
      console.error('Campaign creation error:', error);

      // Use utility to format error properly
      const formattedError = formatErrorForUI(error);
      throw new Error(`Campaign creation failed: ${formattedError}`);
    }
  }

  /**
   * Process a campaign with simplified error handling
   */
  async processCampaignWithErrorHandling(campaignId: string): Promise<void> {
    try {
      await this.processCampaign(campaignId);
    } catch (error) {
      await this.handleCampaignProcessingError(campaignId, error, 'campaign_processing');
    }
  }

  /**
   * Handle campaign processing errors with simplified auto-pause logic
   */
  private async handleCampaignProcessingError(campaignId: string, error: any, stepName: string): Promise<void> {
    console.error(`Campaign ${campaignId} error in ${stepName}:`, formatErrorForLogging(error, stepName));

    const errorMessage = formatErrorForUI(error);

    // Log the error
    await this.logActivity(campaignId, 'error', `Error in ${stepName}: ${errorMessage}`);

    // Auto-pause campaign with error
    await this.updateCampaignStatus(campaignId, 'paused', errorMessage);

    // Update progress to show error
    this.updateProgress(campaignId, {
      isError: true,
      endTime: new Date()
    });

    // Emit error event to live feed
    const campaign = await this.getCampaign(campaignId);
    if (campaign) {
      realTimeFeedService.emitCampaignFailed(
        campaignId,
        campaign.name,
        campaign.keywords[0] || 'Unknown',
        errorMessage
      );
    }
  }


  /**
   * Process a campaign through all steps using working processor
   */
  async processCampaign(campaignId: string): Promise<void> {
    try {
      // Get campaign details
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Log campaign processing status - no completion logic for continuous rotation
      await this.logActivity(campaignId, 'info', `Processing campaign - continuous rotation enabled`);

      // Use the working campaign processor for reliable processing
      const result = await workingCampaignProcessor.processCampaign(campaign);

      if (!result.success) {
        throw new Error(result.error || 'Campaign processing failed');
      }

      console.log('✅ Campaign processed successfully by working processor');

      // Mark platform as completed in orchestrator tracking
      if (result.publishedUrls && result.publishedUrls.length > 0) {
        // Determine which platform was used (for now, assume it follows the rotation logic)
        const nextPlatform = await this.getNextPlatformForCampaignAsync(campaignId);
        if (nextPlatform) {
          this.markPlatformCompleted(campaignId, nextPlatform.id, result.publishedUrls[0]);
          await this.logActivity(campaignId, 'info', `Successfully published to ${nextPlatform.name}: ${result.publishedUrls[0]}`);
        }
      }

      // Continue to next platform immediately for continuous rotation
      console.log('🔄 Continuing to next platform for continuous rotation...');
      await this.continueToNextPlatform(campaignId);

    } catch (error) {
      console.error('Campaign processing error:', formatErrorForLogging(error, 'processCampaign'));
      throw error;
    }
  }

  /**
   * Original complex process campaign (keeping for reference but not used)
   */
  async processCampaignComplex(campaignId: string): Promise<void> {
    try {
      await this.logActivity(campaignId, 'info', 'Starting campaign processing');

      // Step 1: Get campaign details
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Step 2: Update status to active (campaign is now running)
      this.updateStep(campaignId, 'generate-content', {
        status: 'in_progress',
        details: 'Generating unique AI content...'
      });

      await this.updateCampaignStatus(campaignId, 'active');
      await this.logActivity(campaignId, 'info', 'Starting content generation');

      // Step 3: Generate content
      this.updateStep(campaignId, 'generate-content', {
        details: `Generating content for keyword: "${campaign.keywords[0] || 'default keyword'}"`
      });

      const generatedContent = await this.contentService.generateAllContent({
        keyword: campaign.keywords[0] || 'default keyword',
        anchorText: campaign.anchor_texts[0] || 'click here',
        targetUrl: campaign.target_url
      });

      // Emit real-time feed event for content generation
      const { data: { user } } = await supabase.auth.getUser();
      realTimeFeedService.emitContentGenerated(
        campaignId,
        campaign.name,
        campaign.keywords[0] || '',
        generatedContent[0]?.wordCount || generatedContent[0]?.content?.length, // Use word count if available
        user?.id
      );

      this.updateStep(campaignId, 'generate-content', {
        status: 'completed',
        details: `Successfully generated ${generatedContent.length} piece(s) of content`
      });

      await this.logActivity(campaignId, 'info', `Generated ${generatedContent.length} piece(s) of content`);

      // Step 4: Save generated content to database
      const contentRecords = [];
      for (const content of generatedContent) {
        const { data, error } = await supabase
          .from('automation_content')
          .insert({
            campaign_id: campaignId,
            title: `Generated ${content.type}`,
            content: content.content,
            target_keyword: campaign.keywords[0] || '',
            anchor_text: campaign.anchor_texts[0] || '',
            backlink_url: campaign.target_url
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to save content: ${error.message}`);
        }

        contentRecords.push(data);
      }

      // Step 5: Update status to remain active during publishing
      this.updateStep(campaignId, 'publish-content', {
        status: 'in_progress',
        details: 'Publishing content to Telegraph.ph...'
      });

      // Keep status as 'active' during publishing since 'publishing' isn't a valid status
      await this.logActivity(campaignId, 'info', 'Starting content publication');

      // Step 6: Publish content to next available platform
      const nextPlatform = this.getNextPlatformForCampaign(campaignId);
      const publishedLinks = [];

      if (!nextPlatform) {
        // No more platforms available, campaign should be paused
        await this.autoPauseCampaign(campaignId, 'All available platforms have been used');
        return;
      }

      this.updateStep(campaignId, 'publish-content', {
        status: 'in_progress',
        details: `Publishing content to ${nextPlatform.name}...`
      });

      for (const contentRecord of contentRecords) {
        try {
          let publishedPage: { url: string };

          // Platform-specific publishing logic
          if (nextPlatform.id === 'telegraph') {
            const title = this.telegraphService.generateTitleFromContent(campaign.keywords[0] || 'SEO');
            publishedPage = await this.telegraphService.publishContent({
              title,
              content: contentRecord.content,
              author_name: 'Link Builder'
            });
          } else {
            // For future platforms, we'll implement their specific logic here
            throw new Error(`Publishing to ${nextPlatform.name} is not yet implemented`);
          }

          // Save published link
          const { error: linkError } = await supabase
            .from('automation_published_links')
            .insert({
              campaign_id: campaignId,
              content_id: contentRecord.id,
              platform: nextPlatform.id,
              published_url: publishedPage.url,
              anchor_text: campaign.anchor_texts[0] || '',
              target_url: campaign.target_url,
              status: 'active',
              published_at: new Date().toISOString()
            });

          if (linkError) {
            console.error('Error saving published link:', {
              message: linkError.message || 'Unknown error',
              code: linkError.code,
              details: linkError.details,
              hint: linkError.hint,
              campaignId,
              contentId: contentRecord.id,
              publishedUrl: publishedPage.url,
              platform: nextPlatform.id
            });
          } else {
            publishedLinks.push(publishedPage.url);

            // Mark platform as completed
            this.markPlatformCompleted(campaignId, nextPlatform.id, publishedPage.url);

            // Emit real-time feed event for URL published
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            realTimeFeedService.emitUrlPublished(
              campaignId,
              campaign.name,
              campaign.keywords[0] || '',
              publishedPage.url,
              nextPlatform.name,
              currentUser?.id
            );

            // Update progress with published URL
            this.updateProgress(campaignId, {
              publishedUrls: [...(this.campaignProgressMap.get(campaignId)?.publishedUrls || []), publishedPage.url]
            });

            this.updateStep(campaignId, 'publish-content', {
              details: `Successfully published to ${nextPlatform.name}: ${publishedPage.url}`
            });

            await this.logActivity(campaignId, 'info', `Published content to ${nextPlatform.name}: ${publishedPage.url}`);
          }

        } catch (error) {
          const errorMessage = formatErrorForUI(error);
          console.error('Error publishing content:', formatErrorForLogging(error, 'publishContent'));
          await this.logActivity(campaignId, 'error', `Failed to publish to ${nextPlatform.name}: ${errorMessage}`);
        }
      }

      // Step 7: Handle platform completion and check if campaign should be completed
      if (publishedLinks.length > 0) {
        this.updateStep(campaignId, 'publish-content', {
          status: 'completed',
          details: `Successfully published to ${nextPlatform.name}`
        });

        // Mark this platform as completed
        this.markPlatformCompleted(campaignId, nextPlatform.id, publishedLinks[0]);
        await this.logActivity(campaignId, 'info', `Successfully published to ${nextPlatform.name}: ${publishedLinks[0]}`);

        // For continuous rotation, never complete campaigns - just continue to next platform
        await this.continueToNextPlatform(campaignId);
      } else {
        this.updateStep(campaignId, 'publish-content', {
          status: 'error',
          details: 'Failed to publish any content'
        });

        this.updateProgress(campaignId, {
          isError: true,
          endTime: new Date()
        });

        await this.updateCampaignStatus(campaignId, 'paused', 'No content was successfully published');
        await this.logActivity(campaignId, 'error', 'Campaign paused: No content was successfully published');
      }

    } catch (error) {
      console.error('Campaign processing error:', formatErrorForLogging(error, 'processCampaign'));
      const errorMessage = formatErrorForUI(error);

      // Update progress to show error
      const progress = this.campaignProgressMap.get(campaignId);
      if (progress) {
        const currentStepId = progress.steps[progress.currentStep - 1]?.id;
        if (currentStepId) {
          this.updateStep(campaignId, currentStepId, {
            status: 'error',
            details: errorMessage
          });
        }

        this.updateProgress(campaignId, {
          isError: true,
          endTime: new Date()
        });
      }

      // Get campaign details for the error event
      const campaign = await this.getCampaign(campaignId);

      // Emit real-time feed event for campaign failure
      if (campaign) {
        realTimeFeedService.emitCampaignFailed(
          campaignId,
          campaign.name,
          campaign.keywords[0] || '',
          errorMessage
        );
      }

      // Update campaign status using fixed function if available
      if (typeof window !== 'undefined' && (window as any).fixedUpdateCampaignStatus) {
        const result = await (window as any).fixedUpdateCampaignStatus(campaignId, 'paused', errorMessage);
        if (!result.success) {
          console.error('Failed to update campaign status:', result.error);
        }
      } else {
        await this.updateCampaignStatus(campaignId, 'paused', errorMessage);
      }

      await this.logActivity(campaignId, 'error', `Campaign failed: ${errorMessage}`);
      throw new Error(`Campaign processing failed: ${errorMessage}`);
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('automation_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('Error fetching campaign:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        campaignId
      });
      return null;
    }

    return data;
  }

  /**
   * Get user campaigns
   */
  async getUserCampaigns(): Promise<Campaign[]> {
    // Validate Supabase client first
    if (!this.validateSupabaseClient()) {
      console.warn('⚠️ AutomationOrchestrator: Supabase not properly configured, returning empty campaigns');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('automation_campaigns')
      .select(`
        *,
        automation_published_links(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user campaigns:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId: user?.id
      });
      return [];
    }

    return data || [];
  }

  /**
   * Get campaign with published links
   */
  async getCampaignWithLinks(campaignId: string) {
    const { data, error } = await supabase
      .from('automation_campaigns')
      .select(`
        *,
        automation_published_links(*)
      `)
      .eq('id', campaignId)
      .order('published_at', { referencedTable: 'automation_published_links', ascending: false })
      .single();

    if (error) {
      console.error('Error fetching campaign with links:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        campaignId
      });
      return null;
    }

    return data;
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: Campaign['status'],
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Note: error_message column doesn't exist in current schema
    // Store error message in activity logs instead

    const result = await this.safeDbOperation(
      () => supabase
        .from('automation_campaigns')
        .update(updateData)
        .eq('id', campaignId),
      'updateCampaignStatus'
    );

    if (result?.error) {
      console.error('Error updating campaign status:', {
        message: result.error.message || 'Unknown error',
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint
      });
    }

    // Log error message separately if provided
    if (errorMessage) {
      await this.logActivity(campaignId, 'error', errorMessage);
    }
  }

  /**
   * Log campaign activity
   */
  async logActivity(
    campaignId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    details?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('automation_logs')
      .insert({
        campaign_id: campaignId,
        level: level,
        message,
        details
      });

    if (error) {
      console.error('Error logging activity:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        campaignId,
        level,
        activityMessage: message
      });
    }
  }

  /**
   * Get campaign logs
   */
  async getCampaignLogs(campaignId: string) {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaign logs:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        campaignId
      });
      return [];
    }

    return data || [];
  }

  /**
   * Auto-pause campaign when all platforms are completed (disabled for continuous rotation)
   */
  async autoPauseCampaign(campaignId: string, reason: string): Promise<void> {
    // For continuous rotation, don't complete campaigns - just log and continue
    await this.logActivity(campaignId, 'info', `Campaign continues with continuous rotation: ${reason}`);
    console.log(`🔄 Campaign ${campaignId} continues - continuous rotation enabled: ${reason}`);
  }

  /**
   * Continue campaign to next platform automatically
   */
  async continueToNextPlatform(campaignId: string): Promise<void> {
    try {
      const nextPlatform = this.getNextPlatformForCampaign(campaignId);
      const remainingPlatforms = this.getActivePlatforms().length - this.getCampaignPlatformProgress(campaignId).length;

      // For continuous rotation, always continue to next platform
      if (!nextPlatform) {
        await this.logActivity(campaignId, 'info', 'All platforms used once - continuing rotation to first platform');
        // Don't complete - just let it continue to the next cycle
      }

      await this.logActivity(campaignId, 'info',
        `Continuing to next platform: ${nextPlatform.name}. ${remainingPlatforms} platform(s) remaining.`
      );

      // Small delay to ensure database updates are processed, then continue immediately
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

      try {
        // Process the next platform immediately
        await this.processCampaignWithErrorHandling(campaignId);
        console.log(`✅ Successfully continued campaign ${campaignId} to next platform: ${nextPlatform.name}`);
      } catch (error) {
        console.error('Failed to continue to next platform:', error);
        await this.updateCampaignStatus(campaignId, 'paused');
        await this.logActivity(campaignId, 'error', `Failed to continue to next platform: ${error.message}`);
        throw error; // Re-throw to ensure calling function knows it failed
      }

    } catch (error) {
      console.error('Error in continueToNextPlatform:', error);
      await this.updateCampaignStatus(campaignId, 'paused');
      await this.logActivity(campaignId, 'error', `Failed to continue campaign: ${error.message}`);
    }
  }

  /**
   * Pause campaign temporarily between platforms
   */
  async pauseCampaignForNextPlatform(campaignId: string): Promise<void> {
    const nextPlatform = this.getNextPlatformForCampaign(campaignId);
    const remainingPlatforms = this.getActivePlatforms().length - this.getCampaignPlatformProgress(campaignId).length;

    await this.updateCampaignStatus(campaignId, 'paused');
    await this.logActivity(campaignId, 'info',
      `Campaign paused after publishing. ${remainingPlatforms} platform(s) remaining. Next: ${nextPlatform?.name || 'None'}`
    );
  }

  /**
   * Enhanced resume logic that continues platform rotation and handles completed campaigns
   */
  async smartResumeCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if campaign exists
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        return {
          success: false,
          message: 'Campaign not found'
        };
      }

      // Get campaign with published links to check real completion status
      const campaignWithLinks = await this.getCampaignWithLinks(campaignId);
      const publishedLinks = campaignWithLinks?.automation_published_links || [];
      const isCompleted = campaign.status === 'completed';

      // Check for next available platform using database-aware method
      const nextPlatform = await this.getNextPlatformForCampaignAsync(campaignId);

      if (isCompleted && !nextPlatform) {
        // Check if there are any new platforms available that weren't used
        const activePlatforms = this.getActivePlatforms();

        // Create normalized set of used platform IDs from database
        const usedPlatformIds = new Set(
          publishedLinks.map(link => {
            const platform = link.platform.toLowerCase();
            // Normalize legacy platform names to current IDs
            if (platform === 'write.as' || platform === 'writeas') return 'writeas';
            if (platform === 'telegraph.ph' || platform === 'telegraph') return 'telegraph';
            return platform;
          })
        );

        const unusedPlatforms = activePlatforms.filter(platform => !usedPlatformIds.has(platform.id));

        if (unusedPlatforms.length > 0) {
          // Reset campaign to allow using new platforms
          await this.updateCampaignStatus(campaignId, 'active');
          await this.logActivity(campaignId, 'info', `Campaign restarted - found ${unusedPlatforms.length} unused platform(s): ${unusedPlatforms.map(p => p.name).join(', ')}`);

          // Continue processing
          this.processCampaignWithErrorHandling(campaignId).catch(error => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Campaign processing error:', errorMessage);
          });

          return {
            success: true,
            message: `Campaign restarted to use ${unusedPlatforms.length} new platform(s): ${unusedPlatforms.map(p => p.name).join(', ')}`
          };
        } else {
          // All platforms have been used
          return {
            success: false,
            message: `Campaign has completed all ${activePlatforms.length} available platform(s). Consider enabling more platforms or creating a new campaign.`
          };
        }
      }

      if (!nextPlatform) {
        // Mark as completed if all platforms are done
        await this.autoPauseCampaign(campaignId, 'All available platforms have been used');
        return {
          success: false,
          message: 'Campaign completed - all available platforms have been used'
        };
      }

      // Resume normal processing
      await this.updateCampaignStatus(campaignId, 'active');
      const actionType = isCompleted ? 'restarted' : 'resumed';
      await this.logActivity(campaignId, 'info', `Campaign ${actionType} to continue posting to ${nextPlatform.name}`);

      // Emit resume event to live feed
      const { data: { user } } = await supabase.auth.getUser();
      realTimeFeedService.emitCampaignResumed(
        campaignId,
        campaign.name,
        campaign.keywords[0] || 'Unknown',
        `${actionType} to continue posting to ${nextPlatform.name}`,
        user?.id
      );

      // Continue processing the campaign
      this.processCampaignWithErrorHandling(campaignId).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Campaign processing error:', errorMessage);
      });

      return {
        success: true,
        message: `Campaign ${actionType}. Will continue posting to ${nextPlatform.name}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to resume campaign: ${errorMessage}`
      };
    }
  }

  /**
   * Reset platform progress for a campaign (useful for testing or restarting)
   */
  resetCampaignPlatformProgress(campaignId: string): void {
    this.platformProgressMap.delete(campaignId);
    console.log(`Platform progress reset for campaign: ${campaignId}`);
  }

  /**
   * Validate that campaign won't publish to platforms that already have published links
   * This is critical for re-run/resume operations
   */
  async validateNoPlatformDuplication(campaignId: string): Promise<{
    isValid: boolean;
    availablePlatforms: PublishingPlatform[];
    usedPlatforms: string[];
    message: string;
  }> {
    try {
      // Get all published links from database
      const campaignWithLinks = await this.getCampaignWithLinks(campaignId);
      const publishedLinks = campaignWithLinks?.automation_published_links || [];

      if (publishedLinks.length === 0) {
        // No existing links, all platforms available
        const activePlatforms = this.getActivePlatforms();
        return {
          isValid: true,
          availablePlatforms: activePlatforms,
          usedPlatforms: [],
          message: `All ${activePlatforms.length} platforms available for new campaign`
        };
      }

      // Create normalized set of used platform IDs
      const usedPlatformIds = new Set(
        publishedLinks.map(link => {
          const platform = link.platform.toLowerCase();
          // Normalize legacy platform names to current IDs
          if (platform === 'write.as' || platform === 'writeas') return 'writeas';
          if (platform === 'telegraph.ph' || platform === 'telegraph') return 'telegraph';
          return platform;
        })
      );

      const activePlatforms = this.getActivePlatforms();
      const availablePlatforms = activePlatforms.filter(platform => !usedPlatformIds.has(platform.id));
      const usedPlatformNames = Array.from(usedPlatformIds)
        .map(id => activePlatforms.find(p => p.id === id)?.name || id)
        .filter(Boolean);

      return {
        isValid: availablePlatforms.length > 0,
        availablePlatforms,
        usedPlatforms: usedPlatformNames,
        message: availablePlatforms.length > 0
          ? `${availablePlatforms.length} platform(s) available: ${availablePlatforms.map(p => p.name).join(', ')}. Already used: ${usedPlatformNames.join(', ')}`
          : `All platforms already used: ${usedPlatformNames.join(', ')}. Consider enabling more platforms or creating a new campaign.`
      };
    } catch (error) {
      return {
        isValid: false,
        availablePlatforms: [],
        usedPlatforms: [],
        message: `Error validating platform usage: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get detailed platform information for debugging
   */
  getDebugInfo(campaignId?: string): any {
    const info = {
      availablePlatforms: this.getActivePlatforms(),
      totalCampaigns: this.platformProgressMap.size,
    };

    if (campaignId) {
      info.campaignProgress = this.getCampaignPlatformProgress(campaignId);
      info.nextPlatform = this.getNextPlatformForCampaign(campaignId);
      info.shouldAutoPause = this.shouldAutoPauseCampaign(campaignId);
      info.statusSummary = this.getCampaignStatusSummary(campaignId);
    }

    return info;
  }

  /**
   * Get campaign status summary including platform progress
   */
  async syncPlatformProgressFromDatabase(campaignId: string): Promise<void> {
    try {
      // Get published links from database
      const { data: publishedLinks, error } = await supabase
        .from('automation_published_links')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) {
        console.warn('Error fetching published links for platform sync:', error);
        return;
      }

      const activePlatforms = this.getActivePlatforms();

      // Mark each published link's platform as completed
      for (const link of publishedLinks || []) {
        const platform = activePlatforms.find(p =>
          p.name.toLowerCase() === link.platform.toLowerCase() ||
          p.id.toLowerCase() === link.platform.toLowerCase() ||
          (link.platform === 'telegraph' && p.id === 'telegraph') ||
          (link.platform.toLowerCase() === 'write.as' && p.id === 'writeas') ||
          (link.platform.toLowerCase() === 'writeas' && p.id === 'writeas')
        );

        if (platform) {
          // Check if already marked as completed
          const existingProgress = this.getCampaignPlatformProgress(campaignId);
          const alreadyCompleted = existingProgress.some(p =>
            p.platformId === platform.id && p.isCompleted
          );

          if (!alreadyCompleted) {
            console.log(`��� Auto-syncing platform progress: ${platform.name} completed for campaign ${campaignId}`);
            this.markPlatformCompleted(campaignId, platform.id, link.published_url);
          }
        }
      }
    } catch (error) {
      console.warn('Error syncing platform progress from database:', error);
    }
  }

  getCampaignStatusSummary(campaignId: string): {
    platformsCompleted: number;
    totalPlatforms: number;
    nextPlatform: string | null;
    completedPlatforms: string[];
    isFullyCompleted: boolean;
  } {
    const activePlatforms = this.getActivePlatforms();
    let campaignProgress = this.getCampaignPlatformProgress(campaignId);

    // If no progress tracked and this looks like a completed campaign, try to sync from database
    if (campaignProgress.length === 0) {
      // Trigger async sync but don't wait for it to avoid blocking the UI
      this.syncPlatformProgressFromDatabase(campaignId).catch(console.error);
    }

    const nextPlatform = this.getNextPlatformForCampaign(campaignId);
    const completedPlatforms = campaignProgress
      .filter(p => p.isCompleted)
      .map(p => activePlatforms.find(ap => ap.id === p.platformId)?.name || p.platformId);

    return {
      platformsCompleted: campaignProgress.filter(p => p.isCompleted).length,
      totalPlatforms: activePlatforms.length,
      nextPlatform: nextPlatform?.name || null,
      completedPlatforms,
      isFullyCompleted: this.shouldAutoPauseCampaign(campaignId)
    };
  }

  /**
   * Auto-pause a campaign with error information and live feed event
   */
  async autoPauseCampaignWithError(campaignId: string, errorMessage: string, canAutoResume: boolean = false): Promise<void> {
    try {
      // Get campaign details for the live feed event
      const campaign = await this.getCampaign(campaignId);
      const { data: { user } } = await supabase.auth.getUser();

      // Update campaign with error information
      const { error } = await supabase
        .from('automation_campaigns')
        .update({
          status: 'paused',
          error_message: errorMessage,
          auto_pause_reason: errorMessage,
          can_auto_resume: canAutoResume,
          error_count: supabase.raw('COALESCE(error_count, 0) + 1'),
          last_error_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.error('Error updating campaign with auto-pause info:', error);
        // Fallback to basic status update
        await this.updateCampaignStatus(campaignId, 'paused', errorMessage);
      }

      await this.logActivity(campaignId, 'error', `Campaign auto-paused: ${errorMessage}`);

      // Emit auto-pause event to live feed
      if (campaign) {
        realTimeFeedService.emitCampaignAutoPaused(
          campaignId,
          campaign.name,
          campaign.keywords[0] || 'Unknown',
          errorMessage,
          'auto_pause',
          user?.id
        );
      }

    } catch (error) {
      console.error('Failed to auto-pause campaign:', error);
      // Fallback to basic pause
      await this.updateCampaignStatus(campaignId, 'paused', errorMessage);
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignStatus(campaignId, 'paused');
    await this.logActivity(campaignId, 'info', 'Campaign paused by user');
  }

  /**
   * Resume a campaign with completion check
   */
  async resumeCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if campaign exists and get its current status
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        return {
          success: false,
          message: 'Campaign not found'
        };
      }

      // Check if campaign is already completed
      if (campaign.status === 'completed') {
        return {
          success: false,
          message: 'This campaign is completed. Please create a new campaign.'
        };
      }

      // For continuous rotation, always allow resume regardless of published links
      const campaignWithLinks = await this.getCampaignWithLinks(campaignId);
      if (campaignWithLinks?.automation_published_links && campaignWithLinks.automation_published_links.length > 0) {
        await this.logActivity(campaignId, 'info', 'Campaign has published content - continuing with continuous rotation');
      }

      return await this.smartResumeCampaign(campaignId);
    } catch (error) {
      const errorMessage = formatErrorForUI(error);
      console.error('Error resuming campaign:', formatErrorForLogging(error, 'resumeCampaign'));
      return {
        success: false,
        message: `Failed to resume campaign: ${errorMessage}`
      };
    }
  }


  /**
   * Save published link to database
   */
  async savePublishedLink(
    campaignId: string,
    publishedUrl: string,
    anchorText: string,
    targetUrl: string,
    platform: string = 'telegraph'
  ): Promise<void> {
    const { error } = await supabase
      .from('automation_published_links')
      .insert({
        campaign_id: campaignId,
        published_url: publishedUrl,
        anchor_text: anchorText,
        target_url: targetUrl,
        platform: platform,
        status: 'active',
        published_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving published link:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        campaignId,
        publishedUrl,
        platform
      });
      throw new Error(`Failed to save published link: ${error.message || 'Unknown database error'}`);
    }

    console.log(`✅ Published link saved to database: ${publishedUrl}`);
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_campaigns')
      .delete()
      .eq('id', campaignId);

    if (error) {
      console.error('Error deleting campaign:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        campaignId
      });
      throw new Error(`Failed to delete campaign: ${error.message || 'Unknown database error'}`);
    }
  }
}

// Singleton instance
let orchestrator: AutomationOrchestrator | null = null;

export const getOrchestrator = (): AutomationOrchestrator => {
  if (!orchestrator) {
    orchestrator = new AutomationOrchestrator();
  }
  return orchestrator;
};
