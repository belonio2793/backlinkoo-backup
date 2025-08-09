import { supabase } from '../integrations/supabase/client';

interface AffiliateProfile {
  id: string;
  user_id: string;
  affiliate_code: string;
  custom_id: string;
  status: 'active' | 'inactive' | 'suspended';
  commission_rate: number;
  total_earnings: number;
  total_paid: number;
  pending_earnings: number;
  referral_url: string;
  created_at: string;
  updated_at: string;
  // Extended fields for compatibility
  affiliate_id?: string;
  tier?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  total_referrals?: number;
  total_conversions?: number;
}

interface AffiliateAnalytics {
  clicks: number;
  unique_clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  conversion_rate: number;
  epc: number;
  top_sources: any;
  device_breakdown: any;
  geo_data: any;
}

export class CompatibilityAffiliateService {
  private static instance: CompatibilityAffiliateService;
  private readonly COOKIE_NAME = 'aff_ref';
  private readonly COOKIE_DURATION = 30; // 30 days
  
  static getInstance(): CompatibilityAffiliateService {
    if (!CompatibilityAffiliateService.instance) {
      CompatibilityAffiliateService.instance = new CompatibilityAffiliateService();
    }
    return CompatibilityAffiliateService.instance;
  }

  // ==================== AFFILIATE PROFILE MANAGEMENT ====================

  /**
   * Create affiliate profile using existing schema
   */
  async createAffiliateProfile(userId: string, profileData: any): Promise<AffiliateProfile> {
    try {
      // Generate unique affiliate code and custom ID
      const affiliateCode = this.generateAffiliateCode();
      const customId = this.generateCustomId();
      const referralUrl = `https://backlinkoo.com?ref=${affiliateCode}`;

      const { data, error } = await supabase
        .from('affiliate_programs')
        .insert({
          user_id: userId,
          affiliate_code: affiliateCode,
          custom_id: customId,
          status: 'active',
          commission_rate: 0.20, // 20% default
          total_earnings: 0,
          total_paid: 0,
          pending_earnings: 0,
          referral_url: referralUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating affiliate profile:', error);
        throw new Error(`Failed to create affiliate profile: ${error.message}`);
      }

      // Add compatibility fields
      return {
        ...data,
        affiliate_id: data.affiliate_code,
        tier: 'bronze',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        total_referrals: 0,
        total_conversions: 0
      };
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      console.error('Create affiliate profile error:', errorMessage, error);
      throw new Error(`Failed to create affiliate profile: ${errorMessage}`);
    }
  }

  /**
   * Get affiliate profile by user ID
   */
  async getAffiliateProfile(userId: string): Promise<AffiliateProfile | null> {
    try {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No profile found
        }
        throw error;
      }

      if (!data) return null;

      // Add compatibility fields
      return {
        ...data,
        affiliate_id: data.affiliate_code,
        tier: this.getTierFromEarnings(data.total_earnings),
        first_name: '',
        last_name: '',
        email: '',
        total_referrals: 0,
        total_conversions: 0
      };
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      console.error('Get affiliate profile error:', errorMessage, error);
      throw new Error(`Failed to get affiliate profile: ${errorMessage}`);
    }
  }

  /**
   * Update affiliate profile
   */
  async updateAffiliateProfile(userId: string, updates: Partial<AffiliateProfile>): Promise<AffiliateProfile> {
    try {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        affiliate_id: data.affiliate_code,
        tier: this.getTierFromEarnings(data.total_earnings),
        first_name: updates.first_name || '',
        last_name: updates.last_name || '',
        email: updates.email || '',
        total_referrals: updates.total_referrals || 0,
        total_conversions: updates.total_conversions || 0
      };
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      console.error('Update affiliate profile error:', errorMessage, error);
      throw new Error(`Failed to update affiliate profile: ${errorMessage}`);
    }
  }

  // ==================== REFERRAL TRACKING ====================

  /**
   * Generate affiliate tracking link
   */
  generateTrackingLink(affiliateCode: string, targetUrl: string, utmParams?: any): string {
    const url = new URL(targetUrl, 'https://backlinkoo.com');
    url.searchParams.set('ref', affiliateCode);
    
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
   * Track affiliate click (mock implementation for compatibility)
   */
  async trackClick(affiliateCode: string, trackingData: any): Promise<string> {
    try {
      // For now, just set the tracking cookie
      // In a full implementation, this would record to affiliate_referrals table
      const trackingId = this.generateTrackingId();
      this.setTrackingCookie(affiliateCode, trackingId);
      return trackingId;
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      console.error('Track click error:', errorMessage, error);
      throw new Error(`Failed to track click: ${errorMessage}`);
    }
  }

  /**
   * Record affiliate conversion (mock implementation)
   */
  async recordConversion(conversionData: {
    affiliateCode?: string;
    userId?: string;
    orderId?: string;
    orderValue: number;
    conversionType?: string;
  }): Promise<any> {
    try {
      // Get affiliate code from cookie if not provided
      const affiliateCode = conversionData.affiliateCode || this.getTrackingCookie()?.affiliateCode;
      
      if (!affiliateCode) {
        throw new Error('No affiliate tracking found for this conversion');
      }

      // Calculate commission (20% default)
      const commissionAmount = conversionData.orderValue * 0.20;

      // Update affiliate earnings
      const { error } = await supabase
        .from('affiliate_programs')
        .update({
          pending_earnings: supabase.raw(`pending_earnings + ${commissionAmount}`),
          total_earnings: supabase.raw(`total_earnings + ${commissionAmount}`),
          updated_at: new Date().toISOString()
        })
        .eq('affiliate_code', affiliateCode);

      if (error) throw error;

      return {
        affiliate_code: affiliateCode,
        order_value: conversionData.orderValue,
        commission_amount: commissionAmount,
        status: 'pending'
      };
    } catch (error: any) {
      console.error('Record conversion error:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get affiliate analytics (mock data for compatibility)
   */
  async getAffiliateAnalytics(
    affiliateCode: string, 
    startDate: string, 
    endDate: string
  ): Promise<AffiliateAnalytics> {
    try {
      // Mock analytics data - in full implementation would query actual data
      return {
        clicks: Math.floor(Math.random() * 100) + 50,
        unique_clicks: Math.floor(Math.random() * 80) + 30,
        conversions: Math.floor(Math.random() * 10) + 2,
        revenue: Math.floor(Math.random() * 1000) + 200,
        commission: Math.floor(Math.random() * 200) + 40,
        conversion_rate: Math.random() * 5 + 2,
        epc: Math.random() * 2 + 0.5,
        top_sources: [
          { source: 'direct', count: 45 },
          { source: 'google', count: 32 },
          { source: 'facebook', count: 18 }
        ],
        device_breakdown: {
          mobile: 45,
          desktop: 32,
          tablet: 8
        },
        geo_data: [
          { country: 'US', count: 65 },
          { country: 'CA', count: 12 },
          { country: 'GB', count: 8 }
        ]
      };
    } catch (error: any) {
      console.error('Get affiliate analytics error:', error);
      throw error;
    }
  }

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(affiliateCode: string): Promise<any> {
    try {
      // Get profile data
      const { data: profile } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('affiliate_code', affiliateCode)
        .single();

      if (!profile) {
        throw new Error('Affiliate profile not found');
      }

      // Mock some analytics for today and this month
      const todayMetrics = await this.getAffiliateAnalytics(affiliateCode, new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
      const monthMetrics = await this.getAffiliateAnalytics(affiliateCode, new Date().toISOString().substring(0, 7) + '-01', new Date().toISOString().split('T')[0]);

      return {
        today: todayMetrics,
        thisMonth: monthMetrics,
        allTime: {
          total_earnings: profile.total_earnings,
          total_referrals: Math.floor(Math.random() * 50) + 10,
          total_conversions: Math.floor(Math.random() * 15) + 3,
          avg_conversion_rate: Math.random() * 5 + 2
        },
        pendingEarnings: profile.pending_earnings,
        totalClicks: monthMetrics.clicks,
        conversionRate: monthMetrics.conversion_rate
      };
    } catch (error: any) {
      console.error('Get dashboard metrics error:', error);
      throw error;
    }
  }

  // ==================== MARKETING ASSETS ====================

  /**
   * Get marketing assets (mock data)
   */
  async getMarketingAssets(tierRequirement?: string): Promise<any[]> {
    // Mock marketing assets
    return [
      {
        id: '1',
        name: 'Homepage Banner 728x90',
        description: 'Standard leaderboard banner for websites',
        asset_type: 'banner',
        file_url: '/api/placeholder/728/90',
        dimensions: '728x90',
        file_format: 'jpg',
        download_count: 145,
        is_featured: true
      },
      {
        id: '2',
        name: 'Social Media Square 1080x1080',
        description: 'Perfect for Instagram and Facebook posts',
        asset_type: 'social',
        file_url: '/api/placeholder/1080/1080',
        dimensions: '1080x1080',
        file_format: 'png',
        download_count: 89,
        is_featured: false
      },
      {
        id: '3',
        name: 'Email Template',
        description: 'Professional email template for newsletters',
        asset_type: 'email',
        file_url: '/email-template.html',
        dimensions: 'responsive',
        file_format: 'html',
        download_count: 67,
        is_featured: true
      }
    ];
  }

  /**
   * Download marketing asset
   */
  async downloadAsset(assetId: string, affiliateCode: string): Promise<string> {
    // Mock download - in real implementation would track and return actual file
    return this.generateTrackingLink(affiliateCode, `/assets/${assetId}`);
  }

  // ==================== COMMISSION MANAGEMENT ====================

  /**
   * Get commission tiers (mock data)
   */
  async getCommissionTiers(): Promise<any[]> {
    return [
      {
        id: '1',
        tier_name: 'bronze',
        min_referrals: 0,
        min_revenue: 0,
        commission_rate: 0.20,
        tier_order: 1,
        benefits: {
          description: 'Starting tier',
          perks: ['Basic marketing materials', 'Email support']
        }
      },
      {
        id: '2',
        tier_name: 'silver',
        min_referrals: 10,
        min_revenue: 1000,
        commission_rate: 0.25,
        tier_order: 2,
        benefits: {
          description: 'Growing affiliate',
          perks: ['Premium banners', 'Priority support']
        }
      },
      {
        id: '3',
        tier_name: 'gold',
        min_referrals: 25,
        min_revenue: 5000,
        commission_rate: 0.30,
        tier_order: 3,
        benefits: {
          description: 'Successful affiliate',
          perks: ['Custom materials', 'Phone support']
        }
      }
    ];
  }

  // ==================== UTILITY FUNCTIONS ====================

  private generateAffiliateCode(): string {
    return 'BL' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
  }

  private generateCustomId(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private generateTrackingId(): string {
    return 'track_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getTierFromEarnings(earnings: number): string {
    if (earnings >= 50000) return 'diamond';
    if (earnings >= 15000) return 'platinum';
    if (earnings >= 5000) return 'gold';
    if (earnings >= 1000) return 'silver';
    return 'bronze';
  }

  private setTrackingCookie(affiliateCode: string, trackingId: string): void {
    const cookieValue = JSON.stringify({ affiliateCode, trackingId, timestamp: Date.now() });
    const expires = new Date(Date.now() + this.COOKIE_DURATION * 24 * 60 * 60 * 1000);
    document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(cookieValue)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private getTrackingCookie(): { affiliateCode: string; trackingId: string; timestamp: number } | null {
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
}

// Export singleton instance
export const compatibilityAffiliateService = CompatibilityAffiliateService.getInstance();
