import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Target, 
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useDatabaseCampaignManager } from '@/hooks/useDatabaseCampaignManager';
import { AutomationDatabaseService } from '@/services/automationDatabaseService';
import type { LinkPlacement, CampaignReport } from '@/types/automationTypes';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ReportingDashboardProps {
  selectedCampaignId?: string;
}

export function ReportingDashboard({ selectedCampaignId }: ReportingDashboardProps) {
  const { 
    campaigns, 
    linkPlacements, 
    dashboardData, 
    loadLinkPlacements,
    loading 
  } = useDatabaseCampaignManager();

  const [reports, setReports] = useState<CampaignReport[]>([]);
  const [filteredPlacements, setFilteredPlacements] = useState<LinkPlacement[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');

  // Filter placements based on selected criteria
  useEffect(() => {
    let filtered = linkPlacements;

    // Filter by campaign if specified
    if (selectedCampaignId) {
      filtered = filtered.filter(p => p.campaign_id === selectedCampaignId);
    }

    // Filter by engine type
    if (selectedEngine !== 'all') {
      const engineCampaigns = campaigns
        .filter(c => c.engine_type === selectedEngine)
        .map(c => c.id);
      filtered = filtered.filter(p => engineCampaigns.includes(p.campaign_id));
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const cutoffDate = subDays(new Date(), days);
      filtered = filtered.filter(p => new Date(p.created_at) >= cutoffDate);
    }

    setFilteredPlacements(filtered);
  }, [linkPlacements, selectedCampaignId, selectedEngine, timeRange, campaigns]);

  // Calculate metrics from filtered data
  const calculateMetrics = () => {
    const total = filteredPlacements.length;
    const live = filteredPlacements.filter(p => p.status === 'live').length;
    const pending = filteredPlacements.filter(p => p.status === 'pending').length;
    const failed = filteredPlacements.filter(p => p.status === 'failed' || p.status === 'rejected').length;
    const successRate = total > 0 ? (live / total) * 100 : 0;
    const avgDA = total > 0 ? filteredPlacements.reduce((sum, p) => sum + p.domain_authority, 0) / total : 0;
    const totalCost = filteredPlacements.reduce((sum, p) => sum + p.cost, 0);

    return {
      total,
      live,
      pending,
      failed,
      successRate,
      avgDA,
      totalCost
    };
  };

  const metrics = calculateMetrics();

  // Get top performing domains
  const getTopDomains = () => {
    const domainStats = filteredPlacements.reduce((acc, placement) => {
      const domain = placement.source_domain;
      if (!acc[domain]) {
        acc[domain] = { count: 0, live: 0, avgDA: 0 };
      }
      acc[domain].count++;
      if (placement.status === 'live') acc[domain].live++;
      acc[domain].avgDA = (acc[domain].avgDA + placement.domain_authority) / acc[domain].count;
      return acc;
    }, {} as Record<string, { count: number; live: number; avgDA: number }>);

    return Object.entries(domainStats)
      .map(([domain, stats]) => ({
        domain,
        ...stats,
        successRate: stats.count > 0 ? (stats.live / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.live - a.live)
      .slice(0, 10);
  };

  const topDomains = getTopDomains();

  // Generate report data by day for charts
  const getDailyData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dailyData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayPlacements = filteredPlacements.filter(p => 
        format(new Date(p.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      dailyData.push({
        date: format(date, 'MMM dd'),
        total: dayPlacements.length,
        live: dayPlacements.filter(p => p.status === 'live').length,
        pending: dayPlacements.filter(p => p.status === 'pending').length,
        failed: dayPlacements.filter(p => p.status === 'failed' || p.status === 'rejected').length
      });
    }
    
    return dailyData;
  };

  const dailyData = getDailyData();

  const handleExportReport = () => {
    const csvContent = [
      ['Date', 'Source Domain', 'Target URL', 'Anchor Text', 'Status', 'Domain Authority', 'Cost'].join(','),
      ...filteredPlacements.map(p => [
        format(new Date(p.created_at), 'yyyy-MM-dd'),
        p.source_domain,
        p.target_url,
        p.anchor_text,
        p.status,
        p.domain_authority,
        p.cost
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Campaign Analytics & Reporting
              </CardTitle>
              <CardDescription>
                Comprehensive performance analytics and link placement tracking
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadLinkPlacements()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Range:</span>
              <div className="flex rounded-lg border">
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-sm ${
                      timeRange === range
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {range === 'all' ? 'All Time' : range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Engine Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Engine:</span>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Engines</option>
                <option value="blog_comments">Blog Comments</option>
                <option value="web2_platforms">Web 2.0</option>
                <option value="forum_profiles">Forum Profiles</option>
                <option value="social_media">Social Media</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.live} live, {metrics.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Domain Authority</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgDA.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Quality score indicator
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average ${metrics.total > 0 ? (metrics.totalCost / metrics.total).toFixed(2) : '0.00'} per link
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="placements">Link Placements</TabsTrigger>
          <TabsTrigger value="domains">Top Domains</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Link Building Activity</CardTitle>
              <CardDescription>
                Daily breakdown of link placements over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyData.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm font-medium">{day.date}</div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-sm">{day.live} live</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-sm">{day.pending} pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-sm">{day.failed} failed</span>
                      </div>
                      <div className="text-sm font-medium">{day.total} total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Link Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{metrics.live}</div>
                  <div className="text-sm text-muted-foreground">Live Links</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{metrics.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{metrics.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Link Placements</CardTitle>
              <CardDescription>
                Latest link placements with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPlacements.slice(0, 20).map((placement) => (
                  <div key={placement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={
                            placement.status === 'live' ? 'default' :
                            placement.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {placement.status}
                        </Badge>
                        <span className="font-medium">{placement.source_domain}</span>
                        <span className="text-sm text-muted-foreground">
                          DA: {placement.domain_authority}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Anchor: {placement.anchor_text}</div>
                        <div>Target: {placement.target_url}</div>
                        <div>Placed: {format(new Date(placement.created_at), 'MMM dd, yyyy')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${placement.cost}</div>
                      <div className="text-sm text-muted-foreground">
                        {placement.placement_type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPlacements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No link placements found for the selected criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Domains</CardTitle>
              <CardDescription>
                Domains with the highest success rates and link counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDomains.map((domain, index) => (
                  <div key={domain.domain} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{domain.domain}</div>
                        <div className="text-sm text-muted-foreground">
                          DA: {Math.round(domain.avgDA)} • {domain.count} total links
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {domain.live} live
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {domain.successRate.toFixed(1)}% success
                      </div>
                    </div>
                  </div>
                ))}
                {topDomains.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No domain data available for the selected criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                Advanced analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Campaign Performance */}
                <div>
                  <h4 className="font-medium mb-3">Campaign Performance</h4>
                  <div className="space-y-3">
                    {campaigns.map((campaign) => {
                      const campaignPlacements = filteredPlacements.filter(p => p.campaign_id === campaign.id);
                      const campaignLive = campaignPlacements.filter(p => p.status === 'live').length;
                      const campaignTotal = campaignPlacements.length;
                      const campaignSuccessRate = campaignTotal > 0 ? (campaignLive / campaignTotal) * 100 : 0;

                      return (
                        <div key={campaign.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {campaign.engine_type.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{campaignLive}/{campaignTotal}</div>
                            <div className="text-sm text-muted-foreground">
                              {campaignSuccessRate.toFixed(1)}% success
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quality Metrics */}
                <div>
                  <h4 className="font-medium mb-3">Quality Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {filteredPlacements.filter(p => p.domain_authority >= 70).length}
                      </div>
                      <div className="text-sm text-muted-foreground">High DA (70+)</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {filteredPlacements.filter(p => p.quality_score >= 80).length}
                      </div>
                      <div className="text-sm text-muted-foreground">High Quality (80+)</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
