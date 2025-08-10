/**
 * Hook for Predictive Campaign Algorithm with Premium Modal Integration
 * Provides auto-populating values, premium limit enforcement, and modal triggers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { predictiveCampaignAlgorithm, type PredictiveMetrics } from '@/services/predictiveCampaignAlgorithm';
import { campaignCounterService } from '@/services/campaignCounterService';

export interface UsePredictiveCampaignOptions {
  campaignId?: string;
  isPremium?: boolean;
  autoStart?: boolean;
  enablePremiumModal?: boolean;
  updateInterval?: number;
}

export interface UsePredictiveCampaignReturn {
  // Predictive metrics
  predictiveMetrics: PredictiveMetrics | null;
  
  // Actions
  initializePredictive: (campaignId: string, isPremium?: boolean) => void;
  updatePredictive: (campaignId: string, reportingOutputs?: number) => void;
  triggerPremiumCheck: (campaignId: string) => void;
  
  // State
  isLoading: boolean;
  isAtLimit: boolean;
  showPremiumModal: boolean;
  upgradeRecommended: boolean;
  
  // Premium modal controls
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  
  // Utilities
  formatMetric: (value: number, type?: 'number' | 'percentage' | 'currency') => string;
  getPerformanceColor: (score: number) => string;
  getStatusIndicator: (campaignId: string) => {
    status: 'active' | 'paused' | 'saved' | 'limited';
    color: string;
    label: string;
  };
}

export function usePredictiveCampaignAlgorithm(
  options: UsePredictiveCampaignOptions = {}
): UsePredictiveCampaignReturn {
  const { 
    campaignId, 
    isPremium = false, 
    autoStart = false,
    enablePremiumModal = true,
    updateInterval = 30000 
  } = options;

  const [predictiveMetrics, setPredictiveMetrics] = useState<PredictiveMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const premiumCallbackRef = useRef<((campaignId: string, isAtLimit: boolean) => void) | null>(null);

  // Initialize predictive metrics
  const initializePredictive = useCallback((id: string, premium = false) => {
    setIsLoading(true);
    
    try {
      // Ensure campaign exists in counter service first
      let campaignCounters = campaignCounterService.getCampaignCounters(id);
      if (!campaignCounters) {
        campaignCounters = campaignCounterService.initializeCampaign(id, 'saved');
      }

      // Initialize predictive metrics
      const metrics = predictiveCampaignAlgorithm.initializePredictiveMetrics(id, premium);
      
      if (id === campaignId) {
        setPredictiveMetrics(metrics);
      }
      
      console.log(`🧠 Initialized predictive algorithm for campaign ${id}`);
    } catch (error) {
      console.error('Failed to initialize predictive metrics:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  // Update predictive metrics
  const updatePredictive = useCallback((id: string, reportingOutputs?: number) => {
    try {
      predictiveCampaignAlgorithm.updatePredictiveMetrics(id, reportingOutputs);
      
      if (id === campaignId) {
        const updatedMetrics = predictiveCampaignAlgorithm.getPredictiveMetrics(id);
        setPredictiveMetrics(updatedMetrics);
      }
    } catch (error) {
      console.error('Failed to update predictive metrics:', error instanceof Error ? error.message : String(error));
    }
  }, [campaignId]);

  // Trigger premium limit check
  const triggerPremiumCheck = useCallback((id: string) => {
    predictiveCampaignAlgorithm.triggerPremiumLimitCheck(id);
  }, []);

  // Premium modal controls
  const openPremiumModal = useCallback(() => {
    setShowPremiumModal(true);
  }, []);

  const closePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
  }, []);

  // Format metric values
  const formatMetric = useCallback((value: number, type: 'number' | 'percentage' | 'currency' = 'number'): string => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  }, []);

  // Get performance color based on score
  const getPerformanceColor = useCallback((score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }, []);

  // Get status indicator
  const getStatusIndicator = useCallback((id: string) => {
    const counters = campaignCounterService.getCampaignCounters(id);
    const metrics = predictiveCampaignAlgorithm.getPredictiveMetrics(id);
    
    if (metrics?.isAtLimit) {
      return {
        status: 'limited' as const,
        color: 'text-red-600 bg-red-50',
        label: 'LIMIT REACHED'
      };
    }
    
    if (!counters) {
      return {
        status: 'saved' as const,
        color: 'text-gray-600 bg-gray-50',
        label: 'NOT STARTED'
      };
    }
    
    switch (counters.status) {
      case 'active':
        return {
          status: 'active' as const,
          color: 'text-green-600 bg-green-50',
          label: 'ACTIVE'
        };
      case 'paused':
        return {
          status: 'paused' as const,
          color: 'text-yellow-600 bg-yellow-50',
          label: 'PAUSED'
        };
      case 'saved':
        return {
          status: 'saved' as const,
          color: 'text-gray-600 bg-gray-50',
          label: 'SAVED'
        };
      default:
        return {
          status: 'saved' as const,
          color: 'text-gray-600 bg-gray-50',
          label: 'UNKNOWN'
        };
    }
  }, []);

  // Set up premium limit callback
  useEffect(() => {
    if (enablePremiumModal) {
      const callback = (id: string, isAtLimit: boolean) => {
        if (id === campaignId && isAtLimit) {
          setShowPremiumModal(true);
          console.log(`⚠️ Premium limit reached for campaign ${id}`);
        }
      };
      
      premiumCallbackRef.current = callback;
      predictiveCampaignAlgorithm.onPremiumLimitReached(callback);
    }
  }, [campaignId, enablePremiumModal]);

  // Auto-initialize effect
  useEffect(() => {
    if (campaignId && autoStart) {
      const existingMetrics = predictiveCampaignAlgorithm.getPredictiveMetrics(campaignId);
      if (!existingMetrics) {
        initializePredictive(campaignId, isPremium);
      } else {
        setPredictiveMetrics(existingMetrics);
      }
    }
  }, [campaignId, autoStart, isPremium, initializePredictive]);

  // Periodic updates effect
  useEffect(() => {
    if (campaignId) {
      // Initial load
      const metrics = predictiveCampaignAlgorithm.getPredictiveMetrics(campaignId);
      setPredictiveMetrics(metrics);

      // Set up interval for updates
      intervalRef.current = setInterval(() => {
        const counters = campaignCounterService.getCampaignCounters(campaignId);
        if (counters && counters.status === 'active') {
          // Simulate reporting outputs based on activity
          const simulatedOutputs = Math.floor(Math.random() * 3) + 1;
          updatePredictive(campaignId, simulatedOutputs);
        } else {
          // Just refresh the metrics without adding outputs
          const updatedMetrics = predictiveCampaignAlgorithm.getPredictiveMetrics(campaignId);
          setPredictiveMetrics(updatedMetrics);
        }
      }, updateInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [campaignId, updateInterval, updatePredictive]);

  // Computed values
  const isAtLimit = predictiveMetrics?.isAtLimit || false;
  const upgradeRecommended = predictiveMetrics?.upgradeRecommended || false;

  return {
    // Predictive metrics
    predictiveMetrics,
    
    // Actions
    initializePredictive,
    updatePredictive,
    triggerPremiumCheck,
    
    // State
    isLoading,
    isAtLimit,
    showPremiumModal,
    upgradeRecommended,
    
    // Premium modal controls
    openPremiumModal,
    closePremiumModal,
    
    // Utilities
    formatMetric,
    getPerformanceColor,
    getStatusIndicator
  };
}

/**
 * Hook for monitoring all predictive campaigns
 */
export function useAllPredictiveCampaigns(updateInterval: number = 30000) {
  const [allMetrics, setAllMetrics] = useState<Map<string, PredictiveMetrics>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const updateAllMetrics = useCallback(() => {
    try {
      const metrics = predictiveCampaignAlgorithm.getAllPredictiveMetrics();
      setAllMetrics(new Map(metrics));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to update all predictive metrics:', error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    // Initial load
    updateAllMetrics();

    // Set up interval for updates
    const interval = setInterval(updateAllMetrics, updateInterval);

    return () => clearInterval(interval);
  }, [updateAllMetrics, updateInterval]);

  return {
    allMetrics,
    lastUpdate,
    refresh: updateAllMetrics
  };
}

/**
 * Hook for premium limit monitoring across all campaigns
 */
export function usePremiumLimitMonitor() {
  const [limitedCampaigns, setLimitedCampaigns] = useState<string[]>([]);
  const [totalLimitedCampaigns, setTotalLimitedCampaigns] = useState(0);

  const checkAllLimits = useCallback(() => {
    const allMetrics = predictiveCampaignAlgorithm.getAllPredictiveMetrics();
    const limited: string[] = [];
    
    allMetrics.forEach((metrics, campaignId) => {
      if (metrics.isAtLimit) {
        limited.push(campaignId);
      }
    });
    
    setLimitedCampaigns(limited);
    setTotalLimitedCampaigns(limited.length);
  }, []);

  useEffect(() => {
    // Initial check
    checkAllLimits();

    // Set up interval for monitoring
    const interval = setInterval(checkAllLimits, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAllLimits]);

  return {
    limitedCampaigns,
    totalLimitedCampaigns,
    isAnyAtLimit: limitedCampaigns.length > 0,
    refresh: checkAllLimits
  };
}
