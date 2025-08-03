import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEnhancedAdminMetrics } from '@/hooks/useEnhancedAdminMetrics';
import { adminDataSyncService } from '@/services/adminDataSyncService';
import { AdminActivityMonitor } from '@/components/admin/AdminActivityMonitor';
import { 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Database,
  Clock,
  Eye,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  BarChart3,
  Globe,
  Server
} from 'lucide-react';

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function EnhancedSecurityDashboard() {
  const { toast } = useToast();
  const { metrics, loading, error, refreshMetrics, toggleRealTime, getSyncStatus } = useEnhancedAdminMetrics();
  const [activeTab, setActiveTab] = useState('overview');
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    generateSecurityAlerts();
  }, [metrics]);

  const generateSecurityAlerts = () => {
    const alerts: SecurityAlert[] = [];
    
    if (metrics) {
      // System health alerts
      if (metrics.systemHealthScore < 70) {
        alerts.push({
          id: 'health-low',
          type: 'warning',
          title: 'Low System Health Score',
          description: `System health is at ${metrics.systemHealthScore}%. Consider investigating database connectivity.`,
          timestamp: new Date(),
          severity: metrics.systemHealthScore < 50 ? 'high' : 'medium'
        });
      }

      // Database connectivity alerts
      if (!metrics.databaseConnected) {
        alerts.push({
          id: 'db-offline',
          type: 'error',
          title: 'Database Connection Issues',
          description: 'Database connection appears to be unstable or offline.',
          timestamp: new Date(),
          severity: 'critical'
        });
      }

      // User activity alerts
      if (metrics.recentSignups === 0) {
        alerts.push({
          id: 'no-signups',
          type: 'info',
          title: 'No Recent User Activity',
          description: 'No new user signups detected in the last 24 hours.',
          timestamp: new Date(),
          severity: 'low'
        });
      }

      // Revenue alerts
      if (metrics.monthlyRevenue < 100) {
        alerts.push({
          id: 'low-revenue',
          type: 'warning',
          title: 'Low Monthly Revenue',
          description: `Current monthly revenue is $${metrics.monthlyRevenue.toFixed(2)}. Consider reviewing pricing strategy.`,
          timestamp: new Date(),
          severity: 'medium'
        });
      }
    }

    setSecurityAlerts(alerts);
  };

  const handleToggleRealTime = () => {
    toggleRealTime();
    setRealTimeEnabled(!realTimeEnabled);
    toast({
      title: 'Real-time Updates',
      description: `Real-time monitoring ${!realTimeEnabled ? 'enabled' : 'disabled'}`
    });
  };

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Eye className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getAlertVariant = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading enhanced security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Enhanced Security Dashboard</h2>
          {metrics?.isRealTime && <Badge variant="outline" className="ml-2">Live</Badge>}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleToggleRealTime} 
            variant={realTimeEnabled ? 'default' : 'outline'} 
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${realTimeEnabled ? 'animate-pulse' : ''}`} />
            Real-time {realTimeEnabled ? 'On' : 'Off'}
          </Button>
          <Button onClick={refreshMetrics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Dashboard Error</div>
            <div className="text-sm mt-1">{error}</div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.systemHealthScore || 0}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {metrics?.databaseConnected ? (
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  Database {metrics?.databaseConnected ? 'Online' : 'Offline'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.totalUsers || 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {getTrendIcon(metrics?.userGrowthTrend || 'stable')}
                  <span className="ml-1">
                    {metrics?.recentSignups || 0} recent signups
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Lock className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.adminUsers || 1}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Privileged access
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Alerts ({securityAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {securityAlerts.length > 0 ? (
                <div className="space-y-3">
                  {securityAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant={getAlertVariant(alert.severity)} size="sm">
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No security alerts at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Blog Posts:</span>
                    <span className="font-medium">{metrics?.totalBlogPosts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Published Posts:</span>
                    <span className="font-medium">{metrics?.publishedBlogPosts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trial Posts:</span>
                    <span className="font-medium">{metrics?.trialBlogPosts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Claimed Posts:</span>
                    <span className="font-medium">{metrics?.claimedPosts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Monthly Revenue:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${metrics?.monthlyRevenue.toFixed(2) || '0.00'}</span>
                      {getTrendIcon(metrics?.revenueTrend || 'stable')}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-medium">${metrics?.totalRevenue.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-medium">{metrics?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Orders:</span>
                    <span className="font-medium">{metrics?.completedOrders || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <AdminActivityMonitor />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Security Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {securityAlerts.length > 0 ? (
                <div className="space-y-4">
                  {securityAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant={getAlertVariant(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">All Clear!</h3>
                  <p>No security alerts detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connection Status:</span>
                    <div className="flex items-center gap-2">
                      {metrics?.databaseConnected ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={metrics?.databaseConnected ? 'text-green-600' : 'text-red-600'}>
                        {metrics?.databaseConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Accessible Tables:</span>
                    <span className="font-medium">{metrics?.tablesAccessible || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Update:</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics?.lastUpdate?.toLocaleTimeString() || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Real-time Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Real-time Sync:</span>
                    <div className="flex items-center gap-2">
                      {realTimeEnabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={realTimeEnabled ? 'text-green-600' : 'text-red-600'}>
                        {realTimeEnabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Sync Status:</span>
                    <Badge variant={metrics?.syncStatus === 'synced' ? 'default' : 'destructive'}>
                      {metrics?.syncStatus || 'unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Freshness:</span>
                    <span className="text-sm">
                      {metrics?.isRealTime ? 'Live' : 'Cached'}
                    </span>
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
