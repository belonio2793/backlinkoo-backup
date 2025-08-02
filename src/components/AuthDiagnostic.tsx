import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { SecureConfig } from '@/lib/secure-config';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function AuthDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {};

    // Check environment variables
    results.envVars = {
      hasViteSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasViteSupabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      viteUrlValue: import.meta.env.VITE_SUPABASE_URL ? 
        `${import.meta.env.VITE_SUPABASE_URL.substring(0, 30)}...` : 'Not set',
      viteKeyValue: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
        `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'Not set'
    };

    // Check SecureConfig fallbacks
    results.secureConfig = {
      hasUrl: !!SecureConfig.SUPABASE_URL,
      hasAnonKey: !!SecureConfig.SUPABASE_ANON_KEY,
      urlValue: SecureConfig.SUPABASE_URL ? 
        `${SecureConfig.SUPABASE_URL.substring(0, 30)}...` : 'Not set',
      keyValue: SecureConfig.SUPABASE_ANON_KEY ? 
        `${SecureConfig.SUPABASE_ANON_KEY.substring(0, 20)}...` : 'Not set'
    };

    // Test Supabase connection
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      results.supabaseConnection = {
        success: !error,
        error: error?.message,
        canConnectToProfiles: !error
      };
    } catch (err: any) {
      results.supabaseConnection = {
        success: false,
        error: err.message,
        canConnectToProfiles: false
      };
    }

    // Test auth service
    try {
      const { data, error } = await supabase.auth.getSession();
      results.authService = {
        success: !error,
        error: error?.message,
        hasSession: !!data.session,
        sessionUser: data.session?.user?.email || 'No user'
      };
    } catch (err: any) {
      results.authService = {
        success: false,
        error: err.message,
        hasSession: false
      };
    }

    // Test user creation (check if we can query profiles table)
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      results.userCreation = {
        success: !error,
        error: error?.message,
        canQueryProfiles: !error,
        profilesExist: (data && data.length > 0)
      };
    } catch (err: any) {
      results.userCreation = {
        success: false,
        error: err.message,
        canQueryProfiles: false
      };
    }

    setDiagnostics(results);
    setLoading(false);
  };

  const testSignIn = async () => {
    try {
      setTestResult({ loading: true });
      
      // Try to sign in with test credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });

      setTestResult({
        loading: false,
        success: !error,
        error: error?.message,
        userData: data.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: !!data.user.email_confirmed_at
        } : null
      });
    } catch (err: any) {
      setTestResult({
        loading: false,
        success: false,
        error: err.message
      });
    }
  };

  const StatusIcon = ({ success }: { success: boolean }) => (
    success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  );

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Authentication Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running...' : 'Refresh Diagnostics'}
          </Button>

          {!loading && (
            <div className="space-y-4">
              {/* Environment Variables */}
              <div>
                <h3 className="font-semibold mb-2">Environment Variables</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>VITE_SUPABASE_URL</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={diagnostics.envVars?.hasViteSupabaseUrl} />
                      <Badge variant={diagnostics.envVars?.hasViteSupabaseUrl ? "default" : "destructive"}>
                        {diagnostics.envVars?.viteUrlValue}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VITE_SUPABASE_ANON_KEY</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={diagnostics.envVars?.hasViteSupabaseAnonKey} />
                      <Badge variant={diagnostics.envVars?.hasViteSupabaseAnonKey ? "default" : "destructive"}>
                        {diagnostics.envVars?.viteKeyValue}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* SecureConfig Fallbacks */}
              <div>
                <h3 className="font-semibold mb-2">SecureConfig Fallbacks</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>SecureConfig URL</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={diagnostics.secureConfig?.hasUrl} />
                      <Badge variant={diagnostics.secureConfig?.hasUrl ? "default" : "destructive"}>
                        {diagnostics.secureConfig?.urlValue}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SecureConfig Key</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={diagnostics.secureConfig?.hasAnonKey} />
                      <Badge variant={diagnostics.secureConfig?.hasAnonKey ? "default" : "destructive"}>
                        {diagnostics.secureConfig?.keyValue}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supabase Connection */}
              <div>
                <h3 className="font-semibold mb-2">Supabase Connection</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Database Connection</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={diagnostics.supabaseConnection?.success} />
                      <Badge variant={diagnostics.supabaseConnection?.success ? "default" : "destructive"}>
                        {diagnostics.supabaseConnection?.success ? "Connected" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                  {diagnostics.supabaseConnection?.error && (
                    <Alert>
                      <AlertDescription>
                        Error: {diagnostics.supabaseConnection.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Auth Service */}
              <div>
                <h3 className="font-semibold mb-2">Auth Service</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Auth Service</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={diagnostics.authService?.success} />
                      <Badge variant={diagnostics.authService?.success ? "default" : "destructive"}>
                        {diagnostics.authService?.success ? "Working" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Current Session</span>
                    <Badge variant={diagnostics.authService?.hasSession ? "default" : "outline"}>
                      {diagnostics.authService?.hasSession ? diagnostics.authService.sessionUser : "No session"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User Creation Test */}
              <div>
                <h3 className="font-semibold mb-2">User Creation</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Profiles Table Access</span>
                    <div className="flex items-center gap-2">
                      <StatusIcon success={diagnostics.userCreation?.success} />
                      <Badge variant={diagnostics.userCreation?.success ? "default" : "destructive"}>
                        {diagnostics.userCreation?.success ? "Accessible" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                  {diagnostics.userCreation?.error && (
                    <Alert>
                      <AlertDescription>
                        Error: {diagnostics.userCreation.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Test Sign In */}
              <div>
                <h3 className="font-semibold mb-2">Test Authentication</h3>
                <Button onClick={testSignIn} disabled={testResult?.loading}>
                  {testResult?.loading ? 'Testing...' : 'Test Sign In'}
                </Button>
                {testResult && !testResult.loading && (
                  <Alert className="mt-2">
                    <AlertDescription>
                      {testResult.success ? (
                        <div className="text-green-600">
                          ✅ Sign in test successful: {JSON.stringify(testResult.userData)}
                        </div>
                      ) : (
                        <div className="text-red-600">
                          ❌ Sign in test failed: {testResult.error}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
