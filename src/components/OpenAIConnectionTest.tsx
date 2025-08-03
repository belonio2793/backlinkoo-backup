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
      // Test via secure Netlify function
      console.log('🧪 Testing OpenAI connection via Netlify function...');
      const response = await fetch('/.netlify/functions/check-ai-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'OpenAI'
        })
      });

      // Handle 404 specifically
      if (response.status === 404) {
        setTestResult({
          status: 'error',
          message: 'Netlify function not found',
          details: {
            deployment: 'Function may not be deployed in this environment',
            status: 404,
            error: 'check-ai-provider function not available'
          }
        });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenAI connection test successful via Netlify function!');
        if (data.success) {
          setTestResult({
            status: 'success',
            message: 'OpenAI connection successful via secure Netlify function!',
            details: {
              method: 'Server-side Netlify function',
              provider: 'OpenAI',
              secure: true
            }
          });
        } else {
          setTestResult({
            status: 'error',
            message: 'OpenAI connection failed on server',
            details: {
              error: data.error || 'Server-side configuration issue'
            }
          });
        }
      } else {
        console.error('❌ Netlify function failed:', response.status);

        // Try to get error details from response
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        setTestResult({
          status: 'error',
          message: `Netlify function error: ${response.status}`,
          details: {
            deployment: 'Check Netlify function deployment',
            status: response.status,
            error: errorMessage
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
