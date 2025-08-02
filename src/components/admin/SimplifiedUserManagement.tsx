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
import { supabase } from '@/integrations/supabase/client';
import { adminAuditLogger } from '@/services/adminAuditLogger';
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

export function SimplifiedUserManagement() {
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
      console.log('🔄 Fetching user data (RLS-safe approach)...');

      // Log that admin is accessing user data
      await adminAuditLogger.logUserAction(
        'METRICS_VIEWED',
        'bulk_view',
        {
          section: 'user_management',
          action: 'fetch_user_data',
          timestamp: new Date().toISOString()
        }
      );
      
      // Method 1: Get ALL subscribers (not just active ones) to see more users
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('id, user_id, email, subscribed, subscription_tier, created_at, payment_method')
        .limit(100);

      console.log('Subscribers data:', subscribers, 'Error:', subscribersError);

      // Method 2: Get additional users from orders (all statuses)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('email, created_at, user_id, status, product_name')
        .limit(200);

      console.log('Orders data:', orders, 'Error:', ordersError);

      // Method 3: Try to get some data from campaigns table
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('user_id, created_at, name')
        .limit(50);

      console.log('Campaigns data:', campaigns, 'Error:', campaignsError);
      
      // Process data to create user list
      const userList: User[] = [];
      const emailsSeen = new Set<string>();
      
      // Add current admin user first
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          userList.push({
            id: 'current-admin',
            user_id: user.id,
            email: user.email,
            display_name: 'Admin User',
            role: 'admin',
            created_at: user.created_at || new Date().toISOString(),
            is_premium: false,
            subscription_status: 'admin'
          });
          emailsSeen.add(user.email);
        }
      } catch (authError) {
        console.warn('Could not get current user:', authError);
      }
      
      // Add all subscribers (premium and non-premium)
      (subscribers || []).forEach((sub, index) => {
        if (sub.email && !emailsSeen.has(sub.email)) {
          userList.push({
            id: sub.id || `sub-${index}`,
            user_id: sub.user_id || sub.id || `sub-${index}`,
            email: sub.email,
            display_name: sub.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' '),
            role: 'user',
            created_at: sub.created_at,
            is_premium: sub.subscribed === true,
            subscription_status: sub.subscribed ? (sub.subscription_tier || 'premium') : 'free'
          });
          emailsSeen.add(sub.email);
        }
      });
      
      // Add users from orders (all order statuses)
      const uniqueOrderEmails = new Map<string, any>();
      (orders || []).forEach(order => {
        if (order.email && !uniqueOrderEmails.has(order.email) && !emailsSeen.has(order.email)) {
          uniqueOrderEmails.set(order.email, order);
        }
      });

      Array.from(uniqueOrderEmails.values()).forEach((order, index) => {
        const isPremiumOrder = order.status === 'completed' && order.product_name?.toLowerCase().includes('premium');
        userList.push({
          id: `order-${index}`,
          user_id: order.user_id || `order-user-${index}`,
          email: order.email,
          display_name: order.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' '),
          role: 'user',
          created_at: order.created_at,
          is_premium: isPremiumOrder,
          subscription_status: isPremiumOrder ? 'premium' : 'customer'
        });
      });

      // Add users from campaigns (if they have user_ids)
      const uniqueCampaignUsers = new Map<string, any>();
      (campaigns || []).forEach(campaign => {
        if (campaign.user_id && !uniqueCampaignUsers.has(campaign.user_id)) {
          uniqueCampaignUsers.set(campaign.user_id, campaign);
        }
      });

      Array.from(uniqueCampaignUsers.values()).forEach((campaign, index) => {
        const isExistingUser = userList.some(u => u.user_id === campaign.user_id);
        if (!isExistingUser) {
          userList.push({
            id: `campaign-${index}`,
            user_id: campaign.user_id,
            email: `user-${campaign.user_id.substring(0, 8)}@backlinkoo.com`,
            display_name: campaign.name || `Campaign User ${index + 1}`,
            role: 'user',
            created_at: campaign.created_at,
            is_premium: false,
            subscription_status: 'active'
          });
        }
      });
      
      setUsers(userList);
      setConnectionStatus('connected');
      
      // Calculate stats
      const totalUsers = userList.length;
      const adminUsers = userList.filter(u => u.role === 'admin').length;
      const premiumUserCount = userList.filter(u => u.is_premium).length;
      
      // Recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSignups = userList.filter(u => 
        new Date(u.created_at) > sevenDaysAgo
      ).length;

      setStats({
        totalUsers,
        adminUsers,
        premiumUsers: premiumUserCount,
        recentSignups
      });
      setLastSync(new Date());

      console.log(`✅ User data synced: ${totalUsers} users (${premiumUserCount} premium, ${adminUsers} admin, ${recentSignups} recent)`);
      console.log('Final user list:', userList);

      // Log successful user data fetch
      await adminAuditLogger.logUserAction(
        'METRICS_VIEWED',
        'bulk_view',
        {
          section: 'user_management',
          action: 'fetch_user_data_success',
          stats: {
            total_users: totalUsers,
            admin_users: adminUsers,
            premium_users: premiumUserCount,
            recent_signups: recentSignups
          },
          timestamp: new Date().toISOString()
        }
      );

    } catch (error: any) {
      console.error('❌ Failed to sync user data:', error);

      // Log the error
      await adminAuditLogger.logUserAction(
        'METRICS_VIEWED',
        'bulk_view',
        {
          section: 'user_management',
          action: 'fetch_user_data_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        false,
        error instanceof Error ? error.message : 'Failed to fetch user data'
      );

      // Provide fallback data instead of empty state
      const fallbackUsers: User[] = [];

      // Try to at least get the current admin user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          fallbackUsers.push({
            id: 'current-admin',
            user_id: user.id,
            email: user.email,
            display_name: 'Admin User',
            role: 'admin',
            created_at: user.created_at || new Date().toISOString(),
            is_premium: false,
            subscription_status: 'admin'
          });
        }
      } catch (authError) {
        console.warn('Could not get current user:', authError);
      }

      setUsers(fallbackUsers);
      setStats({
        totalUsers: fallbackUsers.length,
        adminUsers: fallbackUsers.filter(u => u.role === 'admin').length,
        premiumUsers: 0,
        recentSignups: 0
      });

      setError(`Showing available data: ${error.message || 'Unknown error'}`);
      setConnectionStatus('disconnected');
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
              User Management - RLS Safe
            </div>
            <div className="flex items-center gap-2">
              {getConnectionBadge()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Connection Status */}
          {error ? (
            <Alert className="mb-4 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <div className="font-medium">Partial Data Loaded</div>
                <div className="text-sm mt-1">{error}</div>
              </AlertDescription>
            </Alert>
          ) : connectionStatus === 'connected' && lastSync && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="flex items-center justify-between">
                  <span>✅ Successfully synced with database (RLS-safe approach)</span>
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
            <div className="flex gap-2">
              <Button
                onClick={fetchUsersAndStats}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync Data
              </Button>
              <Button
                onClick={() => {
                  console.log('Current users state:', users);
                  console.log('Current stats:', stats);
                  alert(`Current data: ${users.length} users loaded. Check console for details.`);
                }}
                variant="ghost"
                size="sm"
              >
                Debug Info
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Info</TableHead>
                  <TableHead>Role & Status</TableHead>
                  <TableHead>Subscription Tier</TableHead>
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
                            {user.display_name || user.email?.split('@')[0] || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          {user.subscription_status && (
                            <div className="text-xs text-blue-600 mt-1">
                              Tier: {user.subscription_status}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getRoleBadge(user)}
                          <div>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                              {user.role.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={user.is_premium ? 'default' : 'outline'} className="text-xs">
                            {user.subscription_status || 'Unknown'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {user.is_premium ? 'Premium User' : 'Free/Basic User'}
                          </div>
                        </div>
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
