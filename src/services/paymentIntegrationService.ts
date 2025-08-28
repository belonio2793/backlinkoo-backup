/**
 * Payment Integration Service - Production Ready
 * Direct Stripe integration for backlinkoo.com
 */

import { supabase } from '@/integrations/supabase/client';

interface PaymentConfig {
  stripe: {
    enabled: boolean;
    hasPublicKey: boolean;
  };
  environment: 'development' | 'production' | 'preview';
}

interface PaymentResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  orderId?: string;
  error?: string;
}

class PaymentIntegrationService {
  private config: PaymentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): PaymentConfig {
    const environment = this.getEnvironment();
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    return {
      stripe: {
        enabled: !!stripePublicKey,
        hasPublicKey: !!stripePublicKey
      },
      environment
    };
  }

  private getEnvironment(): 'development' | 'production' | 'preview' {
    const env = import.meta.env.VITE_ENVIRONMENT || 'production';
    if (env === 'development') return 'development';
    if (env === 'preview') return 'preview';
    return 'production';
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): 'stripe'[] {
    return this.config.stripe.enabled ? ['stripe'] : [];
  }

  /**
   * Check if payment system is properly configured
   */
  isConfigured(): boolean {
    return this.config.stripe.enabled;
  }

  /**
   * Create a payment for credits - requires authentication
   */
  async createPayment(
    amount: number,
    credits: number,
    paymentMethod: 'stripe' = 'stripe'
  ): Promise<PaymentResult> {
    try {
      // Validate Stripe is configured
      if (!this.config.stripe.enabled) {
        return {
          success: false,
          error: 'Payment system is not configured. Please contact support.'
        };
      }

      // Validate input
      if (amount <= 0 || amount > 10000) {
        return {
          success: false,
          error: 'Invalid amount. Must be between $0.01 and $10,000'
        };
      }

      if (credits <= 0 || credits > 7142) {
        return {
          success: false,
          error: 'Invalid credit amount. Maximum 7,142 credits per purchase.'
        };
      }

      // Check if user is authenticated via Supabase session
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        return {
          success: false,
          error: 'Authentication required. Please sign in to purchase credits.'
        };
      }

      // Call payment endpoint
      const requestBody = JSON.stringify({
        amount,
        productName: `${credits} Backlink Credits`,
        credits,
        isGuest: false,
        paymentMethod
      });

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: requestBody
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `Payment creation failed: ${response.status} ${response.statusText}`;

        // Handle specific Stripe errors
        if (errorMessage.includes('Must be between') && errorMessage.includes('$1')) {
          errorMessage = 'Your Stripe account has transaction limits. Please contact support.';
        } else if (errorMessage.includes('Invalid amount')) {
          errorMessage = 'Payment amount is invalid. Please check your selection and try again.';
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      const data = await response.json();

      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId,
        orderId: data.orderId
      };

    } catch (error: any) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: 'Payment processing error. Please try again or contact support.'
      };
    }
  }

  /**
   * Create a subscription for premium features
   */
  async createSubscription(
    plan: 'monthly' | 'yearly',
    isGuest: boolean = false,
    guestEmail?: string
  ): Promise<PaymentResult> {
    try {
      // Validate Stripe is configured
      if (!this.config.stripe.enabled) {
        return {
          success: false,
          error: 'Payment system is not configured. Please contact support.'
        };
      }

      // Validate input
      if (!['monthly', 'yearly'].includes(plan)) {
        return {
          success: false,
          error: 'Invalid subscription plan'
        };
      }

      if (isGuest && !guestEmail) {
        return {
          success: false,
          error: 'Email is required for guest checkout'
        };
      }

      // Call subscription endpoint
      const requestBody = JSON.stringify({
        plan,
        isGuest,
        guestEmail,
        paymentMethod: 'stripe'
      });

      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `Subscription creation failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();

      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId
      };

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return {
        success: false,
        error: 'Subscription processing error. Please try again or contact support.'
      };
    }
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus() {
    return {
      ...this.config,
      availableMethods: this.getAvailablePaymentMethods(),
      isConfigured: this.isConfigured()
    };
  }
}

// Export singleton instance
export const paymentIntegrationService = new PaymentIntegrationService();

// Export types
export type { PaymentConfig, PaymentResult };
