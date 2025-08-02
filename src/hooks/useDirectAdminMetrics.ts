import { useState, useEffect } from 'react';
import { directAdminMetricsService, AdminDashboardMetrics, MetricsError } from '@/services/directAdminMetrics';

interface UseDirectAdminMetricsResult {
  metrics: AdminDashboardMetrics | null;
  loading: boolean;
  error: MetricsError | null;
  refetch: () => Promise<void>;
}

export function useDirectAdminMetrics(): UseDirectAdminMetricsResult {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MetricsError | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching direct admin metrics...');
      const data = await directAdminMetricsService.fetchDashboardMetricsWithTrends();
      setMetrics(data);
      console.log('✅ Direct metrics loaded successfully:', data);
    } catch (err: any) {
      console.error('❌ Error fetching direct metrics:', err);

      const errorMessage = err?.message || 'Failed to load admin metrics';
      
      setError({
        message: errorMessage,
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
    // Only fetch if we have instant admin access
    if (sessionStorage.getItem('instant_admin') === 'true') {
      fetchMetrics();
    } else {
      // For non-instant admin, still try to fetch but with a short timeout
      const timer = setTimeout(fetchMetrics, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch
  };
}
