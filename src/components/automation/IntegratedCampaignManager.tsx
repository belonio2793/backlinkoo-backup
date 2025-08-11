import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Activity,
  Database,
  Globe,
  Play,
  Pause,
  Settings,
  Trash2,
  Eye,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

// Import our enhanced services and components
import { useDatabaseCampaignManager } from '@/hooks/useDatabaseCampaignManager';
import { EnhancedCampaignManager, CampaignDeletionResult } from '@/services/enhancedCampaignManager';
import { CampaignRuntimeEngine } from '@/services/campaignRuntimeEngine';
import { RealTimeUrlTracker } from '@/services/realTimeUrlTracker';
import EnhancedDeleteCampaignDialog from '@/components/campaigns/EnhancedDeleteCampaignDialog';
import { LiveUrlPostingMonitor } from './LiveUrlPostingMonitor';
import { CampaignDataSiphon } from './CampaignDataSiphon';
import type { AutomationCampaign } from '@/types/automationTypes';

interface IntegratedCampaignManagerProps {
  userId?: string;
}

export function IntegratedCampaignManager({ userId }: IntegratedCampaignManagerProps) {
  const {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    toggleCampaign,
    loadCampaigns,
    dashboardData
  } = useDatabaseCampaignManager();

  const [selectedCampaign, setSelectedCampaign] = useState<AutomationCampaign | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<AutomationCampaign | null>(null);
  const [runtimeStates, setRuntimeStates] = useState<Map<string, boolean>>(new Map());
  const [realTimeData, setRealTimeData] = useState<Map<string, any>>(new Map());

  // Initialize runtime states for existing campaigns
  useEffect(() => {
    const states = new Map<string, boolean>();
    campaigns.forEach(campaign => {
      states.set(campaign.id, CampaignRuntimeEngine.isRuntimeActive(campaign.id));
    });
    setRuntimeStates(states);
  }, [campaigns]);

  // Load real-time data for active campaigns
  useEffect(() => {
    const interval = setInterval(() => {
      campaigns.forEach(async (campaign) => {
        if (CampaignRuntimeEngine.isRuntimeActive(campaign.id)) {
          const stats = await EnhancedCampaignManager.getLiveUrlStatistics(campaign.id);
          setRealTimeData(prev => new Map(prev.set(campaign.id, stats)));
        }
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [campaigns]);

  const handleCampaignToggle = useCallback(async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    try {
      const isCurrentlyActive = CampaignRuntimeEngine.isRuntimeActive(campaignId);
      
      if (isCurrentlyActive) {
        // Stop the runtime engine
        const stopped = await CampaignRuntimeEngine.stopCampaignRuntime(campaignId);
        if (stopped) {
          setRuntimeStates(prev => new Map(prev.set(campaignId, false)));
          toast.success('Campaign Runtime Stopped', {
            description: `${campaign.name} has been paused and runtime engine stopped`
          });
        }
      } else {
        // Start the runtime engine
        const started = await CampaignRuntimeEngine.startCampaignRuntime(campaign);
        if (started) {
          setRuntimeStates(prev => new Map(prev.set(campaignId, true)));
          toast.success('Campaign Runtime Started', {
            description: `${campaign.name} is now active with real-time URL processing`
          });
        }
      }

      // Also toggle the campaign status in database
      await toggleCampaign(campaignId);
      
    } catch (error: any) {
      console.error('Error toggling campaign:', error);
      toast.error('Failed to toggle campaign', {
        description: error.message
      });
    }
  }, [campaigns, toggleCampaign]);

  const handleDeleteCampaign = useCallback((campaign: AutomationCampaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteComplete = useCallback(async (result: CampaignDeletionResult) => {
    if (result.success) {
      toast.success('Campaign Deleted Successfully', {
        description: `Campaign and ${result.deleted_items.link_placements} link placements removed`
      });
      
      // Refresh campaigns list
      await loadCampaigns();
      
      // Clear real-time data for deleted campaign
      if (campaignToDelete) {
        setRealTimeData(prev => {
          const newMap = new Map(prev);
          newMap.delete(campaignToDelete.id);
          return newMap;
        });
        setRuntimeStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(campaignToDelete.id);
          return newMap;
        });
      }
    } else {
      toast.error('Failed to delete campaign', {
        description: result.error
      });
    }
  }, [campaignToDelete, loadCampaigns]);

  const handleUrlPosted = useCallback((campaignId: string, url: string, success: boolean) => {
    // Update real-time counters
    setRealTimeData(prev => {
      const currentData = prev.get(campaignId) || {};
      const newData = {
        ...currentData,
        live_links: success ? (currentData.live_links || 0) + 1 : currentData.live_links,
        failed_links: !success ? (currentData.failed_links || 0) + 1 : currentData.failed_links
      };
      return new Map(prev.set(campaignId, newData));
    });

    if (success) {
      toast.success('URL Posted Successfully', {
        description: `New link posted: ${new URL(url).hostname}`
      });
    }
  }, []);

  const getCampaignStatusBadge = (campaign: AutomationCampaign) => {
    const isRuntimeActive = runtimeStates.get(campaign.id);
    const realtimeData = realTimeData.get(campaign.id);
    
    if (isRuntimeActive) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
          LIVE PROCESSING
        </Badge>
      );
    } else if (campaign.status === 'active') {
      return <Badge variant="default">ACTIVE</Badge>;
    } else {
      return <Badge variant="secondary">{campaign.status.toUpperCase()}</Badge>;
    }
  };

  const getRealTimeStats = (campaignId: string) => {
    return realTimeData.get(campaignId) || {
      total_discovered: 0,
      total_visited: 0,
      total_posted: 0,
      total_verified: 0,
      success_rate: 0,
      live_links: 0,
      failed_links: 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Database className="h-6 w-6 text-blue-600" />
            Integrated Campaign Manager
            <Badge variant="outline" className="ml-2">
              Real-Time URL Processing
            </Badge>
          </CardTitle>
          <CardDescription>
            Advanced campaign management with real-time URL tracking, automated processing, and comprehensive deletion controls
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error State */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Overview */}
      {dashboardData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.total_campaigns}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.active_campaigns}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Links</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.total_links}</p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboardData.success_rate}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Campaigns</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="siphon">Data Siphon</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campaign Management</CardTitle>
                <Button onClick={() => loadCampaigns()} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.length > 0 ? campaigns.map((campaign) => {
                  const realtimeStats = getRealTimeStats(campaign.id);
                  const isRuntimeActive = runtimeStates.get(campaign.id);
                  
                  return (
                    <div key={campaign.id} className="border rounded-lg p-4 space-y-4">
                      {/* Campaign Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          {getCampaignStatusBadge(campaign)}
                          <Badge variant="outline" className="text-xs">
                            {campaign.engine_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCampaign(campaign)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant={isRuntimeActive ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleCampaignToggle(campaign.id)}
                            disabled={loading}
                          >
                            {isRuntimeActive ? (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Real-Time Stats */}
                      {isRuntimeActive && (
                        <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">URLs Discovered</p>
                            <p className="text-lg font-bold text-blue-600">{realtimeStats.total_discovered}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">URLs Posted</p>
                            <p className="text-lg font-bold text-green-600">{realtimeStats.total_posted}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Live Links</p>
                            <p className="text-lg font-bold text-purple-600">{realtimeStats.live_links}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Success Rate</p>
                            <p className="text-lg font-bold text-orange-600">{realtimeStats.success_rate?.toFixed(1) || 0}%</p>
                          </div>
                        </div>
                      )}

                      {/* Campaign Details */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Target URL:</span>
                          <p className="font-medium truncate">{campaign.target_url}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Daily Limit:</span>
                          <p className="font-medium">{campaign.daily_limit}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <p className="font-medium capitalize">{campaign.priority}</p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Campaigns Found</p>
                    <p className="text-sm">Create your first campaign to get started with automated link building</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          {selectedCampaign ? (
            <LiveUrlPostingMonitor
              campaignId={selectedCampaign.id}
              onUrlPosted={(url, success) => handleUrlPosted(selectedCampaign.id, url, success)}
              showControls={true}
            />
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Select a Campaign</p>
                  <p className="text-sm">Choose a campaign from the overview tab to monitor its real-time URL processing</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Siphon */}
        <TabsContent value="siphon" className="space-y-6">
          {selectedCampaign ? (
            <CampaignDataSiphon campaignId={selectedCampaign.id} />
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Select a Campaign</p>
                  <p className="text-sm">Choose a campaign to view its siphoned URL data and analytics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive analytics across all campaigns and real-time processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Overall Performance */}
                <div className="space-y-2">
                  <h4 className="font-medium">Overall Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium">{dashboardData?.success_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Links:</span>
                      <span className="font-medium">{dashboardData?.total_links || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Month:</span>
                      <span className="font-medium">{dashboardData?.links_this_month || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Real-Time Processing */}
                <div className="space-y-2">
                  <h4 className="font-medium">Real-Time Processing</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Campaigns:</span>
                      <span className="font-medium">{Array.from(runtimeStates.values()).filter(Boolean).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total URLs Processed:</span>
                      <span className="font-medium">
                        {Array.from(realTimeData.values()).reduce((sum, data) => sum + (data.total_posted || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Live Links:</span>
                      <span className="font-medium">
                        {Array.from(realTimeData.values()).reduce((sum, data) => sum + (data.live_links || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="space-y-2">
                  <h4 className="font-medium">System Health</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Runtime Engines:</span>
                      <span className="font-medium">{runtimeStates.size} Configured</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Siphon:</span>
                      <span className="font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Delete Dialog */}
      <EnhancedDeleteCampaignDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        campaign={campaignToDelete}
        onDeleteComplete={handleDeleteComplete}
      />
    </div>
  );
}
