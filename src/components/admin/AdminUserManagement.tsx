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
  Trash2,
  Crown,
  Gift,
  CreditCard,
  Activity,
  Calendar,
  DollarSign,
  Target,
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
  XCircle
} from "lucide-react";
import {
  realAdminUserService,
  type RealUserDetails,
  type UserListFilters,
  type UserUpdatePayload
} from "@/services/realAdminUserService";

export function AdminUserManagement() {
  const [users, setUsers] = useState<RealUserDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RealUserDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    profileCount: number;
    error?: string;
  }>({ connected: false, profileCount: 0 });
  const [filters, setFilters] = useState<UserListFilters>({
    search: '',
    role: 'all',
    premiumStatus: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
    offset: 0
  });
  const { toast } = useToast();

  // Test connection on component mount
  useEffect(() => {
    testDatabaseConnection();
  }, []);

  // Load users when filters change
  useEffect(() => {
    if (connectionStatus.connected) {
      loadUsers();
    }
  }, [filters, connectionStatus.connected]);

  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');
      const result = await realAdminUserService.testConnection();
      
      setConnectionStatus({
        connected: result.success,
        profileCount: result.profileCount,
        error: result.error
      });

      if (result.success) {
        toast({
          title: "Database Connected",
          description: `Successfully connected! Found ${result.profileCount} user profiles.`,
        });
      } else {
        toast({
          title: "Database Connection Failed", 
          description: result.error || "Unable to connect to database",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus({
        connected: false,
        profileCount: 0,
        error: error.message
      });
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadUsers = async () => {
    if (!connectionStatus.connected) {
      console.warn('⚠️ Database not connected, skipping user load');
      return;
    }

    try {
      setLoading(true);
      console.log('📋 Loading real users from database with filters:', filters);

      const result = await realAdminUserService.getUsers(filters);

      if (filters.offset === 0) {
        setUsers(result.users);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }

      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);

      console.log(`✅ Loaded ${result.users.length} users from database (${result.totalCount} total)`);
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      toast({
        title: "Error Loading Users",
        description: error.message || "Failed to load user data from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const reloadAllUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Reloading all users from database...');

      // Clear current data
      setUsers([]);

      // Reset filters to load fresh data
      const freshFilters = {
        search: '',
        role: 'all' as const,
        premiumStatus: 'all' as const,
        sortBy: 'created_at' as const,
        sortOrder: 'desc' as const,
        limit: 100,
        offset: 0
      };

      setFilters(freshFilters);

      toast({
        title: "Reloading Users",
        description: "Fetching fresh data from database...",
      });

    } catch (error: any) {
      console.error('❌ Error reloading users:', error);
      toast({
        title: "Reload Failed",
        description: error.message || "Failed to reload user data",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      offset: 0
    }));
  };

  const handleFilterChange = (key: keyof UserListFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0
    }));
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    
    setFilters(prev => ({
      ...prev,
      offset: prev.offset! + prev.limit!
    }));
  };

  const handleEditUser = async (updates: UserUpdatePayload) => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      console.log('✏️ Updating user in database:', selectedUser.user_id, updates);
      
      const updatedUser = await realAdminUserService.updateUser(
        selectedUser.user_id,
        updates
      );
      
      // Update user in the list
      setUsers(prev => prev.map(user => 
        user.user_id === selectedUser.user_id ? updatedUser : user
      ));
      
      setSelectedUser(updatedUser);
      setIsEditDialogOpen(false);
      
      toast({
        title: "User Updated Successfully",
        description: `Updated ${updatedUser.display_name || updatedUser.email} in database`,
      });
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user in database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      setLoading(true);
      console.log('🗑️ Deactivating user in database:', userId);
      
      await realAdminUserService.deleteUser(userId);
      
      // Remove user from the list
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      setTotalCount(prev => prev - 1);
      
      toast({
        title: "User Deactivated",
        description: `Successfully deactivated ${userName} in database`,
      });
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      toast({
        title: "Deactivation Failed",
        description: error.message || "Failed to deactivate user in database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToPremium = async (user: RealUserDetails, isGifted: boolean = false) => {
    try {
      setLoading(true);
      console.log('🎁 Promoting user to premium in database:', user.user_id, 'isGifted:', isGifted);

      const updates: UserUpdatePayload = {
        isPremium: true,
        isGifted,
        subscriptionTier: isGifted ? 'premium_gifted' : 'premium',
        email: user.email
      };

      const updatedUser = await realAdminUserService.updateUser(
        user.user_id,
        updates
      );

      // Update user in the list
      setUsers(prev => prev.map(u =>
        u.user_id === user.user_id ? updatedUser : u
      ));

      toast({
        title: isGifted ? "Premium Gifted!" : "Premium Upgraded!",
        description: `Successfully ${isGifted ? 'gifted premium to' : 'upgraded'} ${updatedUser.display_name || updatedUser.email} in database`,
      });
    } catch (error: any) {
      console.error('❌ Error promoting user to premium:', error);
      toast({
        title: "Premium Upgrade Failed",
        description: error.message || "Failed to upgrade user to premium in database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getUserStatusBadge = (user: RealUserDetails) => {
    if (user.role === 'admin') {
      return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>;
    }
    if (user.isGifted) {
      return <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 border-purple-300"><Gift className="h-3 w-3" />Gifted</Badge>;
    }
    if (user.isPremium) {
      return <Badge variant="default" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-300"><Crown className="h-3 w-3" />Premium</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real Database User Management</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Manage user accounts with live database synchronization
            {connectionStatus.connected ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Connected ({connectionStatus.profileCount} profiles)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-4 w-4" />
                Disconnected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={testDatabaseConnection}
            disabled={loading}
          >
            <Database className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
          <Button
            onClick={reloadAllUsers}
            disabled={loading || !connectionStatus.connected}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reload Real Data
          </Button>
        </div>
      </div>

      {/* Enhanced Connection Diagnostics */}
      {!connectionStatus.connected && (
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Database Connection Issue</p>
                  <p className="text-sm text-red-600">
                    {connectionStatus.error || 'Unable to connect to database. Please check your configuration.'}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Use the enhanced diagnostics below to troubleshoot the issue.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics Cards */}
      {connectionStatus.connected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Live from database</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <Crown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.isPremium && !u.isGifted).length}
              </div>
              <p className="text-xs text-muted-foreground">Paid subscriptions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gifted Users</CardTitle>
              <Gift className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.isGifted).length}
              </div>
              <p className="text-xs text-muted-foreground">Complimentary access</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(users.reduce((sum, u) => sum + u.totalRevenue, 0))}
              </div>
              <p className="text-xs text-muted-foreground">From database records</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      {connectionStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={filters.role}
                  onValueChange={(value) => handleFilterChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Premium Status</Label>
                <Select
                  value={filters.premiumStatus}
                  onValueChange={(value) => handleFilterChange('premiumStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="gifted">Gifted</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Join Date</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="last_activity">Last Activity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {connectionStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Database Users ({totalCount})</span>
              <Button
                size="sm"
                onClick={reloadAllUsers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading users from database...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No users found in database matching your criteria
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {user.display_name || 'No Name'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {getUserStatusBadge(user)}
                            {user.campaignCount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {user.campaignCount} campaigns
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {user.lastActivity ? formatDate(user.lastActivity) : 'Never'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.totalCreditsUsed} credits used
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm font-medium">
                            {formatCurrency(user.totalRevenue)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!user.isPremium && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteToPremium(user, true)}
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <Gift className="h-4 w-4 mr-1" />
                                Gift Premium
                              </Button>
                            )}
                            
                            <Dialog
                              open={isEditDialogOpen && selectedUser?.user_id === user.user_id}
                              onOpenChange={(open) => {
                                setIsEditDialogOpen(open);
                                if (open) setSelectedUser(user);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Edit User in Database</DialogTitle>
                                </DialogHeader>
                                <UserEditForm
                                  user={selectedUser}
                                  onSave={handleEditUser}
                                  onCancel={() => setIsEditDialogOpen(false)}
                                />
                              </DialogContent>
                            </Dialog>
                            
                            {user.role !== 'admin' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate User in Database</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to deactivate {user.display_name || user.email}? 
                                      This will update their status in the database and cancel their subscription.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.user_id, user.display_name || user.email)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Deactivate
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  Load More Users
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// User Edit Form Component
interface UserEditFormProps {
  user: RealUserDetails | null;
  onSave: (updates: UserUpdatePayload) => void;
  onCancel: () => void;
}

function UserEditForm({ user, onSave, onCancel }: UserEditFormProps) {
  const [formData, setFormData] = useState<UserUpdatePayload>({});
  
  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        isGifted: user.isGifted
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={formData.display_name || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
          placeholder="Enter display name"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email address"
        />
      </div>
      
      <div className="space-y-2">
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
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="premium">Premium Access</Label>
            <div className="text-sm text-muted-foreground">
              Grant premium features access
            </div>
          </div>
          <Switch
            id="premium"
            checked={formData.isPremium || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPremium: checked }))}
          />
        </div>
        
        {formData.isPremium && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gifted">Gifted Status</Label>
              <div className="text-sm text-muted-foreground">
                Premium without payment requirement
              </div>
            </div>
            <Switch
              id="gifted"
              checked={formData.isGifted || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGifted: checked }))}
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save to Database
        </Button>
      </div>
    </form>
  );
}
