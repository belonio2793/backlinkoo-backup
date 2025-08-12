import { browserPoolManager } from './BrowserPoolManager';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignConfig {
  id: string;
  name: string;
  keyword: string;
  target_url: string;
  status: 'active' | 'paused' | 'completed';
  automation_enabled: boolean;
}

export class CampaignBrowserManager {
  private activeCampaigns: Set<string> = new Set();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  // Start monitoring active campaigns and creating browser instances
  async startCampaignMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🎯 Starting campaign browser monitoring...');
    
    // Start the browser pool monitoring
    await browserPoolManager.startMonitoring();
    
    // Monitor campaigns every 10 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.syncCampaignBrowsers();
    }, 10000);
    
    // Initial sync
    await this.syncCampaignBrowsers();
  }

  // Stop monitoring
  async stopCampaignMonitoring() {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    await browserPoolManager.stopMonitoring();
    console.log('⏹️ Stopped campaign browser monitoring');
  }

  // Sync browser instances with active campaigns
  private async syncCampaignBrowsers() {
    try {
      // Get all campaigns with automation enabled
      const { data: campaigns, error } = await supabase
        .from('blog_campaigns')
        .select('*')
        .eq('automation_enabled', true);

      if (error) {
        console.error('Error fetching campaigns:', error);
        return;
      }

      if (!campaigns) return;

      const activeCampaignIds = new Set<string>();
      const currentInstances = browserPoolManager.getAllInstances();
      const currentInstanceIds = new Set(currentInstances.map(i => i.campaignId));

      // Process each campaign
      for (const campaign of campaigns) {
        if (campaign.status === 'active') {
          activeCampaignIds.add(campaign.id);
          
          // Create browser instance if it doesn't exist
          if (!currentInstanceIds.has(campaign.id)) {
            try {
              console.log(`🆕 Creating browser instance for campaign: ${campaign.name}`);
              await browserPoolManager.createCampaignBrowser(campaign.id, campaign.name);
              this.activeCampaigns.add(campaign.id);
            } catch (error) {
              console.error(`Failed to create browser for campaign ${campaign.name}:`, error);
            }
          } else {
            // Resume if paused
            const instance = browserPoolManager.getBrowserInstance(campaign.id);
            if (instance?.status === 'paused') {
              await browserPoolManager.resumeCampaignAutomation(campaign.id);
            }
          }
        } else if (campaign.status === 'paused') {
          // Pause existing browser instance
          const instance = browserPoolManager.getBrowserInstance(campaign.id);
          if (instance && instance.status !== 'paused') {
            await browserPoolManager.pauseCampaignAutomation(campaign.id);
          }
        }
      }

      // Close browser instances for campaigns that are no longer active
      for (const instance of currentInstances) {
        if (!activeCampaignIds.has(instance.campaignId)) {
          console.log(`🗑️ Closing browser instance for inactive campaign: ${instance.campaignName}`);
          await browserPoolManager.closeCampaignBrowser(instance.campaignId);
          this.activeCampaigns.delete(instance.campaignId);
        }
      }

      // Update active campaigns tracking
      this.activeCampaigns = activeCampaignIds;

    } catch (error) {
      console.error('Error syncing campaign browsers:', error);
    }
  }

  // Manually start automation for a specific campaign
  async startCampaignAutomation(campaignId: string, campaignName: string) {
    try {
      // Ensure browser instance exists
      let instance = browserPoolManager.getBrowserInstance(campaignId);
      
      if (!instance) {
        console.log(`Creating browser instance for campaign: ${campaignName}`);
        instance = await browserPoolManager.createCampaignBrowser(campaignId, campaignName);
      }

      // Start automation
      await browserPoolManager.startCampaignAutomation(campaignId);
      this.activeCampaigns.add(campaignId);
      
      return { success: true, message: `Automation started for ${campaignName}` };
    } catch (error: any) {
      console.error(`Failed to start automation for campaign ${campaignName}:`, error);
      return { success: false, message: error.message };
    }
  }

  // Stop automation for a specific campaign
  async stopCampaignAutomation(campaignId: string) {
    try {
      await browserPoolManager.closeCampaignBrowser(campaignId);
      this.activeCampaigns.delete(campaignId);
      
      return { success: true, message: 'Automation stopped' };
    } catch (error: any) {
      console.error(`Failed to stop automation for campaign ${campaignId}:`, error);
      return { success: false, message: error.message };
    }
  }

  // Pause automation for a specific campaign
  async pauseCampaignAutomation(campaignId: string) {
    try {
      await browserPoolManager.pauseCampaignAutomation(campaignId);
      return { success: true, message: 'Automation paused' };
    } catch (error: any) {
      console.error(`Failed to pause automation for campaign ${campaignId}:`, error);
      return { success: false, message: error.message };
    }
  }

  // Resume automation for a specific campaign
  async resumeCampaignAutomation(campaignId: string) {
    try {
      await browserPoolManager.resumeCampaignAutomation(campaignId);
      return { success: true, message: 'Automation resumed' };
    } catch (error: any) {
      console.error(`Failed to resume automation for campaign ${campaignId}:`, error);
      return { success: false, message: error.message };
    }
  }

  // Get status of all campaign browsers
  getCampaignBrowserStatus() {
    const instances = browserPoolManager.getAllInstances();
    const stats = browserPoolManager.getStats();
    
    return {
      stats,
      instances: instances.map(instance => ({
        campaignId: instance.campaignId,
        campaignName: instance.campaignName,
        status: instance.status,
        processedJobs: instance.processedJobs,
        lastActivity: instance.lastActivity,
        errors: instance.errors
      }))
    };
  }

  // Check if a campaign has an active browser instance
  hasBrowserInstance(campaignId: string): boolean {
    return browserPoolManager.getBrowserInstance(campaignId) !== undefined;
  }

  // Get browser instance status for a campaign
  getBrowserInstanceStatus(campaignId: string) {
    const instance = browserPoolManager.getBrowserInstance(campaignId);
    if (!instance) return null;
    
    return {
      status: instance.status,
      processedJobs: instance.processedJobs,
      lastActivity: instance.lastActivity,
      errorCount: instance.errors.length,
      isActive: instance.status === 'working'
    };
  }

  // Force process pending jobs for a campaign
  async processPendingJobs(campaignId: string) {
    try {
      const instance = browserPoolManager.getBrowserInstance(campaignId);
      if (!instance) {
        throw new Error('No browser instance found for campaign');
      }

      if (instance.status === 'working') {
        return { success: false, message: 'Campaign is already processing jobs' };
      }

      await browserPoolManager.startCampaignAutomation(campaignId);
      return { success: true, message: 'Started processing pending jobs' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Get detailed browser pool statistics
  getDetailedStats() {
    const stats = browserPoolManager.getStats();
    const instances = browserPoolManager.getAllInstances();
    
    return {
      ...stats,
      instanceDetails: instances.map(instance => ({
        campaignId: instance.campaignId,
        campaignName: instance.campaignName,
        status: instance.status,
        processedJobs: instance.processedJobs,
        errorCount: instance.errors.length,
        uptimeMinutes: Math.round((Date.now() - instance.lastActivity.getTime()) / 60000),
        isHealthy: instance.errors.length < 3 && instance.status !== 'error'
      })),
      totalActiveCampaigns: this.activeCampaigns.size,
      healthyInstances: instances.filter(i => i.errors.length < 3 && i.status !== 'error').length
    };
  }
}

// Singleton instance
export const campaignBrowserManager = new CampaignBrowserManager();
