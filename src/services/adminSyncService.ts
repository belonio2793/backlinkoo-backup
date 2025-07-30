interface AdminSyncEvent {
  type: 'blog_generated' | 'post_claimed' | 'post_expired' | 'user_activity';
  data: any;
  timestamp: string;
  sessionId: string;
}

interface BlogMetrics {
  totalRequests: number;
  todayRequests: number;
  completionRate: number;
  avgGenerationTime: number;
  claimRate: number;
  activeUsers: number;
}

class AdminSyncService {
  private events: AdminSyncEvent[] = [];
  private listeners: Map<string, Function[]> = new Map();
  private metricsCache: BlogMetrics | null = null;
  private lastUpdate: number = 0;

  constructor() {
    this.loadStoredEvents();
    this.setupPeriodicSync();
  }

  // Event tracking methods

  trackBlogGenerated(data: {
    sessionId: string;
    blogSlug: string;
    targetUrl: string;
    primaryKeyword: string;
    seoScore: number;
    generationTime: number;
    isTrialPost: boolean;
    expiresAt?: string;
  }) {
    const event: AdminSyncEvent = {
      type: 'blog_generated',
      data,
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId
    };

    this.addEvent(event);
    this.notifyListeners('blog_generated', event);
    
    // Update rate limiting
    this.updateRateLimit(data.sessionId);
  }

  trackPostClaimed(data: {
    blogSlug: string;
    userId: string;
    sessionId: string;
  }) {
    const event: AdminSyncEvent = {
      type: 'post_claimed',
      data,
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId
    };

    this.addEvent(event);
    this.notifyListeners('post_claimed', event);
  }

  trackUserActivity(data: {
    sessionId: string;
    action: string;
    page: string;
    duration?: number;
  }) {
    const event: AdminSyncEvent = {
      type: 'user_activity',
      data,
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId
    };

    this.addEvent(event);
  }

  // Subscription methods for admin dashboard
  subscribe(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Get metrics for admin dashboard
  getMetrics(forceRefresh = false): BlogMetrics {
    const now = Date.now();
    if (!forceRefresh && this.metricsCache && (now - this.lastUpdate) < 30000) {
      return this.metricsCache;
    }

    const today = new Date().toDateString();
    const blogEvents = this.events.filter(e => e.type === 'blog_generated');

    const claimEvents = this.events.filter(e => e.type === 'post_claimed');

    const todayEvents = blogEvents.filter(e => 
      new Date(e.timestamp).toDateString() === today
    );

    // Calculate active users (unique sessions in last hour)
    const lastHour = now - (60 * 60 * 1000);
    const recentSessions = new Set(
      this.events
        .filter(e => new Date(e.timestamp).getTime() > lastHour)
        .map(e => e.sessionId)
    );

    // Calculate average generation time
    const generationTimes = blogEvents
      .map(e => e.data.generationTime)
      .filter(t => t !== undefined);
    
    const avgGenerationTime = generationTimes.length > 0 
      ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length
      : 0;

    // Calculate completion rate (generated vs requested)
    const completionRate = requestEvents.length > 0 
      ? (blogEvents.length / requestEvents.length) * 100
      : 0;

    // Calculate claim rate
    const claimRate = blogEvents.length > 0 
      ? (claimEvents.length / blogEvents.length) * 100
      : 0;

    this.metricsCache = {
      totalRequests: requestEvents.length,
      todayRequests: todayEvents.length,
      completionRate: Math.round(completionRate),
      avgGenerationTime: Math.round(avgGenerationTime),
      claimRate: Math.round(claimRate),
      activeUsers: recentSessions.size
    };

    this.lastUpdate = now;
    return this.metricsCache;
  }

  // Get recent events for admin monitoring
  getRecentEvents(eventType?: string, limit = 50): AdminSyncEvent[] {
    let events = this.events;
    
    if (eventType) {
      events = events.filter(e => e.type === eventType);
    }

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Configuration methods
  updateConfiguration(config: {
    rateLimit?: number;
    expirationHours?: number;
    autoCleanup?: boolean;
  }) {
    const currentConfig = this.getConfiguration();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('admin_blog_config', JSON.stringify(newConfig));
    
    this.notifyListeners('config_updated', { config: newConfig });
  }

  getConfiguration() {
    const defaultConfig = {
      rateLimit: 5,
      expirationHours: 24,
      autoCleanup: true,
      enableRealTimeSync: true
    };

    try {
      const stored = localStorage.getItem('admin_blog_config');
      return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  }

  // Rate limiting methods
  updateRateLimit(sessionId: string) {
    const rateLimitKey = `rate_limit_${sessionId}`;
    const now = Date.now();
    const windowStart = now - (60 * 60 * 1000); // 1 hour window
    
    let requests = JSON.parse(localStorage.getItem(rateLimitKey) || '[]');
    requests = requests.filter((timestamp: number) => timestamp > windowStart);
    requests.push(now);
    
    localStorage.setItem(rateLimitKey, JSON.stringify(requests));
    
    const config = this.getConfiguration();
    if (requests.length >= config.rateLimit) {
      this.notifyListeners('rate_limit_exceeded', { sessionId, requests: requests.length });
    }
  }

  checkRateLimit(sessionId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const rateLimitKey = `rate_limit_${sessionId}`;
    const now = Date.now();
    const windowStart = now - (60 * 60 * 1000); // 1 hour window
    
    let requests = JSON.parse(localStorage.getItem(rateLimitKey) || '[]');
    requests = requests.filter((timestamp: number) => timestamp > windowStart);
    
    const config = this.getConfiguration();
    const remaining = Math.max(0, config.rateLimit - requests.length);
    const resetTime = requests.length > 0 ? requests[0] + (60 * 60 * 1000) : now;
    
    return {
      allowed: remaining > 0,
      remaining,
      resetTime
    };
  }

  // Private methods
  private addEvent(event: AdminSyncEvent) {
    this.events.unshift(event);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }
    
    this.persistEvents();
  }

  private notifyListeners(eventType: string, data: any) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in admin sync listener:', error);
        }
      });
    }
  }

  private loadStoredEvents() {
    try {
      const stored = localStorage.getItem('admin_sync_events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored admin sync events:', error);
      this.events = [];
    }
  }

  private persistEvents() {
    try {
      localStorage.setItem('admin_sync_events', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to persist admin sync events:', error);
    }
  }

  private setupPeriodicSync() {
    // Clean up old events every hour
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      this.events = this.events.filter(e => 
        new Date(e.timestamp).getTime() > cutoff
      );
      this.persistEvents();
    }, 60 * 60 * 1000);
  }

  // Export methods for admin
  exportData(format: 'json' | 'csv' = 'json') {
    const data = {
      events: this.events,
      metrics: this.getMetrics(true),
      configuration: this.getConfiguration(),
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      return this.convertToCSV(this.events);
    }

    return JSON.stringify(data, null, 2);
  }

  private convertToCSV(events: AdminSyncEvent[]): string {
    if (events.length === 0) return '';

    const headers = ['timestamp', 'type', 'sessionId', 'data'];
    const rows = events.map(event => [
      event.timestamp,
      event.type,
      event.sessionId,
      JSON.stringify(event.data)
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

export const adminSyncService = new AdminSyncService();
export type { AdminSyncEvent, BlogMetrics };
