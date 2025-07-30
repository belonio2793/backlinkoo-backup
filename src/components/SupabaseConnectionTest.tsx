import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const SupabaseConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runConnectionTest = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🔍 Starting Supabase connection test...');
      
      // Test 1: Basic client configuration
      const isConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Test 2: Database connection
      const { data: healthCheck, error: healthError } = await supabase
        .from('health_check')
        .select('*')
        .limit(1);

      // Test 3: Auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      const result = {
        configured: isConfigured,
        databaseConnection: !healthError,
        authService: !authError,
        healthCheckData: healthCheck,
        sessionExists: !!session,
        url: import.meta.env.VITE_SUPABASE_URL,
        keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 15) + '...',
        errors: {
          health: healthError?.message,
          auth: authError?.message
        }
      };

      console.log('🧪 Supabase test result:', result);
      setTestResult(result);

      if (!result.configured) {
        setError('Supabase credentials not configured properly');
      } else if (!result.databaseConnection && !result.authService) {
        setError('Both database and auth services failed');
      }

    } catch (error: any) {
      console.error('🧪 Supabase test failed:', error);
      setError(error.message || 'Connection test failed with unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: boolean | undefined) => {
    if (status === true) return 'text-green-600';
    if (status === false) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Supabase Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Test the Supabase database connection and verify credentials.
          </p>
          
          <Button 
            onClick={runConnectionTest}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Run Connection Test'
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Test Failed:</div>
              <div className="text-sm mt-1">{error}</div>
            </AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-sm text-gray-700 mb-2">Connection Status:</div>
              <div className="space-y-1 text-sm">
                <div className={`flex items-center gap-2 ${getStatusColor(testResult.configured)}`}>
                  {testResult.configured ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>Configuration: {testResult.configured ? 'Valid' : 'Invalid'}</span>
                </div>
                
                <div className={`flex items-center gap-2 ${getStatusColor(testResult.databaseConnection)}`}>
                  {testResult.databaseConnection ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>Database: {testResult.databaseConnection ? 'Connected' : 'Failed'}</span>
                </div>
                
                <div className={`flex items-center gap-2 ${getStatusColor(testResult.authService)}`}>
                  {testResult.authService ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>Auth Service: {testResult.authService ? 'Available' : 'Failed'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-sm text-blue-700 mb-2">Environment Details:</div>
              <div className="space-y-1 text-xs text-blue-600">
                <div>URL: {testResult.url || 'Not set'}</div>
                <div>Key: {testResult.keyPrefix || 'Not set'}</div>
                <div>Session: {testResult.sessionExists ? 'Active' : 'None'}</div>
              </div>
            </div>

            {(testResult.errors.health || testResult.errors.auth) && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="font-medium text-sm text-orange-700 mb-2">Error Details:</div>
                <div className="space-y-1 text-xs text-orange-600">
                  {testResult.errors.health && <div>Database: {testResult.errors.health}</div>}
                  {testResult.errors.auth && <div>Auth: {testResult.errors.auth}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <div>Environment Variables:</div>
          <div>• VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}</div>
          <div>• VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}</div>
        </div>
      </CardContent>
    </Card>
  );
};
