/**
 * Campaign Counter Dashboard
 * Real-time metrics dashboard with persistent counters
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
  RefreshCw
} from 'lucide-react';
import { campaignCounterService, type CampaignCounters, type GlobalCounters } from '@/services/campaignCounterService';

interface CampaignCounterDashboardProps {
  campaignId?: string;
  showGlobal?: boolean;
  compact?: boolean;
}

export function CampaignCounterDashboard({ 
  campaignId, 
  showGlobal = true, 
  compact = false 
}: CampaignCounterDashboardProps) {
  const [counters, setCounters] = useState<CampaignCounters | null>(null);
  const [globalCounters, setGlobalCounters] = useState<GlobalCounters | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateCounters = () => {
      if (campaignId) {
        const campaignCounters = campaignCounterService.getCampaignCounters(campaignId);
        setCounters(campaignCounters);
      }
      
      if (showGlobal) {
        const global = campaignCounterService.getGlobalCounters();
        setGlobalCounters(global);
      }
      
      setLastUpdate(new Date());
    };

    // Initial load
    updateCounters();

    // Update every 30 seconds
    const interval = setInterval(updateCounters, 30000);

    return () => clearInterval(interval);
  }, [campaignId, showGlobal]);

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
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'saved': return 'bg-gray-500';
      default: return 'bg-gray-500';
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

  if (compact && counters) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Campaign Metrics</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(counters.status)}`} />
              <Badge variant="outline" className="text-xs">
                {getStatusIcon(counters.status)}
                {counters.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{formatNumber(counters.linksPublished)}</div>
              <div className="text-xs text-gray-500">Links Published</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{formatNumber(counters.domainsReached)}</div>
              <div className="text-xs text-gray-500">Domains Reached</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{formatPercentage(counters.successRate)}</div>
              <div className="text-xs text-gray-500">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{formatNumber(counters.velocity)}</div>
              <div className="text-xs text-gray-500">Links/Hour</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Overview */}
      {showGlobal && globalCounters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Network Overview
            </CardTitle>
            <CardDescription>
              Real-time metrics across all campaigns and database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-xl font-bold text-blue-600">
                    {formatNumber(globalCounters.totalDomains)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Total Domains</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Link className="h-4 w-4 text-green-600" />
                  <span className="text-xl font-bold text-green-600">
                    {formatNumber(globalCounters.totalUrls)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Total URLs</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-xl font-bold text-purple-600">
                    {globalCounters.activeCampaigns}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Active Campaigns</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="text-xl font-bold text-orange-600">
                    {formatNumber(globalCounters.totalLinksPublished)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Links Published</div>
              </div>
              
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Award className="h-4 w-4 text-teal-600" />
                  <span className="text-xl font-bold text-teal-600">
                    {formatPercentage(globalCounters.globalSuccessRate)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MousePointer className="h-4 w-4 text-indigo-600" />
                  <span className="text-xl font-bold text-indigo-600">
                    {formatNumber(globalCounters.totalClicks)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Total Clicks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Specific Metrics */}
      {counters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Core Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Core Performance
                </span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(counters.status)}`} />
                  <Badge variant="outline" className="text-xs">
                    {getStatusIcon(counters.status)}
                    {counters.status}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(counters.linksPublished)}
                  </div>
                  <div className="text-xs text-gray-500">Links Published</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.floor(counters.incrementRates.linksPerMinute * 60)}/hr
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(counters.domainsReached)}
                  </div>
                  <div className="text-xs text-gray-500">Domains Reached</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.floor(counters.incrementRates.domainsPerHour)}/hr
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Success Rate</span>
                  <span className="font-medium">{formatPercentage(counters.successRate)}</span>
                </div>
                <Progress value={counters.successRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* URL Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatNumber(counters.liveLinks)}
                  </div>
                  <div className="text-xs text-gray-600">Live Links</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {formatNumber(counters.pendingLinks)}
                  </div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatNumber(counters.totalUrlsCompleted)}
                </div>
                <div className="text-xs text-gray-600">Total URLs Completed</div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {formatNumber(counters.uniqueDomains)}
                </div>
                <div className="text-xs text-gray-600">Unique Domains</div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement & Quality */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Engagement & Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xl font-bold text-indigo-600">
                    {formatNumber(counters.totalClicks)}
                  </div>
                  <div className="text-xs text-gray-500">Total Clicks</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.floor(counters.incrementRates.clicksPerHour)}/hr
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-teal-600">
                    {Math.floor(counters.domainAuthority)}
                  </div>
                  <div className="text-xs text-gray-500">Avg Authority</div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Quality Score</span>
                  <span className="font-medium">{Math.floor(counters.qualityScore)}</span>
                </div>
                <Progress value={counters.qualityScore} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Conversion Rate</span>
                  <span className="font-medium">{formatPercentage(counters.conversionRate)}</span>
                </div>
                <Progress value={counters.conversionRate * 10} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {Math.floor(counters.velocity)}
                  </div>
                  <div className="text-xs text-gray-500">Links/Hour</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.floor(counters.reachScore)}
                  </div>
                  <div className="text-xs text-gray-500">Reach Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {Math.floor(counters.totalRuntime)}m
                  </div>
                  <div className="text-xs text-gray-500">Runtime</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {formatPercentage(counters.conversionRate)}
                  </div>
                  <div className="text-xs text-gray-500">Conversion</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-teal-600">
                    {counters.failedLinks}
                  </div>
                  <div className="text-xs text-gray-500">Failed Links</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">
                    {new Date(counters.lastUpdate).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500">Last Update</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Real-time monitoring active</span>
        </div>
      </div>
    </div>
  );
}
