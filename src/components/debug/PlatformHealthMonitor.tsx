import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { liveCampaignManager } from '@/services/liveCampaignManager';
import { toast } from 'sonner';

interface PlatformHealth {
  platform: string;
  domain: string;
  health_status: string;
  success_rate: number;
  consecutive_failures: number;
  total_attempts: number;
  total_successes: number;
  last_failure?: string;
  next_retry_after?: string;
  is_in_cooldown: boolean;
  recent_errors: Array<{
    timestamp: string;
    error: string;
    error_type: string;
  }>;
}

export function PlatformHealthMonitor() {
  const [healthData, setHealthData] = useState<PlatformHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const data = liveCampaignManager.getPlatformHealthStatus();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load platform health data:', error);
      toast.error('Failed to load platform health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'disabled':
        return <Minus className="h-4 w-4 text-gray-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      case 'disabled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatCooldownTime = (timestamp: string) => {
    const now = new Date();
    const cooldownEnd = new Date(timestamp);
    const diffMs = cooldownEnd.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Ready';
    
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m remaining`;
    
    const diffHours = Math.ceil(diffMins / 60);
    return `${diffHours}h remaining`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Platform Health Monitor
            </CardTitle>
            <CardDescription>
              Real-time monitoring of platform health and error tracking
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {formatRelativeTime(lastUpdated.toISOString())}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={loadHealthData}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthData.map((platform) => (
            <div
              key={platform.domain}
              className="border rounded-lg p-4 space-y-3"
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getHealthIcon(platform.health_status)}
                  <div>
                    <h3 className="font-semibold">{platform.platform}</h3>
                    <p className="text-sm text-gray-500">{platform.domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {platform.is_in_cooldown && (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <Clock className="h-3 w-3 mr-1" />
                      {platform.next_retry_after && formatCooldownTime(platform.next_retry_after)}
                    </Badge>
                  )}
                  <Badge variant={getHealthBadgeVariant(platform.health_status)}>
                    {platform.health_status}
                  </Badge>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getSuccessRateColor(platform.success_rate)}`}>
                      {platform.success_rate.toFixed(1)}%
                    </span>
                    {platform.success_rate >= 80 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : platform.success_rate < 60 ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : (
                      <Minus className="h-3 w-3 text-yellow-600" />
                    )}
                  </div>
                  <Progress 
                    value={platform.success_rate} 
                    className="h-1 mt-1" 
                  />
                </div>

                <div>
                  <p className="text-gray-500">Attempts</p>
                  <p className="font-semibold">
                    {platform.total_successes}/{platform.total_attempts}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Consecutive Failures</p>
                  <p className={`font-semibold ${
                    platform.consecutive_failures === 0 ? 'text-green-600' :
                    platform.consecutive_failures < 3 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {platform.consecutive_failures}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Last Failure</p>
                  <p className="font-semibold text-xs">
                    {platform.last_failure ? formatRelativeTime(platform.last_failure) : 'None'}
                  </p>
                </div>
              </div>

              {/* Recent Errors */}
              {platform.recent_errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent Errors:</p>
                  <div className="space-y-1">
                    {platform.recent_errors.slice(-3).map((error, index) => (
                      <div key={index} className="text-xs bg-red-50 border border-red-200 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {error.error_type}
                          </Badge>
                          <span className="text-gray-500">
                            {formatRelativeTime(error.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-700 truncate" title={error.error}>
                          {error.error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {healthData.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No platform health data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
