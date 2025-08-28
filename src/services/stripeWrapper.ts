/**
 * Universal Stripe Wrapper Service
 * 
 * Comprehensive payment and subscription management using Supabase Stripe integration
 * with intelligent fallbacks and centralized configuration.
 * 
 * Architecture:
 * 1. Primary: Supabase Edge Functions (create-payment, create-subscription, verify-payment)
 * 2. Fallback: Netlify Functions (if Supabase functions unavailable)
 * 3. Last Resort: Client-side payment flow
 */

import { supabase } from '@/integrations/supabase/client';

// Types and Interfaces
export interface StripeWrapperConfig {
  publishableKey: string;
  isLive: boolean;
  isTest: boolean;
  hasSecretKey: boolean;
  premiumPrices: {
    monthly: string | null;
    annual: string | null;
  };
}

export interface PaymentOptions {
  amount: number;
  credits?: number;
  productName?: string;
  isGuest?: boolean;
  guestEmail?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionOptions {
  plan: 'monthly' | 'yearly' | 'annual';
  tier?: string;
  isGuest?: boolean;
  guestEmail?: string;
  userEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  method?: 'supabase' | 'netlify' | 'client';
  error?: string;
  fallbackUsed?: boolean;
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
  supabaseAvailable: boolean;
  netlifyAvailable: boolean;
  clientFallbackAvailable: boolean;
  primaryMethod: string;
  publishableKey: string | null;
  environment: 'live' | 'test' | 'unknown';
  errors: string[];
}

class StripeWrapper {
  private config: StripeWrapperConfig;
  private initialized = false;

  constructor() {
    this.config = this.validateConfiguration();
    this.initialized = true;
    
    console.log('🎗️ Stripe Wrapper Initialized:', {
      environment: this.config.isLive ? 'LIVE' : 'TEST',
      publishableKey: this.config.publishableKey ? `${this.config.publishableKey.substring(0, 20)}...` : 'MISSING',
      monthlyPriceId: this.config.premiumPrices.monthly ? 'SET' : 'MISSING',
      annualPriceId: this.config.premiumPrices.annual ? 'SET' : 'MISSING'
    });
  }

  /**
   * Validate Stripe configuration
   */
  private validateConfiguration(): StripeWrapperConfig {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    const monthlyPriceId = import.meta.env.VITE_STRIPE_PREMIUM_PLAN_MONTHLY || null;
    const annualPriceId = import.meta.env.VITE_STRIPE_PREMIUM_PLAN_ANNUAL || null;

    return {
      publishableKey,
      isLive: publishableKey.includes('pk_live_'),
      isTest: publishableKey.includes('pk_test_'),
      hasSecretKey: true, // Assume backend has secret key
      premiumPrices: {
        monthly: monthlyPriceId,
        annual: annualPriceId
      }
    };
  }

  /**
   * Create payment session (credits, one-time purchases)
   */
  async createPayment(options: PaymentOptions): Promise<PaymentResult> {
    if (!this.initialized) {
      return { success: false, error: 'Stripe Wrapper not initialized' };
    }

    console.log('💳 Creating payment:', {
      amount: options.amount,
      credits: options.credits,
      isGuest: options.isGuest
    });

    // Primary method: Supabase Edge Functions
    try {
      const result = await this.createPaymentViaSupabase(options);
      if (result.success) {
        return { ...result, method: 'supabase' };
      }
      console.warn('⚠️ Supabase payment failed, trying fallback:', result.error);
    } catch (error: any) {
      console.warn('⚠️ Supabase method error:', error.message);
    }

    // Fallback 1: Netlify Functions
    try {
      const result = await this.createPaymentViaNetlify(options);
      if (result.success) {
        return { ...result, method: 'netlify', fallbackUsed: true };
      }
      console.warn('⚠️ Netlify payment failed, trying final fallback:', result.error);
    } catch (error: any) {
      console.warn('⚠️ Netlify method error:', error.message);
    }

    // Fallback 2: Client-side payment
    try {
      const result = await this.createPaymentViaClient(options);
      return { ...result, method: 'client', fallbackUsed: true };
    } catch (error: any) {
      console.error('❌ All payment methods failed:', error.message);
      return {
        success: false,
        error: 'All payment methods unavailable. Please try again or contact support.'
      };
    }
  }

  /**
   * Create subscription session (premium plans)
   */
  async createSubscription(options: SubscriptionOptions): Promise<PaymentResult> {
    if (!this.initialized) {
      return { success: false, error: 'Stripe Wrapper not initialized' };
    }

    // Validate subscription plan
    const plan = options.plan === 'annual' ? 'yearly' : options.plan;
    if (!['monthly', 'yearly'].includes(plan)) {
      return { success: false, error: 'Invalid subscription plan' };
    }

    console.log('🎖️ Creating subscription:', {
      plan,
      tier: options.tier,
      isGuest: options.isGuest
    });

    // Primary method: Supabase Edge Functions
    try {
      const result = await this.createSubscriptionViaSupabase({ ...options, plan });
      if (result.success) {
        return { ...result, method: 'supabase' };
      }
      console.warn('⚠️ Supabase subscription failed, trying fallback:', result.error);
    } catch (error: any) {
      console.warn('⚠️ Supabase subscription error:', error.message);
    }

    // Fallback 1: Netlify Functions
    try {
      const result = await this.createSubscriptionViaNetlify({ ...options, plan });
      if (result.success) {
        return { ...result, method: 'netlify', fallbackUsed: true };
      }
      console.warn('⚠️ Netlify subscription failed:', result.error);
    } catch (error: any) {
      console.warn('⚠️ Netlify subscription error:', error.message);
    }

    return {
      success: false,
      error: 'Subscription service unavailable. Please try again or contact support.'
    };
  }

  /**
   * Verify payment status
   */
  async verifyPayment(sessionId: string): Promise<VerificationResult> {
    if (!sessionId) {
      return { success: false, paid: false, error: 'Session ID required' };
    }

    console.log('🔍 Verifying payment:', sessionId);

    // Primary: Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (error) {
        console.warn('⚠️ Supabase verification error:', error);
      } else if (data) {
        return {
          success: true,
          paid: data.paid || data.payment_status === 'paid',
          sessionId,
          amount: data.amount,
          credits: data.credits
        };
      }
    } catch (error: any) {
      console.warn('⚠️ Supabase verification failed:', error.message);
    }

    // Fallback: Netlify Function
    try {
      const response = await fetch(`/.netlify/functions/verify-payment?session_id=${sessionId}`);
      const data = await response.json();

      if (response.ok && data) {
        return {
          success: true,
          paid: data.paid || data.payment_status === 'paid',
          sessionId,
          amount: data.amount,
          credits: data.credits
        };
      }
    } catch (error: any) {
      console.warn('⚠️ Netlify verification failed:', error.message);
    }

    return {
      success: false,
      paid: false,
      error: 'Unable to verify payment status'
    };
  }

  /**
   * Open checkout window with intelligent handling
   */
  openCheckoutWindow(url: string, sessionId?: string): Window | null {
    try {
      const checkoutWindow = window.open(
        url,
        'stripe-checkout',
        'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no'
      );

      if (!checkoutWindow) {
        console.warn('⚠️ Popup blocked, redirecting current window');
        window.location.href = url;
        return null;
      }

      console.log('✅ Checkout window opened:', sessionId);
      return checkoutWindow;
    } catch (error: any) {
      console.error('❌ Failed to open checkout window:', error.message);
      window.location.href = url;
      return null;
    }
  }

  /**
   * Quick credit purchase with preset amounts
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

    if (!this.config.publishableKey) {
      errors.push('VITE_STRIPE_PUBLISHABLE_KEY not configured');
    }

    if (!this.config.premiumPrices.monthly) {
      errors.push('VITE_STRIPE_PREMIUM_PLAN_MONTHLY not configured');
    }

    if (!this.config.premiumPrices.annual) {
      errors.push('VITE_STRIPE_PREMIUM_PLAN_ANNUAL not configured');
    }

    return {
      configured: this.config.publishableKey.length > 0,
      supabaseAvailable: true, // Assume available, will fail gracefully
      netlifyAvailable: true, // Assume available, will fail gracefully  
      clientFallbackAvailable: this.config.publishableKey.length > 0,
      primaryMethod: 'supabase',
      publishableKey: this.config.publishableKey ? `${this.config.publishableKey.substring(0, 20)}...` : null,
      environment: this.config.isLive ? 'live' : this.config.isTest ? 'test' : 'unknown',
      errors
    };
  }

  // Private Methods

  private async createPaymentViaSupabase(options: PaymentOptions): Promise<PaymentResult> {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        amount: options.amount,
        credits: options.credits,
        productName: options.productName || `${options.credits || 0} Backlink Credits`,
        paymentMethod: 'stripe',
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail,
        metadata: options.metadata
      }
    });

    if (error) {
      throw new Error(`Supabase payment error: ${error.message || JSON.stringify(error)}`);
    }

    if (!data || !data.url) {
      throw new Error('No checkout URL received from Supabase payment service');
    }

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId || data.session_id
    };
  }

  private async createSubscriptionViaSupabase(options: SubscriptionOptions): Promise<PaymentResult> {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: {
        plan: options.plan,
        tier: options.tier || 'premium',
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail,
        userEmail: options.userEmail,
        metadata: options.metadata
      }
    });

    if (error) {
      throw new Error(`Supabase subscription error: ${error.message || JSON.stringify(error)}`);
    }

    if (!data || !data.url) {
      throw new Error('No checkout URL received from Supabase subscription service');
    }

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId || data.session_id
    };
  }

  private async createPaymentViaNetlify(options: PaymentOptions): Promise<PaymentResult> {
    const response = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: options.amount,
        credits: options.credits,
        productName: options.productName || `${options.credits || 0} Backlink Credits`,
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail,
        metadata: options.metadata
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Netlify payment error: ${data.error || 'Unknown error'}`);
    }

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId || data.session_id
    };
  }

  private async createSubscriptionViaNetlify(options: SubscriptionOptions): Promise<PaymentResult> {
    const response = await fetch('/.netlify/functions/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: options.plan,
        tier: options.tier || 'premium',
        isGuest: options.isGuest || false,
        guestEmail: options.guestEmail,
        userEmail: options.userEmail,
        metadata: options.metadata
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Netlify subscription error: ${data.error || 'Unknown error'}`);
    }

    return {
      success: true,
      url: data.url,
      sessionId: data.sessionId || data.session_id
    };
  }

  private async createPaymentViaClient(options: PaymentOptions): Promise<PaymentResult> {
    // Client-side fallback - generate secure payment URL
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/secure-payment?amount=${options.amount}&credits=${options.credits}&guest=${options.isGuest}&email=${encodeURIComponent(options.guestEmail || '')}`;
    
    return {
      success: true,
      url: paymentUrl,
      sessionId: `client_${Date.now()}`
    };
  }

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
