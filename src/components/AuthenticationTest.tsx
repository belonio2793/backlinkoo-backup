import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database,
  User,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

export function AuthenticationTest() {
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const { toast } = useToast();

  const testSupabaseConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test basic connection
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      // Test database connection
      const { data: profiles, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      const result = {
        timestamp: new Date().toISOString(),
        session: {
          success: !sessionError,
          error: sessionError?.message,
          hasSession: !!session.session
        },
        database: {
          success: !dbError,
          error: dbError?.message,
          accessible: !dbError
        }
      };

      setConnectionResult(result);
      
      if (!sessionError && !dbError) {
        toast({
          title: "Connection Test Passed",
          description: "Supabase connection and database access working",
        });
      } else {
        toast({
          title: "Connection Issues Found",
          description: "Check the test results below for details",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionResult({
        timestamp: new Date().toISOString(),
        error: error.message,
        success: false
      });
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testAuthentication = async () => {
    if (!testEmail || !testPassword) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both email and password for testing",
        variant: "destructive"
      });
      return;
    }

    setIsTestingAuth(true);
    setAuthResult(null);

    try {
      console.log('🔍 Testing authentication with:', testEmail);
      
      const result = await AuthService.signIn({
        email: testEmail,
        password: testPassword
      });

      const testResult = {
        timestamp: new Date().toISOString(),
        email: testEmail,
        success: result.success,
        error: result.error,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          emailConfirmed: !!result.user.email_confirmed_at,
          createdAt: result.user.created_at
        } : null,
        session: !!result.session
      };

      setAuthResult(testResult);

      if (result.success) {
        toast({
          title: "Authentication Test Passed!",
          description: `Successfully signed in as ${testEmail}`,
        });
        // Sign out after test to not interfere with normal usage
        await AuthService.signOut();
      } else {
        toast({
          title: "Authentication Test Failed",
          description: result.error || "Unknown authentication error",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Auth test failed:', error);
      setAuthResult({
        timestamp: new Date().toISOString(),
        email: testEmail,
        success: false,
        error: error.message,
        exception: true
      });
      toast({
        title: "Authentication Exception",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-500" />
            Authentication Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Use this tool to test and diagnose authentication issues. 
              This will help identify if the problem is with Supabase connection, database access, or authentication flow.
            </AlertDescription>
          </Alert>

          {/* Connection Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Supabase Connection Test
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={testSupabaseConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </div>

            {connectionResult && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {connectionResult.session?.success && connectionResult.database?.success ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Issues Found
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {connectionResult.timestamp}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Session API: {connectionResult.session?.success ? '✅' : '❌'} {connectionResult.session?.error && `(${connectionResult.session.error})`}</div>
                  <div>Database Access: {connectionResult.database?.success ? '✅' : '❌'} {connectionResult.database?.error && `(${connectionResult.database.error})`}</div>
                </div>
              </div>
            )}
          </div>

          {/* Authentication Test */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Authentication Test
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-password">Test Password</Label>
                <Input
                  id="test-password"
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
            </div>

            <Button
              onClick={testAuthentication}
              disabled={isTestingAuth || !testEmail || !testPassword}
              className="w-full"
            >
              {isTestingAuth ? "Testing Authentication..." : "Test Sign In"}
            </Button>

            {authResult && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {authResult.success ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {authResult.timestamp}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Email: {authResult.email}</div>
                  {authResult.success ? (
                    <div className="space-y-1">
                      <div>User ID: {authResult.user?.id}</div>
                      <div>Email Verified: {authResult.user?.emailConfirmed ? '✅' : '❌'}</div>
                      <div>Session Created: {authResult.session ? '✅' : '❌'}</div>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Error: {authResult.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How to use:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>First run the connection test to verify Supabase is accessible</li>
                <li>If connection fails, check your Supabase configuration</li>
                <li>Test authentication with a real user account</li>
                <li>Check browser console for detailed error logs</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
