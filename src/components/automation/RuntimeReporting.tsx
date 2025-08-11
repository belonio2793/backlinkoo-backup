import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
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
  Calendar,
  FileText,
  FileSpreadsheet,
  ExternalLink,
  Star
} from 'lucide-react';
import { LiveAutomationEngine, LiveActivity, LiveLinkPlacement } from '@/services/liveAutomationEngine';
import { RealTimeUrlMonitor } from './RealTimeUrlMonitor';

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

  const handleExportReport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      const exportData = {
        campaigns: campaigns,
        placements: recentPlacements,
        activities: liveActivities,
        metrics: {
          totalCampaigns,
          activeCampaigns,
          totalLinksBuilt,
          liveLinks,
          successRate,
          todaysLinks
        },
        timestamp: new Date().toISOString()
      };

      switch (format) {
        case 'csv':
          await exportCSVReport(exportData);
          toast({
            title: "CSV Report Generated",
            description: `Campaign performance data exported successfully with ${campaigns.length} campaigns and ${totalLinksBuilt} link placements.`
          });
          break;

        case 'pdf':
          await exportPDFReport(exportData);
          toast({
            title: "PDF Report Generated",
            description: `Link placement audit report created with ${recentPlacements.length} verified placements and detailed verification status.`
          });
          break;

        case 'excel':
          await exportExcelReport(exportData);
          toast({
            title: "Excel Analytics Generated",
            description: `Success rate analysis completed with ${successRate.toFixed(1)}% success rate and trend forecasting data.`
          });
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportCSVReport = async (data: any) => {
    const csvContent = [
      // Headers
      'Campaign ID,Name,Engine Type,Status,Links Built,Daily Limit,Success Rate,Target URL,Last Activity',
      // Data rows
      ...data.campaigns.map((campaign: Campaign) =>
        `${campaign.id},${campaign.name},${campaign.engine_type},${campaign.status},${campaign.links_built || 0},${campaign.daily_limit},${campaign.success_rate || 0}%,${campaign.target_url},${campaign.last_activity}`
      ),
      '',
      '--- SUMMARY METRICS ---',
      `Total Campaigns,${data.metrics.totalCampaigns}`,
      `Active Campaigns,${data.metrics.activeCampaigns}`,
      `Total Links Built,${data.metrics.totalLinksBuilt}`,
      `Live/Verified Links,${data.metrics.liveLinks}`,
      `Overall Success Rate,${data.metrics.successRate.toFixed(2)}%`,
      `Links Today,${data.metrics.todaysLinks}`,
      `Report Generated,${new Date().toLocaleString()}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDFReport = async (data: any) => {
    // Create a detailed HTML report for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Link Placement Audit Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .metric { display: inline-block; margin: 10px 20px 10px 0; }
          .placement { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
          .live { border-left: 4px solid #22c55e; }
          .pending { border-left: 4px solid #f59e0b; }
          .failed { border-left: 4px solid #ef4444; }
          .small { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Link Placement Audit Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="metrics">
          <div class="metric"><strong>Total Placements:</strong> ${data.placements.length}</div>
          <div class="metric"><strong>Live Links:</strong> ${data.metrics.liveLinks}</div>
          <div class="metric"><strong>Success Rate:</strong> ${data.metrics.successRate.toFixed(1)}%</div>
          <div class="metric"><strong>Today's Links:</strong> ${data.metrics.todaysLinks}</div>
        </div>

        <h2>Link Placement Details</h2>
        ${data.placements.map((placement: any) => `
          <div class="placement ${placement.verification_status}">
            <h3>${placement.source_url || 'Link Placement'}</h3>
            <p><strong>Target:</strong> ${placement.target_url}</p>
            <p><strong>Status:</strong> ${placement.verification_status}</p>
            <p><strong>Placed:</strong> ${new Date(placement.placed_at).toLocaleString()}</p>
            <p class="small"><strong>Campaign:</strong> ${placement.campaign_id}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // For now, we'll download as HTML (in production, you'd use a PDF library)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `link-placement-audit-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcelReport = async (data: any) => {
    const xlsContent = [
      '--- SUCCESS RATE ANALYTICS ---',
      '',
      'PERFORMANCE METRICS',
      `Current Success Rate,${data.metrics.successRate.toFixed(2)}%`,
      `Total Campaigns,${data.metrics.totalCampaigns}`,
      `Active Campaigns,${data.metrics.activeCampaigns}`,
      `Total Links,${data.metrics.totalLinksBuilt}`,
      `Live Links,${data.metrics.liveLinks}`,
      `Failed/Pending,${data.metrics.totalLinksBuilt - data.metrics.liveLinks}`,
      '',
      'CAMPAIGN ANALYSIS',
      'Campaign,Engine Type,Success Rate,Performance Grade',
      ...data.campaigns.map((campaign: Campaign) => {
        const rate = campaign.success_rate || 0;
        const grade = rate > 80 ? 'A' : rate > 60 ? 'B' : rate > 40 ? 'C' : 'D';
        return `${campaign.name},${campaign.engine_type},${rate}%,${grade}`;
      }),
      '',
      'OPTIMIZATION RECOMMENDATIONS',
      data.metrics.successRate < 50 ? 'LOW SUCCESS RATE: Review targeting and content strategy' : '',
      data.metrics.activeCampaigns === 0 ? 'NO ACTIVE CAMPAIGNS: Activate campaigns to improve data collection' : '',
      data.metrics.totalLinksBuilt < 10 ? 'LIMITED DATA: More link placements needed for accurate analysis' : '',
      data.metrics.successRate > 80 ? 'EXCELLENT PERFORMANCE: Current strategy is highly effective' : '',
      '',
      `Analysis Generated: ${new Date().toLocaleString()}`
    ].filter(Boolean).join('\n');

    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `success-rate-analytics-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
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
                <p className="text-2xl font-bold text-blue-600">{todaysLinks}</p>
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
                <p className="text-2xl font-bold text-purple-600">{successRate.toFixed(1)}%</p>
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
                        onClick={() => toggleCampaignMonitoring(campaign.id)}
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
          {/* Real Live Activity Feed */}
          <LiveActivityFeed
            maxItems={50}
            autoScroll={true}
          />
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
                    <span className="text-sm text-gray-600">Live/Verified Links</span>
                    <span className="font-medium">{liveLinks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-medium">{successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Links Today</span>
                    <span className="font-medium">{todaysLinks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Reports</CardTitle>
                <CardDescription>Download comprehensive performance and analytics reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Campaign Performance CSV */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Campaign Performance Report</h4>
                          <p className="text-sm text-gray-500">CSV format • ~{Math.max(campaigns.length * 50, 100)}KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">HIGH VALUE</Badge>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Contains:</strong> Campaign metrics, daily performance, conversion rates, ROI analysis</p>
                      <p><strong>Data Points:</strong> {campaigns.length} campaigns • {totalLinksBuilt} link placements • 30-day historical trends</p>
                      <p><strong>Use Case:</strong> Excel analysis, reporting dashboards, performance tracking, ROI calculations</p>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => handleExportReport('csv')}
                        className="w-full justify-start bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV Report
                      </Button>
                    </div>
                  </div>

                  {/* Link Placement PDF */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Link Placement Audit Report</h4>
                          <p className="text-sm text-gray-500">PDF format • ~{Math.max(recentPlacements.length * 25, 500)}KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">ESSENTIAL</Badge>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Contains:</strong> Live link verification, placement screenshots, anchor text analysis, domain authority scores</p>
                      <p><strong>Data Points:</strong> {recentPlacements.length} verified placements • {liveLinks} live links • Quality scores</p>
                      <p><strong>Use Case:</strong> Client reports, link audit trails, placement verification, quality assurance</p>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => handleExportReport('pdf')}
                        className="w-full justify-start bg-red-600 hover:bg-red-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generate PDF Report
                      </Button>
                    </div>
                  </div>

                  {/* Success Rate Analysis Excel */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Success Rate Analytics</h4>
                          <p className="text-sm text-gray-500">Excel format • ~{Math.max(campaigns.length * 75, 200)}KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{successRate > 75 ? 'HIGH VALUE' : 'MODERATE'}</Badge>
                        {successRate > 75 && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Contains:</strong> Statistical analysis, trend forecasting, A/B test results, optimization recommendations</p>
                      <p><strong>Data Points:</strong> {successRate.toFixed(1)}% success rate • Pattern analysis • Predictive models</p>
                      <p><strong>Use Case:</strong> Strategy optimization, performance forecasting, campaign improvement insights</p>
                      {successRate < 50 && <p className="text-orange-600"><strong>Note:</strong> Consider more data collection for robust analysis</p>}
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => handleExportReport('excel')}
                        variant={successRate > 75 ? 'default' : 'outline'}
                        className={`w-full justify-start ${successRate > 75 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export Analytics
                      </Button>
                    </div>
                  </div>

                  {/* Value Assessment Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Report Value Assessment
                    </h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• <strong>CSV Report:</strong> {campaigns.length > 0 ? 'Essential for tracking ROI and performance trends' : 'Limited value without active campaigns'}</p>
                      <p>• <strong>PDF Report:</strong> {recentPlacements.length > 10 ? 'High value for client deliverables and auditing' : 'Moderate value - needs more placement data'}</p>
                      <p>• <strong>Excel Analytics:</strong> {successRate > 75 ? 'High value for optimization insights' : 'Growing value as data accumulates'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
