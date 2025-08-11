import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Server,
  Users,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Scale,
  BarChart3,
  Zap,
  Clock,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { UsageComputeTracker, AdminHostingStats, HostingCapabilities } from '@/services/usageComputeTracker';

interface AdminHostingDashboardProps {
  refreshInterval?: number;
}

export function AdminHostingDashboard({ refreshInterval = 30000 }: AdminHostingDashboardProps) {
  const [hostingStats, setHostingStats] = useState<AdminHostingStats | null>(null);
  const [hostingCapabilities, setHostingCapabilities] = useState<HostingCapabilities | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load hosting statistics
  const loadHostingStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [stats, capabilities] = await Promise.all([
        UsageComputeTracker.getAdminHostingStats(),
        UsageComputeTracker.estimateHostingCapabilities(1000, 5, 100) // Estimate for 1000 users
      ]);

      setHostingStats(stats);
      setHostingCapabilities(capabilities);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading hosting stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    loadHostingStats();

    const interval = setInterval(loadHostingStats, refreshInterval);
    return () => clearInterval(interval);
  }, [loadHostingStats, refreshInterval]);

  const getUtilizationColor = (percentage: number): string => {
    if (percentage > 90) return 'text-red-600';
    if (percentage > 75) return 'text-orange-600';
    if (percentage > 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationStatus = (percentage: number): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (percentage > 90) return { label: 'Critical', variant: 'destructive' };
    if (percentage > 75) return { label: 'High', variant: 'secondary' };
    if (percentage > 50) return { label: 'Medium', variant: 'secondary' };
    return { label: 'Low', variant: 'default' };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const exportHostingReport = () => {
    if (!hostingStats) return;

    const report = {
      generated_at: new Date().toISOString(),
      hosting_stats: hostingStats,
      hosting_capabilities: hostingCapabilities,
      summary: {
        total_users: hostingStats.total_users,
        active_users: hostingStats.active_users,
        total_campaigns: hostingStats.total_campaigns,
        active_campaigns: hostingStats.active_campaigns,
        monthly_cost: hostingStats.hosting_costs.monthly,
        projected_cost: hostingStats.hosting_costs.projected_monthly
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hosting-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !hostingStats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading hosting dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Error loading hosting dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!hostingStats) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hosting data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Server className="h-6 w-6 text-purple-600" />
                Admin Hosting Dashboard
              </CardTitle>
              <CardDescription>
                Monitor hosting capabilities, resource utilization, and cost optimization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right text-sm text-gray-500">
                {lastUpdate && (
                  <>
                    <div>Last Update:</div>
                    <div>{lastUpdate.toLocaleTimeString()}</div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadHostingStats}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportHostingReport}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{hostingStats.total_users}</p>
                <p className="text-xs text-gray-500">{hostingStats.active_users} active</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-green-600">{hostingStats.active_campaigns}</p>
                <p className="text-xs text-gray-500">{hostingStats.total_campaigns} total</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compute Usage</p>
                <p className="text-2xl font-bold text-purple-600">{hostingStats.total_compute_usage.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{hostingStats.avg_compute_per_user.toFixed(4)} per user</p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(hostingStats.hosting_costs.monthly)}</p>
                <p className="text-xs text-gray-500">Projected: {formatCurrency(hostingStats.hosting_costs.projected_monthly)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scaling Alert */}
      {hostingStats.scaling_recommendations.should_scale && (
        <Alert className="border-orange-200 bg-orange-50">
          <Scale className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Scaling Recommended:</strong> Consider scaling by {hostingStats.scaling_recommendations.scale_factor}x 
            within {hostingStats.scaling_recommendations.timeline}. 
            Estimated additional cost: {formatCurrency(hostingStats.scaling_recommendations.estimated_cost_increase)}/month
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resource Overview</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>

        {/* Resource Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Current system resource usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CPU */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span className="text-sm font-medium">CPU</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge {...getUtilizationStatus(hostingStats.resource_utilization.cpu_percent)}>
                        {getUtilizationStatus(hostingStats.resource_utilization.cpu_percent).label}
                      </Badge>
                      <span className={`text-sm font-medium ${getUtilizationColor(hostingStats.resource_utilization.cpu_percent)}`}>
                        {hostingStats.resource_utilization.cpu_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={hostingStats.resource_utilization.cpu_percent} className="h-2" />
                </div>

                {/* Memory */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span className="text-sm font-medium">Memory</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge {...getUtilizationStatus(hostingStats.resource_utilization.memory_percent)}>
                        {getUtilizationStatus(hostingStats.resource_utilization.memory_percent).label}
                      </Badge>
                      <span className={`text-sm font-medium ${getUtilizationColor(hostingStats.resource_utilization.memory_percent)}`}>
                        {hostingStats.resource_utilization.memory_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={hostingStats.resource_utilization.memory_percent} className="h-2" />
                </div>

                {/* Storage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="text-sm font-medium">Storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge {...getUtilizationStatus(hostingStats.resource_utilization.storage_percent)}>
                        {getUtilizationStatus(hostingStats.resource_utilization.storage_percent).label}
                      </Badge>
                      <span className={`text-sm font-medium ${getUtilizationColor(hostingStats.resource_utilization.storage_percent)}`}>
                        {hostingStats.resource_utilization.storage_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={hostingStats.resource_utilization.storage_percent} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {hostingStats.storage_usage_mb.toFixed(0)} MB used
                  </p>
                </div>

                {/* Bandwidth */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm font-medium">Bandwidth</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge {...getUtilizationStatus(hostingStats.resource_utilization.bandwidth_percent)}>
                        {getUtilizationStatus(hostingStats.resource_utilization.bandwidth_percent).label}
                      </Badge>
                      <span className={`text-sm font-medium ${getUtilizationColor(hostingStats.resource_utilization.bandwidth_percent)}`}>
                        {hostingStats.resource_utilization.bandwidth_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={hostingStats.resource_utilization.bandwidth_percent} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {hostingStats.bandwidth_usage_mb.toFixed(0)} MB used today
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>Current system activity levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Active Users</p>
                        <p className="text-sm text-gray-600">Currently using the system</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{hostingStats.active_users}</p>
                      <p className="text-xs text-gray-500">
                        {hostingStats.total_users > 0 ? 
                          ((hostingStats.active_users / hostingStats.total_users) * 100).toFixed(1) : 0}% of total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Active Campaigns</p>
                        <p className="text-sm text-gray-600">Running automation campaigns</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{hostingStats.active_campaigns}</p>
                      <p className="text-xs text-gray-500">
                        {hostingStats.total_campaigns > 0 ? 
                          ((hostingStats.active_campaigns / hostingStats.total_campaigns) * 100).toFixed(1) : 0}% of total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">Compute Usage</p>
                        <p className="text-sm text-gray-600">Total compute units consumed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{hostingStats.total_compute_usage.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {hostingStats.avg_compute_per_user.toFixed(4)} per user
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Utilization Details */}
        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Resource Utilization</CardTitle>
              <CardDescription>In-depth analysis of system resource usage patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Resource Breakdown</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">CPU Cores</span>
                        <span className="text-sm text-gray-500">
                          {(hostingStats.resource_utilization.cpu_percent / 100 * 100).toFixed(1)} / 100 cores
                        </span>
                      </div>
                      <Progress value={hostingStats.resource_utilization.cpu_percent} className="h-2" />
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Memory (RAM)</span>
                        <span className="text-sm text-gray-500">
                          {(hostingStats.resource_utilization.memory_percent / 100 * 1000).toFixed(0)} / 1000 GB
                        </span>
                      </div>
                      <Progress value={hostingStats.resource_utilization.memory_percent} className="h-2" />
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Storage</span>
                        <span className="text-sm text-gray-500">
                          {(hostingStats.storage_usage_mb / 1024).toFixed(1)} / 10,000 GB
                        </span>
                      </div>
                      <Progress value={hostingStats.resource_utilization.storage_percent} className="h-2" />
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Network Bandwidth</span>
                        <span className="text-sm text-gray-500">
                          {(hostingStats.bandwidth_usage_mb / 1024).toFixed(1)} / 100,000 GB
                        </span>
                      </div>
                      <Progress value={hostingStats.resource_utilization.bandwidth_percent} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Usage Efficiency</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Users per Campaign</span>
                        <span className="font-medium">
                          {hostingStats.total_campaigns > 0 ? 
                            (hostingStats.total_users / hostingStats.total_campaigns).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Compute per User</span>
                        <span className="font-medium">{hostingStats.avg_compute_per_user.toFixed(4)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Storage per User</span>
                        <span className="font-medium">
                          {hostingStats.total_users > 0 ? 
                            (hostingStats.storage_usage_mb / hostingStats.total_users).toFixed(1) : 0} MB
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Activity Rate</span>
                        <span className="font-medium">
                          {hostingStats.total_users > 0 ? 
                            ((hostingStats.active_users / hostingStats.total_users) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hosting Costs</CardTitle>
                <CardDescription>Breakdown of hosting expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Daily Cost</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(hostingStats.hosting_costs.daily)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Weekly Cost</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(hostingStats.hosting_costs.weekly)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Monthly Cost</span>
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(hostingStats.hosting_costs.monthly)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Projected Monthly</span>
                    <span className="text-lg font-bold text-orange-600">
                      {formatCurrency(hostingStats.hosting_costs.projected_monthly)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>Recommendations for cost efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Cost per User</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Current: {formatCurrency(hostingStats.total_users > 0 ? 
                        hostingStats.hosting_costs.monthly / hostingStats.total_users : 0)}/month per user
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Efficiency Score</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Resource utilization: {((hostingStats.resource_utilization.cpu_percent + 
                        hostingStats.resource_utilization.memory_percent + 
                        hostingStats.resource_utilization.storage_percent + 
                        hostingStats.resource_utilization.bandwidth_percent) / 4).toFixed(1)}%
                    </p>
                  </div>

                  {hostingStats.scaling_recommendations.should_scale && (
                    <div className="p-3 border-orange-200 border bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Scaling Required</span>
                      </div>
                      <p className="text-sm text-orange-800">
                        Recommended scale factor: {hostingStats.scaling_recommendations.scale_factor}x
                        <br />
                        Additional cost: {formatCurrency(hostingStats.scaling_recommendations.estimated_cost_increase)}/month
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hosting Capabilities */}
        <TabsContent value="capabilities" className="space-y-6">
          {hostingCapabilities && (
            <Card>
              <CardHeader>
                <CardTitle>Current Hosting Capabilities</CardTitle>
                <CardDescription>System capacity and feature support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Capacity Limits</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Max Concurrent Campaigns</span>
                        <span className="font-medium">{hostingCapabilities.max_concurrent_campaigns}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Max Daily Operations</span>
                        <span className="font-medium">{hostingCapabilities.max_daily_operations.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Max Storage</span>
                        <span className="font-medium">{(hostingCapabilities.max_storage_mb / 1024).toFixed(1)} GB</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Max Bandwidth</span>
                        <span className="font-medium">{(hostingCapabilities.max_bandwidth_mb / 1024).toFixed(1)} GB</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Max Compute Units</span>
                        <span className="font-medium">{hostingCapabilities.max_compute_units.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Supported Features</h4>
                    
                    <div className="space-y-2">
                      {hostingCapabilities.supported_features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Hosting Tier</span>
                        <Badge variant="default" className="capitalize">
                          {hostingCapabilities.tier_name}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Cost per Hour</span>
                        <span className="font-medium">{formatCurrency(hostingCapabilities.cost_per_hour)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Scaling Available</span>
                        <Badge variant={hostingCapabilities.scaling_available ? 'default' : 'secondary'}>
                          {hostingCapabilities.scaling_available ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
