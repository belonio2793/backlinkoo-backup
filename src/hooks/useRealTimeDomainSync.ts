import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NetlifyDomainSyncService } from '@/services/netlifyDomainSyncService';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'error';
  user_id: string;
  netlify_verified: boolean;
  created_at: string;
  netlify_site_id?: string;
  error_message?: string;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  autoSyncEnabled: boolean;
  syncInProgress: boolean;
}

export function useRealTimeDomainSync(userId: string | undefined) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    lastSync: null,
    autoSyncEnabled: true,
    syncInProgress: false
  });
  const [loading, setLoading] = useState(true);

  // Load initial domains
  const loadDomains = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await NetlifyDomainSyncService.getUserDomains(userId);
      if (result.success) {
        setDomains(result.domains || []);
      }
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Perform sync with Netlify
  const performSync = useCallback(async (showToast = true) => {
    if (!userId || syncStatus.syncInProgress) return;

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      const result = await NetlifyDomainSyncService.performFullSync(userId);
      
      if (result.success) {
        if (showToast) {
          toast.success(`✅ Sync completed: ${result.message}`);
        }
        
        // Reload domains after sync
        await loadDomains();
        
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          isOnline: true
        }));
      } else {
        if (showToast) {
          toast.error(`❌ Sync failed: ${result.message}`);
        }
        setSyncStatus(prev => ({ ...prev, isOnline: false }));
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      if (showToast) {
        toast.error(`Sync error: ${error.message}`);
      }
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [userId, syncStatus.syncInProgress, loadDomains]);

  // Test connection status
  const testConnection = useCallback(async () => {
    try {
      const result = await NetlifyDomainSyncService.testConnection();
      setSyncStatus(prev => ({ ...prev, isOnline: result.success }));
      return result.success;
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      return false;
    }
  }, []);

  // Add domain
  const addDomain = useCallback(async (domain: string) => {
    if (!userId) return { success: false, message: 'User not authenticated' };

    try {
      const result = await NetlifyDomainSyncService.addDomain(domain, userId);
      
      if (result.success) {
        // Reload domains to get the new one
        await loadDomains();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = `Failed to add domain: ${error.message}`;
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [userId, loadDomains]);

  // Remove domain
  const removeDomain = useCallback(async (domainId: string) => {
    if (!userId) return { success: false, message: 'User not authenticated' };

    try {
      const result = await NetlifyDomainSyncService.removeDomain(domainId, userId);
      
      if (result.success) {
        // Remove from local state immediately for better UX
        setDomains(prev => prev.filter(d => d.id !== domainId));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = `Failed to remove domain: ${error.message}`;
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [userId]);

  // Auto-sync functionality
  useEffect(() => {
    if (!userId || !syncStatus.autoSyncEnabled) return;

    // Initial connection test
    testConnection();

    // Initial load
    loadDomains();

    // Auto-sync every 5 minutes
    const autoSyncInterval = setInterval(() => {
      if (syncStatus.autoSyncEnabled && !syncStatus.syncInProgress) {
        performSync(false); // Don't show toast for auto-sync
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(autoSyncInterval);
  }, [userId, syncStatus.autoSyncEnabled]);

  // Real-time subscription to domain changes
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Setting up real-time domain subscription...');

    const subscription = supabase
      .channel('domains_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domains',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📡 Real-time domain change:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              const newDomain = payload.new as Domain;
              setDomains(prev => {
                // Check if domain already exists to prevent duplicates
                const exists = prev.some(d => d.id === newDomain.id);
                if (exists) return prev;
                return [newDomain, ...prev];
              });
              break;
              
            case 'UPDATE':
              const updatedDomain = payload.new as Domain;
              setDomains(prev => 
                prev.map(d => d.id === updatedDomain.id ? updatedDomain : d)
              );
              break;
              
            case 'DELETE':
              const deletedId = payload.old.id;
              setDomains(prev => prev.filter(d => d.id !== deletedId));
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up real-time domain subscription...');
      subscription.unsubscribe();
    };
  }, [userId]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (userId && syncStatus.autoSyncEnabled) {
        performSync(false);
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, syncStatus.autoSyncEnabled, performSync]);

  // Toggle auto-sync
  const toggleAutoSync = useCallback((enabled: boolean) => {
    setSyncStatus(prev => ({ ...prev, autoSyncEnabled: enabled }));
    
    if (enabled) {
      toast.success('🔄 Auto-sync enabled');
      if (userId) {
        performSync(false);
      }
    } else {
      toast.info('⏸️ Auto-sync disabled');
    }
  }, [userId, performSync]);

  return {
    domains,
    syncStatus,
    loading,
    loadDomains,
    performSync,
    testConnection,
    addDomain,
    removeDomain,
    toggleAutoSync
  };
}
