import { supabase } from '@/integrations/supabase/client';
import { unifiedAdminMetrics } from './unifiedAdminMetrics';
import { adminAuditLogger } from './adminAuditLogger';

export interface RealTimeAdminData {
  // Core metrics
  userCount: number;
  premiumUserCount: number;
  blogPostCount: number;
  activePostCount: number;
  
  // Activity metrics
  recentLogins: number;
  dailySignups: number;
  recentAuditActions: number;
  
  // System health
  databaseConnected: boolean;
  servicesOnline: number;
  lastSyncTime: Date;
  
  // Security metrics
  failedLoginAttempts: number;
  suspiciousActivity: number;
  adminUsersOnline: number;
}

export interface UserActivity {
  id: string;
  user_id: string;
  email: string;
  action: string;
  timestamp: Date;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed' | 'suspicious';
}

export interface ContentMetrics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  trialPosts: number;
  claimedPosts: number;
  postsToday: number;
  avgPostsPerWeek: number;
  topContentTypes: { type: string; count: number }[];
}

export interface SecurityMetrics {
  totalAuditLogs: number;
  recentFailures: number;
  uniqueAdmins: number;
  criticalActions: number;
  suspiciousIPs: string[];
  lastSecurityIncident?: Date;
}

class AdminDataSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(data: RealTimeAdminData) => void> = [];
  private lastSyncData: RealTimeAdminData | null = null;
  private isRealTimeEnabled = false;

  /**
   * Initialize the admin data sync service
   */
  async initialize() {
    console.log('🔄 Initializing Admin Data Sync Service...');
    
    try {
      // Perform initial sync
      await this.performFullSync();
      
      // Set up periodic sync (every 30 seconds)
      this.startRealTimeSync();
      
      // Set up Supabase real-time listeners for critical tables
      this.setupRealtimeListeners();
      
      console.log('✅ Admin Data Sync Service initialized');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to initialize Admin Data Sync Service:', error);
      return false;
    }
  }

  /**
   * Perform a full data sync from all sources
   */
  async performFullSync(): Promise<RealTimeAdminData> {
    console.log('🔄 Performing full admin data sync...');
    
    try {
      const [
        coreMetrics,
        userActivity,
        contentMetrics,
        securityMetrics,
        systemHealth
      ] = await Promise.allSettled([
        unifiedAdminMetrics.getAllMetrics(),
        this.getUserActivity(),
        this.getContentMetrics(),
        this.getSecurityMetrics(),
        this.getSystemHealth()
      ]);

      const realTimeData: RealTimeAdminData = {
        // Core metrics from unified service
        userCount: coreMetrics.status === 'fulfilled' ? coreMetrics.value.totalUsers : 0,
        premiumUserCount: coreMetrics.status === 'fulfilled' ? coreMetrics.value.activeUsers : 0,
        blogPostCount: coreMetrics.status === 'fulfilled' ? coreMetrics.value.totalBlogPosts : 0,
        activePostCount: coreMetrics.status === 'fulfilled' ? coreMetrics.value.publishedBlogPosts : 0,
        
        // Activity metrics
        recentLogins: userActivity.status === 'fulfilled' ? userActivity.value.recentLogins : 0,
        dailySignups: userActivity.status === 'fulfilled' ? userActivity.value.dailySignups : 0,
        recentAuditActions: securityMetrics.status === 'fulfilled' ? securityMetrics.value.totalAuditLogs : 0,
        
        // System health
        databaseConnected: coreMetrics.status === 'fulfilled' ? coreMetrics.value.databaseConnected : false,
        servicesOnline: systemHealth.status === 'fulfilled' ? systemHealth.value.servicesOnline : 0,
        lastSyncTime: new Date(),
        
        // Security metrics
        failedLoginAttempts: securityMetrics.status === 'fulfilled' ? securityMetrics.value.recentFailures : 0,
        suspiciousActivity: 0, // TODO: implement suspicious activity detection
        adminUsersOnline: 1 // At least current admin
      };

      this.lastSyncData = realTimeData;
      this.notifyListeners(realTimeData);
      
      console.log('✅ Full admin data sync completed');
      return realTimeData;
      
    } catch (error: any) {
      console.error('❌ Full sync failed:', error);
      throw error;
    }
  }

  /**
   * Get user activity metrics
   */
  private async getUserActivity() {
    try {
      // Get recent activity from multiple sources
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Try to get recent signups from subscribers or orders
      const { data: recentSubscribers } = await supabase
        .from('subscribers')
        .select('created_at')
        .gte('created_at', last24Hours.toISOString());

      const { data: recentOrders } = await supabase
        .from('orders')
        .select('email, created_at')
        .gte('created_at', last7Days.toISOString());

      const dailySignups = recentSubscribers?.length || 0;
      const recentLogins = Math.min((recentOrders?.length || 0), 20); // Estimate recent activity

      return {
        recentLogins,
        dailySignups
      };
    } catch (error: any) {
      console.warn('Could not fetch user activity:', error.message);
      return {
        recentLogins: 0,
        dailySignups: 0
      };
    }
  }

  /**
   * Get detailed content metrics
   */
  async getContentMetrics(): Promise<ContentMetrics> {
    try {
      console.log('📊 Fetching detailed content metrics...');

      const [
        totalPostsResult,
        publishedPostsResult,
        draftPostsResult,
        trialPostsResult,
        claimedPostsResult,
        todayPostsResult
      ] = await Promise.allSettled([
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('is_trial_post', true),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('claimed', true),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0])
      ]);

      const totalPosts = totalPostsResult.status === 'fulfilled' ? (totalPostsResult.value.count || 0) : 0;
      const publishedPosts = publishedPostsResult.status === 'fulfilled' ? (publishedPostsResult.value.count || 0) : 0;
      const draftPosts = draftPostsResult.status === 'fulfilled' ? (draftPostsResult.value.count || 0) : 0;
      const trialPosts = trialPostsResult.status === 'fulfilled' ? (trialPostsResult.value.count || 0) : 0;
      const claimedPosts = claimedPostsResult.status === 'fulfilled' ? (claimedPostsResult.value.count || 0) : 0;
      const postsToday = todayPostsResult.status === 'fulfilled' ? (todayPostsResult.value.count || 0) : 0;

      return {
        totalPosts,
        publishedPosts,
        draftPosts,
        trialPosts,
        claimedPosts,
        postsToday,
        avgPostsPerWeek: Math.round(totalPosts / 4), // Rough estimate
        topContentTypes: [
          { type: 'SEO Articles', count: Math.round(publishedPosts * 0.6) },
          { type: 'Blog Posts', count: Math.round(publishedPosts * 0.3) },
          { type: 'Guides', count: Math.round(publishedPosts * 0.1) }
        ]
      };
    } catch (error: any) {
      console.warn('Content metrics fetch failed:', error.message);
      return {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        trialPosts: 0,
        claimedPosts: 0,
        postsToday: 0,
        avgPostsPerWeek: 0,
        topContentTypes: []
      };
    }
  }

  /**
   * Get security metrics
   */
  private async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const stats = await adminAuditLogger.getAuditStats();
      
      return {
        totalAuditLogs: stats.totalLogs,
        recentFailures: stats.failedActions,
        uniqueAdmins: stats.uniqueAdmins,
        criticalActions: Math.floor(stats.totalLogs * 0.1), // Estimate critical actions
        suspiciousIPs: [], // TODO: implement IP tracking
        lastSecurityIncident: undefined // TODO: implement incident tracking
      };
    } catch (error: any) {
      console.warn('Security metrics fetch failed:', error.message);
      return {
        totalAuditLogs: 0,
        recentFailures: 0,
        uniqueAdmins: 1,
        criticalActions: 0,
        suspiciousIPs: [],
        lastSecurityIncident: undefined
      };
    }
  }

  /**
   * Get system health metrics
   */
  private async getSystemHealth() {
    try {
      const dbHealth = await unifiedAdminMetrics.getDatabaseHealth();
      
      return {
        servicesOnline: dbHealth.totalAccessibleTables,
        databaseConnected: dbHealth.connected
      };
    } catch (error: any) {
      console.warn('System health check failed:', error.message);
      return {
        servicesOnline: 0,
        databaseConnected: false
      };
    }
  }

  /**
   * Start real-time sync with configurable interval
   */
  startRealTimeSync(intervalMs: number = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.isRealTimeEnabled = true;
    this.syncInterval = setInterval(async () => {
      if (this.isRealTimeEnabled) {
        try {
          await this.performFullSync();
        } catch (error) {
          console.warn('Scheduled sync failed:', error);
        }
      }
    }, intervalMs);

    console.log(`🔄 Real-time sync started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop real-time sync
   */
  stopRealTimeSync() {
    this.isRealTimeEnabled = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('⏹️ Real-time sync stopped');
  }

  /**
   * Set up Supabase real-time listeners for critical tables
   */
  private setupRealtimeListeners() {
    // Listen for blog post changes
    supabase
      .channel('admin-blog-posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blog_posts' },
        () => {
          console.log('📝 Blog posts table changed, syncing...');
          this.performFullSync().catch(console.error);
        }
      )
      .subscribe();

    // Listen for new orders
    supabase
      .channel('admin-orders')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          console.log('💰 New order received, syncing...');
          this.performFullSync().catch(console.error);
        }
      )
      .subscribe();

    console.log('🔔 Real-time listeners set up for critical tables');
  }

  /**
   * Subscribe to real-time admin data updates
   */
  subscribe(callback: (data: RealTimeAdminData) => void): () => void {
    this.listeners.push(callback);
    
    // Send current data immediately if available
    if (this.lastSyncData) {
      callback(this.lastSyncData);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of data updates
   */
  private notifyListeners(data: RealTimeAdminData) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in admin data listener:', error);
      }
    });
  }

  /**
   * Get the last synced data
   */
  getLastSyncData(): RealTimeAdminData | null {
    return this.lastSyncData;
  }

  /**
   * Force a refresh of all admin data
   */
  async refreshAll(): Promise<RealTimeAdminData> {
    unifiedAdminMetrics.clearCache();
    return await this.performFullSync();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isEnabled: this.isRealTimeEnabled,
      lastSync: this.lastSyncData?.lastSyncTime,
      listenerCount: this.listeners.length,
      hasData: !!this.lastSyncData
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopRealTimeSync();
    this.listeners = [];
    supabase.removeAllChannels();
    console.log('🧹 Admin Data Sync Service destroyed');
  }
}

export const adminDataSyncService = new AdminDataSyncService();
