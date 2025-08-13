/**
 * Payment Testing Component
 * Comprehensive testing tool for all payment flows
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { UniversalPaymentComponent, QuickCreditButton, PremiumUpgradeButton } from '@/components/UniversalPaymentComponent';
import { 
  TestTube, 
  CreditCard, 
  Crown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const PaymentTesting: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [guestEmail, setGuestEmail] = useState('test@backlinkoo.com');

  const addTestResult = (test: string, success: boolean, details?: string) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      success,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testConfiguration = async () => {
    setTesting(true);
    addTestResult('Configuration Test', false, 'Testing...');

    try {
      const result = await stripeCheckout.testConfiguration();
      
      if (result.configured) {
        addTestResult('Configuration Test', true, 'Stripe is properly configured');
        toast({
          title: 'Configuration Test Passed',
          description: 'Stripe payment system is properly configured.'
        });
      } else {
        addTestResult('Configuration Test', false, result.error || 'Configuration failed');
        toast({
          title: 'Configuration Test Failed',
          description: result.error || 'Stripe configuration issue detected.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      addTestResult('Configuration Test', false, error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Configuration Test Error',
        description: 'Failed to test Stripe configuration.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const testCreditPurchase = async (credits: number, amount: number) => {
    setTesting(true);
    const testName = `Credit Purchase Test (${credits} credits)`;
    addTestResult(testName, false, 'Testing...');

    try {
      const result = user 
        ? await stripeCheckout.purchaseCredits({ credits, amount })
        : await stripeCheckout.guestQuickBuy({ credits, amount, email: guestEmail });

      if (result.success) {
        addTestResult(testName, true, `Checkout URL generated: ${result.url?.substring(0, 50)}...`);
        toast({
          title: 'Credit Purchase Test Passed',
          description: `${credits} credits checkout created successfully.`
        });
      } else {
        addTestResult(testName, false, result.error || 'Failed to create checkout');
        toast({
          title: 'Credit Purchase Test Failed',
          description: result.error || 'Failed to create credit purchase checkout.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      addTestResult(testName, false, error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Credit Purchase Test Error',
        description: 'Failed to test credit purchase.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const testPremiumUpgrade = async (plan: 'monthly' | 'yearly') => {
    setTesting(true);
    const testName = `Premium Upgrade Test (${plan})`;
    addTestResult(testName, false, 'Testing...');

    try {
      const result = user 
        ? await stripeCheckout.upgradeToPremium(plan)
        : await stripeCheckout.guestPremiumUpgrade({ plan, email: guestEmail });

      if (result.success) {
        addTestResult(testName, true, `Subscription URL generated: ${result.url?.substring(0, 50)}...`);
        toast({
          title: 'Premium Upgrade Test Passed',
          description: `${plan} subscription checkout created successfully.`
        });
      } else {
        addTestResult(testName, false, result.error || 'Failed to create subscription');
        toast({
          title: 'Premium Upgrade Test Failed',
          description: result.error || 'Failed to create premium subscription checkout.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      addTestResult(testName, false, error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Premium Upgrade Test Error',
        description: 'Failed to test premium upgrade.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const testQuickCredits = async (credits: 50 | 100 | 250 | 500) => {
    setTesting(true);
    const testName = `Quick Credit Test (${credits} credits)`;
    addTestResult(testName, false, 'Testing...');

    try {
      const result = await stripeCheckout.quickBuyCredits(credits);

      if (result.success) {
        addTestResult(testName, true, `Quick checkout URL generated: ${result.url?.substring(0, 50)}...`);
        toast({
          title: 'Quick Credit Test Passed',
          description: `${credits} quick credits checkout created successfully.`
        });
      } else {
        addTestResult(testName, false, result.error || 'Failed to create quick checkout');
        toast({
          title: 'Quick Credit Test Failed',
          description: result.error || 'Failed to create quick credit checkout.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      addTestResult(testName, false, error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Quick Credit Test Error',
        description: 'Failed to test quick credit purchase.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    clearResults();
    
    // Test configuration first
    await testConfiguration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test credit purchases
    await testCreditPurchase(100, 140);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testQuickCredits(50);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test premium upgrades
    await testPremiumUpgrade('monthly');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testPremiumUpgrade('yearly');
    
    setTesting(false);
    
    toast({
      title: 'All Tests Completed',
      description: 'Check the results below for any issues.'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Payment System Testing
          </CardTitle>
          <CardDescription>
            Comprehensive testing tool for all Stripe payment flows and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="automated" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="automated">Automated Tests</TabsTrigger>
              <TabsTrigger value="manual">Manual Tests</TabsTrigger>
              <TabsTrigger value="components">Component Tests</TabsTrigger>
            </TabsList>

            {/* Guest Email Input */}
            {!user && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <Label htmlFor="testEmail">Test Email (for guest checkout tests)</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="test@backlinkoo.com"
                    />
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Automated Tests */}
            <TabsContent value="automated" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={runAllTests}
                  disabled={testing}
                  className="h-16"
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Run All Tests
                    </>
                  )}
                </Button>

                <Button 
                  onClick={testConfiguration}
                  disabled={testing}
                  variant="outline"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Test Configuration
                </Button>

                <Button 
                  onClick={() => testCreditPurchase(100, 140)}
                  disabled={testing}
                  variant="outline"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Test Credit Purchase
                </Button>

                <Button 
                  onClick={() => testPremiumUpgrade('monthly')}
                  disabled={testing}
                  variant="outline"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Test Premium Upgrade
                </Button>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Test Results</CardTitle>
                    <Button onClick={clearResults} size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {testResults.map((result) => (
                        <div key={result.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{result.test}</span>
                              <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                                {result.success ? 'Pass' : 'Fail'}
                              </Badge>
                              <span className="text-xs text-gray-500">{result.timestamp}</span>
                            </div>
                            {result.details && (
                              <p className="text-xs text-gray-600 mt-1 break-all">{result.details}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Manual Tests */}
            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickCreditButton credits={50} variant="outline" />
                <QuickCreditButton credits={100} variant="outline" />
                <QuickCreditButton credits={250} variant="outline" />
                <QuickCreditButton credits={500} variant="outline" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumUpgradeButton plan="monthly" variant="outline" />
                <PremiumUpgradeButton plan="yearly" variant="outline" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <UniversalPaymentComponent 
                  defaultType="credits"
                  trigger={
                    <Button variant="outline" className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Test Universal Credit Modal
                    </Button>
                  }
                />

                <UniversalPaymentComponent 
                  defaultType="premium"
                  trigger={
                    <Button variant="outline" className="w-full">
                      <Crown className="mr-2 h-4 w-4" />
                      Test Universal Premium Modal
                    </Button>
                  }
                />
              </div>
            </TabsContent>

            {/* Component Tests */}
            <TabsContent value="components" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These tests will open actual Stripe checkout windows. Only use test credit card numbers!
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Test Credit Card Numbers</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div><strong>Success:</strong> 4242 4242 4242 4242</div>
                  <div><strong>Decline:</strong> 4000 0000 0000 0002</div>
                  <div><strong>Insufficient Funds:</strong> 4000 0000 0000 9995</div>
                  <div><strong>Expiry:</strong> Any future date (e.g., 12/34)</div>
                  <div><strong>CVC:</strong> Any 3 digits (e.g., 123)</div>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => window.open('/payment-success?session_id=test_session&credits=100', '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Test Payment Success Page
                </Button>

                <Button 
                  onClick={() => window.open('/payment-cancelled', '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Test Payment Cancelled Page
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTesting;
