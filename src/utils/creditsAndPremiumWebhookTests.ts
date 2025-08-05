/**
 * Comprehensive Webhook Tests for Credits Purchase and Premium Subscription
 * Tests the specific scenarios across all payment modals
 */

export interface CreditsPurchaseScenario {
  credits: number;
  amount: number;
  description: string;
  testEmail: string;
}

export interface PremiumSubscriptionScenario {
  plan: 'monthly' | 'yearly';
  amount: number;
  description: string;
  testEmail: string;
}

export interface WebhookTestResult {
  scenario: string;
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

const CREDIT_SCENARIOS: CreditsPurchaseScenario[] = [
  {
    credits: 50,
    amount: 35.00,
    description: 'Small credits package (50 credits)',
    testEmail: 'test.credits.50@example.com'
  },
  {
    credits: 100,
    amount: 70.00,
    description: 'Popular credits package (100 credits)',
    testEmail: 'test.credits.100@example.com'
  },
  {
    credits: 250,
    amount: 175.00,
    description: 'Large credits package (250 credits)',
    testEmail: 'test.credits.250@example.com'
  },
  {
    credits: 500,
    amount: 350.00,
    description: 'Enterprise credits package (500 credits)',
    testEmail: 'test.credits.500@example.com'
  }
];

const PREMIUM_SCENARIOS: PremiumSubscriptionScenario[] = [
  {
    plan: 'monthly',
    amount: 29.00,
    description: 'Monthly Premium Subscription ($29/month)',
    testEmail: 'test.premium.monthly@example.com'
  },
  {
    plan: 'yearly',
    amount: 290.00,
    description: 'Yearly Premium Subscription ($290/year)',
    testEmail: 'test.premium.yearly@example.com'
  }
];

export class CreditsAndPremiumWebhookTester {
  private baseUrl: string;

  constructor() {
    this.baseUrl = window.location.origin;
  }

  /**
   * Test credits purchase webhook
   */
  async testCreditsPurchase(scenario: CreditsPurchaseScenario): Promise<WebhookTestResult> {
    const sessionId = `cs_test_credits_${scenario.credits}_${Date.now()}`;
    
    const mockEvent = {
      id: `evt_test_credits_${scenario.credits}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          amount_total: Math.round(scenario.amount * 100), // Convert to cents
          customer_email: scenario.testEmail,
          metadata: {
            email: scenario.testEmail,
            credits: scenario.credits.toString(),
            isGuest: 'false',
            productName: `${scenario.credits} Backlink Credits`
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
          scenario: scenario.description,
          success: true,
          message: `Credits purchase webhook processed successfully`,
          details: {
            credits: scenario.credits,
            amount: scenario.amount,
            sessionId,
            response: result
          },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          scenario: scenario.description,
          success: false,
          message: `Credits webhook failed: HTTP ${response.status}`,
          details: {
            status: response.status,
            error: result,
            sessionId
          },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        scenario: scenario.description,
        success: false,
        message: `Credits webhook error: ${(error as Error).message}`,
        details: { error: (error as Error).message },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test premium subscription webhook (invoice.payment_succeeded)
   */
  async testPremiumSubscription(scenario: PremiumSubscriptionScenario): Promise<WebhookTestResult> {
    const subscriptionId = `sub_test_premium_${scenario.plan}_${Date.now()}`;
    const customerId = `cus_test_premium_${scenario.plan}_${Date.now()}`;
    
    const mockEvent = {
      id: `evt_test_premium_${scenario.plan}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: `in_test_premium_${scenario.plan}_${Date.now()}`,
          object: 'invoice',
          customer: customerId,
          subscription: subscriptionId,
          amount_paid: Math.round(scenario.amount * 100), // Convert to cents
          status: 'paid',
          period_start: Math.floor(Date.now() / 1000),
          period_end: Math.floor((Date.now() + (scenario.plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000) / 1000)
        }
      }
    };

    try {
      // First, we need to create a mock subscription object for the webhook to retrieve
      const mockSubscription = {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + (scenario.plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000) / 1000),
        metadata: {
          email: scenario.testEmail,
          plan: scenario.plan,
          isGuest: 'false'
        }
      };

      // Since we can't actually create Stripe objects, we'll test with a modified webhook
      // that includes the subscription data directly
      const enhancedMockEvent = {
        ...mockEvent,
        data: {
          ...mockEvent.data,
          subscription_data: mockSubscription // Include subscription data for testing
        }
      };

      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'mock_signature_for_testing'
        },
        body: JSON.stringify(mockEvent) // Use original event format
      });

      const result = await response.text();
      
      if (response.ok) {
        return {
          scenario: scenario.description,
          success: true,
          message: `Premium subscription webhook processed successfully`,
          details: {
            plan: scenario.plan,
            amount: scenario.amount,
            subscriptionId,
            customerId,
            response: result
          },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          scenario: scenario.description,
          success: false,
          message: `Premium webhook failed: HTTP ${response.status}`,
          details: {
            status: response.status,
            error: result,
            subscriptionId
          },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        scenario: scenario.description,
        success: false,
        message: `Premium webhook error: ${(error as Error).message}`,
        details: { error: (error as Error).message },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test guest checkout for credits
   */
  async testGuestCreditsPurchase(scenario: CreditsPurchaseScenario): Promise<WebhookTestResult> {
    const guestEmail = `guest.${scenario.testEmail}`;
    const sessionId = `cs_test_guest_credits_${scenario.credits}_${Date.now()}`;
    
    const mockEvent = {
      id: `evt_test_guest_credits_${scenario.credits}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: sessionId,
          object: 'checkout.session',
          amount_total: Math.round(scenario.amount * 100),
          customer_email: guestEmail,
          metadata: {
            email: guestEmail,
            credits: scenario.credits.toString(),
            isGuest: 'true', // This is the key difference
            productName: `${scenario.credits} Backlink Credits (Guest)`
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
          scenario: `${scenario.description} (Guest Checkout)`,
          success: true,
          message: `Guest credits purchase webhook processed successfully`,
          details: {
            credits: scenario.credits,
            amount: scenario.amount,
            guestEmail,
            sessionId,
            response: result
          },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          scenario: `${scenario.description} (Guest Checkout)`,
          success: false,
          message: `Guest credits webhook failed: HTTP ${response.status}`,
          details: {
            status: response.status,
            error: result,
            sessionId
          },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        scenario: `${scenario.description} (Guest Checkout)`,
        success: false,
        message: `Guest credits webhook error: ${(error as Error).message}`,
        details: { error: (error as Error).message },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run all credits purchase tests
   */
  async testAllCreditsPurchases(): Promise<WebhookTestResult[]> {
    console.log('🧪 Testing all credits purchase scenarios...');
    
    const results: WebhookTestResult[] = [];
    
    for (const scenario of CREDIT_SCENARIOS) {
      console.log(`Testing: ${scenario.description}`);
      
      // Test regular user checkout
      const userResult = await this.testCreditsPurchase(scenario);
      results.push(userResult);
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test guest checkout
      const guestResult = await this.testGuestCreditsPurchase(scenario);
      results.push(guestResult);
      
      // Wait between scenarios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Run all premium subscription tests
   */
  async testAllPremiumSubscriptions(): Promise<WebhookTestResult[]> {
    console.log('🧪 Testing all premium subscription scenarios...');
    
    const results: WebhookTestResult[] = [];
    
    for (const scenario of PREMIUM_SCENARIOS) {
      console.log(`Testing: ${scenario.description}`);
      
      const result = await this.testPremiumSubscription(scenario);
      results.push(result);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTests(): Promise<{
    credits: WebhookTestResult[];
    premium: WebhookTestResult[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      successRate: string;
    };
  }> {
    console.log('🚀 Starting comprehensive webhook tests for credits and premium...');
    
    const creditsResults = await this.testAllCreditsPurchases();
    const premiumResults = await this.testAllPremiumSubscriptions();
    
    const allResults = [...creditsResults, ...premiumResults];
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.length - passed;
    const successRate = ((passed / allResults.length) * 100).toFixed(1);
    
    console.log(`✅ Tests completed: ${passed}/${allResults.length} passed (${successRate}%)`);
    
    return {
      credits: creditsResults,
      premium: premiumResults,
      summary: {
        totalTests: allResults.length,
        passed,
        failed,
        successRate: `${successRate}%`
      }
    };
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).CreditsAndPremiumWebhookTester = CreditsAndPremiumWebhookTester;
  (window as any).creditsAndPremiumWebhookTester = new CreditsAndPremiumWebhookTester();
}

export default CreditsAndPremiumWebhookTester;
