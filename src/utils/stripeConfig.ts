/**
 * Production Stripe Configuration
 * Supports STRIPE_PUBLISHABLE_KEY (server-provided) and VITE_STRIPE_PUBLISHABLE_KEY (frontend)
 */

export interface StripeConfig {
  publishableKey: string;
  isConfigured: boolean;
  mode: 'production';
}

export function getStripeConfig(): StripeConfig {
  // Vite exposes only VITE_ vars to the browser. We still try a non-VITE fallback for flexibility.
  const publishableKey =
    (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.STRIPE_PUBLISHABLE_KEY ||
    '';

  const valid = typeof publishableKey === 'string' && publishableKey.startsWith('pk_');

  return {
    publishableKey: valid ? publishableKey : '',
    isConfigured: valid,
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
