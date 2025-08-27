import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';

export function PaymentTestButton() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const testEndpoints = [
    {
      name: 'Netlify Create Payment',
      url: '/.netlify/functions/create-payment',
      method: 'POST'
    },
    {
      name: 'API Create Payment',
      url: '/api/create-payment',
      method: 'POST'
    },
    {
      name: 'Supabase Create Payment',
      url: '/functions/create-payment',
      method: 'POST'
    }
  ];

  const testData = {
    amount: 140,
    credits: 100,
    productName: "100 Test Credits",
    paymentMethod: 'stripe',
    isGuest: true,
    guestEmail: 'test@backlinkoo.com'
  };

  const testStripeConfiguration = async () => {
    setTesting(true);
    setResults([]);
    
    const newResults: any[] = [];

    // Test environment variables
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const hasValidPublicKey = stripePublicKey && stripePublicKey.startsWith('pk_');
    
    newResults.push({
      name: 'Stripe Public Key',
      status: hasValidPublicKey ? 'success' : 'error',
      message: hasValidPublicKey 
        ? `✅ Valid ${stripePublicKey.includes('live') ? 'LIVE' : 'TEST'} key configured`
        : '❌ Missing or invalid Stripe publishable key',
      details: stripePublicKey ? `${stripePublicKey.substring(0, 20)}...` : 'Not set'
    });

    // Test payment endpoints
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData)
        });

        const responseData = await response.text();
        let parsedData;
        
        try {
          parsedData = JSON.parse(responseData);
        } catch (e) {
          parsedData = { rawResponse: responseData };
        }

        if (response.ok && parsedData.url) {
          newResults.push({
            name: endpoint.name,
            status: 'success',
            message: '✅ Endpoint working - Stripe checkout URL generated',
            details: `Status: ${response.status}, Has checkout URL: ${!!parsedData.url}`,
            url: parsedData.url
          });
        } else {
          newResults.push({
            name: endpoint.name,
            status: 'error',
            message: `❌ Failed: ${response.status} ${response.statusText}`,
            details: parsedData.error || responseData.substring(0, 200) || 'No response',
          });
        }
      } catch (error) {
        newResults.push({
          name: endpoint.name,
          status: 'error',
          message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: 'Could not connect to endpoint'
        });
      }
    }

    setResults(newResults);
    setTesting(false);

    // Show summary toast
    const working = newResults.filter(r => r.status === 'success').length;
    const total = newResults.length;
    
    toast({
      title: "Payment System Test Complete",
      description: `${working}/${total} tests passed. ${working > 0 ? 'Payment system ready!' : 'Configuration needed.'}`,
      variant: working > 0 ? "default" : "destructive",
    });
  };

  const openStripeCheckout = (url: string) => {
    window.open(url, 'stripe-test', 'width=800,height=600,scrollbars=yes,resizable=yes');
    toast({
      title: "Test Checkout Opened",
      description: "This will open a real Stripe checkout. Cancel the payment to avoid charges.",
      variant: "destructive",
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Stripe Payment Integration Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the payment system with live Stripe configuration
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testStripeConfiguration}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Testing Payment System...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Test Stripe Payment Integration
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{result.name}</span>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status === 'success' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {result.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.details}
                </p>
                {result.url && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => openStripeCheckout(result.url)}
                  >
                    Test Checkout (Live Payment)
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          <strong>Note:</strong> This test uses your live Stripe configuration. 
          Any checkout URLs generated will create real payments if completed.
        </div>
      </CardContent>
    </Card>
  );
}
