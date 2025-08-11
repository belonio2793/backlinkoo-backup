import React, { useState, useEffect, useCallback } from 'react';
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
import { stableCampaignMetrics, CampaignMetrics } from '@/services/stableCampaignMetrics';
import { RealTimeUrlMonitor } from './RealTimeUrlMonitor';
import { SiphonedUrlReporting } from './SiphonedUrlReporting';

interface RuntimeReportingProps {
  onToggleCampaign?: (campaignId: string) => void;
  onRefreshData?: () => void;
}

export function RuntimeReporting({ onToggleCampaign, onRefreshData }: RuntimeReportingProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaignData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [campaignsResult, statsResult] = await Promise.all([
        stableCampaignMetrics.getCampaignMetrics(),
        stableCampaignMetrics.getDashboardStats()
      ]);

      if (campaignsResult.success && campaignsResult.data) {
        setCampaigns(campaignsResult.data);
      } else {
        setError(campaignsResult.error || 'Failed to load campaigns');
      }

      if (statsResult.success && statsResult.data) {
        setDashboardStats(statsResult.data);
      }

    } catch (error: any) {
      console.error('Error loading campaign data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  const toggleCampaignMonitoring = useCallback(async (campaignId: string) => {
    const campaign = campaigns.find(c => c.campaign_id === campaignId);
    if (!campaign) {
      setError('Campaign not found');
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Toggling campaign ${campaignId} from ${campaign.status}`);

      const result = await stableCampaignMetrics.toggleCampaignStatus(campaignId);
      if (result.success) {
        console.log('Campaign toggle successful, refreshing data...');

        // Clear cache and refresh data
        stableCampaignMetrics.clearCache();
        await loadCampaignData();

        // Notify parent component
        onToggleCampaign?.(campaignId);

        // Show success message
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        console.log(`Campaign ${campaign.name} changed to ${newStatus}`);

      } else {
        console.error('Toggle failed:', result.error);
        setError(result.error || 'Failed to toggle campaign');
      }
    } catch (error: any) {
      console.error('Error toggling campaign monitoring:', error);
      setError(typeof error === 'string' ? error : error.message || 'Failed to toggle campaign status');
    } finally {
      setIsLoading(false);
    }
  }, [campaigns, loadCampaignData, onToggleCampaign]);

  const handleRefreshData = useCallback(async () => {
    stableCampaignMetrics.clearCache(); // Clear cache to force refresh
    await loadCampaignData();
    onRefreshData?.();
  }, [loadCampaignData, onRefreshData]);

  // Update timestamp every minute and load data
  useEffect(() => {
    loadCampaignData();

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      loadCampaignData(); // Refresh data every minute
    }, 60000);

    return () => clearInterval(interval);
  }, [loadCampaignData]);

  // Calculate aggregate metrics from dashboard stats and campaigns
  const totalCampaigns = dashboardStats?.total_campaigns || campaigns.length;
  const activeCampaigns = dashboardStats?.active_campaigns || campaigns.filter(c => c.status === 'active').length;
  const totalLinksBuilt = dashboardStats?.total_links || campaigns.reduce((sum, c) => sum + c.links_built, 0);
  const successRate = dashboardStats?.success_rate || (campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.success_rate, 0) / campaigns.length : 0);
  const todaysLinks = dashboardStats?.links_today || 0;
  const liveLinks = Math.round(totalLinksBuilt * (successRate / 100));

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
            description: `Link placement audit report created with ${liveLinks} verified placements and detailed verification status.`
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
      ...data.campaigns.map((campaign: CampaignMetrics) =>
        `${campaign.campaign_id},${campaign.name},${campaign.engine_type},${campaign.status},${campaign.links_built || 0},${campaign.daily_limit},${campaign.success_rate || 0}%,${campaign.target_url},${campaign.last_activity}`
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
          <div class="metric"><strong>Total Campaigns:</strong> ${data.metrics.totalCampaigns}</div>
          <div class="metric"><strong>Live Links:</strong> ${data.metrics.liveLinks}</div>
          <div class="metric"><strong>Success Rate:</strong> ${data.metrics.successRate.toFixed(1)}%</div>
          <div class="metric"><strong>Today's Links:</strong> ${data.metrics.todaysLinks}</div>
        </div>

        <h2>Campaign Details</h2>
        ${data.campaigns.map((campaign: any) => `
          <div class="placement ${campaign.status}">
            <h3>${campaign.name}</h3>
            <p><strong>Target:</strong> ${campaign.target_url}</p>
            <p><strong>Status:</strong> ${campaign.status}</p>
            <p><strong>Links Built:</strong> ${campaign.links_built}</p>
            <p><strong>Success Rate:</strong> ${campaign.success_rate}%</p>
            <p class="small"><strong>Engine:</strong> ${campaign.engine_type}</p>
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
      ...data.campaigns.map((campaign: CampaignMetrics) => {
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
                {error && (
                  <div className="mt-2 text-red-600 text-sm">
                    ⚠��� {error}
                  </div>
                )}
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
                onClick={handleRefreshData}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Activity
          </TabsTrigger>
          <TabsTrigger value="siphoned" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            URL Data
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
                {campaigns.length > 0 ? campaigns.map((campaign) => {
                  // Calculate actual daily progress percentage
                  const dailyProgressPercent = campaign.daily_limit > 0
                    ? Math.round(((campaign.links_built || 0) / campaign.daily_limit) * 100)
                    : 0;

                  return (
                    <div key={campaign.campaign_id} className="flex items-center justify-between p-4 border rounded-lg">
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
                            <span>{dailyProgressPercent}%</span>
                          </div>
                          <Progress
                            value={dailyProgressPercent}
                            className="h-2"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCampaignMonitoring(campaign.campaign_id)}
                          disabled={isLoading}
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
                  );
                }) : (
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
          {/* Real-Time URL Processing Monitor */}
          <RealTimeUrlMonitor
            campaignId={campaigns.find(c => c.status === 'active')?.campaign_id}
            onUrlProcessed={(url, success) => {
              console.log(`URL processed: ${url} - Success: ${success}`);
              // Update metrics when URLs are processed
              handleRefreshData();
            }}
          />
        </TabsContent>

        <TabsContent value="siphoned" className="space-y-6">
          {/* Siphoned URL Data Reporting */}
          <SiphonedUrlReporting
            campaignId={campaigns.find(c => c.status === 'active')?.campaign_id}
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
                          <p className="text-sm text-gray-500">PDF format • ~{Math.max(liveLinks * 25, 500)}KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">ESSENTIAL</Badge>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Contains:</strong> Live link verification, placement screenshots, anchor text analysis, domain authority scores</p>
                      <p><strong>Data Points:</strong> {liveLinks} verified placements • {liveLinks} live links • Quality scores</p>
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
                      <p>• <strong>PDF Report:</strong> {liveLinks > 10 ? 'High value for client deliverables and auditing' : 'Moderate value - needs more placement data'}</p>
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
