import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { supabase } from '@/integrations/supabase/client';
import { PlaywrightCommentEngine } from './PlaywrightCommentEngine';

export interface CampaignBrowserInstance {
  campaignId: string;
  campaignName: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  engine: PlaywrightCommentEngine;
  status: 'initializing' | 'idle' | 'working' | 'error' | 'paused';
  lastActivity: Date;
  processedJobs: number;
  errors: string[];
}

export interface BrowserPoolStats {
  totalInstances: number;
  activeInstances: number;
  idleInstances: number;
  errorInstances: number;
  totalJobsProcessed: number;
  memoryUsage: number;
}

export class BrowserPoolManager {
  private instances: Map<string, CampaignBrowserInstance> = new Map();
  private maxInstances: number = 10;
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private onStatusUpdate?: (stats: BrowserPoolStats, instances: CampaignBrowserInstance[]) => void;

  constructor(maxInstances: number = 10) {
    this.maxInstances = maxInstances;
  }

  // Set callback for status updates
  setStatusUpdateCallback(callback: (stats: BrowserPoolStats, instances: CampaignBrowserInstance[]) => void) {
    this.onStatusUpdate = callback;
  }

  // Start monitoring all browser instances
  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 Starting browser pool monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      await this.monitorInstances();
      this.updateStatus();
    }, 5000); // Monitor every 5 seconds
  }

  // Stop monitoring
  async stopMonitoring() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('⏹️ Stopped browser pool monitoring');
  }

  // Create a new browser instance for a campaign
  async createCampaignBrowser(campaignId: string, campaignName: string): Promise<CampaignBrowserInstance> {
    if (this.instances.has(campaignId)) {
      throw new Error(`Browser instance for campaign ${campaignId} already exists`);
    }

    if (this.instances.size >= this.maxInstances) {
      throw new Error(`Maximum browser instances (${this.maxInstances}) reached`);
    }

    console.log(`🚀 Creating browser instance for campaign: ${campaignName}`);

    try {
      // Launch browser with specific configuration for automation
      const browser = await chromium.launch({
        headless: true, // Can be changed to false for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      // Create isolated browser context
      const context = await browser.newContext({
        userAgent: this.generateRandomUserAgent(),
        viewport: { width: 1366, height: 768 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      // Create main page
      const page = await context.newPage();
      
      // Initialize comment engine for this instance
      const engine = new PlaywrightCommentEngine();
      await engine.initializeWithContext(context);

      // Create instance record
      const instance: CampaignBrowserInstance = {
        campaignId,
        campaignName,
        browser,
        context,
        page,
        engine,
        status: 'initializing',
        lastActivity: new Date(),
        processedJobs: 0,
        errors: []
      };

      // Store instance
      this.instances.set(campaignId, instance);

      // Set up page error handling
      page.on('pageerror', (error) => {
        console.error(`Page error in campaign ${campaignName}:`, error);
        instance.errors.push(error.message);
        instance.status = 'error';
      });

      page.on('crash', () => {
        console.error(`Page crashed in campaign ${campaignName}`);
        instance.status = 'error';
        instance.errors.push('Page crashed');
      });

      // Mark as idle and ready
      instance.status = 'idle';
      instance.lastActivity = new Date();

      console.log(`✅ Browser instance created for campaign: ${campaignName}`);
      this.updateStatus();

      return instance;
    } catch (error) {
      console.error(`Failed to create browser instance for campaign ${campaignName}:`, error);
      throw error;
    }
  }

  // Get browser instance for a campaign
  getBrowserInstance(campaignId: string): CampaignBrowserInstance | undefined {
    return this.instances.get(campaignId);
  }

  // Start automation for a specific campaign
  async startCampaignAutomation(campaignId: string) {
    const instance = this.instances.get(campaignId);
    if (!instance) {
      throw new Error(`No browser instance found for campaign ${campaignId}`);
    }

    if (instance.status === 'working') {
      console.log(`Campaign ${instance.campaignName} is already working`);
      return;
    }

    console.log(`▶️ Starting automation for campaign: ${instance.campaignName}`);
    instance.status = 'working';
    instance.lastActivity = new Date();

    try {
      // Get pending jobs for this campaign
      const { data: jobs, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'approved')
        .limit(5); // Process 5 jobs at a time

      if (error) throw error;

      if (!jobs || jobs.length === 0) {
        console.log(`No approved jobs found for campaign ${instance.campaignName}`);
        instance.status = 'idle';
        return;
      }

      // Process jobs sequentially
      for (const job of jobs) {
        try {
          console.log(`Processing job ${job.id} for campaign ${instance.campaignName}`);
          
          // Update job status to processing
          await supabase
            .from('blog_comments')
            .update({ status: 'processing' })
            .eq('id', job.id);

          // Process the job using the campaign's browser instance
          const result = await instance.engine.postComment({
            id: job.id,
            campaign_id: job.campaign_id,
            blog_url: job.blog_url,
            target_keyword: job.keyword || 'default',
            target_url: job.target_url || '',
            account_id: job.account_id,
            status: 'processing'
          });

          // Update job status based on result
          await supabase
            .from('blog_comments')
            .update({ 
              status: result.success ? 'posted' : 'failed',
              error_message: result.success ? null : result.message,
              posted_at: result.success ? new Date().toISOString() : null
            })
            .eq('id', job.id);

          instance.processedJobs++;
          instance.lastActivity = new Date();

          // Add delay between jobs to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
          
        } catch (jobError) {
          console.error(`Error processing job ${job.id}:`, jobError);
          instance.errors.push(`Job ${job.id}: ${jobError.message}`);
          
          // Mark job as failed
          await supabase
            .from('blog_comments')
            .update({ 
              status: 'failed',
              error_message: jobError.message
            })
            .eq('id', job.id);
        }
      }

      instance.status = 'idle';
      console.log(`✅ Completed automation batch for campaign: ${instance.campaignName}`);

    } catch (error) {
      console.error(`Error in campaign automation for ${instance.campaignName}:`, error);
      instance.status = 'error';
      instance.errors.push(error.message);
    }

    this.updateStatus();
  }

  // Pause automation for a campaign
  async pauseCampaignAutomation(campaignId: string) {
    const instance = this.instances.get(campaignId);
    if (instance) {
      instance.status = 'paused';
      console.log(`⏸️ Paused automation for campaign: ${instance.campaignName}`);
      this.updateStatus();
    }
  }

  // Resume automation for a campaign
  async resumeCampaignAutomation(campaignId: string) {
    const instance = this.instances.get(campaignId);
    if (instance && instance.status === 'paused') {
      instance.status = 'idle';
      console.log(`▶️ Resumed automation for campaign: ${instance.campaignName}`);
      this.updateStatus();
    }
  }

  // Close browser instance for a campaign
  async closeCampaignBrowser(campaignId: string) {
    const instance = this.instances.get(campaignId);
    if (!instance) return;

    console.log(`🔴 Closing browser instance for campaign: ${instance.campaignName}`);

    try {
      await instance.engine.cleanup();
      await instance.context.close();
      await instance.browser.close();
    } catch (error) {
      console.error(`Error closing browser for campaign ${instance.campaignName}:`, error);
    }

    this.instances.delete(campaignId);
    this.updateStatus();
  }

  // Close all browser instances
  async closeAllBrowsers() {
    console.log('🔴 Closing all browser instances...');
    
    for (const [campaignId] of this.instances) {
      await this.closeCampaignBrowser(campaignId);
    }

    await this.stopMonitoring();
  }

  // Monitor all instances for health and activity
  private async monitorInstances() {
    const now = new Date();
    
    for (const [campaignId, instance] of this.instances) {
      // Check for inactive instances (no activity for 10 minutes)
      const timeSinceLastActivity = now.getTime() - instance.lastActivity.getTime();
      if (timeSinceLastActivity > 10 * 60 * 1000 && instance.status === 'idle') {
        console.log(`⚠️ Instance for campaign ${instance.campaignName} has been idle for 10+ minutes`);
      }

      // Check for error instances that need cleanup
      if (instance.status === 'error' && instance.errors.length > 5) {
        console.log(`⚠️ Instance for campaign ${instance.campaignName} has too many errors, considering restart`);
      }

      // Auto-process jobs for idle instances
      if (instance.status === 'idle') {
        const { data: pendingJobs } = await supabase
          .from('blog_comments')
          .select('count')
          .eq('campaign_id', campaignId)
          .eq('status', 'approved');

        if (pendingJobs && pendingJobs[0]?.count > 0) {
          // Start automation if there are pending jobs
          this.startCampaignAutomation(campaignId).catch(error => {
            console.error(`Auto-start failed for campaign ${instance.campaignName}:`, error);
          });
        }
      }
    }
  }

  // Generate random user agent for browser instances
  private generateRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  // Update status and notify listeners
  private updateStatus() {
    if (!this.onStatusUpdate) return;

    const stats: BrowserPoolStats = {
      totalInstances: this.instances.size,
      activeInstances: Array.from(this.instances.values()).filter(i => i.status === 'working').length,
      idleInstances: Array.from(this.instances.values()).filter(i => i.status === 'idle').length,
      errorInstances: Array.from(this.instances.values()).filter(i => i.status === 'error').length,
      totalJobsProcessed: Array.from(this.instances.values()).reduce((sum, i) => sum + i.processedJobs, 0),
      memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0
    };

    const instances = Array.from(this.instances.values());
    this.onStatusUpdate(stats, instances);
  }

  // Get current stats
  getStats(): BrowserPoolStats {
    return {
      totalInstances: this.instances.size,
      activeInstances: Array.from(this.instances.values()).filter(i => i.status === 'working').length,
      idleInstances: Array.from(this.instances.values()).filter(i => i.status === 'idle').length,
      errorInstances: Array.from(this.instances.values()).filter(i => i.status === 'error').length,
      totalJobsProcessed: Array.from(this.instances.values()).reduce((sum, i) => sum + i.processedJobs, 0),
      memoryUsage: 0 // Browser memory is harder to track
    };
  }

  // Get all instances
  getAllInstances(): CampaignBrowserInstance[] {
    return Array.from(this.instances.values());
  }
}

// Singleton instance
export const browserPoolManager = new BrowserPoolManager();
