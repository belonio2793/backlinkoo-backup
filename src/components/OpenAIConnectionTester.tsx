/**
 * OpenAI Connection Tester - Debug Component
 * Tests OpenAI API connection to diagnose generation issues
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, TestTube } from 'lucide-react';
import { openAIOnlyContentGenerator } from '@/services/openAIOnlyContentGenerator';

export function OpenAIConnectionTester() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test 1: Check if configured
      const isConfigured = openAIOnlyContentGenerator.isConfigured();
      if (!isConfigured) {
        setResult({
          success: false,
          message: 'OpenAI API key not configured'
        });
        setTesting(false);
        return;
      }

      // Test 2: Test connection
      const connectionTest = await openAIOnlyContentGenerator.testConnection();
      if (!connectionTest) {
        setResult({
          success: false,
          message: 'OpenAI connection test failed'
        });
        setTesting(false);
        return;
      }

      // Test 3: Try simple generation
      const simpleTest = await openAIOnlyContentGenerator.generateContent({
        targetUrl: 'https://example.com',
        primaryKeyword: 'test',
        anchorText: 'test link',
        wordCount: 100
      });

      setResult({
        success: true,
        message: 'OpenAI connection and generation working!',
        details: {
          wordCount: simpleTest.wordCount,
          title: simpleTest.title
        }
      });

    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Unknown error occurred',
        details: error
      });
    }

    setTesting(false);
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          OpenAI Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing OpenAI Connection...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Test OpenAI Connection
            </>
          )}
        </Button>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
            <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
              <div className="font-medium">{result.message}</div>
              {result.details && (
                <pre className="mt-2 text-xs overflow-auto">
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
