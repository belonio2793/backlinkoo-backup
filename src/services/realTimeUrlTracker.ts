import { supabase } from '@/integrations/supabase/client';
import { EnhancedCampaignManager } from './enhancedCampaignManager';

export interface UrlDiscoveryEvent {
  id: string;
  campaign_id: string;
  url: string;
  domain: string;
  discovery_method: 'crawling' | 'api' | 'manual' | 'referral' | 'social_media';
  relevance_score: number;
  authority_score: number;
  spam_score: number;
  content_type: string;
  language: string;
  country: string;
  discovered_at: string;
  metadata: {
    source_page?: string;
    keywords_matched?: string[];
    difficulty_estimate?: number;
    estimated_cost?: number;
    competitor_links?: number;
    traffic_estimate?: number;
  };
}

export interface UrlProcessingEvent {
  id: string;
  campaign_id: string;
  opportunity_id: string;
  url: string;
  action: 'visiting' | 'analyzing' | 'content_generation' | 'posting' | 'verification';
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'retrying';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  details: {
    http_status?: number;
    response_time?: number;
    content_length?: number;
    error_message?: string;
    retry_count?: number;
    success_indicators?: string[];
  };
  result_data?: {
    anchor_text?: string;
    content_snippet?: string;
    placement_url?: string;
    verification_status?: string;
  };
}

export interface LiveUrlStats {
  campaign_id: string;
  session_id: string;
  timestamp: string;
  stats: {
    urls_discovered_total: number;
    urls_discovered_today: number;
    urls_visited_total: number;
    urls_visited_today: number;
    urls_posted_total: number;
    urls_posted_today: number;
    urls_verified_total: number;
    urls_verified_today: number;
    success_rate_total: number;
    success_rate_today: number;
    average_response_time: number;
    active_processing_count: number;
  };
}

export interface UrlActivityStream {
  id: string;
  campaign_id: string;
  event_type: 'discovery' | 'processing' | 'posting' | 'verification' | 'error';
  timestamp: string;
  url: string;
  domain: string;
  action: string;
  status: string;
  message: string;
  data: Record<string, any>;
}

export class RealTimeUrlTracker {
  private static eventSubscriptions = new Map<string, any>();
  private static activityBuffers = new Map<string, UrlActivityStream[]>();
  private static statsCache = new Map<string, LiveUrlStats>();
  private static processingQueue = new Map<string, UrlProcessingEvent[]>();

  // ==================== URL DISCOVERY TRACKING ====================

  static async recordUrlDiscovery(
    campaignId: string,
    urls: {
      url: string;
      domain: string;
      discoveryMethod: UrlDiscoveryEvent['discovery_method'];
      relevanceScore: number;
      authorityScore: number;
      metadata?: UrlDiscoveryEvent['metadata'];
    }[]
  ): Promise<UrlDiscoveryEvent[]> {
    const discoveryEvents: UrlDiscoveryEvent[] = [];
    const timestamp = new Date().toISOString();

    try {
      for (const urlData of urls) {
        const discoveryEvent: UrlDiscoveryEvent = {
          id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          campaign_id: campaignId,
          url: urlData.url,
          domain: urlData.domain,
          discovery_method: urlData.discoveryMethod,
          relevance_score: urlData.relevanceScore,
          authority_score: urlData.authorityScore,
          spam_score: Math.max(0, 100 - urlData.authorityScore), // Simple spam score calculation
          content_type: 'webpage', // Default, could be detected
          language: 'en', // Default, could be detected
          country: 'US', // Default, could be detected from domain
          discovered_at: timestamp,
          metadata: urlData.metadata || {}
        };

        discoveryEvents.push(discoveryEvent);

        // Store in link_opportunities table
        await supabase
          .from('link_opportunities')
          .insert({
            campaign_id: campaignId,
            url: urlData.url,
            type: 'discovered',
            discovery_method: urlData.discoveryMethod,
            authority: urlData.authorityScore,
            spam_score: discoveryEvent.spam_score,
            relevance_score: urlData.relevanceScore,
            status: 'discovered',
            metadata: urlData.metadata,
            discovered_at: timestamp
          });

        // Record in activity stream
        await this.recordActivityEvent(campaignId, {
          event_type: 'discovery',
          url: urlData.url,
          domain: urlData.domain,
          action: 'discovered',
          status: 'completed',
          message: `New ${urlData.discoveryMethod} opportunity with ${urlData.authorityScore} authority`,
          data: {
            discovery_method: urlData.discoveryMethod,
            relevance_score: urlData.relevanceScore,
            authority_score: urlData.authorityScore,
            metadata: urlData.metadata
          }
        });

        // Update enhanced campaign manager
        await EnhancedCampaignManager.recordUrlActivity(
          campaignId,
          urlData.url,
          'discovered',
          'success',
          {
            domain: urlData.domain,
            authority_score: urlData.authorityScore
          },
          urlData.metadata || {}
        );
      }

      console.log(`📊 Recorded ${discoveryEvents.length} URL discoveries for campaign ${campaignId}`);
      await this.updateLiveStats(campaignId);

      return discoveryEvents;
    } catch (error) {
      console.error('Error recording URL discovery:', error);
      return [];
    }
  }

  // ==================== URL PROCESSING TRACKING ====================

  static async startUrlProcessing(
    campaignId: string,
    opportunityId: string,
    url: string,
    action: UrlProcessingEvent['action']
  ): Promise<UrlProcessingEvent> {
    const processingEvent: UrlProcessingEvent = {
      id: `processing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaign_id: campaignId,
      opportunity_id: opportunityId,
      url,
      action,
      status: 'started',
      started_at: new Date().toISOString(),
      details: {}
    };

    // Add to processing queue
    if (!this.processingQueue.has(campaignId)) {
      this.processingQueue.set(campaignId, []);
    }
    this.processingQueue.get(campaignId)!.push(processingEvent);

    // Record activity
    await this.recordActivityEvent(campaignId, {
      event_type: 'processing',
      url,
      domain: new URL(url).hostname,
      action,
      status: 'started',
      message: `Started ${action} for ${url}`,
      data: { processing_id: processingEvent.id, opportunity_id: opportunityId }
    });

    // Update enhanced campaign manager
    await EnhancedCampaignManager.recordUrlActivity(
      campaignId,
      url,
      action,
      'pending',
      {},
      { processing_id: processingEvent.id }
    );

    console.log(`🔄 Started ${action} for ${url} in campaign ${campaignId}`);
    return processingEvent;
  }

  static async updateUrlProcessing(
    processingId: string,
    campaignId: string,
    updates: {
      status?: UrlProcessingEvent['status'];
      details?: Partial<UrlProcessingEvent['details']>;
      result_data?: UrlProcessingEvent['result_data'];
    }
  ): Promise<void> {
    try {
      const queue = this.processingQueue.get(campaignId);
      if (!queue) return;

      const eventIndex = queue.findIndex(e => e.id === processingId);
      if (eventIndex === -1) return;

      const event = queue[eventIndex];
      
      // Update event
      if (updates.status) event.status = updates.status;
      if (updates.details) event.details = { ...event.details, ...updates.details };
      if (updates.result_data) event.result_data = updates.result_data;

      if (updates.status === 'completed' || updates.status === 'failed') {
        event.completed_at = new Date().toISOString();
        event.duration_ms = new Date(event.completed_at).getTime() - new Date(event.started_at).getTime();
      }

      // Record activity
      await this.recordActivityEvent(campaignId, {
        event_type: 'processing',
        url: event.url,
        domain: new URL(event.url).hostname,
        action: event.action,
        status: event.status,
        message: `${event.action} ${event.status} for ${event.url}`,
        data: {
          processing_id: processingId,
          duration_ms: event.duration_ms,
          details: event.details,
          result_data: event.result_data
        }
      });

      // Update enhanced campaign manager
      const enhancedStatus = event.status === 'completed' ? 'success' : 
                           event.status === 'failed' ? 'failed' : 'pending';
      
      await EnhancedCampaignManager.recordUrlActivity(
        campaignId,
        event.url,
        event.action === 'visiting' ? 'visited' : 
        event.action === 'posting' ? 'posted' : 
        event.action === 'verification' ? 'verified' : 'analyzed',
        enhancedStatus,
        {
          response_time: event.details.response_time,
          http_status: event.details.http_status,
          error_message: event.details.error_message
        },
        { processing_id: processingId }
      );

      // Remove from queue if completed or failed
      if (event.status === 'completed' || event.status === 'failed') {
        queue.splice(eventIndex, 1);
      }

      await this.updateLiveStats(campaignId);
    } catch (error) {
      console.error('Error updating URL processing:', error);
    }
  }

  // ==================== URL POSTING TRACKING ====================

  static async recordUrlPosting(
    campaignId: string,
    opportunityId: string,
    postingData: {
      posted_url: string;
      target_url: string;
      anchor_text: string;
      post_content: string;
      status: 'posted' | 'live' | 'failed';
      estimated_reach?: number;
      metrics?: Record<string, any>;
    }
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('posted_links')
        .insert({
          campaign_id: campaignId,
          opportunity_id: opportunityId,
          posted_url: postingData.posted_url,
          link_url: postingData.target_url,
          anchor_text: postingData.anchor_text,
          post_content: postingData.post_content,
          status: postingData.status,
          estimated_reach: postingData.estimated_reach || 0,
          metrics: postingData.metrics || {},
          posted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording URL posting:', error);
        return null;
      }

      // Record activity
      await this.recordActivityEvent(campaignId, {
        event_type: 'posting',
        url: postingData.posted_url,
        domain: new URL(postingData.posted_url).hostname,
        action: 'posted',
        status: postingData.status,
        message: `Link posted with anchor text "${postingData.anchor_text}"`,
        data: {
          posted_link_id: data.id,
          target_url: postingData.target_url,
          anchor_text: postingData.anchor_text,
          estimated_reach: postingData.estimated_reach
        }
      });

      // Start live monitoring for the posted link
      await this.startLiveMonitoring(data.id, postingData.posted_url);

      console.log(`📝 Recorded URL posting for ${postingData.posted_url} in campaign ${campaignId}`);
      await this.updateLiveStats(campaignId);

      return data.id;
    } catch (error) {
      console.error('Error recording URL posting:', error);
      return null;
    }
  }

  // ==================== LIVE MONITORING ====================

  private static async startLiveMonitoring(postedLinkId: string, url: string): Promise<void> {
    try {
      await supabase
        .from('live_link_monitoring')
        .insert({
          link_id: postedLinkId,
          domain: new URL(url).hostname,
          status: 'pending',
          last_checked: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error starting live monitoring:', error);
    }
  }

  static async updateLiveMonitoring(
    linkId: string,
    updates: {
      status?: string;
      response_time?: number;
      http_status?: number;
      is_indexed?: boolean;
      authority_score?: number;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('live_link_monitoring')
        .update({
          ...updates,
          last_checked: new Date().toISOString()
        })
        .eq('link_id', linkId);
    } catch (error) {
      console.error('Error updating live monitoring:', error);
    }
  }

  // ==================== ACTIVITY STREAM ====================

  private static async recordActivityEvent(
    campaignId: string,
    activity: Omit<UrlActivityStream, 'id' | 'campaign_id' | 'timestamp'>
  ): Promise<void> {
    const activityEvent: UrlActivityStream = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaign_id: campaignId,
      timestamp: new Date().toISOString(),
      ...activity
    };

    // Add to buffer
    if (!this.activityBuffers.has(campaignId)) {
      this.activityBuffers.set(campaignId, []);
    }
    const buffer = this.activityBuffers.get(campaignId)!;
    buffer.push(activityEvent);

    // Keep only last 1000 activities per campaign
    if (buffer.length > 1000) {
      buffer.splice(0, buffer.length - 1000);
    }

    // Store in database
    try {
      await supabase
        .from('event_stream')
        .insert({
          event_type: 'url_activity',
          campaign_id: campaignId,
          data: {
            activity_type: activity.event_type,
            url: activity.url,
            domain: activity.domain,
            action: activity.action,
            status: activity.status,
            message: activity.message,
            activity_data: activity.data,
            activity_id: activityEvent.id
          },
          timestamp: activityEvent.timestamp
        });
    } catch (error) {
      console.error('Error storing activity event:', error);
    }

    // Notify real-time subscribers
    this.notifyActivitySubscribers(campaignId, activityEvent);
  }

  // ==================== LIVE STATISTICS ====================

  private static async updateLiveStats(campaignId: string): Promise<void> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Get counts from database
      const [
        discoveredTotal, discoveredToday,
        visitedTotal, visitedToday,
        postedTotal, postedToday,
        verifiedTotal, verifiedToday
      ] = await Promise.all([
        this.getEventCount(campaignId, 'discovery', 'completed'),
        this.getEventCount(campaignId, 'discovery', 'completed', todayStart),
        this.getEventCount(campaignId, 'processing', 'completed'),
        this.getEventCount(campaignId, 'processing', 'completed', todayStart),
        this.getEventCount(campaignId, 'posting', 'posted'),
        this.getEventCount(campaignId, 'posting', 'posted', todayStart),
        this.getEventCount(campaignId, 'posting', 'live'),
        this.getEventCount(campaignId, 'posting', 'live', todayStart)
      ]);

      const stats: LiveUrlStats = {
        campaign_id: campaignId,
        session_id: `session_${campaignId}_${now.getTime()}`,
        timestamp: now.toISOString(),
        stats: {
          urls_discovered_total: discoveredTotal,
          urls_discovered_today: discoveredToday,
          urls_visited_total: visitedTotal,
          urls_visited_today: visitedToday,
          urls_posted_total: postedTotal,
          urls_posted_today: postedToday,
          urls_verified_total: verifiedTotal,
          urls_verified_today: verifiedToday,
          success_rate_total: visitedTotal > 0 ? (postedTotal / visitedTotal) * 100 : 0,
          success_rate_today: visitedToday > 0 ? (postedToday / visitedToday) * 100 : 0,
          average_response_time: await this.getAverageResponseTime(campaignId),
          active_processing_count: this.processingQueue.get(campaignId)?.length || 0
        }
      };

      this.statsCache.set(campaignId, stats);

      // Store in timeseries table
      await supabase
        .from('campaign_metrics_timeseries')
        .insert([
          {
            campaign_id: campaignId,
            metrics_type: 'urls_discovered',
            value: stats.stats.urls_discovered_total
          },
          {
            campaign_id: campaignId,
            metrics_type: 'urls_posted',
            value: stats.stats.urls_posted_total
          },
          {
            campaign_id: campaignId,
            metrics_type: 'success_rate',
            value: stats.stats.success_rate_total
          }
        ]);

    } catch (error) {
      console.error('Error updating live stats:', error);
    }
  }

  private static async getEventCount(
    campaignId: string,
    eventType: string,
    status: string,
    sinceTimestamp?: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('event_stream')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('event_type', 'url_activity')
        .eq('data->>activity_type', eventType)
        .eq('data->>status', status);

      if (sinceTimestamp) {
        query = query.gte('timestamp', sinceTimestamp);
      }

      const { count } = await query;
      return count || 0;
    } catch (error) {
      console.error('Error getting event count:', error);
      return 0;
    }
  }

  private static async getAverageResponseTime(campaignId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('event_stream')
        .select('data')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'url_activity')
        .not('data->>duration_ms', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!data || data.length === 0) return 0;

      const durations = data
        .map(event => event.data.duration_ms)
        .filter(duration => duration && duration > 0);

      return durations.length > 0 ? 
        durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0;
    } catch (error) {
      console.error('Error getting average response time:', error);
      return 0;
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  static subscribeToActivityStream(
    campaignId: string,
    callback: (activity: UrlActivityStream) => void
  ): () => void {
    const subscription = supabase
      .channel(`url_activity_${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_stream',
          filter: `campaign_id=eq.${campaignId}`
        },
        (payload) => {
          if (payload.new.event_type === 'url_activity') {
            const activity: UrlActivityStream = {
              id: payload.new.data.activity_id || payload.new.id,
              campaign_id: campaignId,
              event_type: payload.new.data.activity_type,
              timestamp: payload.new.timestamp,
              url: payload.new.data.url,
              domain: payload.new.data.domain,
              action: payload.new.data.action,
              status: payload.new.data.status,
              message: payload.new.data.message,
              data: payload.new.data.activity_data || {}
            };
            callback(activity);
          }
        }
      )
      .subscribe();

    this.eventSubscriptions.set(campaignId, subscription);

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      this.eventSubscriptions.delete(campaignId);
    };
  }

  private static notifyActivitySubscribers(campaignId: string, activity: UrlActivityStream): void {
    // This would be called by real-time subscription handlers
    // The actual notification happens through Supabase real-time
  }

  // ==================== DATA RETRIEVAL ====================

  static getActivityBuffer(campaignId: string): UrlActivityStream[] {
    return this.activityBuffers.get(campaignId) || [];
  }

  static getLiveStats(campaignId: string): LiveUrlStats | null {
    return this.statsCache.get(campaignId) || null;
  }

  static getProcessingQueue(campaignId: string): UrlProcessingEvent[] {
    return this.processingQueue.get(campaignId) || [];
  }

  static async getRecentActivity(
    campaignId: string,
    limit: number = 100
  ): Promise<UrlActivityStream[]> {
    try {
      const { data } = await supabase
        .from('event_stream')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'url_activity')
        .order('timestamp', { ascending: false })
        .limit(limit);

      return data?.map(event => ({
        id: event.data.activity_id || event.id,
        campaign_id: campaignId,
        event_type: event.data.activity_type,
        timestamp: event.timestamp,
        url: event.data.url,
        domain: event.data.domain,
        action: event.data.action,
        status: event.data.status,
        message: event.data.message,
        data: event.data.activity_data || {}
      })) || [];
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // ==================== CLEANUP ====================

  static cleanup(campaignId: string): void {
    this.activityBuffers.delete(campaignId);
    this.statsCache.delete(campaignId);
    this.processingQueue.delete(campaignId);
    
    const subscription = this.eventSubscriptions.get(campaignId);
    if (subscription) {
      subscription.unsubscribe();
      this.eventSubscriptions.delete(campaignId);
    }
  }
}
