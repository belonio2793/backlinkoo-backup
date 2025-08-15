import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink, 
  Calendar, 
  Target, 
  FileText, 
  Link, 
  Pause, 
  Play, 
  Trash2,
  BarChart3,
  Clock,
  CheckCircle
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

interface LogEntry {
  id: string;
  log_level: 'info' | 'warning' | 'error';
  message: string;
  created_at: string;
  details?: any;
}

const AutomationReporting = () => {
  const { toast } = useToast();
  const orchestrator = getOrchestrator();
  const [campaigns, setCampaigns] = useState<CampaignWithLinks[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
    
    // Refresh campaigns every 10 seconds
    const interval = setInterval(loadCampaigns, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadCampaignLogs(selectedCampaign);
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      const userCampaigns = await orchestrator.getUserCampaigns();
      
      // Load published links for each campaign
      const campaignsWithLinks = await Promise.all(
        userCampaigns.map(async (campaign) => {
          const campaignWithLinks = await orchestrator.getCampaignWithLinks(campaign.id);
          return campaignWithLinks || { ...campaign, automation_published_links: [] };
        })
      );
      
      setCampaigns(campaignsWithLinks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error loading campaigns:', {
        message: errorMessage,
        error: error
      });
      toast({
        title: "Error Loading Campaigns",
        description: `Failed to load your campaigns: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignLogs = async (campaignId: string) => {
    try {
      const campaignLogs = await orchestrator.getCampaignLogs(campaignId);
      setLogs(campaignLogs);
    } catch (error) {
      console.error('Error loading campaign logs:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      await orchestrator.pauseCampaign(campaignId);
      await loadCampaigns();
      toast({
        title: "Campaign Paused",
        description: "The campaign has been paused successfully."
      });
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    setActionLoading(campaignId);
    try {
      await orchestrator.resumeCampaign(campaignId);
      await loadCampaigns();
      toast({
        title: "Campaign Resumed",
        description: "The campaign has been resumed and will continue processing."
      });
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Error",
        description: "Failed to resume campaign.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setActionLoading(campaignId);
    try {
      await orchestrator.deleteCampaign(campaignId);
      await loadCampaigns();
      if (selectedCampaign === campaignId) {
        setSelectedCampaign(null);
        setLogs([]);
      }
      toast({
        title: "Campaign Deleted",
        description: "The campaign has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'publishing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'generating': return <FileText className="w-4 h-4" />;
      case 'publishing': return <ExternalLink className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'failed': return <Target className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-3xl font-bold">{campaigns.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {campaigns.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-blue-600">
                  {campaigns.filter(c => ['pending', 'generating', 'publishing'].includes(c.status)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published Links</p>
                <p className="text-3xl font-bold text-purple-600">
                  {campaigns.reduce((sum, c) => sum + (c.automation_published_links?.length || 0), 0)}
                </p>
              </div>
              <Link className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Campaign Reports
              </CardTitle>
              <CardDescription>
                View and manage your link building campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No campaigns found</p>
                  <p className="text-sm text-gray-500">Create your first campaign to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id}
                      className={`p-4 border rounded-lg bg-white cursor-pointer transition-colors ${
                        selectedCampaign === campaign.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCampaign(campaign.id)}
                    >
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
                          
                          <div className="text-sm text-gray-600">
                            <p><strong>Target URL:</strong> {campaign.target_url}</p>
                            <p><strong>Anchor Text:</strong> {campaign.anchor_text}</p>
                            <p><strong>Created:</strong> {new Date(campaign.created_at).toLocaleString()}</p>
                          </div>

                          {campaign.automation_published_links && campaign.automation_published_links.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Published Links ({campaign.automation_published_links.length}):</p>
                              {campaign.automation_published_links.map((link) => (
                                <a
                                  key={link.id}
                                  href={link.published_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {link.published_url}
                                </a>
                              ))}
                            </div>
                          )}

                          {campaign.error_message && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              <strong>Error:</strong> {campaign.error_message}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          {campaign.status === 'paused' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResumeCampaign(campaign.id);
                              }}
                              disabled={actionLoading === campaign.id}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : campaign.status === 'pending' || campaign.status === 'generating' || campaign.status === 'publishing' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePauseCampaign(campaign.id);
                              }}
                              disabled={actionLoading === campaign.id}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : null}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCampaign(campaign.id);
                            }}
                            disabled={actionLoading === campaign.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaign Logs */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                {selectedCampaign ? 'Campaign activity and progress' : 'Select a campaign to view logs'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCampaign ? (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {logs.length === 0 ? (
                      <p className="text-sm text-gray-500">No logs available</p>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span className={`font-medium ${getLogLevelColor(log.log_level)}`}>
                              [{log.log_level.toUpperCase()}]
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-900">{log.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {logs.indexOf(log) < logs.length - 1 && (
                            <Separator className="mt-3" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Select a campaign</p>
                  <p className="text-sm text-gray-500">Click on a campaign to view its activity logs</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutomationReporting;
