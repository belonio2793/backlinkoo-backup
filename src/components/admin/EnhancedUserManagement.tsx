import React, { useState } from 'react';
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
  Unlock
} from "lucide-react";
import { useUserManagement } from '@/hooks/useUserManagement';
import type { UserProfile, UserFilters } from '@/services/userManagementService';

export default function EnhancedUserManagement() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    subscription: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    limit: 20,
    offset: 0
  });

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user',
    subscription_tier: 'free',
    credits: 0
  });

  const {
    users,
    userStats,
    loading,
    pagination,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBan,
    exportUsers,
    loadUsers,
    refresh
  } = useUserManagement();

  // Update filters and reload when they change
  const handleFiltersChange = (newFilters: Partial<UserFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadUsers(updatedFilters);
  };

  const handleCreateUser = async () => {
    try {
      await createUser(newUser);
      setNewUser({ email: '', password: '', role: 'user', subscription_tier: 'free', credits: 0 });
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await updateUser(editingUser.id, {
        role: editingUser.role,
        subscription_tier: editingUser.subscription_tier,
        subscription_status: editingUser.subscription_status,
        credits: editingUser.credits
      });

      setEditingUser(null);
      setIsEditModalOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    try {
      await deleteUser(user.id, user.email);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleToggleUserBan = async (user: UserProfile) => {
    try {
      const isBanned = !!user.banned_until;
      await toggleUserBan(user.id, user.email, !isBanned);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-red-100 text-red-800',
      premium: 'bg-purple-100 text-purple-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return variants[role as keyof typeof variants] || variants.user;
  };

  const getStatusBadge = (user: User) => {
    if (user.banned_until) {
      return <Badge className="bg-red-100 text-red-800">Banned</Badge>;
    }
    if (user.email_confirmed_at) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{userStats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
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
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${userStats.totalRevenue}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
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
                <p className="text-2xl font-bold">{userStats.activeUsersToday}</p>
                <p className="text-xs text-muted-foreground">Active Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main User Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportUsers} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={refresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                  </DialogHeader>
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
                    <div>
                      <Label htmlFor="new-subscription">Subscription Tier</Label>
                      <Select
                        value={newUser.subscription_tier}
                        onValueChange={(value) => setNewUser({ ...newUser, subscription_tier: value })}
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
                      <Label htmlFor="new-credits">Credits</Label>
                      <Input
                        id="new-credits"
                        type="number"
                        value={newUser.credits}
                        onChange={(e) => setNewUser({ ...newUser, credits: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser} disabled={!newUser.email || !newUser.password}>
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
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search users by email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="min-w-[120px]">
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({ ...filters, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Select
                value={filters.subscription}
                onValueChange={(value) => setFilters({ ...filters, subscription: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setFilters({
                search: '',
                role: 'all',
                subscription: 'all',
                status: 'all',
                dateFrom: '',
                dateTo: ''
              })}
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
                    <TableHead>Role</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadge(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user)}
                      </TableCell>
                      <TableCell>{user.credits}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUser(user);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserStatus(user)}
                            className={user.banned_until ? 'text-green-600' : 'text-red-600'}
                          >
                            {user.banned_until ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.email}? This action cannot be undone.
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
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.email}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({ ...editingUser, role: value as any })}
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
                    value={editingUser.subscription_tier}
                    onValueChange={(value) => setEditingUser({ ...editingUser, subscription_tier: value as any })}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-credits">Credits</Label>
                  <Input
                    id="edit-credits"
                    type="number"
                    value={editingUser.credits}
                    onChange={(e) => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Subscription Status</Label>
                  <Select
                    value={editingUser.subscription_status}
                    onValueChange={(value) => setEditingUser({ ...editingUser, subscription_status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>User Information</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm space-y-1">
                  <div><strong>ID:</strong> {editingUser.id}</div>
                  <div><strong>Email:</strong> {editingUser.email}</div>
                  <div><strong>Created:</strong> {new Date(editingUser.created_at).toLocaleString()}</div>
                  <div><strong>Last Sign In:</strong> {editingUser.last_sign_in_at ? new Date(editingUser.last_sign_in_at).toLocaleString() : 'Never'}</div>
                  <div><strong>Email Confirmed:</strong> {editingUser.email_confirmed_at ? 'Yes' : 'No'}</div>
                  <div><strong>Status:</strong> {editingUser.banned_until ? 'Banned' : 'Active'}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateUser}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
