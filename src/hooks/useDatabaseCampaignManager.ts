import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AutomationDatabaseService } from '@/services/automationDatabaseService';
import type { 
  AutomationCampaign, 
  AutomationCampaignInsert,
  LinkPlacement,
  CampaignFilters,
  LinkFilters,
  DashboardData,
  CampaignResponse
} from '@/types/automationTypes';
import { toast } from 'sonner';
import { getErrorMessage, logError, formatErrorForUser } from '@/utils/errorUtils';

export function useDatabaseCampaignManager() {
  const { user, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([]);
  const [linkPlacements, setLinkPlacements] = useState<LinkPlacement[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load campaigns from database
  const loadCampaigns = useCallback(async (filters?: CampaignFilters) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await AutomationDatabaseService.getCampaigns(user.id, filters);
      
      if (result.success) {
        setCampaigns(result.data || []);
      } else {
        setError(result.error || 'Failed to load campaigns');
        toast.error('Failed to load campaigns', {
          description: formatErrorForUser(result.error)
        });
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Error loading campaigns', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load link placements
  const loadLinkPlacements = useCallback(async (filters?: LinkFilters) => {
    if (!user?.id) return;

    try {
      const result = await AutomationDatabaseService.getLinkPlacements(user.id, filters);

      if (result.success) {
        setLinkPlacements(result.data || []);
      } else {
        console.error('Failed to load link placements:', result.error);
        toast.error('Failed to load link placements', {
          description: formatErrorForUser(result.error) || 'Unknown error occurred'
        });
      }
    } catch (err: any) {
      console.error('Error loading link placements (catch):', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      toast.error('Error loading link placements', {
        description: err.message || 'Unexpected error occurred'
      });
    }
  }, [user?.id]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await AutomationDatabaseService.getDashboardData(user.id);
      
      if (result.success) {
        setDashboardData(result.data || null);
      } else {
        toast.error('Failed to load dashboard data', {
          description: formatErrorForUser(result.error)
        });
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      toast.error('Error loading dashboard data', {
        description: errorMessage
      });
    }
  }, [user?.id]);

  // Create campaign
  const createCampaign = useCallback(async (campaignData: Omit<AutomationCampaignInsert, 'user_id'>) => {
    if (!user?.id) {
      toast.error('Authentication required', {
        description: 'Please sign in to create campaigns'
      });
      return null;
    }

    setLoading(true);

    try {
      const result = await AutomationDatabaseService.createCampaign({
        ...campaignData,
        user_id: user.id
      });

      if (result.success && result.data) {
        setCampaigns(prev => [result.data!, ...prev]);
        
        toast.success('Campaign Created', {
          description: `${result.data.name} has been created successfully`
        });

        // Refresh dashboard data
        loadDashboardData();
        
        return result.data;
      } else {
        toast.error('Failed to create campaign', {
          description: formatErrorForUser(result.error)
        });
        return null;
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      toast.error('Error creating campaign', {
        description: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadDashboardData]);

  // Update campaign
  const updateCampaign = useCallback(async (campaignId: string, updates: Partial<AutomationCampaign>) => {
    if (!user?.id) return false;

    try {
      const result = await AutomationDatabaseService.updateCampaign(campaignId, user.id, updates);

      if (result.success && result.data) {
        setCampaigns(prev => 
          prev.map(campaign => 
            campaign.id === campaignId ? result.data! : campaign
          )
        );

        toast.success('Campaign Updated', {
          description: 'Campaign has been updated successfully'
        });

        return true;
      } else {
        toast.error('Failed to update campaign', {
          description: formatErrorForUser(result.error)
        });
        return false;
      }
    } catch (err: any) {
      logError('Campaign Update', err);
      const errorMessage = formatErrorForUser(err, 'Failed to update campaign');
      toast.error('Error updating campaign', {
        description: errorMessage
      });
      return false;
    }
  }, [user?.id]);

  // Delete campaign
  const deleteCampaign = useCallback(async (campaignId: string) => {
    if (!user?.id) return false;

    try {
      const result = await AutomationDatabaseService.deleteCampaign(campaignId, user.id);

      if (result.success) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
        
        toast.success('Campaign Deleted', {
          description: 'Campaign has been permanently deleted'
        });

        // Refresh dashboard data
        loadDashboardData();
        
        return true;
      } else {
        toast.error('Failed to delete campaign', {
          description: formatErrorForUser(result.error)
        });
        return false;
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      toast.error('Error deleting campaign', {
        description: errorMessage
      });
      return false;
    }
  }, [user?.id, loadDashboardData]);

  // Toggle campaign status
  const toggleCampaign = useCallback(async (campaignId: string) => {
    if (!user?.id) return false;

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return false;

    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    const updates: Partial<AutomationCampaign> = { 
      status: newStatus,
      ...(newStatus === 'active' ? { started_at: new Date().toISOString() } : {})
    };

    return await updateCampaign(campaignId, updates);
  }, [campaigns, updateCampaign, user?.id]);

  // Get campaign by ID with full details
  const getCampaignDetails = useCallback(async (campaignId: string): Promise<CampaignResponse | null> => {
    if (!user?.id) return null;

    try {
      const result = await AutomationDatabaseService.getCampaign(campaignId, user.id);
      
      if (result.success) {
        return result.data || null;
      } else {
        toast.error('Failed to load campaign details', {
          description: formatErrorForUser(result.error)
        });
        return null;
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      toast.error('Error loading campaign details', {
        description: errorMessage
      });
      return null;
    }
  }, [user?.id]);

  // Create link placement
  const createLinkPlacement = useCallback(async (placementData: Omit<LinkPlacement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return null;

    try {
      const result = await AutomationDatabaseService.createLinkPlacement({
        ...placementData,
        user_id: user.id
      });

      if (result.success && result.data) {
        setLinkPlacements(prev => [result.data!, ...prev]);
        
        toast.success('Link Placed', {
          description: `Link placed on ${result.data.source_domain}`
        });

        // Refresh dashboard data
        loadDashboardData();
        
        return result.data;
      } else {
        toast.error('Failed to create link placement', {
          description: formatErrorForUser(result.error)
        });
        return null;
      }
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      toast.error('Error creating link placement', {
        description: errorMessage
      });
      return null;
    }
  }, [user?.id, loadDashboardData]);

  // Simulate link building for a campaign
  const simulateLinkBuilding = useCallback(async (campaignId: string, linkCount: number = 1) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    // Simulate realistic link building with random data
    const placementTypes = ['blog_comment', 'web2_post', 'forum_post', 'social_post', 'profile_link'] as const;
    const domains = ['example.com', 'testsite.org', 'demoblog.net', 'sampleforum.com', 'social-platform.io'];
    
    for (let i = 0; i < linkCount; i++) {
      const anchorText = campaign.anchor_texts[Math.floor(Math.random() * campaign.anchor_texts.length)];
      const placementType = placementTypes[Math.floor(Math.random() * placementTypes.length)];
      const sourceDomain = domains[Math.floor(Math.random() * domains.length)];
      
      await createLinkPlacement({
        campaign_id: campaignId,
        target_domain: new URL(campaign.target_url).hostname,
        source_domain: sourceDomain,
        source_url: `https://${sourceDomain}/post-${Date.now()}`,
        placement_type: placementType,
        anchor_text: anchorText,
        target_url: campaign.target_url,
        content_snippet: `Sample content with link to ${anchorText}`,
        status: Math.random() > 0.1 ? 'live' : 'pending',
        quality_score: Math.floor(Math.random() * 30) + 70,
        domain_authority: Math.floor(Math.random() * 40) + 30,
        page_authority: Math.floor(Math.random() * 50) + 25,
        placement_date: new Date().toISOString(),
        cost: Math.round((Math.random() * 50 + 10) * 100) / 100,
        engine_data: { engine: campaign.engine_type, automated: true }
      });
    }
  }, [campaigns, createLinkPlacement]);

  // Utility functions
  const getActiveCampaigns = useCallback(() => {
    return campaigns.filter(campaign => campaign.status === 'active');
  }, [campaigns]);

  const getCampaignsByEngine = useCallback((engineType: string) => {
    return campaigns.filter(campaign => campaign.engine_type === engineType);
  }, [campaigns]);

  const getTotalLinksBuilt = useCallback(() => {
    return dashboardData?.total_links || 0;
  }, [dashboardData]);

  const getActiveCampaignCount = useCallback(() => {
    return dashboardData?.active_campaigns || 0;
  }, [dashboardData]);

  // Load initial data when user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadCampaigns();
      loadLinkPlacements();
      loadDashboardData();
    }
  }, [isAuthenticated, user?.id, loadCampaigns, loadLinkPlacements, loadDashboardData]);

  return {
    // Data
    campaigns,
    linkPlacements,
    dashboardData,
    loading,
    error,
    
    // Campaign operations
    createCampaign,
    updateCampaign,
    deleteCampaign,
    toggleCampaign,
    getCampaignDetails,
    
    // Link operations
    createLinkPlacement,
    simulateLinkBuilding,
    
    // Data loading
    loadCampaigns,
    loadLinkPlacements,
    loadDashboardData,
    
    // Utility functions
    getActiveCampaigns,
    getCampaignsByEngine,
    getTotalLinksBuilt,
    getActiveCampaignCount
  };
}
