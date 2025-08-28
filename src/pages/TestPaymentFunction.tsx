import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function TestPaymentFunction() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('domains').select('id').limit(1);
      if (error) throw error;
      
      addResult({
        name: 'Supabase Connection',
        status: 'success',
        message: 'Database connection successful'
      });
    } catch (error: any) {
      addResult({
        name: 'Supabase Connection',
        status: 'error',
        message: `Database connection failed: ${error.message}`
      });
    }
  };

  const testEdgeFunction = async () => {
    try {
      const testPayload = {
        amount: 70,
        credits: 50,
        productName: 'Test 50 Credits',
        paymentMethod: 'stripe',
        isGuest: true,
        guestEmail: 'test@example.com'
      };

      console.log('Testing Supabase Edge Function with payload:', testPayload);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: testPayload
      });

      console.log('Edge Function Response:', { data, error });

      if (error) {
        addResult({
          name: 'Supabase Edge Function',
          status: 'error',
          message: `Edge function error: ${error.message}`,
          details: error
        });
      } else if (data && data.url) {
        addResult({
          name: 'Supabase Edge Function',
          status: 'success',
          message: `Edge function returned checkout URL successfully`,
          details: { hasUrl: true, sessionId: data.sessionId }
        });
      } else {
        addResult({
          name: 'Supabase Edge Function',
          status: 'warning',
          message: 'Edge function responded but no URL returned',
          details: data
        });
      }
    } catch (error: any) {
      addResult({
        name: 'Supabase Edge Function',
        status: 'error',
        message: `Edge function call failed: ${error.message}`,
        details: error
      });
    }
  };

  const testAuthenticatedPayment = async () => {
    if (!user) {
      addResult({
        name: 'Authenticated Payment',
        status: 'warning',
        message: 'User not authenticated - skipping test'
      });
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const testPayload = {
        amount: 140,
        credits: 100,
        productName: 'Test 100 Credits (Authenticated)',
        paymentMethod: 'stripe',
        isGuest: false
      };

      const headers = session?.session?.access_token 
        ? { 'Authorization': `Bearer ${session.session.access_token}` }
        : {};

      console.log('Testing authenticated payment with:', { 
        payload: testPayload, 
        hasAuth: !!headers.Authorization 
      });

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: testPayload,
        headers
      });

      if (error) {
        addResult({
          name: 'Authenticated Payment',
          status: 'error',
          message: `Authenticated payment failed: ${error.message}`,
          details: error
        });
      } else if (data && data.url) {
        addResult({
          name: 'Authenticated Payment',
          status: 'success',
          message: 'Authenticated payment created successfully',
          details: { hasUrl: true, sessionId: data.sessionId }
        });
      } else {
        addResult({
          name: 'Authenticated Payment',
          status: 'warning',
          message: 'Authenticated payment responded but no URL',
          details: data
        });
      }
    } catch (error: any) {
      addResult({
        name: 'Authenticated Payment',
        status: 'error',
        message: `Authenticated payment test failed: ${error.message}`,
        details: error
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test environment variables
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!stripeKey) {
      addResult({
        name: 'Environment Variables',
        status: 'error',
        message: 'VITE_STRIPE_PUBLISHABLE_KEY is missing'
      });
    } else if (!stripeKey.startsWith('pk_')) {
      addResult({
        name: 'Environment Variables',
        status: 'error',
        message: 'Invalid Stripe publishable key format'
      });
    } else {
      addResult({
        name: 'Environment Variables',
        status: 'success',
        message: `Stripe key configured (${stripeKey.startsWith('pk_test_') ? 'Test' : 'Live'} mode)`
      });
    }

    if (!supabaseKey) {
      addResult({
        name: 'Supabase Configuration',
        status: 'error',
        message: 'VITE_SUPABASE_ANON_KEY is missing'
      });
    } else {
      addResult({
        name: 'Supabase Configuration',
        status: 'success',
        message: 'Supabase anon key configured'
      });
    }

    // Run tests sequentially
    await testSupabaseConnection();
    await testEdgeFunction();
    await testAuthenticatedPayment();

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <CreditCard className="h-8 w-8" />
            Payment Function Test
          </h1>
          <p className="text-gray-600">
            Debug and test the Supabase Edge Function for payment processing
          </p>
        </div>

        {/* User Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">User Authentication:</label>
                {user ? (
                  <Badge className="ml-2">Authenticated ({user.email})</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2">Not Authenticated</Badge>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Environment:</label>
                <Badge variant="secondary" className="ml-2">
                  {window.location.hostname === 'localhost' ? 'Development' : 'Production'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Function Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="w-full"
              size="lg"
            >
              {isRunning ? 'Running Tests...' : 'Run All Payment Tests'}
            </Button>

            {/* Test Results */}
            {results.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Test Results:</h4>
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500">Show Details</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
