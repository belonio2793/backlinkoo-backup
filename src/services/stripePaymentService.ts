/**
 * Production Stripe Payment Service
 * Now powered by Stripe Wrapper with Supabase integration
 */

import { stripeWrapper, type PaymentOptions, type SubscriptionOptions, type PaymentResult } from './stripeWrapper';

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
  method?: string;
  fallbackUsed?: boolean;
}

class StripePaymentService {
  constructor() {
    console.log('🔧 Stripe Production Service Initialized (Wrapper-powered)');
  }

  /**
   * Create payment session for credits using Stripe Wrapper
   */
  async createPayment(options: StripePaymentOptions): Promise<StripePaymentResult> {
    try {
      console.log('💳 Creating Stripe payment via Wrapper');

      if (options.type === 'subscription') {
        const subscriptionOptions: SubscriptionOptions = {
          plan: options.plan || 'monthly',
          tier: 'premium',
          isGuest: options.isGuest,
          guestEmail: options.guestEmail
        };

        const result = await stripeWrapper.createSubscription(subscriptionOptions);
        return this.convertResult(result);
      } else {
        const paymentOptions: PaymentOptions = {
          amount: options.amount,
          credits: options.credits,
          productName: options.productName,
          isGuest: options.isGuest,
          guestEmail: options.guestEmail
        };

        const result = await stripeWrapper.createPayment(paymentOptions);
        return this.convertResult(result);
      }

    } catch (error: any) {
      console.error('❌ Payment creation error:', error);

      return {
        success: false,
        error: error.message || 'Failed to create payment session'
      };
    }
  }

  /**
   * Create subscription session using Stripe Wrapper
   */
  async createSubscription(options: StripePaymentOptions): Promise<StripePaymentResult> {
    try {
      console.log('💳 Creating Stripe subscription via Wrapper');

      const subscriptionOptions: SubscriptionOptions = {
        plan: options.plan || 'monthly',
        tier: 'premium',
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail
      };

      const result = await stripeWrapper.createSubscription(subscriptionOptions);
      return this.convertResult(result);

    } catch (error: any) {
      console.error('❌ Subscription creation error:', error);

      return {
        success: false,
        error: error.message || 'Failed to create subscription session'
      };
    }
  }

  /**
   * Open payment in new window using Stripe Wrapper
   */
  openCheckoutWindow(url: string, sessionId?: string): void {
    stripeWrapper.openCheckoutWindow(url, sessionId);
  }

  /**
   * Convert PaymentResult to StripePaymentResult for backward compatibility
   */
  private convertResult(result: PaymentResult): StripePaymentResult {
    return {
      success: result.success,
      url: result.url,
      sessionId: result.sessionId,
      error: result.error,
      method: result.method,
      fallbackUsed: result.fallbackUsed
    };
  }

  /**
   * Quick purchase with preset amounts
   */
  async quickPurchase(credits: 50 | 100 | 250 | 500, guestEmail?: string): Promise<StripePaymentResult> {
    const amount = this.getCreditsPrice(credits);
    
    const result = await this.createPayment({
      amount,
      credits,
      productName: `${credits} Backlink Credits`,
      type: 'credits',
      isGuest: !guestEmail,
      guestEmail
    });

    if (result.success && result.url) {
      this.openCheckoutWindow(result.url, result.sessionId);
    }

    return result;
  }

  /**
   * Purchase premium subscription
   */
  async purchasePremium(plan: 'monthly' | 'yearly', guestEmail?: string): Promise<StripePaymentResult> {
    const result = await this.createSubscription({
      plan,
      type: 'subscription',
      amount: plan === 'monthly' ? 29 : 290,
      isGuest: !guestEmail,
      guestEmail
    });

    if (result.success && result.url) {
      this.openCheckoutWindow(result.url, result.sessionId);
    }

    return result;
  }

  /**
   * Get pricing for credit packages
   */
  private getCreditsPrice(credits: number): number {
    switch (credits) {
      case 50: return 70;
      case 100: return 140;
      case 250: return 350;
      case 500: return 700;
      default: return credits * 1.40; // $1.40 per credit
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: !!this.publishableKey,
      publishableKey: this.publishableKey ? `${this.publishableKey.substring(0, 20)}...` : null,
      isLive: this.publishableKey?.includes('live') || false,
      isTest: this.publishableKey?.includes('test') || false
    };
  }
}

// Export singleton instance
export const stripePaymentService = new StripePaymentService();

// Convenience methods
export const buyCredits = (credits: number, amount: number, guestEmail?: string) =>
  stripePaymentService.createPayment({ 
    amount, 
    credits, 
    type: 'credits',
    productName: `${credits} Backlink Credits`,
    isGuest: !!guestEmail,
    guestEmail 
  });

export const quickBuyCredits = (credits: 50 | 100 | 250 | 500, guestEmail?: string) =>
  stripePaymentService.quickPurchase(credits, guestEmail);

export const upgradeToPremium = (plan: 'monthly' | 'yearly', guestEmail?: string) =>
  stripePaymentService.purchasePremium(plan, guestEmail);

export default stripePaymentService;
