/**
 * Production Stripe Payment Service
 * Real Stripe payments only - no demo mode or fallbacks
 */

export interface StripePaymentOptions {
  amount: number;
  credits?: number;
  productName?: string;
  plan?: 'monthly' | 'yearly';
  isGuest?: boolean;
  guestEmail?: string;
  type: 'credits' | 'subscription';
}

export interface StripePaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

class StripePaymentService {
  private publishableKey: string;

  constructor() {
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!this.publishableKey || !this.publishableKey.startsWith('pk_')) {
      throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is required and must be a valid Stripe key');
    }

    console.log('🔧 Stripe Production Service Initialized');
  }

  /**
   * Create payment session for credits
   */
  async createPayment(options: StripePaymentOptions): Promise<StripePaymentResult> {
    try {
      const endpoint = '/.netlify/functions/create-payment';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: options.amount,
          productName: options.productName || `${options.credits || 0} Backlink Credits`,
          credits: options.credits || 0,
          isGuest: options.isGuest || false,
          guestEmail: options.guestEmail,
          paymentMethod: 'stripe'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Payment creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.url) {
        throw new Error('No payment URL received from server');
      }

      // Open checkout in new window
      this.openCheckoutWindow(result.url, result.sessionId, 'payment');
      
      return {
        success: true,
        url: result.url,
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  /**
   * Create subscription session
   */
  async createSubscription(options: StripePaymentOptions): Promise<StripePaymentResult> {
    try {
      const endpoint = '/.netlify/functions/create-subscription';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: options.plan,
          isGuest: options.isGuest || false,
          guestEmail: options.guestEmail,
          paymentMethod: 'stripe'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || `Subscription creation failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.url) {
        throw new Error('No subscription URL received from server');
      }

      // Open checkout in new window
      this.openCheckoutWindow(result.url, result.sessionId, 'subscription');
      
      return {
        success: true,
        url: result.url,
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Subscription creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription creation failed'
      };
    }
  }

  /**
   * Open Stripe checkout in new window
   */
  private openCheckoutWindow(url: string, sessionId: string, type: 'payment' | 'subscription'): void {
    const checkoutWindow = window.open(
      url,
      'stripe-checkout',
      'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
    );

    if (!checkoutWindow) {
      // Fallback to current window if popup blocked
      window.location.href = url;
      return;
    }

    // Monitor window for completion
    this.monitorCheckoutWindow(checkoutWindow, sessionId, type);
  }

  /**
   * Monitor checkout window for completion
   */
  private monitorCheckoutWindow(checkoutWindow: Window, sessionId: string, type: 'payment' | 'subscription'): void {
    const checkInterval = setInterval(() => {
      if (checkoutWindow.closed) {
        clearInterval(checkInterval);
        
        // Check payment status
        setTimeout(() => {
          this.handleCheckoutComplete(sessionId, type);
        }, 1000);
      }
    }, 1000);

    // Auto-cleanup after 30 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!checkoutWindow.closed) {
        checkoutWindow.close();
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Handle checkout completion
   */
  private async handleCheckoutComplete(sessionId: string, type: 'payment' | 'subscription'): Promise<void> {
    try {
      // Verify payment status
      const response = await fetch(`/.netlify/functions/verify-payment?session_id=${sessionId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showSuccessNotification(type);
          // Refresh page to show updated status
          setTimeout(() => window.location.reload(), 2000);
        } else {
          this.showCancelledNotification();
        }
      } else {
        this.showCancelledNotification();
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      this.showCancelledNotification();
    }
  }

  /**
   * Show success notification
   */
  private showSuccessNotification(type: 'payment' | 'subscription'): void {
    const message = type === 'payment' 
      ? 'Payment successful! Credits will be added to your account.'
      : 'Subscription activated! Premium features are now available.';

    // Use toast if available
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast({
        title: '✅ Success!',
        description: message,
        duration: 5000
      });
    } else {
      alert(message);
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent(`stripe-${type}-success`, {
      detail: { type, timestamp: Date.now() }
    }));
  }

  /**
   * Show cancelled notification
   */
  private showCancelledNotification(): void {
    // Use toast if available
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. No charges were made.',
        variant: 'secondary'
      });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('stripe-payment-cancelled'));
  }

  /**
   * Quick credit purchase presets
   */
  async quickPurchase(credits: 50 | 100 | 250 | 500, guestEmail?: string): Promise<StripePaymentResult> {
    const pricing = {
      50: 70,    // $1.40 per credit
      100: 140,  // $1.40 per credit
      250: 350,  // $1.40 per credit
      500: 700   // $1.40 per credit
    };

    return this.createPayment({
      amount: pricing[credits],
      credits,
      productName: `${credits} Premium Backlink Credits`,
      type: 'credits',
      isGuest: !!guestEmail,
      guestEmail
    });
  }

  /**
   * Premium subscription purchase
   */
  async purchasePremium(plan: 'monthly' | 'yearly', guestEmail?: string): Promise<StripePaymentResult> {
    return this.createSubscription({
      plan,
      amount: plan === 'monthly' ? 29 : 290,
      type: 'subscription',
      isGuest: !!guestEmail,
      guestEmail
    });
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; mode: string } {
    return {
      configured: !!this.publishableKey && this.publishableKey.startsWith('pk_'),
      mode: 'production'
    };
  }
}

// Export singleton instance
export const stripePaymentService = new StripePaymentService();

// Export convenience functions
export const buyCredits = (credits: number, amount: number, guestEmail?: string) =>
  stripePaymentService.createPayment({ 
    amount, 
    credits, 
    type: 'credits', 
    isGuest: !!guestEmail, 
    guestEmail 
  });

export const quickBuyCredits = (credits: 50 | 100 | 250 | 500, guestEmail?: string) =>
  stripePaymentService.quickPurchase(credits, guestEmail);

export const upgradeToPremium = (plan: 'monthly' | 'yearly', guestEmail?: string) =>
  stripePaymentService.purchasePremium(plan, guestEmail);

export default stripePaymentService;
