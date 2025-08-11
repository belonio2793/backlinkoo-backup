import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Globe, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Eye,
  AlertCircle,
  Zap,
  Target,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { RealTimeUrlTracker, UrlActivityStream, LiveUrlStats } from '@/services/realTimeUrlTracker';
import { CampaignRuntimeEngine } from '@/services/campaignRuntimeEngine';

interface LiveUrlPostingMonitorProps {
  campaignId: string;
  onUrlPosted?: (url: string, success: boolean) => void;
  showControls?: boolean;
  maxHeight?: string;
}

interface ActivityFilter {
  eventType: string[];
  status: string[];
  timeRange: '1h' | '6h' | '24h' | 'all';
}

export function LiveUrlPostingMonitor({ 
  campaignId, 
  onUrlPosted, 
  showControls = true,
  maxHeight = "600px"
}: LiveUrlPostingMonitorProps) {
  const [activities, setActivities] = useState<UrlActivityStream[]>([]);
  const [liveStats, setLiveStats] = useState<LiveUrlStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>({
    eventType: ['discovery', 'processing', 'posting', 'verification'],
    status: ['completed', 'failed', 'pending'],
    timeRange: '6h'
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Subscribe to real-time activity stream
  useEffect(() => {
    if (!campaignId) return;

    const unsubscribe = RealTimeUrlTracker.subscribeToActivityStream(
      campaignId,
      (activity) => {
        setActivities(prev => [activity, ...prev.slice(0, 499)]); // Keep last 500 activities
        setLastUpdate(new Date());
        
        // Notify parent component of URL posting
        if (activity.action === 'posted' && onUrlPosted) {
          onUrlPosted(activity.url, activity.status === 'completed');
        }
      }
    );

    // Load initial data
    loadActivityData();
    const interval = setInterval(loadActivityData, 10000); // Refresh every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [campaignId, onUrlPosted]);

  const loadActivityData = useCallback(async () => {
    if (!campaignId) return;

    try {
      // Load recent activities
      const recentActivities = await RealTimeUrlTracker.getRecentActivity(campaignId, 100);
      setActivities(recentActivities);

      // Load live statistics
      const stats = await RealTimeUrlTracker.getLiveStats(campaignId);
      setLiveStats(stats);

      // Check if runtime is active
      const runtimeActive = CampaignRuntimeEngine.isRuntimeActive(campaignId);
      setIsMonitoring(runtimeActive);

    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  }, [campaignId]);

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        await CampaignRuntimeEngine.pauseCampaignRuntime(campaignId);
        setIsMonitoring(false);
      } else {
        await CampaignRuntimeEngine.resumeCampaignRuntime(campaignId);
        setIsMonitoring(true);
      }
    } catch (error) {
      console.error('Error toggling monitoring:', error);
    }
  };

  const getFilteredActivities = () => {
    let filtered = activities;

    // Filter by event type
    if (filter.eventType.length > 0) {
      filtered = filtered.filter(activity => filter.eventType.includes(activity.event_type));
    }

    // Filter by status
    if (filter.status.length > 0) {
      filtered = filtered.filter(activity => filter.status.includes(activity.status));
    }

    // Filter by time range
    const now = new Date();
    const timeThresholds = {
      '1h': 1 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    if (filter.timeRange !== 'all') {
      const threshold = new Date(now.getTime() - timeThresholds[filter.timeRange]);
      filtered = filtered.filter(activity => new Date(activity.timestamp) > threshold);
    }

    return filtered;
  };

  const getActivityIcon = (activity: UrlActivityStream) => {
    switch (activity.event_type) {
      case 'discovery': return Globe;
      case 'processing': return Zap;
      case 'posting': return ExternalLink;
      case 'verification': return Eye;
      case 'error': return AlertCircle;
      default: return Activity;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success': return CheckCircle;
      case 'failed': return XCircle;
      case 'pending':
      case 'processing': return Clock;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending':
      case 'processing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const exportActivityLog = () => {
    const filteredActivities = getFilteredActivities();
    const csvContent = [
      'Timestamp,Event Type,URL,Domain,Action,Status,Message',
      ...filteredActivities.map(activity => 
        `${activity.timestamp},${activity.event_type},${activity.url},${activity.domain},${activity.action},${activity.status},"${activity.message}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `url-activity-${campaignId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredActivities = getFilteredActivities();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live URL Posting Monitor
                {isMonitoring && (
                  <Badge variant="default" className="bg-green-100 text-green-700 ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time tracking of URL discovery, processing, and posting activities
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-sm text-gray-500">
                <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
                <div>{filteredActivities.length} activities shown</div>
              </div>
              {showControls && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadActivityData}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isMonitoring ? "secondary" : "default"}
                    size="sm"
                    onClick={toggleMonitoring}
                  >
                    {isMonitoring ? (
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
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Live Statistics */}
      {liveStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">URLs Discovered</p>
                  <p className="text-2xl font-bold text-blue-600">{liveStats.stats.urls_discovered_total}</p>
                  <p className="text-xs text-gray-500">+{liveStats.stats.urls_discovered_today} today</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">URLs Visited</p>
                  <p className="text-2xl font-bold text-yellow-600">{liveStats.stats.urls_visited_total}</p>
                  <p className="text-xs text-gray-500">+{liveStats.stats.urls_visited_today} today</p>
                </div>
                <Eye className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">URLs Posted</p>
                  <p className="text-2xl font-bold text-green-600">{liveStats.stats.urls_posted_total}</p>
                  <p className="text-xs text-gray-500">+{liveStats.stats.urls_posted_today} today</p>
                </div>
                <ExternalLink className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{liveStats.stats.success_rate_total.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Today: {liveStats.stats.success_rate_today.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Activity Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Event Types</label>
              <div className="space-y-2">
                {['discovery', 'processing', 'posting', 'verification', 'error'].map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filter.eventType.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilter(prev => ({
                            ...prev,
                            eventType: [...prev.eventType, type]
                          }));
                        } else {
                          setFilter(prev => ({
                            ...prev,
                            eventType: prev.eventType.filter(t => t !== type)
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <div className="space-y-2">
                {['completed', 'failed', 'pending', 'processing'].map(status => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filter.status.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilter(prev => ({
                            ...prev,
                            status: [...prev.status, status]
                          }));
                        } else {
                          setFilter(prev => ({
                            ...prev,
                            status: prev.status.filter(s => s !== status)
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Time Range</label>
              <select
                value={filter.timeRange}
                onChange={(e) => setFilter(prev => ({ ...prev, timeRange: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredActivities.length} of {activities.length} activities
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportActivityLog}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Real-Time Activity Stream
          </CardTitle>
          <CardDescription>
            Live feed of URL processing activities as they happen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea style={{ height: maxHeight }}>
            <div className="space-y-3">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity);
                  const StatusIcon = getStatusIcon(activity.status);
                  
                  return (
                    <div
                      key={`${activity.id}-${index}`}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <ActivityIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.event_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {activity.action}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <StatusIcon className={`h-3 w-3 ${getStatusColor(activity.status)}`} />
                            <span className={`text-xs ${getStatusColor(activity.status)}`}>
                              {activity.status}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-1">{activity.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            <Globe className="h-3 w-3 inline mr-1" />
                            {activity.domain}
                          </span>
                          <span>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                          {activity.url && (
                            <a
                              href={activity.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View URL
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Activity Yet</p>
                  <p className="text-sm">
                    {isMonitoring 
                      ? 'URL posting activities will appear here as they happen'
                      : 'Start monitoring to see real-time URL processing activities'
                    }
                  </p>
                  {!isMonitoring && showControls && (
                    <Button
                      variant="default"
                      className="mt-4"
                      onClick={toggleMonitoring}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Monitoring
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
