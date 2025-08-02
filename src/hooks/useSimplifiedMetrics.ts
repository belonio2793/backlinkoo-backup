import { useState, useEffect } from 'react';
import { simplifiedMetrics, SimpleMetrics } from '@/services/simplifiedMetrics';

interface UseSimplifiedMetricsResult {
  metrics: SimpleMetrics | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useSimplifiedMetrics(): UseSimplifiedMetricsResult {
  const [metrics, setMetrics] = useState<SimpleMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await simplifiedMetrics.getAllMetrics();
      setMetrics(data);
    } catch (error) {
      console.warn('Metrics fetch error:', error);
      // Set default values on error
      setMetrics({
        totalUsers: 0,
        activeUsers: 0,
        monthlyRevenue: 0,
        blogPosts: 0,
        recentSignups: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    metrics,
    loading,
    refetch
  };
}
