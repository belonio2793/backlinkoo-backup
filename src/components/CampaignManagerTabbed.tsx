import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  RefreshCw,
  Link,
  Globe,
  Calendar,
  Eye,
  Copy,
  Edit3
} from 'lucide-react';
import { getOrchestrator, type Campaign } from '@/services/automationOrchestrator';
import { realTimeFeedService } from '@/services/realTimeFeedService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CampaignErrorStatus from './CampaignErrorStatus';
import InlineProgressTracker from './InlineProgressTracker';
import { CampaignProgress } from './CampaignProgressTracker';
import { CampaignDetailsModal } from './CampaignDetailsModal';

interface PublishedLink {
  id: string;
  published_url: string;
  platform: string;
  published_at: string;
}

interface CampaignWithLinks extends Campaign {
  automation_published_links: PublishedLink[];
}

interface CampaignManagerTabbedProps {
  onStatusUpdate?: (message: string, type: 'success' | 'error' | 'info') => void;
  currentCampaignProgress?: CampaignProgress | null;
  onRetryProgress?: () => void;
}

const CampaignManagerTabbed: React.FC<CampaignManagerTabbedProps> = ({
  onStatusUpdate,
  currentCampaignProgress,
  onRetryProgress
}) => {
  const [campaigns, setCampaigns] = useState<CampaignWithLinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [campaignStatusSummaries, setCampaignStatusSummaries] = useState<Map<string, any>>(new Map());
  const [activeTab, setActiveTab] = useState('activity');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Auto-switch to activity tab when a campaign progress starts
  useEffect(() => {
    if (currentCampaignProgress && !currentCampaignProgress.isComplete && !currentCampaignProgress.isError) {
      setActiveTab('activity');
    }
  }, [currentCampaignProgress]);
  const orchestrator = getOrchestrator();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadCampaigns, 10000);

    // Real-time feed integration for instant updates
    const handleFeedEvent = (event: any) => {
      // Force refresh campaigns when events occur
      if (['campaign_created', 'campaign_completed', 'campaign_failed', 'url_published'].includes(event.type)) {
        console.log('📡 Real-time event received, refreshing campaigns:', event.type);

        // Show toast notification for URL published events
        if (event.type === 'url_published') {
          toast({
            title: "New Backlink Published!",
            description: `Published "${event.keyword}" to ${event.platform}`,
            duration: 5000,
          });

          // Update parent status
          onStatusUpdate?.(`New backlink published: ${event.url}`, 'success');
        }

        // Refresh campaigns to show new data
        loadCampaigns();
      }
    };

    const unsubscribe = realTimeFeedService.subscribe(handleFeedEvent);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [toast, onStatusUpdate]);

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

  const handleViewDetails = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setShowDetailsModal(true);
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
      realTimeFeedService.emitCampaignDeleted(
        campaignId,
        keyword,
        keyword,
        user?.id
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "URL copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
        duration: 2000,
      });
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

  // Get all published links sorted by date
  const getAllPublishedLinks = () => {
    const allLinks: Array<PublishedLink & { campaignKeyword: string; campaignName: string }> = [];

    campaigns.forEach(campaign => {
      if (campaign.automation_published_links?.length > 0) {
        campaign.automation_published_links.forEach(link => {
          allLinks.push({
            ...link,
            campaignKeyword: campaign.keywords?.[0] || campaign.name || 'Unknown',
            campaignName: campaign.name
          });
        });
      }
    });

    // Only show real published links from actual campaigns

    // Sort by published date (newest first)
    return allLinks.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  };

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
    <>
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
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
      <CardContent className="flex-1 flex flex-col">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="live-links" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Links ({getAllPublishedLinks().length})
            </TabsTrigger>
          </TabsList>

          {/* Campaign Activity Tab */}
          <TabsContent value="activity" className="mt-6 space-y-4">
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
                            <span className="font-medium">{campaign.keywords?.[0] || campaign.name}</span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Target:</strong> {campaign.target_url}</p>
                            <p><strong>Anchor:</strong> {campaign.anchor_texts?.[0] || 'N/A'}</p>
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
                            onClick={() => handleViewDetails(campaign.id)}
                            title="View Campaign Details"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.keywords?.[0] || campaign.name)}
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
          </TabsContent>

          {/* Live Links Tab */}
          <TabsContent value="live-links" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Published Links</h3>
                </div>
                <Badge variant="outline" className="text-sm">
                  {getAllPublishedLinks().length} Total Links
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Links Header with Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg relative">
                        <Globe className="w-5 h-5 text-blue-600" />
                        {getAllPublishedLinks().length > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Live updates active" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Link Performance</h4>
                        <p className="text-sm text-gray-600">Active backlinks and their status • Real-time updates</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-green-600">{getAllPublishedLinks().filter(l => l.status === 'active').length}</div>
                        <div className="text-gray-500">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{getAllPublishedLinks().length}</div>
                        <div className="text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600">{campaigns.filter(c => c.status === 'active').length}</div>
                        <div className="text-gray-500">Running</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Links List with Full-Scale UI */}
                <div className="border rounded-lg bg-white overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">Published Backlinks</h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getAllPublishedLinks().length} Links
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const urls = getAllPublishedLinks().map(l => l.published_url).join('\n');
                            copyToClipboard(urls);
                          }}
                          className="text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy All
                        </Button>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="max-h-96">
                    <div className="divide-y divide-gray-100">
                      {getAllPublishedLinks().map((link, index) => (
                        <div
                          key={link.id}
                          className="p-4 hover:bg-gray-50 transition-colors group"
                        >
                          {/* Link Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant={link.platform === 'telegraph' ? 'default' : 'secondary'}
                                  className="text-xs font-medium"
                                >
                                  {link.platform === 'telegraph' ? 'Telegraph.ph' : link.platform}
                                </Badge>
                                <div className={`w-2 h-2 rounded-full ${
                                  link.status === 'active' ? 'bg-green-500' :
                                  link.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                                }`} title={`Status: ${link.status}`} />
                              </div>

                              <h6 className="font-medium text-gray-900 mb-1 line-clamp-1">
                                {link.campaignKeyword}
                              </h6>

                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(link.published_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}</span>
                                </div>
                                {link.anchor_text && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">Anchor:</span>
                                    <code className="bg-gray-100 px-1 rounded text-xs">{link.anchor_text}</code>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(link.published_url)}
                                title="Copy URL"
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(link.published_url, '_blank')}
                                title="Open Link"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(link.published_url + '/edit', '_blank')}
                                title="Edit on Telegraph"
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Full URL Display */}
                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <div className="flex items-center justify-between">
                              <a
                                href={link.published_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm flex-1 truncate transition-colors"
                                title={link.published_url}
                              >
                                {link.published_url}
                              </a>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(link.published_url, '_blank')}
                                className="ml-3 h-8 text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Open
                              </Button>
                            </div>
                          </div>

                          {/* Performance Metrics (if available) */}
                          {link.validation_status && (
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  link.validation_status === 'validated' ? 'bg-green-500' :
                                  link.validation_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                <span className="capitalize">{link.validation_status}</span>
                              </div>
                              {link.target_url && (
                                <div>Target: <span className="font-mono">{link.target_url}</span></div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {getAllPublishedLinks().length === 0 && (
                    <div className="p-8 text-center">
                      <Link className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h6 className="font-medium text-gray-900 mb-2">No Published Links Yet</h6>
                      <p className="text-sm text-gray-500 mb-4">
                        Published backlinks will appear here after campaigns complete
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('activity')}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        View Campaign Activity
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {/* Campaign Details Modal */}
    {selectedCampaignId && (
      <CampaignDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        campaignId={selectedCampaignId}
      />
    )}
    </>
  );
};

export default CampaignManagerTabbed;
export { CampaignManagerTabbed };
