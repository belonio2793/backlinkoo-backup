import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Edit,
  Crown,
  Gift,
  CreditCard,
  Activity,
  Calendar,
  DollarSign,
  Plus,
  RefreshCw,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Shield,
  AlertTriangle,
  Database,
  CheckCircle,
  XCircle,
  Settings,
  Mail,
  Calendar as CalendarIcon,
  Eye,
  Loader2
} from "lucide-react";
import {
  realAdminUserService,
  type RealUserDetails,
  type UserListFilters,
  type UserUpdatePayload
} from "@/services/realAdminUserService";
import { supabase } from "@/integrations/supabase/client";
import { SchemaCompatibility } from "@/utils/schemaCompatibility";

interface UserStats {
  totalUsers: number;
  premiumUsers: number;
  activeUsers: number;
  totalRevenue: number;
}

export function AdminUserDashboard() {
  const [users, setUsers] = useState<RealUserDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<RealUserDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    profileCount: number;
    error?: string;
  }>({ connected: false, profileCount: 0 });
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    premiumUsers: 0,
    activeUsers: 0,
    totalRevenue: 0
  });
  const [filters, setFilters] = useState<UserListFilters>({
    search: '',
    role: 'all',
    premiumStatus: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 100,
    offset: 0
  });
  const { toast } = useToast();

  // RLS Recursion Fix Function
  const fixRLSRecursion = async () => {
    try {
      console.log('🔧 Attempting to fix RLS recursion...');

      const response = await fetch('/.netlify/functions/fix-rls-recursion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ RLS recursion fix successful');
        toast({
          title: "RLS Fix Applied",
          description: "Database policies have been fixed. Retesting connection...",
        });

        // Wait a moment then retry connection
        setTimeout(() => {
          testDatabaseConnection();
        }, 2000);
      } else {
        throw new Error(result.error || 'RLS fix failed');
      }
    } catch (error) {
      console.error('❌ RLS fix failed:', error);
      setConnectionStatus({
        connected: false,
        error: `RLS fix failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual intervention required.`,
        lastTested: new Date()
      });

      toast({
        title: "RLS Fix Failed",
        description: "Manual database policy review required. Check console for details.",
        variant: "destructive"
      });
    }
  };

  // Initialize connection and load data
  useEffect(() => {
    initializeConnection();
  }, []);

  // Load users when filters change
  useEffect(() => {
    if (connectionStatus.connected) {
      loadUsers();
      loadUserStats();
    }
  }, [filters, connectionStatus.connected]);

  const initializeConnection = async () => {
    try {
      setLoading(true);
      console.log('🔍 Initializing database connection...');
      
      // Test connection first
      const connectionResult = await testDatabaseConnection();
      
      if (connectionResult.success) {
        // Load initial data
        await Promise.all([
          loadUsers(),
          loadUserStats()
        ]);
      }
    } catch (error: any) {
      console.error('❌ Initialization failed:', error);
      toast({
        title: "Initialization Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');

      // Check for RLS recursion specifically first
      if (connectionStatus.error?.includes('infinite recursion')) {
        console.log('🔧 RLS recursion detected, attempting to fix...');
        await fixRLSRecursion();
        return;
      }

      // Direct test of profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, role, subscription_tier, created_at')
        .limit(1);

      if (profilesError) {
        // Check if this is an RLS recursion error
        if (profilesError.message.includes('infinite recursion')) {
          console.log('🔧 RLS recursion detected in profiles query, attempting fix...');
          await fixRLSRecursion();
          return;
        }
        throw new Error(`Database connection failed: ${profilesError.message}`);
      }

      // Count total profiles
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Profile count failed: ${countError.message}`);
      }

      const result = {
        success: true,
        profileCount: count || 0,
        error: undefined
      };

      setConnectionStatus({
        connected: true,
        profileCount: count || 0
      });

      toast({
        title: "Database Connected",
        description: `Successfully connected! Found ${count || 0} user profiles.`,
      });

      return result;
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setConnectionStatus({
        connected: false,
        profileCount: 0,
        error: error.message
      });
      
      toast({
        title: "Database Connection Failed", 
        description: error.message,
        variant: "destructive"
      });

      return {
        success: false,
        profileCount: 0,
        error: error.message
      };
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading users from database...');

      // Build query
      let query = supabase
        .from('profiles')
        .select(`
          *,
          subscribers (
            id,
            status,
            plan_type,
            current_period_end
          )
        `)
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 100) - 1);

      // Apply filters
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
      }

      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      if (filters.premiumStatus && filters.premiumStatus !== 'all') {
        if (filters.premiumStatus === 'premium') {
          query = query.or('subscription_tier.eq.premium,subscription_tier.eq.monthly');
        } else if (filters.premiumStatus === 'free') {
          query = query.is('subscription_tier', null);
        }
      }

      // Apply sorting
      if (filters.sortBy) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) {
        throw new Error(`Failed to load users: ${profilesError.message}`);
      }

      // Transform data to match expected format
      const transformedUsers: RealUserDetails[] = (profilesData || []).map(profile => ({
        ...profile,
        subscription: (profile as any).subscribers?.[0] || (profile as any).premium_subscriptions?.[0] || null,
        campaignCount: 0, // Will be loaded separately if needed
        totalCreditsUsed: 0,
        totalRevenue: 0,
        lastActivity: profile.updated_at,
        isPremium: profile.subscription_tier === 'premium' || profile.subscription_tier === 'monthly',
        isGifted: profile.subscription_tier === 'gifted'
      }));

      setUsers(transformedUsers);
      setTotalCount(transformedUsers.length);

      console.log(`✅ Loaded ${transformedUsers.length} users`);

    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      toast({
        title: "Error Loading Users",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Get total user count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get premium user count
      const { count: premiumUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or('subscription_tier.eq.premium,subscription_tier.eq.monthly');

      // Get active users (users who logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      setUserStats({
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        activeUsers: activeUsers || 0,
        totalRevenue: 0 // Calculate based on premium subscriptions if needed
      });

    } catch (error: any) {
      console.error('❌ Error loading user stats:', error);
    }
  };

  const handleSetPremium = async (user: RealUserDetails, isPremium: boolean, isGifted: boolean = false) => {
    try {
      console.log(`${isPremium ? '👑' : '❌'} Setting premium status for user:`, user.email, { isPremium, isGifted });

      const subscriptionTier = isPremium ? (isGifted ? 'gifted' : 'premium') : null;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: subscriptionTier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (error) {
        throw new Error(error.message);
      }

      // If setting to premium, create a subscription record
      if (isPremium) {
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1); // 1 year from now

        const { error: subError } = await SchemaCompatibility.upsertSubscription({
          user_id: user.user_id,
          plan_type: 'premium',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString()
        });

        if (subError) {
          console.warn('⚠️ Subscription record warning:', subError.message);
        }
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.user_id === user.user_id
            ? { ...u, subscription_tier: subscriptionTier, isPremium, isGifted }
            : u
        )
      );

      // Refresh stats
      loadUserStats();

      toast({
        title: isPremium ? "Premium Activated!" : "Premium Removed",
        description: `Successfully ${isPremium ? 'activated' : 'removed'} premium for ${user.display_name || user.email}`,
      });

    } catch (error: any) {
      console.error('❌ Error updating premium status:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditUser = async (updates: UserUpdatePayload) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.display_name,
          role: updates.role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedUser.user_id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.user_id === selectedUser.user_id
            ? { ...u, ...updates }
            : u
        )
      );

      setIsEditDialogOpen(false);
      setSelectedUser(null);

      toast({
        title: "User Updated",
        description: "User details have been successfully updated",
      });

    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (user: RealUserDetails) => {
    if (user.isPremium) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          {user.isGifted ? 'Gifted' : 'Premium'}
        </Badge>
      );
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="default">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return <Badge variant="outline">User</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts with live database synchronization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={testDatabaseConnection}
            variant="outline"
            disabled={loading}
          >
            <Database className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button
            onClick={loadUsers}
            variant="outline"
            disabled={loading || !connectionStatus.connected}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reload Data
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${connectionStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus.connected ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {connectionStatus.connected && (
              <Badge variant="outline">
                {connectionStatus.profileCount} profiles found
              </Badge>
            )}
            {connectionStatus.error && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{connectionStatus.error}</span>
                </div>
                {connectionStatus.error.includes('infinite recursion') && (
                  <div className="flex gap-2">
                    <Button
                      onClick={fixRLSRecursion}
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-Fix RLS Recursion
                    </Button>
                    <Button
                      onClick={testDatabaseConnection}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry Connection
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Crown className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.premiumUsers}</p>
                <p className="text-xs text-muted-foreground">Premium Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round((userStats.premiumUsers / Math.max(userStats.totalUsers, 1)) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Premium Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, offset: 0 }))}
                className="w-64"
              />
            </div>

            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as any, offset: 0 }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.premiumStatus}
              onValueChange={(value) => setFilters(prev => ({ ...prev, premiumStatus: value as any, offset: 0 }))}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="gifted">Gifted</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setFilters({
                search: '',
                role: 'all',
                premiumStatus: 'all',
                sortBy: 'created_at',
                sortOrder: 'desc',
                limit: 100,
                offset: 0
              })}
              variant="outline"
              size="sm"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Accounts ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : !connectionStatus.connected ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Database Connection Required</h3>
              <p className="text-muted-foreground mb-4">
                Please test the database connection to load user data.
              </p>
              <Button onClick={testDatabaseConnection}>
                <Database className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                {filters.search ? 'Try adjusting your search filters.' : 'No users exist in the database yet.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(user.display_name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.display_name || 'No Name'}</p>
                            <p className="text-xs text-muted-foreground">ID: {user.user_id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.updated_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          {!user.isPremium ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Crown className="h-3 w-3 text-amber-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Set Premium Status</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Set {user.display_name || user.email} as a premium user?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleSetPremium(user, true, false)}
                                    className="bg-amber-600 hover:bg-amber-700"
                                  >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Set Premium
                                  </AlertDialogAction>
                                  <AlertDialogAction
                                    onClick={() => handleSetPremium(user, true, true)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    <Gift className="h-4 w-4 mr-2" />
                                    Gift Premium
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Premium Status</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Remove premium status from {user.display_name || user.email}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleSetPremium(user, false)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remove Premium
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSave={handleEditUser}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit User Form Component
interface EditUserFormProps {
  user: RealUserDetails;
  onSave: (updates: UserUpdatePayload) => void;
  onCancel: () => void;
}

function EditUserForm({ user, onSave, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    display_name: user.display_name || '',
    role: user.role,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
          placeholder="Enter display name"
        />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'admin' | 'user' }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}
