/**
 * URL Data Siphoning Service
 * 
 * This service captures URL processing activities and feeds them into
 * the reporting system for analytics and tracking purposes.
 */

export interface SiphonedUrlData {
  id: string;
  timestamp: string;
  campaign_id: string;
  url: string;
  action: 'discovered' | 'visited' | 'analyzed' | 'posted' | 'verified';
  success: boolean;
  metadata: {
    domain: string;
    response_time?: number;
    status_code?: number;
    domain_authority?: number;
    placement_type?: string;
    anchor_text?: string;
    target_url?: string;
    error_message?: string;
  };
}

export interface UrlProcessingStats {
  total_urls_processed: number;
  urls_discovered: number;
  urls_visited: number;
  successful_placements: number;
  failed_attempts: number;
  average_response_time: number;
  top_domains: Array<{ domain: string; count: number; success_rate: number }>;
  placement_types: Array<{ type: string; count: number; success_rate: number }>;
  hourly_activity: Array<{ hour: number; activity_count: number }>;
  daily_summary: {
    date: string;
    urls_processed: number;
    success_rate: number;
    top_performing_domain: string;
  };
}

class UrlDataSiphonService {
  private siphonedData: SiphonedUrlData[] = [];
  private listeners: Set<(data: SiphonedUrlData) => void> = new Set();
  private statsListeners: Set<(stats: UrlProcessingStats) => void> = new Set();
  private maxDataRetention = 1000; // Keep last 1000 entries

  /**
   * Siphon URL data from real-time activities
   */
  siphonUrlData(data: SiphonedUrlData): void {
    // Add to internal storage
    this.siphonedData.unshift(data);
    
    // Maintain data retention limit
    if (this.siphonedData.length > this.maxDataRetention) {
      this.siphonedData = this.siphonedData.slice(0, this.maxDataRetention);
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in siphon listener:', error);
      }
    });

    // Update stats and notify stats listeners
    const stats = this.generateStats();
    this.statsListeners.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error in stats listener:', error);
      }
    });

    // Log for debugging
    console.log(`🔍 URL SIPHONED: ${data.action} - ${data.url} - ${data.success ? 'SUCCESS' : 'FAILED'}`);
  }

  /**
   * Subscribe to siphoned URL data
   */
  subscribe(listener: (data: SiphonedUrlData) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to processing stats updates
   */
  subscribeToStats(listener: (stats: UrlProcessingStats) => void): () => void {
    this.statsListeners.add(listener);
    return () => {
      this.statsListeners.delete(listener);
    };
  }

  /**
   * Get all siphoned data
   */
  getAllSiphonedData(): SiphonedUrlData[] {
    return [...this.siphonedData];
  }

  /**
   * Get siphoned data filtered by criteria
   */
  getFilteredData(filters: {
    action?: string;
    success?: boolean;
    campaign_id?: string;
    domain?: string;
    timeRange?: { start: Date; end: Date };
  }): SiphonedUrlData[] {
    return this.siphonedData.filter(item => {
      if (filters.action && item.action !== filters.action) return false;
      if (filters.success !== undefined && item.success !== filters.success) return false;
      if (filters.campaign_id && item.campaign_id !== filters.campaign_id) return false;
      if (filters.domain && item.metadata.domain !== filters.domain) return false;
      if (filters.timeRange) {
        const itemTime = new Date(item.timestamp);
        if (itemTime < filters.timeRange.start || itemTime > filters.timeRange.end) return false;
      }
      return true;
    });
  }

  /**
   * Generate comprehensive processing statistics
   */
  generateStats(): UrlProcessingStats {
    if (this.siphonedData.length === 0) {
      return this.getEmptyStats();
    }

    const data = this.siphonedData;
    
    // Basic counts
    const totalProcessed = data.length;
    const discovered = data.filter(d => d.action === 'discovered').length;
    const visited = data.filter(d => d.action === 'visited').length;
    const successful = data.filter(d => d.success && d.action === 'posted').length;
    const failed = data.filter(d => !d.success).length;

    // Response times
    const responseTimes = data
      .filter(d => d.metadata.response_time)
      .map(d => d.metadata.response_time!);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Domain analysis
    const domainMap = new Map<string, { count: number; successes: number }>();
    data.forEach(item => {
      const domain = item.metadata.domain;
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { count: 0, successes: 0 });
      }
      const domainData = domainMap.get(domain)!;
      domainData.count++;
      if (item.success) domainData.successes++;
    });

    const topDomains = Array.from(domainMap.entries())
      .map(([domain, { count, successes }]) => ({
        domain,
        count,
        success_rate: count > 0 ? (successes / count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Placement type analysis
    const placementMap = new Map<string, { count: number; successes: number }>();
    data.filter(d => d.metadata.placement_type).forEach(item => {
      const type = item.metadata.placement_type!;
      if (!placementMap.has(type)) {
        placementMap.set(type, { count: 0, successes: 0 });
      }
      const typeData = placementMap.get(type)!;
      typeData.count++;
      if (item.success) typeData.successes++;
    });

    const placementTypes = Array.from(placementMap.entries())
      .map(([type, { count, successes }]) => ({
        type,
        count,
        success_rate: count > 0 ? (successes / count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Hourly activity (last 24 hours)
    const hourlyMap = new Map<number, number>();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    data.filter(d => new Date(d.timestamp) >= dayAgo).forEach(item => {
      const hour = new Date(item.timestamp).getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    });

    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activity_count: hourlyMap.get(hour) || 0
    }));

    // Daily summary
    const today = new Date().toDateString();
    const todayData = data.filter(d => new Date(d.timestamp).toDateString() === today);
    const todaySuccessRate = todayData.length > 0 
      ? (todayData.filter(d => d.success).length / todayData.length) * 100 
      : 0;

    const topPerformingDomain = topDomains[0]?.domain || 'None';

    return {
      total_urls_processed: totalProcessed,
      urls_discovered: discovered,
      urls_visited: visited,
      successful_placements: successful,
      failed_attempts: failed,
      average_response_time: Math.round(avgResponseTime),
      top_domains: topDomains,
      placement_types: placementTypes,
      hourly_activity: hourlyActivity,
      daily_summary: {
        date: today,
        urls_processed: todayData.length,
        success_rate: Math.round(todaySuccessRate),
        top_performing_domain: topPerformingDomain
      }
    };
  }

  /**
   * Export siphoned data for reporting
   */
  exportForReporting(format: 'csv' | 'json' | 'excel' = 'json'): string {
    const data = this.siphonedData;
    const stats = this.generateStats();

    switch (format) {
      case 'csv':
        return this.exportCSV(data, stats);
      case 'excel':
        return this.exportExcel(data, stats);
      default:
        return JSON.stringify({
          metadata: {
            export_date: new Date().toISOString(),
            total_records: data.length,
            format: 'json'
          },
          statistics: stats,
          raw_data: data
        }, null, 2);
    }
  }

  /**
   * Clear all siphoned data
   */
  clearData(): void {
    this.siphonedData = [];
    console.log('🧹 Siphoned data cleared');
  }

  /**
   * Get URLs that need to be added to reporting
   */
  getUrlsForReporting(): Array<{
    url: string;
    target_url?: string;
    status: 'success' | 'failed' | 'pending';
    placement_date: string;
    domain: string;
    anchor_text?: string;
  }> {
    return this.siphonedData
      .filter(d => d.action === 'posted' || d.action === 'verified')
      .map(d => ({
        url: d.url,
        target_url: d.metadata.target_url,
        status: d.success ? 'success' : 'failed',
        placement_date: d.timestamp,
        domain: d.metadata.domain,
        anchor_text: d.metadata.anchor_text
      }));
  }

  private getEmptyStats(): UrlProcessingStats {
    return {
      total_urls_processed: 0,
      urls_discovered: 0,
      urls_visited: 0,
      successful_placements: 0,
      failed_attempts: 0,
      average_response_time: 0,
      top_domains: [],
      placement_types: [],
      hourly_activity: Array.from({ length: 24 }, (_, hour) => ({ hour, activity_count: 0 })),
      daily_summary: {
        date: new Date().toDateString(),
        urls_processed: 0,
        success_rate: 0,
        top_performing_domain: 'None'
      }
    };
  }

  private exportCSV(data: SiphonedUrlData[], stats: UrlProcessingStats): string {
    const headers = [
      'Timestamp', 'Campaign ID', 'Action', 'URL', 'Domain', 'Success', 
      'Response Time', 'Domain Authority', 'Placement Type', 'Anchor Text', 'Target URL'
    ];

    const rows = data.map(item => [
      item.timestamp,
      item.campaign_id,
      item.action,
      item.url,
      item.metadata.domain,
      item.success ? 'Yes' : 'No',
      item.metadata.response_time || '',
      item.metadata.domain_authority || '',
      item.metadata.placement_type || '',
      item.metadata.anchor_text || '',
      item.metadata.target_url || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '--- STATISTICS ---',
      `Total URLs Processed,${stats.total_urls_processed}`,
      `URLs Discovered,${stats.urls_discovered}`,
      `URLs Visited,${stats.urls_visited}`,
      `Successful Placements,${stats.successful_placements}`,
      `Failed Attempts,${stats.failed_attempts}`,
      `Average Response Time,${stats.average_response_time}ms`,
      `Export Date,${new Date().toISOString()}`
    ].join('\n');

    return csvContent;
  }

  private exportExcel(data: SiphonedUrlData[], stats: UrlProcessingStats): string {
    // Simplified Excel format (tab-separated values)
    const content = [
      'URL PROCESSING ANALYTICS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'SUMMARY STATISTICS',
      `Total URLs Processed\t${stats.total_urls_processed}`,
      `Successful Placements\t${stats.successful_placements}`,
      `Success Rate\t${stats.total_urls_processed > 0 ? ((stats.successful_placements / stats.total_urls_processed) * 100).toFixed(1) : 0}%`,
      `Average Response Time\t${stats.average_response_time}ms`,
      '',
      'TOP PERFORMING DOMAINS',
      'Domain\tCount\tSuccess Rate',
      ...stats.top_domains.slice(0, 5).map(d => `${d.domain}\t${d.count}\t${d.success_rate.toFixed(1)}%`),
      '',
      'DETAILED URL DATA',
      'Timestamp\tAction\tURL\tDomain\tSuccess\tResponse Time',
      ...data.slice(0, 100).map(item => 
        `${item.timestamp}\t${item.action}\t${item.url}\t${item.metadata.domain}\t${item.success ? 'Yes' : 'No'}\t${item.metadata.response_time || 'N/A'}`
      )
    ].join('\n');

    return content;
  }
}

// Export singleton instance
export const urlDataSiphon = new UrlDataSiphonService();
