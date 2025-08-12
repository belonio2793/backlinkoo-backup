import React, { useState, useEffect, useRef } from 'react';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Bug, 
  Activity, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Download,
  Trash2,
  Filter,
  Search,
  Play,
  Pause,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { activeLogger, debugLog, DebugLog, AutomationMetrics } from '@/services/activeErrorLogger';
import { toast } from 'sonner';

interface DebugDashboardProps {
  className?: string;
}

export function AutomationDebugDashboard({ className }: DebugDashboardProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [metrics, setMetrics] = useState<AutomationMetrics[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterComponent, setFilterComponent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<DebugLog | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Get system health
  const systemHealth = activeLogger.getSystemHealth();

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isLiveMode) return;

    const unsubscribe = activeLogger.subscribe((newLog) => {
      setLogs(prevLogs => {
        const updated = [newLog, ...prevLogs].slice(0, 500); // Keep last 500 logs
        return updated;
      });

      // Auto-scroll to new logs if enabled
      if (autoScroll && scrollAreaRef.current) {
        setTimeout(() => {
          scrollAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    });

    // Refresh metrics every 5 seconds
    const metricsInterval = setInterval(() => {
      setMetrics(activeLogger.getMetrics().slice(0, 100));
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(metricsInterval);
    };
  }, [isLiveMode, autoScroll]);

  const refreshData = () => {
    const allLogs = activeLogger.getLogs();
    setLogs(allLogs.slice(0, 500));
    setMetrics(activeLogger.getMetrics().slice(0, 100));
    debugLog.info('debug_dashboard', 'refresh_data', 'Debug dashboard data refreshed');
  };

  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'all' || log.level === filterLevel;
    const componentMatch = filterComponent === 'all' || log.component === filterComponent;
    const searchMatch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operation.toLowerCase().includes(searchTerm.toLowerCase());
    
    return levelMatch && componentMatch && searchMatch;
  });

  const clearLogs = () => {
    activeLogger.clearLogs();
    activeLogger.clearMetrics();
    setLogs([]);
    setMetrics([]);
    toast.success('Debug logs cleared');
  };

  const exportLogs = async () => {
    try {
      const exportData = await activeLogger.exportLogs('json');
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automation-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Debug logs exported');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const getLevelIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'debug': return <Bug className="h-3 w-3 text-gray-500" />;
      case 'info': return <Info className="h-3 w-3 text-blue-500" />;
      case 'warn': return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'error': return <XCircle className="h-3 w-3 text-red-500" />;
      case 'critical': return <AlertCircle className="h-3 w-3 text-red-700" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getLevelBadgeVariant = (level: DebugLog['level']) => {
    switch (level) {
      case 'debug': return 'secondary';
      case 'info': return 'default';
      case 'warn': return 'outline';
      case 'error': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getUniqueComponents = () => {
    const components = new Set(logs.map(log => log.component));
    return Array.from(components);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }).format(timestamp);
  };

  const getHealthBadge = () => {
    const { errorCount, criticalCount, failureRate } = systemHealth;
    
    if (criticalCount > 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Critical Issues
      </Badge>;
    }
    
    if (errorCount > 10 || failureRate > 0.5) {
      return <Badge variant="outline" className="flex items-center gap-1 text-yellow-600 border-yellow-600">
        <AlertTriangle className="h-3 w-3" />
        High Error Rate
      </Badge>;
    }
    
    return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
      <CheckCircle className="h-3 w-3" />
      Healthy
    </Badge>;
  };

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Debug Dashboard
                {getHealthBadge()}
              </CardTitle>
              <CardDescription>
                Real-time debugging and error tracking for automation system development
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLiveMode(!isLiveMode)}
                className={isLiveMode ? 'bg-green-50 border-green-200' : ''}
              >
                {isLiveMode ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Paused
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLiveMode}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="logs">
                <Bug className="h-4 w-4 mr-1" />
                Debug Logs ({filteredLogs.length})
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <BarChart3 className="h-4 w-4 mr-1" />
                Metrics ({metrics.length})
              </TabsTrigger>
              <TabsTrigger value="health">
                <Activity className="h-4 w-4 mr-1" />
                System Health
              </TabsTrigger>
              <TabsTrigger value="errors">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Recent Errors ({systemHealth.recentErrors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs">
              {/* Log Filters */}
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={filterComponent} onValueChange={setFilterComponent}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Components</SelectItem>
                    {getUniqueComponents().map(component => (
                      <SelectItem key={component} value={component}>{component}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-sm text-gray-600">Auto-scroll:</label>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                </div>
              </div>

              {/* Log List */}
              <ScrollArea className="h-96" ref={scrollAreaRef}>
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <Card 
                      key={log.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedLog?.id === log.id ? 'ring-2 ring-blue-500' : ''
                      } ${log.level === 'error' || log.level === 'critical' ? 'border-red-200 bg-red-50/50' : ''}`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {getLevelIcon(log.level)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                                  {log.level}
                                </Badge>
                                <span className="text-xs font-mono text-gray-500">
                                  {formatTimestamp(log.timestamp)}
                                </span>
                                <span className="text-xs text-blue-600 font-medium">
                                  {log.component}:{log.operation}
                                </span>
                              </div>
                              <p className="text-sm font-medium truncate">{log.message}</p>
                              {log.data && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  Data: {JSON.stringify(log.data).substring(0, 100)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No logs found matching current filters</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Selected Log Details */}
              {selectedLog && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Log Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">ID:</span> {selectedLog.id}
                        </div>
                        <div>
                          <span className="font-medium">Session:</span> {selectedLog.sessionId}
                        </div>
                        <div>
                          <span className="font-medium">Timestamp:</span> {selectedLog.timestamp.toISOString()}
                        </div>
                        <div>
                          <span className="font-medium">Component:</span> {selectedLog.component}
                        </div>
                        <div>
                          <span className="font-medium">Operation:</span> {selectedLog.operation}
                        </div>
                        <div>
                          <span className="font-medium">Level:</span> {selectedLog.level}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Message:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{selectedLog.message}</p>
                      </div>

                      {selectedLog.data && (
                        <div>
                          <span className="font-medium">Data:</span>
                          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(selectedLog.data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedLog.stackTrace && (
                        <div>
                          <span className="font-medium">Stack Trace:</span>
                          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                            {selectedLog.stackTrace}
                          </pre>
                        </div>
                      )}

                      <div>
                        <span className="font-medium">Context:</span>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-24">
                          {JSON.stringify(selectedLog.context, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="metrics">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {metrics.map((metric, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {metric.component}:{metric.operation}
                              </span>
                              <Badge variant={metric.success ? 'default' : 'destructive'}>
                                {metric.success ? 'Success' : 'Failed'}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 space-x-4">
                              {metric.duration && (
                                <span>Duration: {metric.duration}ms</span>
                              )}
                              {metric.errorCount > 0 && (
                                <span className="text-red-600">Errors: {metric.errorCount}</span>
                              )}
                              {metric.retryCount > 0 && (
                                <span className="text-yellow-600">Retries: {metric.retryCount}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(metric.startTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {metrics.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No metrics available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="health">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{systemHealth.totalLogs}</div>
                    <div className="text-sm text-gray-600">Total Logs (1h)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{systemHealth.errorCount}</div>
                    <div className="text-sm text-gray-600">Errors (1h)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {systemHealth.avgOperationTime.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Operation Time</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {(systemHealth.failureRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Failure Rate</div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  System is {systemHealth.criticalCount > 0 ? 'experiencing critical issues' : 
                    systemHealth.errorCount > 10 ? 'having some issues' : 'running smoothly'}.
                  {systemHealth.warnCount > 0 && ` ${systemHealth.warnCount} warnings in the last hour.`}
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="errors">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {systemHealth.recentErrors.map((error) => (
                    <Alert key={error.id} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {error.component}:{error.operation}
                          </div>
                          <div>{error.message}</div>
                          <div className="text-xs opacity-75">
                            {formatTimestamp(error.timestamp)}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  
                  {systemHealth.recentErrors.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No recent errors - system is healthy!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AutomationDebugDashboard;
