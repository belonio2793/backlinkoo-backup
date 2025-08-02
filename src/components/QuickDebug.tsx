import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bug, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { testSupabaseConnection, testSignIn } from '@/utils/supabaseTest';

export function QuickDebug() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const runQuickDiagnostic = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      console.log('🔍 Running quick diagnostic...');
      
      // Test Supabase connection
      const connectionResult = await testSupabaseConnection();
      
      // Test sign-in with a test case (will fail but show error details)
      const signInResult = await testSignIn('test@example.com', 'testpass');

      const results = {
        timestamp: new Date().toISOString(),
        connection: connectionResult,
        signInTest: signInResult,
        browserInfo: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          cookiesEnabled: navigator.cookieEnabled
        }
      };

      setTestResults(results);
      console.log('🔍 Diagnostic results:', results);

      if (connectionResult.success) {
        toast({
          title: "Connection Test Passed",
          description: "Supabase is accessible and working",
        });
      } else {
        toast({
          title: "Connection Issues Found",
          description: "Check console for detailed error information",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('🚨 Diagnostic failed:', error);
      setTestResults({
        error: true,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Diagnostic Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getBadgeColor = (success: boolean) => {
    return success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-blue-500" />
          Quick Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This tool tests your Supabase connection and authentication to help diagnose sign-in issues.
            Check the browser console for detailed error messages.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runQuickDiagnostic}
          disabled={isRunning}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Running Diagnostic..." : "Run Quick Diagnostic"}
        </Button>

        {testResults && (
          <div className="space-y-4">
            <h4 className="font-medium">Diagnostic Results:</h4>
            
            {testResults.error ? (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Diagnostic Error:</strong> {testResults.message}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {/* Connection Test Results */}
                <div className="border rounded-lg p-3">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    Connection Tests
                    <Badge className={getBadgeColor(testResults.connection?.success)}>
                      {testResults.connection?.success ? 'Passed' : 'Failed'}
                    </Badge>
                  </h5>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      {testResults.connection?.details?.authTest ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                      Auth API: {testResults.connection?.details?.authTest ? 'Working' : 'Failed'}
                    </div>
                    <div className="flex items-center gap-2">
                      {testResults.connection?.details?.databaseTest ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                      Database: {testResults.connection?.details?.databaseTest ? 'Accessible' : 'Not Accessible'}
                    </div>
                    <div className="flex items-center gap-2">
                      {testResults.connection?.details?.connectionTest ? 
                        <CheckCircle className="h-3 w-3 text-green-500" /> : 
                        <XCircle className="h-3 w-3 text-red-500" />
                      }
                      Connection: {testResults.connection?.details?.connectionTest ? 'OK' : 'Failed'}
                    </div>
                  </div>
                </div>

                {/* Sign-in Test Results */}
                <div className="border rounded-lg p-3">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    Sign-in Test
                    <Badge className={getBadgeColor(testResults.signInTest?.success)}>
                      {testResults.signInTest?.success ? 'Passed' : 'Failed (Expected)'}
                    </Badge>
                  </h5>
                  <div className="text-sm space-y-1">
                    {testResults.signInTest?.error && (
                      <div className="text-red-600">
                        Error: {testResults.signInTest.error}
                      </div>
                    )}
                    {testResults.signInTest?.exception && (
                      <div className="text-red-600">
                        Exception occurred during sign-in test
                      </div>
                    )}
                  </div>
                </div>

                {/* Browser Info */}
                <div className="border rounded-lg p-3">
                  <h5 className="font-medium mb-2">Browser Info</h5>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>URL: {testResults.browserInfo?.url}</div>
                    <div>Cookies: {testResults.browserInfo?.cookiesEnabled ? 'Enabled' : 'Disabled'}</div>
                    <div>Time: {testResults.timestamp}</div>
                  </div>
                </div>
              </div>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Next Steps:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check browser console for detailed error logs (look for 🚨 messages)</li>
                  <li>If database test fails, run the SQL fix script in Supabase</li>
                  <li>If auth test fails, check Supabase configuration</li>
                  <li>Try signing in and watch console for specific error details</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
