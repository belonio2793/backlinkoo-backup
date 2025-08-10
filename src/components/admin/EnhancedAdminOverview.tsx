import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEnhancedAdminMetrics } from '@/hooks/useEnhancedAdminMetrics';
import { ServiceConnectionStatus } from '@/components/admin/ServiceConnectionStatus';
import { DirectOpenAITest } from '@/components/admin/DirectOpenAITest';
import { formatTimeDisplay, ensureColonSpacing } from '@/utils/colonSpacingFix';
import {
  Users,
  Activity,
  CreditCard,
  Target,
  RefreshCw,
  AlertCircle,
  MonitorSpeaker,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Database,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  loading?: boolean;
}

function MetricCard({ title, value, description, icon, trend, loading }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable': return <BarChart3 className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="h-8 bg-muted animate-pulse rounded" />
          ) : (
            value
          )}
        </div>
        {loading ? (
          <div className="h-3 bg-muted animate-pulse rounded w-20 mt-1" />
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {getTrendIcon()}
            <span>{description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EnhancedAdminOverview() {
  const { metrics, loading, error, refreshMetrics, getSyncStatus } = useEnhancedAdminMetrics();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000); // Update timestamp every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefreshMetrics = async () => {
    await refreshMetrics();
    setLastRefresh(new Date());
  };

  const syncStatus = getSyncStatus();

  return (
    <div className="space-y-6">
      {/* Connection Status Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            <div className="font-medium">Dashboard Error</div>
            <div className="text-sm mt-1">{error}</div>
            <div className="text-sm mt-2 text-red-600">
              This usually means you need to sign in as an admin user or fix the database connection.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Status Indicator */}
      {metrics?.isRealTime && (
        <Alert className="border-green-200 bg-green-50">
          <Zap className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="font-medium flex items-center gap-2">
              Real-time Dashboard Active
              <Badge variant="outline" className="border-green-500 text-green-700">
                Live Data
              </Badge>
            </div>
            <div className="text-sm mt-1">
              Data is automatically syncing. Last update: {metrics.lastUpdate?.toLocaleTimeString() || 'Unknown'}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Stats Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Enhanced Dashboard Metrics</h2>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshMetrics}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={metrics?.totalUsers || 0}
            description={`${metrics?.recentSignups || 0} recent signups`}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            trend={metrics?.userGrowthTrend}
            loading={loading}
          />

          <MetricCard
            title="Active Subscribers"
            value={metrics?.activeUsers || 0}
            description="Currently subscribed"
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            loading={loading}
          />

          <MetricCard
            title="Monthly Revenue"
            value={`$${metrics?.monthlyRevenue?.toFixed(2) || '0.00'}`}
            description="Current month total"
            icon={<CreditCard className="h-4 w-4 text-success" />}
            trend={metrics?.revenueTrend}
            loading={loading}
          />

          <MetricCard
            title="Running Campaigns"
            value={metrics?.runningCampaigns || 0}
            description="Active credit campaigns"
            icon={<Target className="h-4 w-4 text-blue-500" />}
            loading={loading}
          />
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  `${metrics?.systemHealthScore || 0}%`
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  (metrics?.systemHealthScore || 0) > 80 ? 'bg-green-500' : 
                  (metrics?.systemHealthScore || 0) > 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                {(metrics?.systemHealthScore || 0) > 80 ? 'Excellent' :
                 (metrics?.systemHealthScore || 0) > 60 ? 'Good' : 'Needs Attention'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  metrics?.databaseConnected ? 'Online' : 'Offline'
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  metrics?.databaseConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {metrics?.tablesAccessible || 0} tables accessible
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Sync Status</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 bg-muted animate-pulse rounded" />
                ) : (
                  metrics?.isRealTime ? 'Live' : 'Cached'
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  metrics?.isRealTime ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`} />
                {syncStatus?.isEnabled ? 'Auto-sync enabled' : 'Manual refresh only'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Content Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content & Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.totalBlogPosts || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Blog Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics?.publishedBlogPosts || 0}
              </div>
              <div className="text-sm text-muted-foreground">Published Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${metrics?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.totalOrders || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streamlined System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorSpeaker className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceConnectionStatus />
        </CardContent>
      </Card>

      {/* Direct OpenAI Connection Test */}
      <DirectOpenAITest />
    </div>
  );
}
