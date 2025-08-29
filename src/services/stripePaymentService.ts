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
          tier: 'premium'
        };

        const result = await stripeWrapper.createSubscription(subscriptionOptions);
        return this.convertResult(result);
      } else {
        const paymentOptions: PaymentOptions = {
          amount: options.amount,
          credits: options.credits,
          productName: options.productName
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
        tier: 'premium'
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
   * Quick purchase with preset amounts using Stripe Wrapper
   */
  async quickPurchase(credits: 50 | 100 | 250 | 500): Promise<StripePaymentResult> {
    const result = await stripeWrapper.quickBuyCredits(credits);
    return this.convertResult(result);
  }

  /**
   * Purchase premium subscription using Stripe Wrapper
   */
  async purchasePremium(plan: 'monthly' | 'yearly'): Promise<StripePaymentResult> {
    const result = await stripeWrapper.quickSubscribe(plan);
    return this.convertResult(result);
  }

  /**
   * Get service status from Stripe Wrapper
   */
  getStatus() {
    const wrapperStatus = stripeWrapper.getStatus();
    return {
      configured: wrapperStatus.configured,
      publishableKey: wrapperStatus.publishableKey,
      isLive: wrapperStatus.environment === 'live',
      isTest: wrapperStatus.environment === 'test',
      method: wrapperStatus.primaryMethod,
      supabaseAvailable: wrapperStatus.supabaseAvailable,
      fallbacksAvailable: wrapperStatus.netlifyAvailable || wrapperStatus.clientFallbackAvailable,
      errors: wrapperStatus.errors
    };
  }
}

// Export singleton instance
export const stripePaymentService = new StripePaymentService();

// Convenience methods - now powered by Stripe Wrapper
export const buyCredits = (credits: number, amount: number) =>
  stripePaymentService.createPayment({
    amount,
    credits,
    type: 'credits',
    productName: `${credits} Backlink Credits`
  });

export const quickBuyCredits = (credits: 50 | 100 | 250 | 500) =>
  stripePaymentService.quickPurchase(credits);

export const upgradeToPremium = (plan: 'monthly' | 'yearly') =>
  stripePaymentService.purchasePremium(plan);

// Direct wrapper exports for advanced usage
export { stripeWrapper, createPayment, createSubscription, verifyPayment, openCheckout, getStripeStatus } from './stripeWrapper';

export default stripePaymentService;
