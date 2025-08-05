/**
 * Payment Integration Service
 * Handles payment processing coordination and environment validation
 */

interface PaymentConfig {
  stripe: {
    enabled: boolean;
    hasPublicKey: boolean;
    hasSecretKey: boolean;
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

    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('🔧 Payment Integration Configuration:', this.getConfigurationStatus());
    }
  }

  private loadConfiguration(): PaymentConfig {
    const environment = this.getEnvironment();
    const isDevelopment = environment === 'development';

    // In development, we enable Stripe if we have pricing configured (indicating setup is complete)
    const hasStripePricing = !!(import.meta.env.VITE_STRIPE_PREMIUM_PLAN_MONTHLY || import.meta.env.VITE_STRIPE_PREMIUM_PLAN_ANNUAL);
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    return {
      stripe: {
        enabled: !!stripePublicKey || (isDevelopment && hasStripePricing),
        hasPublicKey: !!stripePublicKey,
        hasSecretKey: true // We assume secret key is configured on server
      },
      environment
    };
  }

  private getEnvironment(): 'development' | 'production' | 'preview' {
    const env = import.meta.env.VITE_ENVIRONMENT || 'development';
    if (env === 'production') return 'production';
    if (env === 'preview') return 'preview';
    return 'development';
  }

  /**
   * Get available payment methods based on configuration
   */
  getAvailablePaymentMethods(): 'stripe'[] {
    const methods: 'stripe'[] = [];

    if (this.config.stripe.enabled) {
      methods.push('stripe');
    }

    return methods;
  }

  /**
   * Check if payment system is properly configured
   */
  isConfigured(): boolean {
    return this.config.stripe.enabled;
  }

  /**
   * Create a payment for credits
   */
  async createPayment(
    amount: number,
    credits: number,
    paymentMethod: 'stripe',
    isGuest: boolean = false,
    guestEmail?: string
  ): Promise<PaymentResult> {
    try {
      // Validate payment method is available
      const availableMethods = this.getAvailablePaymentMethods();
      if (!availableMethods.includes(paymentMethod)) {
        return {
          success: false,
          error: `${paymentMethod} is not configured. Available methods: ${availableMethods.join(', ')}`
        };
      }

      // Validate input
      if (amount <= 0 || amount > 100000) {
        return {
          success: false,
          error: 'Invalid amount. Must be between $0.01 and $100,000'
        };
      }

      if (credits <= 0 || credits > 100000) {
        return {
          success: false,
          error: 'Invalid credit amount'
        };
      }

      if (isGuest && !guestEmail) {
        return {
          success: false,
          error: 'Email is required for guest checkout'
        };
      }

      // Call Netlify function
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          productName: `${credits} Backlink Credits`,
          credits,
          isGuest,
          guestEmail,
          paymentMethod
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid response from payment service: ${response.status} ${response.statusText}`
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Payment creation failed: ${response.status} ${response.statusText}`
        };
      }

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
        error: error.message || 'An unexpected error occurred during payment creation'
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
      // Validate Stripe is available (subscriptions currently only support Stripe)
      if (!this.config.stripe.enabled) {
        return {
          success: false,
          error: 'Stripe is required for subscriptions but is not configured'
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

      // Call Netlify function
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          isGuest,
          guestEmail,
          paymentMethod: 'stripe'
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid response from subscription service: ${response.status} ${response.statusText}`
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Subscription creation failed: ${response.status} ${response.statusText}`
        };
      }

      return {
        success: true,
        url: data.url,
        sessionId: data.sessionId
      };

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during subscription creation'
      };
    }
  }

  /**
   * Get configuration status for debugging
   */
  getConfigurationStatus() {
    return {
      ...this.config,
      availableMethods: this.getAvailablePaymentMethods(),
      isConfigured: this.isConfigured()
    };
  }

  /**
   * Get setup instructions for missing configuration
   */
  getSetupInstructions(): string[] {
    const instructions: string[] = [];

    if (!this.config.stripe.enabled) {
      instructions.push(
        'Stripe Setup: Add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables'
      );
    }

    if (!this.config.paypal.enabled) {
      instructions.push(
        'PayPal Setup: Add VITE_PAYPAL_CLIENT_ID to your environment variables'
      );
    }

    if (instructions.length === 0) {
      instructions.push('Payment integration is properly configured!');
    }

    return instructions;
  }
}

// Export singleton instance
export const paymentIntegrationService = new PaymentIntegrationService();

// Export types
export type { PaymentConfig, PaymentResult };
