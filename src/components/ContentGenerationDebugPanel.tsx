import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bug, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function ContentGenerationDebugPanel() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testContentGeneration = async () => {
    setTesting(true);
    setTestResults([]);

    const functions = [
      'content-generator-fixed',
      'generate-content', 
      'ai-content-generator',
      'generate-openai',
      'simple-ai-generator'
    ];

    const results = [];

    for (const func of functions) {
      try {
        console.log(`Testing /.netlify/functions/${func}`);
        
        const startTime = Date.now();
        const response = await fetch(`/.netlify/functions/${func}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: 'go high level',
            anchor_text: 'test link',
            target_url: 'https://example.com',
            word_count: 300,
            tone: 'professional'
          }),
        });

        const latency = Date.now() - startTime;
        
        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = { error: 'Invalid JSON response' };
        }

        results.push({
          function: func,
          status: response.status,
          success: response.ok && responseData.success,
          latency,
          response: responseData,
          error: !response.ok ? `HTTP ${response.status}` : (!responseData.success ? responseData.error : null)
        });

      } catch (error) {
        results.push({
          function: func,
          status: 0,
          success: false,
          latency: 0,
          error: error instanceof Error ? error.message : 'Network error'
        });
      }
    }

    setTestResults(results);
    setTesting(false);
  };

  const getStatusIcon = (result: any) => {
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (result.status === 404) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  };

  const getStatusBadge = (result: any) => {
    if (result.success) return <Badge className="bg-green-50 text-green-700 border-green-200">Working</Badge>;
    if (result.status === 404) return <Badge variant="destructive">404 Not Found</Badge>;
    return <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">Error {result.status}</Badge>;
  };

  const workingFunctions = testResults.filter(r => r.success);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Content Generation Debug Panel
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button 
          onClick={testContentGeneration} 
          disabled={testing}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {testing ? 'Testing All Functions...' : 'Run Debug Test'}
        </Button>

        {testResults.length > 0 && (
          <>
            <Alert className={workingFunctions.length > 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>
                <strong>Debug Results:</strong> {workingFunctions.length} of {testResults.length} functions are working.
                {workingFunctions.length === 0 && ' This is why you\'re seeing 404 errors.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={result.function} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result)}
                      <code className="text-sm">{result.function}</code>
                      {result.latency > 0 && (
                        <span className="text-xs text-gray-500">({result.latency}ms)</span>
                      )}
                    </div>
                    {getStatusBadge(result)}
                  </div>
                  
                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.success && result.response?.data && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      <strong>Success:</strong> Generated {result.response.data.word_count} words
                    </div>
                  )}
                </div>
              ))}
            </div>

            {workingFunctions.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Solution Found:</strong> Use "{workingFunctions[0].function}" for content generation. 
                  The automation system will automatically switch to working functions.
                </AlertDescription>
              </Alert>
            )}

            {workingFunctions.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fix Required:</strong>
                  <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                    <li>Deploy the netlify functions to your Netlify site</li>
                    <li>Set OPENAI_API_KEY in Netlify environment variables</li>
                    <li>Check Netlify function logs for errors</li>
                    <li>Rebuild and redeploy your site</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ContentGenerationDebugPanel;
