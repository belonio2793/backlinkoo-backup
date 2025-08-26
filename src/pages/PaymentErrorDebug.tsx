import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { UniversalPaymentComponent } from '@/components/UniversalPaymentComponent';
import { PricingModal } from '@/components/PricingModal';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { paymentIntegrationService } from '@/services/paymentIntegrationService';
import { 
  CreditCard, 
  Crown, 
  CheckCircle, 
  AlertCircle,
  TestTube,
  Bug,
  Loader2
} from 'lucide-react';

export default function PaymentErrorDebug() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  const [showPricingModal, setShowPricingModal] = useState(false);

  const runPaymentTest = async (testType: string, testFn: () => Promise<any>) => {
    setLoading(true);
    setTestResults(prev => ({ ...prev, [testType]: { status: 'testing' } }));

    try {
      const result = await testFn();
      setTestResults(prev => ({ 
        ...prev, 
        [testType]: { 
          status: 'success', 
          data: result,
          message: 'Test completed successfully'
        } 
      }));
      
      toast({
        title: `${testType} Test Passed`,
        description: 'Payment flow working correctly',
      });
    } catch (error) {
      console.error(`${testType} test error:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [testType]: { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Test failed - response stream error should be fixed'
        } 
      }));
      
      toast({
        title: `${testType} Test Failed`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testUniversalStripeCheckout = async () => {
    return await stripeCheckout.purchaseCredits({
      credits: 10,
      amount: 14,
      productName: 'Test Credits',
      isGuest: true,
      guestEmail: 'test@example.com'
    });
  };

  const testPaymentIntegrationService = async () => {
    return await paymentIntegrationService.createPayment(
      14,
      10,
      'stripe',
      true,
      'test@example.com'
    );
  };

  const testSubscriptionFlow = async () => {
    return await stripeCheckout.purchaseSubscription({
      plan: 'monthly',
      isGuest: true,
      guestEmail: 'test@example.com'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <TestTube className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800 border-green-300',
      error: 'bg-red-100 text-red-800 border-red-300',
      testing: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-300'}>
        {status === 'testing' ? 'Testing...' : status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Bug className="h-8 w-8 text-red-600" />
            Payment Error Debug & Test Suite
          </h1>
          <p className="text-muted-foreground">
            Test all payment flows to verify "body stream already read" errors are fixed
          </p>
          {user && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="w-4 h-4 mr-1" />
              Signed in as {user.email}
            </Badge>
          )}
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Universal Stripe Checkout Test */}
          <Card className={`border-2 ${
            testResults.universalStripe?.status === 'success' ? 'border-green-300 bg-green-50' :
            testResults.universalStripe?.status === 'error' ? 'border-red-300 bg-red-50' :
            testResults.universalStripe?.status === 'testing' ? 'border-blue-300 bg-blue-50' :
            'border-gray-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(testResults.universalStripe?.status || 'idle')}
                Universal Stripe Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Tests the universalStripeCheckout.ts service
              </p>
              {testResults.universalStripe && (
                <div className="space-y-2">
                  {getStatusBadge(testResults.universalStripe.status)}
                  <p className="text-xs">{testResults.universalStripe.message}</p>
                  {testResults.universalStripe.error && (
                    <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                      {testResults.universalStripe.error}
                    </p>
                  )}
                </div>
              )}
              <Button 
                onClick={() => runPaymentTest('universalStripe', testUniversalStripeCheckout)}
                disabled={loading}
                size="sm"
                className="w-full"
              >
                Test Universal Checkout
              </Button>
            </CardContent>
          </Card>

          {/* Payment Integration Service Test */}
          <Card className={`border-2 ${
            testResults.paymentIntegration?.status === 'success' ? 'border-green-300 bg-green-50' :
            testResults.paymentIntegration?.status === 'error' ? 'border-red-300 bg-red-50' :
            testResults.paymentIntegration?.status === 'testing' ? 'border-blue-300 bg-blue-50' :
            'border-gray-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(testResults.paymentIntegration?.status || 'idle')}
                Payment Integration Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Tests the paymentIntegrationService.ts
              </p>
              {testResults.paymentIntegration && (
                <div className="space-y-2">
                  {getStatusBadge(testResults.paymentIntegration.status)}
                  <p className="text-xs">{testResults.paymentIntegration.message}</p>
                  {testResults.paymentIntegration.error && (
                    <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                      {testResults.paymentIntegration.error}
                    </p>
                  )}
                </div>
              )}
              <Button 
                onClick={() => runPaymentTest('paymentIntegration', testPaymentIntegrationService)}
                disabled={loading}
                size="sm"
                className="w-full"
              >
                Test Integration Service
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Test */}
          <Card className={`border-2 ${
            testResults.subscription?.status === 'success' ? 'border-green-300 bg-green-50' :
            testResults.subscription?.status === 'error' ? 'border-red-300 bg-red-50' :
            testResults.subscription?.status === 'testing' ? 'border-blue-300 bg-blue-50' :
            'border-gray-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(testResults.subscription?.status || 'idle')}
                Subscription Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Tests subscription creation flow
              </p>
              {testResults.subscription && (
                <div className="space-y-2">
                  {getStatusBadge(testResults.subscription.status)}
                  <p className="text-xs">{testResults.subscription.message}</p>
                  {testResults.subscription.error && (
                    <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                      {testResults.subscription.error}
                    </p>
                  )}
                </div>
              )}
              <Button 
                onClick={() => runPaymentTest('subscription', testSubscriptionFlow)}
                disabled={loading}
                size="sm"
                className="w-full"
              >
                Test Subscription
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* UI Component Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              UI Component Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Universal Payment Component</h4>
                <UniversalPaymentComponent 
                  trigger={
                    <Button className="w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Test Universal Payment
                    </Button>
                  }
                  defaultType="credits"
                  defaultCredits={10}
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Pricing Modal</h4>
                <Button 
                  onClick={() => setShowPricingModal(true)}
                  className="w-full"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Test Pricing Modal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Information */}
        <Card>
          <CardHeader>
            <CardTitle>Error Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">✅ Fixed Issues:</h4>
              <ul className="text-sm space-y-1 ml-4 text-green-700">
                <li>• <strong>universalStripeCheckout.ts</strong> - Fixed response.text() + response.json() conflict</li>
                <li>• <strong>PricingModal.tsx</strong> - Fixed dual response body reading in payment & subscription</li>
                <li>• <strong>Response handling</strong> - Now reads JSON first, then checks for errors</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">🔧 Error Pattern Fixed:</h4>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                <div className="text-red-600">❌ Before (caused error):</div>
                <div>if (!response.ok) &#123;</div>
                <div>&nbsp;&nbsp;const errorText = await response.text();</div>
                <div>&#125;</div>
                <div>const data = await response.json(); // ← Error!</div>
                <br />
                <div className="text-green-600">✅ After (fixed):</div>
                <div>const data = await response.json();</div>
                <div>if (!response.ok) &#123;</div>
                <div>&nbsp;&nbsp;throw new Error(data.error);</div>
                <div>&#125;</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">📋 Test Instructions:</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Click "Test" buttons above to verify each payment flow</li>
                <li>• Expect either success (if Stripe configured) or graceful error handling</li>
                <li>• No more "body stream already read" errors should occur</li>
                <li>• UI components should open modals without errors</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Modal */}
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          initialCredits={10}
        />
      </div>
    </div>
  );
}
