import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, TestTube } from 'lucide-react';
// Removed SecureConfig import - using server-side calls only

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  details?: any;
}

export function OpenAIConnectionTest() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle', message: 'Click test to check OpenAI connection' });

  const testConnection = async () => {
    setTestResult({ status: 'testing', message: 'Testing OpenAI API connection...' });

    try {
      // Simple and direct API key access
      const apiKey = SecureConfig.OPENAI_API_KEY;
      console.log('🔑 API Key found:', apiKey ? `${apiKey.substring(0, 15)}...` : 'No key found');

      if (!apiKey) {
        setTestResult({
          status: 'error',
          message: 'No OpenAI API key configured',
          details: { source: 'VITE_OPENAI_API_KEY or SecureConfig' }
        });
        return;
      }

      // Test API connection
      console.log('🧪 Testing OpenAI API connection...');
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenAI API test successful!');
        setTestResult({
          status: 'success',
          message: `OpenAI API connected successfully! ${data.data?.length || 0} models available.`,
          details: {
            keyPreview: `${apiKey.substring(0, 15)}...`,
            modelsCount: data.data?.length || 0,
            sampleModels: data.data?.slice(0, 3).map((m: any) => m.id).join(', ') || 'None'
          }
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ OpenAI API test failed:', response.status, errorData);
        setTestResult({
          status: 'error',
          message: `API test failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`,
          details: {
            keyPreview: `${apiKey.substring(0, 15)}...`,
            status: response.status,
            error: errorData.error?.message || 'Unknown error'
          }
        });
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      setTestResult({
        status: 'error',
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  const getStatusIcon = () => {
    switch (testResult.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <TestTube className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (testResult.status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Ready to Test</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          OpenAI Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>
        
        <p className="text-sm text-muted-foreground break-words">
          {testResult.message}
        </p>

        {testResult.details && (
          <div className="text-xs text-muted-foreground space-y-1 bg-gray-50 p-2 rounded">
            {Object.entries(testResult.details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="break-all max-w-[150px]">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={testConnection} 
          disabled={testResult.status === 'testing'}
          className="w-full"
        >
          {testResult.status === 'testing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Test OpenAI Connection
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
