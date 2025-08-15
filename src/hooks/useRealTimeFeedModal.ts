import { useState, useEffect, useCallback } from 'react';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';

interface RealTimeFeedState {
  isVisible: boolean;
  isMinimized: boolean;
  activeCampaigns: Campaign[];
  lastCheck: Date | null;
}

export const useRealTimeFeedModal = () => {
  const [state, setState] = useState<RealTimeFeedState>({
    isVisible: false,
    isMinimized: false,
    activeCampaigns: [],
    lastCheck: null
  });

  const orchestrator = getOrchestrator();

  // Check for active campaigns
  const checkActiveCampaigns = useCallback(async () => {
    try {
      const campaigns = await orchestrator.getUserCampaigns();
      const activeCampaigns = campaigns.filter(campaign => 
        ['active', 'pending', 'draft'].includes(campaign.status)
      );

      setState(prev => {
        const shouldAutoShow = 
          activeCampaigns.length > 0 && 
          prev.activeCampaigns.length === 0 && 
          !prev.isVisible;

        return {
          ...prev,
          activeCampaigns,
          lastCheck: new Date(),
          isVisible: shouldAutoShow || prev.isVisible
        };
      });

    } catch (error) {
      console.error('Error checking active campaigns:', error);
    }
  }, [orchestrator]);

  // Auto-check for campaigns periodically
  useEffect(() => {
    // Initial check
    checkActiveCampaigns();

    // Check every 30 seconds
    const interval = setInterval(checkActiveCampaigns, 30000);

    return () => clearInterval(interval);
  }, [checkActiveCampaigns]);

  // Auto-hide modal when no active campaigns
  useEffect(() => {
    if (state.activeCampaigns.length === 0 && state.isVisible) {
      // Wait 10 seconds before auto-hiding
      const timeout = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isVisible: false,
          isMinimized: false
        }));
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [state.activeCampaigns.length, state.isVisible]);

  const showModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: true,
      isMinimized: false
    }));
  }, []);

  const hideModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      isMinimized: false
    }));
  }, []);

  const minimizeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }));
  }, []);

  const forceRefresh = useCallback(() => {
    checkActiveCampaigns();
  }, [checkActiveCampaigns]);

  return {
    isVisible: state.isVisible,
    isMinimized: state.isMinimized,
    activeCampaigns: state.activeCampaigns,
    hasActiveCampaigns: state.activeCampaigns.length > 0,
    lastCheck: state.lastCheck,
    showModal,
    hideModal,
    minimizeModal,
    forceRefresh
  };
};
