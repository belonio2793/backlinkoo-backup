import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminAuditLogger, type AdminAuditLog, type AdminAction } from '@/services/adminAuditLogger';
import { AdminActivityMonitor } from '@/components/admin/AdminActivityMonitor';
import { AuditLoggingSummary } from '@/components/admin/AuditLoggingSummary';
import { Shield, Users, Activity, AlertTriangle, Search, Download, RefreshCw, Clock, Eye, Filter } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  created_by: string;
}

interface UserWithRole extends UserRole {
  email: string;
  display_name: string;
}

interface AuditStats {
  totalLogs: number;
  recentLogs: number;
  failedActions: number;
  uniqueAdmins: number;
}

export function SecurityDashboard() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    initializeAuditLogger();
    fetchUserRoles();
    fetchAuditLogs();
    fetchAuditStats();
  }, []);

  const initializeAuditLogger = async () => {
    await adminAuditLogger.initialize();
    // Log that admin accessed security dashboard
    await adminAuditLogger.logSecurityAction('SECURITY_SETTINGS_UPDATED', 'security_dashboard', {
      section: 'accessed',
      timestamp: new Date().toISOString()
    });
  };

  const fetchUserRoles = async () => {
    try {
      // First get user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);

      // Then get profiles separately and combine
      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(role => role.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, display_name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine roles with profiles
        const combined = rolesData.map(role => {
          const profile = profilesData?.find(p => p.user_id === role.user_id);
          return {
            ...role,
            email: profile?.email || 'Unknown',
            display_name: profile?.display_name || 'Unknown'
          };
        });

        setUsersWithRoles(combined);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user roles',
        variant: 'destructive'
      });
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const filters: any = {
        limit: 100
      };

      if (actionFilter) filters.action = actionFilter as AdminAction;
      if (resourceFilter) filters.resource = resourceFilter;

      const logs = await adminAuditLogger.getAuditLogs(filters);
      setAuditLogs(logs);
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

  const fetchAuditStats = async () => {
    try {
      const stats = await adminAuditLogger.getAuditStats();
      setAuditStats(stats);
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select both user and role',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get current role for audit log
      const currentUser = usersWithRoles.find(u => u.user_id === selectedUser);
      const oldRole = currentUser?.role;

      const { error } = await supabase.rpc('assign_user_role', {
        target_user_id: selectedUser,
        new_role: selectedRole as 'admin' | 'moderator' | 'user'
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role assigned successfully'
      });

      // Log the action with detailed information
      await adminAuditLogger.logUserAction(
        'USER_ROLE_ASSIGNED',
        selectedUser,
        {
          target_user_email: currentUser?.email,
          old_role: oldRole,
          new_role: selectedRole
        }
      );

      fetchUserRoles();
      fetchAuditLogs(); // Refresh audit logs
      setSelectedUser('');
      setSelectedRole('');
    } catch (error) {
      console.error('Error assigning role:', error);

      // Log the failed action
      await adminAuditLogger.logUserAction(
        'USER_ROLE_ASSIGNED',
        selectedUser,
        {
          attempted_role: selectedRole,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        false,
        error instanceof Error ? error.message : 'Failed to assign role'
      );

      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive'
      });
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserRoles(),
      fetchAuditLogs(),
      fetchAuditStats()
    ]);

    await adminAuditLogger.logSystemAction('METRICS_VIEWED', {
      section: 'security_dashboard',
      action: 'refresh_data'
    });

    toast({
      title: 'Data Refreshed',
      description: 'Security dashboard data has been updated'
    });
  };

  const exportAuditLogs = async () => {
    try {
      const allLogs = await adminAuditLogger.getAuditLogs({ limit: 1000 });
      const csv = [
        ['Timestamp', 'Admin Email', 'Action', 'Resource', 'Success', 'Details'].join(','),
        ...allLogs.map(log => [
          log.created_at,
          log.admin_email,
          log.action,
          log.resource,
          log.success ? 'Yes' : 'No',
          JSON.stringify(log.details || {})
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      await adminAuditLogger.logSystemAction('DATA_EXPORT', {
        type: 'audit_logs',
        record_count: allLogs.length
      });

      toast({
        title: 'Export Complete',
        description: `Exported ${allLogs.length} audit log records`
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export audit logs',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getActionBadgeVariant = (action: string, success: boolean) => {
    if (!success) return 'destructive';
    if (action.includes('DELETE') || action.includes('SUSPEND')) return 'destructive';
    if (action.includes('CREATE') || action.includes('ASSIGN')) return 'default';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Security Dashboard</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportAuditLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="activity">Live Activity</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usersWithRoles.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usersWithRoles.filter(ur => ur.role === 'admin').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditStats?.totalLogs || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {auditStats?.recentLogs || 0} in last 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{auditStats?.failedActions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {auditStats?.uniqueAdmins || 0} unique admins
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {/* Audit Log Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Audit Log Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actions, resources, emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Action</label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <SelectItem value="USER_ROLE_ASSIGNED">User Role Assigned</SelectItem>
                      <SelectItem value="BLOG_POST_CREATED">Blog Post Created</SelectItem>
                      <SelectItem value="BLOG_POST_DELETED">Blog Post Deleted</SelectItem>
                      <SelectItem value="SECURITY_SETTINGS_UPDATED">Security Settings</SelectItem>
                      <SelectItem value="ADMIN_LOGIN">Admin Login</SelectItem>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={fetchAuditLogs} variant="outline" size="sm">
                  Apply Filters
                </Button>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setActionFilter('all');
                    setResourceFilter('all');
                    fetchAuditLogs();
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Admin Actions ({filteredLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.admin_email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action, log.success)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.resource}</TableCell>
                      <TableCell>
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-xs text-muted-foreground truncate">
                          {log.error_message || (log.details ? JSON.stringify(log.details).slice(0, 100) + '...' : 'No details')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <AdminActivityMonitor />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">

          {/* Role Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assign User Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">User</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersWithRoles.map((userRole) => (
                        <SelectItem key={userRole.user_id} value={userRole.user_id}>
                          {userRole.email} ({userRole.display_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={assignRole} disabled={!selectedUser || !selectedRole}>
                  Assign Role
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current User Roles ({usersWithRoles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell>{userRole.display_name || 'N/A'}</TableCell>
                      <TableCell>{userRole.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(userRole.role)}>
                          {userRole.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(userRole.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Activity Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Actions Today:</span>
                      <span className="font-mono">{auditStats?.recentLogs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Failed Actions:</span>
                      <span className="font-mono text-destructive">{auditStats?.failedActions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Admins:</span>
                      <span className="font-mono">{auditStats?.uniqueAdmins || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate:</span>
                      <span className="font-mono">
                        {auditStats?.totalLogs ?
                          Math.round(((auditStats.totalLogs - (auditStats.failedActions || 0)) / auditStats.totalLogs) * 100)
                          : 100}%
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Security Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Audit Logging Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Role-Based Access Control</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Database Security Policies</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AuditLoggingSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
