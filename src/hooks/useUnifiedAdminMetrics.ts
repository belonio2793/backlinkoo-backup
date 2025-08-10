import { useState, useEffect } from 'react';
import { unifiedAdminMetrics, type UnifiedAdminMetrics } from '@/services/unifiedAdminMetrics';

interface UseUnifiedAdminMetricsResult {
  metrics: UnifiedAdminMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useUnifiedAdminMetrics(): UseUnifiedAdminMetricsResult {
  const [metrics, setMetrics] = useState<UnifiedAdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await unifiedAdminMetrics.getAllMetrics(forceRefresh);
      setMetrics(data);
    } catch (err: any) {
      console.error('Failed to fetch unified admin metrics:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
        code: err.code
      });
      setError(err.message || 'Failed to fetch metrics');
      
      // Set default values on error
      setMetrics({
        totalUsers: 0,
        activeUsers: 0,
        recentSignups: 0,
        adminUsers: 0,
        totalBlogPosts: 0,
        publishedBlogPosts: 0,
        trialBlogPosts: 0,
        claimedPosts: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        databaseConnected: false,
        tablesAccessible: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchMetrics(true);
  };

  const clearCache = () => {
    unifiedAdminMetrics.clearCache();
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch,
    clearCache
  };
}
