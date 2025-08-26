/**
 * Production Stripe Configuration
 * No demo modes or fallbacks - real Stripe only
 */

export interface StripeConfig {
  publishableKey: string;
  isConfigured: boolean;
  mode: 'production';
}

export function getStripeConfig(): StripeConfig {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  
  if (!publishableKey || !publishableKey.startsWith('pk_')) {
    throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is required and must be a valid Stripe key');
  }
  
  return {
    publishableKey,
    isConfigured: true,
    mode: 'production'
  };
}

export function getStripeEndpoints() {
  return {
    createPayment: '/.netlify/functions/create-payment',
    createSubscription: '/.netlify/functions/create-subscription',
    verifyPayment: '/.netlify/functions/verify-payment'
  };
}

export function validateStripeSetup(): {
  isValid: boolean;
  errors: string[];
} {
  const config = getStripeConfig();
  const errors: string[] = [];
  
  if (!config.isConfigured) {
    errors.push('Stripe publishable key is not configured');
  }
  
  return {
    isValid: config.isConfigured,
    errors
  };
}
