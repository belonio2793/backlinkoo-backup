/**
 * Guest User Tracking Service
 * Handles cookie-based tracking, campaign limits, and premium upsell triggers
 */

export interface GuestCampaign {
  id: string;
  name: string;
  targetUrl: string;
  keywords: string[];
  status: 'active' | 'paused' | 'stopped';
  linksGenerated: number;
  createdAt: string;
  lastActivityAt: string;
  completedAt?: string;
}

export interface GuestTrackingData {
  userId: string;
  campaignsCreated: number;
  totalLinksGenerated: number;
  campaigns: GuestCampaign[];
  lastVisit: string;
  premiumPromptShown: boolean;
  cookieAccepted: boolean;
  trackingStarted: string;
}

export interface PremiumLimitWarning {
  type: 'campaign_limit' | 'link_limit' | 'feature_limit';
  message: string;
  action: 'disable' | 'warn' | 'block';
  upgradeCTA: string;
}

class GuestTrackingService {
  private static instance: GuestTrackingService;
  private readonly COOKIE_NAME = 'backlinkoo_guest_tracking';
  private readonly COOKIE_DURATION = 90; // 90 days
  private readonly MAX_FREE_CAMPAIGNS = 3;
  private readonly MAX_LINKS_PER_CAMPAIGN = 20;
  private readonly LOCAL_STORAGE_KEY = 'backlinkoo_guest_data';

  public static getInstance(): GuestTrackingService {
    if (!GuestTrackingService.instance) {
      GuestTrackingService.instance = new GuestTrackingService();
    }
    return GuestTrackingService.instance;
  }

  /**
   * Initialize guest tracking when user first visits
   */
  public initializeGuestTracking(): string {
    const existingData = this.getGuestData();
    
    if (existingData) {
      // Update last visit
      existingData.lastVisit = new Date().toISOString();
      this.saveGuestData(existingData);
      return existingData.userId;
    }

    // Create new guest user
    const guestUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGuestData: GuestTrackingData = {
      userId: guestUserId,
      campaignsCreated: 0,
      totalLinksGenerated: 0,
      campaigns: [],
      lastVisit: new Date().toISOString(),
      premiumPromptShown: false,
      cookieAccepted: false,
      trackingStarted: new Date().toISOString()
    };

    this.saveGuestData(newGuestData);
    this.setTrackingCookie(guestUserId);
    
    console.log('🍪 Guest tracking initialized:', guestUserId);
    return guestUserId;
  }

  /**
   * Track campaign creation and check for limits
   */
  public trackCampaignCreation(campaign: Omit<GuestCampaign, 'id' | 'createdAt' | 'lastActivityAt'>): {
    success: boolean;
    campaignId?: string;
    warning?: PremiumLimitWarning;
    shouldShowPremiumModal?: boolean;
  } {
    const guestData = this.getGuestData();
    
    if (!guestData) {
      console.warn('No guest data found for campaign creation');
      return { success: false };
    }

    // Check campaign limit
    if (guestData.campaignsCreated >= this.MAX_FREE_CAMPAIGNS) {
      return {
        success: false,
        warning: {
          type: 'campaign_limit',
          message: `Free users are limited to ${this.MAX_FREE_CAMPAIGNS} campaigns. Upgrade to Premium for unlimited campaigns!`,
          action: 'block',
          upgradeCTA: 'Upgrade to Premium - Unlimited Campaigns!'
        },
        shouldShowPremiumModal: true
      };
    }

    // Create campaign
    const campaignId = `guest_campaign_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newCampaign: GuestCampaign = {
      ...campaign,
      id: campaignId,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };

    guestData.campaigns.push(newCampaign);
    guestData.campaignsCreated++;
    guestData.lastVisit = new Date().toISOString();

    this.saveGuestData(guestData);

    // Check if approaching limit
    const shouldShowPremiumModal = guestData.campaignsCreated >= this.MAX_FREE_CAMPAIGNS - 1;

    return {
      success: true,
      campaignId,
      shouldShowPremiumModal,
      warning: shouldShowPremiumModal ? {
        type: 'campaign_limit',
        message: `You're using ${guestData.campaignsCreated}/${this.MAX_FREE_CAMPAIGNS} free campaigns. Upgrade to Premium for unlimited access!`,
        action: 'warn',
        upgradeCTA: 'Upgrade Now - Only $49/month'
      } : undefined
    };
  }

  /**
   * Track link generation and check for per-campaign limits
   */
  public trackLinkGeneration(campaignId: string, newLinksCount: number): {
    success: boolean;
    warning?: PremiumLimitWarning;
    shouldShowPremiumModal?: boolean;
    campaignPaused?: boolean;
  } {
    const guestData = this.getGuestData();

    if (!guestData) {
      return { success: false };
    }

    const campaign = guestData.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return { success: false };
    }

    const newTotal = campaign.linksGenerated + newLinksCount;

    // Check link limit per campaign
    if (newTotal > this.MAX_LINKS_PER_CAMPAIGN) {
      return {
        success: false,
        warning: {
          type: 'link_limit',
          message: `Free campaigns are limited to ${this.MAX_LINKS_PER_CAMPAIGN} links each. This campaign has ${campaign.linksGenerated} links.`,
          action: 'block',
          upgradeCTA: 'Upgrade to Premium - Unlimited Links per Campaign!'
        },
        shouldShowPremiumModal: true
      };
    }

    // Update campaign
    campaign.linksGenerated = newTotal;
    campaign.lastActivityAt = new Date().toISOString();
    guestData.totalLinksGenerated += newLinksCount;
    guestData.lastVisit = new Date().toISOString();

    // Auto-complete campaign at exactly 20 links
    let campaignPaused = false;
    if (newTotal >= this.MAX_LINKS_PER_CAMPAIGN) {
      campaign.status = 'completed';
      campaign.completedAt = new Date().toISOString();
      campaignPaused = true;
      console.log(`✅ Campaign ${campaignId} completed at ${newTotal} links - saved indefinitely`);
    }

    this.saveGuestData(guestData);

    // Check if at limit or approaching limit
    const shouldShowPremiumModal = newTotal >= this.MAX_LINKS_PER_CAMPAIGN;

    return {
      success: true,
      shouldShowPremiumModal,
      campaignPaused,
      warning: shouldShowPremiumModal ? {
        type: 'link_limit',
        message: newTotal >= this.MAX_LINKS_PER_CAMPAIGN
          ? `Campaign reached the ${this.MAX_LINKS_PER_CAMPAIGN} link limit and has been paused. Upgrade to Premium for unlimited links!`
          : `Campaign approaching limit: ${newTotal}/${this.MAX_LINKS_PER_CAMPAIGN} links. Upgrade for unlimited links!`,
        action: newTotal >= this.MAX_LINKS_PER_CAMPAIGN ? 'block' : 'warn',
        upgradeCTA: 'Upgrade to Premium - Unlimited Links!'
      } : undefined
    };
  }

  /**
   * Get current guest data
   */
  public getGuestData(): GuestTrackingData | null {
    try {
      // Try localStorage first
      const localData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (localData) {
        return JSON.parse(localData);
      }

      // Try cookie fallback
      const cookieUserId = this.getTrackingCookie();
      if (cookieUserId) {
        // Migration: create localStorage data from cookie
        const migrationData: GuestTrackingData = {
          userId: cookieUserId,
          campaignsCreated: 0,
          totalLinksGenerated: 0,
          campaigns: [],
          lastVisit: new Date().toISOString(),
          premiumPromptShown: false,
          cookieAccepted: true,
          trackingStarted: new Date().toISOString()
        };
        this.saveGuestData(migrationData);
        return migrationData;
      }

      return null;
    } catch (error) {
      console.warn('Error reading guest data:', error);
      return null;
    }
  }

  /**
   * Get guest campaigns with premium restrictions applied
   */
  public getGuestCampaignsWithRestrictions(): {
    campaigns: GuestCampaign[];
    restrictions: {
      canCreateMore: boolean;
      campaignsUsed: number;
      campaignsLimit: number;
      warnings: PremiumLimitWarning[];
    };
  } {
    const guestData = this.getGuestData();
    
    if (!guestData) {
      return {
        campaigns: [],
        restrictions: {
          canCreateMore: true,
          campaignsUsed: 0,
          campaignsLimit: this.MAX_FREE_CAMPAIGNS,
          warnings: []
        }
      };
    }

    const warnings: PremiumLimitWarning[] = [];
    
    // Check campaign limits
    if (guestData.campaignsCreated >= this.MAX_FREE_CAMPAIGNS) {
      warnings.push({
        type: 'campaign_limit',
        message: `You've reached the free limit of ${this.MAX_FREE_CAMPAIGNS} campaigns`,
        action: 'block',
        upgradeCTA: 'Upgrade to Premium for Unlimited Campaigns'
      });
    }

    // Check link limits for each campaign
    guestData.campaigns.forEach(campaign => {
      if (campaign.linksGenerated >= this.MAX_LINKS_PER_CAMPAIGN) {
        warnings.push({
          type: 'link_limit',
          message: `Campaign "${campaign.name}" has reached the ${this.MAX_LINKS_PER_CAMPAIGN} link limit`,
          action: 'disable',
          upgradeCTA: 'Remove Link Limits with Premium'
        });
      }
    });

    return {
      campaigns: guestData.campaigns,
      restrictions: {
        canCreateMore: guestData.campaignsCreated < this.MAX_FREE_CAMPAIGNS,
        campaignsUsed: guestData.campaignsCreated,
        campaignsLimit: this.MAX_FREE_CAMPAIGNS,
        warnings
      }
    };
  }

  /**
   * Mark premium prompt as shown
   */
  public markPremiumPromptShown(): void {
    const guestData = this.getGuestData();
    if (guestData) {
      guestData.premiumPromptShown = true;
      guestData.lastVisit = new Date().toISOString();
      this.saveGuestData(guestData);
    }
  }

  /**
   * Check if campaign can be reactivated (not at link limit)
   */
  public canReactivateCampaign(campaignId: string): {
    canReactivate: boolean;
    reason?: string;
    warning?: PremiumLimitWarning;
  } {
    const guestData = this.getGuestData();
    if (!guestData) {
      return { canReactivate: false, reason: 'No guest data found' };
    }

    const campaign = guestData.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return { canReactivate: false, reason: 'Campaign not found' };
    }

    // Check if campaign is at link limit
    if (campaign.linksGenerated >= this.MAX_LINKS_PER_CAMPAIGN) {
      return {
        canReactivate: false,
        reason: 'Link limit reached',
        warning: {
          type: 'link_limit',
          message: `This campaign has reached the ${this.MAX_LINKS_PER_CAMPAIGN} link limit. Upgrade to Premium for unlimited links and to continue this campaign.`,
          action: 'block',
          upgradeCTA: 'Upgrade to Premium - Continue Campaign'
        }
      };
    }

    return { canReactivate: true };
  }

  /**
   * Update campaign status
   */
  public updateCampaignStatus(campaignId: string, status: 'active' | 'paused' | 'stopped' | 'completed'): {
    success: boolean;
    warning?: PremiumLimitWarning;
    shouldShowPremiumModal?: boolean;
  } {
    const guestData = this.getGuestData();
    if (!guestData) return { success: false };

    const campaign = guestData.campaigns.find(c => c.id === campaignId);
    if (!campaign) return { success: false };

    // If trying to reactivate, check if allowed
    if (status === 'active') {
      const reactivationCheck = this.canReactivateCampaign(campaignId);
      if (!reactivationCheck.canReactivate) {
        return {
          success: false,
          warning: reactivationCheck.warning,
          shouldShowPremiumModal: true
        };
      }
    }

    campaign.status = status;
    campaign.lastActivityAt = new Date().toISOString();
    guestData.lastVisit = new Date().toISOString();

    this.saveGuestData(guestData);
    return { success: true };
  }

  /**
   * Delete campaign
   */
  public deleteCampaign(campaignId: string): boolean {
    const guestData = this.getGuestData();
    if (!guestData) return false;

    const campaignIndex = guestData.campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) return false;

    const deletedCampaign = guestData.campaigns[campaignIndex];
    guestData.campaigns.splice(campaignIndex, 1);
    guestData.totalLinksGenerated -= deletedCampaign.linksGenerated;
    guestData.lastVisit = new Date().toISOString();

    this.saveGuestData(guestData);
    return true;
  }

  /**
   * Check if feature should be restricted for guest users
   */
  public checkFeatureAccess(feature: 'advanced_analytics' | 'bulk_export' | 'priority_support' | 'custom_domains'): {
    allowed: boolean;
    warning?: PremiumLimitWarning;
  } {
    const premiumFeatures = {
      advanced_analytics: 'Advanced Analytics & Reporting',
      bulk_export: 'Bulk Data Export',
      priority_support: '24/7 Priority Support',
      custom_domains: 'Custom Domain Integration'
    };

    return {
      allowed: false,
      warning: {
        type: 'feature_limit',
        message: `${premiumFeatures[feature]} is a Premium feature`,
        action: 'block',
        upgradeCTA: `Unlock ${premiumFeatures[feature]} with Premium`
      }
    };
  }

  /**
   * Clear guest data (when user signs up)
   */
  public clearGuestData(): void {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      this.clearTrackingCookie();
      console.log('🧹 Guest data cleared');
    } catch (error) {
      console.warn('Error clearing guest data:', error);
    }
  }

  /**
   * Get guest statistics for premium modal
   */
  public getGuestStats(): {
    campaignsCreated: number;
    totalLinksGenerated: number;
    daysActive: number;
    estimatedValue: number;
  } {
    const guestData = this.getGuestData();
    
    if (!guestData) {
      return {
        campaignsCreated: 0,
        totalLinksGenerated: 0,
        daysActive: 0,
        estimatedValue: 0
      };
    }

    const daysActive = Math.max(1, Math.ceil(
      (new Date().getTime() - new Date(guestData.trackingStarted).getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Estimate value: $20 per backlink (conservative SEO agency pricing)
    const estimatedValue = guestData.totalLinksGenerated * 20;

    return {
      campaignsCreated: guestData.campaignsCreated,
      totalLinksGenerated: guestData.totalLinksGenerated,
      daysActive,
      estimatedValue
    };
  }

  // Private helper methods
  private saveGuestData(data: GuestTrackingData): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving guest data to localStorage:', error);
    }
  }

  private setTrackingCookie(userId: string): void {
    if (typeof document !== 'undefined') {
      const expires = new Date();
      expires.setDate(expires.getDate() + this.COOKIE_DURATION);
      document.cookie = `${this.COOKIE_NAME}=${userId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }

  private getTrackingCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const trackingCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${this.COOKIE_NAME}=`)
    );
    
    return trackingCookie ? trackingCookie.split('=')[1] : null;
  }

  private clearTrackingCookie(): void {
    if (typeof document !== 'undefined') {
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}

export const guestTrackingService = GuestTrackingService.getInstance();
