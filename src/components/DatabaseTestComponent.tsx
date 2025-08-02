import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { databaseConnectionService, type ConnectionTestResult } from '@/services/databaseConnectionService';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  User,
  Shield,
  Settings
} from 'lucide-react';

export function DatabaseTestComponent() {
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

  const executeRLSPolicyFix = () => {
    toast({
      title: "RLS Policy Setup Required",
      description: "Please run the SQL commands from correct_rls_policies.sql in your Supabase SQL editor.",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Test the connection to your Supabase database and verify user profile access.
            </p>
          </div>
          <Button onClick={testConnection} disabled={testing}>
            {testing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>

        {connectionStatus && (
          <div className={`p-4 rounded-lg border ${
            connectionStatus.connected 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {connectionStatus.connected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${
                  connectionStatus.connected ? 'text-green-700' : 'text-red-700'
                }`}>
                  {connectionStatus.connected ? 'Database Connected' : 'Connection Failed'}
                </p>
                <p className={`text-sm ${
                  connectionStatus.connected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionStatus.connected 
                    ? `Found ${connectionStatus.profileCount} user profiles in database`
                    : connectionStatus.error || 'Unknown error occurred'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Sample User Profiles (First 5)</p>
            </div>
            <div className="space-y-2">
              {profiles.map((profile, index) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{profile.display_name || 'No Name'}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={profile.role === 'admin' ? 'destructive' : 'outline'}>
                      {profile.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
