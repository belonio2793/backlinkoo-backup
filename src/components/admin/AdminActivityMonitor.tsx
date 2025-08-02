import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { adminAuditLogger, type AdminAuditLog, type AdminAction } from '@/services/adminAuditLogger';
import { 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Eye, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Shield,
  Database,
  FileText,
  Settings,
  Mail,
  CreditCard
} from 'lucide-react';

export function AdminActivityMonitor() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter, statusFilter]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh, actionFilter, resourceFilter, statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: 100 };

      if (actionFilter && actionFilter !== 'all') filters.action = actionFilter as AdminAction;
      if (resourceFilter && resourceFilter !== 'all') filters.resource = resourceFilter;
      
      const fetchedLogs = await adminAuditLogger.getAuditLogs(filters);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAdmin = !adminFilter || log.admin_email.includes(adminFilter);
    const matchesStatus = !statusFilter || statusFilter === 'all' ||
      (statusFilter === 'success' && log.success) ||
      (statusFilter === 'failed' && !log.success);
    
    return matchesSearch && matchesAdmin && matchesStatus;
  });

  const getActionIcon = (action: string, resource: string) => {
    if (action.includes('USER')) return <User className="h-4 w-4" />;
    if (action.includes('BLOG') || action.includes('CONTENT')) return <FileText className="h-4 w-4" />;
    if (action.includes('SECURITY')) return <Shield className="h-4 w-4" />;
    if (action.includes('SYSTEM') || action.includes('API')) return <Settings className="h-4 w-4" />;
    if (action.includes('EMAIL')) return <Mail className="h-4 w-4" />;
    if (action.includes('PAYMENT') || action.includes('SUBSCRIPTION')) return <CreditCard className="h-4 w-4" />;
    if (resource === 'system' || resource.includes('database')) return <Database className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string, success: boolean) => {
    if (!success) return 'destructive';
    if (action.includes('DELETE') || action.includes('SUSPEND') || action.includes('FAILED')) return 'destructive';
    if (action.includes('CREATE') || action.includes('ASSIGN') || action.includes('LOGIN')) return 'default';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'secondary';
    return 'outline';
  };

  const exportLogs = async () => {
    try {
      const csv = [
        ['Timestamp', 'Admin Email', 'Action', 'Resource', 'Success', 'Details'].join(','),
        ...filteredLogs.map(log => [
          log.created_at,
          log.admin_email,
          log.action,
          log.resource,
          log.success ? 'Yes' : 'No',
          JSON.stringify(log.details || {}).replace(/,/g, ';')
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-activity-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: `Exported ${filteredLogs.length} activity records`
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export activity logs',
        variant: 'destructive'
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setResourceFilter('all');
    setAdminFilter('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Admin Activity Monitor</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button onClick={fetchLogs} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Activity Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="USER_ROLE_ASSIGNED">User Management</SelectItem>
                  <SelectItem value="BLOG_POST_CREATED">Blog Actions</SelectItem>
                  <SelectItem value="SECURITY_SETTINGS_UPDATED">Security</SelectItem>
                  <SelectItem value="METRICS_VIEWED">Data Access</SelectItem>
                  <SelectItem value="DATA_EXPORT">Data Export</SelectItem>
                  <SelectItem value="ADMIN_LOGIN">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Resource</label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="blog_posts">Blog Posts</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security_dashboard">Security</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="success">Success only</SelectItem>
                  <SelectItem value="failed">Failed only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent Admin Activity ({filteredLogs.length})
              {autoRefresh && <Badge variant="outline" className="ml-2">Live</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="max-w-[200px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.slice(0, 50).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {log.admin_email.split('@')[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.admin_email.split('@')[1]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action, log.resource)}
                        <Badge variant={getActionBadgeVariant(log.action, log.success)}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.resource}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-xs text-muted-foreground truncate">
                        {log.error_message || (
                          log.details ? 
                            JSON.stringify(log.details).slice(0, 100) + '...' : 
                            'No details'
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
