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
   * Create payment session for credits using Supabase Edge Functions
   */
  async createPayment(options: StripePaymentOptions): Promise<StripePaymentResult> {
    try {
      console.log('💳 Creating Stripe payment via Supabase Edge Function');
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: options.amount,
          productName: options.productName || `${options.credits || 0} Backlink Credits`,
          credits: options.credits,
          paymentMethod: 'stripe',
          isGuest: options.isGuest || false,
          guestEmail: options.guestEmail
        }
      });

      if (error) {
        console.error('❌ Payment creation failed:', error);
        throw new Error(`Payment API error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data || !data.url) {
        throw new Error('No checkout URL received from payment service');
      }

      console.log('✅ Payment session created successfully');
      
      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId || data.session_id
      };

    } catch (error: any) {
      console.error('❌ Payment creation error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to create payment session'
      };
    }
  }

  /**
   * Create subscription session using Supabase Edge Functions
   */
  async createSubscription(options: StripePaymentOptions): Promise<StripePaymentResult> {
    try {
      console.log('💳 Creating Stripe subscription via Supabase Edge Function');
      
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          plan: options.plan,
          isGuest: options.isGuest || false,
          guestEmail: options.guestEmail
        }
      });

      if (error) {
        console.error('❌ Subscription creation failed:', error);
        throw new Error(`Subscription API error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data || !data.url) {
        throw new Error('No checkout URL received from subscription service');
      }

      console.log('✅ Subscription session created successfully');
      
      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId || data.session_id
      };

    } catch (error: any) {
      console.error('❌ Subscription creation error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to create subscription session'
      };
    }
  }

  /**
   * Open payment in new window
   */
  openCheckoutWindow(url: string, sessionId?: string): void {
    const checkoutWindow = window.open(
      url,
      'stripe-checkout',
      'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
    );

    if (!checkoutWindow) {
      console.warn('⚠️ Popup blocked, redirecting current window');
      window.location.href = url;
    } else {
      console.log('✅ Checkout window opened');
    }
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
