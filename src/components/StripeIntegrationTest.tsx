import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { stripeCheckout } from '@/services/universalStripeCheckout';
import { CreditPaymentService } from '@/services/creditPaymentService';
import { useToast } from '@/hooks/use-toast';

export function StripeIntegrationTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<{
    configTest: 'pending' | 'success' | 'error';
    paymentServiceTest: 'pending' | 'success' | 'error';
    universalServiceTest: 'pending' | 'success' | 'error';
  }>({
    configTest: 'pending',
    paymentServiceTest: 'pending',
    universalServiceTest: 'pending'
  });

  const testStripeConfiguration = async () => {
    try {
      // Test environment variables
      const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!stripePublicKey) {
        throw new Error('VITE_STRIPE_PUBLISHABLE_KEY not configured');
      }
      
      if (!stripePublicKey.startsWith('pk_')) {
        throw new Error('Invalid Stripe publishable key format');
      }

      // Test configuration endpoint
      const configTest = await stripeCheckout.testConfiguration();
      
      if (configTest.configured) {
        setTestResults(prev => ({ ...prev, configTest: 'success' }));
        toast({
          title: "✅ Configuration Test Passed",
          description: "Stripe is properly configured"
        });
      } else {
        throw new Error(configTest.error || 'Configuration test failed');
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, configTest: 'error' }));
      toast({
        title: "❌ Configuration Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const testCreditPaymentService = async () => {
    try {
      // Test CreditPaymentService with minimal data
      const result = await CreditPaymentService.createCreditPayment(
        null, // No user (guest)
        true, // Is guest
        'test@backlinkoo.com',
        {
          amount: 70,
          credits: 50,
          productName: 'Test 50 Credits'
        }
      );

      if (result.success) {
        setTestResults(prev => ({ ...prev, paymentServiceTest: 'success' }));
        toast({
          title: "✅ CreditPaymentService Works",
          description: "Payment service is properly configured"
        });
      } else {
        throw new Error(result.error || 'Payment service test failed');
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, paymentServiceTest: 'error' }));
      toast({
        title: "❌ CreditPaymentService Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const testUniversalStripeService = async () => {
    try {
      // Test stripeCheckout service
      const result = await stripeCheckout.purchaseCredits({
        credits: 50,
        amount: 70,
        productName: 'Test 50 Credits',
        isGuest: true,
        guestEmail: 'test@backlinkoo.com'
      });

      if (result.success) {
        setTestResults(prev => ({ ...prev, universalServiceTest: 'success' }));
        toast({
          title: "✅ UniversalStripeCheckout Works",
          description: "Universal checkout service is ready"
        });
      } else {
        throw new Error(result.error || 'Universal service test failed');
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, universalServiceTest: 'error' }));
      toast({
        title: "❌ UniversalStripeCheckout Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const runAllTests = async () => {
    setTestResults({
      configTest: 'pending',
      paymentServiceTest: 'pending',
      universalServiceTest: 'pending'
    });

    await testStripeConfiguration();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testCreditPaymentService();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testUniversalStripeService();
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">✅ Pass</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Fail</Badge>;
      default:
        return <Badge variant="secondary">⏳ Pending</Badge>;
    }
  };

  const allTestsPassed = Object.values(testResults).every(result => result === 'success');
  const hasFailures = Object.values(testResults).some(result => result === 'error');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Integration Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Environment Info */}
        <div className="space-y-2">
          <h3 className="font-medium">Environment Configuration</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Stripe Publishable Key:</span>
              <Badge variant={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_') ? 'default' : 'destructive'}>
                {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 
                  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_') ? '✅ Configured' : '❌ Invalid') : 
                  '❌ Missing'
                }
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Environment:</span>
              <Badge variant="secondary">
                {window.location.hostname === 'localhost' ? 'Development' : 'Production'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          <h3 className="font-medium">Test Results</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.configTest)}
                <span>Stripe Configuration</span>
              </div>
              {getStatusBadge(testResults.configTest)}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.paymentServiceTest)}
                <span>CreditPaymentService</span>
              </div>
              {getStatusBadge(testResults.paymentServiceTest)}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.universalServiceTest)}
                <span>UniversalStripeCheckout</span>
              </div>
              {getStatusBadge(testResults.universalServiceTest)}
            </div>
          </div>
        </div>

        {/* Overall Status */}
        {allTestsPassed && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">All Tests Passed!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your Stripe integration is ready for live credit purchases.
            </p>
          </div>
        )}

        {hasFailures && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Some Tests Failed</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Please check the configuration and try again.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={runAllTests} className="flex-1">
            Run All Tests
          </Button>
          <Button onClick={testStripeConfiguration} variant="outline">
            Test Config
          </Button>
          <Button onClick={testCreditPaymentService} variant="outline">
            Test Payment Service
          </Button>
          <Button onClick={testUniversalStripeService} variant="outline">
            Test Universal Service
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Note:</strong> These tests validate that your Stripe integration is properly configured.</p>
          <p>• Tests will create payment sessions but won't charge any cards</p>
          <p>• Replace placeholder API keys with live Stripe keys for production</p>
          <p>• Set up webhooks in Stripe Dashboard for credit balance updates</p>
        </div>
      </CardContent>
    </Card>
  );
}
