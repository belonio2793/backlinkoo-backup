import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  Key,
  Info,
  Settings
} from "lucide-react";
import RLSPermissionFixer from './RLSPermissionFixer';

interface TableInfo {
  name: string;
  accessible: boolean;
  rowCount?: number;
  error?: string;
}

interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
  email_confirmed_at?: string;
  role?: string;
}

export function DatabaseDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [profileUsers, setProfileUsers] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('');

  const testTables = [
    'profiles',
    'subscribers', 
    'blog_posts',
    'campaigns',
    'orders',
    'trial_posts'
  ];

  const testDatabaseConnection = async () => {
    setLoading(true);
    setTables([]);
    setAuthUsers([]);
    setProfileUsers([]);
    setConnectionStatus('Testing connection...');

    try {
      console.log('🔍 Starting comprehensive database diagnostic...');
      
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (connectionError) {
        setConnectionStatus(`Connection failed: ${connectionError.message}`);
        console.error('❌ Basic connection test failed:', connectionError);
      } else {
        setConnectionStatus('✅ Basic connection successful');
        console.log('✅ Basic database connection working');
      }

      // Test each table
      const tableResults: TableInfo[] = [];
      
      for (const tableName of testTables) {
        try {
          console.log(`🔍 Testing table: ${tableName}`);
          
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) {
            tableResults.push({
              name: tableName,
              accessible: false,
              error: error.message
            });
            console.warn(`❌ Table ${tableName} not accessible:`, error.message);
          } else {
            tableResults.push({
              name: tableName,
              accessible: true,
              rowCount: count || 0
            });
            console.log(`✅ Table ${tableName}: ${count} rows`);
          }
        } catch (err: any) {
          tableResults.push({
            name: tableName,
            accessible: false,
            error: err.message
          });
          console.error(`❌ Error testing table ${tableName}:`, err);
        }
      }

      setTables(tableResults);

      // Try to access auth.users table directly (this might not work due to RLS)
      try {
        console.log('🔍 Attempting to access auth.users table...');
        
        // This is a special query that might work if we have the right permissions
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authData && authData.users) {
          console.log(`✅ Auth users retrieved: ${authData.users.length} users`);
          setAuthUsers(authData.users.slice(0, 10)); // Show first 10
        } else if (authError) {
          console.warn('❌ Cannot access auth.users:', authError.message);
        }
      } catch (authErr: any) {
        console.warn('❌ Auth admin API not available:', authErr.message);
        
        // RPC methods not available - using profiles table as source of truth
        console.log('ℹ️ Using profiles table for user data instead of auth.users');
      }

      // Get profiles data if available
      try {
        console.log('🔍 Fetching profiles data...');
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            email,
            display_name,
            role,
            created_at,
            is_premium,
            subscription_status
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (profilesData && !profilesError) {
          console.log(`✅ Profiles retrieved: ${profilesData.length} profiles`);
          setProfileUsers(profilesData);
        } else {
          console.warn('❌ Cannot access profiles:', profilesError?.message);
        }
      } catch (profileErr: any) {
        console.error('❌ Error fetching profiles:', profileErr);
      }

    } catch (error: any) {
      console.error('❌ Diagnostic failed:', error);
      setConnectionStatus(`Diagnostic failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Diagnostic
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={testDatabaseConnection}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Run Diagnostic
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Connection Status */}
          <Alert className={connectionStatus.includes('✅') ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <Info className={`h-4 w-4 ${connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription className={connectionStatus.includes('✅') ? 'text-green-700' : 'text-red-700'}>
              <div className="font-medium">Connection Status</div>
              <div className="text-sm mt-1">{connectionStatus}</div>
            </AlertDescription>
          </Alert>

          {/* Table Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Table Accessibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <Card key={table.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{table.name}</span>
                    {table.accessible ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {table.rowCount} rows
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </div>
                  {table.error && (
                    <div className="text-xs text-red-600 mt-2">{table.error}</div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Auth Users */}
          {authUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Users (First 10)
              </h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Confirmed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">
                          {user.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.email_confirmed_at ? (
                            <Badge variant="outline" className="text-green-600">✓</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">✗</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Profile Users */}
          {profileUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profile Users (First 10)
              </h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profileUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-mono text-xs">
                          {user.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell>{user.display_name || 'No name'}</TableCell>
                        <TableCell>
                          {user.role === 'admin' ? (
                            <Badge variant="destructive">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.is_premium ? (
                            <Badge variant="default">Premium</Badge>
                          ) : (
                            <Badge variant="outline">Free</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* No Data Messages */}
          {!loading && authUsers.length === 0 && profileUsers.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">No User Data Retrieved</div>
                <div className="text-sm mt-1">
                  This could indicate RLS policies preventing access or missing data.
                  Check your Supabase configuration and RLS policies.
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* RLS Permission Fixer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            RLS Permission Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RLSPermissionFixer />
        </CardContent>
      </Card>
    </div>
  );
}
