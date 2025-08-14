import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  TrendingUp,
  Bug,
  Activity
} from 'lucide-react';
import { internalLogger } from '@/services/internalLogger';
import { errorResolver } from '@/services/errorResolver';
import { toast } from 'sonner';

export function InternalLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [autoResolving, setAutoResolving] = useState(false);
  const [lastResolution, setLastResolution] = useState<any>(null);

  const refreshLogs = () => {
    const allLogs = internalLogger.getAllLogs();
    setLogs(allLogs.slice(-50)); // Show last 50 logs
  };

  const analyzeErrors = () => {
    return internalLogger.analyzeErrorPatterns();
  };

  const autoResolveErrors = async () => {
    setAutoResolving(true);
    try {
      const result = await errorResolver.analyzeAndResolve();
      setLastResolution(result);
      
      if (result.resolved > 0) {
        toast.success(`🎉 Auto-resolved ${result.resolved} errors!`);
      } else if (result.analyzed === 0) {
        toast.info('No recent errors to resolve');
      } else {
        toast.warn(`Analyzed ${result.analyzed} errors, ${result.failed} failed to resolve`);
      }
    } catch (error) {
      toast.error('Auto-resolution failed');
      internalLogger.error('auto_resolver', 'Failed to auto-resolve errors', { error });
    } finally {
      setAutoResolving(false);
    }
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const campaignErrors = internalLogger.getCampaignErrors();
  const supabaseErrors = internalLogger.getSupabaseErrors();
  const recentErrors = internalLogger.getRecentErrors(10);
  const analysis = analyzeErrors();

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warn':
        return 'secondary';
      case 'info':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Internal Error Monitor & Auto-Resolver
        </CardTitle>
        <CardDescription>
          Real-time error tracking with automated resolution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Button
            onClick={refreshLogs}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={autoResolveErrors}
            disabled={autoResolving}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {autoResolving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Auto-Resolve Errors
          </Button>
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-600">Campaign Errors</div>
            <div className="text-2xl font-bold text-red-700">{campaignErrors.length}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-600">Database Errors</div>
            <div className="text-2xl font-bold text-orange-700">{supabaseErrors.length}</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-600">Recent (10m)</div>
            <div className="text-2xl font-bold text-yellow-700">{recentErrors.length}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">Total Logs</div>
            <div className="text-2xl font-bold text-blue-700">{logs.length}</div>
          </div>
        </div>

        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recent">Recent Logs</TabsTrigger>
            <TabsTrigger value="campaign">Campaign Errors</TabsTrigger>
            <TabsTrigger value="analysis">Error Analysis</TabsTrigger>
            <TabsTrigger value="resolution">Auto-Resolution</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-2">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {logs.slice(-20).reverse().map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-3 ${
                    log.level === 'error' || log.level === 'critical' 
                      ? 'bg-red-50 border-red-200' 
                      : log.level === 'warn'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getLogIcon(log.level)}
                      <Badge variant={getBadgeColor(log.level)}>{log.level}</Badge>
                      <span className="text-sm font-medium">{log.category}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">{log.message}</div>
                  {log.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600">Data</summary>
                      <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="campaign" className="space-y-2">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {campaignErrors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  No campaign errors detected
                </div>
              ) : (
                campaignErrors.map((error) => (
                  <div key={error.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-800">{error.category}</span>
                      <Badge variant="destructive">{error.level}</Badge>
                    </div>
                    <div className="text-sm text-red-700 mb-2">{error.message}</div>
                    <div className="text-xs text-red-600">
                      {new Date(error.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Most Common Errors
                </h4>
                <div className="space-y-2">
                  {analysis.mostCommonErrors.slice(0, 5).map((error, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate flex-1">{error.message}</span>
                      <Badge variant="outline">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Error Categories</h4>
                <div className="space-y-2">
                  {analysis.errorTrends.slice(0, 5).map((trend, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{trend.category}</span>
                      <Badge variant="outline">{trend.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {analysis.criticalIssues.length > 0 && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">🚨 Critical Issues</h4>
                <div className="space-y-2">
                  {analysis.criticalIssues.map((issue) => (
                    <div key={issue.id} className="text-sm text-red-700">
                      <strong>{issue.category}:</strong> {issue.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolution" className="space-y-4">
            {lastResolution ? (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Last Auto-Resolution Results</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{lastResolution.analyzed}</div>
                    <div className="text-sm text-gray-600">Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{lastResolution.resolved}</div>
                    <div className="text-sm text-gray-600">Resolved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{lastResolution.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {lastResolution.resolutions.map((resolution: any, index: number) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 ${
                        resolution.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {resolution.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium text-sm">{resolution.strategy}</span>
                      </div>
                      <div className="text-xs text-gray-600 truncate">{resolution.error}</div>
                      {resolution.details && (
                        <div className="text-xs text-red-600 mt-1">{resolution.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-2" />
                No auto-resolution results yet. Click "Auto-Resolve Errors" to start.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
