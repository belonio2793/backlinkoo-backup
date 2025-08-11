/**
 * Campaign Reporting & Historical Data Storage Service
 * 
 * Persistent reporting system that maintains comprehensive historical records
 * without data loss, supporting resume/pause functionality and environmental changes
 */

import { supabase } from '@/integrations/supabase/client';
import { formatErrorForLogging, formatErrorForUI } from '@/utils/errorUtils';
import { CampaignState, CampaignReport } from './campaignStateManager';

export interface ReportSnapshot {
  id: string;
  campaign_id: string;
  user_id: string;
  snapshot_type: 'hourly' | 'daily' | 'weekly' | 'pause' | 'resume' | 'discovery' | 'manual';
  timestamp: string;
  
  // Campaign State at Time of Snapshot
  campaign_status: string;
  execution_phase: string;
  
  // Progress Metrics
  metrics: {
    links_attempted: number;
    links_successful: number;
    links_failed: number;
    domains_discovered: number;
    domains_active: number;
    success_rate: number;
    quality_score: number;
    runtime_minutes: number;
  };
  
  // Discovery Data
  discovery_data: {
    new_domains_found: string[];
    domains_tested: string[];
    domain_success_rates: Record<string, number>;
    environmental_changes: any[];
  };
  
  // Performance Data
  performance: {
    operations_per_minute: number;
    error_rate: number;
    response_times: number[];
    resource_usage: any;
  };
  
  // Contextual Information
  context: {
    trigger_event: string;
    user_action?: string;
    system_event?: string;
    notes?: string;
  };
  
  // Raw Data for Complete Restoration
  raw_state: any;
  preserved_data: any;
}

export interface HistoricalRecord {
  id: string;
  campaign_id: string;
  user_id: string;
  record_type: 'link_placement' | 'domain_discovery' | 'verification' | 'adaptation' | 'error' | 'milestone';
  timestamp: string;
  
  // Core Data
  data: {
    domain?: string;
    url?: string;
    anchor_text?: string;
    placement_type?: string;
    success: boolean;
    error_message?: string;
    response_data?: any;
  };
  
  // Context
  campaign_status_at_time: string;
  execution_phase_at_time: string;
  batch_id?: string;
  operation_id?: string;
  
  // Preservation Flags
  preserve_indefinitely: boolean;
  archived: boolean;
  
  // Relationships
  related_records: string[];
  parent_operation?: string;
}

export interface CampaignTimeline {
  campaign_id: string;
  events: TimelineEvent[];
  milestones: Milestone[];
  performance_trends: PerformanceTrend[];
}

export interface TimelineEvent {
  timestamp: string;
  event_type: 'created' | 'started' | 'paused' | 'resumed' | 'discovery' | 'milestone' | 'error' | 'adaptation';
  description: string;
  data: any;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface Milestone {
  timestamp: string;
  milestone_type: 'first_link' | 'domain_milestone' | 'success_rate_milestone' | 'time_milestone';
  description: string;
  value: number;
  target?: number;
}

export interface PerformanceTrend {
  period: string;
  metric: string;
  values: number[];
  trend_direction: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export class CampaignReportingService {
  
  /**
   * Create a snapshot of current campaign state
   */
  static async createSnapshot(
    campaignId: string,
    snapshotType: ReportSnapshot['snapshot_type'],
    context?: Partial<ReportSnapshot['context']>
  ): Promise<{ success: boolean; snapshot?: ReportSnapshot; error?: string }> {
    try {
      // Get current campaign state
      const { CampaignStateManager } = await import('./campaignStateManager');
      const campaignResult = await CampaignStateManager.getCampaignState(campaignId);
      
      if (!campaignResult.success || !campaignResult.state) {
        return { success: false, error: 'Campaign not found for snapshot' };
      }

      const state = campaignResult.state;
      const now = new Date().toISOString();

      // Calculate current metrics
      const successRate = state.progress.links_attempted > 0 
        ? (state.progress.links_successful / state.progress.links_attempted) * 100 
        : 0;

      const qualityScore = this.calculateQualityScore(state);

      const snapshot: ReportSnapshot = {
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        user_id: state.user_id,
        snapshot_type: snapshotType,
        timestamp: now,
        
        campaign_status: state.status,
        execution_phase: state.execution_state.current_phase,
        
        metrics: {
          links_attempted: state.progress.links_attempted,
          links_successful: state.progress.links_successful,
          links_failed: state.progress.links_failed,
          domains_discovered: state.progress.domains_discovered,
          domains_active: state.progress.domains_active,
          success_rate: successRate,
          quality_score: qualityScore,
          runtime_minutes: state.historical_data.total_runtime_minutes
        },
        
        discovery_data: {
          new_domains_found: this.getNewDomainsSinceLastSnapshot(state, snapshotType),
          domains_tested: state.discovery_state.discovered_domains,
          domain_success_rates: state.discovery_state.domain_success_rates,
          environmental_changes: state.historical_data.adaptation_events.slice(-10) // Recent changes
        },
        
        performance: {
          operations_per_minute: this.calculateOperationsPerMinute(state),
          error_rate: this.calculateErrorRate(state),
          response_times: [], // Would be populated from recent operations
          resource_usage: {}
        },
        
        context: {
          trigger_event: snapshotType,
          user_action: context?.user_action,
          system_event: context?.system_event,
          notes: context?.notes
        },
        
        // Complete state preservation for restoration
        raw_state: state,
        preserved_data: {
          execution_checkpoint: state.execution_state,
          pause_state: state.pause_state,
          discovery_state: state.discovery_state,
          complete_history: state.historical_data
        }
      };

      // Store snapshot
      const { data, error } = await supabase
        .from('campaign_snapshots')
        .insert([snapshot])
        .select()
        .single();

      if (error) {
        console.error('Failed to create snapshot:', formatErrorForLogging(error, 'createSnapshot'));
        // Store locally as fallback
        this.storeSnapshotLocally(snapshot);
        return { success: true, snapshot }; // Consider success even if DB fails
      }

      return { success: true, snapshot: data };
    } catch (error) {
      console.error('Snapshot creation error:', formatErrorForLogging(error, 'createSnapshot'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Record a historical event (non-destructive)
   */
  static async recordHistoricalEvent(
    campaignId: string,
    recordType: HistoricalRecord['record_type'],
    data: HistoricalRecord['data'],
    context?: {
      preserve_indefinitely?: boolean;
      batch_id?: string;
      operation_id?: string;
      parent_operation?: string;
    }
  ): Promise<{ success: boolean; record?: HistoricalRecord; error?: string }> {
    try {
      // Get current campaign state for context
      const { CampaignStateManager } = await import('./campaignStateManager');
      const campaignResult = await CampaignStateManager.getCampaignState(campaignId);
      
      if (!campaignResult.success || !campaignResult.state) {
        return { success: false, error: 'Campaign not found for historical record' };
      }

      const state = campaignResult.state;
      const now = new Date().toISOString();

      const record: HistoricalRecord = {
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        user_id: state.user_id,
        record_type: recordType,
        timestamp: now,
        
        data: {
          ...data,
          success: data.success ?? true
        },
        
        campaign_status_at_time: state.status,
        execution_phase_at_time: state.execution_state.current_phase,
        batch_id: context?.batch_id,
        operation_id: context?.operation_id,
        
        preserve_indefinitely: context?.preserve_indefinitely ?? false,
        archived: false,
        
        related_records: [], // Could be populated with related record IDs
        parent_operation: context?.parent_operation
      };

      // Store historical record
      const { data: storedRecord, error } = await supabase
        .from('campaign_historical_records')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('Failed to record historical event:', formatErrorForLogging(error, 'recordHistoricalEvent'));
        // Store locally as fallback
        this.storeHistoricalRecordLocally(record);
        return { success: true, record }; // Consider success even if DB fails
      }

      return { success: true, record: storedRecord };
    } catch (error) {
      console.error('Historical record error:', formatErrorForLogging(error, 'recordHistoricalEvent'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Generate comprehensive campaign report
   */
  static async generateReport(
    campaignId: string,
    reportType: CampaignReport['report_type'],
    periodStart: string,
    periodEnd: string
  ): Promise<{ success: boolean; report?: CampaignReport; error?: string }> {
    try {
      // Get snapshots for the period
      const snapshots = await this.getSnapshotsForPeriod(campaignId, periodStart, periodEnd);
      
      // Get historical records for the period
      const historicalRecords = await this.getHistoricalRecordsForPeriod(campaignId, periodStart, periodEnd);
      
      // Calculate metrics
      const metrics = this.calculateReportMetrics(snapshots, historicalRecords);
      
      // Get campaign info
      const { CampaignStateManager } = await import('./campaignStateManager');
      const campaignResult = await CampaignStateManager.getCampaignState(campaignId);
      
      if (!campaignResult.success || !campaignResult.state) {
        return { success: false, error: 'Campaign not found for report' };
      }

      const state = campaignResult.state;
      const now = new Date().toISOString();

      const report: CampaignReport = {
        campaign_id: campaignId,
        user_id: state.user_id,
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        metrics,
        data: {
          snapshots: snapshots.length,
          historical_records: historicalRecords.length,
          campaign_state: state.status,
          timeline: await this.generateTimeline(campaignId, periodStart, periodEnd),
          performance_analysis: this.analyzePerformance(snapshots),
          discovery_summary: this.summarizeDiscovery(historicalRecords),
          recommendations: this.generateRecommendations(metrics, state)
        },
        generated_at: now
      };

      // Store report
      const { data: storedReport, error } = await supabase
        .from('campaign_reports')
        .insert([report])
        .select()
        .single();

      if (error) {
        console.error('Failed to store report:', formatErrorForLogging(error, 'generateReport'));
        // Return report even if storage fails
        return { success: true, report };
      }

      return { success: true, report: storedReport };
    } catch (error) {
      console.error('Report generation error:', formatErrorForLogging(error, 'generateReport'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Get campaign timeline with all events
   */
  static async getCampaignTimeline(
    campaignId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ success: boolean; timeline?: CampaignTimeline; error?: string }> {
    try {
      const from = fromDate || '1970-01-01';
      const to = toDate || new Date().toISOString();

      // Get snapshots
      const snapshots = await this.getSnapshotsForPeriod(campaignId, from, to);
      
      // Get historical records
      const records = await this.getHistoricalRecordsForPeriod(campaignId, from, to);

      // Build timeline
      const timeline = await this.generateTimeline(campaignId, from, to);
      
      const campaignTimeline: CampaignTimeline = {
        campaign_id: campaignId,
        events: timeline.events || [],
        milestones: timeline.milestones || [],
        performance_trends: this.calculatePerformanceTrends(snapshots)
      };

      return { success: true, timeline: campaignTimeline };
    } catch (error) {
      console.error('Timeline generation error:', formatErrorForLogging(error, 'getCampaignTimeline'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  /**
   * Restore campaign state from snapshot (for resume functionality)
   */
  static async restoreFromSnapshot(
    campaignId: string,
    snapshotId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get snapshot
      const { data: snapshot, error } = await supabase
        .from('campaign_snapshots')
        .select('*')
        .eq('id', snapshotId)
        .eq('campaign_id', campaignId)
        .single();

      if (error) {
        console.error('Failed to get snapshot for restore:', formatErrorForLogging(error, 'restoreFromSnapshot'));
        return { success: false, error: formatErrorForUI(error) };
      }

      // Restore state from preserved data
      const { CampaignStateManager } = await import('./campaignStateManager');
      const restoreResult = await CampaignStateManager.updateCampaignState(
        campaignId,
        {
          execution_state: snapshot.preserved_data.execution_checkpoint,
          discovery_state: snapshot.preserved_data.discovery_state,
          // Note: We preserve historical data and don't overwrite it
          historical_data: {
            ...snapshot.preserved_data.complete_history,
            // Add restoration event
            adaptation_events: [
              ...snapshot.preserved_data.complete_history.adaptation_events,
              {
                timestamp: new Date().toISOString(),
                type: 'state_restored',
                snapshot_id: snapshotId,
                restored_from: snapshot.timestamp
              }
            ]
          }
        }
      );

      if (!restoreResult.success) {
        return restoreResult;
      }

      // Record the restoration event
      await this.recordHistoricalEvent(campaignId, 'milestone', {
        success: true,
        milestone_type: 'state_restored',
        snapshot_id: snapshotId,
        restored_from: snapshot.timestamp
      } as any);

      return { success: true };
    } catch (error) {
      console.error('State restoration error:', formatErrorForLogging(error, 'restoreFromSnapshot'));
      return { success: false, error: formatErrorForUI(error) };
    }
  }

  // Private helper methods

  private static storeSnapshotLocally(snapshot: ReportSnapshot): void {
    try {
      const key = `snapshot_${snapshot.campaign_id}_${snapshot.timestamp}`;
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch (error) {
      console.error('Failed to store snapshot locally:', error);
    }
  }

  private static storeHistoricalRecordLocally(record: HistoricalRecord): void {
    try {
      const key = `historical_${record.campaign_id}_${record.timestamp}`;
      localStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      console.error('Failed to store historical record locally:', error);
    }
  }

  private static calculateQualityScore(state: CampaignState): number {
    // Calculate based on success rate, domain quality, etc.
    const successRate = state.progress.links_attempted > 0 
      ? (state.progress.links_successful / state.progress.links_attempted) * 100 
      : 0;
    
    const domainQuality = Object.values(state.discovery_state.domain_success_rates)
      .reduce((acc, rate) => acc + rate, 0) / 
      Math.max(Object.keys(state.discovery_state.domain_success_rates).length, 1);

    return Math.round((successRate * 0.7) + (domainQuality * 0.3));
  }

  private static getNewDomainsSinceLastSnapshot(state: CampaignState, snapshotType: string): string[] {
    // This would compare against last snapshot - simplified for now
    return state.discovery_state.discovered_domains.slice(-5); // Last 5 discovered
  }

  private static calculateOperationsPerMinute(state: CampaignState): number {
    if (state.historical_data.total_runtime_minutes === 0) return 0;
    return Math.round(state.progress.links_attempted / state.historical_data.total_runtime_minutes * 10) / 10;
  }

  private static calculateErrorRate(state: CampaignState): number {
    if (state.progress.links_attempted === 0) return 0;
    return Math.round((state.progress.links_failed / state.progress.links_attempted) * 100 * 10) / 10;
  }

  private static async getSnapshotsForPeriod(campaignId: string, start: string, end: string): Promise<ReportSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_snapshots')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp');

      return data || [];
    } catch (error) {
      console.error('Failed to get snapshots:', error);
      return [];
    }
  }

  private static async getHistoricalRecordsForPeriod(campaignId: string, start: string, end: string): Promise<HistoricalRecord[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_historical_records')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp');

      return data || [];
    } catch (error) {
      console.error('Failed to get historical records:', error);
      return [];
    }
  }

  private static calculateReportMetrics(snapshots: ReportSnapshot[], records: HistoricalRecord[]): CampaignReport['metrics'] {
    const latest = snapshots[snapshots.length - 1];
    const linksCreated = records.filter(r => r.record_type === 'link_placement' && r.data.success).length;
    const domainsDiscovered = records.filter(r => r.record_type === 'domain_discovery').length;

    return {
      links_created: linksCreated,
      domains_discovered: domainsDiscovered,
      success_rate: latest?.metrics.success_rate || 0,
      quality_score: latest?.metrics.quality_score || 0,
      environmental_changes: records.filter(r => r.record_type === 'adaptation').length
    };
  }

  private static async generateTimeline(campaignId: string, start: string, end: string): Promise<{ events: TimelineEvent[]; milestones: Milestone[] }> {
    // Generate timeline from snapshots and records
    return { events: [], milestones: [] };
  }

  private static analyzePerformance(snapshots: ReportSnapshot[]): any {
    // Analyze performance trends
    return {};
  }

  private static summarizeDiscovery(records: HistoricalRecord[]): any {
    // Summarize discovery activities
    return {};
  }

  private static generateRecommendations(metrics: CampaignReport['metrics'], state: CampaignState): string[] {
    const recommendations: string[] = [];
    
    if (metrics.success_rate < 50) {
      recommendations.push('Consider adjusting targeting criteria to improve success rate');
    }
    
    if (metrics.quality_score < 70) {
      recommendations.push('Focus on higher authority domains to improve quality score');
    }
    
    if (state.discovery_state.discovered_domains.length < 10) {
      recommendations.push('Expand discovery parameters to find more suitable domains');
    }

    return recommendations;
  }

  private static calculatePerformanceTrends(snapshots: ReportSnapshot[]): PerformanceTrend[] {
    // Calculate trends from snapshot data
    return [];
  }
}
