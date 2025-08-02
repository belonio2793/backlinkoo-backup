import { supabase } from '@/integrations/supabase/client';
import { realAdminUserService } from './realAdminUserService';
import { SafeAuth } from '@/utils/safeAuth';

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  runningCampaigns: number;
  totalUsersChange?: number;
  activeUsersChange?: number;
  monthlyRevenueChange?: number;
}

export interface MetricsError {
  message: string;
  details?: any;
}

export interface MetricsResult {
  data?: AdminDashboardMetrics;
  error?: MetricsError;
  loading: boolean;
}

class WorkingAdminDashboardMetricsService {
  
  /**
   * Check authentication and admin access before fetching metrics using SafeAuth
   */
  private async checkAuthAndAdmin(): Promise<boolean> {
    try {
      const adminResult = await SafeAuth.isAdmin();

      if (adminResult.needsAuth) {
        console.warn('❌ User not authenticated for metrics');
        return false;
      }

      if (!adminResult.isAdmin) {
        console.warn('❌ User is not admin for metrics');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      return false;
    }
  }

  /**
   * Fetch all admin dashboard metrics with proper error handling
   */
  async fetchDashboardMetrics(): Promise<AdminDashboardMetrics> {
    try {
      // Check authentication first
      const isAuthorized = await this.checkAuthAndAdmin();
      if (!isAuthorized) {
        throw new Error('Authentication required: Please sign in as an admin user');
      }

      console.log('📊 Fetching dashboard metrics...');

      // Test database connection first
      const connectionTest = await realAdminUserService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Database connection failed: ${connectionTest.error}`);
      }

      // Fetch all metrics using safe methods
      const [
        totalUsersResult,
        activeUsersResult,
        monthlyRevenueResult,
        runningCampaignsResult
      ] = await Promise.allSettled([
        this.getTotalUsers(),
        this.getActiveUsers(),
        this.getMonthlyRevenue(),
        this.getRunningCampaigns()
      ]);

      // Extract values with fallbacks
      const totalUsers = totalUsersResult.status === 'fulfilled' ? totalUsersResult.value : 0;
      const activeUsers = activeUsersResult.status === 'fulfilled' ? activeUsersResult.value : 0;
      const monthlyRevenue = monthlyRevenueResult.status === 'fulfilled' ? monthlyRevenueResult.value : 0;
      const runningCampaigns = runningCampaignsResult.status === 'fulfilled' ? runningCampaignsResult.value : 0;

      // Log any failures
      const metricNames = ['Total Users', 'Active Users', 'Monthly Revenue', 'Running Campaigns'];
      const results = [totalUsersResult, activeUsersResult, monthlyRevenueResult, runningCampaignsResult];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`❌ Failed to fetch ${metricNames[index]}:`, result.reason?.message || result.reason);
        }
      });

      const metrics = {
        totalUsers,
        activeUsers,
        monthlyRevenue,
        runningCampaigns
      };

      console.log('✅ Dashboard metrics fetched:', metrics);
      return metrics;

    } catch (error: any) {
      console.error('❌ Error fetching dashboard metrics:', error);
      throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
    }
  }

  /**
   * Get total number of users using the working service
   */
  private async getTotalUsers(): Promise<number> {
    try {
      const stats = await realAdminUserService.getUserStats();
      return stats.totalUsers;
    } catch (error: any) {
      console.warn('⚠️ Failed to get total users, falling back to direct query');
      
      // Fallback to direct query
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return count || 0;
      } catch (fallbackError: any) {
        console.error('❌ Fallback query also failed:', fallbackError);
        return 0;
      }
    }
  }

  /**
   * Get active users (users with subscriptions)
   */
  private async getActiveUsers(): Promise<number> {
    try {
      const stats = await realAdminUserService.getUserStats();
      return stats.premiumUsers + stats.giftedUsers;
    } catch (error: any) {
      console.warn('⚠️ Failed to get active users, falling back to direct query');
      
      // Fallback to direct query
      try {
        const { count, error } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('subscribed', true);
        
        if (error) throw error;
        return count || 0;
      } catch (fallbackError: any) {
        console.error('❌ Fallback query also failed:', fallbackError);
        return 0;
      }
    }
  }

  /**
   * Get monthly revenue
   */
  private async getMonthlyRevenue(): Promise<number> {
    try {
      const stats = await realAdminUserService.getUserStats();
      return stats.totalRevenue;
    } catch (error: any) {
      console.warn('⚠️ Failed to get revenue from user stats, falling back to direct query');
      
      // Fallback to direct query
      try {
        const currentMonth = new Date();
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        const { data, error } = await supabase
          .from('orders')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', firstDay.toISOString())
          .lte('created_at', lastDay.toISOString());

        if (error) throw error;
        
        const revenue = data?.reduce((sum, order) => sum + order.amount, 0) || 0;
        return revenue;
      } catch (fallbackError: any) {
        console.error('❌ Fallback revenue query also failed:', fallbackError);
        return 0;
      }
    }
  }

  /**
   * Get running campaigns count
   */
  private async getRunningCampaigns(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running');

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.warn('⚠️ Failed to get running campaigns:', error);
      return 0;
    }
  }

  /**
   * Fetch dashboard metrics with trends (placeholder for now)
   */
  async fetchDashboardMetricsWithTrends(): Promise<AdminDashboardMetrics> {
    // For now, just return the basic metrics
    // In the future, this could include trend calculations
    return this.fetchDashboardMetrics();
  }
}

export const workingAdminDashboardMetricsService = new WorkingAdminDashboardMetricsService();
