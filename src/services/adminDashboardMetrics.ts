import { supabase } from '@/integrations/supabase/client';

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

class AdminDashboardMetricsService {
  
  /**
   * Fetch all admin dashboard metrics
   */
  async fetchDashboardMetrics(): Promise<AdminDashboardMetrics> {
    try {
      // Fetch all metrics in parallel for better performance
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

      // Extract values or use 0 as fallback
      const totalUsers = totalUsersResult.status === 'fulfilled' ? totalUsersResult.value : 0;
      const activeUsers = activeUsersResult.status === 'fulfilled' ? activeUsersResult.value : 0;
      const monthlyRevenue = monthlyRevenueResult.status === 'fulfilled' ? monthlyRevenueResult.value : 0;
      const runningCampaigns = runningCampaignsResult.status === 'fulfilled' ? runningCampaignsResult.value : 0;

      // Log any failures for debugging with better error formatting
      const metricNames = ['Total Users', 'Active Users', 'Monthly Revenue', 'Running Campaigns'];
      const results = [totalUsersResult, activeUsersResult, monthlyRevenueResult, runningCampaignsResult];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const formattedError = this.formatError(result.reason);
          console.warn(`Failed to fetch ${metricNames[index]}:`, formattedError);
          console.debug(`Raw error for ${metricNames[index]}:`, result.reason);
        }
      });

      return {
        totalUsers,
        activeUsers,
        monthlyRevenue,
        runningCampaigns
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }
  }

  /**
   * Get total number of users from profiles table
   */
  private async getTotalUsers(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        // Handle mock mode gracefully
        if (error.message?.includes('Database not available') || error.message?.includes('Mock mode')) {
          console.warn('Mock database mode - returning demo data for total users');
          return 42; // Demo value for mock mode
        }
        console.error('Error fetching total users:', this.formatError(error));
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('Error in getTotalUsers:', this.formatError(error));
      return 0;
    }
  }

  /**
   * Get number of active subscribers from subscribers table
   */
  private async getActiveUsers(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);

      if (error) {
        // Handle mock mode gracefully
        if (error.message?.includes('Database not available') || error.message?.includes('Mock mode')) {
          console.warn('Mock database mode - returning demo data for active users');
          return 18; // Demo value for mock mode
        }
        console.error('Error fetching active users:', this.formatError(error));
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('Error in getActiveUsers:', this.formatError(error));
      return 0;
    }
  }

  /**
   * Calculate monthly revenue from completed orders in current month
   */
  private async getMonthlyRevenue(): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if (error) {
        // Handle mock mode gracefully
        if (error.message?.includes('Database not available') || error.message?.includes('Mock mode')) {
          console.warn('Mock database mode - returning demo data for monthly revenue');
          return 2847.50; // Demo value for mock mode
        }
        console.error('Error fetching monthly revenue:', this.formatError(error));
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const totalRevenue = data.reduce((sum, order) => sum + (order.amount || 0), 0);
      return Math.round(totalRevenue * 100) / 100; // Round to 2 decimal places
    } catch (error: any) {
      console.error('Error in getMonthlyRevenue:', this.formatError(error));
      return 0;
    }
  }

  /**
   * Get number of running campaigns that aren't completed
   */
  private async getRunningCampaigns(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .gt('credits_used', 0); // Only campaigns that used credits

      if (error) {
        // Handle mock mode gracefully
        if (error.message?.includes('Database not available') || error.message?.includes('Mock mode')) {
          console.warn('Mock database mode - returning demo data for running campaigns');
          return 7; // Demo value for mock mode
        }
        console.error('Error fetching running campaigns:', this.formatError(error));
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('Error in getRunningCampaigns:', this.formatError(error));
      return 0;
    }
  }

  /**
   * Get metrics with previous month comparison for trend calculation
   */
  async fetchDashboardMetricsWithTrends(): Promise<AdminDashboardMetrics> {
    try {
      const [currentMetrics, previousMonthRevenue] = await Promise.allSettled([
        this.fetchDashboardMetrics(),
        this.getPreviousMonthRevenue()
      ]);

      const current = currentMetrics.status === 'fulfilled' ? currentMetrics.value : {
        totalUsers: 0,
        activeUsers: 0,
        monthlyRevenue: 0,
        runningCampaigns: 0
      };

      const previousRevenue = previousMonthRevenue.status === 'fulfilled' ? previousMonthRevenue.value : 0;

      // Calculate revenue change percentage
      let monthlyRevenueChange = 0;
      if (previousRevenue > 0) {
        monthlyRevenueChange = ((current.monthlyRevenue - previousRevenue) / previousRevenue) * 100;
        monthlyRevenueChange = Math.round(monthlyRevenueChange * 10) / 10; // Round to 1 decimal place
      }

      return {
        ...current,
        monthlyRevenueChange
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics with trends:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        monthlyRevenue: 0,
        runningCampaigns: 0
      };
    }
  }

  /**
   * Get previous month's revenue for trend calculation
   */
  private async getPreviousMonthRevenue(): Promise<number> {
    try {
      const now = new Date();
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfPreviousMonth)
        .lte('created_at', endOfPreviousMonth);

      if (error) {
        // Handle mock mode gracefully
        if (error.message?.includes('Database not available') || error.message?.includes('Mock mode')) {
          console.warn('Mock database mode - returning demo data for previous month revenue');
          return 2635.75; // Demo value for mock mode (slightly less than current month)
        }
        console.error('Error fetching previous month revenue:', this.formatError(error));
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const totalRevenue = data.reduce((sum, order) => sum + (order.amount || 0), 0);
      return Math.round(totalRevenue * 100) / 100; // Round to 2 decimal places
    } catch (error: any) {
      console.error('Error in getPreviousMonthRevenue:', this.formatError(error));
      return 0;
    }
  }

  /**
   * Format error object for better logging
   */
  private formatError(error: any): string {
    if (typeof error === 'string') {
      return error.length > 0 ? error : 'Empty error string';
    }

    // Handle null or undefined
    if (!error) {
      return 'Null or undefined error';
    }

    // Check for message property
    if (error?.message !== undefined) {
      if (typeof error.message === 'string' && error.message.trim() !== '') {
        return error.message;
      } else if (typeof error.message === 'string') {
        return 'Empty error message';
      }
    }

    // Check for nested error
    if (error?.error) {
      return this.formatError(error.error);
    }

    // Check for details
    if (error?.details && typeof error.details === 'string' && error.details.trim() !== '') {
      return error.details;
    }

    // Check for code property
    if (error?.code) {
      return `Error code: ${error.code}`;
    }

    // Check for status property
    if (error?.status) {
      return `Status: ${error.status}`;
    }

    // Try to extract meaningful information from the error object
    try {
      const errorKeys = Object.keys(error);
      if (errorKeys.length === 0) {
        return 'Empty error object';
      }

      // Try to find useful properties
      const usefulKeys = errorKeys.filter(key =>
        !['stack', 'name', 'cause'].includes(key) &&
        error[key] !== null &&
        error[key] !== undefined
      );

      if (usefulKeys.length > 0) {
        return JSON.stringify(
          Object.fromEntries(usefulKeys.map(key => [key, error[key]])),
          null,
          2
        );
      }

      return JSON.stringify(error, null, 2);
    } catch (jsonError) {
      return `Error serialization failed: ${error?.constructor?.name || 'Unknown'} object`;
    }
  }
}

export const adminDashboardMetricsService = new AdminDashboardMetricsService();
