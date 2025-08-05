import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Play, Settings, CreditCard, Crown } from 'lucide-react';
import PaymentDiagnostics, { type PaymentDiagnosticResult } from '@/utils/paymentDiagnostics';

const PaymentDiagnostic: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<{
    environment: PaymentDiagnosticResult[];
    endpoints: PaymentDiagnosticResult[];
    functionality: PaymentDiagnosticResult[];
    summary?: any;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [quickResults, setQuickResults] = useState<PaymentDiagnosticResult[]>([]);

  const diagnostics = new PaymentDiagnostics();

  useEffect(() => {
    // Run quick diagnostic on load
    runQuickDiagnostic();
  }, []);

  const runQuickDiagnostic = async () => {
    try {
      const results = await diagnostics.quickDiagnostic();
      setQuickResults(results);
    } catch (error) {
      console.error('Quick diagnostic failed:', error);
    }
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunning(true);
    try {
      const results = await diagnostics.runComprehensiveDiagnostics();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Comprehensive diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'error' | 'warning') => {
    const variants = {
      success: 'success' as any,
      error: 'destructive',
      warning: 'default'
    };

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment System Diagnostics</h1>
        <p className="text-gray-600">
          Diagnose issues with Stripe and PayPal checkout functionality.
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
          <CardTitle>Diagnostic Controls</CardTitle>
          <CardDescription>
            Run comprehensive diagnostics to identify payment system issues
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{diagnosticResults.summary.total}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{diagnosticResults.summary.success}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{diagnosticResults.summary.errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{diagnosticResults.summary.warnings}</div>
                    <div className="text-sm text-gray-600">Warnings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Environment Configuration
              </CardTitle>
              <CardDescription>
                Frontend environment variables and configuration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnosticResults.environment.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{result.test}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{result.message}</p>
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

          {/* Endpoint Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Endpoint Accessibility
              </CardTitle>
              <CardDescription>
                Payment and subscription endpoint availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnosticResults.endpoints.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{result.test}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{result.message}</p>
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

          {/* Functionality Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-green-600" />
                Payment Functionality
              </CardTitle>
              <CardDescription>
                Actual payment and subscription creation tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnosticResults.functionality.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{result.test}</h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{result.message}</p>
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
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-red-600 mb-2">🚨 Critical Issues:</h4>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li><strong>Missing VITE_STRIPE_PUBLISHABLE_KEY:</strong> Add to environment variables</li>
                <li><strong>Missing STRIPE_SECRET_KEY:</strong> Add to Netlify environment variables</li>
                <li><strong>Missing PayPal credentials:</strong> Add PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY</li>
                <li><strong>Endpoints returning 500:</strong> Check Netlify function logs for errors</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-blue-600 mb-2">🔧 Quick Fixes:</h4>
              <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                <li><strong>Test Mode:</strong> Use Stripe test keys (pk_test_... and sk_test_...)</li>
                <li><strong>CORS Issues:</strong> Ensure Netlify functions have proper CORS headers</li>
                <li><strong>Rate Limiting:</strong> Check if requests are being rate limited</li>
                <li><strong>Invalid Data:</strong> Verify email format and amount validation</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ Verification Steps:</h4>
              <ol className="list-decimal list-inside ml-4 space-y-1 text-gray-600">
                <li>Check Netlify environment variables in dashboard</li>
                <li>Verify Stripe keys are in test mode (pk_test_ and sk_test_)</li>
                <li>Test payment endpoints return JSON responses</li>
                <li>Check browser console for JavaScript errors</li>
                <li>Verify Supabase database permissions</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDiagnostic;
