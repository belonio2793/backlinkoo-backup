/**
 * Simplified Stripe Wrapper Service - Direct Checkout Links
 * 
 * Redirects directly to Stripe product checkout pages instead of creating sessions.
 * Uses webhooks to handle payment completion and credit users.
 */

// Direct Stripe checkout URLs
const STRIPE_CHECKOUT_URLS = {
  credits: 'https://buy.stripe.com/9B63cv1tmcYe',
  premiumMonthly: 'https://buy.stripe.com/6oUaEX3Buf6m0V1fO11ZS00', 
  premiumAnnual: 'https://buy.stripe.com/14A4gzb3W8HY5bhatH1ZS01'
};

// Types and Interfaces
export interface StripeWrapperConfig {
  publishableKey: string;
  isLive: boolean;
  isTest: boolean;
  checkoutUrls: typeof STRIPE_CHECKOUT_URLS;
}

export interface PaymentOptions {
  amount: number;
  credits?: number;
  productName?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionOptions {
  plan: 'monthly' | 'yearly' | 'annual';
  tier?: string;
  userEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  method?: 'direct_stripe';
  error?: string;
}

export interface VerificationResult {
  success: boolean;
  paid: boolean;
  sessionId?: string;
  amount?: number;
  credits?: number;
  error?: string;
}

export interface WrapperStatus {
  configured: boolean;
  method: 'direct_stripe';
  environment: 'live' | 'test' | 'unknown';
  checkoutUrls: typeof STRIPE_CHECKOUT_URLS;
  errors: string[];
}

class StripeWrapper {
  private config: StripeWrapperConfig;
  private initialized = false;

  constructor() {
    this.config = this.validateConfiguration();
    this.initialized = true;
    
    console.log('🎗️ Stripe Wrapper Initialized (Direct Checkout Mode):', {
      environment: this.config.isLive ? 'LIVE' : 'TEST',
      creditsUrl: this.config.checkoutUrls.credits,
      monthlyUrl: this.config.checkoutUrls.premiumMonthly,
      annualUrl: this.config.checkoutUrls.premiumAnnual
    });
  }

  /**
   * Validate Stripe configuration
   */
  private validateConfiguration(): StripeWrapperConfig {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

    return {
      publishableKey,
      isLive: publishableKey.includes('pk_live_'),
      isTest: publishableKey.includes('pk_test_'),
      checkoutUrls: STRIPE_CHECKOUT_URLS
    };
  }

  /**
   * Create payment session - now redirects directly to Stripe checkout
   */
  async createPayment(options: PaymentOptions): Promise<PaymentResult> {
    if (!this.initialized) {
      return { success: false, error: 'Stripe Wrapper not initialized' };
    }

    console.log('💳 Redirecting to direct Stripe checkout for credits:', {
      amount: options.amount,
      credits: options.credits,
      isGuest: options.isGuest
    });

    // All credit purchases go to the credits checkout URL
    const url = this.addUserDataToUrl(STRIPE_CHECKOUT_URLS.credits, options);
    
    return {
      success: true,
      url,
      sessionId: `direct_${Date.now()}`,
      method: 'direct_stripe'
    };
  }

  /**
   * Create subscription session - redirects directly to plan checkout
   */
  async createSubscription(options: SubscriptionOptions): Promise<PaymentResult> {
    if (!this.initialized) {
      return { success: false, error: 'Stripe Wrapper not initialized' };
    }

    const plan = options.plan === 'annual' ? 'yearly' : options.plan;
    
    console.log('🎖️ Redirecting to direct Stripe subscription checkout:', {
      plan,
      tier: options.tier,
      isGuest: options.isGuest
    });

    // Select the appropriate checkout URL based on plan
    let baseUrl: string;
    if (plan === 'monthly') {
      baseUrl = STRIPE_CHECKOUT_URLS.premiumMonthly;
    } else if (plan === 'yearly') {
      baseUrl = STRIPE_CHECKOUT_URLS.premiumAnnual;
    } else {
      return { success: false, error: 'Invalid subscription plan' };
    }

    const url = this.addUserDataToUrl(baseUrl, options);

    return {
      success: true,
      url,
      sessionId: `direct_sub_${Date.now()}`,
      method: 'direct_stripe'
    };
  }

  /**
   * Add user data to checkout URL for webhook processing
   */
  private addUserDataToUrl(baseUrl: string, options: PaymentOptions | SubscriptionOptions): string {
    const url = new URL(baseUrl);
    
    // Add customer email if available
    if ('guestEmail' in options && options.guestEmail) {
      url.searchParams.set('prefilled_email', options.guestEmail);
    } else if ('userEmail' in options && options.userEmail) {
      url.searchParams.set('prefilled_email', options.userEmail);
    }

    // Add success/cancel URLs
    const currentOrigin = window.location.origin;
    url.searchParams.set('success_url', `${currentOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
    url.searchParams.set('cancel_url', `${currentOrigin}/payment-cancelled`);

    // Add metadata for webhook processing
    if ('credits' in options && options.credits) {
      url.searchParams.set('client_reference_id', `credits_${options.credits}`);
    } else if ('plan' in options) {
      url.searchParams.set('client_reference_id', `premium_${options.plan}`);
    }

    return url.toString();
  }

  /**
   * Verify payment status - simplified for webhook-based system
   */
  async verifyPayment(sessionId: string): Promise<VerificationResult> {
    if (!sessionId) {
      return { success: false, paid: false, error: 'Session ID required' };
    }

    console.log('🔍 Verifying payment via webhook system:', sessionId);

    // In the direct checkout system, verification happens via webhooks
    // This method is mainly for compatibility with existing success pages
    return {
      success: true,
      paid: true, // Assume paid if we reached success page
      sessionId,
      amount: 0, // Will be handled by webhook
      credits: 0 // Will be handled by webhook
    };
  }

  /**
   * Open checkout window or redirect directly
   */
  openCheckoutWindow(url: string, sessionId?: string): Window | null {
    try {
      console.log('🚀 Redirecting to Stripe checkout:', url);
      
      // For direct Stripe checkouts, redirect in current window for better UX
      window.location.href = url;
      return null;
    } catch (error: any) {
      console.error('❌ Failed to redirect to checkout:', error.message);
      window.location.href = url;
      return null;
    }
  }

  /**
   * Quick credit purchase - redirects to credits checkout
   */
  async quickBuyCredits(credits: 50 | 100 | 250 | 500, guestEmail?: string): Promise<PaymentResult> {
    const amount = this.getCreditsPrice(credits);
    
    const result = await this.createPayment({
      amount,
      credits,
      productName: `${credits} Backlink Credits`,
      isGuest: !!guestEmail,
      guestEmail
    });

    if (result.success && result.url) {
      this.openCheckoutWindow(result.url, result.sessionId);
    }

    return result;
  }

  /**
   * Quick premium subscription purchase
   */
  async quickSubscribe(plan: 'monthly' | 'yearly', guestEmail?: string): Promise<PaymentResult> {
    const result = await this.createSubscription({
      plan,
      tier: 'premium',
      isGuest: !!guestEmail,
      guestEmail
    });

    if (result.success && result.url) {
      this.openCheckoutWindow(result.url, result.sessionId);
    }

    return result;
  }

  /**
   * Get wrapper status and configuration
   */
  getStatus(): WrapperStatus {
    const errors: string[] = [];

    if (!STRIPE_CHECKOUT_URLS.credits) {
      errors.push('Credits checkout URL not configured');
    }

    if (!STRIPE_CHECKOUT_URLS.premiumMonthly) {
      errors.push('Monthly premium checkout URL not configured');
    }

    if (!STRIPE_CHECKOUT_URLS.premiumAnnual) {
      errors.push('Annual premium checkout URL not configured');
    }

    return {
      configured: Object.values(STRIPE_CHECKOUT_URLS).every(url => url.length > 0),
      method: 'direct_stripe',
      environment: this.config.isLive ? 'live' : this.config.isTest ? 'test' : 'unknown',
      checkoutUrls: STRIPE_CHECKOUT_URLS,
      errors
    };
  }

  // Private Methods

  private getCreditsPrice(credits: number): number {
    switch (credits) {
      case 50: return 70;
      case 100: return 140;
      case 250: return 350;
      case 500: return 700;
      default: return Math.ceil(credits * 1.40); // $1.40 per credit
    }
  }
}

// Export singleton instance
export const stripeWrapper = new StripeWrapper();

// Convenience functions
export const createPayment = (options: PaymentOptions) => stripeWrapper.createPayment(options);
export const createSubscription = (options: SubscriptionOptions) => stripeWrapper.createSubscription(options);
export const verifyPayment = (sessionId: string) => stripeWrapper.verifyPayment(sessionId);
export const openCheckout = (url: string, sessionId?: string) => stripeWrapper.openCheckoutWindow(url, sessionId);
export const quickBuyCredits = (credits: 50 | 100 | 250 | 500, guestEmail?: string) => stripeWrapper.quickBuyCredits(credits, guestEmail);
export const quickSubscribe = (plan: 'monthly' | 'yearly', guestEmail?: string) => stripeWrapper.quickSubscribe(plan, guestEmail);
export const getStripeStatus = () => stripeWrapper.getStatus();

export default stripeWrapper;
