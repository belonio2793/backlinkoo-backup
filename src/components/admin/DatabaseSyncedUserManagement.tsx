import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { unifiedAdminMetrics } from '@/services/unifiedAdminMetrics';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Crown, Gift, RefreshCw, AlertCircle, CheckCircle, Database } from "lucide-react";

interface User {
  id: string;
  user_id: string;
  email: string;
  display_name?: string;
  role: 'admin' | 'user';
  created_at: string;
  is_premium?: boolean;
  subscription_status?: string;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  premiumUsers: number;
  recentSignups: number;
}

export function DatabaseSyncedUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalUsers: 0, adminUsers: 0, premiumUsers: 0, recentSignups: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersAndStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Syncing user data from Supabase...');
      
      // Test connection first
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }

      setConnectionStatus('connected');

      // Fetch users with comprehensive data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          display_name,
          role,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (profilesError) {
        throw profilesError;
      }

      // Get subscription data for premium status
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('user_id, subscribed, subscription_tier')
        .eq('subscribed', true);

      if (subscribersError) {
        console.warn('Could not fetch subscription data:', subscribersError);
      }

      // Map users with subscription status
      const subscriberMap = new Map();
      subscribers?.forEach(sub => {
        subscriberMap.set(sub.user_id, sub);
      });

      const enrichedUsers: User[] = (profiles || []).map(profile => ({
        ...profile,
        is_premium: subscriberMap.has(profile.user_id),
        subscription_status: subscriberMap.get(profile.user_id)?.subscription_tier || 'free'
      }));

      setUsers(enrichedUsers);

      // Calculate stats
      const totalUsers = enrichedUsers.length;
      const adminUsers = enrichedUsers.filter(u => u.role === 'admin').length;
      const premiumUsers = enrichedUsers.filter(u => u.is_premium).length;
      
      // Recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSignups = enrichedUsers.filter(u => 
        new Date(u.created_at) > sevenDaysAgo
      ).length;

      setStats({ totalUsers, adminUsers, premiumUsers, recentSignups });
      setLastSync(new Date());

      console.log(`✅ Successfully synced ${totalUsers} users from database`);

    } catch (error: any) {
      console.error('❌ Failed to sync user data:', error);
      setError(error.message || 'Failed to sync user data');
      setConnectionStatus('disconnected');
      setUsers([]);
      setStats({ totalUsers: 0, adminUsers: 0, premiumUsers: 0, recentSignups: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndStats();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (user: User) => {
    if (user.role === 'admin') {
      return <Badge variant="destructive"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    if (user.is_premium) {
      return <Badge variant="default"><Gift className="h-3 w-3 mr-1" />Premium</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Disconnected</Badge>;
      default:
        return <Badge variant="outline">Checking...</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Crown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.premiumUsers}</div>
            <p className="text-xs text-muted-foreground">Active subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recentSignups}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              User Management - Database Synced
            </div>
            <div className="flex items-center gap-2">
              {getConnectionBadge()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Connection Status */}
          {error ? (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <div className="font-medium">Database Sync Error</div>
                <div className="text-sm mt-1">{error}</div>
              </AlertDescription>
            </Alert>
          ) : connectionStatus === 'connected' && lastSync && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="flex items-center justify-between">
                  <span>✅ Successfully synced with Supabase database</span>
                  <span className="text-xs">
                    Last sync: {lastSync.toLocaleTimeString()}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Search and Refresh */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email, name, role, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={fetchUsersAndStats} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Database
            </Button>
          </div>

          {/* Users Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Syncing with database...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {users.length === 0 ? 'No users found in database' : 'No users match your search'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.display_name || user.email || 'Unknown User'}
                          </div>
                          {user.email && user.display_name && (
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground font-mono">
                          {user.user_id.substring(0, 8)}...
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
            {searchTerm && ` (filtered by "${searchTerm}")`}
            {lastSync && ` • Last synced: ${lastSync.toLocaleString()}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
