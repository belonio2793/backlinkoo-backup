/**
 * Campaign Monitoring Service
 * 
 * Monitors active campaigns for progress and automatically pauses stuck campaigns
 * that haven't made progress within expected timeframes.
 */

import { supabase } from '@/integrations/supabase/client';
import { getOrchestrator, type Campaign } from './automationOrchestrator';
import { realTimeFeedService } from './realTimeFeedService';
import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';

export interface CampaignMonitoringConfig {
  // Maximum time a campaign can be "active" without progress before auto-pause
  maxStuckTimeMs: number;
  // How often to check for stuck campaigns
  checkIntervalMs: number;
  // Maximum time to wait for campaign initialization
  maxInitTimeMs: number;
  // Enable/disable monitoring
  enabled: boolean;
}

export interface CampaignProgressCheck {
  campaignId: string;
  campaignName: string;
  keyword: string;
  status: Campaign['status'];
  createdAt: Date;
  lastActivityAt?: Date;
  timeSinceCreated: number;
  timeSinceLastActivity: number;
  isStuck: boolean;
  stuckReason?: string;
  shouldAutoPause: boolean;
}

export class CampaignMonitoringService {
  private static instance: CampaignMonitoringService;
  private orchestrator = getOrchestrator();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private config: CampaignMonitoringConfig = {
    maxStuckTimeMs: 10 * 60 * 1000, // 10 minutes
    checkIntervalMs: 2 * 60 * 1000,  // Check every 2 minutes
    maxInitTimeMs: 5 * 60 * 1000,    // 5 minutes for initialization
    enabled: true
  };

  static getInstance(): CampaignMonitoringService {
    if (!this.instance) {
      this.instance = new CampaignMonitoringService();
    }
    return this.instance;
  }

  /**
   * Start campaign monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring || !this.config.enabled) {
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Campaign monitoring service started');
    
    realTimeFeedService.emitSystemEvent(
      'Campaign monitoring service started - checking for stuck campaigns',
      'info'
    );

    // Initial check
    this.checkCampaigns();

    // Set up recurring checks
    this.monitoringInterval = setInterval(() => {
      this.checkCampaigns();
    }, this.config.checkIntervalMs);
  }

  /**
   * Stop campaign monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🔍 Campaign monitoring service stopped');
    realTimeFeedService.emitSystemEvent(
      'Campaign monitoring service stopped',
      'info'
    );
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<CampaignMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled === false && this.isMonitoring) {
      this.stopMonitoring();
    } else if (newConfig.enabled === true && !this.isMonitoring) {
      this.startMonitoring();
    }
  }

  /**
   * Check all active campaigns for progress issues
   */
  private async checkCampaigns(): Promise<void> {
    try {
      const campaigns = await this.orchestrator.getUserCampaigns();
      const activeCampaigns = campaigns.filter(c => c.status === 'active');

      if (activeCampaigns.length === 0) {
        // No active campaigns to monitor
        return;
      }

      console.log(`🔍 Checking ${activeCampaigns.length} active campaign(s) for progress issues`);

      const progressChecks = await Promise.all(
        activeCampaigns.map(campaign => this.checkCampaignProgress(campaign))
      );

      const stuckCampaigns = progressChecks.filter(check => check.shouldAutoPause);

      if (stuckCampaigns.length > 0) {
        console.log(`🚨 Found ${stuckCampaigns.length} stuck campaign(s), auto-pausing them`);
        
        for (const stuckCampaign of stuckCampaigns) {
          await this.autoPauseStuckCampaign(stuckCampaign);
        }
      } else {
        // All campaigns are progressing normally
        realTimeFeedService.emitSystemEvent(
          `Campaign monitoring: ${activeCampaigns.length} active campaign(s) progressing normally`,
          'info'
        );
      }

    } catch (error) {
      console.error('Error in campaign monitoring check:', formatErrorForLogging(error, 'checkCampaigns'));
      realTimeFeedService.emitSystemEvent(
        `Campaign monitoring error: ${formatErrorForUI(error)}`,
        'error'
      );
    }
  }

  /**
   * Check individual campaign progress
   */
  private async checkCampaignProgress(campaign: Campaign): Promise<CampaignProgressCheck> {
    const now = new Date();
    const createdAt = new Date(campaign.created_at);
    const timeSinceCreated = now.getTime() - createdAt.getTime();

    // Get last activity from logs
    const logs = await this.orchestrator.getCampaignLogs(campaign.id);
    const lastActivityLog = logs.find(log => 
      log.level === 'info' && 
      !log.message.includes('monitoring') &&
      !log.message.includes('checking')
    );
    
    const lastActivityAt = lastActivityLog ? new Date(lastActivityLog.created_at) : createdAt;
    const timeSinceLastActivity = now.getTime() - lastActivityAt.getTime();

    // Determine if campaign is stuck
    let isStuck = false;
    let stuckReason: string | undefined;
    let shouldAutoPause = false;

    // Check for initialization timeout (campaign created but never started processing)
    if (timeSinceCreated > this.config.maxInitTimeMs && timeSinceLastActivity === timeSinceCreated) {
      isStuck = true;
      stuckReason = 'Campaign failed to initialize within expected timeframe';
      shouldAutoPause = true;
    }
    // Check for processing timeout (campaign started but no recent activity)
    else if (timeSinceLastActivity > this.config.maxStuckTimeMs) {
      isStuck = true;
      stuckReason = 'Campaign has not made progress within expected timeframe';
      shouldAutoPause = true;
    }
    // Check for campaigns that are active but have error messages
    else if (campaign.error_message) {
      isStuck = true;
      stuckReason = 'Campaign has error message but is still marked as active';
      shouldAutoPause = true;
    }

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      keyword: campaign.keywords[0] || 'Unknown',
      status: campaign.status,
      createdAt,
      lastActivityAt: lastActivityAt !== createdAt ? lastActivityAt : undefined,
      timeSinceCreated,
      timeSinceLastActivity,
      isStuck,
      stuckReason,
      shouldAutoPause
    };
  }

  /**
   * Auto-pause a stuck campaign
   */
  private async autoPauseStuckCampaign(progressCheck: CampaignProgressCheck): Promise<void> {
    try {
      const errorMessage = `Auto-paused: ${progressCheck.stuckReason}. Campaign was stuck for ${this.formatDuration(progressCheck.timeSinceLastActivity)}.`;
      
      console.log(`🚨 Auto-pausing stuck campaign: ${progressCheck.campaignName} (${progressCheck.keyword})`);
      console.log(`   Reason: ${progressCheck.stuckReason}`);
      console.log(`   Time since last activity: ${this.formatDuration(progressCheck.timeSinceLastActivity)}`);

      // Update campaign status in database with error handling
      try {
        const { error: updateError } = await supabase
          .from('automation_campaigns')
          .update({
            status: 'paused',
            updated_at: new Date().toISOString()
          })
          .eq('id', progressCheck.campaignId);

        if (updateError) {
          console.error('Error updating stuck campaign status:', updateError);
          // Don't throw here - try to continue with logging and events
        }
      } catch (dbError) {
        console.error('Database update failed for stuck campaign:', formatErrorForLogging(dbError, 'autoPauseStuckCampaign'));
        // Continue with other operations even if database update fails
      }

      // Log the auto-pause action
      await this.orchestrator.logActivity(
        progressCheck.campaignId,
        'warning',
        `Campaign monitoring: ${errorMessage}`
      );

      // Emit real-time events
      const { data: { user } } = await supabase.auth.getUser();
      
      realTimeFeedService.emitCampaignAutoPaused(
        progressCheck.campaignId,
        progressCheck.campaignName,
        progressCheck.keyword,
        progressCheck.stuckReason || 'Campaign monitoring detected stuck state',
        'stuck_campaign_detection',
        user?.id
      );

      realTimeFeedService.emitSystemEvent(
        `Auto-paused stuck campaign "${progressCheck.keyword}" - ${progressCheck.stuckReason}`,
        'warning'
      );

    } catch (error) {
      console.error('Error auto-pausing stuck campaign:', formatErrorForLogging(error, 'autoPauseStuckCampaign'));
      realTimeFeedService.emitSystemEvent(
        `Failed to auto-pause stuck campaign "${progressCheck.keyword}": ${formatErrorForUI(error)}`,
        'error'
      );
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get monitoring status and statistics
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    config: CampaignMonitoringConfig;
    lastCheckTime?: Date;
    activeCampaignCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      activeCampaignCount: 0 // This would be populated by the last check
    };
  }

  /**
   * Force check all campaigns now (for testing/debugging)
   */
  async forceCheck(): Promise<void> {
    console.log('🔍 Force checking campaigns for stuck state');
    await this.checkCampaigns();
  }

  /**
   * Get detailed progress check for a specific campaign
   */
  async getCampaignProgressCheck(campaignId: string): Promise<CampaignProgressCheck | null> {
    try {
      const campaign = await this.orchestrator.getCampaign(campaignId);
      if (!campaign) {
        return null;
      }

      return await this.checkCampaignProgress(campaign);
    } catch (error) {
      console.error('Error getting campaign progress check:', error);
      return null;
    }
  }
}

// Export singleton instance
export const campaignMonitoringService = CampaignMonitoringService.getInstance();

// Auto-start monitoring when service is imported
if (typeof window !== 'undefined') {
  // Start monitoring after a short delay to allow other services to initialize
  setTimeout(() => {
    campaignMonitoringService.startMonitoring();
  }, 5000);

  // Make available globally for debugging
  (window as any).campaignMonitoringService = campaignMonitoringService;
  console.log('🔍 Campaign monitoring service available globally as window.campaignMonitoringService');
}
