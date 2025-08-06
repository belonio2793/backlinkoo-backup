/**
 * Payment Integration Service
 * Handles payment processing coordination and environment validation
 */

import { mockPaymentService } from './mockPaymentService';

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
      // Development mode fallback
      if (this.config.environment === 'development' && !this.config.stripe.hasPublicKey) {
        console.warn('🚧 Development mode: Stripe not configured, using demo flow');
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
          success: true,
          url: `/payment-success?demo=true&credits=${credits}&amount=${amount}`,
          sessionId: 'demo_session_' + Date.now(),
          orderId: 'demo_order_' + Date.now()
        };
      }

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

      // Call Netlify function with fallback
      let response: Response;
      const requestBody = JSON.stringify({
        amount,
        productName: `${credits} Backlink Credits`,
        credits,
        isGuest,
        guestEmail,
        paymentMethod
      });

      try {
        // Try primary endpoint first
        response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        });

        // If 404, try fallback endpoint
        if (response.status === 404) {
          console.warn('🔄 Payment endpoint /api/create-payment returned 404, trying fallback /.netlify/functions/create-payment');
          response = await fetch('/.netlify/functions/create-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: requestBody
          });

          if (response.status === 404) {
            console.error('❌ Both payment endpoints failed with 404. Check Netlify function deployment.');
            // Try waiting a moment and retrying once more in case of deployment delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('🔄 Retrying fallback endpoint after delay...');
            response = await fetch('/.netlify/functions/create-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: requestBody
            });

            // If still 404, use mock service
            if (response.status === 404 && mockPaymentService.isAvailable()) {
              console.log('🔄 All endpoints failed, using mock payment service...');
              return await mockPaymentService.createPayment(amount, credits, paymentMethod, isGuest, guestEmail);
            }
          } else {
            console.log('✅ Fallback payment endpoint worked');
          }
        }
      } catch (fetchError) {
        console.error('Payment endpoint fetch error:', fetchError);

        // Use mock service as final fallback
        if (mockPaymentService.isAvailable()) {
          console.log('🔄 Network error, falling back to mock payment service...');
          return await mockPaymentService.createPayment(amount, credits, paymentMethod, isGuest, guestEmail);
        }

        return {
          success: false,
          error: 'Network error: Unable to connect to payment service'
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If it's a 502 error in development, provide helpful message
        if (response.status === 502 && this.config.environment === 'development') {
          return {
            success: false,
            error: 'Development mode: Stripe configuration required. Using demo mode instead. Set STRIPE_SECRET_KEY environment variable for full functionality.'
          };
        }

        return {
          success: false,
          error: `Invalid response from payment service: ${response.status} ${response.statusText}. ${response.status === 404 ? 'Payment endpoint not found. Please check deployment.' : ''}`
        };
      }

      if (!response.ok) {
        // Better error handling for 502 errors
        if (response.status === 502) {
          return {
            success: false,
            error: this.config.environment === 'development'
              ? 'Development mode: Payment service unavailable. Please check your Stripe configuration or use demo mode.'
              : 'Payment service temporarily unavailable. Please try again in a moment.'
          };
        }

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

      // In development, provide more helpful error messages
      if (this.config.environment === 'development') {
        return {
          success: false,
          error: 'Development mode: Payment system error. Check console for details or contact support.'
        };
      }

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

      // Call Netlify function with fallback
      let response: Response;
      const requestBody = JSON.stringify({
        plan,
        isGuest,
        guestEmail,
        paymentMethod: 'stripe'
      });

      try {
        // Try primary endpoint first
        response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        });

        // If 404, try fallback endpoint
        if (response.status === 404) {
          console.warn('🔄 Subscription endpoint /api/create-subscription returned 404, trying fallback /.netlify/functions/create-subscription');
          response = await fetch('/.netlify/functions/create-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: requestBody
          });

          if (response.status === 404) {
            console.error('❌ Both subscription endpoints failed with 404. Check Netlify function deployment.');
          } else {
            console.log('✅ Fallback subscription endpoint worked');
          }
        }
      } catch (fetchError) {
        console.error('Subscription endpoint fetch error:', fetchError);
        return {
          success: false,
          error: 'Network error: Unable to connect to subscription service'
        };
      }

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
