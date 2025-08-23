import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import NetlifyApiService from '@/services/netlifyApiService';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  status?: string;
  netlify_verified?: boolean;
  dns_verified?: boolean;
  created_at: string;
  updated_at?: string;
  error_message?: string;
  user_id?: string;
}

interface SyncStatus {
  isMonitoring: boolean;
  lastSync: Date | null;
  syncCount: number;
  errorCount: number;
}

export const useDomainRealTimeSync = (userId?: string) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isMonitoring: false,
    lastSync: null,
    syncCount: 0,
    errorCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Real-time subscription to domain changes
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Setting up real-time domain monitoring...');
    
    setSyncStatus(prev => ({ ...prev, isMonitoring: true }));

    // Subscribe to real-time changes
    const channel = supabase
      .channel('domain-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'domains',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 Real-time domain change detected:', payload);
          
          setSyncStatus(prev => ({
            ...prev,
            lastSync: new Date(),
            syncCount: prev.syncCount + 1
          }));

          // Handle different types of changes
          switch (payload.eventType) {
            case 'INSERT':
              setDomains(prev => [payload.new as Domain, ...prev]);
              toast.success(`Domain ${(payload.new as Domain).domain} added`);
              break;
              
            case 'UPDATE':
              setDomains(prev => prev.map(domain => 
                domain.id === payload.new.id ? payload.new as Domain : domain
              ));
              
              // Show status change notifications
              const updatedDomain = payload.new as Domain;
              if (payload.old?.status !== updatedDomain.status) {
                toast.info(`${updatedDomain.domain} status: ${updatedDomain.status}`);
              }
              break;
              
            case 'DELETE':
              setDomains(prev => prev.filter(domain => domain.id !== payload.old.id));
              toast.info(`Domain ${(payload.old as Domain).domain} removed`);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Disconnecting real-time domain monitoring');
      setSyncStatus(prev => ({ ...prev, isMonitoring: false }));
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Periodic Netlify sync check
  useEffect(() => {
    if (!userId) return;

    const performPeriodicSync = async () => {
      try {
        await checkNetlifySync();
      } catch (error) {
        console.error('Periodic sync error:', error);
        setSyncStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      }
    };

    // Run initial sync
    performPeriodicSync();

    // Set up periodic sync every 5 minutes
    const interval = setInterval(performPeriodicSync, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  // Load initial domains
  const loadDomains = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setDomains(data || []);
    } catch (error: any) {
      console.error('Load domains error:', error);
      toast.error(`Failed to load domains: ${error.message}`);
      setSyncStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check Netlify sync status
  const checkNetlifySync = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('🔍 Checking Netlify sync status...');
      
      const siteInfo = await NetlifyApiService.getSiteInfo();
      
      if (!siteInfo.success) {
        console.warn('Could not check Netlify sync:', siteInfo.error);
        return;
      }

      const netlifyDomains = [
        ...(siteInfo.data?.domain_aliases || []),
        ...(siteInfo.data?.custom_domain ? [siteInfo.data.custom_domain] : [])
      ];

      // Get current database domains
      const { data: dbDomains } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', userId);

      if (!dbDomains) return;

      let updateCount = 0;

      // Check for sync issues and auto-fix
      for (const domain of dbDomains) {
        const inNetlify = netlifyDomains.includes(domain.domain);
        
        // Auto-update verified status if it's wrong
        if (inNetlify && !domain.netlify_verified) {
          await supabase
            .from('domains')
            .update({
              netlify_verified: true,
              error_message: null,
              status: 'active'
            })
            .eq('id', domain.id);
          
          updateCount++;
        } else if (!inNetlify && domain.netlify_verified) {
          await supabase
            .from('domains')
            .update({
              netlify_verified: false,
              error_message: 'Domain not found in Netlify site',
              status: 'error'
            })
            .eq('id', domain.id);
          
          updateCount++;
        }
      }

      if (updateCount > 0) {
        console.log(`✅ Auto-synchronized ${updateCount} domain(s)`);
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date(),
          syncCount: prev.syncCount + updateCount
        }));
      }

    } catch (error: any) {
      console.error('Netlify sync check error:', error);
      setSyncStatus(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  }, [userId]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!userId) return;

    setSyncStatus(prev => ({ ...prev, isMonitoring: true }));
    
    try {
      await Promise.all([
        loadDomains(),
        checkNetlifySync()
      ]);
      
      toast.success('Domains synchronized successfully');
    } catch (error: any) {
      console.error('Manual sync error:', error);
      toast.error(`Sync failed: ${error.message}`);
    }
  }, [userId, loadDomains, checkNetlifySync]);

  // Initialize
  useEffect(() => {
    if (userId) {
      loadDomains();
    }
  }, [userId, loadDomains]);

  return {
    domains,
    syncStatus,
    isLoading,
    actions: {
      triggerSync,
      loadDomains,
      checkNetlifySync
    }
  };
};

export default useDomainRealTimeSync;
