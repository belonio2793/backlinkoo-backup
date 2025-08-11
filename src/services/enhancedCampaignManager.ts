import { supabase } from '@/integrations/supabase/client';
import { AutomationDatabaseService } from './automationDatabaseService';
import type {
  AutomationCampaign,
  AutomationCampaignInsert,
  LinkPlacement,
  LinkPlacementInsert
} from '@/types/automationTypes';

export interface RealTimeUrlActivity {
  id: string;
  campaign_id: string;
  url: string;
  action: 'discovered' | 'visited' | 'analyzed' | 'posted' | 'verified' | 'failed';
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  details: {
    domain?: string;
    anchor_text?: string;
    response_time?: number;
    http_status?: number;
    authority_score?: number;
    verification_status?: string;
    error_message?: string;
  };
  metadata: Record<string, any>;
}

export interface DeleteCampaignOptions {
  preserveReports?: boolean;
  preserveMetrics?: boolean;
  archiveLinksOnly?: boolean;
  forceDelete?: boolean;
}

export interface CampaignDeletionResult {
  success: boolean;
  deleted_items: {
    campaign: boolean;
    link_placements: number;
    posted_links: number;
    reports: number;
    metrics: number;
    opportunities: number;
    live_monitoring: number;
    activity_logs: number;
  };
  archived_items?: {
    link_placements: number;
    reports: number;
  };
  error?: string;
}

export interface RealTimeSession {
  id: string;
  campaign_id: string;
  session_start: string;
  session_end?: string;
  status: 'active' | 'completed' | 'failed';
  urls_discovered: number;
  urls_visited: number;
  urls_posted: number;
  urls_verified: number;
  success_rate: number;
  activity_feed: RealTimeUrlActivity[];
}

export class EnhancedCampaignManager {
  private static activeUrlSessions = new Map<string, RealTimeSession>();
  private static urlActivityHandlers = new Map<string, Function[]>();

  // ==================== ENHANCED DELETE FUNCTIONALITY ====================

  static async deleteCampaignWithCleanup(
    campaignId: string,
    userId: string,
    options: DeleteCampaignOptions = {}
  ): Promise<CampaignDeletionResult> {
    const result: CampaignDeletionResult = {
      success: false,
      deleted_items: {
        campaign: false,
        link_placements: 0,
        posted_links: 0,
        reports: 0,
        metrics: 0,
        opportunities: 0,
        live_monitoring: 0,
        activity_logs: 0
      }
    };

    try {
      console.log(`🗑️ Starting enhanced deletion for campaign ${campaignId}`);

      // Stop any active real-time monitoring for this campaign
      await this.stopRealTimeUrlTracking(campaignId);

      // 1. Delete or archive link placements
      if (options.archiveLinksOnly) {
        const archivedCount = await this.archiveLinkPlacements(campaignId, userId);
        result.archived_items = { link_placements: archivedCount, reports: 0 };
      } else {
        result.deleted_items.link_placements = await this.deleteLinkPlacements(campaignId, userId);
      }

      // 2. Delete posted links and live monitoring
      result.deleted_items.posted_links = await this.deletePostedLinks(campaignId);
      result.deleted_items.live_monitoring = await this.deleteLiveMonitoring(campaignId);

      // 3. Delete link opportunities
      result.deleted_items.opportunities = await this.deleteLinkOpportunities(campaignId);

      // 4. Delete or preserve reports
      if (!options.preserveReports) {
        result.deleted_items.reports = await this.deleteCampaignReports(campaignId, userId);
      }

      // 5. Delete or preserve metrics timeseries data
      if (!options.preserveMetrics) {
        result.deleted_items.metrics = await this.deleteCampaignMetrics(campaignId);
      }

      // 6. Delete activity logs
      result.deleted_items.activity_logs = await this.deleteActivityLogs(campaignId);

      // 7. Finally delete the campaign itself
      const campaignResult = await AutomationDatabaseService.deleteCampaign(campaignId, userId);
      result.deleted_items.campaign = campaignResult.success;

      if (!campaignResult.success && !options.forceDelete) {
        throw new Error(campaignResult.error || 'Failed to delete campaign');
      }

      result.success = true;
      console.log(`✅ Campaign ${campaignId} deletion completed successfully`);

      // Clear any cached data
      this.clearCampaignCache(campaignId);

      return result;

    } catch (error: any) {
      console.error('❌ Enhanced campaign deletion failed:', error);
      result.error = error.message;
      return result;
    }
  }

  private static async deleteLinkPlacements(campaignId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('link_placements')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting link placements:', error);
      return 0;
    }

    return count || 0;
  }

  private static async archiveLinkPlacements(campaignId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('link_placements')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString(),
        removal_date: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error archiving link placements:', error);
      return 0;
    }

    return count || 0;
  }

  private static async deletePostedLinks(campaignId: string): Promise<number> {
    const { count, error } = await supabase
      .from('posted_links')
      .delete()
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Error deleting posted links:', error);
      return 0;
    }

    return count || 0;
  }

  private static async deleteLiveMonitoring(campaignId: string): Promise<number> {
    // First get posted link IDs for this campaign
    const { data: postedLinks } = await supabase
      .from('posted_links')
      .select('id')
      .eq('campaign_id', campaignId);

    if (!postedLinks || postedLinks.length === 0) return 0;

    const linkIds = postedLinks.map(link => link.id);

    const { count, error } = await supabase
      .from('live_link_monitoring')
      .delete()
      .in('link_id', linkIds);

    if (error) {
      console.error('Error deleting live monitoring:', error);
      return 0;
    }

    return count || 0;
  }

  private static async deleteLinkOpportunities(campaignId: string): Promise<number> {
    const { count, error } = await supabase
      .from('link_opportunities')
      .delete()
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Error deleting link opportunities:', error);
      return 0;
    }

    return count || 0;
  }

  private static async deleteCampaignReports(campaignId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('campaign_reports')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting campaign reports:', error);
      return 0;
    }

    return count || 0;
  }

  private static async deleteCampaignMetrics(campaignId: string): Promise<number> {
    const { count, error } = await supabase
      .from('campaign_metrics_timeseries')
      .delete()
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Error deleting campaign metrics:', error);
      return 0;
    }

    return count || 0;
  }

  private static async deleteActivityLogs(campaignId: string): Promise<number> {
    const { count, error } = await supabase
      .from('event_stream')
      .delete()
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('Error deleting activity logs:', error);
      return 0;
    }

    return count || 0;
  }

  private static clearCampaignCache(campaignId: string): void {
    // Clear any active sessions
    this.activeUrlSessions.delete(campaignId);
    this.urlActivityHandlers.delete(campaignId);

    // Clear localStorage cache
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`campaign_data_${campaignId}`);
      localStorage.removeItem(`url_session_${campaignId}`);
    }
  }

  // ==================== REAL-TIME URL TRACKING ====================

  static async startRealTimeUrlTracking(campaignId: string): Promise<RealTimeSession> {
    const sessionId = `session_${campaignId}_${Date.now()}`;
    
    const session: RealTimeSession = {
      id: sessionId,
      campaign_id: campaignId,
      session_start: new Date().toISOString(),
      status: 'active',
      urls_discovered: 0,
      urls_visited: 0,
      urls_posted: 0,
      urls_verified: 0,
      success_rate: 0,
      activity_feed: []
    };

    this.activeUrlSessions.set(campaignId, session);

    console.log(`🚀 Started real-time URL tracking for campaign ${campaignId}`);
    return session;
  }

  static async stopRealTimeUrlTracking(campaignId: string): Promise<void> {
    const session = this.activeUrlSessions.get(campaignId);
    if (session) {
      session.session_end = new Date().toISOString();
      session.status = 'completed';
      
      // Calculate final success rate
      const totalAttempts = session.urls_visited + session.urls_posted;
      session.success_rate = totalAttempts > 0 ? 
        ((session.urls_posted + session.urls_verified) / totalAttempts) * 100 : 0;

      console.log(`⏹️ Stopped real-time URL tracking for campaign ${campaignId}`);
    }
  }

  static async recordUrlActivity(
    campaignId: string,
    url: string,
    action: RealTimeUrlActivity['action'],
    status: RealTimeUrlActivity['status'],
    details: RealTimeUrlActivity['details'] = {},
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const activity: RealTimeUrlActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaign_id: campaignId,
      url,
      action,
      status,
      timestamp: new Date().toISOString(),
      details,
      metadata
    };

    // Update active session
    const session = this.activeUrlSessions.get(campaignId);
    if (session) {
      session.activity_feed.push(activity);
      
      // Update counters based on action
      switch (action) {
        case 'discovered':
          session.urls_discovered++;
          break;
        case 'visited':
          session.urls_visited++;
          break;
        case 'posted':
          if (status === 'success') session.urls_posted++;
          break;
        case 'verified':
          if (status === 'success') session.urls_verified++;
          break;
      }

      // Recalculate success rate
      const totalAttempts = session.urls_visited + session.urls_posted;
      session.success_rate = totalAttempts > 0 ? 
        ((session.urls_posted + session.urls_verified) / totalAttempts) * 100 : 0;

      // Keep only last 100 activities to prevent memory issues
      if (session.activity_feed.length > 100) {
        session.activity_feed = session.activity_feed.slice(-100);
      }
    }

    // Store in database for persistence
    await this.persistUrlActivity(activity);

    // Notify handlers
    this.notifyUrlActivityHandlers(campaignId, activity);
  }

  private static async persistUrlActivity(activity: RealTimeUrlActivity): Promise<void> {
    try {
      await supabase
        .from('event_stream')
        .insert({
          event_type: 'url_activity',
          campaign_id: activity.campaign_id,
          user_id: null, // Will be set by RLS
          data: {
            url: activity.url,
            action: activity.action,
            status: activity.status,
            details: activity.details,
            metadata: activity.metadata,
            activity_id: activity.id
          },
          timestamp: activity.timestamp
        });
    } catch (error) {
      console.error('Failed to persist URL activity:', error);
    }
  }

  static async createLinkPlacementWithTracking(
    placementData: LinkPlacementInsert,
    trackingMetadata: Record<string, any> = {}
  ): Promise<{ success: boolean; data?: LinkPlacement; error?: string }> {
    try {
      // Create the link placement
      const result = await AutomationDatabaseService.createLinkPlacement(placementData);

      if (result.success && result.data) {
        // Record URL activity
        await this.recordUrlActivity(
          placementData.campaign_id,
          placementData.source_url,
          'posted',
          'success',
          {
            domain: placementData.source_domain,
            anchor_text: placementData.anchor_text,
            authority_score: placementData.domain_authority
          },
          trackingMetadata
        );

        // Start live monitoring for this link
        await this.startLiveLinkMonitoring(result.data);
      }

      return result;
    } catch (error: any) {
      // Record failed attempt
      await this.recordUrlActivity(
        placementData.campaign_id,
        placementData.source_url,
        'posted',
        'failed',
        {
          error_message: error.message
        },
        trackingMetadata
      );

      return { success: false, error: error.message };
    }
  }

  private static async startLiveLinkMonitoring(linkPlacement: LinkPlacement): Promise<void> {
    try {
      await supabase
        .from('live_link_monitoring')
        .insert({
          link_id: linkPlacement.id,
          domain: linkPlacement.source_domain,
          status: 'pending',
          authority_score: linkPlacement.domain_authority,
          last_checked: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to start live link monitoring:', error);
    }
  }

  // ==================== EVENT HANDLING ====================

  static addUrlActivityHandler(campaignId: string, handler: (activity: RealTimeUrlActivity) => void): void {
    if (!this.urlActivityHandlers.has(campaignId)) {
      this.urlActivityHandlers.set(campaignId, []);
    }
    this.urlActivityHandlers.get(campaignId)!.push(handler);
  }

  static removeUrlActivityHandler(campaignId: string, handler: Function): void {
    const handlers = this.urlActivityHandlers.get(campaignId);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private static notifyUrlActivityHandlers(campaignId: string, activity: RealTimeUrlActivity): void {
    const handlers = this.urlActivityHandlers.get(campaignId);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(activity);
        } catch (error) {
          console.error('URL activity handler error:', error);
        }
      });
    }
  }

  // ==================== DATA FETCHING ====================

  static getRealTimeSession(campaignId: string): RealTimeSession | null {
    return this.activeUrlSessions.get(campaignId) || null;
  }

  static async getRecentUrlActivity(
    campaignId: string,
    limit: number = 50
  ): Promise<RealTimeUrlActivity[]> {
    try {
      const { data, error } = await supabase
        .from('event_stream')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'url_activity')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch URL activity:', error);
        return [];
      }

      return data?.map(event => ({
        id: event.data.activity_id || event.id,
        campaign_id: campaignId,
        url: event.data.url,
        action: event.data.action,
        status: event.data.status,
        timestamp: event.timestamp,
        details: event.data.details || {},
        metadata: event.data.metadata || {}
      })) || [];
    } catch (error) {
      console.error('Error fetching URL activity:', error);
      return [];
    }
  }

  static async getLiveUrlStatistics(campaignId: string): Promise<{
    total_discovered: number;
    total_visited: number;
    total_posted: number;
    total_verified: number;
    success_rate: number;
    live_links: number;
    failed_links: number;
  }> {
    try {
      const session = this.activeUrlSessions.get(campaignId);
      
      if (session) {
        return {
          total_discovered: session.urls_discovered,
          total_visited: session.urls_visited,
          total_posted: session.urls_posted,
          total_verified: session.urls_verified,
          success_rate: session.success_rate,
          live_links: session.urls_verified,
          failed_links: session.urls_visited - session.urls_posted
        };
      }

      // Fallback to database query
      const { data: activities } = await supabase
        .from('event_stream')
        .select('data')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'url_activity');

      const stats = {
        total_discovered: 0,
        total_visited: 0,
        total_posted: 0,
        total_verified: 0,
        success_rate: 0,
        live_links: 0,
        failed_links: 0
      };

      activities?.forEach(event => {
        const { action, status } = event.data;
        switch (action) {
          case 'discovered':
            stats.total_discovered++;
            break;
          case 'visited':
            stats.total_visited++;
            break;
          case 'posted':
            if (status === 'success') stats.total_posted++;
            break;
          case 'verified':
            if (status === 'success') stats.total_verified++;
            break;
        }
      });

      stats.live_links = stats.total_verified;
      stats.failed_links = stats.total_visited - stats.total_posted;
      const totalAttempts = stats.total_visited + stats.total_posted;
      stats.success_rate = totalAttempts > 0 ? 
        ((stats.total_posted + stats.total_verified) / totalAttempts) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting live URL statistics:', error);
      return {
        total_discovered: 0,
        total_visited: 0,
        total_posted: 0,
        total_verified: 0,
        success_rate: 0,
        live_links: 0,
        failed_links: 0
      };
    }
  }
}
