import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseConnectionFixer } from '@/utils/supabaseConnectionFixer';

export const SupabaseConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  // Auto-run basic connectivity test on mount
  useEffect(() => {
    runBasicConnectivityTest();
  }, []);

  const runBasicConnectivityTest = async () => {
    try {
      const config = SupabaseConnectionFixer.checkConfiguration();
      const connectivity = await SupabaseConnectionFixer.testConnectivity();
      
      setConnectionStatus({
        config,
        connectivity,
        online: navigator.onLine
      });
    } catch (error) {
      console.error('Basic connectivity test failed:', error);
    }
  };

  const runFullTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Environment Variables
      console.log('🔍 Test 1: Environment Variables...');
      const envTest = {
        name: 'Environment Variables',
        status: 'running',
        details: {}
      };

      envTest.details = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        url_format: import.meta.env.VITE_SUPABASE_URL?.startsWith('https://') ? 'Valid' : 'Invalid',
        key_format: import.meta.env.VITE_SUPABASE_ANON_KEY?.startsWith('eyJ') ? 'Valid' : 'Invalid'
      };

      envTest.status = (envTest.details.VITE_SUPABASE_URL === 'Set' && 
                       envTest.details.VITE_SUPABASE_ANON_KEY === 'Set' &&
                       envTest.details.url_format === 'Valid' &&
                       envTest.details.key_format === 'Valid') ? 'passed' : 'failed';

      results.tests.push(envTest);

      // Test 2: Network Connectivity
      console.log('🔍 Test 2: Network Connectivity...');
      const connectivityTest = {
        name: 'Network Connectivity',
        status: 'running',
        details: {}
      };

      try {
        connectivityTest.details = await SupabaseConnectionFixer.testConnectivity();
        connectivityTest.status = connectivityTest.details.supabase ? 'passed' : 'failed';
      } catch (error: any) {
        connectivityTest.status = 'failed';
        connectivityTest.error = error.message;
      }

      results.tests.push(connectivityTest);

      // Test 3: Supabase Client Connection
      console.log('🔍 Test 3: Supabase Client Connection...');
      const clientTest = {
        name: 'Supabase Client Connection',
        status: 'running',
        details: {},
        error: null
      };

      try {
        // Test a simple query
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (error) {
          clientTest.status = 'failed';
          clientTest.error = error.message;
          clientTest.details = { error_code: error.code, error_details: error.details };
        } else {
          clientTest.status = 'passed';
          clientTest.details = { query_successful: true, rows_returned: data?.length || 0 };
        }
      } catch (error: any) {
        clientTest.status = 'failed';
        clientTest.error = error.message;
        clientTest.details = { 
          is_network_error: SupabaseConnectionFixer.isSupabaseNetworkError(error),
          error_type: error.name || 'Unknown'
        };
      }

      results.tests.push(clientTest);

      // Test 4: Authentication
      console.log('🔍 Test 4: Authentication...');
      const authTest = {
        name: 'Authentication',
        status: 'running',
        details: {},
        error: null
      };

      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          // Handle auth session missing as a warning, not failure
          if (error.message?.includes('Auth session missing')) {
            authTest.status = 'warning';
            authTest.details = { status: 'No active session (not logged in)' };
          } else {
            authTest.status = 'failed';
            authTest.error = error.message;
          }
        } else {
          authTest.status = 'passed';
          authTest.details = { 
            authenticated: !!user,
            user_email: user?.email || 'No user',
            user_id: user?.id || null
          };
        }
      } catch (error: any) {
        authTest.status = 'failed';
        authTest.error = error.message;
        authTest.details = { 
          is_network_error: SupabaseConnectionFixer.isSupabaseNetworkError(error),
          error_type: error.name || 'Unknown'
        };
      }

      results.tests.push(authTest);

      // Test 5: RLS Policies
      console.log('🔍 Test 5: RLS Policies...');
      const rlsTest = {
        name: 'RLS Policies',
        status: 'running',
        details: {},
        error: null
      };

      try {
        // Test domains table access
        const { data, error } = await supabase
          .from('domains')
          .select('id')
          .limit(1);

        if (error) {
          rlsTest.status = 'failed';
          rlsTest.error = error.message;
          rlsTest.details = { table: 'domains', error_code: error.code };
        } else {
          rlsTest.status = 'passed';
          rlsTest.details = { table: 'domains', access_granted: true };
        }
      } catch (error: any) {
        rlsTest.status = 'failed';
        rlsTest.error = error.message;
      }

      results.tests.push(rlsTest);

      // Overall status
      results.overall_status = results.tests.every((test: any) => test.status === 'passed' || test.status === 'warning') ? 'passed' : 'failed';

    } catch (error: any) {
      results.overall_status = 'failed';
      results.global_error = error.message;
    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {navigator.onLine ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            Supabase Connection Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          {connectionStatus && (
            <Alert className={navigator.onLine ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>Network:</strong> {navigator.onLine ? 'Online' : 'Offline'}</div>
                  <div><strong>Config Valid:</strong> {connectionStatus.config.isValid ? 'Yes' : 'No'}</div>
                  {connectionStatus.config.issues.length > 0 && (
                    <div>
                      <strong>Issues:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {connectionStatus.config.issues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={runFullTest}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              'Run Full Diagnostic Test'
            )}
          </Button>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-4">
              <Alert className={getStatusColor(testResults.overall_status)}>
                <AlertDescription>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.overall_status)}
                    <strong>Overall Status: {testResults.overall_status.toUpperCase()}</strong>
                  </div>
                  {testResults.global_error && (
                    <div className="mt-2 text-sm">
                      <strong>Global Error:</strong> {testResults.global_error}
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {testResults.tests.map((test: any, index: number) => (
                <Card key={index} className={`border ${getStatusColor(test.status)}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      {test.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {test.error && (
                      <div className="text-sm text-red-700 mb-2">
                        <strong>Error:</strong> {test.error}
                      </div>
                    )}
                    <div className="text-xs">
                      <strong>Details:</strong>
                      <pre className="mt-1 bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="text-xs text-gray-500">
                Test completed at: {new Date(testResults.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConnectionTest;
