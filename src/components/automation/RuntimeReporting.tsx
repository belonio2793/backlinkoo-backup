import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Activity,
  Clock,
  TrendingUp,
  Target,
  Globe,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Download,
  RefreshCw,
  Eye,
  Calendar
} from 'lucide-react';
import { LiveAutomationEngine, LiveActivity, LiveLinkPlacement } from '@/services/liveAutomationEngine';
import { LiveActivityFeed } from './LiveActivityFeed';

interface Campaign {
  id: string;
  name: string;
  engine_type: string;
  status: string;
  links_built: number;
  daily_limit: number;
  success_rate: number;
  last_activity: string;
  target_url: string;
}

interface RuntimeReportingProps {
  campaigns: Campaign[];
  onToggleCampaign?: (campaignId: string) => void;
  onRefreshData?: () => void;
}

export function RuntimeReporting({ campaigns, onToggleCampaign, onRefreshData }: RuntimeReportingProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [recentPlacements, setRecentPlacements] = useState<LiveLinkPlacement[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Update timestamp every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load real placements and start monitoring
  useEffect(() => {
    loadRecentPlacements();
    startLiveMonitoring();

    // Subscribe to live activities
    const unsubscribe = LiveAutomationEngine.subscribeToActivity((activity) => {
      setLiveActivities(prev => [activity, ...prev].slice(0, 50));
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, []);

  const loadRecentPlacements = async () => {
    try {
      const placements = await LiveAutomationEngine.getRecentPlacements(20);
      setRecentPlacements(placements);
    } catch (error) {
      console.error('Error loading recent placements:', error);
    }
  };

  const startLiveMonitoring = async () => {
    if (campaigns.length === 0) return;

    setIsMonitoring(true);

    // Start monitoring for active campaigns
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    for (const campaign of activeCampaigns) {
      try {
        await LiveAutomationEngine.startLiveMonitoring(campaign.id);
      } catch (error) {
        console.error(`Error starting monitoring for campaign ${campaign.id}:`, error);
      }
    }
  };

  const toggleCampaignMonitoring = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    try {
      if (campaign.status === 'active') {
        // Pause campaign
        onToggleCampaign?.(campaignId);
      } else {
        // Start campaign and monitoring
        onToggleCampaign?.(campaignId);
        await LiveAutomationEngine.startLiveMonitoring(campaignId);
      }
    } catch (error) {
      console.error('Error toggling campaign monitoring:', error);
    }
  };

  // Calculate aggregate metrics from real data
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalLinksBuilt = recentPlacements.length;
  const liveLinks = recentPlacements.filter(p => p.verification_status === 'live').length;
  const successRate = totalLinksBuilt > 0 ? (liveLinks / totalLinksBuilt) * 100 : 0;

  // Today's activity
  const today = new Date().toDateString();
  const todaysPlacements = recentPlacements.filter(p =>
    new Date(p.placed_at).toDateString() === today
  );
  const todaysLinks = todaysPlacements.length;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6">
      {/* Runtime Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-6 w-6 text-blue-600" />
                Runtime & Reporting Dashboard
              </CardTitle>
              <CardDescription className="mt-2">
                Real-time campaign monitoring and performance analytics
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="text-sm font-medium">{formatTime(lastUpdate)}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefreshData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Links Today</p>
                <p className="text-2xl font-bold text-blue-600">{Math.floor(totalLinksBuilt * 0.1)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Links</p>
                <p className="text-2xl font-bold text-orange-600">{totalLinksBuilt}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reporting Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Activity
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Campaign Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Real-time status and metrics for all campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.length > 0 ? campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge 
                          variant={campaign.status === 'active' ? 'default' : 'secondary'}
                          className={campaign.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.engine_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Links Built</p>
                          <p className="font-medium">{campaign.links_built || 0}/{campaign.daily_limit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Success Rate</p>
                          <p className="font-medium">{campaign.success_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Target</p>
                          <p className="font-medium text-xs truncate">{campaign.target_url}</p>
                        </div>
                      </div>

                      <div className="w-full">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Daily Progress</span>
                          <span>{Math.round(((campaign.links_built || 0) / campaign.daily_limit) * 100)}%</span>
                        </div>
                        <Progress 
                          value={((campaign.links_built || 0) / campaign.daily_limit) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleCampaign?.(campaign.id)}
                      >
                        {campaign.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns running. Create a campaign to see performance data.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Live Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>Real-time updates from your automation campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.name}</span> placed {activity.recent_links} new links
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.last_success.toLocaleTimeString()} • {activity.engine_type.replace('_', ' ')}
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
                
                {activeCampaigns === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active campaigns. Start a campaign to see live activity.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Reports Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key metrics for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Campaigns</span>
                    <span className="font-medium">{totalCampaigns}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Links Placed</span>
                    <span className="font-medium">{totalLinksBuilt}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Success Rate</span>
                    <span className="font-medium">{avgSuccessRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cost per Link</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>Download detailed performance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Campaign Performance (CSV)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Link Placement Report (PDF)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Success Rate Analysis (Excel)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
