import { supabase } from '../integrations/supabase/client';
import type {
  AffiliateProfile,
  AffiliateReferral,
  AffiliateCommission,
  AffiliatePayout,
  AffiliateClick,
  AffiliateStats,
  AffiliateAnalytics,
  AffiliateLink,
  AffiliateStatusType,
  AffiliateTierType,
  CommissionStatusType
} from '../integrations/supabase/affiliate-types';

export class AffiliateService {
  private static instance: AffiliateService;
  private readonly COOKIE_NAME = 'aff_ref';
  private readonly COOKIE_DURATION = 30; // 30 days
  private readonly BASE_COMMISSION_RATE = 0.20; // 20%

  static getInstance(): AffiliateService {
    if (!AffiliateService.instance) {
      AffiliateService.instance = new AffiliateService();
    }
    return AffiliateService.instance;
  }

  // ==================== AFFILIATE MANAGEMENT ====================

  /**
   * Generate a unique affiliate ID for a user
   */
  private generateAffiliateId(userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const userHash = userId.substring(0, 6);
    return `BL${userHash}${timestamp}${random}`.toUpperCase();
  }

  /**
   * Create an affiliate profile for a user
   */
  async createAffiliateProfile(userId: string, email: string): Promise<AffiliateProfile> {
    const affiliateId = this.generateAffiliateId(userId);
    
    const affiliateData = {
      user_id: userId,
      affiliate_id: affiliateId,
      status: 'pending' as AffiliateStatusType,
      commission_rate: this.BASE_COMMISSION_RATE,
      tier: 'bronze' as AffiliateTierType,
      total_earnings: 0,
      total_referrals: 0,
      total_conversions: 0,
      lifetime_value: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('affiliate_profiles')
      .insert(affiliateData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create affiliate profile: ${error.message}`);
    }

    // Send welcome email with affiliate resources
    await this.sendAffiliateWelcomeEmail(email, affiliateId);

    return data;
  }

  /**
   * Get affiliate profile by user ID
   */
  async getAffiliateProfile(userId: string): Promise<AffiliateProfile | null> {
    const { data, error } = await supabase
      .from('affiliate_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get affiliate profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Update affiliate tier based on performance
   */
  async updateAffiliateTier(affiliateId: string): Promise<void> {
    const stats = await this.getAffiliateStats(affiliateId);
    let newTier: AffiliateTierType = 'bronze';
    let newCommissionRate = this.BASE_COMMISSION_RATE;

    // Tier calculation logic
    if (stats.total_earnings >= 10000 || stats.total_conversions >= 100) {
      newTier = 'platinum';
      newCommissionRate = 0.35;
    } else if (stats.total_earnings >= 5000 || stats.total_conversions >= 50) {
      newTier = 'gold';
      newCommissionRate = 0.30;
    } else if (stats.total_earnings >= 1000 || stats.total_conversions >= 20) {
      newTier = 'silver';
      newCommissionRate = 0.25;
    }

    await supabase
      .from('affiliate_profiles')
      .update({
        tier: newTier,
        commission_rate: newCommissionRate,
        updated_at: new Date().toISOString()
      })
      .eq('affiliate_id', affiliateId);
  }

  // ==================== LINK GENERATION & TRACKING ====================

  /**
   * Generate affiliate tracking link
   */
  generateAffiliateLink(
    affiliateId: string,
    targetUrl: string = '',
    utmParams?: Record<string, string>
  ): AffiliateLink {
    const baseUrl = window.location.origin;
    const url = new URL(targetUrl || baseUrl);
    
    // Add affiliate tracking parameter
    url.searchParams.set('ref', affiliateId);
    
    // Add UTM parameters
    if (utmParams) {
      Object.entries(utmParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // Default UTM parameters
    url.searchParams.set('utm_source', 'affiliate');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', affiliateId);

    return {
      base_url: url.toString(),
      affiliate_code: affiliateId,
      utm_params: utmParams
    };
  }

  /**
   * Track affiliate click
   */
  async trackAffiliateClick(
    affiliateId: string,
    request: {
      ip: string;
      userAgent: string;
      referer?: string;
      landingPage: string;
      utmParams?: Record<string, string>;
    }
  ): Promise<void> {
    const clickData = {
      affiliate_id: affiliateId,
      referral_code: affiliateId,
      visitor_ip: request.ip,
      user_agent: request.userAgent,
      referer: request.referer,
      utm_params: request.utmParams,
      landing_page: request.landingPage,
      clicked_at: new Date().toISOString(),
      device_type: this.detectDeviceType(request.userAgent),
      browser: this.detectBrowser(request.userAgent),
      os: this.detectOS(request.userAgent)
    };

    await supabase.from('affiliate_clicks').insert(clickData);

    // Set tracking cookie
    this.setTrackingCookie(affiliateId);
  }

  /**
   * Process affiliate referral
   */
  async processReferral(
    affiliateId: string,
    visitorData: {
      ip: string;
      userAgent: string;
      sessionId?: string;
      landingPage: string;
      utmParams?: Record<string, string>;
    }
  ): Promise<AffiliateReferral> {
    const referralCode = this.generateReferralCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.COOKIE_DURATION);

    const referralData = {
      affiliate_id: affiliateId,
      referral_code: referralCode,
      visitor_ip: visitorData.ip,
      user_agent: visitorData.userAgent,
      landing_page: visitorData.landingPage,
      utm_source: visitorData.utmParams?.utm_source,
      utm_medium: visitorData.utmParams?.utm_medium,
      utm_campaign: visitorData.utmParams?.utm_campaign,
      utm_content: visitorData.utmParams?.utm_content,
      conversion_status: 'pending' as const,
      clicked_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      session_id: visitorData.sessionId,
      device_fingerprint: this.generateDeviceFingerprint(visitorData)
    };

    const { data, error } = await supabase
      .from('affiliate_referrals')
      .insert(referralData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to process referral: ${error.message}`);
    }

    return data;
  }

  // ==================== COMMISSION MANAGEMENT ====================

  /**
   * Calculate commission for a conversion
   */
  async calculateCommission(
    affiliateId: string,
    orderValue: number,
    commissionType: 'signup' | 'subscription' | 'purchase' = 'subscription'
  ): Promise<number> {
    const { data: affiliate } = await supabase
      .from('affiliate_profiles')
      .select('commission_rate, tier')
      .eq('affiliate_id', affiliateId)
      .single();

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    let commissionRate = affiliate.commission_rate;

    // Apply tier bonuses
    const tierBonuses = {
      bronze: 0,
      silver: 0.05,
      gold: 0.10,
      platinum: 0.15,
      partner: 0.20
    };

    commissionRate += tierBonuses[affiliate.tier as keyof typeof tierBonuses] || 0;

    // Apply commission type multipliers
    const typeMultipliers = {
      signup: 0.5,
      subscription: 1.0,
      purchase: 1.2
    };

    commissionRate *= typeMultipliers[commissionType];

    return Math.round(orderValue * commissionRate * 100) / 100;
  }

  /**
   * Process affiliate conversion
   */
  async processConversion(
    referralCode: string,
    userId: string,
    orderValue: number,
    commissionType: 'signup' | 'subscription' | 'purchase' = 'subscription'
  ): Promise<AffiliateCommission> {
    // Find the referral
    const { data: referral } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('conversion_status', 'pending')
      .single();

    if (!referral) {
      throw new Error('Valid referral not found');
    }

    // Calculate commission
    const commissionAmount = await this.calculateCommission(
      referral.affiliate_id,
      orderValue,
      commissionType
    );

    const { data: affiliate } = await supabase
      .from('affiliate_profiles')
      .select('commission_rate')
      .eq('affiliate_id', referral.affiliate_id)
      .single();

    // Create commission record
    const commissionData = {
      affiliate_id: referral.affiliate_id,
      referral_id: referral.id,
      user_id: userId,
      commission_type: commissionType,
      amount: commissionAmount,
      percentage: affiliate?.commission_rate || this.BASE_COMMISSION_RATE,
      order_value: orderValue,
      status: 'pending' as CommissionStatusType,
      created_at: new Date().toISOString()
    };

    const { data: commission, error } = await supabase
      .from('affiliate_commissions')
      .insert(commissionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create commission: ${error.message}`);
    }

    // Update referral status
    await supabase
      .from('affiliate_referrals')
      .update({
        conversion_status: 'converted',
        referred_user_id: userId,
        conversion_value: orderValue,
        commission_earned: commissionAmount,
        converted_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    // Update affiliate stats
    await this.updateAffiliateStats(referral.affiliate_id, {
      earnings: commissionAmount,
      conversions: 1,
      lifetimeValue: orderValue
    });

    // Check for tier upgrade
    await this.updateAffiliateTier(referral.affiliate_id);

    return commission;
  }

  /**
   * Approve commission
   */
  async approveCommission(commissionId: string): Promise<void> {
    await supabase
      .from('affiliate_commissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', commissionId);
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get affiliate statistics
   */
  async getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
    const [clicksResult, referralsResult, commissionsResult, profileResult] = await Promise.all([
      supabase
        .from('affiliate_clicks')
        .select('id')
        .eq('affiliate_id', affiliateId),
      
      supabase
        .from('affiliate_referrals')
        .select('conversion_status')
        .eq('affiliate_id', affiliateId),
      
      supabase
        .from('affiliate_commissions')
        .select('amount, status')
        .eq('affiliate_id', affiliateId),
      
      supabase
        .from('affiliate_profiles')
        .select('tier, total_earnings, total_referrals, total_conversions')
        .eq('affiliate_id', affiliateId)
        .single()
    ]);

    const clicks = clicksResult.data?.length || 0;
    const referrals = referralsResult.data?.length || 0;
    const conversions = referralsResult.data?.filter(r => r.conversion_status === 'converted').length || 0;
    const commissions = commissionsResult.data || [];
    const profile = profileResult.data;

    const totalEarnings = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);

    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const epc = clicks > 0 ? totalEarnings / clicks : 0;

    return {
      total_clicks: clicks,
      total_referrals: referrals,
      total_conversions: conversions,
      total_earnings: totalEarnings,
      conversion_rate: Math.round(conversionRate * 100) / 100,
      epc: Math.round(epc * 100) / 100,
      pending_commissions: pendingCommissions,
      paid_commissions: paidCommissions,
      current_tier: profile?.tier || 'bronze',
      next_tier_threshold: this.getNextTierThreshold(profile?.tier || 'bronze')
    };
  }

  /**
   * Get affiliate analytics for a period
   */
  async getAffiliateAnalytics(
    affiliateId: string,
    startDate: string,
    endDate: string
  ): Promise<AffiliateAnalytics> {
    const [clicksData, referralsData, commissionsData] = await Promise.all([
      supabase
        .from('affiliate_clicks')
        .select('clicked_at, referer, device_type, country')
        .eq('affiliate_id', affiliateId)
        .gte('clicked_at', startDate)
        .lte('clicked_at', endDate),
      
      supabase
        .from('affiliate_referrals')
        .select('clicked_at, conversion_status, utm_source')
        .eq('affiliate_id', affiliateId)
        .gte('clicked_at', startDate)
        .lte('clicked_at', endDate),
      
      supabase
        .from('affiliate_commissions')
        .select('amount, created_at')
        .eq('affiliate_id', affiliateId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    const clicks = clicksData.data || [];
    const referrals = referralsData.data || [];
    const commissions = commissionsData.data || [];

    const conversions = referrals.filter(r => r.conversion_status === 'converted').length;
    const earnings = commissions.reduce((sum, c) => sum + c.amount, 0);

    // Aggregate data for analytics
    const topSources = this.aggregateTopSources(referrals);
    const deviceBreakdown = this.aggregateDeviceBreakdown(clicks);
    const geoBreakdown = this.aggregateGeoBreakdown(clicks);

    return {
      period: `${startDate} to ${endDate}`,
      clicks: clicks.length,
      referrals: referrals.length,
      conversions,
      earnings,
      top_sources: topSources,
      device_breakdown: deviceBreakdown,
      geo_breakdown: geoBreakdown
    };
  }

  // ==================== UTILITY METHODS ====================

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  private generateDeviceFingerprint(data: { ip: string; userAgent: string }): string {
    return btoa(`${data.ip}:${data.userAgent}`).substring(0, 16);
  }

  private setTrackingCookie(affiliateId: string): void {
    if (typeof document !== 'undefined') {
      const expires = new Date();
      expires.setDate(expires.getDate() + this.COOKIE_DURATION);
      document.cookie = `${this.COOKIE_NAME}=${affiliateId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
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

  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|phone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getNextTierThreshold(currentTier: string): number | undefined {
    const thresholds = {
      bronze: 1000, // $1000 to reach silver
      silver: 5000, // $5000 to reach gold
      gold: 10000, // $10000 to reach platinum
      platinum: undefined // No next tier
    };
    
    return thresholds[currentTier as keyof typeof thresholds];
  }

  private async updateAffiliateStats(
    affiliateId: string,
    updates: { earnings?: number; conversions?: number; lifetimeValue?: number }
  ): Promise<void> {
    // Get current values first
    const { data: currentProfile } = await supabase
      .from('affiliate_profiles')
      .select('total_earnings, total_conversions, lifetime_value')
      .eq('affiliate_id', affiliateId)
      .single();

    if (!currentProfile) return;

    const updateQuery: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.earnings) {
      updateQuery.total_earnings = currentProfile.total_earnings + updates.earnings;
    }
    if (updates.conversions) {
      updateQuery.total_conversions = currentProfile.total_conversions + updates.conversions;
    }
    if (updates.lifetimeValue) {
      updateQuery.lifetime_value = currentProfile.lifetime_value + updates.lifetimeValue;
    }

    await supabase
      .from('affiliate_profiles')
      .update(updateQuery)
      .eq('affiliate_id', affiliateId);
  }

  private aggregateTopSources(referrals: any[]): Array<{ source: string; clicks: number; conversions: number }> {
    const sourceMap = new Map();
    
    referrals.forEach(referral => {
      const source = referral.utm_source || 'direct';
      const existing = sourceMap.get(source) || { source, clicks: 0, conversions: 0 };
      existing.clicks++;
      if (referral.conversion_status === 'converted') {
        existing.conversions++;
      }
      sourceMap.set(source, existing);
    });

    return Array.from(sourceMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
  }

  private aggregateDeviceBreakdown(clicks: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    clicks.forEach(click => {
      const device = click.device_type || 'unknown';
      breakdown[device] = (breakdown[device] || 0) + 1;
    });
    return breakdown;
  }

  private aggregateGeoBreakdown(clicks: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    clicks.forEach(click => {
      const country = click.country || 'unknown';
      breakdown[country] = (breakdown[country] || 0) + 1;
    });
    return breakdown;
  }

  private async sendAffiliateWelcomeEmail(email: string, affiliateId: string): Promise<void> {
    // Integration with email service would go here
    console.log(`Sending welcome email to ${email} for affiliate ${affiliateId}`);
  }

  // ==================== PUBLIC API METHODS ====================

  /**
   * Initialize affiliate tracking for a visitor
   */
  async initializeTracking(affiliateId?: string): Promise<void> {
    if (!affiliateId) {
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      affiliateId = urlParams.get('ref') || undefined;
    }

    if (!affiliateId) {
      // Check existing cookie
      affiliateId = this.getTrackingCookie() || undefined;
    }

    if (affiliateId) {
      await this.trackAffiliateClick(affiliateId, {
        ip: await this.getVisitorIP(),
        userAgent: navigator.userAgent,
        referer: document.referrer,
        landingPage: window.location.href,
        utmParams: this.getUTMParams()
      });
    }
  }

  private async getVisitorIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '0.0.0.0';
    }
  }

  private getUTMParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
      const value = params.get(param);
      if (value) utmParams[param] = value;
    });

    return utmParams;
  }
}

// Export singleton instance
export const affiliateService = AffiliateService.getInstance();
