/**
 * Universal Stripe Checkout Service
 * Handles all Stripe payment flows with new window checkout
 * Supports credits, subscriptions, and premium upgrades
 */

import { supabase } from '@/integrations/supabase/client';
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
   * Open Stripe checkout in a new window for credit purchases
   */
  public async purchaseCredits(options: {
    credits: number;
    amount: number;
    productName?: string;
    isGuest?: boolean;
    guestEmail?: string;
  }): Promise<PaymentResult> {
    try {
      const paymentData = {
        amount: options.amount,
        credits: options.credits,
        productName: options.productName || `${options.credits} Backlink Credits`,
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail,
        paymentMethod: 'stripe'
      };

      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Payment creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.url) {
        // Open Stripe checkout in new window
        const checkoutWindow = window.open(
          result.url,
          'stripe-checkout',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        if (!checkoutWindow) {
          throw new Error('Failed to open payment window. Please allow popups for this site.');
        }

        // Listen for window close to handle completion
        this.handleCheckoutWindow(checkoutWindow, result.sessionId);

        return {
          success: true,
          url: result.url,
          sessionId: result.sessionId
        };
      } else {
        throw new Error('No payment URL received from server');
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Credit purchase failed'
      };
    }
  }

  /**
   * Open Stripe checkout in a new window for subscription purchases
   */
  public async purchaseSubscription(options: {
    plan: 'monthly' | 'yearly';
    isGuest?: boolean;
    guestEmail?: string;
  }): Promise<PaymentResult> {
    try {
      const subscriptionData = {
        plan: options.plan,
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail,
        paymentMethod: 'stripe'
      };

      const response = await fetch('/.netlify/functions/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Subscription creation failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.url) {
        // Open Stripe checkout in new window
        const checkoutWindow = window.open(
          result.url,
          'stripe-checkout',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        if (!checkoutWindow) {
          throw new Error('Failed to open payment window. Please allow popups for this site.');
        }

        // Listen for window close to handle completion
        this.handleCheckoutWindow(checkoutWindow, result.sessionId);

        return {
          success: true,
          url: result.url,
          sessionId: result.sessionId
        };
      } else {
        throw new Error('No subscription URL received from server');
      }
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
   */
  public async quickBuyCredits(creditAmount: 50 | 100 | 250 | 500 | number): Promise<PaymentResult> {
    const pricing = {
      50: 70,    // $1.40 per credit
      100: 140,
      250: 350,
      500: 700
    };

    const amount = pricing[creditAmount as keyof typeof pricing] || creditAmount * 1.40;

    return this.purchaseCredits({
      credits: creditAmount,
      amount: amount,
      productName: `${creditAmount} Premium Backlink Credits`,
      isGuest: false
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
   * Premium upgrade for existing users
   */
  public async upgradeToPremium(plan: 'monthly' | 'yearly'): Promise<PaymentResult> {
    return this.purchaseSubscription({
      plan: plan,
      isGuest: false
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

  /**
   * Test if Stripe is properly configured
   */
  public async testConfiguration(): Promise<{
    configured: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1,
          productName: 'Test Payment',
          paymentMethod: 'stripe',
          isGuest: true,
          guestEmail: 'test@backlinkoo.com'
        })
      });

      if (response.ok) {
        return { configured: true };
      } else {
        const errorText = await response.text();
        return { 
          configured: false, 
          error: `Configuration test failed: ${response.status} - ${errorText}` 
        };
      }
    } catch (error) {
      return {
        configured: false,
        error: error instanceof Error ? error.message : 'Configuration test failed'
      };
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
