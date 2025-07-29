import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Zap,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart3
} from "lucide-react";
import { multiProviderContentGenerator } from "@/services/multiProviderContentGenerator";
import { retryEventEmitter, RetryEvent } from "@/services/retryEventEmitter";

export function MultiProviderStatusPanel() {
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const [recentEvents, setRecentEvents] = useState<RetryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageAttempts: 0,
    mostUsedProvider: 'N/A'
  });

  const loadProviderStatus = async () => {
    setIsLoading(true);
    try {
      const status = await multiProviderContentGenerator.testAllProviders();
      setProviderStatus(status);
    } catch (error) {
      console.error('Failed to load provider status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviderStatus();
    
    // Subscribe to retry events
    const unsubscribe = retryEventEmitter.subscribe((event) => {
      setRecentEvents(prev => [...prev.slice(-19), event]); // Keep last 20 events
    });

    // Load existing events
    setRecentEvents(retryEventEmitter.getRecentEvents(20));

    return unsubscribe;
  }, []);

  // Calculate stats from recent events
  useEffect(() => {
    const requests = new Set(recentEvents.map(e => e.requestId).filter(Boolean));
    const totalRequests = requests.size;
    const successEvents = recentEvents.filter(e => e.type === 'success');
    const errorEvents = recentEvents.filter(e => e.type === 'error');
    
    const successfulRequests = successEvents.length;
    const failedRequests = totalRequests - successfulRequests;
    
    const totalAttempts = recentEvents.filter(e => e.type === 'retry').length;
    const averageAttempts = totalRequests > 0 ? Math.round(totalAttempts / totalRequests * 10) / 10 : 0;

    setStats({
      totalRequests,
      successfulRequests,
      failedRequests,
      averageAttempts,
      mostUsedProvider: 'OpenAI' // This would need more sophisticated tracking
    });
  }, [recentEvents]);

  const getProviderDisplayName = (provider: string) => {
    const names: Record<string, string> = {
      openai: 'OpenAI GPT',
      cohere: 'Cohere',
      deepai: 'DeepAI'
    };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider: string, isActive: boolean) => {
    const iconClass = `h-5 w-5 ${isActive ? 'text-green-600' : 'text-red-500'}`;
    
    switch (provider) {
      case 'openai':
        return <Zap className={iconClass} />;
      case 'cohere':
        return <Shield className={iconClass} />;
      case 'deepai':
        return <Activity className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };

  const formatEventTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'retry':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const successRate = stats.totalRequests > 0 ? Math.round((stats.successfulRequests / stats.totalRequests) * 100) : 0;
  const activeProviders = Object.entries(providerStatus).filter(([_, active]) => active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Multi-Provider AI Status</h2>
        <Button
          onClick={loadProviderStatus}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {activeProviders.length > 0 ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700">Operational</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-700">Down</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeProviders.length}/{Object.keys(providerStatus).length} providers active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-2xl">{successRate}%</span>
                </div>
                <Progress value={successRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span className="font-bold text-2xl">{stats.averageAttempts}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Per successful generation
                </p>
              </CardContent>
            </Card>
          </div>

          {activeProviders.length === 0 && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Critical:</strong> No AI providers are currently active. Content generation will fail.
                Please configure at least one API key.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(providerStatus).map(([provider, isActive]) => (
              <Card key={provider} className={isActive ? 'border-green-200' : 'border-red-200'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(provider, isActive)}
                      <CardTitle className="text-sm">
                        {getProviderDisplayName(provider)}
                      </CardTitle>
                    </div>
                    <Badge 
                      variant={isActive ? "default" : "secondary"}
                      className={isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {isActive 
                      ? 'Available for content generation with automatic fallback support.' 
                      : 'Not configured or connection failed. Check API key and billing status.'
                    }
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Generation Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent events. Events will appear here as content generation occurs.
                  </p>
                ) : (
                  recentEvents.slice().reverse().map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded border">
                      {getEventIcon(event.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatEventTime(event.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Attempt {event.attempt}/{event.maxAttempts}
                          {event.error && ` - ${event.error.substring(0, 50)}...`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRequests}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Successful</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.successfulRequests}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failedRequests}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
