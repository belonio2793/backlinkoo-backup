import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DebugResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'running';
  message: string;
  details?: any;
}

export function PaymentDebugger() {
  const { user } = useAuth();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DebugResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (name: string, updates: Partial<DebugResult>) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, ...updates } : r
    ));
  };

  const runDebugTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Environment Variables
    addResult({
      name: 'Environment Variables',
      status: 'running',
      message: 'Checking required environment variables...'
    });

    const envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      VITE_NETLIFY_ACCESS_TOKEN: import.meta.env.VITE_NETLIFY_ACCESS_TOKEN,
      VITE_NETLIFY_SITE_ID: import.meta.env.VITE_NETLIFY_SITE_ID
    };

    const missingVars = Object.entries(envVars).filter(([key, value]) => !value);
    const presentVars = Object.entries(envVars).filter(([key, value]) => !!value);

    updateResult('Environment Variables', {
      status: missingVars.length === 0 ? 'success' : 'warning',
      message: `Present: ${presentVars.length}, Missing: ${missingVars.length}`,
      details: {
        present: presentVars.map(([key, value]) => ({ 
          [key]: key.includes('KEY') || key.includes('TOKEN') ? `${value?.substring(0, 10)}...` : value 
        })),
        missing: missingVars.map(([key]) => key)
      }
    });

    // Test 2: Supabase Connection
    addResult({
      name: 'Supabase Connection',
      status: 'running',
      message: 'Testing Supabase client connection...'
    });

    try {
      const { data, error } = await supabase.from('domains').select('id').limit(1);
      updateResult('Supabase Connection', {
        status: error ? 'error' : 'success',
        message: error ? `Connection failed: ${error.message}` : 'Successfully connected to Supabase',
        details: { error, hasData: !!data }
      });
    } catch (error) {
      updateResult('Supabase Connection', {
        status: 'error',
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // Test 3: Supabase Edge Function
    addResult({
      name: 'Supabase Edge Function',
      status: 'running',
      message: 'Testing create-payment edge function...'
    });

    try {
      const testPayload = {
        amount: 70,
        credits: 50,
        productName: 'Test 50 Credits - Debug',
        paymentMethod: 'stripe',
        isGuest: !user,
        guestEmail: user?.email || 'test@example.com'
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (user) {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.access_token) {
          headers['Authorization'] = `Bearer ${session.session.access_token}`;
        }
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: testPayload,
        headers
      });

      updateResult('Supabase Edge Function', {
        status: error ? 'error' : (data?.url ? 'success' : 'warning'),
        message: error ? `Edge function error: ${error.message}` : 
                data?.url ? `Generated checkout URL: ${data.url.substring(0, 50)}...` : 
                'Function responded but no URL returned',
        details: { data, error, testPayload }
      });
    } catch (error) {
      updateResult('Supabase Edge Function', {
        status: 'error',
        message: `Function call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // Test 4: Netlify Functions
    addResult({
      name: 'Netlify Functions',
      status: 'running',
      message: 'Testing Netlify function endpoints...'
    });

    const netlifyEndpoints = [
      '/.netlify/functions/create-payment',
      '/api/create-payment'
    ];

    const testPayload = {
      amount: 70,
      credits: 50,
      productName: 'Test 50 Credits - Netlify',
      paymentMethod: 'stripe',
      isGuest: !user,
      guestEmail: user?.email || 'test@example.com'
    };

    const netlifyResults = [];

    for (const endpoint of netlifyEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload)
        });

        const result = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        };

        if (response.ok) {
          const data = await response.json();
          netlifyResults.push({ ...result, data, hasUrl: !!data.url });
        } else {
          const errorText = await response.text();
          netlifyResults.push({ ...result, errorText });
        }
      } catch (error) {
        netlifyResults.push({
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
          networkError: true
        });
      }
    }

    const successfulEndpoints = netlifyResults.filter(r => r.ok && r.hasUrl);
    const failedEndpoints = netlifyResults.filter(r => !r.ok || r.networkError);

    updateResult('Netlify Functions', {
      status: successfulEndpoints.length > 0 ? 'success' : 'error',
      message: `${successfulEndpoints.length} working, ${failedEndpoints.length} failed`,
      details: { results: netlifyResults }
    });

    // Test 5: Authentication Status
    addResult({
      name: 'Authentication',
      status: user ? 'success' : 'warning',
      message: user ? `Authenticated as: ${user.email}` : 'Not authenticated (testing guest flow)',
      details: { user: user ? { id: user.id, email: user.email } : null }
    });

    setIsRunning(false);
  };

  const getIcon = (status: DebugResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <Card className="max-w-4xl mx-auto m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Payment System Debugger
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Diagnose payment system issues and identify configuration problems
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebugTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            'Run Payment System Diagnostics'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <Badge variant="secondary" className="text-green-600">
                ✅ {successCount} passed
              </Badge>
              <Badge variant="secondary" className="text-yellow-600">
                ⚠️ {warningCount} warnings
              </Badge>
              <Badge variant="secondary" className="text-red-600">
                ❌ {errorCount} failed
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                >
                  {getIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{result.message}</div>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View Details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-40">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && errorCount === 0 && !isRunning && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            🎉 All critical tests passed! Payment system should be working.
          </div>
        )}

        {errorCount > 0 && !isRunning && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            ❌ {errorCount} critical issue{errorCount > 1 ? 's' : ''} found. Check the details above to resolve the payment system issues.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
