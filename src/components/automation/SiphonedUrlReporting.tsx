import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Download,
  ExternalLink,
  Globe,
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Filter,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { urlDataSiphon, SiphonedUrlData, UrlProcessingStats } from '@/services/urlDataSiphon';

interface SiphonedUrlReportingProps {
  campaignId?: string;
}

export function SiphonedUrlReporting({ campaignId }: SiphonedUrlReportingProps) {
  const [siphonedData, setSiphonedData] = useState<SiphonedUrlData[]>([]);
  const [stats, setStats] = useState<UrlProcessingStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'discovered' | 'visited' | 'posted' | 'verified'>('all');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'all'>('24h');

  useEffect(() => {
    // Load initial data
    loadSiphonedData();

    // Subscribe to real-time updates
    const unsubscribeData = urlDataSiphon.subscribe((newData) => {
      if (!campaignId || newData.campaign_id === campaignId) {
        loadSiphonedData();
      }
    });

    const unsubscribeStats = urlDataSiphon.subscribeToStats((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubscribeData();
      unsubscribeStats();
    };
  }, [campaignId, filter, timeFilter]);

  const loadSiphonedData = () => {
    const timeRange = getTimeRange();
    const filters: any = {};
    
    if (filter !== 'all') {
      filters.action = filter;
    }
    
    if (campaignId) {
      filters.campaign_id = campaignId;
    }
    
    if (timeRange) {
      filters.timeRange = timeRange;
    }

    const filteredData = urlDataSiphon.getFilteredData(filters);
    setSiphonedData(filteredData);

    // Generate stats
    const currentStats = urlDataSiphon.generateStats();
    setStats(currentStats);
  };

  const getTimeRange = () => {
    const now = new Date();
    switch (timeFilter) {
      case '1h':
        return { start: new Date(now.getTime() - 60 * 60 * 1000), end: now };
      case '24h':
        return { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };
      case '7d':
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
      default:
        return null;
    }
  };

  const handleExportData = (format: 'csv' | 'json' | 'excel') => {
    const exportedData = urlDataSiphon.exportForReporting(format);
    
    const blob = new Blob([exportedData], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siphoned-url-data-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'discovered':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'visited':
        return <ExternalLink className="h-4 w-4 text-purple-500" />;
      case 'analyzed':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case 'posted':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSuccessRate = (data: SiphonedUrlData[]) => {
    if (data.length === 0) return 0;
    const successCount = data.filter(d => d.success).length;
    return (successCount / data.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">URLs Processed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total_urls_processed}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful Placements</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successful_placements}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.average_response_time}ms</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {getSuccessRate(siphonedData).toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Reporting Tabs */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">Siphoned Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Siphoned URL Data Stream</CardTitle>
                  <CardDescription>
                    All URLs processed and their outcomes, automatically captured from live activities
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={timeFilter} 
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="all">All Time</option>
                  </select>
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">All Actions</option>
                    <option value="discovered">Discovered</option>
                    <option value="visited">Visited</option>
                    <option value="posted">Posted</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {siphonedData.length > 0 ? siphonedData.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getActionIcon(item.action)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.action}
                            </Badge>
                            <Badge 
                              variant={item.success ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {item.success ? 'Success' : 'Failed'}
                            </Badge>
                            {item.metadata.domain_authority && (
                              <Badge variant="secondary" className="text-xs">
                                DA: {item.metadata.domain_authority}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {item.metadata.domain}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            
                            {item.metadata.anchor_text && (
                              <div className="text-xs text-gray-600">
                                Anchor: "{item.metadata.anchor_text}"
                              </div>
                            )}
                            
                            {item.metadata.target_url && (
                              <div className="text-xs text-green-600">
                                Target: {item.metadata.target_url}
                              </div>
                            )}
                            
                            {item.metadata.response_time && (
                              <div className="text-xs text-purple-600">
                                Response: {item.metadata.response_time}ms
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data found for the selected filters.</p>
                    <p className="text-sm">URLs will appear here as they are processed by active campaigns.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Domains</CardTitle>
                  <CardDescription>Domains with the highest success rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.top_domains.slice(0, 5).map((domain, index) => (
                      <div key={domain.domain} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{domain.domain}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{domain.count} attempts</span>
                          <div className="flex items-center gap-2">
                            <Progress value={domain.success_rate} className="w-20 h-2" />
                            <span className="text-sm font-medium">{domain.success_rate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Summary</CardTitle>
                  <CardDescription>Today's URL processing performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.daily_summary.urls_processed}</div>
                      <div className="text-sm text-gray-600">URLs Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.daily_summary.success_rate}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.top_domains.length}</div>
                      <div className="text-sm text-gray-600">Unique Domains</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{stats.daily_summary.top_performing_domain}</div>
                      <div className="text-sm text-gray-600">Top Domain</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Siphoned Data</CardTitle>
              <CardDescription>Download comprehensive reports of all processed URLs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleExportData('csv')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button 
                  onClick={() => handleExportData('json')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button 
                  onClick={() => handleExportData('excel')}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <BarChart3 className="h-4 w-4" />
                  Export Excel
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium mb-2">Export Information</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>CSV:</strong> Raw data with timestamps, URLs, success rates, and metadata</p>
                  <p>• <strong>JSON:</strong> Complete dataset with statistics and structured metadata</p>
                  <p>• <strong>Excel:</strong> Formatted report with analytics and top-performing domains</p>
                  <p>• <strong>Data Points:</strong> {siphonedData.length} processed URLs in current filter</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
