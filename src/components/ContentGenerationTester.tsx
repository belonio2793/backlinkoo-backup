import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TestTube, CheckCircle, XCircle, RefreshCw, Settings } from 'lucide-react';
import { ContentGenerationDiagnostic, type ContentFunctionDiagnostic } from '@/utils/contentGenerationDiagnostic';

export function ContentGenerationTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ContentFunctionDiagnostic[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<string>('');
  const [fixAttempted, setFixAttempted] = useState(false);

  const runDiagnostic = async () => {
    setTesting(true);
    setFixAttempted(false);
    
    try {
      console.log('🚀 Running content generation diagnostic...');
      
      const testResults = await ContentGenerationDiagnostic.testAllContentFunctions();
      setResults(testResults);
      
      const report = await ContentGenerationDiagnostic.generateDiagnosticReport();
      setDiagnosticReport(report);
      
      console.log('📋 Diagnostic complete:', report);
      
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setDiagnosticReport(`Diagnostic failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const attemptFix = async () => {
    setFixAttempted(true);
    
    try {
      const fixResult = await ContentGenerationDiagnostic.fixContentGeneration();
      
      if (fixResult.success) {
        console.log('✅ Fix successful:', fixResult.message);
        // Re-run diagnostic to show updated status
        await runDiagnostic();
      } else {
        console.error('❌ Fix failed:', fixResult.message);
      }
      
    } catch (error) {
      console.error('Fix attempt failed:', error);
    }
  };

  const getStatusIcon = (result: ContentFunctionDiagnostic) => {
    if (result.available) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (result: ContentFunctionDiagnostic) => {
    if (result.available) {
      return <Badge className="bg-green-50 text-green-700 border-green-200">Working</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  const workingFunctions = results.filter(r => r.available);
  const hasWorkingFunction = workingFunctions.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Content Generation Diagnostic
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic} 
            disabled={testing}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Run Diagnostic'}
          </Button>
          
          {results.length > 0 && !hasWorkingFunction && (
            <Button 
              variant="outline" 
              onClick={attemptFix}
              disabled={testing || fixAttempted}
            >
              <Settings className="h-4 w-4 mr-2" />
              {fixAttempted ? 'Fix Attempted' : 'Attempt Fix'}
            </Button>
          )}
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <Alert className={hasWorkingFunction ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription>
              <strong>Summary:</strong> {workingFunctions.length} of {results.length} content generation functions are working.
              {!hasWorkingFunction && ' This explains the 404 errors you\'re seeing.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Individual Function Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Function Test Results:</h4>
            {results.map((result) => (
              <div key={result.function} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result)}
                  <span className="font-mono text-sm">/.netlify/functions/{result.function}</span>
                  {result.latency && (
                    <span className="text-xs text-gray-500">({result.latency}ms)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result)}
                  <span className="text-xs text-gray-500">
                    {result.status || 'No response'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Details */}
        {results.some(r => !r.available) && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-700">Error Details:</h4>
            {results.filter(r => !r.available).map((result) => (
              <div key={result.function} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                <strong>{result.function}:</strong> {result.error}
              </div>
            ))}
          </div>
        )}

        {/* Diagnostic Report */}
        {diagnosticReport && (
          <div className="space-y-2">
            <h4 className="font-medium">Detailed Report:</h4>
            <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
              {diagnosticReport}
            </pre>
          </div>
        )}

        {/* Solutions */}
        {results.length > 0 && !hasWorkingFunction && (
          <Alert>
            <AlertDescription>
              <strong>Solutions to try:</strong>
              <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                <li>Check Netlify function deployment in your Netlify dashboard</li>
                <li>Verify OPENAI_API_KEY is set in Netlify environment variables</li>
                <li>Check function logs for deployment errors</li>
                <li>Try rebuilding and redeploying your site</li>
                <li>Use the mock content generation as a temporary fallback</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {hasWorkingFunction && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Great!</strong> Found {workingFunctions.length} working content generation function(s). 
              Your automation should work properly now.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default ContentGenerationTester;
