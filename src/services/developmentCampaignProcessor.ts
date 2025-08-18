/**
 * Development Campaign Processor
 * Combines mock content generation with real Telegraph publishing for development environment
 */

import { supabase } from '@/integrations/supabase/client';
import { SimpleCampaign } from '@/integrations/supabase/types';
import { realTimeFeedService } from './realTimeFeedService';
import { campaignNetworkLogger } from './campaignNetworkLogger';
import MockContentGenerator from './mockContentGenerator';
import MockTelegraphPublisher from './mockTelegraphPublisher';
import MockWriteAsPublisher from './mockWriteAsPublisher';
import { PlatformConfigService } from './platformConfigService';

export interface DevelopmentProcessResult {
  success: boolean;
  publishedUrls: string[];
  totalPosts: number;
  error?: string;
  data?: {
    publishedUrls: string[];
    totalPosts: number;
    contentGenerated: boolean;
    telegraphPublished: boolean;
  };
}

export class DevelopmentCampaignProcessor {
  
  /**
   * Process a campaign using mock content generation and real Telegraph publishing
   */
  async processCampaign(campaign: SimpleCampaign): Promise<DevelopmentProcessResult> {
    const keyword = campaign.keywords[0] || 'digital marketing';
    const anchorText = campaign.anchor_texts[0] || 'click here';
    const targetUrl = campaign.target_url;
    
    try {
      console.log(`🚀 [DEV] Processing campaign: ${campaign.name}`);
      console.log('🎭 Using mock content generation + real Telegraph publishing');

      // Start network monitoring for this campaign
      campaignNetworkLogger.startMonitoring(campaign.id);
      campaignNetworkLogger.setCurrentCampaignId(campaign.id);

      // Step 1: Update status to active
      await this.updateCampaignStatus(campaign.id, 'active');
      await this.logActivity(campaign.id, 'info', 'Development campaign processing started');

      // Step 2: Generate mock content
      console.log('🎨 Generating mock content...');
      realTimeFeedService.emitSystemEvent(`Generating content for "${keyword}" (development mode)`, 'info');

      const contentResult = await MockContentGenerator.generateContent({
        keyword,
        anchorText,
        targetUrl
      });

      if (!contentResult.success) {
        throw new Error('Mock content generation failed');
      }

      console.log(`✅ Mock content generated: ${contentResult.data.wordCount} words`);

      // Emit content generated event
      realTimeFeedService.emitContentGenerated(
        campaign.id,
        campaign.name,
        keyword,
        contentResult.data.wordCount,
        campaign.user_id
      );

      // Step 3: Determine next platform and publish
      const nextPlatform = await this.getNextAvailablePlatform(campaign.id);
      console.log(`📡 Publishing to ${nextPlatform.name}...`);
      realTimeFeedService.emitSystemEvent(`Publishing "${contentResult.data.title}" to ${nextPlatform.name}`, 'info');

      let publishResult;
      if (nextPlatform.id === 'telegraph') {
        publishResult = await MockTelegraphPublisher.publishContent({
          title: contentResult.data.title,
          content: contentResult.data.content,
          authorName: 'Backlinkoo'
        });
      } else if (nextPlatform.id === 'writeas') {
        publishResult = await MockWriteAsPublisher.publishContent({
          title: contentResult.data.title,
          content: contentResult.data.content,
          authorName: 'Anonymous'
        });
      } else {
        throw new Error(`Unsupported platform: ${nextPlatform.id}`);
      }

      if (!publishResult.success) {
        throw new Error(`${nextPlatform.name} publishing failed: ${publishResult.error}`);
      }

      const publishedUrls = [publishResult.url];
      console.log(`✅ Published to ${nextPlatform.name}: ${publishResult.url}`);

      // Step 4: Save published link to database
      await this.savePublishedLink(campaign.id, publishResult.url, contentResult.data, nextPlatform.id);

      // Emit URL published event
      realTimeFeedService.emitUrlPublished(
        campaign.id,
        campaign.name,
        keyword,
        publishResult.url,
        nextPlatform.name,
        campaign.user_id
      );

      // Step 5: Keep campaign active for continuous rotation
      await this.updateCampaignStatus(campaign.id, 'active');
      await this.logActivity(
        campaign.id, 
        'info', 
        `Development campaign completed successfully. Published to: ${publishResult.url}`
      );

      // Emit completion event
      realTimeFeedService.emitCampaignCompleted(
        campaign.id,
        campaign.name,
        keyword,
        publishedUrls
      );

      console.log('🎉 Development campaign processing completed successfully');

      return {
        success: true,
        publishedUrls,
        totalPosts: 1,
        data: {
          publishedUrls,
          totalPosts: 1,
          contentGenerated: true,
          platformUsed: nextPlatform.id,
          platformName: nextPlatform.name
        }
      };

    } catch (error) {
      console.error('❌ Development campaign processing failed:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      // Mark campaign as paused with error
      await this.updateCampaignStatus(campaign.id, 'paused');
      await this.logActivity(campaign.id, 'error', `Development campaign failed: ${errorMessage}`);

      realTimeFeedService.emitCampaignFailed(
        campaign.id,
        campaign.name,
        keyword,
        errorMessage
      );

      return { 
        success: false, 
        publishedUrls: [],
        totalPosts: 0,
        error: errorMessage 
      };
    }
  }

  /**
   * Get next available platform for campaign (development version)
   */
  private async getNextAvailablePlatform(campaignId: string): Promise<{ id: string; name: string }> {
    try {
      // Get available platforms from centralized configuration
      const availablePlatforms = PlatformConfigService.getActivePlatforms();

      // Get existing published links for this campaign from database
      const { data: publishedLinks, error } = await supabase
        .from('automation_published_links')
        .select('platform')
        .eq('campaign_id', campaignId);

      if (error) {
        console.warn('Error checking published links, using first available platform:', error);
        return availablePlatforms[0] || { id: 'telegraph', name: 'Telegraph.ph' };
      }

      // Create set of used platforms (normalize legacy platform names)
      const usedPlatforms = new Set(
        (publishedLinks || []).map(link => {
          const platform = link.platform.toLowerCase();
          // Normalize legacy platform names
          if (platform === 'write.as' || platform === 'writeas') return 'writeas';
          if (platform === 'telegraph.ph' || platform === 'telegraph') return 'telegraph';
          return platform;
        })
      );

      console.log(`📊 [DEV] Campaign ${campaignId} - Used platforms:`, Array.from(usedPlatforms));

      // Find first available platform that hasn't been used
      for (const platform of availablePlatforms) {
        if (!usedPlatforms.has(platform.id)) {
          console.log(`✅ [DEV] Selected next platform: ${platform.id} (${platform.name})`);
          return platform;
        }
      }

      // All platforms have been used
      console.log(`⚠️ [DEV] All platforms used for campaign ${campaignId}, defaulting to Telegraph`);
      throw new Error('All available platforms have been used for this campaign');

    } catch (error) {
      console.error('Error getting next platform, defaulting to Telegraph:', error);
      return { id: 'telegraph', name: 'Telegraph.ph' };
    }
  }

  /**
   * Update campaign status in database
   */
  private async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_campaigns')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) {
        console.warn('Failed to update campaign status:', error.message);
      } else {
        console.log(`✅ Campaign status updated to: ${status}`);
      }
    } catch (error) {
      console.warn('Error updating campaign status:', error);
    }
  }

  /**
   * Log activity for campaign
   */
  private async logActivity(campaignId: string, level: string, message: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('automation_logs')
        .insert({
          campaign_id: campaignId,
          log_level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
          message,
          step_name: 'development-processing',
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to log activity:', error.message);
      } else {
        console.log(`📝 Activity logged: ${level} - ${message}`);
      }
    } catch (error) {
      console.warn('Activity logging failed:', error);
    }
  }

  /**
   * Save published link to database
   */
  private async savePublishedLink(
    campaignId: string,
    url: string,
    contentData: any,
    platform: string = 'telegraph'
  ): Promise<void> {
    try {
      // Save to automation_published_links
      const { error: linkError } = await supabase
        .from('automation_published_links')
        .insert({
          campaign_id: campaignId,
          published_url: url,
          anchor_text: contentData.anchorText,
          target_url: contentData.targetUrl,
          platform: platform,
          status: 'active',
          published_at: new Date().toISOString()
        });

      if (linkError) {
        console.warn('Failed to save published link:', linkError.message);
      }

      // Save to automation_content
      const { error: contentError } = await supabase
        .from('automation_content')
        .insert({
          campaign_id: campaignId,
          title: contentData.title,
          content: contentData.content,
          target_keyword: contentData.keyword,
          anchor_text: contentData.anchorText,
          backlink_url: contentData.targetUrl,
          platform: 'telegraph',
          published_url: url,
          status: 'published',
          created_at: contentData.generatedAt,
          published_at: new Date().toISOString(),
          word_count: contentData.wordCount,
          ai_model: 'mock-generator',
          generation_time_ms: 1500
        });

      if (contentError) {
        console.warn('Failed to save content record:', contentError.message);
      } else {
        console.log('✅ Published link and content saved to database');
      }

    } catch (error) {
      console.warn('Error saving published link:', error);
    }
  }

  /**
   * Test the development processor
   */
  static async runTest(): Promise<void> {
    console.log('🧪 Testing development campaign processor...');

    try {
      // Test mock content generation
      const contentResult = await MockContentGenerator.generateContent({
        keyword: 'test automation',
        anchorText: 'automation tools',
        targetUrl: 'https://backlinkoo.com'
      });

      console.log('✅ Mock content generation test passed:', contentResult.data.title);

      // Test Telegraph publishing
      const publishResult = await MockTelegraphPublisher.publishContent({
        title: contentResult.data.title,
        content: contentResult.data.content
      });

      console.log('✅ Telegraph publishing test passed:', publishResult.url);

      console.log('🎉 All development processor tests passed!');
      
    } catch (error) {
      console.error('❌ Development processor test failed:', error);
    }
  }
}

// Export singleton instance
export const developmentCampaignProcessor = new DevelopmentCampaignProcessor();

// Add test function to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testDevelopmentProcessor = DevelopmentCampaignProcessor.runTest;
}
