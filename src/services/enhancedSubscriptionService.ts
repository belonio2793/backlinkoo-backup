import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { logError, getErrorMessage } from '@/utils/errorFormatter';

export interface CreateSubscriptionOptions {
  plan: 'monthly' | 'yearly';
  paymentMethod: 'stripe' | 'paypal';
  isGuest?: boolean;
  guestEmail?: string;
}

export interface SubscriptionResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  orderId?: string;
  error?: string;
  usedFallback?: boolean;
}

export class EnhancedSubscriptionService {
  private static readonly PRICE_IDS = {
    monthly: {
      stripe: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || 'price_premium_monthly',
      amount: 29
    },
    yearly: {
      stripe: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || 'price_premium_yearly',
      amount: 290
    }
  };

  /**
   * Create subscription with specified payment method
   */
  static async createSubscription(
    user: User | null, 
    options: CreateSubscriptionOptions
  ): Promise<SubscriptionResult> {
    console.log('🚀 Creating subscription...', { 
      user: !!user, 
      plan: options.plan,
      paymentMethod: options.paymentMethod,
      isGuest: options.isGuest 
    });

    try {
      // Validate inputs
      if (options.isGuest && !options.guestEmail) {
        return { success: false, error: 'Guest email is required for guest checkout' };
      }

      if (!options.isGuest && !user) {
        return { success: false, error: 'User authentication required' };
      }

      if (options.paymentMethod === 'stripe') {
        return await this.createStripeSubscription(user, options);
      } else if (options.paymentMethod === 'paypal') {
        return await this.createPayPalSubscription(user, options);
      } else {
        return { success: false, error: 'Invalid payment method' };
      }
    } catch (error: any) {
      console.error('❌ Exception creating subscription:', error);
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Create Stripe subscription
   */
  private static async createStripeSubscription(
    user: User | null,
    options: CreateSubscriptionOptions
  ): Promise<SubscriptionResult> {
    try {
      const priceInfo = this.PRICE_IDS[options.plan];
      
      const requestBody = {
        priceId: priceInfo.stripe,
        tier: 'premium',
        isGuest: options.isGuest || false,
        guestEmail: options.isGuest ? options.guestEmail : undefined
      };

      console.log('📝 Stripe request body:', requestBody);

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Stripe subscription error:', error);
        return { 
          success: false, 
          error: this.formatStripeError(error)
        };
      }

      if (!data || !data.url) {
        return { 
          success: false, 
          error: 'Payment system did not return a checkout URL' 
        };
      }

      console.log('✅ Stripe subscription created successfully');
      return { 
        success: true, 
        url: data.url, 
        sessionId: data.sessionId 
      };

    } catch (error: any) {
      console.error('❌ Stripe subscription exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create Stripe subscription' 
      };
    }
  }

  /**
   * Create PayPal subscription
   */
  private static async createPayPalSubscription(
    user: User | null,
    options: CreateSubscriptionOptions
  ): Promise<SubscriptionResult> {
    try {
      const priceInfo = this.PRICE_IDS[options.plan];
      
      const requestBody = {
        amount: priceInfo.amount,
        productName: `Premium Plan (${options.plan})`,
        paymentMethod: 'paypal' as const,
        isGuest: options.isGuest || false,
        guestEmail: options.isGuest ? options.guestEmail : undefined
      };

      console.log('📝 PayPal request body:', requestBody);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: requestBody
      });

      if (error) {
        console.error('❌ PayPal subscription error:', error);
        return { 
          success: false, 
          error: this.formatPayPalError(error)
        };
      }

      if (!data || !data.url) {
        return { 
          success: false, 
          error: 'PayPal did not return a checkout URL' 
        };
      }

      console.log('✅ PayPal order created successfully');
      return { 
        success: true, 
        url: data.url, 
        orderId: data.orderId 
      };

    } catch (error: any) {
      console.error('❌ PayPal subscription exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create PayPal subscription' 
      };
    }
  }

  /**
   * Format Stripe error messages
   */
  private static formatStripeError(error: any): string {
    let errorMessage = 'Failed to create subscription';

    if (error && typeof error === 'object') {
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Handle specific error cases
    if (errorMessage.includes('Rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    } else if (errorMessage.includes('STRIPE_SECRET_KEY') || errorMessage.includes('stripe')) {
      return 'Payment system configuration error. Please contact support.';
    } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
      return 'Authentication error. Please sign in and try again.';
    } else if (errorMessage.includes('price') || errorMessage.includes('priceId')) {
      return 'Invalid pricing configuration. Please contact support.';
    }

    return errorMessage;
  }

  /**
   * Format PayPal error messages
   */
  private static formatPayPalError(error: any): string {
    let errorMessage = 'Failed to create PayPal order';

    if (error && typeof error === 'object') {
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    if (errorMessage.includes('PAYPAL_CLIENT_ID') || errorMessage.includes('PayPal credentials')) {
      return 'PayPal is not configured. Please contact support.';
    }

    return errorMessage;
  }

  /**
   * Verify payment completion and upgrade user
   */
  static async verifyAndUpgradeUser(
    sessionId?: string,
    orderId?: string,
    paymentMethod: 'stripe' | 'paypal' = 'stripe'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Verifying payment...', { sessionId, orderId, paymentMethod });

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          sessionId,
          paypalOrderId: orderId,
          type: 'subscription'
        }
      });

      if (error) {
        console.error('❌ Payment verification error:', error);
        return { success: false, error: 'Failed to verify payment' };
      }

      if (data && data.subscribed) {
        console.log('✅ Payment verified and user upgraded');
        return { success: true };
      }

      return { success: false, error: 'Payment verification failed' };

    } catch (error: any) {
      console.error('❌ Payment verification exception:', error);
      return { success: false, error: error.message || 'Failed to verify payment' };
    }
  }

  /**
   * Get plan pricing information
   */
  static getPlanInfo(plan: 'monthly' | 'yearly') {
    return {
      ...this.PRICE_IDS[plan],
      name: plan === 'monthly' ? 'Monthly Plan' : 'Yearly Plan',
      period: plan === 'monthly' ? 'month' : 'year',
      popular: plan === 'monthly',
      savings: plan === 'yearly' ? 58 : null,
      discount: plan === 'yearly' ? 51 : (plan === 'monthly' ? 41 : 0)
    };
  }

  /**
   * Check if payment methods are configured
   */
  static async getAvailablePaymentMethods(): Promise<{
    stripe: boolean;
    paypal: boolean;
  }> {
    try {
      // In a real implementation, you might check the backend for configuration
      // For now, we'll assume both are available unless environment variables suggest otherwise
      return {
        stripe: true, // Always available as it's the primary method
        paypal: true  // Available if PayPal credentials are configured
      };
    } catch (error) {
      console.warn('Could not check payment method availability:', error);
      return {
        stripe: true,
        paypal: false
      };
    }
  }
}

export default EnhancedSubscriptionService;
