import { supabase } from '@/integrations/supabase/client';
import { logError } from './productionErrorHandler';

// Cache implementation for frequently accessed data
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 1000; // Prevent memory leaks

  set(key: string, data: any, ttlSeconds: number = 300) {
    // Clean up if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instance
const dataCache = new DataCache();

// Request deduplication to prevent duplicate API calls
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

const requestDeduplicator = new RequestDeduplicator();

// Batch operations for better performance
export class BatchOperationManager {
  private batchQueue = new Map<string, any[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private batchSize = 50;
  private batchDelay = 100; // ms

  addToBatch(operation: string, data: any, processFn: (batch: any[]) => Promise<void>) {
    if (!this.batchQueue.has(operation)) {
      this.batchQueue.set(operation, []);
    }

    const queue = this.batchQueue.get(operation)!;
    queue.push(data);

    // Clear existing timer
    if (this.batchTimers.has(operation)) {
      clearTimeout(this.batchTimers.get(operation)!);
    }

    // Process batch if it reaches size limit or after delay
    if (queue.length >= this.batchSize) {
      this.processBatch(operation, processFn);
    } else {
      const timer = setTimeout(() => {
        this.processBatch(operation, processFn);
      }, this.batchDelay);
      this.batchTimers.set(operation, timer);
    }
  }

  private async processBatch(operation: string, processFn: (batch: any[]) => Promise<void>) {
    const batch = this.batchQueue.get(operation) || [];
    if (batch.length === 0) return;

    this.batchQueue.set(operation, []);
    
    if (this.batchTimers.has(operation)) {
      clearTimeout(this.batchTimers.get(operation)!);
      this.batchTimers.delete(operation);
    }

    try {
      await processFn(batch);
    } catch (error) {
      console.error(`Batch processing failed for ${operation}:`, error);
      // Could implement retry logic here
    }
  }
}

// Optimized data fetching functions
export class ScalableDataService {
  private batchManager = new BatchOperationManager();

  // Optimized campaign stats fetching with pagination and caching
  async getCampaignStats(userId: string, limit: number = 20, offset: number = 0): Promise<{
    campaigns: any[];
    totalCount: number;
    stats: any;
  }> {
    const cacheKey = `campaign_stats_${userId}_${limit}_${offset}`;
    const cached = dataCache.get(cacheKey);
    if (cached) return cached;

    return requestDeduplicator.deduplicate(cacheKey, async () => {
      try {
        // Use efficient queries with proper indexing
        const [campaignsResult, countResult, statsResult] = await Promise.all([
          // Paginated campaigns
          supabase
            .from('automation_campaigns')
            .select(`
              id,
              name,
              status,
              created_at,
              target_url,
              strategy
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1),
          
          // Total count for pagination
          supabase
            .from('automation_campaigns')
            .select('id', { count: 'exact' })
            .eq('user_id', userId),
          
          // Aggregated stats
          supabase
            .from('automation_campaigns')
            .select(`
              status,
              links_built_today,
              domains_reached,
              avg_domain_rating,
              success_rate,
              traffic_gained
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
        ]);

        if (campaignsResult.error) throw campaignsResult.error;
        if (countResult.error) throw countResult.error;
        if (statsResult.error) throw statsResult.error;

        // Calculate aggregated stats
        const stats = this.calculateAggregatedStats(statsResult.data || []);

        const result = {
          campaigns: campaignsResult.data || [],
          totalCount: countResult.count || 0,
          stats
        };

        // Cache for 1 minute
        dataCache.set(cacheKey, result, 60);
        return result;

      } catch (error) {
        await logError(error instanceof Error ? error : new Error('Stats fetch failed'), {
          component: 'scalable_data_service',
          operation: 'get_campaign_stats',
          userId
        }, 'medium');
        throw error;
      }
    });
  }

  // Optimized activity feed with lazy loading
  async getActivityFeed(userId: string, lastActivityId?: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `activity_feed_${userId}_${lastActivityId || 'latest'}_${limit}`;
    const cached = dataCache.get(cacheKey);
    if (cached) return cached;

    return requestDeduplicator.deduplicate(cacheKey, async () => {
      try {
        let query = supabase
          .from('automation_activity')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        // Cursor-based pagination for better performance
        if (lastActivityId) {
          query = query.lt('id', lastActivityId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Cache for 30 seconds
        dataCache.set(cacheKey, data || [], 30);
        return data || [];

      } catch (error) {
        await logError(error instanceof Error ? error : new Error('Activity feed fetch failed'), {
          component: 'scalable_data_service',
          operation: 'get_activity_feed',
          userId
        }, 'low');
        return [];
      }
    });
  }

  // Batch analytics updates for better performance
  async updateAnalytics(userId: string, analytics: any) {
    this.batchManager.addToBatch(
      'analytics_update',
      { userId, ...analytics },
      async (batch) => {
        try {
          // Group by user and merge analytics
          const userAnalytics = batch.reduce((acc, item) => {
            if (!acc[item.userId]) {
              acc[item.userId] = { userId: item.userId };
            }
            Object.assign(acc[item.userId], item);
            return acc;
          }, {} as Record<string, any>);

          // Upsert analytics in batch
          await supabase
            .from('automation_analytics')
            .upsert(Object.values(userAnalytics), {
              onConflict: 'user_id'
            });

          // Invalidate related caches
          Object.keys(userAnalytics).forEach(userId => {
            dataCache.invalidate(`campaign_stats_${userId}`);
            dataCache.invalidate(`analytics_${userId}`);
          });

        } catch (error) {
          console.error('Batch analytics update failed:', error);
        }
      }
    );
  }

  // Connection pooling for database connections
  private async withRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Exponential backoff
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError!;
  }

  private calculateAggregatedStats(campaignData: any[]): any {
    if (!campaignData.length) {
      return {
        linksBuiltToday: 0,
        domainsReached: 0,
        avgDomainRating: 0,
        successRate: 0,
        trafficGained: 0
      };
    }

    return {
      linksBuiltToday: campaignData.reduce((sum, c) => sum + (c.links_built_today || 0), 0),
      domainsReached: campaignData.reduce((sum, c) => sum + (c.domains_reached || 0), 0),
      avgDomainRating: Math.round(
        campaignData.reduce((sum, c) => sum + (c.avg_domain_rating || 0), 0) / campaignData.length
      ),
      successRate: Math.round(
        campaignData.reduce((sum, c) => sum + (c.success_rate || 0), 0) / campaignData.length
      ),
      trafficGained: campaignData.reduce((sum, c) => sum + (c.traffic_gained || 0), 0)
    };
  }

  // Memory cleanup
  clearCache() {
    dataCache.clear();
  }

  // Health check for monitoring
  getPerformanceMetrics() {
    return {
      cacheSize: dataCache['cache'].size,
      pendingRequests: requestDeduplicator['pendingRequests'].size,
      batchQueues: Object.fromEntries(
        Array.from(this.batchManager['batchQueue'].entries()).map(([key, value]) => [key, value.length])
      )
    };
  }
}

// Rate limiting for API calls
export class RateLimiter {
  private requests = new Map<string, number[]>();
  private limits = {
    default: { requests: 100, window: 60000 }, // 100 requests per minute
    automation: { requests: 50, window: 60000 }, // 50 automation requests per minute
    content: { requests: 20, window: 60000 } // 20 content generation requests per minute
  };

  async checkLimit(userId: string, operation: 'default' | 'automation' | 'content' = 'default'): Promise<boolean> {
    const key = `${userId}_${operation}`;
    const now = Date.now();
    const limit = this.limits[operation];

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const userRequests = this.requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < limit.window);
    
    if (validRequests.length >= limit.requests) {
      return false; // Rate limit exceeded
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  clearUser(userId: string) {
    for (const key of this.requests.keys()) {
      if (key.startsWith(userId)) {
        this.requests.delete(key);
      }
    }
  }
}

// Export instances
export const scalableDataService = new ScalableDataService();
export const rateLimiter = new RateLimiter();

// Cleanup function for memory management
export const cleanupResources = () => {
  scalableDataService.clearCache();
  // Clean up rate limiter periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimiter['requests'].entries()) {
      const validTimestamps = timestamps.filter(t => now - t < 300000); // Keep last 5 minutes
      if (validTimestamps.length === 0) {
        rateLimiter['requests'].delete(key);
      } else {
        rateLimiter['requests'].set(key, validTimestamps);
      }
    }
  }, 300000); // Every 5 minutes
};

// Initialize cleanup on load
cleanupResources();
