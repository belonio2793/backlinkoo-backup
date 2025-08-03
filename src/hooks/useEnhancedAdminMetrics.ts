import { useState, useEffect, useCallback } from 'react';
import { adminDataSyncService, type RealTimeAdminData } from '@/services/adminDataSyncService';
import { unifiedAdminMetrics, type UnifiedAdminMetrics } from '@/services/unifiedAdminMetrics';

export interface EnhancedAdminMetrics extends UnifiedAdminMetrics {
  // Real-time data
  realTimeData: RealTimeAdminData | null;
  
  // Enhanced metrics
  userGrowthTrend: 'up' | 'down' | 'stable';
  revenueTrend: 'up' | 'down' | 'stable';
  systemHealthScore: number; // 0-100
  
  // Status indicators
  isRealTime: boolean;
  lastUpdate: Date | null;
  syncStatus: 'syncing' | 'synced' | 'error' | 'offline';
}

interface UseEnhancedAdminMetricsResult {
  metrics: EnhancedAdminMetrics | null;
  loading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
  toggleRealTime: () => void;
  getSyncStatus: () => any;
}

export function useEnhancedAdminMetrics(): UseEnhancedAdminMetricsResult {
  const [metrics, setMetrics] = useState<EnhancedAdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  /**
   * Initialize the enhanced metrics system
   */
  const initializeMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Initializing enhanced admin metrics...');

      // Initialize the data sync service
      const initialized = await adminDataSyncService.initialize();
      
      if (!initialized) {
        throw new Error('Failed to initialize admin data sync service');
      }

      // Get initial unified metrics
      const unifiedData = await unifiedAdminMetrics.getAllMetrics();
      
      // Get real-time data
      const realTimeData = await adminDataSyncService.performFullSync();

      // Create enhanced metrics
      const enhancedMetrics = createEnhancedMetrics(unifiedData, realTimeData);
      
      setMetrics(enhancedMetrics);
      setIsRealTimeActive(true);

      console.log('✅ Enhanced admin metrics initialized');

    } catch (err: any) {
      console.error('❌ Failed to initialize enhanced metrics:', err);
      setError(err.message || 'Failed to initialize enhanced metrics');
      
      // Try to provide fallback data
      try {
        const fallbackData = await unifiedAdminMetrics.getAllMetrics();
        const fallbackMetrics = createEnhancedMetrics(fallbackData, null);
        setMetrics(fallbackMetrics);
      } catch (fallbackError) {
        console.error('❌ Fallback metrics also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create enhanced metrics from unified and real-time data
   */
  const createEnhancedMetrics = (
    unifiedData: UnifiedAdminMetrics, 
    realTimeData: RealTimeAdminData | null
  ): EnhancedAdminMetrics => {
    
    // Calculate trends (simplified logic)
    const userGrowthTrend = calculateTrend(unifiedData.recentSignups, unifiedData.totalUsers * 0.1);
    const revenueTrend = calculateTrend(unifiedData.monthlyRevenue, unifiedData.totalRevenue * 0.2);
    
    // Calculate system health score
    const systemHealthScore = calculateSystemHealthScore(unifiedData, realTimeData);

    return {
      ...unifiedData,
      realTimeData,
      userGrowthTrend,
      revenueTrend,
      systemHealthScore,
      isRealTime: !!realTimeData,
      lastUpdate: realTimeData?.lastSyncTime || new Date(),
      syncStatus: realTimeData ? 'synced' : (error ? 'error' : 'offline')
    };
  };

  /**
   * Calculate trend direction
   */
  const calculateTrend = (current: number, baseline: number): 'up' | 'down' | 'stable' => {
    const ratio = baseline > 0 ? current / baseline : 1;
    
    if (ratio > 1.1) return 'up';
    if (ratio < 0.9) return 'down';
    return 'stable';
  };

  /**
   * Calculate system health score (0-100)
   */
  const calculateSystemHealthScore = (
    unified: UnifiedAdminMetrics, 
    realTime: RealTimeAdminData | null
  ): number => {
    let score = 0;
    
    // Database connectivity (30 points)
    if (unified.databaseConnected) score += 30;
    
    // Table accessibility (20 points)
    if (unified.tablesAccessible > 5) score += 20;
    else if (unified.tablesAccessible > 2) score += 10;
    
    // Services online (20 points)
    if (realTime) {
      if (realTime.servicesOnline > 5) score += 20;
      else if (realTime.servicesOnline > 2) score += 10;
    }
    
    // Data recency (15 points)
    if (realTime && realTime.lastSyncTime) {
      const timeDiff = Date.now() - realTime.lastSyncTime.getTime();
      if (timeDiff < 60000) score += 15; // Less than 1 minute
      else if (timeDiff < 300000) score += 10; // Less than 5 minutes
      else if (timeDiff < 900000) score += 5; // Less than 15 minutes
    }
    
    // User activity (15 points)
    if (unified.totalUsers > 0) {
      if (unified.recentSignups > 0) score += 15;
      else if (unified.activeUsers > 0) score += 10;
    }
    
    return Math.min(score, 100);
  };

  /**
   * Refresh all metrics
   */
  const refreshMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Refreshing enhanced admin metrics...');

      // Force refresh the data sync service
      const realTimeData = await adminDataSyncService.refreshAll();
      
      // Get fresh unified metrics
      const unifiedData = await unifiedAdminMetrics.getAllMetrics(true);

      // Update enhanced metrics
      const enhancedMetrics = createEnhancedMetrics(unifiedData, realTimeData);
      setMetrics(enhancedMetrics);

      console.log('✅ Enhanced metrics refreshed');

    } catch (err: any) {
      console.error('❌ Failed to refresh metrics:', err);
      setError(err.message || 'Failed to refresh metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle real-time updates
   */
  const toggleRealTime = useCallback(() => {
    if (isRealTimeActive) {
      adminDataSyncService.stopRealTimeSync();
      setIsRealTimeActive(false);
      console.log('⏸️ Real-time updates paused');
    } else {
      adminDataSyncService.startRealTimeSync();
      setIsRealTimeActive(true);
      console.log('▶️ Real-time updates resumed');
    }
  }, [isRealTimeActive]);

  /**
   * Get sync status information
   */
  const getSyncStatus = useCallback(() => {
    return adminDataSyncService.getSyncStatus();
  }, []);

  // Set up real-time data subscription
  useEffect(() => {
    const unsubscribe = adminDataSyncService.subscribe((realTimeData: RealTimeAdminData) => {
      setMetrics(currentMetrics => {
        if (!currentMetrics) return null;
        
        return createEnhancedMetrics(currentMetrics, realTimeData);
      });
    });

    return unsubscribe;
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeMetrics();
    
    // Cleanup on unmount
    return () => {
      adminDataSyncService.stopRealTimeSync();
    };
  }, [initializeMetrics]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics,
    toggleRealTime,
    getSyncStatus
  };
}
