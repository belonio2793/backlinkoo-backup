import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveUrlSyncService, LiveUrl, UrlSyncEvent, UiPlacementSubscription } from '@/services/liveUrlSyncService';

interface UseLiveUrlSyncOptions {
  componentId: string;
  filters?: {
    campaign_id?: string;
    status?: string[];
    placement_type?: string[];
  };
  autoSync?: boolean;
  syncInterval?: number; // milliseconds
}

interface LiveUrlSyncState {
  urls: LiveUrl[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  lastSync: Date | null;
  syncStats: {
    total_urls: number;
    synced_urls: number;
    pending_sync: number;
    failed_sync: number;
    last_sync: string | null;
  };
}

export function useLiveUrlSync(options: UseLiveUrlSyncOptions) {
  const { componentId, filters, autoSync = true, syncInterval = 30000 } = options;
  
  const [state, setState] = useState<LiveUrlSyncState>({
    urls: [],
    loading: false,
    syncing: false,
    error: null,
    lastSync: null,
    syncStats: {
      total_urls: 0,
      synced_urls: 0,
      pending_sync: 0,
      failed_sync: 0,
      last_sync: null
    }
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== URL OPERATIONS ====================

  const loadUrls = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const urls = await LiveUrlSyncService.getUrlsForUiComponent(componentId, filters);
      const stats = await LiveUrlSyncService.getUiComponentStats(componentId);

      setState(prev => ({
        ...prev,
        urls,
        loading: false,
        lastSync: new Date(),
        syncStats: stats
      }));

      return urls;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      return [];
    }
  }, [componentId, filters]);

  const createUrl = useCallback(async (urlData: Omit<LiveUrl, 'id' | 'created_at' | 'updated_at'>) => {
    setState(prev => ({ ...prev, syncing: true }));

    try {
      const newUrl = await LiveUrlSyncService.createLiveUrl({
        ...urlData,
        ui_placements: [componentId, ...(urlData.ui_placements || [])]
      });

      if (newUrl) {
        setState(prev => ({
          ...prev,
          urls: [newUrl, ...prev.urls],
          syncing: false
        }));
        return newUrl;
      } else {
        throw new Error('Failed to create URL');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
      return null;
    }
  }, [componentId]);

  const updateUrl = useCallback(async (urlId: string, updates: Partial<LiveUrl>) => {
    setState(prev => ({ ...prev, syncing: true }));

    try {
      const updatedUrl = await LiveUrlSyncService.updateLiveUrl(urlId, updates, componentId);

      if (updatedUrl) {
        setState(prev => ({
          ...prev,
          urls: prev.urls.map(url => url.id === urlId ? updatedUrl : url),
          syncing: false
        }));
        return updatedUrl;
      } else {
        throw new Error('Failed to update URL');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
      return null;
    }
  }, [componentId]);

  const verifyUrl = useCallback(async (
    urlId: string,
    verificationData: {
      verification_status: LiveUrl['verification_status'];
      http_status_code?: number;
      response_time_ms?: number;
      backlink_live?: boolean;
      destination_match?: boolean;
    }
  ) => {
    setState(prev => ({ ...prev, syncing: true }));

    try {
      const success = await LiveUrlSyncService.verifyLiveUrl(urlId, verificationData);

      if (success) {
        // Reload URLs to get updated data
        await loadUrls(false);
        setState(prev => ({ ...prev, syncing: false }));
        return true;
      } else {
        throw new Error('Failed to verify URL');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
      return false;
    }
  }, [loadUrls]);

  const deleteUrl = useCallback(async (urlId: string) => {
    setState(prev => ({ ...prev, syncing: true }));

    try {
      const success = await LiveUrlSyncService.deleteLiveUrl(urlId, componentId);

      if (success) {
        setState(prev => ({
          ...prev,
          urls: prev.urls.filter(url => url.id !== urlId),
          syncing: false
        }));
        return true;
      } else {
        throw new Error('Failed to delete URL');
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
      return false;
    }
  }, [componentId]);

  // ==================== SYNC OPERATIONS ====================

  const manualSync = useCallback(async () => {
    setState(prev => ({ ...prev, syncing: true }));

    try {
      await LiveUrlSyncService.forceSyncAllUrls(componentId);
      await loadUrls(false);
      
      setState(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date()
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
    }
  }, [componentId, loadUrls]);

  const batchSync = useCallback(async (urlIds: string[]) => {
    setState(prev => ({ ...prev, syncing: true }));

    try {
      const result = await LiveUrlSyncService.batchSyncUrls(urlIds, componentId);
      
      // Reload URLs to reflect changes
      await loadUrls(false);
      
      setState(prev => ({
        ...prev,
        syncing: false,
        lastSync: new Date()
      }));

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error.message
      }));
      return { success: 0, failed: urlIds.length };
    }
  }, [componentId, loadUrls]);

  // ==================== REAL-TIME SUBSCRIPTION ====================

  const handleSyncEvent = useCallback((url: LiveUrl, event: UrlSyncEvent) => {
    setState(prev => {
      let updatedUrls = [...prev.urls];

      switch (event.sync_event) {
        case 'created':
          // Add new URL if not already present
          if (!updatedUrls.find(u => u.id === url.id)) {
            updatedUrls = [url, ...updatedUrls];
          }
          break;

        case 'updated':
          // Update existing URL
          updatedUrls = updatedUrls.map(u => u.id === url.id ? url : u);
          break;

        case 'verified':
          // Update verification data
          updatedUrls = updatedUrls.map(u => 
            u.id === url.id ? { ...u, ...event.new_data } : u
          );
          break;

        case 'removed':
          // Remove URL
          updatedUrls = updatedUrls.filter(u => u.id !== url.id);
          break;

        default:
          break;
      }

      return {
        ...prev,
        urls: updatedUrls,
        lastSync: new Date()
      };
    });
  }, []);

  // ==================== EFFECTS ====================

  // Initialize subscription and load initial data
  useEffect(() => {
    const subscription: UiPlacementSubscription = {
      component: componentId,
      callback: handleSyncEvent,
      filters
    };

    // Subscribe to real-time updates
    unsubscribeRef.current = LiveUrlSyncService.subscribeUiComponent(componentId, subscription);

    // Load initial data
    loadUrls();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [componentId, filters, handleSyncEvent, loadUrls]);

  // Auto-sync interval
  useEffect(() => {
    if (autoSync && syncInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        loadUrls(false); // Silent reload
      }, syncInterval);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [autoSync, syncInterval, loadUrls]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      LiveUrlSyncService.cleanup(componentId);
    };
  }, [componentId]);

  // ==================== UTILITY FUNCTIONS ====================

  const getUrlById = useCallback((urlId: string): LiveUrl | undefined => {
    return state.urls.find(url => url.id === urlId);
  }, [state.urls]);

  const getUrlsByStatus = useCallback((status: LiveUrl['status']): LiveUrl[] => {
    return state.urls.filter(url => url.status === status);
  }, [state.urls]);

  const getUrlsByCampaign = useCallback((campaignId: string): LiveUrl[] => {
    return state.urls.filter(url => url.campaign_id === campaignId);
  }, [state.urls]);

  const getUrlsByPlacementType = useCallback((placementType: string): LiveUrl[] => {
    return state.urls.filter(url => url.placement_type === placementType);
  }, [state.urls]);

  const getVerifiedUrls = useCallback((): LiveUrl[] => {
    return state.urls.filter(url => url.verification_status === 'verified' && url.backlink_live);
  }, [state.urls]);

  const getSyncStatus = useCallback(async (urlId: string) => {
    return await LiveUrlSyncService.getUrlSyncStatus(urlId);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await LiveUrlSyncService.getUiComponentStats(componentId);
      setState(prev => ({ ...prev, syncStats: stats }));
      return stats;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return null;
    }
  }, [componentId]);

  // ==================== RETURN INTERFACE ====================

  return {
    // State
    urls: state.urls,
    loading: state.loading,
    syncing: state.syncing,
    error: state.error,
    lastSync: state.lastSync,
    syncStats: state.syncStats,

    // URL Operations
    loadUrls,
    createUrl,
    updateUrl,
    verifyUrl,
    deleteUrl,

    // Sync Operations
    manualSync,
    batchSync,
    refreshStats,

    // Utility Functions
    getUrlById,
    getUrlsByStatus,
    getUrlsByCampaign,
    getUrlsByPlacementType,
    getVerifiedUrls,
    getSyncStatus,

    // Configuration
    componentId,
    filters,
    autoSync
  };
}

// Helper hook for specific campaign URL sync
export function useCampaignUrlSync(campaignId: string, componentId: string) {
  return useLiveUrlSync({
    componentId,
    filters: { campaign_id: campaignId },
    autoSync: true,
    syncInterval: 15000 // 15 seconds for campaign-specific updates
  });
}

// Helper hook for specific placement type sync
export function usePlacementTypeUrlSync(placementType: string, componentId: string) {
  return useLiveUrlSync({
    componentId,
    filters: { placement_type: [placementType] },
    autoSync: true,
    syncInterval: 20000 // 20 seconds for placement type updates
  });
}

// Helper hook for verified URLs only
export function useVerifiedUrlSync(componentId: string) {
  return useLiveUrlSync({
    componentId,
    filters: { status: ['verified'] },
    autoSync: true,
    syncInterval: 60000 // 1 minute for verified URLs
  });
}
