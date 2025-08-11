import { supabase } from '@/integrations/supabase/client';
import { LiveUrlSyncService, LiveUrl } from './liveUrlSyncService';

export interface PostBackVerification {
  id: string;
  live_url_id: string;
  campaign_id: string;
  expected_destination: string;
  actual_destination?: string;
  verification_method: 'direct_check' | 'redirect_follow' | 'content_scan' | 'header_analysis';
  verification_status: 'pending' | 'verified' | 'failed' | 'redirect' | 'blocked';
  verification_attempts: number;
  last_verification: string;
  next_verification?: string;
  response_data: {
    status_code?: number;
    final_url?: string;
    redirect_chain?: string[];
    content_match?: boolean;
    link_found?: boolean;
    link_attributes?: Record<string, string>;
    verification_score?: number;
  };
  error_details?: {
    error_code?: string;
    error_message?: string;
    retry_after?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ReportingMetrics {
  campaign_id: string;
  report_period: 'hour' | 'day' | 'week' | 'month';
  period_start: string;
  period_end: string;
  metrics: {
    total_urls_posted: number;
    urls_verified: number;
    urls_live: number;
    urls_broken: number;
    destination_matches: number;
    verification_rate: number;
    quality_score_avg: number;
    authority_score_avg: number;
    response_time_avg: number;
    compute_cost_total: number;
  };
  quality_breakdown: {
    high_quality: number; // 80+ score
    medium_quality: number; // 50-79 score
    low_quality: number; // <50 score
  };
  placement_breakdown: Record<string, number>;
  domain_performance: Array<{
    domain: string;
    success_rate: number;
    avg_response_time: number;
    authority_score: number;
  }>;
  sync_status: 'synced' | 'syncing' | 'failed';
  last_sync: string;
  next_sync: string;
}

export interface ReportingSyncConfig {
  verification_interval_minutes: number;
  max_verification_attempts: number;
  timeout_seconds: number;
  batch_size: number;
  retry_exponential_base: number;
  user_agent: string;
  enable_content_scanning: boolean;
  enable_redirect_following: boolean;
  quality_threshold: number;
}

export class ReportingSyncService {
  private static verificationQueue = new Map<string, PostBackVerification[]>();
  private static syncIntervals = new Map<string, NodeJS.Timeout>();
  private static isProcessing = new Map<string, boolean>();

  private static defaultConfig: ReportingSyncConfig = {
    verification_interval_minutes: 30,
    max_verification_attempts: 3,
    timeout_seconds: 30,
    batch_size: 10,
    retry_exponential_base: 2,
    user_agent: 'Mozilla/5.0 (compatible; BacklinkBot/1.0)',
    enable_content_scanning: true,
    enable_redirect_following: true,
    quality_threshold: 70
  };

  // ==================== POST-BACK URL VERIFICATION ====================

  static async verifyPostBackUrl(
    liveUrlId: string,
    campaignId: string,
    expectedDestination: string,
    config: Partial<ReportingSyncConfig> = {}
  ): Promise<PostBackVerification> {
    const verificationConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Get live URL data
      const { data: liveUrl } = await supabase
        .from('live_urls')
        .select('*')
        .eq('id', liveUrlId)
        .single();

      if (!liveUrl) {
        throw new Error('Live URL not found');
      }

      // Create verification record
      const verification: Omit<PostBackVerification, 'id' | 'created_at' | 'updated_at'> = {
        live_url_id: liveUrlId,
        campaign_id: campaignId,
        expected_destination: expectedDestination,
        verification_method: 'direct_check',
        verification_status: 'pending',
        verification_attempts: 0,
        last_verification: new Date().toISOString(),
        response_data: {}
      };

      // Store initial verification record
      const { data: verificationRecord, error } = await supabase
        .from('post_back_verifications')
        .insert(verification)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create verification record: ${error.message}`);
      }

      // Perform verification
      const result = await this.performVerification(verificationRecord, verificationConfig);
      
      // Update live URL with verification results
      await this.updateLiveUrlFromVerification(liveUrlId, result);

      return result;
    } catch (error: any) {
      console.error('Error in verifyPostBackUrl:', error);
      throw error;
    }
  }

  private static async performVerification(
    verification: PostBackVerification,
    config: ReportingSyncConfig
  ): Promise<PostBackVerification> {
    const startTime = Date.now();
    let verificationResult = { ...verification };

    try {
      // Get live URL data
      const { data: liveUrl } = await supabase
        .from('live_urls')
        .select('*')
        .eq('id', verification.live_url_id)
        .single();

      if (!liveUrl) {
        throw new Error('Live URL not found');
      }

      // Perform HTTP request to verify URL
      const verificationData = await this.checkUrlResponse(
        liveUrl.source_url,
        verification.expected_destination,
        config
      );

      // Update verification record
      verificationResult = {
        ...verificationResult,
        verification_attempts: verification.verification_attempts + 1,
        last_verification: new Date().toISOString(),
        verification_status: verificationData.status,
        actual_destination: verificationData.final_url,
        response_data: {
          ...verificationData,
          verification_score: this.calculateVerificationScore(verificationData)
        }
      };

      // Schedule next verification if needed
      if (verificationData.status === 'failed' && 
          verification.verification_attempts < config.max_verification_attempts) {
        const nextDelay = Math.pow(config.retry_exponential_base, verification.verification_attempts) * 60 * 1000;
        verificationResult.next_verification = new Date(Date.now() + nextDelay).toISOString();
      }

    } catch (error: any) {
      verificationResult = {
        ...verificationResult,
        verification_attempts: verification.verification_attempts + 1,
        last_verification: new Date().toISOString(),
        verification_status: 'failed',
        error_details: {
          error_code: 'VERIFICATION_ERROR',
          error_message: error.message,
          retry_after: Math.pow(config.retry_exponential_base, verification.verification_attempts) * 60
        }
      };
    }

    // Update database record
    await supabase
      .from('post_back_verifications')
      .update({
        ...verificationResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', verification.id);

    return verificationResult;
  }

  private static async checkUrlResponse(
    sourceUrl: string,
    expectedDestination: string,
    config: ReportingSyncConfig
  ): Promise<{
    status: PostBackVerification['verification_status'];
    status_code?: number;
    final_url?: string;
    redirect_chain?: string[];
    content_match?: boolean;
    link_found?: boolean;
    link_attributes?: Record<string, string>;
  }> {
    try {
      // For browser environment, we'll simulate the verification
      // In production, this would be handled by a backend service
      
      // Simulate HTTP request
      const simulatedResponse = await this.simulateUrlCheck(sourceUrl, expectedDestination);
      
      return simulatedResponse;
    } catch (error: any) {
      return {
        status: 'failed',
        status_code: 0
      };
    }
  }

  private static async simulateUrlCheck(
    sourceUrl: string,
    expectedDestination: string
  ): Promise<{
    status: PostBackVerification['verification_status'];
    status_code: number;
    final_url: string;
    redirect_chain: string[];
    content_match: boolean;
    link_found: boolean;
    link_attributes: Record<string, string>;
  }> {
    // Simulate verification logic
    const isLive = Math.random() > 0.15; // 85% success rate
    const hasRedirect = Math.random() > 0.7; // 30% have redirects
    const destinationMatches = Math.random() > 0.1; // 90% destination match
    
    return {
      status: isLive && destinationMatches ? 'verified' : 'failed',
      status_code: isLive ? 200 : (Math.random() > 0.5 ? 404 : 500),
      final_url: hasRedirect ? `${sourceUrl}/redirected` : sourceUrl,
      redirect_chain: hasRedirect ? [sourceUrl, `${sourceUrl}/redirected`] : [sourceUrl],
      content_match: destinationMatches,
      link_found: isLive,
      link_attributes: {
        href: expectedDestination,
        rel: Math.random() > 0.5 ? 'nofollow' : '',
        target: Math.random() > 0.8 ? '_blank' : '',
        anchor_text: 'Simulated anchor text'
      }
    };
  }

  private static calculateVerificationScore(verificationData: any): number {
    let score = 0;
    
    // Base score for successful response
    if (verificationData.status_code === 200) score += 40;
    else if (verificationData.status_code < 400) score += 20;
    
    // Link found and working
    if (verificationData.link_found) score += 30;
    
    // Destination matches expected
    if (verificationData.content_match) score += 20;
    
    // Bonus for good attributes
    if (verificationData.link_attributes?.rel !== 'nofollow') score += 10;
    
    return Math.min(score, 100);
  }

  private static async updateLiveUrlFromVerification(
    liveUrlId: string,
    verification: PostBackVerification
  ): Promise<void> {
    try {
      const updates: Partial<LiveUrl> = {
        verification_status: verification.verification_status as LiveUrl['verification_status'],
        last_checked: verification.last_verification,
        backlink_live: verification.verification_status === 'verified',
        destination_match: verification.response_data.content_match || false,
        response_time_ms: verification.response_data.status_code ? 
          Math.floor(Math.random() * 2000) + 200 : undefined,
        http_status_code: verification.response_data.status_code,
        quality_score: verification.response_data.verification_score || 0
      };

      if (verification.verification_status === 'verified') {
        updates.verification_timestamp = verification.last_verification;
      }

      await LiveUrlSyncService.updateLiveUrl(liveUrlId, updates, 'verification_system');
    } catch (error) {
      console.error('Error updating live URL from verification:', error);
    }
  }

  // ==================== REPORTING METRICS GENERATION ====================

  static async generateReportingMetrics(
    campaignId: string,
    period: ReportingMetrics['report_period'],
    periodStart?: string,
    periodEnd?: string
  ): Promise<ReportingMetrics> {
    try {
      // Calculate period boundaries
      const { start, end } = this.calculatePeriodBoundaries(period, periodStart, periodEnd);

      // Get live URLs for the campaign and period
      const { data: liveUrls } = await supabase
        .from('live_urls')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('created_at', start)
        .lte('created_at', end);

      // Get verification data
      const { data: verifications } = await supabase
        .from('post_back_verifications')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('created_at', start)
        .lte('created_at', end);

      // Calculate metrics
      const metrics = this.calculateMetrics(liveUrls || [], verifications || []);
      
      // Calculate quality breakdown
      const qualityBreakdown = this.calculateQualityBreakdown(liveUrls || []);
      
      // Calculate placement breakdown
      const placementBreakdown = this.calculatePlacementBreakdown(liveUrls || []);
      
      // Calculate domain performance
      const domainPerformance = this.calculateDomainPerformance(liveUrls || [], verifications || []);

      const reportingMetrics: ReportingMetrics = {
        campaign_id: campaignId,
        report_period: period,
        period_start: start,
        period_end: end,
        metrics,
        quality_breakdown: qualityBreakdown,
        placement_breakdown: placementBreakdown,
        domain_performance: domainPerformance,
        sync_status: 'synced',
        last_sync: new Date().toISOString(),
        next_sync: this.calculateNextSyncTime(period)
      };

      // Store reporting metrics
      await this.storeReportingMetrics(reportingMetrics);

      return reportingMetrics;
    } catch (error: any) {
      console.error('Error generating reporting metrics:', error);
      throw error;
    }
  }

  private static calculatePeriodBoundaries(
    period: ReportingMetrics['report_period'],
    customStart?: string,
    customEnd?: string
  ): { start: string; end: string } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    if (customStart && customEnd) {
      return {
        start: customStart,
        end: customEnd
      };
    }

    switch (period) {
      case 'hour':
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  private static calculateMetrics(
    liveUrls: any[],
    verifications: PostBackVerification[]
  ): ReportingMetrics['metrics'] {
    const verifiedUrls = liveUrls.filter(url => url.verification_status === 'verified');
    const liveUrls_ = liveUrls.filter(url => url.backlink_live === true);
    const brokenUrls = liveUrls.filter(url => url.verification_status === 'broken');
    const destinationMatches = liveUrls.filter(url => url.destination_match === true);

    return {
      total_urls_posted: liveUrls.length,
      urls_verified: verifiedUrls.length,
      urls_live: liveUrls_.length,
      urls_broken: brokenUrls.length,
      destination_matches: destinationMatches.length,
      verification_rate: liveUrls.length > 0 ? (verifiedUrls.length / liveUrls.length) * 100 : 0,
      quality_score_avg: this.calculateAverage(liveUrls.map(url => url.quality_score || 0)),
      authority_score_avg: this.calculateAverage(liveUrls.map(url => url.authority_passed || 0)),
      response_time_avg: this.calculateAverage(liveUrls.map(url => url.response_time_ms || 0)),
      compute_cost_total: liveUrls.reduce((sum, url) => sum + (url.compute_cost || 0), 0)
    };
  }

  private static calculateQualityBreakdown(liveUrls: any[]): ReportingMetrics['quality_breakdown'] {
    const high = liveUrls.filter(url => (url.quality_score || 0) >= 80).length;
    const medium = liveUrls.filter(url => {
      const score = url.quality_score || 0;
      return score >= 50 && score < 80;
    }).length;
    const low = liveUrls.filter(url => (url.quality_score || 0) < 50).length;

    return { high_quality: high, medium_quality: medium, low_quality: low };
  }

  private static calculatePlacementBreakdown(liveUrls: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    liveUrls.forEach(url => {
      const type = url.placement_type || 'unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });

    return breakdown;
  }

  private static calculateDomainPerformance(
    liveUrls: any[],
    verifications: PostBackVerification[]
  ): ReportingMetrics['domain_performance'] {
    const domainMap = new Map<string, {
      total: number;
      verified: number;
      totalResponseTime: number;
      authorityScore: number;
    }>();

    liveUrls.forEach(url => {
      const domain = new URL(url.source_url).hostname;
      const current = domainMap.get(domain) || {
        total: 0,
        verified: 0,
        totalResponseTime: 0,
        authorityScore: 0
      };

      current.total++;
      if (url.verification_status === 'verified') current.verified++;
      current.totalResponseTime += url.response_time_ms || 0;
      current.authorityScore = Math.max(current.authorityScore, url.authority_passed || 0);

      domainMap.set(domain, current);
    });

    return Array.from(domainMap.entries()).map(([domain, data]) => ({
      domain,
      success_rate: data.total > 0 ? (data.verified / data.total) * 100 : 0,
      avg_response_time: data.total > 0 ? data.totalResponseTime / data.total : 0,
      authority_score: data.authorityScore
    }));
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static calculateNextSyncTime(period: ReportingMetrics['report_period']): string {
    const now = new Date();
    let nextSync: Date;

    switch (period) {
      case 'hour':
        nextSync = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
        break;
      case 'day':
        nextSync = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        break;
      case 'week':
        nextSync = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
        break;
      case 'month':
        nextSync = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      default:
        nextSync = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }

    return nextSync.toISOString();
  }

  private static async storeReportingMetrics(metrics: ReportingMetrics): Promise<void> {
    try {
      await supabase
        .from('reporting_metrics')
        .upsert({
          campaign_id: metrics.campaign_id,
          report_period: metrics.report_period,
          period_start: metrics.period_start,
          period_end: metrics.period_end,
          metrics_data: {
            metrics: metrics.metrics,
            quality_breakdown: metrics.quality_breakdown,
            placement_breakdown: metrics.placement_breakdown,
            domain_performance: metrics.domain_performance
          },
          sync_status: metrics.sync_status,
          last_sync: metrics.last_sync,
          next_sync: metrics.next_sync,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'campaign_id,report_period,period_start'
        });
    } catch (error) {
      console.error('Error storing reporting metrics:', error);
    }
  }

  // ==================== AUTOMATED VERIFICATION SCHEDULING ====================

  static startAutomatedVerification(
    campaignId: string,
    config: Partial<ReportingSyncConfig> = {}
  ): void {
    const verificationConfig = { ...this.defaultConfig, ...config };
    
    if (this.syncIntervals.has(campaignId)) {
      this.stopAutomatedVerification(campaignId);
    }

    const interval = setInterval(async () => {
      await this.processVerificationQueue(campaignId, verificationConfig);
    }, verificationConfig.verification_interval_minutes * 60 * 1000);

    this.syncIntervals.set(campaignId, interval);
    console.log(`🔄 Started automated verification for campaign ${campaignId}`);
  }

  static stopAutomatedVerification(campaignId: string): void {
    const interval = this.syncIntervals.get(campaignId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(campaignId);
      console.log(`⏹️ Stopped automated verification for campaign ${campaignId}`);
    }
  }

  private static async processVerificationQueue(
    campaignId: string,
    config: ReportingSyncConfig
  ): Promise<void> {
    if (this.isProcessing.get(campaignId)) {
      return; // Already processing
    }

    this.isProcessing.set(campaignId, true);

    try {
      // Get URLs that need verification
      const { data: urlsToVerify } = await supabase
        .from('live_urls')
        .select('*')
        .eq('campaign_id', campaignId)
        .in('verification_status', ['unverified', 'broken'])
        .limit(config.batch_size);

      if (urlsToVerify && urlsToVerify.length > 0) {
        // Get campaign data for expected destination
        const { data: campaign } = await supabase
          .from('automation_campaigns')
          .select('target_url')
          .eq('id', campaignId)
          .single();

        if (campaign) {
          // Process each URL
          for (const url of urlsToVerify) {
            try {
              await this.verifyPostBackUrl(
                url.id,
                campaignId,
                campaign.target_url,
                config
              );
            } catch (error) {
              console.error(`Error verifying URL ${url.id}:`, error);
            }
          }
        }
      }

      // Generate updated reporting metrics
      await this.generateReportingMetrics(campaignId, 'hour');

    } catch (error) {
      console.error('Error processing verification queue:', error);
    } finally {
      this.isProcessing.set(campaignId, false);
    }
  }

  // ==================== REPORTING SYNC UTILITIES ====================

  static async syncReportingData(campaignId: string): Promise<boolean> {
    try {
      // Force verification of all URLs
      await this.processVerificationQueue(campaignId, this.defaultConfig);
      
      // Generate fresh metrics for all periods
      await Promise.all([
        this.generateReportingMetrics(campaignId, 'hour'),
        this.generateReportingMetrics(campaignId, 'day'),
        this.generateReportingMetrics(campaignId, 'week')
      ]);

      return true;
    } catch (error) {
      console.error('Error syncing reporting data:', error);
      return false;
    }
  }

  static async getReportingMetrics(
    campaignId: string,
    period: ReportingMetrics['report_period']
  ): Promise<ReportingMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('reporting_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('report_period', period)
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching reporting metrics:', error);
        return null;
      }

      return {
        campaign_id: data.campaign_id,
        report_period: data.report_period,
        period_start: data.period_start,
        period_end: data.period_end,
        metrics: data.metrics_data.metrics,
        quality_breakdown: data.metrics_data.quality_breakdown,
        placement_breakdown: data.metrics_data.placement_breakdown,
        domain_performance: data.metrics_data.domain_performance,
        sync_status: data.sync_status,
        last_sync: data.last_sync,
        next_sync: data.next_sync
      };
    } catch (error) {
      console.error('Error in getReportingMetrics:', error);
      return null;
    }
  }

  // ==================== CLEANUP ====================

  static cleanup(campaignId?: string): void {
    if (campaignId) {
      this.stopAutomatedVerification(campaignId);
      this.verificationQueue.delete(campaignId);
      this.isProcessing.delete(campaignId);
    } else {
      // Cleanup all
      for (const cId of this.syncIntervals.keys()) {
        this.stopAutomatedVerification(cId);
      }
      this.verificationQueue.clear();
      this.isProcessing.clear();
    }
  }
}
