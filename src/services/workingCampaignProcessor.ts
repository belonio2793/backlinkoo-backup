import { supabase } from '@/integrations/supabase/client';
import { SimpleCampaign } from '@/integrations/supabase/types';
import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';
import { realTimeFeedService } from './realTimeFeedService';
import { campaignNetworkLogger } from './campaignNetworkLogger';
import { responseBodyManager } from '@/utils/responseBodyFix';
import { developmentCampaignProcessor } from './developmentCampaignProcessor';
import { PlatformConfigService } from './platformConfigService';

/**
 * Working Campaign Processor - Simplified server-side processing
 * Uses simplified server-side functions to bypass browser analytics blocking
 */
export class WorkingCampaignProcessor {
  
  /**
   * Process a campaign from start to finish using simplified server-side approach
   * Automatically uses development processor in development environment
   */
  async processCampaign(campaign: SimpleCampaign): Promise<{ success: boolean; publishedUrl?: string; error?: string }> {
    // Check if we're in development environment
    if (this.isDevelopmentEnvironment()) {
      console.log('🎭 Development environment detected - using development campaign processor');
      try {
        const result = await developmentCampaignProcessor.processCampaign(campaign);
        return {
          success: result.success,
          publishedUrl: result.publishedUrls[0],
          error: result.error
        };
      } catch (error) {
        console.error('❌ Development campaign processing failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Continue with production processing
    const keyword = campaign.keywords[0] || 'default keyword';
    const anchorText = campaign.anchor_texts[0] || 'click here';
    const targetUrl = campaign.target_url;

    try {
      console.log(`🚀 Processing campaign: ${campaign.name}`);
      console.log('🏭 Using production server-side processor');

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
        'working-campaign-processor',
        { keyword, anchorText, targetUrl, campaignId: campaign.id },
        'content-generation'
      );

      const functionStartTime = Date.now();
      const response = await fetch('/.netlify/functions/working-campaign-processor', {
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

      // Clone response immediately to avoid consumption conflicts
      const responseClone = response.clone();
      const functionDuration = Date.now() - functionStartTime;

      if (!response.ok) {
        let errorText = 'Unknown error';

        try {
          errorText = await responseClone.text();
        } catch (readError) {
          console.warn('Failed to read error response:', readError);
          errorText = `HTTP ${response.status} - ${response.statusText}`;
        }

        // Log the failed function call
        campaignNetworkLogger.updateFunctionCall(
          functionCallId,
          null,
          `${response.status} - ${errorText}`,
          functionDuration
        );

        throw new Error(`Server-side processing failed: ${response.status} - ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse JSON response, trying text:', parseError);
        try {
          // If JSON parsing fails, try reading as text
          const textResponse = await responseClone.text();
          result = { success: false, error: `Invalid JSON response: ${textResponse}` };
        } catch (textError) {
          console.warn('Failed to read response as text:', textError);
          result = { success: false, error: 'Failed to parse server response' };
        }
      }

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

      const publishedUrls = result.data.publishedUrls || [];
      const totalPosts = result.data.totalPosts || publishedUrls.length;

      console.log('�� Content generated and published successfully via server-side processor');
      console.log(`📤 Published ${totalPosts} posts successfully:`, publishedUrls);

      realTimeFeedService.emitContentGenerated(
        campaign.id,
        campaign.name,
        keyword,
        totalPosts * 500, // Approximate word count
        campaign.user_id
      );

      // Step 3: Save all published links to database
      for (const url of publishedUrls) {
        await this.savePublishedLink(campaign.id, url);

        realTimeFeedService.emitUrlPublished(
          campaign.id,
          campaign.name,
          keyword,
          url,
          'Telegraph.ph',
          campaign.user_id
        );
      }

      // Step 4: Campaign status is already handled by the netlify function
      // The working-campaign-processor function manages platform rotation and completion
      await this.logActivity(campaign.id, 'info', `Campaign processing completed. Published ${totalPosts} posts: ${publishedUrls.join(', ')}`);

      console.log('🎉 Campaign processing completed successfully - status managed by netlify function');

      return {
        success: true,
        publishedUrl: publishedUrls[0], // For backward compatibility
        publishedUrls,
        totalPosts
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
   * Update campaign status in database with fallback table names
   */
  private async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    const queryStartTime = Date.now();

    // Use automation-specific table (separate from blog service)
    const tableNames = ['automation_campaigns'];
    let lastError = null;

    for (const tableName of tableNames) {
      try {
        const { error } = await supabase
          .from(tableName)
          .update({ status })
          .eq('id', campaignId);

        const queryDuration = Date.now() - queryStartTime;

        // Log the database query
        campaignNetworkLogger.logDatabaseQuery(campaignId, {
          operation: 'update',
          table: tableName,
          query: `UPDATE ${tableName} SET status = '${status}' WHERE id = '${campaignId}'`,
          params: { status, campaignId },
          result: error ? null : { success: true },
          error: error ? error.message : undefined,
          duration: queryDuration,
          step: 'database-update'
        });

        if (!error) {
          console.log(`✅ Successfully updated campaign status in ${tableName} table`);
          return; // Success, exit function
        }

        lastError = error;
        console.warn(`Failed to update campaign status in ${tableName}:`, error.message);

      } catch (error) {
        lastError = error;
        console.warn(`Error accessing ${tableName} table:`, error);
      }
    }

    // If we get here, all table attempts failed
    console.error('Failed to update campaign status in any table:', lastError);
    // Don't throw error - campaign can continue without status update
    console.warn('Campaign will continue without status update');
  }

  /**
   * Log activity for campaign with fallback handling
   */
  private async logActivity(campaignId: string, type: string, message: string): Promise<void> {
    try {
      const queryStartTime = Date.now();

      const { error } = await supabase
        .from('automation_logs')
        .insert({
          campaign_id: campaignId,
          log_level: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info',
          message,
          step_name: 'campaign-processing',
          timestamp: new Date().toISOString()
        });

      const queryDuration = Date.now() - queryStartTime;

      // Log the database query
      campaignNetworkLogger.logDatabaseQuery(campaignId, {
        operation: 'insert',
        table: 'activity_logs',
        query: `INSERT INTO activity_logs (campaign_id, activity_type, message, timestamp) VALUES (...)`,
        params: { campaign_id: campaignId, activity_type: type, message },
        result: error ? null : { success: true },
        error: error ? error.message : undefined,
        duration: queryDuration,
        step: 'activity-logging'
      });

      if (error) {
        console.warn('Failed to log activity to activity_logs table:', error.message);
        // Don't let logging failure stop the campaign
      } else {
        console.log(`✅ Activity logged successfully: ${type} - ${message}`);
      }
    } catch (error) {
      console.warn('Activity logging failed completely:', error);
      // Don't let logging failure stop the campaign
    }
  }

  /**
   * Save published link to database with fallback table names
   */
  private async savePublishedLink(campaignId: string, url: string): Promise<void> {
    // Use automation-specific table (separate from blog service)
    const tableNames = ['automation_published_links'];

    for (const tableName of tableNames) {
      try {
        const linkData = {
          campaign_id: campaignId,
          published_url: url,
          platform: 'telegraph',
          status: 'active',
          validation_status: 'pending',
          published_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from(tableName)
          .insert(linkData);

        if (!error) {
          console.log(`✅ Successfully saved published link to ${tableName} table`);
          return; // Success, exit function
        }

        console.warn(`Failed to save published link to ${tableName}:`, error.message);

      } catch (error) {
        console.warn(`Error accessing ${tableName} table:`, error);
      }
    }

    console.warn('Failed to save published link to any table - continuing without saving');
  }

  /**
   * Check if all active platforms have completed for a campaign
   */
  private async checkAllPlatformsCompleted(campaignId: string): Promise<boolean> {
    try {
      // Get active platforms from centralized configuration
      const activePlatforms = PlatformConfigService.getActivePlatforms();

      // Get published links for this campaign from Supabase
      const supabase = (await import('@/integrations/supabase/client')).supabase;

      const { data: publishedLinks, error } = await supabase
        .from('automation_published_links')
        .select('platform, published_url')
        .eq('campaign_id', campaignId)
        .eq('status', 'active');

      if (error) {
        console.warn('Failed to fetch published links:', error);
        return false; // Default to not completing if we can't check
      }

      // Check if all active platforms have published content using centralized service
      const publishedPlatformIds = (publishedLinks || []).map(link => link.platform);
      const allCompleted = PlatformConfigService.areAllPlatformsCompleted(publishedPlatformIds);

      console.log(`🔍 Platform completion check for campaign ${campaignId}:`, {
        activePlatforms: activePlatforms.map(p => p.id),
        publishedPlatforms: publishedPlatformIds,
        allCompleted
      });

      return allCompleted;
    } catch (error) {
      console.warn('Failed to check platform completion:', error);
      return false; // Default to not completing if check fails
    }
  }

  /**
   * Check if we're in development environment
   */
  private isDevelopmentEnvironment(): boolean {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('.dev') ||
      import.meta.env.DEV ||
      // Force development mode if Netlify functions are not accessible
      !window.location.hostname.includes('builder.io')
    );
  }
}

// Export singleton instance
export const workingCampaignProcessor = new WorkingCampaignProcessor();
