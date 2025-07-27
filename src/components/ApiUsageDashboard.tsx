import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { productionAIContentManager } from '@/services/productionAIContentManager';
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface ProviderStatus {
  configured: boolean;
  working: boolean;
  usage: {
    tokens: number;
    cost: number;
    requests: number;
  };
}

interface UsageStats {
  [provider: string]: {
    tokens: number;
    cost: number;
    requests: number;
  };
}

export function ApiUsageDashboard() {
  const [providerStatus, setProviderStatus] = useState<{ [key: string]: ProviderStatus }>({});
  const [usageStats, setUsageStats] = useState<UsageStats>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [status, stats] = await Promise.all([
        productionAIContentManager.getProviderStatus(),
        productionAIContentManager.getUsageStats()
      ]);
      
      setProviderStatus(status);
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalStats = () => {
    const totals = Object.values(usageStats).reduce(
      (acc, stat) => ({
        tokens: acc.tokens + stat.tokens,
        cost: acc.cost + stat.cost,
        requests: acc.requests + stat.requests
      }),
      { tokens: 0, cost: 0, requests: 0 }
    );
    return totals;
  };

  const getProviderHealth = (provider: string) => {
    const status = providerStatus[provider];
    if (!status) return 'unknown';
    if (!status.configured) return 'not-configured';
    if (!status.working) return 'error';
    return 'healthy';
  };

  const getProviderIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not-configured':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(cost);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const totalStats = getTotalStats();
  const configuredProviders = Object.values(providerStatus).filter(p => p.configured).length;
  const workingProviders = Object.values(providerStatus).filter(p => p.working).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI API Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor API usage, costs, and provider health
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={isLoading} variant="outline">
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.requests)}</div>
            <p className="text-xs text-muted-foreground">
              Across all providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalStats.tokens)}</div>
            <p className="text-xs text-muted-foreground">
              Total tokens consumed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(totalStats.cost)}</div>
            <p className="text-xs text-muted-foreground">
              Total API costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workingProviders}/{configuredProviders}</div>
            <p className="text-xs text-muted-foreground">
              Working / Configured
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Provider Status</TabsTrigger>
          <TabsTrigger value="usage">Usage Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(providerStatus).map(([provider, status]) => {
              const health = getProviderHealth(provider);
              const usage = status.usage || { tokens: 0, cost: 0, requests: 0 };
              
              return (
                <Card key={provider}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{provider}</CardTitle>
                    {getProviderIcon(health)}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge variant={health === 'healthy' ? 'default' : 'secondary'}>
                          {health === 'healthy' ? 'Active' : 
                           health === 'error' ? 'Error' : 
                           health === 'not-configured' ? 'Not Configured' : 'Unknown'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Requests</span>
                        <span className="text-sm font-medium">{formatNumber(usage.requests)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Tokens</span>
                        <span className="text-sm font-medium">{formatNumber(usage.tokens)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Cost</span>
                        <span className="text-sm font-medium">{formatCost(usage.cost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Breakdown</CardTitle>
              <CardDescription>
                Detailed usage statistics by provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(usageStats).map(([provider, stats]) => (
                  <div key={provider} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{provider}</h4>
                      <Badge variant="outline">{formatCost(stats.cost)}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Requests: </span>
                        <span className="font-medium">{formatNumber(stats.requests)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tokens: </span>
                        <span className="font-medium">{formatNumber(stats.tokens)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Cost/Request: </span>
                        <span className="font-medium">
                          {stats.requests > 0 ? formatCost(stats.cost / stats.requests) : '$0.0000'}
                        </span>
                      </div>
                    </div>
                    
                    {totalStats.cost > 0 && (
                      <Progress 
                        value={(stats.cost / totalStats.cost) * 100} 
                        className="h-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cost Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(usageStats)
                    .sort(([,a], [,b]) => b.cost - a.cost)
                    .map(([provider, stats]) => (
                      <div key={provider} className="flex items-center justify-between">
                        <span className="text-sm">{provider}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: totalStats.cost > 0 ? 
                                  `${(stats.cost / totalStats.cost) * 100}%` : 
                                  '0%' 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            {totalStats.cost > 0 ? 
                              `${((stats.cost / totalStats.cost) * 100).toFixed(1)}%` : 
                              '0%'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Avg Tokens/Request</span>
                      <span className="text-sm font-medium">
                        {totalStats.requests > 0 ? 
                          Math.round(totalStats.tokens / totalStats.requests) : 
                          0}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Avg Cost/Request</span>
                      <span className="text-sm font-medium">
                        {totalStats.requests > 0 ? 
                          formatCost(totalStats.cost / totalStats.requests) : 
                          '$0.0000'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Most Used Provider</span>
                      <span className="text-sm font-medium">
                        {Object.entries(usageStats)
                          .sort(([,a], [,b]) => b.requests - a.requests)[0]?.[0] || 'None'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Health Score</span>
                      <span className="text-sm font-medium">
                        {configuredProviders > 0 ? 
                          `${Math.round((workingProviders / configuredProviders) * 100)}%` : 
                          '0%'}
                      </span>
                    </div>
                    <Progress 
                      value={configuredProviders > 0 ? (workingProviders / configuredProviders) * 100 : 0} 
                      className="h-2"
                    />
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
