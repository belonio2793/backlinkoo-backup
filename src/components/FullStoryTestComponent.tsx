import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, XCircle, Shield } from 'lucide-react';
import { isFullStoryPresent, safeFetch, isFullStoryError } from '../utils/fullstoryWorkaround';
import { safeNetlifyFetch } from '../utils/netlifyFunctionHelper';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

const FullStoryTestComponent: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [fullStoryDetected, setFullStoryDetected] = useState<boolean>(false);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    // Check if FullStory is present
    const isFullStory = isFullStoryPresent();
    setFullStoryDetected(isFullStory);
    
    const testResults: TestResult[] = [];

    // Test 1: FullStory Detection
    testResults.push({
      test: 'FullStory Detection',
      success: true,
      message: isFullStory ? 'FullStory detected' : 'FullStory not detected',
      details: {
        hasFS: !!(window as any).FS,
        hasScript: !!document.querySelector('script[src*="fullstory"]'),
        fetchModified: window.fetch.toString().includes('fullstory') || window.fetch.toString().includes('FS')
      }
    });

    // Test 2: Safe Fetch Test
    try {
      const response = await safeFetch('/.netlify/functions/api-status');
      const data = await response.text();
      
      testResults.push({
        test: 'Safe Fetch Test',
        success: true,
        message: 'Safe fetch completed successfully',
        details: {
          status: response.status,
          contentType: response.headers.get('content-type'),
          responseSize: data.length
        }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Safe Fetch Test',
        success: !isFullStoryError(error),
        message: isFullStoryError(error) ? 
          'FullStory interference handled gracefully' : 
          `Fetch failed: ${error.message}`,
        details: {
          error: error.message,
          isFullStoryError: isFullStoryError(error)
        }
      });
    }

    // Test 3: Netlify Function Test
    try {
      const result = await safeNetlifyFetch('api-status');
      
      testResults.push({
        test: 'Netlify Function Test',
        success: result.success,
        message: result.success ? 
          'Netlify function call succeeded' : 
          `Netlify function failed: ${result.error}`,
        details: {
          ...result,
          isLocal: result.isLocal
        }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Netlify Function Test',
        success: false,
        message: `Netlify function test failed: ${error.message}`,
        details: {
          error: error.message,
          isFullStoryError: isFullStoryError(error)
        }
      });
    }

    // Test 4: Direct Window Fetch Test
    try {
      const response = await window.fetch('/.netlify/functions/api-status');
      const data = await response.text();
      
      testResults.push({
        test: 'Direct Window Fetch',
        success: true,
        message: 'Direct window.fetch succeeded',
        details: {
          status: response.status,
          contentType: response.headers.get('content-type'),
          responseSize: data.length
        }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Direct Window Fetch',
        success: false,
        message: `Direct fetch failed: ${error.message}`,
        details: {
          error: error.message,
          isFullStoryError: isFullStoryError(error),
          stack: error.stack?.includes('fullstory') || error.stack?.includes('fs.js')
        }
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge variant="default" className="bg-green-500">Pass</Badge> : 
      <Badge variant="destructive">Fail</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          FullStory Interference Test
        </CardTitle>
        <CardDescription>
          Test the FullStory workaround implementation and network request handling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            {testing ? 'Running Tests...' : 'Run FullStory Tests'}
          </Button>
          
          {fullStoryDetected && (
            <Alert className="flex-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                FullStory detected - workaround methods will be used automatically
              </AlertDescription>
            </Alert>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.success)}
                    <span className="font-medium text-sm">{result.test}</span>
                  </div>
                  {getStatusBadge(result.success)}
                </div>
                
                <p className="text-sm text-muted-foreground">{result.message}</p>
                
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What this tests:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>FullStory detection mechanism</li>
              <li>Safe fetch wrapper functionality</li>
              <li>Netlify function call handling</li>
              <li>Comparison with direct fetch calls</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default FullStoryTestComponent;
