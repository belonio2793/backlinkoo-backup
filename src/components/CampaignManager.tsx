import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Trash2, 
  ExternalLink, 
  Target, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Settings,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';

interface PublishedLink {
  id: string;
  published_url: string;
  platform: string;
  published_at: string;
}

interface CampaignWithLinks extends Campaign {
  automation_published_links: PublishedLink[];
}

interface CampaignManagerProps {
  onStatusUpdate?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ onStatusUpdate }) => {
  const [campaigns, setCampaigns] = useState<CampaignWithLinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const orchestrator = getOrchestrator();

  useEffect(() => {
    loadCampaigns();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadCampaigns, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadCampaigns = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const userCampaigns = await orchestrator.getUserCampaigns();
      
      // Load published links for each campaign
      const campaignsWithLinks = await Promise.all(
        userCampaigns.map(async (campaign) => {
          const campaignWithLinks = await orchestrator.getCampaignWithLinks(campaign.id);
          return campaignWithLinks || { ...campaign, automation_published_links: [] };
        })
      );
      
      setCampaigns(campaignsWithLinks);
      
      if (showRefreshing) {
        onStatusUpdate?.('Campaigns refreshed successfully', 'success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error loading campaigns:', {
        message: errorMessage,
        error: error
      });
      onStatusUpdate?.(`Failed to load campaigns: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCampaigns(true);
  };

  const handlePauseCampaign = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      await orchestrator.pauseCampaign(campaignId);
      await loadCampaigns();
      onStatusUpdate?.('Campaign paused successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error pausing campaign:', {
        message: errorMessage,
        campaignId,
        error: error
      });
      onStatusUpdate?.(`Failed to pause campaign: ${errorMessage}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      await orchestrator.resumeCampaign(campaignId);
      await loadCampaigns();
      onStatusUpdate?.('Campaign resumed successfully', 'success');
    } catch (error) {
      console.error('Error resuming campaign:', error);
      onStatusUpdate?. ('Failed to resume campaign', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string, keyword: string) => {
    if (!confirm(`Are you sure you want to delete the campaign "${keyword}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(campaignId);
    try {
      await orchestrator.deleteCampaign(campaignId);
      await loadCampaigns();
      onStatusUpdate?.(`Campaign "${keyword}" deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      onStatusUpdate?.('Failed to delete campaign', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'publishing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'generating': return <FileText className="w-4 h-4" />;
      case 'publishing': return <ExternalLink className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActiveCampaigns = () => campaigns.filter(c => ['pending', 'generating', 'publishing'].includes(c.status));
  const getCompletedCampaigns = () => campaigns.filter(c => c.status === 'completed');
  const getPausedCampaigns = () => campaigns.filter(c => c.status === 'paused');
  const getFailedCampaigns = () => campaigns.filter(c => c.status === 'failed');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading campaigns...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Activity
            </CardTitle>
            <CardDescription>
              Monitor and control your active campaigns
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{getActiveCampaigns().length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{getCompletedCampaigns().length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{getPausedCampaigns().length}</div>
            <div className="text-sm text-gray-600">Paused</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{getFailedCampaigns().length}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Live Links Section */}
        {campaigns.some(c => c.automation_published_links?.length > 0) && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Live Links ({campaigns.reduce((total, c) => total + (c.automation_published_links?.length || 0), 0)})
            </h4>
            <ScrollArea className="h-32 border rounded-lg bg-gray-50 p-3">
              <div className="space-y-2">
                {campaigns
                  .filter(c => c.automation_published_links?.length > 0)
                  .map(campaign =>
                    campaign.automation_published_links.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">{campaign.keywords?.[0] || campaign.keyword}</span>
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {link.platform}
                            </Badge>
                          </div>
                          <a
                            href={link.published_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block"
                            title={link.published_url}
                          >
                            {link.published_url}
                          </a>
                        </div>
                        <div className="text-gray-500 text-xs ml-2 flex-shrink-0">
                          {new Date(link.published_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
              </div>
            </ScrollArea>
            <Separator className="mt-4 mb-4" />
          </div>
        )}

        {/* Campaigns List */}
        <div className="mb-3">
          <h4 className="font-medium text-sm text-gray-700">Campaign Activity</h4>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No campaigns found</p>
                <p className="text-sm text-gray-500">Create your first campaign to get started</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(campaign.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(campaign.status)}
                            {campaign.status}
                          </div>
                        </Badge>
                        <span className="font-medium">{campaign.keyword}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Target:</strong> {campaign.target_url}</p>
                        <p><strong>Anchor:</strong> {campaign.anchor_text}</p>
                        <p><strong>Created:</strong> {new Date(campaign.created_at).toLocaleString()}</p>
                        
                        {campaign.automation_published_links && campaign.automation_published_links.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Published Links ({campaign.automation_published_links.length}):</p>
                            <div className="space-y-1 mt-1">
                              {campaign.automation_published_links.slice(0, 2).map((link) => (
                                <a
                                  key={link.id}
                                  href={link.published_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs flex items-center gap-1 truncate"
                                >
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{link.published_url}</span>
                                </a>
                              ))}
                              {campaign.automation_published_links.length > 2 && (
                                <p className="text-xs text-gray-500">
                                  +{campaign.automation_published_links.length - 2} more links
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {campaign.error_message && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Error:</strong> {campaign.error_message}
                        </div>
                      )}
                    </div>

                    {/* Campaign Controls */}
                    <div className="flex gap-2 ml-4">
                      {campaign.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResumeCampaign(campaign.id)}
                          disabled={actionLoading === campaign.id}
                          title="Resume Campaign"
                        >
                          {actionLoading === campaign.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      {['pending', 'generating', 'publishing'].includes(campaign.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePauseCampaign(campaign.id)}
                          disabled={actionLoading === campaign.id}
                          title="Pause Campaign"
                        >
                          {actionLoading === campaign.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Pause className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCampaign(campaign.id, campaign.keyword)}
                        disabled={actionLoading === campaign.id}
                        title="Delete Campaign"
                      >
                        {actionLoading === campaign.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignManager;
export { CampaignManager };
