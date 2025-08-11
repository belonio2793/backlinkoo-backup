import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Database,
  TrendingUp,
  Filter,
  Download,
  Eye,
  ExternalLink,
  BarChart3,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { RealTimeUrlTracker, UrlActivityStream } from '@/services/realTimeUrlTracker';

interface CampaignDataSiphonProps {
  campaignId: string;
}

interface SiphonedData {
  urls: {
    discovered: UrlData[];
    visited: UrlData[];
    posted: UrlData[];
    verified: UrlData[];
    failed: UrlData[];
  };
  analytics: {
    discoveryRate: number;
    conversionRate: number;
    qualityScore: number;
    averageResponseTime: number;
    totalVolume: number;
  };
  trends: {
    hourly: { timestamp: string; count: number }[];
    domains: { domain: string; count: number; successRate: number }[];
    keywords: { keyword: string; count: number; relevance: number }[];
  };
}

interface UrlData {
  id: string;
  url: string;
  domain: string;
  timestamp: string;
  status: string;
  metadata: {
    authorityScore?: number;
    qualityScore?: number;
    responseTime?: number;
    keywords?: string[];
    anchorText?: string;
    placementType?: string;
  };
}

export function CampaignDataSiphon({ campaignId }: CampaignDataSiphonProps) {
  const [siphonedData, setSiphonedData] = useState<SiphonedData>({
    urls: {
      discovered: [],
      visited: [],
      posted: [],
      verified: [],
      failed: []
    },
    analytics: {
      discoveryRate: 0,
      conversionRate: 0,
      qualityScore: 0,
      averageResponseTime: 0,
      totalVolume: 0
    },
    trends: {
      hourly: [],
      domains: [],
      keywords: []
    }
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSiphonTime, setLastSiphonTime] = useState<Date | null>(null);

  // Real-time data siphoning
  useEffect(() => {
    if (!campaignId) return;

    const siphonInterval = setInterval(() => {
      siphonRealtimeData();
    }, 5000); // Siphon data every 5 seconds

    // Initial siphon
    siphonRealtimeData();

    return () => clearInterval(siphonInterval);
  }, [campaignId]);

  const siphonRealtimeData = useCallback(async () => {
    if (!campaignId) return;

    setIsLoading(true);
    try {
      // Get recent activity data
      const activities = await RealTimeUrlTracker.getRecentActivity(campaignId, 500);
      const liveStats = RealTimeUrlTracker.getLiveStats(campaignId);
      
      // Process and categorize URLs
      const categorizedUrls = categorizeUrls(activities);
      
      // Calculate analytics
      const analytics = calculateAnalytics(activities, liveStats);
      
      // Generate trends
      const trends = generateTrends(activities);

      setSiphonedData({
        urls: categorizedUrls,
        analytics,
        trends
      });

      setLastSiphonTime(new Date());
    } catch (error) {
      console.error('Error siphoning real-time data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  const categorizeUrls = (activities: UrlActivityStream[]): SiphonedData['urls'] => {
    const categorized: SiphonedData['urls'] = {
      discovered: [],
      visited: [],
      posted: [],
      verified: [],
      failed: []
    };

    const urlMap = new Map<string, UrlData>();

    activities.forEach(activity => {
      const urlData: UrlData = {
        id: activity.id,
        url: activity.url,
        domain: activity.domain,
        timestamp: activity.timestamp,
        status: activity.status,
        metadata: {
          ...activity.data,
          keywords: activity.data.keywords_matched || [],
          authorityScore: activity.data.authority_score,
          qualityScore: activity.data.quality_score,
          responseTime: activity.data.response_time,
          anchorText: activity.data.anchor_text,
          placementType: activity.data.placement_type
        }
      };

      // Update or create URL entry
      const existingUrl = urlMap.get(activity.url);
      if (existingUrl) {
        // Update with latest data
        existingUrl.timestamp = activity.timestamp;
        existingUrl.status = activity.status;
        existingUrl.metadata = { ...existingUrl.metadata, ...urlData.metadata };
      } else {
        urlMap.set(activity.url, urlData);
      }

      // Categorize based on event type and status
      switch (activity.event_type) {
        case 'discovery':
          if (activity.status === 'completed') {
            categorized.discovered.push(urlData);
          }
          break;
        case 'processing':
          if (activity.action === 'visited' && activity.status === 'completed') {
            categorized.visited.push(urlData);
          }
          break;
        case 'posting':
          if (activity.status === 'posted' || activity.status === 'completed') {
            categorized.posted.push(urlData);
          } else if (activity.status === 'failed') {
            categorized.failed.push(urlData);
          }
          break;
        case 'verification':
          if (activity.status === 'completed') {
            categorized.verified.push(urlData);
          }
          break;
      }
    });

    // Remove duplicates and sort by timestamp
    Object.keys(categorized).forEach(key => {
      const category = key as keyof SiphonedData['urls'];
      categorized[category] = categorized[category]
        .filter((url, index, arr) => arr.findIndex(u => u.url === url.url) === index)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });

    return categorized;
  };

  const calculateAnalytics = (activities: UrlActivityStream[], liveStats: any): SiphonedData['analytics'] => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentActivities = activities.filter(a => new Date(a.timestamp) > oneHourAgo);
    
    const discovered = recentActivities.filter(a => a.event_type === 'discovery' && a.status === 'completed').length;
    const posted = recentActivities.filter(a => a.event_type === 'posting' && a.status === 'completed').length;
    const visited = recentActivities.filter(a => a.event_type === 'processing' && a.action === 'visited').length;
    
    const responseTimes = activities
      .filter(a => a.data.response_time)
      .map(a => a.data.response_time)
      .filter(Boolean);

    const qualityScores = activities
      .filter(a => a.data.quality_score)
      .map(a => a.data.quality_score)
      .filter(Boolean);

    return {
      discoveryRate: discovered, // URLs discovered per hour
      conversionRate: visited > 0 ? (posted / visited) * 100 : 0,
      qualityScore: qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0,
      averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
      totalVolume: activities.length
    };
  };

  const generateTrends = (activities: UrlActivityStream[]): SiphonedData['trends'] => {
    // Hourly trends
    const hourlyMap = new Map<string, number>();
    const now = new Date();
    
    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().slice(0, 13) + ':00:00.000Z';
      hourlyMap.set(hourKey, 0);
    }

    activities.forEach(activity => {
      const activityHour = new Date(activity.timestamp);
      activityHour.setMinutes(0, 0, 0);
      const hourKey = activityHour.toISOString();
      
      if (hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + 1);
      }
    });

    const hourly = Array.from(hourlyMap.entries()).map(([timestamp, count]) => ({
      timestamp,
      count
    }));

    // Domain trends
    const domainMap = new Map<string, { total: number; successful: number }>();
    
    activities.forEach(activity => {
      const domain = activity.domain;
      const current = domainMap.get(domain) || { total: 0, successful: 0 };
      current.total++;
      
      if (activity.status === 'completed' || activity.status === 'posted') {
        current.successful++;
      }
      
      domainMap.set(domain, current);
    });

    const domains = Array.from(domainMap.entries())
      .map(([domain, stats]) => ({
        domain,
        count: stats.total,
        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Keyword trends (mock data for demonstration)
    const keywords = [
      { keyword: 'technology', count: 45, relevance: 85 },
      { keyword: 'web development', count: 38, relevance: 92 },
      { keyword: 'digital marketing', count: 32, relevance: 78 },
      { keyword: 'software', count: 28, relevance: 88 },
      { keyword: 'business', count: 25, relevance: 72 }
    ];

    return { hourly, domains, keywords };
  };

  const getFilteredUrls = (urls: UrlData[]) => {
    let filtered = urls;

    if (searchQuery) {
      filtered = filtered.filter(url => 
        url.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        url.domain.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (domainFilter) {
      filtered = filtered.filter(url => 
        url.domain.toLowerCase().includes(domainFilter.toLowerCase())
      );
    }

    return filtered;
  };

  const exportSiphonedData = (category: string) => {
    const data = siphonedData.urls[category as keyof SiphonedData['urls']];
    const csvContent = [
      'URL,Domain,Timestamp,Status,Authority Score,Quality Score,Response Time,Keywords',
      ...data.map(url => 
        `${url.url},${url.domain},${url.timestamp},${url.status},${url.metadata.authorityScore || ''},${url.metadata.qualityScore || ''},${url.metadata.responseTime || ''},"${(url.metadata.keywords || []).join(';')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `siphoned-${category}-${campaignId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Campaign Data Siphon
                <Badge variant="outline" className="ml-2">
                  <Database className="h-3 w-3 mr-1" />
                  {siphonedData.analytics.totalVolume} Records
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time data extraction and analysis from URL processing pipeline
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-xs text-gray-500">
                {lastSiphonTime && (
                  <>
                    <div>Last Siphon:</div>
                    <div>{lastSiphonTime.toLocaleTimeString()}</div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={siphonRealtimeData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{siphonedData.analytics.discoveryRate}</p>
              <p className="text-sm text-gray-600">URLs/Hour</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{siphonedData.analytics.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Conversion</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{siphonedData.analytics.qualityScore.toFixed(0)}</p>
              <p className="text-sm text-gray-600">Avg Quality</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{Math.round(siphonedData.analytics.averageResponseTime)}</p>
              <p className="text-sm text-gray-600">Avg Response (ms)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Database className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-600">{siphonedData.analytics.totalVolume}</p>
              <p className="text-sm text-gray-600">Total Volume</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Siphoned Data Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discovered">
            Discovered ({siphonedData.urls.discovered.length})
          </TabsTrigger>
          <TabsTrigger value="posted">
            Posted ({siphonedData.urls.posted.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({siphonedData.urls.verified.length})
          </TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* URL Processing Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle>URL Processing Pipeline</CardTitle>
              <CardDescription>Real-time flow of URLs through the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Discovered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={100} className="w-32" />
                    <span className="text-sm font-medium">{siphonedData.urls.discovered.length}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={siphonedData.urls.discovered.length > 0 ? (siphonedData.urls.visited.length / siphonedData.urls.discovered.length) * 100 : 0} 
                      className="w-32" 
                    />
                    <span className="text-sm font-medium">{siphonedData.urls.visited.length}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Posted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={siphonedData.urls.visited.length > 0 ? (siphonedData.urls.posted.length / siphonedData.urls.visited.length) * 100 : 0} 
                      className="w-32" 
                    />
                    <span className="text-sm font-medium">{siphonedData.urls.posted.length}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={siphonedData.urls.posted.length > 0 ? (siphonedData.urls.verified.length / siphonedData.urls.posted.length) * 100 : 0} 
                      className="w-32" 
                    />
                    <span className="text-sm font-medium">{siphonedData.urls.verified.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {['discovered', 'posted', 'verified'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search URLs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Filter by domain..."
                      value={domainFilter}
                      onChange={(e) => setDomainFilter(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => exportSiphonedData(category)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* URL List */}
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{category} URLs</CardTitle>
                <CardDescription>
                  URLs in the {category} stage of processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getFilteredUrls(siphonedData.urls[category as keyof SiphonedData['urls']]).map((url, index) => (
                    <div key={`${url.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">{url.url}</span>
                          <Badge variant="outline" className="text-xs">
                            {url.domain}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(url.timestamp).toLocaleString()}</span>
                          {url.metadata.authorityScore && (
                            <span>Authority: {url.metadata.authorityScore}</span>
                          )}
                          {url.metadata.qualityScore && (
                            <span>Quality: {url.metadata.qualityScore}</span>
                          )}
                          {url.metadata.responseTime && (
                            <span>Response: {url.metadata.responseTime}ms</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(url.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="trends" className="space-y-6">
          {/* Hourly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Activity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {siphonedData.trends.hourly.map((point, index) => {
                  const maxCount = Math.max(...siphonedData.trends.hourly.map(p => p.count));
                  const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
                  
                  return (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-t min-w-[8px] flex-1 hover:bg-blue-600 transition-colors"
                      style={{ height: `${height}%` }}
                      title={`${new Date(point.timestamp).getHours()}:00 - ${point.count} activities`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Domains */}
          <Card>
            <CardHeader>
              <CardTitle>Top Domains by Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {siphonedData.trends.domains.slice(0, 10).map((domain, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{domain.domain}</span>
                      <Badge variant="outline" className="text-xs">
                        {domain.count} URLs
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={domain.successRate} className="w-20" />
                      <span className="text-sm text-gray-500">{domain.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
