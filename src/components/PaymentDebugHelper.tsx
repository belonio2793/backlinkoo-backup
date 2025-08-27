import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CreditPaymentService } from '@/services/creditPaymentService';
import { supabase } from '@/integrations/supabase/client';
import { Bug, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function PaymentDebugHelper() {
  const { toast } = useToast();
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const runDiagnostics = async () => {
    setIsDebugging(true);
    setDebugResults(null);

    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        hostname: window.location.hostname,
        isLocalhost: window.location.hostname === 'localhost',
        userAgent: navigator.userAgent
      },
      configuration: {},
      supabaseConnection: {},
      paymentService: {},
      errors: []
    };

    try {
      // Check environment variables
      results.configuration = {
        stripePublishableKey: {
          exists: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
          format: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_') ? 'valid' : 'invalid',
          preview: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...' || 'missing'
        },
        supabaseUrl: {
          exists: !!import.meta.env.VITE_SUPABASE_URL,
          value: import.meta.env.VITE_SUPABASE_URL || 'missing'
        },
        supabaseAnonKey: {
          exists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          preview: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...' || 'missing'
        }
      };

      // Test Supabase connection
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        results.supabaseConnection = {
          connected: !sessionError,
          hasSession: !!session?.session,
          userEmail: session?.session?.user?.email || null,
          error: sessionError?.message
        };
      } catch (supabaseError) {
        results.supabaseConnection = {
          connected: false,
          error: supabaseError instanceof Error ? supabaseError.message : String(supabaseError)
        };
        results.errors.push('Supabase connection failed');
      }

      // Test payment service
      try {
        console.log('🧪 Testing payment service...');
        const paymentResult = await CreditPaymentService.createCreditPayment(
          null,
          true,
          'debug@test.com',
          {
            amount: 70,
            credits: 50,
            productName: 'Debug Test 50 Credits'
          }
        );

        results.paymentService = {
          success: paymentResult.success,
          hasUrl: !!paymentResult.url,
          hasSessionId: !!paymentResult.sessionId,
          usedFallback: paymentResult.usedFallback,
          error: paymentResult.error,
          url: paymentResult.url
        };

        if (!paymentResult.success) {
          results.errors.push(`Payment service error: ${paymentResult.error}`);
        }
      } catch (paymentError) {
        results.paymentService = {
          success: false,
          error: paymentError instanceof Error ? paymentError.message : String(paymentError)
        };
        results.errors.push('Payment service test failed');
      }

      // Test individual endpoints
      const endpoints = [
        '/.netlify/functions/create-payment',
        '/api/create-payment',
        '/functions/create-payment'
      ];

      results.endpointTests = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: 70,
              credits: 50,
              productName: 'Debug Test',
              isGuest: true,
              guestEmail: 'debug@test.com',
              paymentMethod: 'stripe'
            })
          });

          results.endpointTests[endpoint] = {
            status: response.status,
            statusText: response.statusText,
            available: true,
            responseHeaders: Object.fromEntries(response.headers.entries())
          };

          if (response.ok) {
            try {
              const data = await response.json();
              results.endpointTests[endpoint].responseData = {
                hasUrl: !!data.url,
                hasSessionId: !!data.sessionId,
                keys: Object.keys(data)
              };
            } catch {
              results.endpointTests[endpoint].responseData = 'Invalid JSON response';
            }
          } else {
            const errorText = await response.text();
            results.endpointTests[endpoint].error = errorText;
          }
        } catch (endpointError) {
          results.endpointTests[endpoint] = {
            available: false,
            error: endpointError instanceof Error ? endpointError.message : String(endpointError)
          };
        }
      }

    } catch (error) {
      results.errors.push(`Diagnostics failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    setDebugResults(results);
    setIsDebugging(false);

    // Show summary
    const errorCount = results.errors.length;
    toast({
      title: errorCount === 0 ? "✅ Diagnostics Complete" : `⚠️ Found ${errorCount} Issues`,
      description: errorCount === 0 ? 
        "Payment system appears to be working correctly" : 
        "Check the debug results for details",
      variant: errorCount === 0 ? "default" : "destructive"
    });
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (condition: boolean, trueText = "OK", falseText = "Error") => {
    return condition ? 
      <Badge className="bg-green-100 text-green-800">{trueText}</Badge> :
      <Badge variant="destructive">{falseText}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Payment System Debug Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isDebugging}
          className="w-full"
        >
          {isDebugging ? 'Running Diagnostics...' : 'Run Payment Diagnostics'}
        </Button>

        {debugResults && (
          <div className="space-y-4">
            {/* Error Summary */}
            {debugResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Issues Found:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {debugResults.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Configuration Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Configuration Status</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Stripe Publishable Key:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugResults.configuration.stripePublishableKey.exists && 
                                 debugResults.configuration.stripePublishableKey.format === 'valid')}
                    {getStatusBadge(debugResults.configuration.stripePublishableKey.exists && 
                                  debugResults.configuration.stripePublishableKey.format === 'valid')}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase URL:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugResults.configuration.supabaseUrl.exists)}
                    {getStatusBadge(debugResults.configuration.supabaseUrl.exists)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase Connection:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugResults.supabaseConnection.connected)}
                    {getStatusBadge(debugResults.supabaseConnection.connected)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Service Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Payment Service Status</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Service Test:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugResults.paymentService.success)}
                    {getStatusBadge(debugResults.paymentService.success)}
                  </div>
                </div>
                {debugResults.paymentService.error && (
                  <div className="text-red-600 text-xs">
                    Error: {debugResults.paymentService.error}
                  </div>
                )}
                {debugResults.paymentService.usedFallback && (
                  <div className="text-yellow-600 text-xs">
                    ⚠️ Using development fallback
                  </div>
                )}
              </div>
            </div>

            {/* Endpoint Tests */}
            {debugResults.endpointTests && (
              <div className="space-y-2">
                <h4 className="font-medium">Endpoint Availability</h4>
                {Object.entries(debugResults.endpointTests).map(([endpoint, result]: [string, any]) => (
                  <div key={endpoint} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{endpoint}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.available && (result.status === 200 || result.status === 201))}
                        <Badge variant={result.available ? "secondary" : "destructive"}>
                          {result.status || 'Unavailable'}
                        </Badge>
                      </div>
                    </div>
                    {result.error && (
                      <div className="text-red-600 text-xs ml-4">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Raw Debug Data */}
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Raw Debug Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                {JSON.stringify(debugResults, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
