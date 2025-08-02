import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export function QuickConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const runQuickTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Quick test using the realAdminUserService
      const { realAdminUserService } = await import('@/services/realAdminUserService');
      
      console.log('🧪 Running quick connection test...');
      
      // Test connection first
      const connectionTest = await realAdminUserService.testConnection();
      
      if (!connectionTest.success) {
        setResult({
          success: false,
          message: `Connection test failed: ${connectionTest.error}`,
          details: { profileCount: connectionTest.profileCount }
        });
        return;
      }

      // Try to get a small batch of users
      const userResult = await realAdminUserService.getUsers({ limit: 5, offset: 0 });
      
      setResult({
        success: true,
        message: `Successfully connected! Found ${userResult.totalCount} total users`,
        details: {
          usersRetrieved: userResult.users.length,
          totalCount: userResult.totalCount,
          hasMore: userResult.hasMore
        }
      });

    } catch (error: any) {
      console.error('❌ Quick test failed:', error);
      setResult({
        success: false,
        message: `Test failed: ${error.message}`,
        details: { errorType: error.name }
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quick Connection Test</span>
          <Button
            onClick={runQuickTest}
            disabled={testing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Test Now'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!result && !testing && (
          <p className="text-muted-foreground">
            Click "Test Now" to quickly test the admin dashboard connection.
          </p>
        )}

        {testing && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Testing connection to admin services...
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? 'text-green-700' : 'text-red-700'}>
              <div className="font-medium">{result.message}</div>
              {result.details && (
                <pre className="text-xs mt-2 font-mono">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
