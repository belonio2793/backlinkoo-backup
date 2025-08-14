/**
 * Campaign Reporting System
 * Tracks and reports on published links and campaign results
 * Provides comprehensive analytics and saved reports
 */

import { supabase } from '@/integrations/supabase/client';
import { ErrorLogger } from '../utils/errorLogger';
import type { LiveCampaign } from './liveCampaignManager';

export interface PublishedLink {
  id: string;
  campaign_id: string;
  title: string;
  url: string;
  platform: string;
  published_at: string;
  word_count: number;
  anchor_text_used: string;
  target_url: string;
  keyword_used: string;
  
  // Performance metrics
  clicks?: number;
  impressions?: number;
  ctr?: number;
  domain_authority?: number;
  
  // Status tracking
  status: 'published' | 'indexed' | 'removed' | 'error';
  last_checked?: string;
  error_message?: string;
  
  // SEO metrics
  backlink_value?: number;
  estimated_traffic?: number;
}

export interface CampaignReport {
  id: string;
  campaign_id: string;
  user_id: string;
  report_name: string;
  generated_at: string;
  report_type: 'summary' | 'detailed' | 'performance' | 'links';
  
  // Report data
  summary: {
    total_links: number;
    successful_publications: number;
    failed_publications: number;
    total_word_count: number;
    platforms_used: string[];
    keywords_targeted: string[];
    anchor_texts_used: string[];
    campaign_duration_hours: number;
  };
  
  links: PublishedLink[];
  performance_metrics: {
    avg_word_count: number;
    success_rate: number;
    publication_rate: number; // links per hour
    top_performing_platforms: Array<{
      platform: string;
      link_count: number;
      success_rate: number;
    }>;
  };
  
  // Export formats
  export_formats?: {
    csv_url?: string;
    pdf_url?: string;
    json_url?: string;
  };
}

export interface ReportFilter {
  campaign_ids?: string[];
  date_from?: string;
  date_to?: string;
  platforms?: string[];
  keywords?: string[];
  status?: PublishedLink['status'][];
  min_word_count?: number;
  max_word_count?: number;
}

class CampaignReportingSystem {
  
  /**
   * Save a published link to the reporting system
   */
  async savePublishedLink(linkData: {
    campaign_id: string;
    title: string;
    url: string;
    platform: string;
    published_at: string;
    word_count: number;
    anchor_text_used: string;
    target_url: string;
    keyword_used: string;
    domain_authority?: number;
  }): Promise<{ success: boolean; link_id?: string; error?: string }> {
    try {
      const publishedLink: Omit<PublishedLink, 'id'> = {
        ...linkData,
        status: 'published',
        clicks: 0,
        impressions: 0,
        ctr: 0,
        backlink_value: this.calculateBacklinkValue(linkData.domain_authority || 85),
        estimated_traffic: this.estimateTraffic(linkData.word_count),
        last_checked: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('campaign_published_links')
        .insert(publishedLink)
        .select()
        .single();

      if (error) throw error;

      console.log(`Published link saved: ${linkData.url}`);
      return { success: true, link_id: data.id };
    } catch (error) {
      console.error('Failed to save published link:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get published links for a campaign
   */
  async getCampaignLinks(
    campaignId: string,
    filter?: ReportFilter
  ): Promise<PublishedLink[]> {
    try {
      let query = supabase
        .from('campaign_published_links')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('published_at', { ascending: false });

      // Apply filters
      if (filter) {
        if (filter.date_from) {
          query = query.gte('published_at', filter.date_from);
        }
        if (filter.date_to) {
          query = query.lte('published_at', filter.date_to);
        }
        if (filter.platforms) {
          query = query.in('platform', filter.platforms);
        }
        if (filter.status) {
          query = query.in('status', filter.status);
        }
        if (filter.min_word_count) {
          query = query.gte('word_count', filter.min_word_count);
        }
        if (filter.max_word_count) {
          query = query.lte('word_count', filter.max_word_count);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get campaign links:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      return [];
    }
  }

  /**
   * Get all published links for a user
   */
  async getUserPublishedLinks(
    userId: string,
    filter?: ReportFilter
  ): Promise<PublishedLink[]> {
    try {
      // First get user's campaigns
      const { data: campaigns, error: campaignError } = await supabase
        .from('automation_campaigns')
        .select('id')
        .eq('user_id', userId);

      if (campaignError) throw campaignError;
      
      if (!campaigns || campaigns.length === 0) {
        return [];
      }

      const campaignIds = campaigns.map(c => c.id);
      
      let query = supabase
        .from('campaign_published_links')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('published_at', { ascending: false });

      // Apply filters
      if (filter) {
        if (filter.campaign_ids) {
          const filteredIds = filter.campaign_ids.filter(id => campaignIds.includes(id));
          query = query.in('campaign_id', filteredIds);
        }
        if (filter.date_from) {
          query = query.gte('published_at', filter.date_from);
        }
        if (filter.date_to) {
          query = query.lte('published_at', filter.date_to);
        }
        if (filter.platforms) {
          query = query.in('platform', filter.platforms);
        }
        if (filter.status) {
          query = query.in('status', filter.status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user published links:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      return [];
    }
  }

  /**
   * Generate a comprehensive campaign report
   */
  async generateCampaignReport(
    campaignId: string,
    reportType: CampaignReport['report_type'] = 'summary',
    reportName?: string
  ): Promise<{ success: boolean; report?: CampaignReport; error?: string }> {
    try {
      // Get campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      if (!campaign) throw new Error('Campaign not found');

      // Get published links
      const links = await this.getCampaignLinks(campaignId);

      // Calculate campaign duration
      const startTime = campaign.started_at ? new Date(campaign.started_at) : new Date(campaign.created_at);
      const endTime = campaign.completed_at ? new Date(campaign.completed_at) : new Date();
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      // Generate summary
      const summary = {
        total_links: links.length,
        successful_publications: links.filter(l => l.status === 'published').length,
        failed_publications: links.filter(l => l.status === 'error').length,
        total_word_count: links.reduce((sum, link) => sum + link.word_count, 0),
        platforms_used: [...new Set(links.map(l => l.platform))],
        keywords_targeted: campaign.keywords || [],
        anchor_texts_used: [...new Set(links.map(l => l.anchor_text_used))],
        campaign_duration_hours: Math.round(durationHours * 100) / 100
      };

      // Calculate performance metrics
      const performanceMetrics = {
        avg_word_count: links.length > 0 ? Math.round(summary.total_word_count / links.length) : 0,
        success_rate: links.length > 0 ? (summary.successful_publications / links.length) * 100 : 0,
        publication_rate: durationHours > 0 ? links.length / durationHours : 0,
        top_performing_platforms: this.calculatePlatformPerformance(links)
      };

      // Create report object
      const report: CampaignReport = {
        id: `report_${campaignId}_${Date.now()}`,
        campaign_id: campaignId,
        user_id: campaign.user_id,
        report_name: reportName || `${campaign.name} - ${reportType} report`,
        generated_at: new Date().toISOString(),
        report_type: reportType,
        summary,
        links: reportType === 'links' || reportType === 'detailed' ? links : [],
        performance_metrics: performanceMetrics
      };

      // Save report to database - handle both old and new schema
      let insertData: any = {
        id: report.id,
        campaign_id: report.campaign_id,
        user_id: report.user_id,
      };

      // Check if new columns exist
      try {
        const { error: testError } = await supabase
          .from('campaign_reports')
          .select('report_name, report_type, generated_at, report_data')
          .limit(1);

        if (!testError) {
          // New schema with all columns
          insertData = {
            ...insertData,
            report_name: report.report_name,
            generated_at: report.generated_at,
            report_type: report.report_type,
            report_data: {
              summary: report.summary,
              links: report.links,
              performance_metrics: report.performance_metrics
            }
          };
        } else {
          // Fallback to old schema columns
          insertData = {
            ...insertData,
            total_links: report.summary?.total_links || 0,
            live_links: report.summary?.live_links || 0,
            pending_links: report.summary?.pending_links || 0,
            failed_links: report.summary?.failed_links || 0,
            success_rate: report.performance_metrics?.success_rate || 0,
            average_da: report.performance_metrics?.average_da || 0,
            total_cost: report.performance_metrics?.total_cost || 0,
            daily_velocity: report.performance_metrics?.daily_velocity || 0,
          };
        }
      } catch (e) {
        // Fallback to old schema
        insertData = {
          ...insertData,
          total_links: report.summary?.total_links || 0,
          live_links: report.summary?.live_links || 0,
          pending_links: report.summary?.pending_links || 0,
          failed_links: report.summary?.failed_links || 0,
          success_rate: report.performance_metrics?.success_rate || 0,
          average_da: report.performance_metrics?.average_da || 0,
          total_cost: report.performance_metrics?.total_cost || 0,
          daily_velocity: report.performance_metrics?.daily_velocity || 0,
        };
      }

      const { data: savedReport, error: saveError } = await supabase
        .from('campaign_reports')
        .insert(insertData)
        .select()
        .single();

      if (saveError) {
        console.warn('Failed to save report to database:', saveError);
        // Continue without saving - still return the report
      }

      return { success: true, report };
    } catch (error) {
      console.error('Failed to generate campaign report:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get saved reports for a user
   */
  async getUserReports(
    userId: string,
    campaignId?: string
  ): Promise<CampaignReport[]> {
    try {
      // First, try to check what columns exist
      let orderColumn = 'created_at'; // fallback to created_at if generated_at doesn't exist
      let selectColumns = 'id, user_id, campaign_id, created_at';

      // Try to detect available columns by attempting a limited query
      try {
        const { error: testError } = await supabase
          .from('campaign_reports')
          .select('generated_at')
          .limit(1);

        if (!testError) {
          orderColumn = 'generated_at';
          selectColumns += ', generated_at, report_name, report_type, report_data';
        }
      } catch (e) {
        console.log('Using fallback columns due to schema differences');
      }

      let query = supabase
        .from('campaign_reports')
        .select(selectColumns)
        .eq('user_id', userId)
        .order(orderColumn, { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(row => ({
        // Handle both old and new schema
        ...((row as any).report_data || {}),
        id: row.id,
        campaign_id: row.campaign_id,
        user_id: row.user_id,
        report_name: (row as any).report_name || `Report ${row.id}`,
        generated_at: (row as any).generated_at || row.created_at,
        report_type: (row as any).report_type || 'summary',
        // Add default structure for missing data
        summary: (row as any).report_data?.summary || {
          total_links: (row as any).total_links || 0,
          live_links: (row as any).live_links || 0,
          pending_links: (row as any).pending_links || 0,
          failed_links: (row as any).failed_links || 0
        },
        performance_metrics: (row as any).report_data?.performance_metrics || {
          success_rate: (row as any).success_rate || 0,
          average_da: (row as any).average_da || 0,
          total_cost: (row as any).total_cost || 0,
          daily_velocity: (row as any).daily_velocity || 0
        }
      }));
    } catch (error) {
      let errorMessage = 'Unknown error getting user reports';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.error || errorObj.details ||
                      'Failed to get user reports with no additional details';
      }

      ErrorLogger.logError(`Failed to get user reports: ${errorMessage}`, error, {
        context: 'campaignReportingSystem.getUserReports',
        userId,
        additionalData: { campaignId, errorMessage }
      });

      // Instead of silently returning empty array, throw meaningful error
      throw new Error(`Failed to get user reports: ${errorMessage}`);
    }
  }

  /**
   * Export report to CSV format
   */
  exportToCSV(report: CampaignReport): string {
    const headers = [
      'Title',
      'URL',
      'Platform',
      'Published Date',
      'Word Count',
      'Anchor Text',
      'Target URL',
      'Keyword',
      'Status',
      'Clicks',
      'Impressions',
      'CTR %'
    ];

    const rows = report.links.map(link => [
      `"${link.title}"`,
      link.url,
      link.platform,
      link.published_at.split('T')[0], // Date only
      link.word_count.toString(),
      `"${link.anchor_text_used}"`,
      link.target_url,
      `"${link.keyword_used}"`,
      link.status,
      link.clicks?.toString() || '0',
      link.impressions?.toString() || '0',
      link.ctr?.toFixed(2) || '0.00'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Update link performance metrics
   */
  async updateLinkMetrics(
    linkId: string,
    metrics: {
      clicks?: number;
      impressions?: number;
      status?: PublishedLink['status'];
      error_message?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        last_checked: new Date().toISOString(),
        ...metrics
      };

      // Calculate CTR if we have clicks and impressions
      if (metrics.clicks !== undefined && metrics.impressions !== undefined && metrics.impressions > 0) {
        updateData.ctr = (metrics.clicks / metrics.impressions) * 100;
      }

      const { error } = await supabase
        .from('campaign_published_links')
        .update(updateData)
        .eq('id', linkId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to update link metrics:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardAnalytics(userId: string, dateRange?: {
    from: string;
    to: string;
  }): Promise<{
    total_links: number;
    total_campaigns: number;
    success_rate: number;
    total_word_count: number;
    platform_breakdown: Array<{
      platform: string;
      count: number;
      percentage: number;
    }>;
    daily_publications: Array<{
      date: string;
      count: number;
    }>;
    top_performing_links: PublishedLink[];
  }> {
    try {
      // Get user campaigns
      const { data: campaigns, error: campaignError } = await supabase
        .from('automation_campaigns')
        .select('id')
        .eq('user_id', userId);

      if (campaignError) throw campaignError;

      if (!campaigns || campaigns.length === 0) {
        return {
          total_links: 0,
          total_campaigns: 0,
          success_rate: 0,
          total_word_count: 0,
          platform_breakdown: [],
          daily_publications: [],
          top_performing_links: []
        };
      }

      const campaignIds = campaigns.map(c => c.id);

      // Get published links with date filter
      let linksQuery = supabase
        .from('campaign_published_links')
        .select('*')
        .in('campaign_id', campaignIds);

      if (dateRange) {
        linksQuery = linksQuery
          .gte('published_at', dateRange.from)
          .lte('published_at', dateRange.to);
      }

      const { data: links, error: linksError } = await linksQuery;

      if (linksError) throw linksError;

      const allLinks = links || [];

      // Calculate metrics
      const totalLinks = allLinks.length;
      const successfulLinks = allLinks.filter(l => l.status === 'published').length;
      const successRate = totalLinks > 0 ? (successfulLinks / totalLinks) * 100 : 0;
      const totalWordCount = allLinks.reduce((sum, link) => sum + link.word_count, 0);

      // Platform breakdown
      const platformCounts = allLinks.reduce((acc, link) => {
        acc[link.platform] = (acc[link.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const platformBreakdown = Object.entries(platformCounts).map(([platform, count]) => ({
        platform,
        count,
        percentage: totalLinks > 0 ? (count / totalLinks) * 100 : 0
      }));

      // Daily publications
      const dailyCounts = allLinks.reduce((acc, link) => {
        const date = link.published_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dailyPublications = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top performing links (by estimated value)
      const topPerformingLinks = allLinks
        .filter(l => l.status === 'published')
        .sort((a, b) => {
          const scoreA = (a.backlink_value || 0) + (a.clicks || 0) * 0.1;
          const scoreB = (b.backlink_value || 0) + (b.clicks || 0) * 0.1;
          return scoreB - scoreA;
        })
        .slice(0, 10);

      return {
        total_links: totalLinks,
        total_campaigns: campaigns.length,
        success_rate: Math.round(successRate * 100) / 100,
        total_word_count: totalWordCount,
        platform_breakdown: platformBreakdown,
        daily_publications: dailyPublications,
        top_performing_links: topPerformingLinks
      };
    } catch (error) {
      console.error('Failed to get dashboard analytics:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      return {
        total_links: 0,
        total_campaigns: 0,
        success_rate: 0,
        total_word_count: 0,
        platform_breakdown: [],
        daily_publications: [],
        top_performing_links: []
      };
    }
  }

  /**
   * Calculate platform performance metrics
   */
  private calculatePlatformPerformance(links: PublishedLink[]): Array<{
    platform: string;
    link_count: number;
    success_rate: number;
  }> {
    const platformStats = links.reduce((acc, link) => {
      if (!acc[link.platform]) {
        acc[link.platform] = { total: 0, successful: 0 };
      }
      acc[link.platform].total++;
      if (link.status === 'published') {
        acc[link.platform].successful++;
      }
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    return Object.entries(platformStats)
      .map(([platform, stats]) => ({
        platform,
        link_count: stats.total,
        success_rate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.link_count - a.link_count);
  }

  /**
   * Calculate backlink value based on domain authority
   */
  private calculateBacklinkValue(domainAuthority: number): number {
    // Simple formula: DA * 0.5 + base value of 10
    return Math.round((domainAuthority * 0.5 + 10) * 100) / 100;
  }

  /**
   * Estimate traffic potential based on word count
   */
  private estimateTraffic(wordCount: number): number {
    // Simple estimation: longer articles tend to get more traffic
    const baseTraffic = 10;
    const wordCountMultiplier = Math.min(wordCount / 1000, 3); // Cap at 3x for very long articles
    return Math.round((baseTraffic * wordCountMultiplier) * 100) / 100;
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('campaign_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to delete report:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const campaignReportingSystem = new CampaignReportingSystem();
export default campaignReportingSystem;
