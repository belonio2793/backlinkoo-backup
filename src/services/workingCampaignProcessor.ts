import { supabase } from '@/integrations/supabase/client';
import { SimpleCampaign } from '@/integrations/supabase/types';
import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';
import { realTimeFeedService } from './realTimeFeedService';
import { campaignNetworkLogger } from './campaignNetworkLogger';

/**
 * Working Campaign Processor - Simplified server-side processing
 * Uses simplified server-side functions to bypass browser analytics blocking
 */
export class WorkingCampaignProcessor {
  
  /**
   * Process a campaign from start to finish using simplified server-side approach
   */
  async processCampaign(campaign: SimpleCampaign): Promise<{ success: boolean; publishedUrl?: string; error?: string }> {
    const keyword = campaign.keywords[0] || 'default keyword';
    const anchorText = campaign.anchor_texts[0] || 'click here';
    const targetUrl = campaign.target_url;
    
    try {
      console.log(`🚀 Processing campaign: ${campaign.name}`);

      // Start network monitoring for this campaign
      campaignNetworkLogger.startMonitoring(campaign.id);
      campaignNetworkLogger.setCurrentCampaignId(campaign.id);

      // Step 1: Update status to active
      await this.updateCampaignStatus(campaign.id, 'active');
      await this.logActivity(campaign.id, 'info', 'Campaign processing started');

      // Step 2: Use simplified server-side processor to avoid browser analytics issues
      console.log('🔄 Using simplified server-side processor...');
      realTimeFeedService.emitSystemEvent(`Processing campaign "${keyword}" server-side`, 'info');

      // Log the function call
      const functionCallId = campaignNetworkLogger.logFunctionCall(
        campaign.id,
        'simple-campaign-processor',
        { keyword, anchorText, targetUrl, campaignId: campaign.id },
        'content-generation'
      );

      const functionStartTime = Date.now();
      const response = await fetch('/.netlify/functions/simple-campaign-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          anchorText,
          targetUrl,
          campaignId: campaign.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const functionDuration = Date.now() - functionStartTime;

        // Log the failed function call
        campaignNetworkLogger.updateFunctionCall(
          functionCallId,
          null,
          `${response.status} - ${errorText}`,
          functionDuration
        );

        throw new Error(`Server-side processing failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const functionDuration = Date.now() - functionStartTime;

      // Log successful function call
      campaignNetworkLogger.updateFunctionCall(
        functionCallId,
        result,
        undefined,
        functionDuration
      );
      
      if (!result.success) {
        throw new Error(`Campaign processing failed: ${result.error}`);
      }

      const publishedUrl = result.data.publishedUrl;
      
      console.log('✅ Content generated and published successfully via server-side processor');
      console.log('📤 Published successfully:', publishedUrl);
      
      realTimeFeedService.emitContentGenerated(
        campaign.id,
        campaign.name,
        keyword,
        result.data.content?.length || 0,
        campaign.user_id
      );

      // Step 3: Save published link to database
      await this.savePublishedLink(campaign.id, publishedUrl);
      
      realTimeFeedService.emitUrlPublished(
        campaign.id,
        campaign.name,
        keyword,
        publishedUrl,
        'Telegraph.ph',
        campaign.user_id
      );

      // Step 4: Mark campaign as completed
      await this.updateCampaignStatus(campaign.id, 'completed');
      await this.logActivity(campaign.id, 'info', `Campaign completed successfully. Published: ${publishedUrl}`);
      
      realTimeFeedService.emitCampaignCompleted(
        campaign.id,
        campaign.name,
        keyword,
        [publishedUrl]
      );

      console.log('🎉 Campaign processing completed successfully');
      
      return { 
        success: true, 
        publishedUrl 
      };

    } catch (error) {
      console.error('❌ Campaign processing failed:', error);

      // Check for specific error types and provide user-friendly messages
      let errorMessage = this.formatCampaignError(error);

      // Mark campaign as paused with error
      await this.updateCampaignStatus(campaign.id, 'paused');
      await this.logActivity(campaign.id, 'error', `Campaign failed: ${errorMessage}`);

      realTimeFeedService.emitCampaignFailed(
        campaign.id,
        campaign.name,
        keyword,
        errorMessage
      );

      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Format campaign-specific errors with user-friendly messages
   */
  private formatCampaignError(error: any): string {
    const errorMessage = formatErrorForUI(error);
    const lowerMessage = errorMessage.toLowerCase();
    
    // Check for analytics blocking issues
    if (lowerMessage.includes('analytics') || 
        lowerMessage.includes('blocked by browser') ||
        lowerMessage.includes('fullstory') ||
        lowerMessage.includes('network request blocked')) {
      return 'Network request blocked by browser analytics. Please try refreshing the page.';
    }
    
    // Check for Telegraph-specific issues
    if (lowerMessage.includes('telegraph') || 
        lowerMessage.includes('createaccount') ||
        lowerMessage.includes('createpage')) {
      return 'Telegraph publishing temporarily unavailable. Content generated but not published yet.';
    }
    
    // Check for content generation issues
    if (lowerMessage.includes('content generation') ||
        lowerMessage.includes('openai') ||
        lowerMessage.includes('api key')) {
      return 'Content generation service unavailable. Using fallback content template.';
    }
    
    // Check for network/connectivity issues
    if (lowerMessage.includes('fetch') ||
        lowerMessage.includes('network') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('timeout')) {
      return 'Network connectivity issue. Please check your internet connection and try again.';
    }
    
    // Return original message if no specific pattern matches
    return errorMessage;
  }

  /**
   * Update campaign status in database
   */
  private async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    const queryStartTime = Date.now();

    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId);

    const queryDuration = Date.now() - queryStartTime;

    // Log the database query
    campaignNetworkLogger.logDatabaseQuery(campaignId, {
      operation: 'update',
      table: 'campaigns',
      query: `UPDATE campaigns SET status = '${status}' WHERE id = '${campaignId}'`,
      params: { status, campaignId },
      result: error ? null : { success: true },
      error: error ? error.message : undefined,
      duration: queryDuration,
      step: 'database-update'
    });

    if (error) {
      console.error('Failed to update campaign status:', error);
      throw new Error(`Failed to update campaign status: ${error.message}`);
    }
  }

  /**
   * Log activity for campaign
   */
  private async logActivity(campaignId: string, type: string, message: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          campaign_id: campaignId,
          activity_type: type,
          message,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to log activity:', error);
      }
    } catch (error) {
      console.warn('Activity logging failed:', error);
    }
  }

  /**
   * Save published link to database
   */
  private async savePublishedLink(campaignId: string, url: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('published_links')
        .insert({
          campaign_id: campaignId,
          url,
          platform: 'Telegraph.ph',
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to save published link:', error);
      }
    } catch (error) {
      console.warn('Published link saving failed:', error);
    }
  }
}

// Export singleton instance
export const workingCampaignProcessor = new WorkingCampaignProcessor();
