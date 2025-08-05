import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Play, Settings, Cloud } from 'lucide-react';
import EdgeFunctionDebugger, { type EdgeFunctionDebugResult } from '@/utils/edgeFunctionDebugger';

const EdgeFunctionDiagnostic: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<{
    results: EdgeFunctionDebugResult[];
    summary?: any;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [quickResults, setQuickResults] = useState<EdgeFunctionDebugResult[]>([]);

  useEffect(() => {
    // Run quick diagnostic on load
    runQuickDiagnostic();
  }, []);

  const runQuickDiagnostic = async () => {
    try {
      const results = await EdgeFunctionDebugger.quickDiagnostic();
      setQuickResults(results);
    } catch (error) {
      console.error('Quick diagnostic failed:', error);
    }
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunning(true);
    try {
      const results = await EdgeFunctionDebugger.runComprehensiveDiagnostics();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Comprehensive diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? 'success' as any : 'destructive'}>
        {success ? 'Passed' : 'Failed'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Edge Function Diagnostics</h1>
        <p className="text-gray-600">
          Debug Supabase Edge Function issues and subscription creation errors.
        </p>
      </div>

      {/* Quick Issues Alert */}
      {quickResults.length > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <strong className="text-red-800">Critical Issues Detected:</strong>
            <ul className="mt-2 space-y-1">
              {quickResults.map((result, index) => (
                <li key={index} className="text-red-700">
                  • {result.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            Edge Function Diagnostics
          </CardTitle>
          <CardDescription>
            Test Supabase Edge Functions and identify subscription creation issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runComprehensiveDiagnostic} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Settings className="h-4 w-4 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Full Diagnostic
                </>
              )}
            </Button>
            
            <Button 
              onClick={runQuickDiagnostic} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Quick Check
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {diagnosticResults && (
        <div className="space-y-6">
          {/* Summary */}
          {diagnosticResults.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Diagnostic Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{diagnosticResults.summary.total}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{diagnosticResults.summary.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{diagnosticResults.summary.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {diagnosticResults.summary.criticalIssues.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-red-600 mb-2">Critical Issues:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {diagnosticResults.summary.criticalIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Detailed results from Edge Function testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {diagnosticResults.results.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                    {getStatusIcon(result.success)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{result.test}</h4>
                        {getStatusBadge(result.success)}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Show details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Common Issues and Solutions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Common Edge Function Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-red-600 mb-2">🚨 Critical Issues:</h4>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li><strong>Missing Environment Variables:</strong> Check Supabase dashboard for STRIPE_SECRET_KEY</li>
                <li><strong>Authentication Errors:</strong> Ensure user is signed in before creating subscriptions</li>
                <li><strong>Edge Function Not Deployed:</strong> Deploy functions using Supabase CLI</li>
                <li><strong>Invalid Price ID:</strong> Verify Stripe price IDs are correct</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-600 mb-2">🔧 Quick Fixes:</h4>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li><strong>Redeploy Functions:</strong> Run `supabase functions deploy create-subscription`</li>
                <li><strong>Check Logs:</strong> Use `supabase functions logs` to see detailed errors</li>
                <li><strong>Test Mode:</strong> Use Stripe test price IDs (price_test_...)</li>
                <li><strong>CORS Issues:</strong> Ensure CORS headers are properly set</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ Environment Setup:</h4>
              <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-600">
                <li>Configure Supabase environment variables in dashboard</li>
                <li>Set STRIPE_SECRET_KEY (sk_test_... for testing)</li>
                <li>Set SUPABASE_SERVICE_ROLE_KEY</li>
                <li>Deploy Edge Functions</li>
                <li>Test with authenticated user</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionDiagnostic;
