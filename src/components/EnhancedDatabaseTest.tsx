import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { databaseConnectionService, type ConnectionTestResult } from '@/services/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Users, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Info,
  Shield,
  Key,
  User,
  Settings
} from 'lucide-react';

export function EnhancedDatabaseTest() {
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<ConnectionTestResult | null>(null);
  const [adminCheck, setAdminCheck] = useState<{
    isAdmin: boolean;
    method?: string;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  // Auto-test on component mount
  useEffect(() => {
    runConnectionTest();
  }, []);

  const runConnectionTest = async () => {
    try {
      setTesting(true);
      console.log('🔍 Running enhanced database connection test...');
      
      // Test database connection
      const result = await databaseConnectionService.testConnection();
      setConnectionResult(result);
      
      // Test admin access
      const adminResult = await databaseConnectionService.checkAdminAccess();
      setAdminCheck(adminResult);
      
      if (result.success) {
        toast({
          title: "Database Connected!",
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
      console.error('❌ Connection test failed:', error);
      const errorResult: ConnectionTestResult = {
        success: false,
        profileCount: 0,
        error: error.message
      };
      setConnectionResult(errorResult);
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const executeRLSPolicyFix = async () => {
    toast({
      title: "RLS Policy Setup",
      description: "Please run the SQL commands provided in the correct_rls_policies.sql file in your Supabase SQL editor.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Enhanced Database Connection Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Comprehensive test of your Supabase database connection and admin access.
              </p>
            </div>
            <Button onClick={runConnectionTest} disabled={testing}>
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>

          {connectionResult && (
            <div className="space-y-4">
              {/* Connection Status */}
              <div className={`p-4 rounded-lg border ${
                connectionResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      connectionResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {connectionResult.success ? 'Database Connected' : 'Connection Failed'}
                    </p>
                    <p className={`text-sm ${
                      connectionResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {connectionResult.success 
                        ? `Found ${connectionResult.profileCount} user profiles in database`
                        : connectionResult.error || 'Unknown error occurred'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {connectionResult.userInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User Authentication
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={connectionResult.userInfo.authenticated ? "default" : "destructive"}>
                          {connectionResult.userInfo.authenticated ? "Authenticated" : "Not Authenticated"}
                        </Badge>
                      </div>
                      {connectionResult.userInfo.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <span className="text-sm font-mono">{connectionResult.userInfo.email}</span>
                        </div>
                      )}
                      {connectionResult.userInfo.role && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Role:</span>
                          <Badge variant={connectionResult.userInfo.role === 'admin' ? "destructive" : "outline"}>
                            {connectionResult.userInfo.role}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {adminCheck && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Admin:</span>
                            <Badge variant={adminCheck.isAdmin ? "destructive" : "outline"}>
                              {adminCheck.isAdmin ? "Yes" : "No"}
                            </Badge>
                          </div>
                          {adminCheck.method && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Method:</span>
                              <span className="text-sm font-mono">{adminCheck.method}</span>
                            </div>
                          )}
                          {adminCheck.error && (
                            <div className="text-sm text-red-600">
                              Error: {adminCheck.error}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Technical Details */}
              {connectionResult.details && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Technical Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {connectionResult.details.supabaseUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Supabase URL:</span>
                        <span className="text-sm font-mono">{connectionResult.details.supabaseUrl}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Anon Key:</span>
                      <Badge variant={connectionResult.details.hasAnonKey ? "default" : "destructive"}>
                        {connectionResult.details.hasAnonKey ? "Present" : "Missing"}
                      </Badge>
                    </div>
                    {connectionResult.details.tableAccess && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Table Access:</span>
                        <span className="text-sm font-mono">{connectionResult.details.tableAccess}</span>
                      </div>
                    )}
                    {connectionResult.details.rlsPolicies && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">RLS Policies:</span>
                        <span className="text-sm font-mono">{connectionResult.details.rlsPolicies}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Error Resolution */}
              {!connectionResult.success && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Troubleshooting Steps:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {!connectionResult.userInfo?.authenticated && (
                          <li>Make sure you're signed in as an admin user</li>
                        )}
                        {connectionResult.userInfo?.role !== 'admin' && (
                          <li>Your account needs admin role privileges</li>
                        )}
                        {connectionResult.details?.rlsPolicies === 'Check RLS policies' && (
                          <li>
                            Run the RLS policies from correct_rls_policies.sql
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="ml-2"
                              onClick={executeRLSPolicyFix}
                            >
                              View SQL Fix
                            </Button>
                          </li>
                        )}
                        {!connectionResult.details?.hasAnonKey && (
                          <li>Check your Supabase environment variables</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Actions */}
              {connectionResult.success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium text-green-700">
                      ✅ Database connection successful! Your admin user management should now work properly.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
