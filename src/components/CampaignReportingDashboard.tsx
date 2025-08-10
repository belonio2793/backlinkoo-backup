/**
 * Campaign Reporting Dashboard
 * Comprehensive reporting view with tables and analytics
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Users, 
  Globe, 
  Link, 
  BarChart3,
  Eye,
  MousePointer,
  Award,
  Clock,
  Play,
  Pause,
  Save,
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { useCampaignReporting } from '@/hooks/useCampaignCounters';
import type { CampaignCounters } from '@/services/campaignCounterService';

export function CampaignReportingDashboard() {
  const { reportingData, lastUpdate, refresh } = useCampaignReporting();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [sortBy, setSortBy] = useState<'quality' | 'links' | 'velocity' | 'domains'>('quality');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'saved'>('all');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'saved': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'saved': return <Save className="h-3 w-3" />;
      default: return <RefreshCw className="h-3 w-3" />;
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredCampaigns = reportingData.campaigns
    .filter(campaign => filterStatus === 'all' || campaign.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.qualityScore - a.qualityScore;
        case 'links':
          return b.linksPublished - a.linksPublished;
        case 'velocity':
          return b.velocity - a.velocity;
        case 'domains':
          return b.domainsReached - a.domainsReached;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaign Analytics</h2>
          <p className="text-gray-600">Comprehensive performance reporting and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{reportingData.global.totalCampaigns}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {reportingData.global.activeCampaigns} active, {reportingData.global.pausedCampaigns} paused
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Links Today</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(reportingData.summary.totalLinksToday)}</p>
              </div>
              <Link className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-xs text-green-600">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Avg {Math.floor(reportingData.summary.averageVelocity)} links/hour
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">{formatPercentage(reportingData.global.globalSuccessRate)}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Progress value={reportingData.global.globalSuccessRate} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Health</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(reportingData.summary.overallHealth)}`}>
                  {Math.floor(reportingData.summary.overallHealth)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              System performance score
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Details</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Campaigns</CardTitle>
                <CardDescription>Ranked by quality score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredCampaigns.slice(0, 5).map((campaign, index) => (
                    <div key={campaign.campaignId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">Campaign {campaign.campaignId.slice(-8)}</div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(campaign.linksPublished)} links • {formatNumber(campaign.domainsReached)} domains
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getPerformanceColor(campaign.qualityScore)}`}>
                          {Math.floor(campaign.qualityScore)}
                        </div>
                        <div className="text-xs text-gray-500">Quality</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Activity</CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {formatNumber(reportingData.global.totalUrls)}
                      </div>
                      <div className="text-xs text-gray-600">URLs in Database</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {formatNumber(reportingData.global.totalDomains)}
                      </div>
                      <div className="text-xs text-gray-600">Domains Available</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Network Utilization</span>
                      <span>{Math.floor((reportingData.global.activeCampaigns / Math.max(reportingData.global.totalCampaigns, 1)) * 100)}%</span>
                    </div>
                    <Progress value={(reportingData.global.activeCampaigns / Math.max(reportingData.global.totalCampaigns, 1)) * 100} className="h-2" />
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Campaigns</option>
                <option value="active">Active Only</option>
                <option value="paused">Paused Only</option>
                <option value="saved">Saved Only</option>
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="quality">Sort by Quality</option>
                <option value="links">Sort by Links</option>
                <option value="velocity">Sort by Velocity</option>
                <option value="domains">Sort by Domains</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {filteredCampaigns.length} of {reportingData.campaigns.length} campaigns
            </div>
          </div>

          {/* Campaign Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead>Domains</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Velocity</TableHead>
                    <TableHead>Runtime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.campaignId}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">Campaign {campaign.campaignId.slice(-8)}</div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(campaign.totalClicks)} clicks
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {getStatusIcon(campaign.status)}
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatNumber(campaign.linksPublished)}</div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(campaign.liveLinks)} live
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatNumber(campaign.domainsReached)}</div>
                          <div className="text-xs text-gray-500">
                            DA {Math.floor(campaign.domainAuthority)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getPerformanceColor(campaign.qualityScore)}`}>
                          {Math.floor(campaign.qualityScore)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatPercentage(campaign.successRate)}</div>
                          <Progress value={campaign.successRate} className="h-1 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{Math.floor(campaign.velocity)}/hr</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{Math.floor(campaign.totalRuntime)}m</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Excellent (90+)', 'Good (75-89)', 'Fair (60-74)', 'Poor (<60)'].map((range, index) => {
                    const counts = [
                      filteredCampaigns.filter(c => c.qualityScore >= 90).length,
                      filteredCampaigns.filter(c => c.qualityScore >= 75 && c.qualityScore < 90).length,
                      filteredCampaigns.filter(c => c.qualityScore >= 60 && c.qualityScore < 75).length,
                      filteredCampaigns.filter(c => c.qualityScore < 60).length,
                    ];
                    const percentage = filteredCampaigns.length > 0 ? (counts[index] / filteredCampaigns.length) * 100 : 0;
                    
                    return (
                      <div key={range}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{range}</span>
                          <span>{counts[index]} campaigns ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">Top Performer</div>
                    <div className="text-sm text-green-600">
                      {reportingData.summary.topPerformingCampaign ? 
                        `Campaign ${reportingData.summary.topPerformingCampaign.slice(-8)}` : 
                        'No campaigns yet'
                      }
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">Average Velocity</div>
                    <div className="text-sm text-blue-600">
                      {Math.floor(reportingData.summary.averageVelocity)} links/hour
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800">Total Engagement</div>
                    <div className="text-sm text-purple-600">
                      {formatNumber(reportingData.global.totalClicks)} total clicks
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="font-medium text-orange-800">Network Health</div>
                    <div className="text-sm text-orange-600">
                      {Math.floor(reportingData.summary.overallHealth)}% system performance
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
