import { supabase } from '@/integrations/supabase/client';

export interface DirectMetrics {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  runningCampaigns: number;
  blogPosts: number;
  trialUsers: number;
  totalRevenue: number;
  recentSignups: number;
}

export interface SupabaseTableInfo {
  tableName: string;
  exists: boolean;
  rowCount?: number;
  error?: string;
}

class DirectSupabaseMetricsService {

  /**
   * Get all available table information
   */
  async getTableInfo(): Promise<SupabaseTableInfo[]> {
    const tables = [
      'profiles',
      'subscribers', 
      'blog_posts',
      'campaigns',
      'orders',
      'trial_posts',
      'user_claims',
      'newsletter_subscriptions'
    ];

    const results: SupabaseTableInfo[] = [];

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            tableName,
            exists: false,
            error: error.message
          });
        } else {
          results.push({
            tableName,
            exists: true,
            rowCount: count || 0
          });
        }
      } catch (err: any) {
        results.push({
          tableName,
          exists: false,
          error: err.message || 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Get total users count
   */
  async getTotalUsers(): Promise<number> {
    try {
      // Try profiles table first
      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!profilesError && profilesCount !== null) {
        return profilesCount;
      }

      // No fallback RPC available - profiles table is our source of truth

      // Fallback - return 0 with warning
      console.warn('⚠️ Could not get total users count');
      return 0;
    } catch (error: any) {
      console.error('❌ Error getting total users:', error);
      return 0;
    }
  }

  /**
   * Get active subscribers
   */
  async getActiveUsers(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);

      if (error) {
        console.warn('⚠️ Subscribers table not available, trying alternative');
        
        // Try checking profiles with subscription status
        const { count: altCount, error: altError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .or('subscription_status.eq.active,is_premium.eq.true');

        return altCount || 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('��� Error getting active users:', error);
      return 0;
    }
  }

  /**
   * Get monthly revenue
   */
  async getMonthlyRevenue(): Promise<number> {
    try {
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString());

      if (error) {
        console.warn('⚠️ Orders table not available');
        return 0;
      }

      const revenue = data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      return revenue;
    } catch (error: any) {
      console.error('❌ Error getting monthly revenue:', error);
      return 0;
    }
  }

  /**
   * Get total revenue all time
   */
  async getTotalRevenue(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('amount')
        .eq('status', 'completed');

      if (error) {
        console.warn('⚠️ Orders table not available');
        return 0;
      }

      const revenue = data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      return revenue;
    } catch (error: any) {
      console.error('❌ Error getting total revenue:', error);
      return 0;
    }
  }

  /**
   * Get running campaigns count
   */
  async getRunningCampaigns(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running');

      if (error) {
        console.warn('⚠️ Campaigns table not available');
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('❌ Error getting running campaigns:', error);
      return 0;
    }
  }

  /**
   * Get blog posts count
   */
  async getBlogPosts(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn('⚠️ Blog posts table not available');
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('❌ Error getting blog posts:', error);
      return 0;
    }
  }

  /**
   * Get trial users count
   */
  async getTrialUsers(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('subscription_status.eq.trial,is_trial.eq.true');

      if (error) {
        console.warn('⚠️ Could not get trial users count');
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('❌ Error getting trial users:', error);
      return 0;
    }
  }

  /**
   * Get recent signups (last 7 days)
   */
  async getRecentSignups(): Promise<number> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) {
        console.warn('⚠️ Could not get recent signups');
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('❌ Error getting recent signups:', error);
      return 0;
    }
  }

  /**
   * Get all metrics at once
   */
  async getAllMetrics(): Promise<DirectMetrics> {
    console.log('📊 Fetching direct Supabase metrics...');
    
    try {
      // Fetch all metrics in parallel
      const [
        totalUsers,
        activeUsers, 
        monthlyRevenue,
        runningCampaigns,
        blogPosts,
        trialUsers,
        totalRevenue,
        recentSignups
      ] = await Promise.allSettled([
        this.getTotalUsers(),
        this.getActiveUsers(),
        this.getMonthlyRevenue(),
        this.getRunningCampaigns(),
        this.getBlogPosts(),
        this.getTrialUsers(),
        this.getTotalRevenue(),
        this.getRecentSignups()
      ]);

      const metrics: DirectMetrics = {
        totalUsers: totalUsers.status === 'fulfilled' ? totalUsers.value : 0,
        activeUsers: activeUsers.status === 'fulfilled' ? activeUsers.value : 0,
        monthlyRevenue: monthlyRevenue.status === 'fulfilled' ? monthlyRevenue.value : 0,
        runningCampaigns: runningCampaigns.status === 'fulfilled' ? runningCampaigns.value : 0,
        blogPosts: blogPosts.status === 'fulfilled' ? blogPosts.value : 0,
        trialUsers: trialUsers.status === 'fulfilled' ? trialUsers.value : 0,
        totalRevenue: totalRevenue.status === 'fulfilled' ? totalRevenue.value : 0,
        recentSignups: recentSignups.status === 'fulfilled' ? recentSignups.value : 0
      };

      console.log('✅ Direct metrics fetched:', metrics);
      return metrics;

    } catch (error: any) {
      console.error('❌ Error fetching direct metrics:', error);
      
      // Return zero metrics on error
      return {
        totalUsers: 0,
        activeUsers: 0,
        monthlyRevenue: 0,
        runningCampaigns: 0,
        blogPosts: 0,
        trialUsers: 0,
        totalRevenue: 0,
        recentSignups: 0
      };
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<{ connected: boolean; error?: string; tables?: SupabaseTableInfo[] }> {
    try {
      console.log('🔗 Testing Supabase connection...');
      
      const tables = await this.getTableInfo();
      const connectedTables = tables.filter(t => t.exists);
      
      return {
        connected: connectedTables.length > 0,
        tables
      };
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

export const directSupabaseMetrics = new DirectSupabaseMetricsService();
