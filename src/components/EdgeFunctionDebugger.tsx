import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Terminal,
  Database,
  CreditCard,
  Settings
} from 'lucide-react';
import { EdgeFunctionTester, type EdgeFunctionTestResult } from '@/utils/edgeFunctionTester';

export function EdgeFunctionDebugger() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<EdgeFunctionTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [deploymentInstructions, setDeploymentInstructions] = useState<string[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setDeploymentInstructions([]);

    toast({
      title: "🧪 Running Edge Function Tests",
      description: "Testing Supabase Edge Functions...",
    });

    try {
      const results = await EdgeFunctionTester.runAllTests();
      setTestResults(results);
      
      const instructions = EdgeFunctionTester.generateDeploymentInstructions(results);
      setDeploymentInstructions(instructions);

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        toast({
          title: "✅ All Tests Passed",
          description: "Edge functions are working correctly!",
        });
      } else {
        toast({
          title: `⚠️ ${successCount}/${totalCount} Tests Passed`,
          description: "Some edge functions need attention.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Test runner error:', error);
      toast({
        title: "❌ Test Runner Failed",
        description: "Failed to run edge function tests.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (result: EdgeFunctionTestResult) => {
    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (result: EdgeFunctionTestResult) => {
    if (result.success) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Success</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
    }
  };

  const getFunctionIcon = (functionName: string) => {
    switch (functionName) {
      case 'create-payment':
        return <CreditCard className="h-4 w-4" />;
      case 'create-subscription':
        return <Database className="h-4 w-4" />;
      case 'environment-test':
        return <Settings className="h-4 w-4" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Edge Function Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Running Tests...' : 'Run Edge Function Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFunctionIcon(result.function)}
                      <span className="font-medium capitalize">
                        {result.function.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result)}
                      {getStatusBadge(result)}
                    </div>
                  </div>
                  
                  {result.error && (
                    <Alert className="mb-3 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-800">
                        <strong>Error:</strong> {result.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.response && (
                    <div className="text-sm">
                      <strong>Response:</strong>
                      <pre className="bg-gray-50 p-2 rounded mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.details && (
                    <details className="text-sm mt-2">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        View Details
                      </summary>
                      <pre className="bg-gray-50 p-2 rounded mt-2 text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deployment Instructions */}
      {deploymentInstructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Deployment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              {deploymentInstructions.map((instruction, index) => (
                <div key={index} className="mb-1">
                  {instruction}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Edge Function Not Found (404)</h4>
            <p className="text-sm text-gray-600 mb-2">
              The edge functions haven't been deployed yet.
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              supabase functions deploy create-payment<br/>
              supabase functions deploy create-subscription<br/>
              supabase functions deploy verify-payment
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Configuration Error</h4>
            <p className="text-sm text-gray-600 mb-2">
              Environment variables need to be set in Supabase.
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_KEY<br/>
              supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Non-2xx Status Code</h4>
            <p className="text-sm text-gray-600 mb-2">
              This usually means the edge function is running but encountering an error.
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Check that Stripe secret key is valid (starts with sk_live_ or sk_test_)</li>
              <li>Verify Supabase service role key is correct</li>
              <li>Ensure all required environment variables are set</li>
              <li>Check Supabase logs for detailed error messages</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EdgeFunctionDebugger;
