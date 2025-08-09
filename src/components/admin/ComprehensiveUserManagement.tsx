import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Edit,
  Crown,
  Activity,
  DollarSign,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  Trash2,
  Save,
  X,
  Download,
  Ban,
  Unlock,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Eye,
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Shield,
  Key,
  Settings,
  User,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  subscription_tier: 'free' | 'monthly' | 'premium' | 'enterprise';
  subscription_status: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  user_metadata: any;
}

interface CombinedUser {
  id: string;
  email: string;
  role: string;
  subscription_tier: string;
  subscription_status: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  user_metadata: any;
}

export default function ComprehensiveUserManagement() {
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CombinedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Stats
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    newUsersToday: 0
  });

  // Create user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user',
    subscription_tier: 'free',
    display_name: ''
  });

  const { toast } = useToast();

  // Load users from profiles table - requires real database access
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check current user authentication
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error('You must be logged in to access user management');
      }

      console.log('Fetching all user profiles from database...');

      // Fetch all profiles from database
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          role,
          subscription_tier,
          subscription_status,
          display_name,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database query failed:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database access failed: ${error.message}. Ensure you have admin privileges and RLS policies allow access to profiles table.`);
      }

      if (!profiles || profiles.length === 0) {
        setError('No user profiles found in database. Users may need to sign in first to create their profiles.');
        setUsers([]);
        setFilteredUsers([]);
        setUserStats({
          totalUsers: 0,
          activeUsers: 0,
          premiumUsers: 0,
          newUsersToday: 0
        });
        return;
      }

      console.log(`Successfully fetched ${profiles.length} user profiles from database`);

      // Transform database profiles to UI format
      const combinedUsers: CombinedUser[] = profiles.map((profile: any) => ({
        id: profile.user_id || profile.id,
        email: profile.email,
        role: profile.role || 'user',
        subscription_tier: profile.subscription_tier || 'free',
        subscription_status: profile.subscription_status || 'active',
        display_name: profile.display_name,
        created_at: profile.created_at,
        last_sign_in_at: null, // Not available in profiles table
        email_confirmed_at: null, // Not available in profiles table
        banned_until: null, // Not available in profiles table
        user_metadata: {}
      }));

      setUsers(combinedUsers);
      setFilteredUsers(combinedUsers);

      // Calculate real stats from database data
      const today = new Date().toISOString().split('T')[0];
      const stats = {
        totalUsers: combinedUsers.length,
        activeUsers: combinedUsers.filter(u => u.subscription_status === 'active').length,
        premiumUsers: combinedUsers.filter(u => ['monthly', 'premium', 'enterprise'].includes(u.subscription_tier)).length,
        newUsersToday: combinedUsers.filter(u => u.created_at.startsWith(today)).length
      };
      setUserStats(stats);

      toast({
        title: "Real User Data Loaded",
        description: `Successfully loaded ${combinedUsers.length} users from profiles database table.`,
      });

    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Failed to load users from database';
      setError(errorMessage);

      // Set empty state - no fallbacks
      setUsers([]);
      setFilteredUsers([]);
      setUserStats({
        totalUsers: 0,
        activeUsers: 0,
        premiumUsers: 0,
        newUsersToday: 0
      });

      toast({
        title: "Database Access Required",
        description: `${errorMessage}. Real database access is required for user management.`,
        variant: "destructive"
      });
      console.error('Database access error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new user (requires Supabase admin privileges)
  const createUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: "Missing Information",
        description: "Email and password are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // This requires admin API access which is not available in browser clients
      // Users should be created through Supabase Auth admin or manual invitation
      throw new Error('User creation through browser is not supported. Please create users through Supabase Auth admin panel or invite system.');

    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Failed to create user';
      toast({
        title: "Error Creating User",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsCreateModalOpen(false);
    }
  };

  // Update user
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          role: selectedUser.role,
          subscription_tier: selectedUser.subscription_tier,
          subscription_status: selectedUser.subscription_status,
          display_name: selectedUser.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', selectedUser.id);

      if (error) {
        if (error.message.includes('permission denied')) {
          throw new Error(`Permission denied: You need admin privileges to update users. Current error: ${error.message}`);
        }
        throw new Error(`Failed to update user: ${error.message}`);
      }

      toast({
        title: "User Updated",
        description: `Successfully updated ${selectedUser.email}`,
      });

      setIsEditModalOpen(false);
      setSelectedUser(null);
      await loadUsers(); // Reload to get updated data

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update user';
      toast({
        title: "Error Updating User",
        description: errorMessage,
        variant: "destructive"
      });
      console.error('Update user error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (user: CombinedUser) => {
    try {
      setLoading(true);

      // Delete profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) {
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }

      toast({
        title: "User Deleted",
        description: `Successfully deleted ${user.email}. Note: Auth user still exists and needs to be deleted via Supabase Auth admin.`,
      });

      await loadUsers(); // Reload data

    } catch (error: any) {
      toast({
        title: "Error Deleting User",
        description: error.message || 'Failed to delete user',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Export users
  const exportUsers = () => {
    const csv = [
      ['ID', 'Email', 'Role', 'Subscription Tier', 'Display Name', 'Created At'],
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.role,
        user.subscription_tier,
        user.display_name || '',
        user.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredUsers.length} users to CSV`,
    });
  };

  // Filter users
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSubscription = subscriptionFilter === 'all' || user.subscription_tier === subscriptionFilter;

      return matchesSearch && matchesRole && matchesSubscription;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, searchTerm, roleFilter, subscriptionFilter]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      premium: 'bg-purple-100 text-purple-800 border-purple-200',
      user: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return variants[role as keyof typeof variants] || variants.user;
  };

  const getSubscriptionBadge = (tier: string) => {
    const variants = {
      enterprise: 'bg-purple-100 text-purple-800 border-purple-200',
      premium: 'bg-blue-100 text-blue-800 border-blue-200',
      monthly: 'bg-green-100 text-green-800 border-green-200',
      free: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return variants[tier as keyof typeof variants] || variants.free;
  };

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-6">
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
              <Crown className="h-8 w-8 text-purple-600" />
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
              <UserPlus className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.newUsersToday}</p>
                <p className="text-xs text-muted-foreground">New Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main User Management Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              User Management Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportUsers} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={loadUsers} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Note: Creating users requires Supabase Auth admin API access. This will create a profile entry only.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-email">Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Secure password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createUser} disabled={!newUser.email || !newUser.password}>
                      Create User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscriptions</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setSubscriptionFilter('all');
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Error Alert with Instructions */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">Database Access Issue:</div>
                  <div>{error}</div>
                  {error.includes('permission denied') && (
                    <div className="mt-3 p-3 bg-red-50 rounded text-sm">
                      <div className="font-medium mb-2">To fix this, you need:</div>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Admin role in the profiles table</li>
                        <li>Proper RLS policies that allow admin users to read all profiles</li>
                        <li>The current user must have 'admin' role in their profile</li>
                      </ul>
                      <div className="mt-2 text-xs">
                        <strong>Quick fix:</strong> Update your profile role to 'admin' in the Supabase dashboard.
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' || subscriptionFilter !== 'all' 
                  ? 'Try adjusting your search filters.' 
                  : 'No users exist yet.'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <React.Fragment key={user.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(user.id)}
                            className="h-6 w-6 p-0"
                          >
                            {expandedRows.has(user.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              {user.display_name || 'No display name'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadge(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSubscriptionBadge(user.subscription_tier)}>
                            {user.subscription_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.email}? This will only delete the profile. 
                                    The auth user must be deleted separately via Supabase Auth admin.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Profile
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expandable Details Row */}
                      {expandedRows.has(user.id) && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50">
                            <div className="p-4 space-y-3">
                              <h4 className="font-semibold text-sm mb-3">User Details</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-600">Full ID:</span>
                                  <p className="font-mono text-xs mt-1 break-all">{user.id}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Email:</span>
                                  <p className="mt-1">{user.email}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Display Name:</span>
                                  <p className="mt-1">{user.display_name || 'Not set'}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Created At:</span>
                                  <p className="mt-1">{new Date(user.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Subscription Status:</span>
                                  <p className="mt-1">{user.subscription_status || 'Not set'}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Last Sign In:</span>
                                  <p className="mt-1">
                                    {user.last_sign_in_at 
                                      ? new Date(user.last_sign_in_at).toLocaleString()
                                      : 'Not available (requires auth admin API)'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.email}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-subscription">Subscription Tier</Label>
                <Select
                  value={selectedUser.subscription_tier}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, subscription_tier: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  value={selectedUser.display_name || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, display_name: e.target.value })}
                  placeholder="Enter display name"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded text-sm">
                <div><strong>ID:</strong> {selectedUser.id}</div>
                <div><strong>Email:</strong> {selectedUser.email}</div>
                <div><strong>Created:</strong> {new Date(selectedUser.created_at).toLocaleString()}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateUser} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
