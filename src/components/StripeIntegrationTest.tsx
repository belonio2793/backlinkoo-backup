import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { stripeWrapper } from '@/services/stripeWrapper';
import { 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Crown, 
  Zap, 
  AlertCircle,
  TestTube,
  Loader2 
} from 'lucide-react';

export function StripeIntegrationTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('test@example.com');

  const addTestResult = (test: string, status: 'success' | 'error' | 'info', message: string, details?: any) => {
    const result = {
      id: Date.now(),
      test,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
    
    toast({
      title: `${test} - ${status}`,
      description: message,
      variant: status === 'error' ? 'destructive' : 'default'
    });
  };

  const testStripeConfiguration = () => {
    const status = stripeWrapper.getStatus();
    
    addTestResult(
      'Stripe Configuration',
      status.configured ? 'success' : 'error',
      status.configured 
        ? `Configured for ${status.environment} environment`
        : 'Stripe not properly configured',
      status
    );

    if (status.errors.length > 0) {
      status.errors.forEach(error => {
        addTestResult('Configuration Error', 'error', error);
      });
    }
  };

  const testCreditPurchase = async (credits: 50 | 100 | 250 | 500) => {
    const testId = `credits-${credits}`;
    setLoading(testId);

    try {
      addTestResult(`${credits} Credits Purchase`, 'info', 'Testing credit purchase flow...');
      
      const result = await stripeWrapper.quickBuyCredits(credits, testEmail);
      
      if (result.success) {
        addTestResult(
          `${credits} Credits Purchase`,
          'success',
          'Checkout session created successfully',
          { url: result.url, sessionId: result.sessionId, method: result.method }
        );
      } else {
        addTestResult(
          `${credits} Credits Purchase`,
          'error',
          result.error || 'Failed to create checkout session',
          result
        );
      }
    } catch (error: any) {
      addTestResult(
        `${credits} Credits Purchase`,
        'error',
        error.message || 'Credit purchase test failed',
        error
      );
    } finally {
      setLoading(null);
    }
  };

  const testPremiumSubscription = async (plan: 'monthly' | 'yearly') => {
    const testId = `premium-${plan}`;
    setLoading(testId);

    try {
      addTestResult(`Premium ${plan}`, 'info', 'Testing subscription flow...');
      
      const result = await stripeWrapper.quickSubscribe(plan, testEmail);
      
      if (result.success) {
        addTestResult(
          `Premium ${plan}`,
          'success',
          'Subscription checkout created successfully',
          { url: result.url, sessionId: result.sessionId, method: result.method }
        );
      } else {
        addTestResult(
          `Premium ${plan}`,
          'error',
          result.error || 'Failed to create subscription checkout',
          result
        );
      }
    } catch (error: any) {
      addTestResult(
        `Premium ${plan}`,
        'error',
        error.message || 'Subscription test failed',
        error
      );
    } finally {
      setLoading(null);
    }
  };

  const testCustomCredits = async () => {
    const testId = 'custom-credits';
    setLoading(testId);

    try {
      const customCredits = 123;
      const customAmount = Number((customCredits * 1.40).toFixed(2));

      addTestResult('Custom Credits', 'info', `Testing custom ${customCredits} credits purchase...`);
      
      const result = await stripeWrapper.createPayment({
        amount: customAmount,
        credits: customCredits,
        productName: `${customCredits} Custom Backlink Credits`,
        isGuest: true,
        guestEmail: testEmail
      });
      
      if (result.success) {
        addTestResult(
          'Custom Credits',
          'success',
          'Custom credits checkout created successfully',
          { amount: customAmount, credits: customCredits, url: result.url, method: result.method }
        );
      } else {
        addTestResult(
          'Custom Credits',
          'error',
          result.error || 'Failed to create custom credits checkout',
          result
        );
      }
    } catch (error: any) {
      addTestResult(
        'Custom Credits',
        'error',
        error.message || 'Custom credits test failed',
        error
      );
    } finally {
      setLoading(null);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const status = stripeWrapper.getStatus();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TestTube className="h-8 w-8" />
          Stripe Integration Test
        </h1>
        <Button onClick={clearResults} variant="outline" size="sm">
          Clear Results
        </Button>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {status.configured ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">Configured</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.environment === 'live' ? 'default' : 'secondary'}>
                {status.environment}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Primary: {status.primaryMethod}</span>
            </div>
            <div className="flex items-center gap-2">
              {status.errors.length === 0 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">{status.errors.length} errors</span>
            </div>
          </div>

          <Button onClick={testStripeConfiguration} variant="outline" size="sm">
            Test Configuration
          </Button>

          {status.errors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configuration errors: {status.errors.join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Email Input */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter test email"
            />
          </div>
        </CardContent>
      </Card>

      {/* Credit Purchase Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Credit Purchase Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[50, 100, 250, 500].map((credits) => (
              <Button
                key={credits}
                onClick={() => testCreditPurchase(credits as 50 | 100 | 250 | 500)}
                disabled={loading !== null}
                variant="outline"
                className="flex flex-col h-auto p-4"
              >
                {loading === `credits-${credits}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                <span>{credits} Credits</span>
                <span className="text-xs opacity-60">${credits <= 500 ? [70, 140, 350, 700][[50, 100, 250, 500].indexOf(credits)] : credits * 1.40}</span>
              </Button>
            ))}
          </div>

          <Button
            onClick={testCustomCredits}
            disabled={loading !== null}
            variant="outline"
            className="w-full"
          >
            {loading === 'custom-credits' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Test Custom Credits (123 credits)
          </Button>
        </CardContent>
      </Card>

      {/* Premium Subscription Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Premium Subscription Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => testPremiumSubscription('monthly')}
              disabled={loading !== null}
              variant="outline"
              className="flex flex-col h-auto p-4"
            >
              {loading === 'premium-monthly' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              <span>Monthly Premium</span>
              <span className="text-xs opacity-60">$29/month</span>
            </Button>

            <Button
              onClick={() => testPremiumSubscription('yearly')}
              disabled={loading !== null}
              variant="outline"
              className="flex flex-col h-auto p-4"
            >
              {loading === 'premium-yearly' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              <span>Yearly Premium</span>
              <span className="text-xs opacity-60">$290/year</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">No tests run yet. Click the test buttons above.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result) => (
                <div key={result.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {result.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                      {result.status === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">Details</summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
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
  );
}

export default StripeIntegrationTest;
