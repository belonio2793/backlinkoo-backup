import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Key,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  status?: number;
  timestamp?: string;
}

export function NetlifyFunctionTester() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<{
    connection: TestResult | null;
    openaiKey: TestResult | null;
  }>({
    connection: null,
    openaiKey: null
  });
  const [testing, setTesting] = useState({
    connection: false,
    openaiKey: false
  });

  const testConnection = async () => {
    setTesting(prev => ({ ...prev, connection: true }));
    try {
      console.log('🧪 Testing Netlify function connection...');
      
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        connection: {
          success: response.ok,
          message: data.message,
          error: data.error,
          data: data,
          status: response.status,
          timestamp: new Date().toISOString()
        }
      }));

      if (response.ok) {
        toast({
          title: '✅ Connection Test Passed',
          description: 'Netlify functions are working properly'
        });
      } else {
        toast({
          title: '❌ Connection Test Failed',
          description: data.error || 'Function call failed',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setTestResults(prev => ({
        ...prev,
        connection: {
          success: false,
          error: error.message || 'Network error',
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: '❌ Connection Test Failed',
        description: error.message || 'Network error occurred',
        variant: 'destructive'
      });
    } finally {
      setTesting(prev => ({ ...prev, connection: false }));
    }
  };

  const testOpenAIKey = async () => {
    setTesting(prev => ({ ...prev, openaiKey: true }));
    try {
      console.log('🔑 Testing OpenAI key retrieval...');
      
      const response = await fetch('/api/get-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        openaiKey: {
          success: response.ok && data.success,
          message: data.success ? 'API key retrieved successfully' : data.error,
          error: data.error,
          data: data,
          status: response.status,
          timestamp: new Date().toISOString()
        }
      }));

      if (response.ok && data.success) {
        toast({
          title: '✅ OpenAI Key Test Passed',
          description: `Key retrieved: ${data.key_prefix}...`
        });
      } else {
        toast({
          title: '❌ OpenAI Key Test Failed',
          description: data.error || 'Failed to retrieve API key',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('OpenAI key test error:', error);
      setTestResults(prev => ({
        ...prev,
        openaiKey: {
          success: false,
          error: error.message || 'Network error',
          timestamp: new Date().toISOString()
        }
      }));
      
      toast({
        title: '❌ OpenAI Key Test Failed',
        description: error.message || 'Network error occurred',
        variant: 'destructive'
      });
    } finally {
      setTesting(prev => ({ ...prev, openaiKey: false }));
    }
  };

  const runAllTests = async () => {
    await testConnection();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    await testOpenAIKey();
  };

  const getResultBadge = (result: TestResult | null) => {
    if (!result) return <Badge variant="secondary">Not tested</Badge>;
    if (result.success) return <Badge variant="default" className="bg-green-600">✅ Passed</Badge>;
    return <Badge variant="destructive">❌ Failed</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Netlify Function Connectivity Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Test Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={testConnection}
            disabled={testing.connection}
            variant="outline"
            size="sm"
          >
            {testing.connection ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          
          <Button
            onClick={testOpenAIKey}
            disabled={testing.openaiKey}
            variant="outline"
            size="sm"
          >
            {testing.openaiKey ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            Test OpenAI Key
          </Button>
          
          <Button
            onClick={runAllTests}
            disabled={testing.connection || testing.openaiKey}
            size="sm"
          >
            {(testing.connection || testing.openaiKey) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Run All Tests
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {/* Connection Test Result */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Function Connection Test</h4>
              {getResultBadge(testResults.connection)}
            </div>
            
            {testResults.connection && (
              <div className="space-y-2 text-sm">
                {testResults.connection.success ? (
                  <div className="text-green-700">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    {testResults.connection.message}
                  </div>
                ) : (
                  <div className="text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {testResults.connection.error}
                  </div>
                )}
                
                {testResults.connection.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(testResults.connection.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* OpenAI Key Test Result */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">OpenAI Key Retrieval Test</h4>
              {getResultBadge(testResults.openaiKey)}
            </div>
            
            {testResults.openaiKey && (
              <div className="space-y-2 text-sm">
                {testResults.openaiKey.success ? (
                  <div className="text-green-700">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    {testResults.openaiKey.message}
                  </div>
                ) : (
                  <div className="text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {testResults.openaiKey.error}
                  </div>
                )}
                
                {testResults.openaiKey.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(testResults.openaiKey.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {(!testResults.connection?.success || !testResults.openaiKey?.success) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Troubleshooting Steps:</div>
              <ul className="text-sm mt-1 space-y-1">
                <li>• Ensure Netlify functions are deployed</li>
                <li>• Check that OPENAI_API_KEY is set in Netlify environment variables</li>
                <li>• Verify the function files exist in netlify/functions/</li>
                <li>• Check Netlify build logs for errors</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
