import { useState, useEffect } from 'react';
import { directSupabaseMetrics, DirectMetrics, SupabaseTableInfo } from '@/services/directSupabaseMetrics';

interface UseDirectMetricsResult {
  metrics: DirectMetrics | null;
  loading: boolean;
  error: string | null;
  tableInfo: SupabaseTableInfo[] | null;
  connected: boolean;
  refetch: () => Promise<void>;
}

export function useDirectSupabaseMetrics(): UseDirectMetricsResult {
  const [metrics, setMetrics] = useState<DirectMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<SupabaseTableInfo[] | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching direct Supabase data...');

      // Test connection first
      const connectionTest = await directSupabaseMetrics.testConnection();
      setConnected(connectionTest.connected);
      setTableInfo(connectionTest.tables || null);

      if (!connectionTest.connected) {
        setError(connectionTest.error || 'Database connection failed');
        return;
      }

      // Fetch metrics
      const metricsData = await directSupabaseMetrics.getAllMetrics();
      setMetrics(metricsData);
      
      console.log('✅ Direct metrics loaded successfully:', metricsData);
    } catch (err: any) {
      console.error('❌ Error in useDirectSupabaseMetrics:', err);
      setError(err.message || 'Failed to fetch metrics');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    loading,
    error,
    tableInfo,
    connected,
    refetch
  };
}
