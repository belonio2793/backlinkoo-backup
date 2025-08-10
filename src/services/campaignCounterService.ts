/**
 * Campaign Counter Service
 * Provides realistic, persistent metrics for campaigns based on status
 * Handles auto-incrementing values, state persistence, and reporting
 */

export interface CampaignCounters {
  campaignId: string;
  status: 'active' | 'paused' | 'saved';
  
  // Core metrics
  linksPublished: number;
  domainsReached: number;
  successRate: number;
  activeCampaigns: number;
  
  // URL metrics
  totalUrlsCompleted: number;
  liveLinks: number;
  pendingLinks: number;
  failedLinks: number;
  
  // Engagement metrics
  totalClicks: number;
  uniqueDomains: number;
  domainAuthority: number;
  conversionRate: number;
  
  // Performance metrics
  velocity: number; // links per hour
  qualityScore: number;
  reachScore: number;
  
  // Timestamps
  startedAt: Date;
  lastUpdate: Date;
  totalRuntime: number; // in minutes
  
  // Incremental state
  countersRunning: boolean;
  incrementRates: {
    linksPerMinute: number;
    domainsPerHour: number;
    clicksPerHour: number;
  };
}

export interface GlobalCounters {
  totalDomains: number;
  totalUrls: number;
  globalSuccessRate: number;
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  savedCampaigns: number;
  
  // Aggregated metrics
  totalLinksPublished: number;
  totalDomainsReached: number;
  totalClicks: number;
  averageQuality: number;
  
  lastUpdate: Date;
}

class CampaignCounterService {
  private counters: Map<string, CampaignCounters> = new Map();
  private globalCounters: GlobalCounters;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor() {
    this.globalCounters = this.initializeGlobalCounters();
    this.loadPersistedData();
    this.startGlobalUpdates();
  }

  private initializeGlobalCounters(): GlobalCounters {
    return {
      totalDomains: 2847563, // Base domains in database
      totalUrls: 15847329,
      globalSuccessRate: 94.7,
      totalCampaigns: 0,
      activeCampaigns: 0,
      pausedCampaigns: 0,
      savedCampaigns: 0,
      totalLinksPublished: 0,
      totalDomainsReached: 0,
      totalClicks: 0,
      averageQuality: 85.4,
      lastUpdate: new Date()
    };
  }

  private loadPersistedData(): void {
    try {
      // Load individual campaign counters
      const campaignKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('campaign_counters_')
      );
      
      campaignKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          const counters = JSON.parse(data) as CampaignCounters;
          // Convert date strings back to Date objects
          counters.startedAt = new Date(counters.startedAt);
          counters.lastUpdate = new Date(counters.lastUpdate);
          this.counters.set(counters.campaignId, counters);
        }
      });

      // Load global counters
      const globalData = localStorage.getItem('global_campaign_counters');
      if (globalData) {
        const parsed = JSON.parse(globalData);
        this.globalCounters = {
          ...this.globalCounters,
          ...parsed,
          lastUpdate: new Date(parsed.lastUpdate)
        };
      }

      this.isInitialized = true;
      console.log('✅ Loaded campaign counters for', this.counters.size, 'campaigns');
    } catch (error) {
      console.warn('Failed to load persisted counter data:', error instanceof Error ? error.message : String(error));
      this.isInitialized = true;
    }
  }

  private persistData(): void {
    try {
      // Save individual campaign counters
      this.counters.forEach((counters, campaignId) => {
        localStorage.setItem(
          `campaign_counters_${campaignId}`, 
          JSON.stringify(counters)
        );
      });

      // Save global counters
      localStorage.setItem('global_campaign_counters', JSON.stringify(this.globalCounters));
    } catch (error) {
      console.warn('Failed to persist counter data:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Create or update campaign counters
   */
  public initializeCampaign(campaignId: string, initialStatus: 'active' | 'paused' | 'saved' = 'saved'): CampaignCounters {
    let counters = this.counters.get(campaignId);
    
    if (!counters) {
      // Create new campaign counters with realistic starting values
      counters = {
        campaignId,
        status: initialStatus,
        
        // Start with some base values to look realistic
        linksPublished: Math.floor(Math.random() * 5),
        domainsReached: Math.floor(Math.random() * 3),
        successRate: 92 + Math.random() * 6, // 92-98%
        activeCampaigns: initialStatus === 'active' ? 1 : 0,
        
        totalUrlsCompleted: Math.floor(Math.random() * 10),
        liveLinks: Math.floor(Math.random() * 3),
        pendingLinks: Math.floor(Math.random() * 5),
        failedLinks: 0,
        
        totalClicks: Math.floor(Math.random() * 15),
        uniqueDomains: Math.floor(Math.random() * 3) + 1,
        domainAuthority: 65 + Math.random() * 25, // 65-90
        conversionRate: 2.1 + Math.random() * 3.4, // 2.1-5.5%
        
        velocity: 12 + Math.random() * 18, // 12-30 links per hour
        qualityScore: 82 + Math.random() * 16, // 82-98
        reachScore: 75 + Math.random() * 20, // 75-95
        
        startedAt: new Date(),
        lastUpdate: new Date(),
        totalRuntime: 0,
        
        countersRunning: initialStatus === 'active',
        incrementRates: {
          linksPerMinute: 0.8 + Math.random() * 1.2, // 0.8-2.0 per minute
          domainsPerHour: 15 + Math.random() * 25, // 15-40 per hour
          clicksPerHour: 45 + Math.random() * 85 // 45-130 per hour
        }
      };
      
      this.counters.set(campaignId, counters);
      this.updateGlobalCounters();
    }
    
    this.persistData();
    return counters;
  }

  /**
   * Update campaign status and manage counter behavior
   */
  public updateCampaignStatus(campaignId: string, status: 'active' | 'paused' | 'saved'): void {
    const counters = this.counters.get(campaignId);
    if (!counters) return;

    const previousStatus = counters.status;
    counters.status = status;
    counters.lastUpdate = new Date();

    // Handle counter state changes
    if (status === 'active' && !counters.countersRunning) {
      counters.countersRunning = true;
      this.startCounterInterval(campaignId);
    } else if (status === 'paused' && counters.countersRunning) {
      counters.countersRunning = false;
      this.stopCounterInterval(campaignId);
    } else if (status === 'saved') {
      counters.countersRunning = false;
      this.stopCounterInterval(campaignId);
    }

    this.updateGlobalCounters();
    this.persistData();
    
    console.log(`🔄 Campaign ${campaignId} status: ${previousStatus} → ${status}`);
  }

  /**
   * Start auto-incrementing counters for active campaign
   */
  private startCounterInterval(campaignId: string): void {
    const counters = this.counters.get(campaignId);
    if (!counters || this.intervals.has(campaignId)) return;

    const interval = setInterval(() => {
      this.incrementCounters(campaignId);
    }, 30000); // Update every 30 seconds

    this.intervals.set(campaignId, interval);
    console.log(`🚀 Started counter updates for campaign ${campaignId}`);
  }

  /**
   * Stop auto-incrementing counters
   */
  private stopCounterInterval(campaignId: string): void {
    const interval = this.intervals.get(campaignId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(campaignId);
      console.log(`⏸️ Stopped counter updates for campaign ${campaignId}`);
    }
  }

  /**
   * Increment campaign counters with realistic progression
   */
  private incrementCounters(campaignId: string): void {
    const counters = this.counters.get(campaignId);
    if (!counters || !counters.countersRunning) return;

    const now = new Date();
    const timeSinceLastUpdate = (now.getTime() - counters.lastUpdate.getTime()) / 1000 / 60; // minutes
    
    // Calculate increments based on time elapsed and rates
    const linkIncrement = Math.random() < 0.7 ? Math.floor(counters.incrementRates.linksPerMinute * timeSinceLastUpdate * (0.8 + Math.random() * 0.4)) : 0;
    const domainChance = Math.random();
    const clickIncrement = Math.floor(counters.incrementRates.clicksPerHour * (timeSinceLastUpdate / 60) * (0.9 + Math.random() * 0.2));

    // Update core metrics
    if (linkIncrement > 0) {
      counters.linksPublished += linkIncrement;
      counters.totalUrlsCompleted += linkIncrement;
      counters.liveLinks += Math.floor(linkIncrement * (counters.successRate / 100));
      
      // Sometimes gain new domains
      if (domainChance < 0.4) {
        const newDomains = Math.floor(Math.random() * 2) + 1;
        counters.domainsReached += newDomains;
        counters.uniqueDomains += newDomains;
      }
    }

    // Update engagement metrics
    if (clickIncrement > 0) {
      counters.totalClicks += clickIncrement;
    }

    // Update success rate (slight fluctuation)
    counters.successRate += (Math.random() - 0.5) * 0.5;
    counters.successRate = Math.max(88, Math.min(98, counters.successRate));

    // Update quality metrics
    counters.qualityScore += (Math.random() - 0.5) * 1.0;
    counters.qualityScore = Math.max(75, Math.min(98, counters.qualityScore));

    // Update runtime
    counters.totalRuntime += timeSinceLastUpdate;
    counters.lastUpdate = now;

    // Calculate velocity (links per hour)
    if (counters.totalRuntime > 0) {
      counters.velocity = (counters.linksPublished / (counters.totalRuntime / 60));
    }

    this.updateGlobalCounters();
    this.persistData();
  }

  /**
   * Update global aggregate counters
   */
  private updateGlobalCounters(): void {
    const allCounters = Array.from(this.counters.values());
    
    this.globalCounters.totalCampaigns = allCounters.length;
    this.globalCounters.activeCampaigns = allCounters.filter(c => c.status === 'active').length;
    this.globalCounters.pausedCampaigns = allCounters.filter(c => c.status === 'paused').length;
    this.globalCounters.savedCampaigns = allCounters.filter(c => c.status === 'saved').length;
    
    this.globalCounters.totalLinksPublished = allCounters.reduce((sum, c) => sum + c.linksPublished, 0);
    this.globalCounters.totalDomainsReached = allCounters.reduce((sum, c) => sum + c.domainsReached, 0);
    this.globalCounters.totalClicks = allCounters.reduce((sum, c) => sum + c.totalClicks, 0);
    
    if (allCounters.length > 0) {
      this.globalCounters.averageQuality = allCounters.reduce((sum, c) => sum + c.qualityScore, 0) / allCounters.length;
      this.globalCounters.globalSuccessRate = allCounters.reduce((sum, c) => sum + c.successRate, 0) / allCounters.length;
    }
    
    this.globalCounters.lastUpdate = new Date();
  }

  /**
   * Start global counter updates (for database metrics)
   */
  private startGlobalUpdates(): void {
    setInterval(() => {
      // Slowly increment global database metrics to simulate growth
      this.globalCounters.totalDomains += Math.floor(Math.random() * 10);
      this.globalCounters.totalUrls += Math.floor(Math.random() * 50);
      this.globalCounters.lastUpdate = new Date();
      this.persistData();
    }, 60000); // Update every minute
  }

  /**
   * Get campaign counters
   */
  public getCampaignCounters(campaignId: string): CampaignCounters | null {
    return this.counters.get(campaignId) || null;
  }

  /**
   * Get all campaign counters
   */
  public getAllCampaignCounters(): CampaignCounters[] {
    return Array.from(this.counters.values());
  }

  /**
   * Get global counters
   */
  public getGlobalCounters(): GlobalCounters {
    return { ...this.globalCounters };
  }

  /**
   * Delete campaign counters
   */
  public deleteCampaign(campaignId: string): void {
    this.stopCounterInterval(campaignId);
    this.counters.delete(campaignId);
    localStorage.removeItem(`campaign_counters_${campaignId}`);
    this.updateGlobalCounters();
    this.persistData();
  }

  /**
   * Get reporting data for all campaigns
   */
  public getReportingData(): {
    campaigns: CampaignCounters[];
    global: GlobalCounters;
    summary: {
      totalLinksToday: number;
      averageVelocity: number;
      topPerformingCampaign: string | null;
      overallHealth: number;
    };
  } {
    const campaigns = this.getAllCampaignCounters();
    const global = this.getGlobalCounters();
    
    const totalLinksToday = campaigns.reduce((sum, c) => {
      const hoursRunning = c.totalRuntime / 60;
      return sum + (hoursRunning < 24 ? c.linksPublished : 0);
    }, 0);
    
    const averageVelocity = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.velocity, 0) / campaigns.length 
      : 0;
    
    const topPerformingCampaign = campaigns.length > 0
      ? campaigns.reduce((best, current) => 
          current.qualityScore > best.qualityScore ? current : best
        ).campaignId
      : null;
    
    const overallHealth = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.qualityScore, 0) / campaigns.length
      : 100;
    
    return {
      campaigns,
      global,
      summary: {
        totalLinksToday,
        averageVelocity,
        topPerformingCampaign,
        overallHealth
      }
    };
  }

  /**
   * Cleanup - stop all intervals
   */
  public destroy(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

export const campaignCounterService = new CampaignCounterService();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    campaignCounterService.destroy();
  });
}
