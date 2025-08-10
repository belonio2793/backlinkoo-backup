/**
 * Custom hook for managing campaign counters
 * Provides easy integration with the campaign counter service
 */

import { useState, useEffect, useCallback } from 'react';
import { campaignCounterService, type CampaignCounters, type GlobalCounters } from '@/services/campaignCounterService';

export interface UseCampaignCountersOptions {
  campaignId?: string;
  autoStart?: boolean;
  updateInterval?: number;
}

export interface UseCampaignCountersReturn {
  // Counter data
  counters: CampaignCounters | null;
  globalCounters: GlobalCounters;
  
  // Actions
  initializeCampaign: (campaignId: string, status?: 'active' | 'paused' | 'saved') => void;
  updateStatus: (campaignId: string, status: 'active' | 'paused' | 'saved') => void;
  deleteCampaign: (campaignId: string) => void;
  
  // State
  isLoading: boolean;
  lastUpdate: Date;
  
  // Reporting
  getReportingData: () => ReturnType<typeof campaignCounterService.getReportingData>;
}

export function useCampaignCounters(options: UseCampaignCountersOptions = {}): UseCampaignCountersReturn {
  const { campaignId, autoStart = false, updateInterval = 30000 } = options;
  
  const [counters, setCounters] = useState<CampaignCounters | null>(null);
  const [globalCounters, setGlobalCounters] = useState<GlobalCounters>(
    campaignCounterService.getGlobalCounters()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Update counters from service
  const updateCounters = useCallback(() => {
    setIsLoading(true);
    
    try {
      if (campaignId) {
        const campaignCounters = campaignCounterService.getCampaignCounters(campaignId);
        setCounters(campaignCounters);
      }
      
      const global = campaignCounterService.getGlobalCounters();
      setGlobalCounters(global);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to update counters:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  // Initialize campaign counters
  const initializeCampaign = useCallback((
    id: string, 
    status: 'active' | 'paused' | 'saved' = 'saved'
  ) => {
    setIsLoading(true);
    
    try {
      const newCounters = campaignCounterService.initializeCampaign(id, status);
      
      if (id === campaignId) {
        setCounters(newCounters);
      }
      
      const global = campaignCounterService.getGlobalCounters();
      setGlobalCounters(global);
      setLastUpdate(new Date());
      
      console.log(`✅ Initialized campaign counters for ${id} with status: ${status}`);
    } catch (error) {
      console.error('Failed to initialize campaign:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  // Update campaign status
  const updateStatus = useCallback((
    id: string, 
    status: 'active' | 'paused' | 'saved'
  ) => {
    try {
      campaignCounterService.updateCampaignStatus(id, status);
      
      if (id === campaignId) {
        const updatedCounters = campaignCounterService.getCampaignCounters(id);
        setCounters(updatedCounters);
      }
      
      const global = campaignCounterService.getGlobalCounters();
      setGlobalCounters(global);
      setLastUpdate(new Date());
      
      console.log(`🔄 Updated campaign ${id} status to: ${status}`);
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  }, [campaignId]);

  // Delete campaign
  const deleteCampaign = useCallback((id: string) => {
    try {
      campaignCounterService.deleteCampaign(id);
      
      if (id === campaignId) {
        setCounters(null);
      }
      
      const global = campaignCounterService.getGlobalCounters();
      setGlobalCounters(global);
      setLastUpdate(new Date());
      
      console.log(`🗑️ Deleted campaign counters for ${id}`);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  }, [campaignId]);

  // Get reporting data
  const getReportingData = useCallback(() => {
    return campaignCounterService.getReportingData();
  }, []);

  // Auto-start effect
  useEffect(() => {
    if (campaignId && autoStart) {
      // Check if campaign already exists
      const existingCounters = campaignCounterService.getCampaignCounters(campaignId);
      if (!existingCounters) {
        initializeCampaign(campaignId, 'saved');
      } else {
        setCounters(existingCounters);
      }
    }
  }, [campaignId, autoStart, initializeCampaign]);

  // Periodic updates
  useEffect(() => {
    // Initial load
    updateCounters();

    // Set up interval for updates
    const interval = setInterval(updateCounters, updateInterval);

    return () => clearInterval(interval);
  }, [updateCounters, updateInterval]);

  // Campaign-specific updates
  useEffect(() => {
    if (campaignId) {
      updateCounters();
    }
  }, [campaignId, updateCounters]);

  return {
    counters,
    globalCounters,
    initializeCampaign,
    updateStatus,
    deleteCampaign,
    isLoading,
    lastUpdate,
    getReportingData
  };
}

/**
 * Hook for getting all campaign counters
 */
export function useAllCampaignCounters(updateInterval: number = 30000) {
  const [allCounters, setAllCounters] = useState<CampaignCounters[]>([]);
  const [globalCounters, setGlobalCounters] = useState<GlobalCounters>(
    campaignCounterService.getGlobalCounters()
  );
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const updateAllCounters = useCallback(() => {
    try {
      const all = campaignCounterService.getAllCampaignCounters();
      const global = campaignCounterService.getGlobalCounters();
      
      setAllCounters(all);
      setGlobalCounters(global);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to update all counters:', error);
    }
  }, []);

  useEffect(() => {
    // Initial load
    updateAllCounters();

    // Set up interval for updates
    const interval = setInterval(updateAllCounters, updateInterval);

    return () => clearInterval(interval);
  }, [updateAllCounters, updateInterval]);

  return {
    allCounters,
    globalCounters,
    lastUpdate,
    refresh: updateAllCounters
  };
}

/**
 * Hook for reporting data
 */
export function useCampaignReporting(updateInterval: number = 60000) {
  const [reportingData, setReportingData] = useState(
    campaignCounterService.getReportingData()
  );
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const updateReporting = useCallback(() => {
    try {
      const data = campaignCounterService.getReportingData();
      setReportingData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to update reporting data:', error);
    }
  }, []);

  useEffect(() => {
    // Initial load
    updateReporting();

    // Set up interval for updates
    const interval = setInterval(updateReporting, updateInterval);

    return () => clearInterval(interval);
  }, [updateReporting, updateInterval]);

  return {
    reportingData,
    lastUpdate,
    refresh: updateReporting
  };
}
