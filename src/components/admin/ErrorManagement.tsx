import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Download, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  errorLogger, 
  ErrorSeverity, 
  ErrorCategory, 
  ErrorLogEntry 
} from '../../services/errorLoggingService';

interface ErrorStats {
  totalErrors: number;
  recentErrors: number;
  resolvedErrors: number;
  criticalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  trendsLast24h: {
    newErrors: number;
    resolvedErrors: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface FilterOptions {
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  resolved?: boolean;
  search?: string;
  dateRange?: 'today' | 'week' | 'month';
}

export const ErrorManagement: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<ErrorLogEntry[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLogEntry | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadErrors();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadErrors, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    applyFilters();
  }, [errors, filters]);

  const loadErrors = async () => {
    try {
      const errorData = await errorLogger.getRecentErrors(200);
      setErrors(errorData);
      calculateStats(errorData);
    } catch (error) {
      console.error('Failed to load errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (errorData: ErrorLogEntry[]): void => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentErrors = errorData.filter(e => new Date(e.timestamp) > last24h);
    
    const errorsByCategory = Object.values(ErrorCategory).reduce((acc, cat) => {
      acc[cat] = errorData.filter(e => e.category === cat).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, sev) => {
      acc[sev] = errorData.filter(e => e.severity === sev).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    setStats({
      totalErrors: errorData.length,
      recentErrors: recentErrors.length,
      resolvedErrors: errorData.filter(e => e.resolved).length,
      criticalErrors: errorData.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
      errorsByCategory,
      errorsBySeverity,
      trendsLast24h: {
        newErrors: recentErrors.length,
        resolvedErrors: errorData.filter(e => e.resolved && new Date(e.created_at || e.timestamp) > last24h).length,
        trend: recentErrors.length > 10 ? 'up' : recentErrors.length < 5 ? 'down' : 'stable'
      }
    });
  };

  const applyFilters = (): void => {
    let filtered = [...errors];

    if (filters.severity) {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    if (filters.resolved !== undefined) {
      filtered = filtered.filter(e => !!e.resolved === filters.resolved);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.message.toLowerCase().includes(search) ||
        e.component?.toLowerCase().includes(search) ||
        e.action?.toLowerCase().includes(search)
      );
    }

    if (filters.dateRange) {
      const now = new Date();
      let cutoff: Date;
      
      switch (filters.dateRange) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      
      filtered = filtered.filter(e => new Date(e.timestamp) > cutoff);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredErrors(filtered);
  };

  const handleResolveError = async (errorId: string): Promise<void> => {
    try {
      await errorLogger.markErrorAsResolved(errorId);
      setErrors(prev => prev.map(e => 
        e.id === errorId ? { ...e, resolved: true } : e
      ));
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  const exportErrors = (): void => {
    const csvContent = [
      ['Timestamp', 'Severity', 'Category', 'Message', 'Component', 'Action', 'Resolved'],
      ...filteredErrors.map(error => [
        error.timestamp,
        error.severity,
        error.category,
        error.message.replace(/,/g, ';'),
        error.component || '',
        error.action || '',
        error.resolved ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `errors_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityBadgeVariant = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'destructive';
      case ErrorSeverity.HIGH:
        return 'destructive';
      case ErrorSeverity.MEDIUM:
        return 'secondary';
      case ErrorSeverity.LOW:
      default:
        return 'outline';
    }
  };

  const getCategoryBadgeVariant = (category: ErrorCategory) => {
    const criticalCategories = [ErrorCategory.PAYMENT, ErrorCategory.AUTHENTICATION];
    return criticalCategories.includes(category) ? 'destructive' : 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading error data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Management</h1>
          <p className="text-muted-foreground">Monitor and manage application errors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            Auto Refresh
          </Button>
          <Button onClick={loadErrors} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportErrors} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalErrors}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentErrors} in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.criticalErrors}</div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolvedErrors}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.resolvedErrors / stats.totalErrors) * 100)}% resolution rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trend (24h)</CardTitle>
              {stats.trendsLast24h.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : stats.trendsLast24h.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trendsLast24h.newErrors}</div>
              <p className="text-xs text-muted-foreground">
                {stats.trendsLast24h.resolvedErrors} resolved
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">Error Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  placeholder="Search errors..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
                
                <Select value={filters.severity || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, severity: value as ErrorSeverity || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Severities</SelectItem>
                    {Object.values(ErrorSeverity).map(severity => (
                      <SelectItem key={severity} value={severity}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.category || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, category: value as ErrorCategory || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {Object.values(ErrorCategory).map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.resolved?.toString() || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, resolved: value === '' ? undefined : value === 'true' }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="false">Unresolved</SelectItem>
                    <SelectItem value="true">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.dateRange || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, dateRange: value as FilterOptions['dateRange'] || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {Object.keys(filters).some(key => filters[key as keyof FilterOptions]) && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({})}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Table */}
          <Card>
            <CardHeader>
              <CardTitle>Error Log ({filteredErrors.length})</CardTitle>
              <CardDescription>
                Recent application errors and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredErrors.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No errors found matching the current filters.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.slice(0, 50).map((error) => (
                      <TableRow key={error.id || error.timestamp}>
                        <TableCell className="text-sm">
                          {new Date(error.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(error.severity)}>
                            {error.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCategoryBadgeVariant(error.category)}>
                            {error.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {error.message}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {error.component || '-'}
                        </TableCell>
                        <TableCell>
                          {error.resolved ? (
                            <Badge variant="outline" className="text-green-600">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Open
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedError(error)}
                            >
                              View
                            </Button>
                            {!error.resolved && error.id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveError(error.id!)}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Errors by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.errorsByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
                        </span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Errors by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </span>
                        <Badge variant={getSeverityBadgeVariant(severity as ErrorSeverity)}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Error Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedError.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Severity</label>
                    <div className="mt-1">
                      <Badge variant={getSeverityBadgeVariant(selectedError.severity)}>
                        {selectedError.severity}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <div className="mt-1">
                      <Badge variant={getCategoryBadgeVariant(selectedError.category)}>
                        {selectedError.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Message</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedError.message}
                  </p>
                </div>

                {selectedError.component && (
                  <div>
                    <label className="text-sm font-medium">Component</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedError.component}
                    </p>
                  </div>
                )}

                {selectedError.action && (
                  <div>
                    <label className="text-sm font-medium">Action</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedError.action}
                    </p>
                  </div>
                )}

                {selectedError.details && (
                  <div>
                    <label className="text-sm font-medium">Details</label>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedError.details, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedError.stack_trace && (
                  <div>
                    <label className="text-sm font-medium">Stack Trace</label>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {selectedError.stack_trace}
                    </pre>
                  </div>
                )}
              </div>

              {!selectedError.resolved && selectedError.id && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={() => {
                      handleResolveError(selectedError.id!);
                      setSelectedError(null);
                    }}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ErrorManagement;
