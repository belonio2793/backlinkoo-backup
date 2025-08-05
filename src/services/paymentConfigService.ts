/**
 * Payment Configuration Service
 * Manages Stripe and PayPal API configuration through Netlify environment variables
 */

interface PaymentConfig {
  stripe: {
    publicKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  paypal: {
    clientId?: string;
    secretKey?: string;
    environment: 'sandbox' | 'production';
  };
  environment: 'development' | 'production' | 'preview';
}

interface ConfigurationResult {
  success: boolean;
  message: string;
  missingVars?: string[];
}

class PaymentConfigurationService {
  private config: PaymentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): PaymentConfig {
    const environment = this.getEnvironment();
    
    return {
      stripe: {
        publicKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        // Secret key is only available in Netlify functions
        secretKey: undefined, // This will be accessed via Netlify environment
        webhookSecret: undefined // This will be accessed via Netlify environment
      },
      paypal: {
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        // Secret key is only available in Netlify functions
        secretKey: undefined, // This will be accessed via Netlify environment
        environment: environment === 'production' ? 'production' : 'sandbox'
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
   * Check if required environment variables are configured
   */
  public validateConfiguration(): ConfigurationResult {
    const missingVars: string[] = [];
    
    // Check Stripe configuration
    if (!this.config.stripe.publicKey) {
      missingVars.push('VITE_STRIPE_PUBLISHABLE_KEY');
    }
    
    // Check PayPal configuration
    if (!this.config.paypal.clientId) {
      missingVars.push('VITE_PAYPAL_CLIENT_ID');
    }

    if (missingVars.length > 0) {
      return {
        success: false,
        message: `Missing required environment variables: ${missingVars.join(', ')}`,
        missingVars
      };
    }

    return {
      success: true,
      message: 'Payment configuration is properly set up'
    };
  }

  /**
   * Get the current configuration
   */
  public getConfiguration(): PaymentConfig {
    return { ...this.config };
  }

  /**
   * Get Stripe public key for frontend use
   */
  public getStripePublicKey(): string | undefined {
    return this.config.stripe.publicKey;
  }

  /**
   * Get PayPal client ID for frontend use
   */
  public getPayPalClientId(): string | undefined {
    return this.config.paypal.clientId;
  }

  /**
   * Check if Stripe is properly configured
   */
  public isStripeConfigured(): boolean {
    return !!this.config.stripe.publicKey;
  }

  /**
   * Check if PayPal is properly configured
   */
  public isPayPalConfigured(): boolean {
    return !!this.config.paypal.clientId;
  }

  /**
   * Get available payment methods based on configuration
   */
  public getAvailablePaymentMethods(): ('stripe' | 'paypal')[] {
    const methods: ('stripe' | 'paypal')[] = [];
    
    if (this.isStripeConfigured()) {
      methods.push('stripe');
    }
    
    if (this.isPayPalConfigured()) {
      methods.push('paypal');
    }
    
    return methods;
  }

  /**
   * Generate configuration instructions for missing environment variables
   */
  public getConfigurationInstructions(): string {
    const validation = this.validateConfiguration();
    
    if (validation.success) {
      return 'Payment configuration is complete!';
    }

    const instructions = [
      '# Payment Configuration Instructions',
      '',
      '## Required Environment Variables',
      '',
      'Set these environment variables in your Netlify site settings:',
      '',
      '### Stripe Configuration:',
      '- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (frontend)',
      '- `STRIPE_SECRET_KEY` - Your Stripe secret key (backend/functions only)',
      '- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret (optional)',
      '',
      '### PayPal Configuration:',
      '- `VITE_PAYPAL_CLIENT_ID` - Your PayPal client ID (frontend)',
      '- `PAYPAL_CLIENT_ID` - Your PayPal client ID (backend/functions)',
      '- `PAYPAL_SECRET_KEY` - Your PayPal secret key (backend/functions only)',
      '',
      '### Missing Variables:',
      ...validation.missingVars!.map(varName => `- ${varName}`),
      '',
      '## How to Set Environment Variables in Netlify:',
      '1. Go to your Netlify site dashboard',
      '2. Navigate to Site settings > Environment variables',
      '3. Add each required variable with its value',
      '4. Deploy your site to apply the changes',
      '',
      '## Important Notes:',
      '- Variables starting with `VITE_` are exposed to the frontend',
      '- Variables without `VITE_` prefix are only available in Netlify functions',
      '- Never expose secret keys (STRIPE_SECRET_KEY, PAYPAL_SECRET_KEY) to the frontend',
      '- Use sandbox credentials for development/testing',
      '- Use production credentials only for production environment'
    ].join('\n');

    return instructions;
  }

  /**
   * Test payment method availability
   */
  public async testPaymentMethods(): Promise<{
    stripe: { available: boolean; error?: string };
    paypal: { available: boolean; error?: string };
  }> {
    const result = {
      stripe: { available: false, error: undefined as string | undefined },
      paypal: { available: false, error: undefined as string | undefined }
    };

    // Test Stripe
    if (this.isStripeConfigured()) {
      try {
        // Test if Stripe can be loaded
        const stripeKey = this.getStripePublicKey();
        if (stripeKey) {
          result.stripe.available = true;
        } else {
          result.stripe.error = 'Stripe public key not configured';
        }
      } catch (error) {
        result.stripe.error = 'Stripe configuration error';
      }
    } else {
      result.stripe.error = 'Stripe not configured';
    }

    // Test PayPal
    if (this.isPayPalConfigured()) {
      try {
        const paypalClientId = this.getPayPalClientId();
        if (paypalClientId) {
          result.paypal.available = true;
        } else {
          result.paypal.error = 'PayPal client ID not configured';
        }
      } catch (error) {
        result.paypal.error = 'PayPal configuration error';
      }
    } else {
      result.paypal.error = 'PayPal not configured';
    }

    return result;
  }
}

// Export singleton instance
export const paymentConfigService = new PaymentConfigurationService();

// Export types
export type { PaymentConfig, ConfigurationResult };
