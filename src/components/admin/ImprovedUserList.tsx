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
import { Users, Search, Crown, Gift, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface User {
  id: string;
  user_id: string;
  email?: string;
  display_name?: string;
  is_premium?: boolean;
  role?: string;
  created_at: string;
}

interface DatabaseStatus {
  connected: boolean;
  error?: string;
  tablesAvailable?: boolean;
}

export function ImprovedUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ connected: false });
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const testDatabaseConnection = async (): Promise<DatabaseStatus> => {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Database connection failed:', error);
        return {
          connected: false,
          error: error.message,
          tablesAvailable: false
        };
      }

      console.log('✅ Database connected, profiles table accessible');
      return {
        connected: true,
        tablesAvailable: true
      };
    } catch (err: any) {
      console.error('❌ Database test error:', err);
      return {
        connected: false,
        error: err.message || 'Unknown connection error',
        tablesAvailable: false
      };
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    console.log('👥 Fetching users from Supabase...');
    
    try {
      // Test connection first
      const status = await testDatabaseConnection();
      setDbStatus(status);

      if (!status.connected) {
        throw new Error(status.error || 'Database connection failed');
      }

      // Fetch users with comprehensive data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          email,
          display_name,
          is_premium,
          role,
          created_at,
          subscription_status,
          is_trial
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} users`);
      setUsers(data || []);
      setLastFetch(new Date());

    } catch (error: any) {
      console.error('❌ Failed to fetch users:', error);
      setDbStatus({
        connected: false,
        error: error.message || 'Failed to fetch users'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management ({users.length})
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {dbStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Connection Status */}
        <div className="mb-4">
          {dbStatus.connected ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="flex items-center justify-between">
                  <span>✅ Connected to Supabase database</span>
                  {lastFetch && (
                    <span className="text-xs">
                      Last updated: {lastFetch.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <div className="font-medium">Database Connection Failed</div>
                <div className="text-sm mt-1">{dbStatus.error}</div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Search and Refresh */}
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
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Users Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
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
        </div>
      </CardContent>
    </Card>
  );
}
