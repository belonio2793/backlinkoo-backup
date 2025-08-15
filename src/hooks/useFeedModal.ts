import { useState, useCallback } from 'react';
import { type Campaign } from '@/services/automationOrchestrator';

interface FeedModalState {
  isOpen: boolean;
  activeCampaign: Campaign | null;
  isCreating: boolean;
}

export const useFeedModal = () => {
  const [state, setState] = useState<FeedModalState>({
    isOpen: false,
    activeCampaign: null,
    isCreating: false
  });

  const openFeedForCampaign = useCallback((campaign: Campaign) => {
    setState({
      isOpen: true,
      activeCampaign: campaign,
      isCreating: false
    });
  }, []);

  const openFeedForCreation = useCallback(() => {
    setState({
      isOpen: true,
      activeCampaign: null,
      isCreating: true
    });
  }, []);

  const updateActiveCampaign = useCallback((campaign: Campaign) => {
    setState(prev => ({
      ...prev,
      activeCampaign: campaign,
      isCreating: false
    }));
  }, []);

  const setCreatingState = useCallback((isCreating: boolean) => {
    setState(prev => ({
      ...prev,
      isCreating
    }));
  }, []);

  const closeFeed = useCallback(() => {
    setState({
      isOpen: false,
      activeCampaign: null,
      isCreating: false
    });
  }, []);

  return {
    isOpen: state.isOpen,
    activeCampaign: state.activeCampaign,
    isCreating: state.isCreating,
    openFeedForCampaign,
    openFeedForCreation,
    updateActiveCampaign,
    setCreatingState,
    closeFeed
  };
};
