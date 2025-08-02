import { supabase } from '@/integrations/supabase/client';

export interface SimpleMetrics {
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  blogPosts: number;
  recentSignups: number;
  totalRevenue: number;
}

class SimplifiedMetricsService {
  
  /**
   * Get total users - direct query
   */
  private async getTotalUsers(): Promise<number> {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  /**
   * Get active users - direct query  
   */
  private async getActiveUsers(): Promise<number> {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('is_premium.eq.true,subscription_status.eq.active');
    return count || 0;
  }

  /**
   * Get blog posts count
   */
  private async getBlogPosts(): Promise<number> {
    const { count } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  /**
   * Get recent signups (last 7 days)
   */
  private async getRecentSignups(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    return count || 0;
  }

  /**
   * Get monthly revenue
   */
  private async getMonthlyRevenue(): Promise<number> {
    const currentDate = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const { data } = await supabase
      .from('orders')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', firstDay.toISOString());
    
    return data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
  }

  /**
   * Get total revenue
   */
  private async getTotalRevenue(): Promise<number> {
    const { data } = await supabase
      .from('orders')
      .select('amount')
      .eq('status', 'completed');
    
    return data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
  }

  /**
   * Get all metrics at once - simplified
   */
  async getAllMetrics(): Promise<SimpleMetrics> {
    const [
      totalUsers,
      activeUsers,
      blogPosts,
      recentSignups,
      monthlyRevenue,
      totalRevenue
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getActiveUsers(),
      this.getBlogPosts(),
      this.getRecentSignups(),
      this.getMonthlyRevenue(),
      this.getTotalRevenue()
    ]);

    return {
      totalUsers,
      activeUsers,
      blogPosts,
      recentSignups,
      monthlyRevenue,
      totalRevenue
    };
  }
}

export const simplifiedMetrics = new SimplifiedMetricsService();
