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
      // Enhanced error debugging
      console.error('Raw error object:', err);
      console.error('Error type:', typeof err);
      console.error('Error constructor:', err?.constructor?.name);
      console.error('Error keys:', err ? Object.keys(err) : 'N/A');

      let errorMessage = 'Unknown error occurred';

      if (typeof err === 'string') {
        errorMessage = err.length > 0 ? err : 'Empty error string';
      } else if (err?.message !== undefined) {
        if (typeof err.message === 'string' && err.message.trim() !== '') {
          errorMessage = err.message;
        } else {
          errorMessage = 'Empty error message from error object';
        }
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.toString && typeof err.toString === 'function') {
        try {
          const stringified = err.toString();
          errorMessage = stringified !== '[object Object]' ? stringified : 'Generic object error';
        } catch (toStringError) {
          errorMessage = 'Error toString() failed';
        }
      }

      console.error('Processed error message:', errorMessage);

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
