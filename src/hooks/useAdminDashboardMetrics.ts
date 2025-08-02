import { useState, useEffect } from 'react';
import { adminDashboardMetricsService, AdminDashboardMetrics, MetricsError } from '@/services/adminDashboardMetrics';

interface UseAdminDashboardMetricsResult {
  metrics: AdminDashboardMetrics | null;
  loading: boolean;
  error: MetricsError | null;
  refetch: () => Promise<void>;
}

export function useAdminDashboardMetrics(): UseAdminDashboardMetricsResult {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MetricsError | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminDashboardMetricsService.fetchDashboardMetricsWithTrends();
      setMetrics(data);
    } catch (err: any) {
      const errorMessage = err?.message || err?.error?.message || err?.toString?.() || 'Unknown error occurred';
      console.error('Error fetching admin dashboard metrics:', errorMessage, err);
      setError({
        message: `Failed to load dashboard metrics: ${errorMessage}`,
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchMetrics();
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch
  };
}
