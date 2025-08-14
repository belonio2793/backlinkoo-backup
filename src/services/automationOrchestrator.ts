import { supabase } from '@/integrations/supabase/client';
import { getContentService, type ContentGenerationParams } from './automationContentService';
import { getTelegraphService } from './telegraphService';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'pending' | 'generating' | 'publishing' | 'completed' | 'paused' | 'failed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface CampaignProgress {
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
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        throw new Error(`Failed to create campaign: ${error.message}`);
      }

      await this.logActivity(data.id, 'info', 'Campaign created successfully');
      
      // Start processing the campaign asynchronously
      this.processCampaign(data.id).catch(error => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Campaign processing error:', errorMessage);
        this.updateCampaignStatus(data.id, 'failed', errorMessage);
      });

      return data;
    } catch (error) {
      console.error('Campaign creation error:', error);

      // Ensure we throw a proper Error object with a clear message
      if (error instanceof Error) {
        throw new Error(`Campaign creation failed: ${error.message}`);
      } else {
        throw new Error(`Campaign creation failed: ${String(error)}`);
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

      // Step 2: Update status to generating
      await this.updateCampaignStatus(campaignId, 'generating');
      await this.logActivity(campaignId, 'info', 'Starting content generation');

      // Step 3: Generate content
      const generatedContent = await this.contentService.generateAllContent({
        keyword: campaign.keywords[0] || 'default keyword',
        anchorText: campaign.anchor_texts[0] || 'click here',
        targetUrl: campaign.target_url
      });

      await this.logActivity(campaignId, 'info', `Generated ${generatedContent.length} piece(s) of content`);

      // Step 4: Save generated content to database
      const contentRecords = [];
      for (const content of generatedContent) {
        const { data, error } = await supabase
          .from('automation_content')
          .insert({
            campaign_id: campaignId,
            prompt_type: content.type,
            content: content.content,
            word_count: content.wordCount
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to save content: ${error.message}`);
        }

        contentRecords.push(data);
      }

      // Step 5: Update status to publishing
      await this.updateCampaignStatus(campaignId, 'publishing');
      await this.logActivity(campaignId, 'info', 'Starting content publication');

      // Step 6: Publish content to Telegraph
      const publishedLinks = [];
      for (const contentRecord of contentRecords) {
        try {
          const title = this.telegraphService.generateTitleFromContent(campaign.keyword);

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
        await this.updateCampaignStatus(campaignId, 'completed');
        await this.logActivity(campaignId, 'info', `Campaign completed successfully. Published ${publishedLinks.length} links.`);
      } else {
        await this.updateCampaignStatus(campaignId, 'failed', 'No content was successfully published');
        await this.logActivity(campaignId, 'error', 'Campaign failed: No content was successfully published');
      }

    } catch (error) {
      console.error('Campaign processing error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateCampaignStatus(campaignId, 'failed', errorMessage);
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
        log_level: level,
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
