/**
 * Real-Time Feed Service
 * 
 * Manages real-time events for the feed, including campaign state changes,
 * user actions, and system events.
 */

export interface RealTimeFeedEvent {
  id: string;
  timestamp: Date;
  type: 'campaign_created' | 'campaign_started' | 'content_generated' | 'url_published' | 'campaign_paused' | 'campaign_resumed' | 'campaign_completed' | 'campaign_failed' | 'user_action' | 'system_event';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  campaignId?: string;
  campaignName?: string;
  userId?: string;
  userEmail?: string;
  details?: {
    publishedUrl?: string;
    targetUrl?: string;
    keyword?: string;
    anchorText?: string;
    errorMessage?: string;
    duration?: number;
    wordCount?: number;
    reason?: string;
    platform?: string;
    action?: string;
  };
}

export type RealTimeFeedEventListener = (event: RealTimeFeedEvent) => void;

export class RealTimeFeedService {
  private static instance: RealTimeFeedService;
  private listeners: Set<RealTimeFeedEventListener> = new Set();
  private eventHistory: RealTimeFeedEvent[] = [];
  private maxHistorySize = 1000;

  static getInstance(): RealTimeFeedService {
    if (!this.instance) {
      this.instance = new RealTimeFeedService();
    }
    return this.instance;
  }

  /**
   * Subscribe to real-time feed events
   */
  subscribe(listener: RealTimeFeedEventListener): () => void {
    this.listeners.add(listener);
    
    // Send existing events to new listener
    this.eventHistory.forEach(event => listener(event));
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit a real-time feed event
   */
  emit(event: Omit<RealTimeFeedEvent, 'id' | 'timestamp'>): void {
    const fullEvent: RealTimeFeedEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    // Add to history
    this.eventHistory.push(fullEvent);
    
    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('Error in real-time feed listener:', error);
      }
    });

    // Log to console for debugging
    console.log(`📡 Real-time feed event: ${fullEvent.type} - ${fullEvent.message}`, fullEvent);
  }

  /**
   * Get event history
   */
  getHistory(): RealTimeFeedEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.emit({
      type: 'system_event',
      level: 'info',
      message: 'Real-time feed history cleared'
    });
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for common events

  /**
   * Emit campaign paused event
   */
  emitCampaignPaused(campaignId: string, campaignName: string, keyword: string, reason?: string, userId?: string): void {
    this.emit({
      type: 'campaign_paused',
      level: 'warning',
      message: `Campaign "${keyword}" paused${reason ? ` - ${reason}` : ''}`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        reason: reason || 'Manual pause',
        action: 'pause'
      }
    });
  }

  /**
   * Emit campaign auto-paused event (due to errors)
   */
  emitCampaignAutoPaused(campaignId: string, campaignName: string, keyword: string, errorMessage: string, errorType?: string, userId?: string): void {
    this.emit({
      type: 'campaign_paused',
      level: 'error',
      message: `Campaign "${keyword}" auto-paused - ${errorMessage}`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        reason: `Auto-paused: ${errorMessage}`,
        errorMessage,
        errorType,
        action: 'auto_pause'
      }
    });
  }

  /**
   * Emit campaign resumed event
   */
  emitCampaignResumed(campaignId: string, campaignName: string, keyword: string, reason?: string, userId?: string): void {
    this.emit({
      type: 'campaign_resumed',
      level: 'success',
      message: `Campaign "${keyword}" resumed${reason ? ` - ${reason}` : ''}`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        reason: reason || 'Manual resume',
        action: 'resume'
      }
    });
  }

  /**
   * Emit campaign created event
   */
  emitCampaignCreated(campaignId: string, campaignName: string, keyword: string, targetUrl: string, userId?: string): void {
    this.emit({
      type: 'campaign_created',
      level: 'success',
      message: `New campaign "${keyword}" created`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        targetUrl,
        action: 'create'
      }
    });
  }

  /**
   * Emit campaign completed event
   */
  emitCampaignCompleted(campaignId: string, campaignName: string, keyword: string, publishedUrls: string[], userId?: string): void {
    this.emit({
      type: 'campaign_completed',
      level: 'success',
      message: `Campaign "${keyword}" completed successfully with ${publishedUrls.length} published link(s)`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        action: 'complete',
        publishedUrl: publishedUrls[0] // First URL for details
      }
    });
  }

  /**
   * Emit campaign failed event
   */
  emitCampaignFailed(campaignId: string, campaignName: string, keyword: string, errorMessage: string, userId?: string): void {
    this.emit({
      type: 'campaign_failed',
      level: 'error',
      message: `Campaign "${keyword}" failed: ${errorMessage}`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        errorMessage,
        action: 'fail'
      }
    });
  }

  /**
   * Emit URL published event
   */
  emitUrlPublished(campaignId: string, campaignName: string, keyword: string, publishedUrl: string, platform: string, userId?: string): void {
    this.emit({
      type: 'url_published',
      level: 'success',
      message: `New link published for "${keyword}" on ${platform}`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        publishedUrl,
        platform,
        action: 'publish'
      }
    });
  }

  /**
   * Emit content generated event
   */
  emitContentGenerated(campaignId: string, campaignName: string, keyword: string, wordCount?: number, userId?: string): void {
    this.emit({
      type: 'content_generated',
      level: 'info',
      message: `Content generated for campaign "${keyword}"${wordCount ? ` (${wordCount} words)` : ''}`,
      campaignId,
      campaignName,
      userId,
      details: {
        keyword,
        wordCount,
        action: 'generate'
      }
    });
  }

  /**
   * Emit user action event
   */
  emitUserAction(action: string, message: string, userId?: string, campaignId?: string): void {
    this.emit({
      type: 'user_action',
      level: 'info',
      message: `User action: ${message}`,
      campaignId,
      userId,
      details: {
        action
      }
    });
  }

  /**
   * Emit system event
   */
  emitSystemEvent(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.emit({
      type: 'system_event',
      level,
      message
    });
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Get statistics
   */
  getStats() {
    const eventTypes = this.eventHistory.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventLevels = this.eventHistory.reduce((acc, event) => {
      acc[event.level] = (acc[event.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.eventHistory.length,
      activeListeners: this.listeners.size,
      eventTypes,
      eventLevels,
      lastEvent: this.eventHistory[this.eventHistory.length - 1]
    };
  }
}

// Export singleton instance
export const realTimeFeedService = RealTimeFeedService.getInstance();

// Initialize with a welcome message
realTimeFeedService.emitSystemEvent('Real-time feed service initialized', 'info');

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).realTimeFeedService = realTimeFeedService;
  console.log('📡 Real-time feed service available globally as window.realTimeFeedService');
}
