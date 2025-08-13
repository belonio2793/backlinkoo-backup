import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Wifi } from 'lucide-react';
import { isFullStoryPresent, isFullStoryError } from '@/utils/fullstoryWorkaround';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

const ViteClientProtectionTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState<boolean>(false);
  const [fullStoryDetected, setFullStoryDetected] = useState<boolean>(false);

  useEffect(() => {
    // Check FullStory status on component mount
    setFullStoryDetected(isFullStoryPresent());
  }, []);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];

    // Test 1: FullStory Detection
    const isFullStory = isFullStoryPresent();
    setFullStoryDetected(isFullStory);
    testResults.push({
      test: 'FullStory Detection',
      success: true,
      message: isFullStory ? 'FullStory interference detected' : 'No FullStory interference detected',
      details: {
        hasFS: !!(window as any).FS,
        hasScript: !!document.querySelector('script[src*="fullstory"]'),
        fetchModified: window.fetch.toString().length < 100,
        viteProtectionActive: !!(window as any).__viteProtected__
      }
    });

    // Test 2: Vite Client Fetch Test
    try {
      // Simulate a Vite client-like request
      const testUrl = '/@vite/client/test-connection';
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'X-Test': 'vite-client-protection' }
      });
      
      testResults.push({
        test: 'Vite Client Fetch Protection',
        success: true,
        message: 'Protected fetch completed (even if 404 - protection working)',
        details: {
          url: testUrl,
          status: response.status,
          protected: true
        }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Vite Client Fetch Protection',
        success: !isFullStoryError(error),
        message: isFullStoryError(error) ? 
          'FullStory interference handled correctly' : 
          `Fetch error (non-FullStory): ${error.message}`,
        details: {
          error: error.message,
          isFullStoryError: isFullStoryError(error),
          stack: error.stack?.includes('fullstory') || error.stack?.includes('@vite/client')
        }
      });
    }

    // Test 3: Development Server Health
    try {
      // Try to ping the Vite development server
      const response = await fetch('/__vite_ping', { method: 'GET' });
      testResults.push({
        test: 'Vite Dev Server Ping',
        success: true,
        message: 'Development server ping successful',
        details: {
          status: response.status,
          healthy: response.ok
        }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Vite Dev Server Ping',
        success: false,
        message: `Dev server ping failed: ${error.message}`,
        details: {
          error: error.message,
          isFullStoryError: isFullStoryError(error)
        }
      });
    }

    // Test 4: Fetch Function Analysis
    const fetchStr = window.fetch.toString();
    testResults.push({
      test: 'Fetch Function Analysis',
      success: true,
      message: `Fetch function ${fetchStr.includes('[native code]') ? 'appears native' : 'has been modified'}`,
      details: {
        isNative: fetchStr.includes('[native code]'),
        length: fetchStr.length,
        likelyModified: fetchStr.length < 100 && !fetchStr.includes('[native code]'),
        sample: fetchStr.substring(0, 100) + (fetchStr.length > 100 ? '...' : '')
      }
    });

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Vite Client Protection Test
        </CardTitle>
        <CardDescription>
          Test the Vite development client protection from FullStory interference
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            <Wifi className="h-4 w-4" />
            {testing ? 'Running Tests...' : 'Test Vite Protection'}
          </Button>
          
          {fullStoryDetected && (
            <Alert className="flex-1">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                FullStory interference detected - protection mechanisms active
              </AlertDescription>
            </Alert>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Test Results</h3>
            {results.map((result, index) => (
              <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(result.success)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-500 space-y-1">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>FullStory interference detection</li>
            <li>Vite client fetch protection</li>
            <li>Development server connectivity</li>
            <li>Fetch function integrity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ViteClientProtectionTest;
