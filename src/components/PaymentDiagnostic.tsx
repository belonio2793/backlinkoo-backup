/**
 * Payment Diagnostic Component
 * Real-time payment system health checker and mobile compatibility tester
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Smartphone, Monitor, Wifi, AlertTriangle, Loader2 } from 'lucide-react';
import { EnhancedPaymentService } from '@/services/enhancedPaymentService';
import { cn } from '@/lib/utils';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
}

export function PaymentDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    setDeviceInfo(EnhancedPaymentService.getEnvironmentInfo());
  }, []);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (testName: string, updates: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map(r => 
      r.test === testName ? { ...r, ...updates } : r
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Environment Check
    addResult({
      test: 'Environment Check',
      status: 'loading',
      message: 'Checking device and browser environment...'
    });

    try {
      const env = EnhancedPaymentService.getEnvironmentInfo();
      updateResult('Environment Check', {
        status: 'success',
        message: `Device: ${env.isMobile ? 'Mobile' : 'Desktop'}, Protocol: ${env.protocol}, Browser: ${env.isIOSSafari ? 'iOS Safari' : 'Other'}`,
        details: env
      });
    } catch (error) {
      updateResult('Environment Check', {
        status: 'error',
        message: 'Failed to detect environment'
      });
    }

    // Test 2: Network Connectivity
    addResult({
      test: 'Network Connectivity',
      status: 'loading',
      message: 'Testing network connection...'
    });

    try {
      const response = await fetch('/favicon.svg', { method: 'HEAD' });
      updateResult('Network Connectivity', {
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Network connection active' : 'Network connection issues'
      });
    } catch (error) {
      updateResult('Network Connectivity', {
        status: 'error',
        message: 'No network connectivity'
      });
    }

    // Test 3: Payment Endpoints
    addResult({
      test: 'Payment Endpoints',
      status: 'loading',
      message: 'Testing payment function endpoints...'
    });

    const endpoints = [
      '/.netlify/functions/create-payment',
      '/.netlify/functions/create-subscription',
      '/.netlify/functions/verify-payment'
    ];

    let endpointResults: any[] = [];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { method: 'OPTIONS' });
        endpointResults.push({
          endpoint,
          status: response.status,
          ok: response.ok
        });
      } catch (error) {
        endpointResults.push({
          endpoint,
          status: 'Failed',
          ok: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const allEndpointsOk = endpointResults.every(r => r.ok);
    updateResult('Payment Endpoints', {
      status: allEndpointsOk ? 'success' : 'error',
      message: allEndpointsOk ? 'All payment endpoints accessible' : 'Some endpoints unavailable',
      details: endpointResults
    });

    // Test 4: Premium Subscription Test
    addResult({
      test: 'Premium Subscription Test',
      status: 'loading',
      message: 'Testing premium subscription creation...'
    });

    try {
      const response = await fetch('/.netlify/functions/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'monthly',
          isGuest: true,
          guestEmail: 'test@example.com',
          paymentMethod: 'stripe'
        })
      });

      const data = await response.json();
      
      updateResult('Premium Subscription Test', {
        status: response.ok && data.url ? 'success' : 'error',
        message: response.ok && data.url 
          ? 'Premium subscription endpoint working' 
          : `Premium subscription failed: ${data.error || 'Unknown error'}`,
        details: { status: response.status, data }
      });
    } catch (error) {
      updateResult('Premium Subscription Test', {
        status: 'error',
        message: `Premium subscription error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 5: Credits Payment Test
    addResult({
      test: 'Credits Payment Test',
      status: 'loading',
      message: 'Testing credits payment creation...'
    });

    try {
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 29,
          productName: '50 Backlink Credits',
          isGuest: true,
          guestEmail: 'test@example.com',
          paymentMethod: 'stripe',
          credits: 50
        })
      });

      const data = await response.json();
      
      updateResult('Credits Payment Test', {
        status: response.ok && data.url ? 'success' : 'error',
        message: response.ok && data.url 
          ? 'Credits payment endpoint working' 
          : `Credits payment failed: ${data.error || 'Unknown error'}`,
        details: { status: response.status, data }
      });
    } catch (error) {
      updateResult('Credits Payment Test', {
        status: 'error',
        message: `Credits payment error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 6: Mobile Compatibility
    addResult({
      test: 'Mobile Compatibility',
      status: 'loading',
      message: 'Checking mobile compatibility...'
    });

    try {
      const issues: string[] = [];
      
      // Check viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) issues.push('Missing viewport meta tag');
      
      // Check touch events
      if (!('ontouchstart' in window)) issues.push('Touch events not supported');
      
      // Check button sizes on mobile
      if (deviceInfo?.isMobile) {
        const testButton = document.createElement('button');
        testButton.style.cssText = 'min-height: 44px; position: absolute; left: -9999px;';
        document.body.appendChild(testButton);
        
        const height = testButton.offsetHeight;
        if (height < 44) issues.push('Touch targets too small');
        
        document.body.removeChild(testButton);
      }

      updateResult('Mobile Compatibility', {
        status: issues.length === 0 ? 'success' : 'warning',
        message: issues.length === 0 
          ? 'Mobile compatibility looks good' 
          : `Mobile issues found: ${issues.join(', ')}`,
        details: { issues, deviceInfo }
      });
    } catch (error) {
      updateResult('Mobile Compatibility', {
        status: 'error',
        message: 'Failed to check mobile compatibility'
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants: Record<string, any> = {
      success: { variant: 'default', className: 'bg-green-500' },
      error: { variant: 'destructive' },
      warning: { variant: 'secondary', className: 'bg-yellow-500' },
      loading: { variant: 'outline' }
    };
    
    return (
      <Badge 
        {...variants[status]} 
        className={cn(variants[status].className)}
      >
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💳 Payment System Diagnostic
            {deviceInfo?.isMobile ? (
              <Smartphone className="h-5 w-5 text-blue-500" />
            ) : (
              <Monitor className="h-5 w-5 text-green-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deviceInfo && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Device Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>Type: {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</div>
                  <div>iOS Safari: {deviceInfo.isIOSSafari ? 'Yes' : 'No'}</div>
                  <div>Width: {deviceInfo.windowWidth}px</div>
                  <div>Protocol: {deviceInfo.protocol}</div>
                </div>
              </div>
            )}

            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Run Payment Diagnostics
                </>
              )}
            </Button>

            {results.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Diagnostic Results</h3>
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.test}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentDiagnostic;
