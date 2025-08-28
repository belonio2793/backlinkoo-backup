import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'running';
  message: string;
}

export function SupabasePaymentTest() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, ...updates } : r
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Supabase Connection
    addResult({
      name: 'Supabase Connection',
      status: 'running',
      message: 'Testing Supabase client connection...'
    });

    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id')
        .limit(1);

      if (error) {
        updateResult('Supabase Connection', {
          status: 'error',
          message: `Connection failed: ${error.message}`
        });
      } else {
        updateResult('Supabase Connection', {
          status: 'success',
          message: 'Successfully connected to Supabase'
        });
      }
    } catch (error) {
      updateResult('Supabase Connection', {
        status: 'error',
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 2: Authentication Status
    addResult({
      name: 'Authentication',
      status: user ? 'success' : 'warning',
      message: user ? `Authenticated as: ${user.email}` : 'Not authenticated (will test guest checkout)'
    });

    // Test 3: Edge Function Test
    addResult({
      name: 'Supabase Edge Function',
      status: 'running',
      message: 'Testing create-payment edge function...'
    });

    try {
      const testPayload = {
        amount: 70,
        credits: 50,
        productName: 'Test 50 Credits - Supabase',
        paymentMethod: 'stripe',
        isGuest: !user,
        guestEmail: user?.email || 'test@example.com'
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add auth header if user is logged in
      if (user) {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.access_token) {
          headers['Authorization'] = `Bearer ${session.session.access_token}`;
        }
      }

      console.log('🚀 Calling Supabase Edge Function:', testPayload);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: testPayload,
        headers
      });

      console.log('📥 Edge Function Response:', { data, error });

      if (error) {
        updateResult('Supabase Edge Function', {
          status: 'error',
          message: `Edge function error: ${error.message || JSON.stringify(error)}`
        });
      } else if (data && data.url) {
        updateResult('Supabase Edge Function', {
          status: 'success',
          message: `✅ Generated checkout URL: ${data.url.substring(0, 50)}...`
        });

        // Test 4: Stripe URL Validation
        addResult({
          name: 'Stripe Checkout URL',
          status: data.url.includes('checkout.stripe.com') ? 'success' : 'warning',
          message: data.url.includes('checkout.stripe.com') 
            ? 'Valid Stripe checkout URL generated' 
            : 'URL generated but not a standard Stripe checkout URL'
        });

      } else {
        updateResult('Supabase Edge Function', {
          status: 'warning',
          message: 'Function responded but no checkout URL returned'
        });
      }
    } catch (error) {
      updateResult('Supabase Edge Function', {
        status: 'error',
        message: `Function call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 5: Environment Check
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    addResult({
      name: 'Environment Variables',
      status: (supabaseUrl && supabaseAnonKey) ? 'success' : 'error',
      message: `VITE_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}, VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅' : '❌'}`
    });

    setIsRunning(false);
  };

  const getIcon = (status: TestResult['status']) => {
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
    <Card className="max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Supabase Payment Integration Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the Supabase edge function payment flow with your configured Stripe keys
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Test Supabase Payment Flow'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">✅ {successCount} passed</span>
              <span className="text-yellow-600">⚠️ {warningCount} warnings</span>
              <span className="text-red-600">❌ {errorCount} failed</span>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-2 p-3 bg-muted/50 rounded text-sm"
                >
                  {getIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-muted-foreground">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && errorCount === 0 && !isRunning && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            🎉 All tests passed! Your Supabase payment integration is working correctly with the configured Stripe keys.
          </div>
        )}

        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
          💡 This test uses your real Supabase edge function with the Stripe keys you configured in Supabase secrets.
        </div>
      </CardContent>
    </Card>
  );
}
