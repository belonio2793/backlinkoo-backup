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

export class AutomationOrchestrator {
  private contentService = getContentService();
  private telegraphService = getTelegraphService();
  private progressListeners: Map<string, (progress: CampaignProgress) => void> = new Map();
  private campaignProgressMap: Map<string, CampaignProgress> = new Map();
  
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
        console.error('Error creating campaign:', error);

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
        this.updateCampaignStatus(data.id, 'failed', errorMessage);

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

      // Step 6: Publish content to Telegraph
      const publishedLinks = [];
      for (const contentRecord of contentRecords) {
        try {
          const title = this.telegraphService.generateTitleFromContent(campaign.keywords[0] || 'SEO');

          const publishedPage = await this.telegraphService.publishContent({
            title,
            content: contentRecord.content,
            author_name: 'Link Builder'
          });

          // Save published link
          const { error: linkError } = await supabase
            .from('automation_published_links')
            .insert({
              campaign_id: campaignId,
              content_id: contentRecord.id,
              platform: 'telegraph',
              published_url: publishedPage.url
            });

          if (linkError) {
            console.error('Error saving published link:', linkError);
          } else {
            publishedLinks.push(publishedPage.url);

            // Update progress with published URL
            this.updateProgress(campaignId, {
              publishedUrls: publishedLinks
            });

            this.updateStep(campaignId, 'publish-content', {
              details: `Published content to ${publishedPage.url}`
            });

            await this.logActivity(campaignId, 'info', `Published content to ${publishedPage.url}`);
          }

          // No delay needed since we're only publishing one piece of content

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error publishing content:', errorMessage);
          await this.logActivity(campaignId, 'error', `Failed to publish content: ${errorMessage}`);
        }
      }

      // Step 7: Complete campaign
      if (publishedLinks.length > 0) {
        this.updateStep(campaignId, 'publish-content', {
          status: 'completed',
          details: `Successfully published ${publishedLinks.length} link(s)`
        });

        this.updateStep(campaignId, 'complete-campaign', {
          status: 'completed',
          details: `Campaign completed with ${publishedLinks.length} published link(s)`
        });

        this.updateProgress(campaignId, {
          isComplete: true,
          endTime: new Date()
        });

        await this.updateCampaignStatus(campaignId, 'completed');
        await this.logActivity(campaignId, 'info', `Campaign completed successfully. Published ${publishedLinks.length} links.`);
      } else {
        this.updateStep(campaignId, 'publish-content', {
          status: 'error',
          details: 'Failed to publish any content'
        });

        this.updateProgress(campaignId, {
          isError: true,
          endTime: new Date()
        });

        // Note: 'failed' is not a valid status in current schema, so we'll pause the campaign instead
        await this.updateCampaignStatus(campaignId, 'paused', 'No content was successfully published');
        await this.logActivity(campaignId, 'error', 'Campaign failed: No content was successfully published');
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
      console.error('Error fetching campaign:', error);
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
      console.error('Error fetching user campaigns:', error);
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
      console.error('Error fetching campaign with links:', error);
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
      console.error('Error updating campaign status:', error);
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
      console.error('Error logging activity:', error);
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
      console.error('Error fetching campaign logs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignStatus(campaignId, 'paused');
    await this.logActivity(campaignId, 'info', 'Campaign paused by user');
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    await this.updateCampaignStatus(campaignId, 'pending');
    await this.logActivity(campaignId, 'info', 'Campaign resumed by user');
    
    // Restart processing
    this.processCampaign(campaignId).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Campaign processing error:', errorMessage);
      this.updateCampaignStatus(campaignId, 'failed', errorMessage);
    });
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
      console.error('Error deleting campaign:', error);
      throw new Error(`Failed to delete campaign: ${error.message}`);
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
