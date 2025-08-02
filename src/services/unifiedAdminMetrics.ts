import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface UnifiedAdminMetrics {
  // User metrics
  totalUsers: number;
  activeUsers: number; // Premium subscribers
  recentSignups: number; // Last 7 days
  adminUsers: number;
  
  // Content metrics
  totalBlogPosts: number;
  publishedBlogPosts: number;
  trialBlogPosts: number;
  claimedPosts: number;
  
  // Campaign metrics
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  
  // Financial metrics
  monthlyRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  
  // System metrics
  databaseConnected: boolean;
  tablesAccessible: number;
  
  // Trends (optional)
  userGrowthRate?: number;
  revenueGrowthRate?: number;
}

export interface DatabaseHealth {
  connected: boolean;
  tablesStatus: {
    [tableName: string]: {
      accessible: boolean;
      rowCount: number;
      error?: string;
    };
  };
  totalAccessibleTables: number;
  lastChecked: Date;
}

class UnifiedAdminMetricsService {
  private cachedMetrics: UnifiedAdminMetrics | null = null;
  private cacheTimestamp: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all admin metrics with caching
   */
  async getAllMetrics(forceRefresh: boolean = false): Promise<UnifiedAdminMetrics> {
    // Check cache
    if (!forceRefresh && this.cachedMetrics && this.cacheTimestamp) {
      const now = new Date();
      const timeDiff = now.getTime() - this.cacheTimestamp.getTime();
      if (timeDiff < this.CACHE_DURATION) {
        console.log('📊 Returning cached metrics');
        return this.cachedMetrics;
      }
    }

    console.log('📊 Fetching fresh admin metrics from Supabase...');
    
    // Fetch all metrics in parallel for better performance
    const [
      userMetrics,
      contentMetrics,
      campaignMetrics,
      financialMetrics,
      dbHealth
    ] = await Promise.allSettled([
      this.getUserMetrics(),
      this.getContentMetrics(),
      this.getCampaignMetrics(),
      this.getFinancialMetrics(),
      this.getDatabaseHealth()
    ]);

    // Combine results with safe fallbacks
    const metrics: UnifiedAdminMetrics = {
      // User metrics
      totalUsers: userMetrics.status === 'fulfilled' ? userMetrics.value.totalUsers : 0,
      activeUsers: userMetrics.status === 'fulfilled' ? userMetrics.value.activeUsers : 0,
      recentSignups: userMetrics.status === 'fulfilled' ? userMetrics.value.recentSignups : 0,
      adminUsers: userMetrics.status === 'fulfilled' ? userMetrics.value.adminUsers : 0,
      
      // Content metrics
      totalBlogPosts: contentMetrics.status === 'fulfilled' ? contentMetrics.value.totalBlogPosts : 0,
      publishedBlogPosts: contentMetrics.status === 'fulfilled' ? contentMetrics.value.publishedBlogPosts : 0,
      trialBlogPosts: contentMetrics.status === 'fulfilled' ? contentMetrics.value.trialBlogPosts : 0,
      claimedPosts: contentMetrics.status === 'fulfilled' ? contentMetrics.value.claimedPosts : 0,
      
      // Campaign metrics
      totalCampaigns: campaignMetrics.status === 'fulfilled' ? campaignMetrics.value.totalCampaigns : 0,
      activeCampaigns: campaignMetrics.status === 'fulfilled' ? campaignMetrics.value.activeCampaigns : 0,
      completedCampaigns: campaignMetrics.status === 'fulfilled' ? campaignMetrics.value.completedCampaigns : 0,
      
      // Financial metrics
      monthlyRevenue: financialMetrics.status === 'fulfilled' ? financialMetrics.value.monthlyRevenue : 0,
      totalRevenue: financialMetrics.status === 'fulfilled' ? financialMetrics.value.totalRevenue : 0,
      totalOrders: financialMetrics.status === 'fulfilled' ? financialMetrics.value.totalOrders : 0,
      completedOrders: financialMetrics.status === 'fulfilled' ? financialMetrics.value.completedOrders : 0,
      
      // System metrics
      databaseConnected: dbHealth.status === 'fulfilled' ? dbHealth.value.connected : false,
      tablesAccessible: dbHealth.status === 'fulfilled' ? dbHealth.value.totalAccessibleTables : 0
    };

    // Log any failures for debugging
    const metricTypes = ['User', 'Content', 'Campaign', 'Financial', 'Database Health'];
    const results = [userMetrics, contentMetrics, campaignMetrics, financialMetrics, dbHealth];
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`❌ Failed to fetch ${metricTypes[index]} metrics:`, result.reason);
      }
    });

    // Cache the results
    this.cachedMetrics = metrics;
    this.cacheTimestamp = new Date();

    console.log('✅ Admin metrics fetched and cached');
    return metrics;
  }

  /**
   * Get user-related metrics using working admin service
   */
  private async getUserMetrics() {
    console.log('👥 Fetching user metrics...');

    try {
      console.log('👥 Attempting to fetch user metrics for admin dashboard...');

      // Method 1: Try direct Supabase queries first (most reliable)
      try {
        // Get profile count
        const { count: profileCount, error: profileError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (profileError) {
          console.warn('Profiles table query failed:', profileError.message);
          throw profileError;
        }

        // Get subscriber count
        const { count: subscriberCount, error: subscriberError } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true);

        if (subscriberError) {
          console.warn('Subscribers table query failed:', subscriberError.message);
        }

        // Get recent signups using a date filter
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentCount, error: recentError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        if (recentError) {
          console.warn('Recent signups query failed:', recentError.message);
        }

        // Get admin count
        const { count: adminCount, error: adminError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (adminError) {
          console.warn('Admin count query failed:', adminError.message);
        }

        console.log('✅ Direct queries successful');

        return {
          totalUsers: profileCount || 0,
          activeUsers: subscriberCount || 0,
          recentSignups: recentCount || 0,
          adminUsers: adminCount || 0
        };

      } catch (directError) {
        console.warn('⚠️ Direct queries failed, trying admin service...', directError);

        // Method 2: Try the admin service as fallback
        try {
          const { realAdminUserService } = await import('@/services/realAdminUserService');
          const profiles = await realAdminUserService.getAllProfiles(true);

          // Get subscription data
          const { data: subscribers } = await supabase
            .from('subscribers')
            .select('user_id, subscribed')
            .eq('subscribed', true);

          const subscriberIds = new Set(subscribers?.map(s => s.user_id) || []);

          const totalUsers = profiles.length;
          const activeUsers = profiles.filter(p => subscriberIds.has(p.user_id)).length;
          const adminUsers = profiles.filter(p => p.role === 'admin').length;

          // Recent signups
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const recentSignups = profiles.filter(p =>
            new Date(p.created_at) > sevenDaysAgo
          ).length;

          console.log('✅ Admin service fallback successful');

          return {
            totalUsers,
            activeUsers,
            recentSignups,
            adminUsers
          };

        } catch (serviceError) {
          console.error('❌ Admin service also failed:', serviceError);
          throw serviceError;
        }
      }



    } catch (serviceError) {
      console.warn('⚠️ Admin service failed, trying direct queries...', serviceError);

      // Fallback to direct queries
      try {
        // Get total users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get active users (premium subscribers)
        const { count: activeUsers } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true);

        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: recentSignups } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString());

        // Get admin users
        const { count: adminUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        return {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          recentSignups: recentSignups || 0,
          adminUsers: adminUsers || 0
        };

      } catch (directError) {
        console.error('❌ Direct queries also failed:', directError);
        // Return zeros if all methods fail
        return {
          totalUsers: 0,
          activeUsers: 0,
          recentSignups: 0,
          adminUsers: 0
        };
      }
    }
  }

  /**
   * Get content-related metrics
   */
  private async getContentMetrics() {
    console.log('📝 Fetching content metrics...');
    
    // Get total blog posts
    const { count: totalBlogPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });

    // Get published blog posts
    const { count: publishedBlogPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Get trial blog posts
    const { count: trialBlogPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_trial_post', true);

    // Get claimed posts
    const { count: claimedPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('claimed', true);

    return {
      totalBlogPosts: totalBlogPosts || 0,
      publishedBlogPosts: publishedBlogPosts || 0,
      trialBlogPosts: trialBlogPosts || 0,
      claimedPosts: claimedPosts || 0
    };
  }

  /**
   * Get campaign-related metrics
   */
  private async getCampaignMetrics() {
    console.log('🎯 Fetching campaign metrics...');
    
    // Get total campaigns
    const { count: totalCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    // Get active campaigns
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'running', 'in_progress']);

    // Get completed campaigns
    const { count: completedCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    return {
      totalCampaigns: totalCampaigns || 0,
      activeCampaigns: activeCampaigns || 0,
      completedCampaigns: completedCampaigns || 0
    };
  }

  /**
   * Get financial metrics
   */
  private async getFinancialMetrics() {
    console.log('💰 Fetching financial metrics...');
    
    // Get current month's revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: monthlyOrders } = await supabase
      .from('orders')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString());

    const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

    // Get total revenue
    const { data: allOrders } = await supabase
      .from('orders')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = allOrders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

    // Get order counts
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    return {
      monthlyRevenue,
      totalRevenue,
      totalOrders: totalOrders || 0,
      completedOrders: completedOrders || 0
    };
  }

  /**
   * Check database health and table accessibility
   */
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    console.log('🔍 Checking database health...');
    
    const tables = ['profiles', 'subscribers', 'blog_posts', 'campaigns', 'orders', 'credits', 'user_roles'];
    const tablesStatus: DatabaseHealth['tablesStatus'] = {};
    let totalAccessible = 0;

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          tablesStatus[tableName] = {
            accessible: false,
            rowCount: 0,
            error: error.message
          };
        } else {
          tablesStatus[tableName] = {
            accessible: true,
            rowCount: count || 0
          };
          totalAccessible++;
        }
      } catch (err: any) {
        tablesStatus[tableName] = {
          accessible: false,
          rowCount: 0,
          error: err.message
        };
      }
    }

    return {
      connected: totalAccessible > 0,
      tablesStatus,
      totalAccessibleTables: totalAccessible,
      lastChecked: new Date()
    };
  }

  /**
   * Clear cache to force fresh data
   */
  clearCache() {
    this.cachedMetrics = null;
    this.cacheTimestamp = null;
    console.log('🗑️ Metrics cache cleared');
  }

  /**
   * Get specific metric by key
   */
  async getMetric(key: keyof UnifiedAdminMetrics): Promise<number | boolean> {
    const metrics = await this.getAllMetrics();
    return metrics[key];
  }
}

export const unifiedAdminMetrics = new UnifiedAdminMetricsService();
