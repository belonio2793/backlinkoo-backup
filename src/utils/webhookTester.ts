/**
 * Simple webhook testing utility
 */

export interface WebhookTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const webhookTester = {
  /**
   * Test webhook endpoint accessibility
   */
  async testEndpoint(): Promise<WebhookTestResult> {
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'health-check' })
      });

      if (response.ok) {
        const result = await response.text();
        return {
          success: true,
          message: 'Webhook endpoint is accessible',
          details: { status: response.status, response: result }
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          message: `Webhook endpoint returned ${response.status}`,
          details: { status: response.status, error }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Webhook endpoint unreachable: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  },

  /**
   * Test payment completion webhook
   */
  async testPaymentWebhook(): Promise<WebhookTestResult> {
    const mockEvent = {
      id: 'evt_test_payment',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_payment_session',
          object: 'checkout.session',
          amount_total: 2900, // $29.00 in cents
          customer_email: 'test.payment@example.com',
          metadata: {
            email: 'test.payment@example.com',
            credits: '100',
            isGuest: 'false',
            productName: 'Test Payment Credits'
          },
          mode: 'payment',
          payment_status: 'paid',
          status: 'complete'
        }
      }
    };

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'mock_signature_for_testing'
        },
        body: JSON.stringify(mockEvent)
      });

      const result = await response.text();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Payment webhook processed successfully',
          details: { response: result }
        };
      } else {
        return {
          success: false,
          message: `Payment webhook failed: HTTP ${response.status}`,
          details: { status: response.status, error: result }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Payment webhook error: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  },

  /**
   * Test subscription webhook
   */
  async testSubscriptionWebhook(): Promise<WebhookTestResult> {
    const mockEvent = {
      id: 'evt_test_subscription',
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test_subscription_invoice',
          object: 'invoice',
          customer: 'cus_test_subscription_customer',
          subscription: 'sub_test_subscription',
          amount_paid: 2900,
          status: 'paid'
        }
      }
    };

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'mock_signature_for_testing'
        },
        body: JSON.stringify(mockEvent)
      });

      const result = await response.text();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Subscription webhook processed successfully',
          details: { response: result }
        };
      } else {
        return {
          success: false,
          message: `Subscription webhook failed: HTTP ${response.status}`,
          details: { status: response.status, error: result }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Subscription webhook error: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  },

  /**
   * Run all webhook tests
   */
  async runAllTests(): Promise<{
    endpoint: WebhookTestResult;
    payment: WebhookTestResult;
    subscription: WebhookTestResult;
  }> {
    console.log('🧪 Starting webhook tests...');

    // Test endpoint health first
    const endpoint = await this.testEndpoint();
    console.log('Endpoint test:', endpoint.success ? '✅' : '❌', endpoint.message);

    // If endpoint is not accessible, skip other tests
    if (!endpoint.success) {
      return {
        endpoint,
        payment: { success: false, message: 'Skipped due to endpoint failure' },
        subscription: { success: false, message: 'Skipped due to endpoint failure' }
      };
    }

    // Test payment webhook
    const payment = await this.testPaymentWebhook();
    console.log('Payment test:', payment.success ? '✅' : '❌', payment.message);

    // Test subscription webhook
    const subscription = await this.testSubscriptionWebhook();
    console.log('Subscription test:', subscription.success ? '✅' : '❌', subscription.message);

    return { endpoint, payment, subscription };
  }
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).webhookTester = webhookTester;
}

export default webhookTester;
