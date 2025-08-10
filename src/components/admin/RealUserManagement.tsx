import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatErrorForUI } from '@/utils/errorUtils';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Edit, Trash2, Crown, Gift, RefreshCw, AlertCircle } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email?: string;
  display_name?: string;
  subscription_status?: string;
  is_premium?: boolean;
  is_trial?: boolean;
  created_at: string;
  role?: string;
}

export function RealUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('👥 Fetching users from profiles table...');
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      console.log('✅ Users fetched:', data?.length || 0);
      setUsers(data || []);
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh the users list
      await fetchUsers();
      console.log('✅ User role updated');
    } catch (err: any) {
      console.error('❌ Error updating user role:', err);
      setError(err.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh the users list
      await fetchUsers();
      console.log('✅ User deleted');
    } catch (err: any) {
      console.error('❌ Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (user: UserProfile) => {
    if (user.role === 'admin') {
      return <Badge variant="destructive"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    if (user.is_premium) {
      return <Badge variant="default"><Gift className="h-3 w-3 mr-1" />Premium</Badge>;
    }
    if (user.is_trial) {
      return <Badge variant="secondary">Trial</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Real Database User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email, name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={fetchUsers} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading && !users.length ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                          <div className="text-sm text-muted-foreground">
                            {user.email && user.display_name ? user.email : user.user_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit User: {user.email || user.display_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <strong>User ID:</strong> {user.user_id}
                                </div>
                                <div>
                                  <strong>Email:</strong> {user.email || 'Not set'}
                                </div>
                                <div>
                                  <strong>Current Role:</strong> {user.role || 'user'}
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => updateUserRole(user.user_id, 'admin')}
                                    size="sm"
                                    variant={user.role === 'admin' ? 'default' : 'outline'}
                                  >
                                    Make Admin
                                  </Button>
                                  <Button 
                                    onClick={() => updateUserRole(user.user_id, 'user')}
                                    size="sm"
                                    variant={user.role === 'user' ? 'default' : 'outline'}
                                  >
                                    Make User
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteUser(user.user_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>
  );
}
