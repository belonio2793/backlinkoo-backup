import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditPaymentService } from '@/services/creditPaymentService';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { Bug, AlertTriangle, CheckCircle } from 'lucide-react';

export function ErrorDebugger() {
  const { toast } = useToast();
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

  const runErrorDebug = async () => {
    setIsDebugging(true);
    setDebugResults({
      timestamp: new Date().toISOString(),
      environment: {},
      creditService: {},
      universalService: {},
      errors: []
    });

    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        hostname: window.location.hostname,
        userAgent: navigator.userAgent,
        stripeKey: {
          exists: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
          format: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...' || 'missing',
          isTest: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_'),
          isLive: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_'),
          isValid: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_')
        }
      },
      creditService: {},
      universalService: {},
      errors: []
    };

    // Test CreditPaymentService
    try {
      console.log('🧪 Testing CreditPaymentService...');
      const creditResult = await CreditPaymentService.createCreditPayment(
        null,
        true,
        'debug@test.com',
        {
          amount: 70,
          credits: 50,
          productName: 'Debug Test 50 Credits'
        }
      );

      results.creditService = {
        success: creditResult.success,
        hasUrl: !!creditResult.url,
        hasSessionId: !!creditResult.sessionId,
        usedFallback: creditResult.usedFallback,
        error: creditResult.error,
        errorType: typeof creditResult.error
      };

      if (!creditResult.success) {
        results.errors.push(`CreditPaymentService: ${creditResult.error}`);
      }
    } catch (error) {
      console.error('❌ CreditPaymentService test failed:', error);
      results.creditService = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      };
      results.errors.push(`CreditPaymentService exception: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Test UniversalStripeCheckout
    try {
      console.log('🧪 Testing UniversalStripeCheckout...');
      const universalResult = await stripeCheckout.purchaseCredits({
        credits: 50,
        amount: 70,
        productName: 'Debug Test 50 Credits',
        isGuest: true,
        guestEmail: 'debug@test.com'
      });

      results.universalService = {
        success: universalResult.success,
        hasUrl: !!universalResult.url,
        hasSessionId: !!universalResult.sessionId,
        error: universalResult.error,
        errorType: typeof universalResult.error
      };

      if (!universalResult.success) {
        results.errors.push(`UniversalStripeCheckout: ${universalResult.error}`);
      }
    } catch (error) {
      console.error('❌ UniversalStripeCheckout test failed:', error);
      results.universalService = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      };
      results.errors.push(`UniversalStripeCheckout exception: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('🔍 Debug results:', results);
    setDebugResults(results);
    setIsDebugging(false);

    // Show summary
    toast({
      title: results.errors.length === 0 ? "✅ No Critical Errors" : `⚠️ Found ${results.errors.length} Issues`,
      description: results.errors.length === 0 ? 
        "Error handling appears to be working correctly" : 
        "Check debug results for error details",
      variant: results.errors.length === 0 ? "default" : "destructive"
    });
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (condition: boolean) => {
    return condition ? 
      <Badge className="bg-green-100 text-green-800">Working</Badge> :
      <Badge variant="destructive">Error</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Error Debugging Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runErrorDebug}
          disabled={isDebugging}
          className="w-full"
        >
          {isDebugging ? 'Running Error Debug...' : 'Debug Error Handling'}
        </Button>

        {debugResults && (
          <div className="space-y-4">
            {/* Environment Check */}
            <div className="space-y-2">
              <h4 className="font-medium">Environment</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Hostname:</span>
                  <code className="text-xs">{debugResults.environment.hostname}</code>
                </div>
                <div className="flex justify-between">
                  <span>Stripe Key Valid:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugResults.environment.stripeKey.isValid)}
                    {getStatusBadge(debugResults.environment.stripeKey.isValid)}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Key Type:</span>
                  <Badge variant="secondary">
                    {debugResults.environment.stripeKey.isTest ? 'Test' : 
                     debugResults.environment.stripeKey.isLive ? 'Live' : 'Invalid'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Service Results */}
            <div className="space-y-2">
              <h4 className="font-medium">Service Tests</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">CreditPaymentService</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugResults.creditService.success)}
                    {getStatusBadge(debugResults.creditService.success)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">UniversalStripeCheckout</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugResults.universalService.success)}
                    {getStatusBadge(debugResults.universalService.success)}
                  </div>
                </div>
              </div>
            </div>

            {/* Errors List */}
            {debugResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors Found</h4>
                <div className="space-y-1">
                  {debugResults.errors.map((error: string, index: number) => (
                    <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Debug Data */}
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Full Debug Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
                {JSON.stringify(debugResults, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Purpose:</strong> This tool tests error handling and serialization.</p>
          <p><strong>Goal:</strong> Eliminate "[object Object]" errors and improve debugging.</p>
        </div>
      </CardContent>
    </Card>
  );
}
