import { supabase } from '../integrations/supabase/client';

interface AffiliateProfile {
  id: string;
  user_id: string;
  affiliate_id: string;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  commission_rate: number;
  special_rate?: number;
  total_earnings: number;
  total_referrals: number;
  total_conversions: number;
  lifetime_value: number;
  avg_conversion_rate: number;
  first_name?: string;
  last_name?: string;
  email: string;
  payment_method: 'paypal' | 'bank' | 'crypto' | 'stripe';
  payment_details?: any;
  payment_threshold: number;
  marketing_channels?: string[];
  audience_size?: number;
  primary_niche?: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

interface CommissionTier {
  id: string;
  tier_name: string;
  min_referrals: number;
  min_revenue: number;
  commission_rate: number;
  tier_order: number;
  benefits: any;
}

interface AffiliateClick {
  id: string;
  affiliate_id: string;
  tracking_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  device_type?: string;
  device_info?: any;
  location_data?: any;
  session_id?: string;
  fingerprint?: string;
  created_at: string;
}

interface AffiliateConversion {
  id: string;
  affiliate_id: string;
  click_id?: string;
  converted_user_id?: string;
  order_id?: string;
  subscription_id?: string;
  order_value: number;
  commission_rate: number;
  commission_amount: number;
  conversion_type?: string;
  product_id?: string;
  plan_type?: string;
  status: 'pending' | 'approved' | 'paid' | 'disputed' | 'rejected';
  created_at: string;
}

interface AffiliateAnalytics {
  clicks: number;
  unique_clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  conversion_rate: number;
  epc: number; // Earnings per click
  top_sources: any;
  device_breakdown: any;
  geo_data: any;
}

interface MarketingAsset {
  id: string;
  name: string;
  description?: string;
  asset_type: string;
  category?: string;
  file_url: string;
  file_size?: number;
  dimensions?: string;
  file_format?: string;
  download_count: number;
  click_count: number;
  tags?: string[];
  tier_requirement?: string;
  is_featured: boolean;
}

export class EnhancedAffiliateService {
  private static instance: EnhancedAffiliateService;
  private readonly COOKIE_NAME = 'aff_ref';
  private readonly COOKIE_DURATION = 30; // 30 days
  
  static getInstance(): EnhancedAffiliateService {
    if (!EnhancedAffiliateService.instance) {
      EnhancedAffiliateService.instance = new EnhancedAffiliateService();
    }
    return EnhancedAffiliateService.instance;
  }

  // ==================== AFFILIATE PROFILE MANAGEMENT ====================

  /**
   * Create a comprehensive affiliate profile
   */
  async createAffiliateProfile(userId: string, profileData: Partial<AffiliateProfile>): Promise<AffiliateProfile> {
    try {
      // Generate unique affiliate ID
      const { data: idData, error: idError } = await supabase.rpc('generate_affiliate_id');
      if (idError) throw idError;

      const affiliateId = idData;

      const { data, error } = await supabase
        .from('affiliate_profiles')
        .insert({
          user_id: userId,
          affiliate_id: affiliateId,
          status: 'pending',
          tier: 'bronze',
          commission_rate: 0.2000,
          total_earnings: 0,
          total_referrals: 0,
          total_conversions: 0,
          lifetime_value: 0,
          avg_conversion_rate: 0,
          payment_method: 'paypal',
          payment_threshold: 50.00,
          experience_level: 'beginner',
          ...profileData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating affiliate profile:', error);
        throw new Error(`Failed to create affiliate profile: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Create affiliate profile error:', error);
      throw error;
    }
  }

  /**
   * Get affiliate profile by user ID
   */
  async getAffiliateProfile(userId: string): Promise<AffiliateProfile | null> {
    try {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No profile found
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Get affiliate profile error:', error);
      throw error;
    }
  }

  /**
   * Update affiliate profile
   */
  async updateAffiliateProfile(userId: string, updates: Partial<AffiliateProfile>): Promise<AffiliateProfile> {
    try {
      const { data, error } = await supabase
        .from('affiliate_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Update affiliate profile error:', error);
      throw error;
    }
  }

  // ==================== REFERRAL TRACKING ====================

  /**
   * Generate affiliate tracking link
   */
  generateTrackingLink(affiliateId: string, targetUrl: string, utmParams?: any): string {
    const url = new URL(targetUrl, window.location.origin);
    url.searchParams.set('ref', affiliateId);
    
    if (utmParams) {
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Track affiliate click
   */
  async trackClick(affiliateId: string, trackingData: Partial<AffiliateClick>): Promise<string> {
    try {
      const trackingId = this.generateTrackingId();
      
      const { data, error } = await supabase
        .from('affiliate_clicks')
        .insert({
          affiliate_id: affiliateId,
          tracking_id: trackingId,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          device_type: this.getDeviceType(),
          device_info: this.getDeviceInfo(),
          session_id: this.getSessionId(),
          fingerprint: await this.generateFingerprint(),
          ...trackingData
        })
        .select()
        .single();

      if (error) throw error;

      // Set tracking cookie
      this.setTrackingCookie(affiliateId, trackingId);
      
      return trackingId;
    } catch (error: any) {
      console.error('Track click error:', error);
      throw error;
    }
  }

  /**
   * Record affiliate conversion
   */
  async recordConversion(conversionData: {
    affiliateId?: string;
    userId?: string;
    orderId?: string;
    orderValue: number;
    conversionType?: string;
    productId?: string;
  }): Promise<AffiliateConversion> {
    try {
      // Get affiliate ID from cookie if not provided
      const affiliateId = conversionData.affiliateId || this.getTrackingCookie()?.affiliateId;
      
      if (!affiliateId) {
        throw new Error('No affiliate tracking found for this conversion');
      }

      // Get affiliate profile to determine commission rate
      const { data: profile } = await supabase
        .from('affiliate_profiles')
        .select('commission_rate, special_rate')
        .eq('affiliate_id', affiliateId)
        .single();

      if (!profile) {
        throw new Error('Affiliate profile not found');
      }

      const commissionRate = profile.special_rate || profile.commission_rate;
      const commissionAmount = conversionData.orderValue * commissionRate;

      const { data, error } = await supabase
        .from('affiliate_conversions')
        .insert({
          affiliate_id: affiliateId,
          converted_user_id: conversionData.userId,
          order_id: conversionData.orderId,
          order_value: conversionData.orderValue,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          conversion_type: conversionData.conversionType || 'purchase',
          product_id: conversionData.productId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update affiliate stats
      await this.updateAffiliateStats(affiliateId);
      
      // Check for tier upgrade
      await this.checkTierUpgrade(affiliateId);

      return data;
    } catch (error: any) {
      console.error('Record conversion error:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get affiliate analytics for a specific period
   */
  async getAffiliateAnalytics(
    affiliateId: string, 
    startDate: string, 
    endDate: string
  ): Promise<AffiliateAnalytics> {
    try {
      // Get clicks data
      const { data: clicksData } = await supabase
        .from('affiliate_clicks')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Get conversions data
      const { data: conversionsData } = await supabase
        .from('affiliate_conversions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const clicks = clicksData?.length || 0;
      const unique_clicks = new Set(clicksData?.map(c => c.ip_address)).size;
      const conversions = conversionsData?.length || 0;
      const revenue = conversionsData?.reduce((sum, c) => sum + c.order_value, 0) || 0;
      const commission = conversionsData?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const conversion_rate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const epc = clicks > 0 ? commission / clicks : 0;

      // Analyze top sources
      const top_sources = this.analyzeTopSources(clicksData || []);
      const device_breakdown = this.analyzeDeviceBreakdown(clicksData || []);
      const geo_data = this.analyzeGeoData(clicksData || []);

      return {
        clicks,
        unique_clicks,
        conversions,
        revenue,
        commission,
        conversion_rate,
        epc,
        top_sources,
        device_breakdown,
        geo_data
      };
    } catch (error: any) {
      console.error('Get affiliate analytics error:', error);
      throw error;
    }
  }

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(affiliateId: string): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7) + '-01';
      
      // Get today's metrics
      const todayMetrics = await this.getAffiliateAnalytics(affiliateId, today, today);
      
      // Get this month's metrics
      const monthMetrics = await this.getAffiliateAnalytics(affiliateId, thisMonth, today);
      
      // Get all-time totals
      const { data: profile } = await supabase
        .from('affiliate_profiles')
        .select('total_earnings, total_referrals, total_conversions, avg_conversion_rate')
        .eq('affiliate_id', affiliateId)
        .single();

      // Get pending earnings
      const { data: pendingConversions } = await supabase
        .from('affiliate_conversions')
        .select('commission_amount')
        .eq('affiliate_id', affiliateId)
        .eq('status', 'pending');

      const pendingEarnings = pendingConversions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;

      return {
        today: todayMetrics,
        thisMonth: monthMetrics,
        allTime: profile || {},
        pendingEarnings,
        totalClicks: monthMetrics.clicks,
        conversionRate: profile?.avg_conversion_rate || 0
      };
    } catch (error: any) {
      console.error('Get dashboard metrics error:', error);
      throw error;
    }
  }

  // ==================== MARKETING ASSETS ====================

  /**
   * Get marketing assets library
   */
  async getMarketingAssets(tierRequirement?: string): Promise<MarketingAsset[]> {
    try {
      let query = supabase
        .from('affiliate_assets')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('download_count', { ascending: false });

      if (tierRequirement) {
        // Only show assets available to this tier or below
        const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
        query = query.lte('tier_requirement', tierOrder[tierRequirement as keyof typeof tierOrder] || 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Get marketing assets error:', error);
      throw error;
    }
  }

  /**
   * Download marketing asset with tracking
   */
  async downloadAsset(assetId: string, affiliateId: string): Promise<string> {
    try {
      // Increment download count
      await supabase
        .from('affiliate_assets')
        .update({ 
          download_count: supabase.raw('download_count + 1')
        })
        .eq('id', assetId);

      // Get asset details
      const { data: asset } = await supabase
        .from('affiliate_assets')
        .select('file_url, name')
        .eq('id', assetId)
        .single();

      if (!asset) throw new Error('Asset not found');

      // Generate affiliate-coded download URL
      return this.generateTrackingLink(affiliateId, asset.file_url);
    } catch (error: any) {
      console.error('Download asset error:', error);
      throw error;
    }
  }

  // ==================== COMMISSION MANAGEMENT ====================

  /**
   * Get commission tiers
   */
  async getCommissionTiers(): Promise<CommissionTier[]> {
    try {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('tier_order');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get commission tiers error:', error);
      throw error;
    }
  }

  /**
   * Check and update affiliate tier based on performance
   */
  async checkTierUpgrade(affiliateId: string): Promise<void> {
    try {
      await supabase.rpc('update_affiliate_tier', { p_affiliate_id: affiliateId });
    } catch (error: any) {
      console.error('Check tier upgrade error:', error);
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  private generateTrackingId(): string {
    return 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '0.0.0.0';
    }
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('affiliate_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('affiliate_session_id', sessionId);
    }
    return sessionId;
  }

  private async generateFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private setTrackingCookie(affiliateId: string, trackingId: string): void {
    const cookieValue = JSON.stringify({ affiliateId, trackingId, timestamp: Date.now() });
    const expires = new Date(Date.now() + this.COOKIE_DURATION * 24 * 60 * 60 * 1000);
    document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(cookieValue)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private getTrackingCookie(): { affiliateId: string; trackingId: string; timestamp: number } | null {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${this.COOKIE_NAME}=`));
    
    if (cookie) {
      try {
        const value = decodeURIComponent(cookie.split('=')[1]);
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    
    return null;
  }

  private async updateAffiliateStats(affiliateId: string): Promise<void> {
    try {
      // Calculate new stats
      const { data: stats } = await supabase.rpc('calculate_affiliate_earnings', { 
        p_affiliate_id: affiliateId 
      });

      if (stats && stats.length > 0) {
        const { total_earnings } = stats[0];
        
        // Get conversion count
        const { count: conversions } = await supabase
          .from('affiliate_conversions')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliateId);

        // Get click count for conversion rate
        const { count: clicks } = await supabase
          .from('affiliate_clicks')
          .select('*', { count: 'exact', head: true })
          .eq('affiliate_id', affiliateId);

        const conversionRate = clicks > 0 ? (conversions || 0) / clicks : 0;

        // Update profile
        await supabase
          .from('affiliate_profiles')
          .update({
            total_earnings: total_earnings || 0,
            total_conversions: conversions || 0,
            total_referrals: clicks || 0,
            avg_conversion_rate: conversionRate,
            updated_at: new Date().toISOString()
          })
          .eq('affiliate_id', affiliateId);
      }
    } catch (error: any) {
      console.error('Update affiliate stats error:', error);
    }
  }

  private analyzeTopSources(clicks: any[]): any {
    const sources: { [key: string]: number } = {};
    clicks.forEach(click => {
      const source = click.utm_source || click.referrer_url || 'direct';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));
  }

  private analyzeDeviceBreakdown(clicks: any[]): any {
    const devices: { [key: string]: number } = {};
    clicks.forEach(click => {
      const device = click.device_type || 'unknown';
      devices[device] = (devices[device] || 0) + 1;
    });
    
    return devices;
  }

  private analyzeGeoData(clicks: any[]): any {
    const countries: { [key: string]: number } = {};
    clicks.forEach(click => {
      if (click.location_data?.country) {
        const country = click.location_data.country;
        countries[country] = (countries[country] || 0) + 1;
      }
    });
    
    return Object.entries(countries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));
  }
}

// Export singleton instance
export const enhancedAffiliateService = EnhancedAffiliateService.getInstance();
