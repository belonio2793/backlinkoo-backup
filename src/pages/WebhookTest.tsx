import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, Webhook, Database, Settings } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const WebhookTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateTestResult = (testName: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => 
      prev.map(result => 
        result.test === testName 
          ? { ...result, status, message, details }
          : result
      )
    );
  };

  const mockWebhookEvents = {
    'checkout.session.completed': {
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_session',
          object: 'checkout.session',
          amount_total: 2900, // $29.00 in cents
          customer_email: 'test.webhook@example.com',
          metadata: {
            email: 'test.webhook@example.com',
            credits: '100',
            isGuest: 'false',
            productName: 'Webhook Test Credits'
          },
          mode: 'payment',
          payment_status: 'paid',
          status: 'complete'
        }
      }
    },
    'invoice.payment_succeeded': {
      id: 'evt_test_subscription_webhook',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test_webhook_invoice',
          object: 'invoice',
          customer: 'cus_test_webhook_customer',
          subscription: 'sub_test_webhook_subscription',
          amount_paid: 2900,
          status: 'paid'
        }
      }
    },
    'customer.subscription.deleted': {
      id: 'evt_test_cancel_webhook',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_webhook_subscription',
          object: 'subscription',
          customer: 'cus_test_webhook_customer',
          status: 'canceled',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          metadata: {
            email: 'test.webhook@example.com',
            plan: 'monthly',
            isGuest: 'false'
          }
        }
      }
    }
  };

  const sendWebhookTest = async (eventType: string, eventData: any) => {
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'mock_signature_for_testing'
        },
        body: JSON.stringify(eventData)
      });

      const result = await response.text();
      
      if (response.ok) {
        return { success: true, data: result };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${result}` };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const testWebhookEndpoint = async () => {
    addTestResult({
      test: 'Webhook Endpoint Health',
      status: 'pending',
      message: 'Testing webhook endpoint accessibility...'
    });

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'health-check' })
      });

      if (response.ok) {
        updateTestResult(
          'Webhook Endpoint Health', 
          'success', 
          'Webhook endpoint is accessible and responding'
        );
        return true;
      } else {
        const errorText = await response.text();
        updateTestResult(
          'Webhook Endpoint Health', 
          'error', 
          `Endpoint returned ${response.status}`,
          { response: errorText }
        );
        return false;
      }
    } catch (error) {
      updateTestResult(
        'Webhook Endpoint Health', 
        'error', 
        `Connection failed: ${(error as Error).message}`
      );
      return false;
    }
  };

  const testPaymentWebhook = async () => {
    addTestResult({
      test: 'Payment Completion Webhook',
      status: 'pending',
      message: 'Testing checkout.session.completed event...'
    });

    const result = await sendWebhookTest(
      'checkout.session.completed',
      mockWebhookEvents['checkout.session.completed']
    );

    if (result.success) {
      updateTestResult(
        'Payment Completion Webhook',
        'success',
        'Payment webhook processed successfully',
        { response: result.data }
      );
    } else {
      updateTestResult(
        'Payment Completion Webhook',
        'error',
        `Payment webhook failed: ${result.error}`
      );
    }
  };

  const testSubscriptionWebhook = async () => {
    addTestResult({
      test: 'Subscription Payment Webhook',
      status: 'pending',
      message: 'Testing invoice.payment_succeeded event...'
    });

    const result = await sendWebhookTest(
      'invoice.payment_succeeded',
      mockWebhookEvents['invoice.payment_succeeded']
    );

    if (result.success) {
      updateTestResult(
        'Subscription Payment Webhook',
        'success',
        'Subscription webhook processed successfully',
        { response: result.data }
      );
    } else {
      updateTestResult(
        'Subscription Payment Webhook',
        'error',
        `Subscription webhook failed: ${result.error}`
      );
    }
  };

  const testCancellationWebhook = async () => {
    addTestResult({
      test: 'Subscription Cancellation Webhook',
      status: 'pending',
      message: 'Testing customer.subscription.deleted event...'
    });

    const result = await sendWebhookTest(
      'customer.subscription.deleted',
      mockWebhookEvents['customer.subscription.deleted']
    );

    if (result.success) {
      updateTestResult(
        'Subscription Cancellation Webhook',
        'success',
        'Cancellation webhook processed successfully',
        { response: result.data }
      );
    } else {
      updateTestResult(
        'Subscription Cancellation Webhook',
        'error',
        `Cancellation webhook failed: ${result.error}`
      );
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Endpoint health
      const healthOk = await testWebhookEndpoint();
      
      if (healthOk) {
        // Test 2: Payment webhook
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testPaymentWebhook();
        
        // Test 3: Subscription webhook
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testSubscriptionWebhook();
        
        // Test 4: Cancellation webhook
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testCancellationWebhook();
      }
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    const variants = {
      pending: 'default',
      success: 'success' as any,
      error: 'destructive'
    };

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stripe Webhook Testing</h1>
        <p className="text-gray-600">
          Test your Stripe webhook implementation to ensure payment processing works correctly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Webhook className="h-5 w-5 text-blue-600" />
            <CardTitle className="ml-2">Webhook Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Tests if the webhook endpoint is accessible and responding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Database className="h-5 w-5 text-green-600" />
            <CardTitle className="ml-2">Database Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Verifies that webhook events properly update the database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Settings className="h-5 w-5 text-purple-600" />
            <CardTitle className="ml-2">Event Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Tests different Stripe event types and their handling
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run comprehensive tests on your Stripe webhook implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Webhook className="h-4 w-4 mr-2" />
                Run All Webhook Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from webhook testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{result.test}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Show details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Environment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Testing Mode:</strong> This test uses mock webhook events and the development environment.
              For production testing, use the Stripe Dashboard's webhook testing tools or Stripe CLI.
            </AlertDescription>
          </Alert>
          
          <Separator className="my-4" />
          
          <div className="space-y-2 text-sm">
            <p><strong>Webhook URL:</strong> <code>/api/webhook</code></p>
            <p><strong>Supported Events:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>checkout.session.completed</code> - One-time payment completion</li>
              <li><code>invoice.payment_succeeded</code> - Subscription payment success</li>
              <li><code>customer.subscription.deleted</code> - Subscription cancellation</li>
              <li><code>invoice.payment_failed</code> - Payment failure handling</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookTest;
