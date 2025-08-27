import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Settings, CreditCard } from 'lucide-react';
import { CreditPaymentService } from '@/services/creditPaymentService';
import { supabase } from '@/integrations/supabase/client';

export function PaymentDebugger() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    
    const diagnostics: any[] = [];

    // Check environment
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com');
    const isFlyDev = hostname.includes('fly.dev');

    diagnostics.push({
      name: 'Deployment Environment',
      status: 'info',
      message: `Detected: ${isLocalhost ? 'Localhost' : isNetlify ? 'Netlify' : isFlyDev ? 'Fly.dev' : 'Unknown'}`,
      details: `Hostname: ${hostname}`
    });

    // Check Stripe configuration
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const hasValidPublicKey = stripePublicKey && stripePublicKey.startsWith('pk_');
    
    diagnostics.push({
      name: 'Stripe Public Key',
      status: hasValidPublicKey ? 'success' : 'error',
      message: hasValidPublicKey 
        ? `✅ Valid ${stripePublicKey.includes('live') ? 'LIVE' : 'TEST'} key configured`
        : '❌ Missing or invalid Stripe publishable key',
      details: stripePublicKey ? `${stripePublicKey.substring(0, 20)}...` : 'Not set'
    });

    // Check Supabase connection
    try {
      const { data, error } = await supabase.from('orders').select('id').limit(1);
      diagnostics.push({
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? '❌ Supabase connection failed' : '✅ Supabase connected',
        details: error ? error.message : 'Database accessible'
      });
    } catch (error) {
      diagnostics.push({
        name: 'Supabase Connection',
        status: 'error',
        message: '❌ Supabase connection error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Supabase Edge Function directly
    try {
      const testData = {
        amount: 10, // Small test amount
        credits: 10,
        productName: 'Test Credits',
        paymentMethod: 'stripe',
        isGuest: true,
        guestEmail: 'test@example.com'
      };

      console.log('🧪 Testing Supabase Edge Function directly...');
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: testData
      });

      if (error) {
        diagnostics.push({
          name: 'Supabase Edge Function',
          status: 'error',
          message: '❌ Edge function failed',
          details: error.message || JSON.stringify(error)
        });
      } else if (data && data.url) {
        diagnostics.push({
          name: 'Supabase Edge Function',
          status: 'success',
          message: '✅ Edge function working',
          details: 'Successfully created test payment session'
        });
      } else {
        diagnostics.push({
          name: 'Supabase Edge Function',
          status: 'warning',
          message: '⚠️ Edge function responded but no URL',
          details: JSON.stringify(data)
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Supabase Edge Function',
        status: 'error',
        message: '❌ Edge function error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test payment service
    try {
      console.log('🧪 Testing CreditPaymentService...');
      
      const result = await CreditPaymentService.createCreditPayment(
        null, // No user
        true, // Guest
        'test@example.com',
        {
          amount: 10,
          credits: 10,
          productName: 'Test Credits'
        }
      );

      diagnostics.push({
        name: 'Credit Payment Service',
        status: result.success ? 'success' : 'error',
        message: result.success ? '✅ Payment service working' : '❌ Payment service failed',
        details: result.success ? 'Service created payment URL' : (result.error || 'Unknown error')
      });
    } catch (error) {
      diagnostics.push({
        name: 'Credit Payment Service',
        status: 'error',
        message: '❌ Payment service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setResults(diagnostics);
    setTesting(false);

    // Summary toast
    const errors = diagnostics.filter(d => d.status === 'error').length;
    const warnings = diagnostics.filter(d => d.status === 'warning').length;
    
    toast({
      title: "Diagnostics Complete",
      description: `${errors} errors, ${warnings} warnings found`,
      variant: errors > 0 ? "destructive" : warnings > 0 ? "default" : "default",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Settings className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment System Diagnostics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Debug payment configuration and test endpoints
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Run Payment Diagnostics
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <Badge variant={getStatusColor(result.status) as any}>
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {result.message}
                </p>
                <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                  {result.details}
                </p>
              </div>
            ))}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure Stripe keys are configured in Supabase project settings</li>
                <li>• Check that STRIPE_SECRET_KEY is set in Supabase Edge Functions</li>
                <li>• Verify SUPABASE_SERVICE_ROLE_KEY is properly configured</li>
                <li>• Test on production domain if possible (not localhost)</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
