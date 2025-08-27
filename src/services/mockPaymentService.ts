/**
 * Mock Payment Service for Development
 * Simulates payment flows without actual charges for development environments
 */

import { useToast } from '@/hooks/use-toast';

export interface MockPaymentOptions {
  amount: number;
  credits?: number;
  productName?: string;
  plan?: 'monthly' | 'yearly';
  isGuest?: boolean;
  guestEmail?: string;
}

export interface MockPaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

export class MockPaymentService {
  private static instance: MockPaymentService;
  
  public static getInstance(): MockPaymentService {
    if (!MockPaymentService.instance) {
      MockPaymentService.instance = new MockPaymentService();
    }
    return MockPaymentService.instance;
  }

  /**
   * Simulate credit purchase
   */
  public async purchaseCredits(options: MockPaymentOptions): Promise<MockPaymentResult> {
    console.log('🎭 Mock Payment Service: Simulating credit purchase', options);

    // Simulate network delay
    await this.simulateDelay(1500);

    // Random success/failure for realistic testing (95% success rate)
    const shouldSucceed = Math.random() > 0.05;

    if (!shouldSucceed) {
      return {
        success: false,
        error: 'Mock payment failed - this is for testing purposes only'
      };
    }

    const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a mock success URL that will trigger the success flow
    const successUrl = this.createMockSuccessUrl(sessionId, {
      credits: options.credits || 0,
      amount: options.amount,
      productName: options.productName || 'Mock Credits'
    });

    // Open a mock checkout window
    this.openMockCheckoutWindow(successUrl, sessionId);

    return {
      success: true,
      url: successUrl,
      sessionId: sessionId
    };
  }

  /**
   * Simulate subscription purchase
   */
  public async purchaseSubscription(options: MockPaymentOptions): Promise<MockPaymentResult> {
    console.log('🎭 Mock Payment Service: Simulating subscription purchase', options);

    // Simulate network delay
    await this.simulateDelay(2000);

    // Random success/failure for realistic testing (90% success rate)
    const shouldSucceed = Math.random() > 0.1;

    if (!shouldSucceed) {
      return {
        success: false,
        error: 'Mock subscription failed - this is for testing purposes only'
      };
    }

    const sessionId = `mock_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a mock success URL for subscription
    const successUrl = this.createMockSuccessUrl(sessionId, {
      plan: options.plan || 'monthly',
      amount: options.plan === 'yearly' ? 290 : 29,
      productName: `Premium ${options.plan || 'Monthly'} Subscription`
    });

    // Open a mock checkout window
    this.openMockCheckoutWindow(successUrl, sessionId, 'subscription');

    return {
      success: true,
      url: successUrl,
      sessionId: sessionId
    };
  }

  /**
   * Create a mock success URL with embedded parameters
   */
  private createMockSuccessUrl(sessionId: string, options: any): string {
    const params = new URLSearchParams({
      session_id: sessionId,
      mock: 'true',
      ...options
    });

    return `${window.location.origin}/payment-success?${params.toString()}`;
  }

  /**
   * Open a mock checkout window that simulates the Stripe checkout process
   */
  private openMockCheckoutWindow(successUrl: string, sessionId: string, type: 'credits' | 'subscription' = 'credits'): void {
    // Create a mock checkout page content
    const mockCheckoutHtml = this.createMockCheckoutHTML(successUrl, sessionId, type);
    
    // Open new window with mock checkout
    const checkoutWindow = window.open('', 'mock-checkout', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (checkoutWindow) {
      checkoutWindow.document.write(mockCheckoutHtml);
      checkoutWindow.document.close();

      // Auto-complete after a delay (simulate user interaction)
      setTimeout(() => {
        if (!checkoutWindow.closed) {
          this.completeMockPayment(checkoutWindow, sessionId);
        }
      }, 5000);
    }
  }

  /**
   * Create HTML for the mock checkout window
   */
  private createMockCheckoutHTML(successUrl: string, sessionId: string, type: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mock Stripe Checkout</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: #f7f9fc;
          }
          .checkout-container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          }
          .stripe-logo {
            width: 60px;
            height: 25px;
            background: #635bff;
            border-radius: 4px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .mock-badge {
            background: #ff6b35;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
          }
          .progress-bar {
            width: 100%;
            height: 4px;
            background: #e3e8ee;
            border-radius: 2px;
            overflow: hidden;
            margin: 20px 0;
          }
          .progress-fill {
            height: 100%;
            background: #00d924;
            border-radius: 2px;
            width: 0%;
            animation: progress 5s ease-in-out forwards;
          }
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .buttons {
            display: flex;
            gap: 10px;
            margin-top: 30px;
          }
          .btn {
            padding: 12px 24px;
            border-radius: 6px;
            border: none;
            font-weight: 500;
            cursor: pointer;
            flex: 1;
          }
          .btn-primary {
            background: #635bff;
            color: white;
          }
          .btn-secondary {
            background: #e3e8ee;
            color: #425466;
          }
        </style>
      </head>
      <body>
        <div class="checkout-container">
          <div class="stripe-logo">stripe</div>
          <div class="mock-badge">🎭 DEVELOPMENT MODE</div>
          
          <h2>Mock ${type === 'subscription' ? 'Subscription' : 'Credit'} Purchase</h2>
          <p>This is a simulated payment for development purposes. No real charges will be made.</p>
          
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          
          <p id="status">Processing payment...</p>
          
          <div class="buttons">
            <button class="btn btn-primary" onclick="completePayment()">
              ✅ Complete Payment
            </button>
            <button class="btn btn-secondary" onclick="cancelPayment()">
              ❌ Cancel
            </button>
          </div>
        </div>
        
        <script>
          let completed = false;
          
          function completePayment() {
            if (completed) return;
            completed = true;
            
            document.getElementById('status').textContent = '✅ Payment completed successfully!';
            
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'stripe-payment-success',
                sessionId: '${sessionId}',
                mock: true
              }, '*');
            }
            
            setTimeout(() => {
              window.close();
            }, 1500);
          }
          
          function cancelPayment() {
            if (completed) return;
            completed = true;
            
            document.getElementById('status').textContent = '❌ Payment cancelled';
            
            // Notify parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'stripe-payment-cancelled',
                sessionId: '${sessionId}',
                mock: true
              }, '*');
            }
            
            setTimeout(() => {
              window.close();
            }, 1500);
          }
          
          // Auto-complete after 5 seconds
          setTimeout(() => {
            if (!completed) {
              completePayment();
            }
          }, 5000);
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Complete the mock payment
   */
  private completeMockPayment(window: Window, sessionId: string): void {
    // Trigger success event
    window.postMessage({
      type: 'stripe-payment-success',
      sessionId: sessionId,
      mock: true
    }, '*');

    // Close window after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  }

  /**
   * Simulate network delay
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test if mock service is available
   */
  public isAvailable(): boolean {
    return true; // Always available in development
  }

  /**
   * Get mock configuration status
   */
  public getStatus(): {
    available: boolean;
    mode: string;
    features: string[];
  } {
    return {
      available: true,
      mode: 'development',
      features: [
        'Credit purchases',
        'Subscription purchases',
        'Success/failure simulation',
        'Realistic checkout flow',
        'Window-based checkout'
      ]
    };
  }
}

// Export singleton instance
export const mockPaymentService = MockPaymentService.getInstance();

// Export convenience functions
export const mockBuyCredits = (credits: number, amount: number) => 
  mockPaymentService.purchaseCredits({ amount, credits });

export const mockUpgradeToPremium = (plan: 'monthly' | 'yearly') => 
  mockPaymentService.purchaseSubscription({ plan, amount: plan === 'yearly' ? 290 : 29 });
