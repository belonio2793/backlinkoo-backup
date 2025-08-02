import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminUserService } from '@/services/adminUserService';
import { 
  Users, 
  Crown, 
  Shield, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Calendar,
  Filter,
  Download,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
}

interface UserProfile {
  user_id: string;
  full_name?: string;
  role?: string;
  company?: string;
  location?: string;
}

interface PremiumSubscription {
  user_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  plan_type: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

interface UserData extends User {
  profile?: UserProfile;
  subscription?: PremiumSubscription;
  isPremium: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'premium' | 'free' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const userData = await AdminUserService.getAllUsersWithPremiumStatus();
      setUsers(userData);

    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast({
        title: "Error",
        description: `Failed to load users: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'premium' && user.isPremium) ||
                         (filterStatus === 'free' && !user.isPremium) ||
                         (filterStatus === 'admin' && user.profile?.role === 'admin');
    
    return matchesSearch && matchesFilter;
  });

  const togglePremiumStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      if (currentStatus) {
        await AdminUserService.revokePremiumAccess(userId);
        toast({
          title: "Success",
          description: "Premium access removed"
        });
      } else {
        await AdminUserService.grantPremiumAccess(userId);
        toast({
          title: "Success",
          description: "Premium access granted"
        });
      }

      await loadUsers(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update premium status: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          role: role,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `User role updated to ${role}`
      });
      
      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update role: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const exportUsers = () => {
    const csvData = filteredUsers.map(user => ({
      email: user.email,
      name: user.profile?.full_name || '',
      role: user.profile?.role || 'user',
      premium: user.isPremium ? 'Yes' : 'No',
      created: new Date(user.created_at).toLocaleDateString(),
      lastSignIn: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'
    }));
    
    const csv = [
      ['Email', 'Name', 'Role', 'Premium', 'Created', 'Last Sign In'],
      ...csvData.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const UserStats = () => {
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const adminUsers = users.filter(u => u.profile?.role === 'admin').length;
    const activeUsers = users.filter(u => u.last_sign_in_at && 
      new Date(u.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Premium Users</p>
                <p className="text-2xl font-bold">{premiumUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{adminUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active (30d)</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage users, premium subscriptions, and roles</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportUsers} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <UserStats />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Premium Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.profile?.full_name || 'Unnamed'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={user.profile?.role === 'admin' ? 'default' : 'secondary'}>
                          {user.profile?.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={user.isPremium ? 'default' : 'secondary'}
                            className={user.isPremium ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : ''}
                          >
                            {user.isPremium ? 'Premium' : 'Free'}
                          </Badge>
                          {user.subscription && (
                            <span className="text-xs text-muted-foreground">
                              until {new Date(user.subscription.current_period_end).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">
                          {user.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePremiumStatus(user.id, user.isPremium)}
                            disabled={actionLoading === user.id}
                            className="text-xs"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : user.isPremium ? (
                              <UserX className="h-3 w-3" />
                            ) : (
                              <Crown className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRole(user.id, user.profile?.role === 'admin' ? 'user' : 'admin')}
                            disabled={actionLoading === user.id}
                            className="text-xs"
                          >
                            <Shield className="h-3 w-3" />
                          </Button>
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
    </div>
  );
}
