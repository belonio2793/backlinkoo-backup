import { supabase } from '../integrations/supabase/client';

// Fixed affiliate service to work with actual database schema
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
   * Create an affiliate profile for a user
   */
  async createAffiliateProfile(userId: string, email: string) {
    try {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .insert({
          user_id: userId,
          status: 'pending',
          commission_rate: this.BASE_COMMISSION_RATE,
          tier: 'bronze',
          total_earnings: 0,
          total_referrals: 0,
          total_conversions: 0,
          lifetime_value: 0,
          registration_data: {
            email: email,
            registered_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating affiliate profile:', error.message || error.toString() || JSON.stringify(error));
        throw new Error(`Failed to create affiliate profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Affiliate creation error:', error.message || error.toString() || JSON.stringify(error));
      throw error;
    }
  }

  /**
   * Get affiliate profile by user ID
   */
  async getAffiliateProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching affiliate profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Affiliate fetch error:', error);
      return null;
    }
  }

  /**
   * Get affiliate statistics
   */
  async getAffiliateStats(affiliateId: string) {
    try {
      // Get basic stats from the view
      const { data: statsData, error: statsError } = await supabase
        .from('affiliate_dashboard_stats')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .single();

      if (statsError) {
        console.error('Error fetching affiliate stats:', statsError);
        // Return default stats if view doesn't exist
        return {
          total_clicks: 0,
          total_referrals: 0,
          total_conversions: 0,
          total_earnings: 0,
          conversion_rate: 0,
          epc: 0,
          pending_commissions: 0,
          paid_commissions: 0,
          current_tier: 'bronze',
          next_tier_threshold: 1000
        };
      }

      return {
        total_clicks: statsData.total_clicks || 0,
        total_referrals: statsData.total_referral_records || 0,
        total_conversions: statsData.total_conversions || 0,
        total_earnings: statsData.total_earnings || 0,
        conversion_rate: statsData.conversion_rate || 0,
        epc: statsData.epc || 0,
        pending_commissions: statsData.pending_commissions || 0,
        paid_commissions: statsData.paid_commissions || 0,
        current_tier: statsData.tier || 'bronze',
        next_tier_threshold: this.getNextTierThreshold(statsData.tier || 'bronze')
      };
    } catch (error) {
      console.error('Stats fetch error:', error);
      return {
        total_clicks: 0,
        total_referrals: 0,
        total_conversions: 0,
        total_earnings: 0,
        conversion_rate: 0,
        epc: 0,
        pending_commissions: 0,
        paid_commissions: 0,
        current_tier: 'bronze',
        next_tier_threshold: 1000
      };
    }
  }

  /**
   * Generate affiliate tracking link
   */
  generateAffiliateLink(affiliateId: string, targetUrl: string = '', utmParams?: Record<string, string>) {
    const baseUrl = 'https://backlinkoo.com';
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
  async trackAffiliateClick(affiliateId: string, clickData: {
    ip: string;
    userAgent: string;
    referer?: string;
    landingPage: string;
    utmParams?: Record<string, string>;
  }) {
    try {
      const { error } = await supabase
        .from('affiliate_clicks')
        .insert({
          affiliate_id: affiliateId,
          referral_code: affiliateId + '_' + Date.now(),
          visitor_ip: clickData.ip,
          user_agent: clickData.userAgent,
          referer: clickData.referer,
          utm_params: clickData.utmParams,
          landing_page: clickData.landingPage,
          device_type: this.detectDeviceType(clickData.userAgent),
          browser: this.detectBrowser(clickData.userAgent),
          os: this.detectOS(clickData.userAgent)
        });

      if (error) {
        console.error('Error tracking click:', error);
        return;
      }

      // Set tracking cookie
      this.setTrackingCookie(affiliateId);
    } catch (error) {
      console.error('Click tracking error:', error);
    }
  }

  /**
   * Get affiliate analytics for a period
   */
  async getAffiliateAnalytics(affiliateId: string, startDate: string, endDate: string) {
    try {
      const [clicksData, commissionsData] = await Promise.all([
        supabase
          .from('affiliate_clicks')
          .select('clicked_at, device_type, country')
          .eq('affiliate_id', affiliateId)
          .gte('clicked_at', startDate)
          .lte('clicked_at', endDate),
        
        supabase
          .from('affiliate_commissions')
          .select('amount, created_at, status')
          .eq('affiliate_id', affiliateId)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      ]);

      const clicks = clicksData.data || [];
      const commissions = commissionsData.data || [];
      const conversions = commissions.filter(c => c.status !== 'disputed').length;
      const earnings = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);

      return {
        period: `${startDate} to ${endDate}`,
        clicks: clicks.length,
        referrals: clicks.length, // Simplified
        conversions,
        earnings,
        top_sources: [{ source: 'direct', clicks: clicks.length, conversions }],
        device_breakdown: this.aggregateDeviceBreakdown(clicks),
        geo_breakdown: this.aggregateGeoBreakdown(clicks)
      };
    } catch (error) {
      console.error('Analytics fetch error:', error);
      return {
        period: `${startDate} to ${endDate}`,
        clicks: 0,
        referrals: 0,
        conversions: 0,
        earnings: 0,
        top_sources: [],
        device_breakdown: {},
        geo_breakdown: {}
      };
    }
  }

  // ==================== UTILITY METHODS ====================

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
      bronze: 1000,
      silver: 5000,
      gold: 10000,
      platinum: undefined
    };
    
    return thresholds[currentTier as keyof typeof thresholds];
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

  /**
   * Initialize affiliate tracking for a visitor
   */
  async initializeTracking(affiliateId?: string): Promise<void> {
    if (!affiliateId) {
      const urlParams = new URLSearchParams(window.location.search);
      affiliateId = urlParams.get('ref') || undefined;
    }

    if (!affiliateId) {
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

  /**
   * Create test affiliate data for development
   */
  async createTestData(userId: string) {
    try {
      const { data, error } = await supabase.rpc('create_test_affiliate_data', {
        test_user_id: userId
      });

      if (error) {
        console.error('Error creating test data:', error);
        return;
      }

      console.log('Test data created:', data);
      return data;
    } catch (error) {
      console.error('Test data creation error:', error);
    }
  }
}

// Export singleton instance
export const affiliateService = AffiliateService.getInstance();
