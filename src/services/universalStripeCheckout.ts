/**
 * Universal Stripe Checkout Service
 * Now powered by Stripe Wrapper with Supabase integration
 * Handles all Stripe payment flows with new window checkout
 * Supports credits, subscriptions, and premium upgrades
 */

import { stripeWrapper, type PaymentOptions as WrapperPaymentOptions, type SubscriptionOptions as WrapperSubscriptionOptions, type PaymentResult as WrapperPaymentResult } from './stripeWrapper';
import { useAuth } from '@/hooks/useAuth';

export interface PaymentOptions {
  amount?: number;
  credits?: number;
  productName?: string;
  plan?: 'monthly' | 'yearly';
  isGuest?: boolean;
  guestEmail?: string;
  paymentType: 'credits' | 'subscription';
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

export class UniversalStripeCheckout {
  private static instance: UniversalStripeCheckout;
  
  public static getInstance(): UniversalStripeCheckout {
    if (!UniversalStripeCheckout.instance) {
      UniversalStripeCheckout.instance = new UniversalStripeCheckout();
    }
    return UniversalStripeCheckout.instance;
  }


  /**
   * Extract meaningful error message from any error object
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      const errorObj = error as any;

      // Try multiple common error properties
      const message = errorObj.message ||
                     errorObj.error ||
                     errorObj.details ||
                     errorObj.description ||
                     errorObj.msg ||
                     errorObj.statusText;

      if (message && typeof message === 'string') {
        return message;
      }

      // Create a descriptive message from available properties
      const parts = [];
      if (errorObj.status) parts.push(`Status: ${errorObj.status}`);
      if (errorObj.endpoint) parts.push(`Endpoint: ${errorObj.endpoint}`);
      if (errorObj.type) parts.push(`Type: ${errorObj.type}`);

      if (parts.length > 0) {
        return parts.join(', ');
      }

      // Last resort - try to stringify safely
      try {
        const jsonStr = JSON.stringify(errorObj);
        if (jsonStr && jsonStr !== '{}' && jsonStr.length < 200) {
          return `Error: ${jsonStr}`;
        }
      } catch {
        // Failed to stringify
      }
    }

    return 'Unknown error (unable to extract details)';
  }

  /**
   * Open Stripe checkout in a new window for credit purchases (Wrapper-powered)
   */
  public async purchaseCredits(options: {
    credits: number;
    amount: number;
    productName?: string;
    isGuest?: boolean;
    guestEmail?: string;
  }): Promise<PaymentResult> {
    try {
      const paymentOptions: WrapperPaymentOptions = {
        amount: options.amount,
        credits: options.credits,
        productName: options.productName || `${options.credits} Backlink Credits`,
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail
      };

      console.log('🔄 Creating payment via Stripe Wrapper...');
      const result = await stripeWrapper.createPayment(paymentOptions);

      console.log('📥 Wrapper response:', {
        success: result.success,
        hasUrl: !!result.url,
        method: result.method,
        fallbackUsed: result.fallbackUsed
      });

      if (!result.success) {
        throw new Error(result.error || 'Payment creation failed');
      }

      if (!result.url) {
        throw new Error('No checkout URL received from payment service');
      }

      // Open Stripe checkout using wrapper
      const checkoutWindow = stripeWrapper.openCheckoutWindow(result.url, result.sessionId);

      if (checkoutWindow) {
        // Listen for window close to handle completion
        this.handleCheckoutWindow(checkoutWindow, result.sessionId);
      }

      return {
        success: true,
        url: result.url,
        sessionId: result.sessionId
      };

    } catch (error) {
      console.error('❌ Payment creation failed:', this.extractErrorMessage(error));

      const finalErrorMessage = this.extractErrorMessage(error);
      return {
        success: false,
        error: `Payment failed: ${finalErrorMessage}`
      };
    }
  }

  /**
   * Open Stripe checkout in a new window for subscription purchases (Wrapper-powered)
   */
  public async purchaseSubscription(options: {
    plan: 'monthly' | 'yearly';
    isGuest?: boolean;
    guestEmail?: string;
  }): Promise<PaymentResult> {
    try {
      const subscriptionOptions: WrapperSubscriptionOptions = {
        plan: options.plan,
        tier: 'premium',
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail
      };

      console.log('🔄 Creating subscription via Stripe Wrapper...');
      const result = await stripeWrapper.createSubscription(subscriptionOptions);

      console.log('📥 Wrapper subscription response:', {
        success: result.success,
        hasUrl: !!result.url,
        method: result.method,
        fallbackUsed: result.fallbackUsed
      });

      if (!result.success) {
        throw new Error(result.error || 'Subscription creation failed');
      }

      if (!result.url) {
        throw new Error('No subscription URL received from service');
      }

      // Open Stripe checkout using wrapper
      const checkoutWindow = stripeWrapper.openCheckoutWindow(result.url, result.sessionId);

      if (checkoutWindow) {
        // Listen for window close to handle completion
        this.handleCheckoutWindow(checkoutWindow, result.sessionId);
      }

      return {
        success: true,
        url: result.url,
        sessionId: result.sessionId
      };
    } catch (error) {
      console.error('Subscription purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subscription purchase failed'
      };
    }
  }

  /**
   * Quick buy credits with predefined amounts
   * Auto-detects authentication status and handles appropriately
   */
  public async quickBuyCredits(creditAmount: 50 | 100 | 250 | 500 | number): Promise<PaymentResult> {
    const pricing = {
      50: 70,    // $1.40 per credit
      100: 140,
      250: 350,
      500: 700
    };

    const amount = pricing[creditAmount as keyof typeof pricing] || creditAmount * 1.40;

    // Check authentication status
    const { data: { session }, error } = await supabase.auth.getSession();
    const isAuthenticated = !!session?.user && !error;

    return this.purchaseCredits({
      credits: creditAmount,
      amount: amount,
      productName: `${creditAmount} Premium Backlink Credits`,
      isGuest: !isAuthenticated,
      guestEmail: isAuthenticated ? undefined : undefined // Will be handled by caller if needed
    });
  }

  /**
   * Guest quick buy with email
   */
  public async guestQuickBuy(options: {
    credits: number;
    amount: number;
    email: string;
  }): Promise<PaymentResult> {
    return this.purchaseCredits({
      credits: options.credits,
      amount: options.amount,
      productName: `${options.credits} Premium Backlink Credits`,
      isGuest: true,
      guestEmail: options.email
    });
  }

  /**
   * Premium upgrade - auto-detects authentication status
   */
  public async upgradeToPremium(plan: 'monthly' | 'yearly'): Promise<PaymentResult> {
    // Check authentication status
    const { data: { session }, error } = await supabase.auth.getSession();
    const isAuthenticated = !!session?.user && !error;

    return this.purchaseSubscription({
      plan: plan,
      isGuest: !isAuthenticated
    });
  }

  /**
   * Guest premium upgrade
   */
  public async guestPremiumUpgrade(options: {
    plan: 'monthly' | 'yearly';
    email: string;
  }): Promise<PaymentResult> {
    return this.purchaseSubscription({
      plan: options.plan,
      isGuest: true,
      guestEmail: options.email
    });
  }

  /**
   * Handle checkout window events
   */
  private handleCheckoutWindow(checkoutWindow: Window, sessionId: string): void {
    const checkClosed = setInterval(() => {
      if (checkoutWindow.closed) {
        clearInterval(checkClosed);
        // Check if payment was successful
        this.checkPaymentStatus(sessionId);
      }
    }, 1000);

    // Listen for messages from the checkout window
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'stripe-payment-success') {
        clearInterval(checkClosed);
        checkoutWindow.close();
        this.handlePaymentSuccess(event.data.sessionId);
        window.removeEventListener('message', messageListener);
      } else if (event.data.type === 'stripe-payment-cancelled') {
        clearInterval(checkClosed);
        checkoutWindow.close();
        this.handlePaymentCancelled();
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);

    // Auto-close after 30 minutes
    setTimeout(() => {
      if (!checkoutWindow.closed) {
        checkoutWindow.close();
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
      }
    }, 30 * 60 * 1000);
  }

  /**
   * Check payment status after window closes
   */
  private async checkPaymentStatus(sessionId: string): Promise<void> {
    try {
      // Check with our backend to see if payment was completed
      const response = await fetch(`/.netlify/functions/verify-payment?session_id=${sessionId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.handlePaymentSuccess(sessionId);
        } else {
          this.handlePaymentCancelled();
        }
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
      // Assume cancelled if we can't verify
      this.handlePaymentCancelled();
    }
  }

  /**
   * Handle successful payment
   */
  private handlePaymentSuccess(sessionId: string): void {
    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('stripe-payment-success', {
      detail: { sessionId }
    }));

    // Show success notification
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast({
        title: 'Payment Successful!',
        description: 'Your purchase has been completed. Credits will be added to your account shortly.',
        duration: 5000
      });
    }

    // Refresh the page after a short delay to show updated credits/status
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  /**
   * Handle cancelled payment
   */
  private handlePaymentCancelled(): void {
    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('stripe-payment-cancelled'));

    // Show cancelled notification
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. No charges were made.',
        variant: 'secondary'
      });
    }
  }

}

// Export singleton instance
export const stripeCheckout = UniversalStripeCheckout.getInstance();

// Export convenience functions
export const buyCredits = (credits: number, amount: number) => 
  stripeCheckout.purchaseCredits({ credits, amount });

export const quickBuyCredits = (amount: 50 | 100 | 250 | 500) => 
  stripeCheckout.quickBuyCredits(amount);

export const upgradeToPremium = (plan: 'monthly' | 'yearly') => 
  stripeCheckout.upgradeToPremium(plan);

export const guestPurchase = (credits: number, amount: number, email: string) =>
  stripeCheckout.guestQuickBuy({ credits, amount, email });
