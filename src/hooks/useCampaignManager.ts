import { useState, useCallback } from 'react';
import { Campaign } from '@/components/automation/CampaignForm';
import { toast } from 'sonner';

export function useCampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const createCampaign = useCallback((campaignData: Omit<Campaign, 'id' | 'createdAt' | 'linksBuilt'>) => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      linksBuilt: 0
    };

    setCampaigns(prev => [...prev, newCampaign]);
    
    toast.success('Campaign Created', {
      description: `${campaignData.name} has been ${campaignData.status === 'active' ? 'created and started' : 'created as draft'}`
    });

    return newCampaign;
  }, []);

  const toggleCampaign = useCallback((campaignId: string) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        
        toast.success(
          newStatus === 'active' ? 'Campaign Started' : 'Campaign Paused',
          {
            description: `${campaign.name} has been ${newStatus === 'active' ? 'started' : 'paused'}`
          }
        );

        return { ...campaign, status: newStatus };
      }
      return campaign;
    }));
  }, []);

  const deleteCampaign = useCallback((campaignId: string) => {
    setCampaigns(prev => {
      const campaign = prev.find(c => c.id === campaignId);
      if (campaign) {
        toast.success('Campaign Deleted', {
          description: `${campaign.name} has been permanently deleted`
        });
      }
      return prev.filter(c => c.id !== campaignId);
    });
  }, []);

  const updateCampaignProgress = useCallback((campaignId: string, newLinksBuilt: number) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        return { ...campaign, linksBuilt: newLinksBuilt };
      }
      return campaign;
    }));
  }, []);

  const getActiveCampaigns = useCallback(() => {
    return campaigns.filter(campaign => campaign.status === 'active');
  }, [campaigns]);

  const getCampaignsByEngine = useCallback((engine: string) => {
    return campaigns.filter(campaign => campaign.engine === engine);
  }, [campaigns]);

  const getTotalLinksBuilt = useCallback(() => {
    return campaigns.reduce((total, campaign) => total + campaign.linksBuilt, 0);
  }, [campaigns]);

  const getActiveCampaignCount = useCallback(() => {
    return campaigns.filter(campaign => campaign.status === 'active').length;
  }, [campaigns]);

  return {
    campaigns,
    createCampaign,
    toggleCampaign,
    deleteCampaign,
    updateCampaignProgress,
    getActiveCampaigns,
    getCampaignsByEngine,
    getTotalLinksBuilt,
    getActiveCampaignCount
  };
}
