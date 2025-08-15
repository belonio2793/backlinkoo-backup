import { supabase } from '@/integrations/supabase/client';
import { getContentService, type ContentGenerationParams } from './automationContentService';
import { getTelegraphService } from './telegraphService';
import { ProgressStep, CampaignProgress } from '@/components/CampaignProgressTracker';

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

// Available publishing platforms
export interface PublishingPlatform {
  id: string;
  name: string;
  isActive: boolean;
  maxPostsPerCampaign: number;
  priority: number;
}

export const AVAILABLE_PLATFORMS: PublishingPlatform[] = [
  { id: 'telegraph', name: 'Telegraph.ph', isActive: true, maxPostsPerCampaign: 1, priority: 1 },
  { id: 'medium', name: 'Medium.com', isActive: false, maxPostsPerCampaign: 1, priority: 2 },
  { id: 'devto', name: 'Dev.to', isActive: false, maxPostsPerCampaign: 1, priority: 3 },
  { id: 'linkedin', name: 'LinkedIn Articles', isActive: false, maxPostsPerCampaign: 1, priority: 4 },
  { id: 'hashnode', name: 'Hashnode', isActive: false, maxPostsPerCampaign: 1, priority: 5 },
  { id: 'substack', name: 'Substack', isActive: false, maxPostsPerCampaign: 1, priority: 6 }
];

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
   * Get active publishing platforms
   */
  getActivePlatforms(): PublishingPlatform[] {
    return AVAILABLE_PLATFORMS.filter(p => p.isActive).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get next available platform for a campaign
   */
  getNextPlatformForCampaign(campaignId: string): PublishingPlatform | null {
    const activePlatforms = this.getActivePlatforms();
    const campaignProgress = this.platformProgressMap.get(campaignId) || [];

    // Find the first platform that hasn't been used yet
    for (const platform of activePlatforms) {
      const hasPosted = campaignProgress.some(p => p.platformId === platform.id && p.isCompleted);
      if (!hasPosted) {
        return platform;
      }
    }

    return null; // All platforms have been used
  }

  /**
   * Check if campaign should auto-pause (completed all available platforms)
   */
  shouldAutoPauseCampaign(campaignId: string): boolean {
    const activePlatforms = this.getActivePlatforms();
    const campaignProgress = this.platformProgressMap.get(campaignId) || [];

    // Safety check: if no active platforms, should not pause
    if (activePlatforms.length === 0) {
      return false;
    }

    // Check if all active platforms have been completed
    return activePlatforms.every(platform =>
      campaignProgress.some(p => p.platformId === platform.id && p.isCompleted)
    );
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
        description: 'Publishing content to Telegraph.ph platform',
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
        console.error('Error creating campaign:', {
          message: error.message || 'Unknown error',
          code: error.code,
          details: error.details,
          hint: error.hint,
          targetUrl: params.target_url,
          keyword: params.keyword
        });

        // Extract error message safely
        const errorMessage = error?.message || error?.details || String(error);

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
      
      // Initialize progress tracking
      this.initializeProgress(data);

      // Start processing the campaign asynchronously
      this.processCampaign(data.id).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Campaign processing error:', errorMessage);
        // Note: 'failed' is not a valid status in current schema, so we'll pause the campaign instead
        this.updateCampaignStatus(data.id, 'paused', errorMessage);

        // Update progress to show error
        this.updateProgress(data.id, {
          isError: true,
          endTime: new Date()
        });
      });

      return data;
    } catch (error) {
      console.error('Campaign creation error:', error);

      // Ensure we throw a proper Error object with a clear message
      if (error instanceof Error) {
        throw new Error(`Campaign creation failed: ${error.message}`);
      } else {
        // Handle non-Error objects (like Supabase error objects)
        const errorMessage = error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : String(error);
        throw new Error(`Campaign creation failed: ${errorMessage}`);
      }
    }
  }

  /**
   * Process a campaign through all steps
   */
  async processCampaign(campaignId: string): Promise<void> {
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
              published_url: publishedPage.url
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
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error publishing content:', errorMessage);
          await this.logActivity(campaignId, 'error', `Failed to publish to ${nextPlatform.name}: ${errorMessage}`);
        }
      }

      // Step 7: Check for completion or auto-pause
      if (publishedLinks.length > 0) {
        this.updateStep(campaignId, 'publish-content', {
          status: 'completed',
          details: `Successfully published to ${nextPlatform.name}`
        });

        // Check if we should auto-pause (all platforms completed)
        if (this.shouldAutoPauseCampaign(campaignId)) {
          await this.autoPauseCampaign(campaignId, 'All available platforms have been used');
        } else {
          // More platforms available, pause for now and can be resumed
          await this.pauseCampaignForNextPlatform(campaignId);
        }
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
      console.error('Campaign processing error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

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

      // Note: 'failed' is not a valid status in current schema, so we'll pause the campaign instead
      await this.updateCampaignStatus(campaignId, 'paused', errorMessage);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('automation_campaigns')
      .select('*')
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

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('automation_campaigns')
      .update(updateData)
      .eq('id', campaignId);

    if (error) {
      console.error('Error updating campaign status:', {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint
      });
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
   * Auto-pause campaign when all platforms are completed
   */
  async autoPauseCampaign(campaignId: string, reason: string): Promise<void> {
    this.updateStep(campaignId, 'complete-campaign', {
      status: 'completed',
      details: reason
    });

    this.updateProgress(campaignId, {
      isComplete: true,
      endTime: new Date()
    });

    await this.updateCampaignStatus(campaignId, 'completed');
    await this.logActivity(campaignId, 'info', `Campaign completed: ${reason}`);
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
   * Enhanced resume logic that continues platform rotation
   */
  async smartResumeCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    const nextPlatform = this.getNextPlatformForCampaign(campaignId);

    if (!nextPlatform) {
      return {
        success: false,
        message: 'Campaign has already posted to all available platforms'
      };
    }

    await this.updateCampaignStatus(campaignId, 'active');
    await this.logActivity(campaignId, 'info', `Campaign resumed to continue posting to ${nextPlatform.name}`);

    // Continue processing the campaign
    this.processCampaign(campaignId).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Campaign processing error:', errorMessage);
      this.updateCampaignStatus(campaignId, 'paused', errorMessage);
    });

    return {
      success: true,
      message: `Campaign resumed. Will continue posting to ${nextPlatform.name}`
    };
  }

  /**
   * Get campaign status summary including platform progress
   */
  getCampaignStatusSummary(campaignId: string): {
    platformsCompleted: number;
    totalPlatforms: number;
    nextPlatform: string | null;
    completedPlatforms: string[];
    isFullyCompleted: boolean;
  } {
    const activePlatforms = this.getActivePlatforms();
    const campaignProgress = this.getCampaignPlatformProgress(campaignId);
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
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignStatus(campaignId, 'paused');
    await this.logActivity(campaignId, 'info', 'Campaign paused by user');
  }

  /**
   * Resume campaign (uses smart resume logic)
   */
  async resumeCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    return await this.smartResumeCampaign(campaignId);
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
