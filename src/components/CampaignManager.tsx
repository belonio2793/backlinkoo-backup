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
import { realTimeFeedService } from '@/services/realTimeFeedService';
import { useAuth } from '@/hooks/useAuth';

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
  const [campaignStatusSummaries, setCampaignStatusSummaries] = useState<Map<string, any>>(new Map());
  const orchestrator = getOrchestrator();
  const { user } = useAuth();

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
      
      // Load status summaries for each campaign
      const statusSummaries = new Map();
      for (const campaign of campaignsWithLinks) {
        const summary = orchestrator.getCampaignStatusSummary(campaign.id);
        statusSummaries.set(campaign.id, summary);
      }

      setCampaigns(campaignsWithLinks);
      setCampaignStatusSummaries(statusSummaries);

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
      // Find the campaign to get details for the feed
      const campaign = campaigns.find(c => c.id === campaignId);
      const keyword = campaign?.keywords?.[0] || campaign?.name || 'Unknown';
      const campaignName = campaign?.name || `Campaign for ${keyword}`;

      await orchestrator.pauseCampaign(campaignId);

      // Emit real-time feed event
      realTimeFeedService.emitCampaignPaused(
        campaignId,
        campaignName,
        keyword,
        'Paused by user',
        user?.id
      );

      await loadCampaigns();
      onStatusUpdate?.('Campaign paused successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error pausing campaign:', {
        message: errorMessage,
        campaignId,
        error: error
      });

      // Emit error event to feed
      realTimeFeedService.emitUserAction(
        'pause_campaign_failed',
        `Failed to pause campaign: ${errorMessage}`,
        user?.id,
        campaignId
      );

      onStatusUpdate?.(`Failed to pause campaign: ${errorMessage}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      // Find the campaign to get details for the feed
      const campaign = campaigns.find(c => c.id === campaignId);
      const keyword = campaign?.keywords?.[0] || campaign?.name || 'Unknown';
      const campaignName = campaign?.name || `Campaign for ${keyword}`;

      const result = await orchestrator.resumeCampaign(campaignId);

      if (result.success) {
        // Emit real-time feed event
        realTimeFeedService.emitCampaignResumed(
          campaignId,
          campaignName,
          keyword,
          'Resumed by user',
          user?.id
        );

        onStatusUpdate?.(result.message, 'success');
      } else {
        // For completion messages, use info instead of error
        const messageType = result.message.includes('completed') ? 'info' : 'error';

        // Emit appropriate event based on result
        if (result.message.includes('completed')) {
          realTimeFeedService.emitUserAction(
            'resume_campaign_completed',
            `Campaign already completed: ${result.message}`,
            user?.id,
            campaignId
          );
        } else {
          realTimeFeedService.emitUserAction(
            'resume_campaign_failed',
            result.message,
            user?.id,
            campaignId
          );
        }

        onStatusUpdate?.(result.message, messageType);
      }

      await loadCampaigns();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error resuming campaign:', {
        message: errorMessage,
        campaignId,
        error: error
      });

      // Emit error event to feed
      realTimeFeedService.emitUserAction(
        'resume_campaign_failed',
        `Failed to resume campaign: ${errorMessage}`,
        user?.id,
        campaignId
      );

      onStatusUpdate?.(`Failed to resume campaign: ${errorMessage}`, 'error');
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

      // Emit real-time feed event
      realTimeFeedService.emitUserAction(
        'delete_campaign',
        `Campaign "${keyword}" deleted successfully`,
        user?.id,
        campaignId
      );

      await loadCampaigns();
      onStatusUpdate?.(`Campaign "${keyword}" deleted successfully`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error deleting campaign:', {
        message: errorMessage,
        campaignId,
        campaignKeyword: keyword,
        error: error
      });

      // Emit error event to feed
      realTimeFeedService.emitUserAction(
        'delete_campaign_failed',
        `Failed to delete campaign "${keyword}": ${errorMessage}`,
        user?.id,
        campaignId
      );

      onStatusUpdate?.(`Failed to delete campaign: ${errorMessage}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'publishing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'generating': return <FileText className="w-4 h-4" />;
      case 'publishing': return <ExternalLink className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActiveCampaigns = () => campaigns.filter(c => ['active', 'pending', 'generating', 'publishing'].includes(c.status));
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
                    campaign.automation_published_links
                      .sort((a, b) => new Date(b.published_at || b.created_at || '').getTime() - new Date(a.published_at || a.created_at || '').getTime())
                      .map(link => (
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
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left max-w-sm mx-auto">
                  <p className="text-xs font-medium text-blue-700 mb-2">✨ New Features:</p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• Auto-rotation across platforms</li>
                    <li>• Smart pause/resume controls</li>
                    <li>• Visual progress tracking</li>
                    <li>• 1 post per platform maximum</li>
                  </ul>
                </div>
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

                        {/* Platform Progress */}
                        {(() => {
                          const summary = campaignStatusSummaries.get(campaign.id);
                          if (summary && summary.totalPlatforms > 0) {
                            return (
                              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                <p className="text-xs font-medium text-gray-700 mb-1">Platform Progress</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-600">
                                    {summary.platformsCompleted || 0}/{summary.totalPlatforms} platforms completed
                                  </span>
                                  {summary.nextPlatform && (
                                    <span className="text-blue-600">
                                      • Next: {summary.nextPlatform}
                                    </span>
                                  )}
                                  {summary.isFullyCompleted && (
                                    <span className="text-green-600 font-medium">
                                      • All platforms completed
                                    </span>
                                  )}
                                </div>
                                {summary.completedPlatforms && summary.completedPlatforms.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Completed: {summary.completedPlatforms.join(', ')}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {campaign.automation_published_links && campaign.automation_published_links.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">Published Links ({campaign.automation_published_links.length}):</p>
                            <div className="space-y-1 mt-1">
                              {campaign.automation_published_links
                                .sort((a, b) => new Date(b.published_at || b.created_at || '').getTime() - new Date(a.published_at || a.created_at || '').getTime())
                                .slice(0, 2).map((link) => (
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
                    <div className="flex flex-col gap-2 ml-4">
                      {(() => {
                        const summary = campaignStatusSummaries.get(campaign.id);

                        // Resume button for paused campaigns
                        if (campaign.status === 'paused') {
                          const canResume = summary?.nextPlatform;
                          const tooltipText = canResume
                            ? `Resume to continue posting to ${summary.nextPlatform}`
                            : 'All available platforms have been used';

                          return (
                            <Button
                              size="sm"
                              variant={canResume ? "default" : "outline"}
                              onClick={() => handleResumeCampaign(campaign.id)}
                              disabled={actionLoading === campaign.id || !canResume}
                              title={tooltipText}
                              className={canResume ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                            >
                              {actionLoading === campaign.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-1" />
                                  {canResume ? 'Resume' : 'Complete'}
                                </>
                              )}
                            </Button>
                          );
                        }

                        // Pause button for active campaigns
                        if (['active', 'pending', 'generating', 'publishing'].includes(campaign.status)) {
                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePauseCampaign(campaign.id)}
                              disabled={actionLoading === campaign.id}
                              title="Pause Campaign"
                              className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              {actionLoading === campaign.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Pause className="w-4 h-4 mr-1" />
                                  Pause
                                </>
                              )}
                            </Button>
                          );
                        }

                        return null;
                      })()}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCampaign(campaign.id, campaign.keyword)}
                        disabled={actionLoading === campaign.id}
                        title="Delete Campaign"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {actionLoading === campaign.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Platform Visual Progress */}
                      {(() => {
                        const summary = campaignStatusSummaries.get(campaign.id);
                        if (summary && summary.totalPlatforms > 0) {
                          const completedCount = summary.platformsCompleted || 0;
                          return (
                            <div className="flex flex-col gap-1 mt-2">
                              <div className="text-xs text-gray-500">Platforms:</div>
                              <div className="flex gap-1">
                                {Array.from({ length: summary.totalPlatforms }, (_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                      i < completedCount
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                    }`}
                                    title={`Platform ${i + 1}: ${
                                      i < completedCount ? 'Completed' : 'Pending'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
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
