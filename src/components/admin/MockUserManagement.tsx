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
  Search,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  Shield,
  Terminal
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MockUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  subscription_tier: 'free' | 'monthly' | 'premium' | 'enterprise';
  subscription_status: string;
  display_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: 'active' | 'inactive' | 'banned';
}

// Mock data for demonstration
const generateMockUsers = (): MockUser[] => [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'support@backlinkoo.com',
    role: 'admin',
    subscription_tier: 'enterprise',
    subscription_status: 'active',
    display_name: 'Admin User',
    created_at: '2024-01-15T10:00:00Z',
    last_sign_in_at: '2024-01-20T09:30:00Z',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'john.doe@example.com',
    role: 'premium',
    subscription_tier: 'premium',
    subscription_status: 'active',
    display_name: 'John Doe',
    created_at: '2024-01-10T14:30:00Z',
    last_sign_in_at: '2024-01-19T16:45:00Z',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'jane.smith@example.com',
    role: 'user',
    subscription_tier: 'monthly',
    subscription_status: 'active',
    display_name: 'Jane Smith',
    created_at: '2024-01-08T11:20:00Z',
    last_sign_in_at: '2024-01-18T13:15:00Z',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'mike.johnson@example.com',
    role: 'user',
    subscription_tier: 'free',
    subscription_status: 'active',
    display_name: 'Mike Johnson',
    created_at: '2024-01-05T16:45:00Z',
    last_sign_in_at: null,
    status: 'inactive'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'sarah.wilson@example.com',
    role: 'premium',
    subscription_tier: 'enterprise',
    subscription_status: 'active',
    display_name: 'Sarah Wilson',
    created_at: '2024-01-12T09:00:00Z',
    last_sign_in_at: '2024-01-20T08:20:00Z',
    status: 'active'
  }
];

export default function MockUserManagement() {
  const [users, setUsers] = useState<MockUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canAccessDatabase, setCanAccessDatabase] = useState(false);

  const { toast } = useToast();

  // Check database access
  const checkDatabaseAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Try to access profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('count(*)', { count: 'exact', head: true });

        if (!error) {
          setCanAccessDatabase(true);
          
          // If we can access the database, try to get real data
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (!profilesError && profiles && profiles.length > 0) {
            // Convert real data to our format
            const realUsers: MockUser[] = profiles.map((profile: any) => ({
              id: profile.user_id || profile.id,
              email: profile.email,
              role: profile.role || 'user',
              subscription_tier: profile.subscription_tier || 'free',
              subscription_status: profile.subscription_status || 'active',
              display_name: profile.display_name || '',
              created_at: profile.created_at,
              last_sign_in_at: null, // Not available
              status: 'active'
            }));

            setUsers(realUsers);
            setFilteredUsers(realUsers);
            
            toast({
              title: "Real Data Loaded",
              description: `Loaded ${realUsers.length} users from database`,
            });
            return;
          }
        }
      }
    } catch (error) {
      console.log('Database access check failed, using mock data');
    }

    // Fallback to mock data
    setCanAccessDatabase(false);
    const mockUsers = generateMockUsers();
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  };

  // Load initial data
  useEffect(() => {
    setLoading(true);
    checkDatabaseAccess().finally(() => setLoading(false));
  }, []);

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
    setCurrentPage(1);
  }, [users, searchTerm, roleFilter, subscriptionFilter]);

  // Update user (mock or real)
  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);

      if (canAccessDatabase) {
        // Try real database update
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
          throw new Error(`Database update failed: ${error.message}`);
        }

        toast({
          title: "User Updated",
          description: `Successfully updated ${selectedUser.email} in database`,
        });
      } else {
        // Mock update
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? selectedUser : user
        ));

        toast({
          title: "User Updated (Mock)",
          description: `Updated ${selectedUser.email} in mock data. Database access required for real updates.`,
        });
      }

      setIsEditModalOpen(false);
      setSelectedUser(null);

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete user (mock or real)
  const deleteUser = async (user: MockUser) => {
    try {
      setLoading(true);

      if (canAccessDatabase) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          throw new Error(`Database deletion failed: ${error.message}`);
        }

        toast({
          title: "User Deleted",
          description: `Successfully deleted ${user.email} from database`,
        });
      } else {
        // Mock deletion
        setUsers(prev => prev.filter(u => u.id !== user.id));

        toast({
          title: "User Deleted (Mock)",
          description: `Removed ${user.email} from mock data. Database access required for real deletions.`,
        });
      }

    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Export users
  const exportUsers = () => {
    const csv = [
      ['ID', 'Email', 'Role', 'Subscription Tier', 'Status', 'Display Name', 'Created At'],
      ...filteredUsers.map(user => [
        user.id,
        user.email,
        user.role,
        user.subscription_tier,
        user.status,
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

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      banned: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || variants.active;
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

  // Stats
  const userStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    premiumUsers: users.filter(u => ['monthly', 'premium', 'enterprise'].includes(u.subscription_tier)).length,
    newUsersToday: users.filter(u => {
      const today = new Date().toISOString().split('T')[0];
      return u.created_at.startsWith(today);
    }).length
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Database Status Alert */}
      {!canAccessDatabase && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">🚨 Database Access Required</div>
              <div>Currently showing MOCK DATA because database permissions are not set up.</div>
              <div className="mt-3 p-3 bg-red-50 rounded text-sm">
                <div className="font-medium mb-2">To access real user data, you need:</div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Supabase Project Owner/Admin access</strong> (not just a user account)</li>
                  <li><strong>Database Editor permissions</strong> in the Supabase dashboard</li>
                  <li><strong>RLS policies disabled</strong> or proper admin policies set up</li>
                </ul>
                <div className="mt-2 text-xs">
                  <strong>Quick Fix:</strong> Go to your Supabase project → Database → Tables → profiles → disable RLS
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {canAccessDatabase && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            ✅ Database access confirmed! Showing real user data from your profiles table.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">
                  Total Users {!canAccessDatabase && '(Mock)'}
                </p>
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
              User Management 
              {!canAccessDatabase && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  DEMO MODE
                </Badge>
              )}
              {canAccessDatabase && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  LIVE DATA
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportUsers} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={checkDatabaseAccess} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                          <Badge className={getStatusBadge(user.status)}>
                            {user.status}
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
                                    Are you sure you want to delete {user.email}? 
                                    {!canAccessDatabase && ' (This will only remove from mock data)'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
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
                                  <p className="mt-1">{user.subscription_status}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-600">Last Sign In:</span>
                                  <p className="mt-1">
                                    {user.last_sign_in_at 
                                      ? new Date(user.last_sign_in_at).toLocaleString()
                                      : 'Never'
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
            <DialogTitle>
              Edit User: {selectedUser?.email}
              {!canAccessDatabase && (
                <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                  MOCK ONLY
                </Badge>
              )}
            </DialogTitle>
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

              {!canAccessDatabase && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Changes will only affect mock data. Database access required for real updates.
                  </AlertDescription>
                </Alert>
              )}
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
