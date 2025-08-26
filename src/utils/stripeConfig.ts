/**
 * Stripe Configuration Utility
 * Handles production vs development Stripe setup
 */

export interface StripeConfig {
  publishableKey: string;
  isProduction: boolean;
  isConfigured: boolean;
  mode: 'demo' | 'test' | 'live';
}

export function getStripeConfig(): StripeConfig {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  
  // Determine if we have real keys
  const isLiveKey = publishableKey.startsWith('pk_live_');
  const isTestKey = publishableKey.startsWith('pk_test_') && !publishableKey.includes('placeholder');
  const isConfigured = isLiveKey || isTestKey;
  
  return {
    publishableKey,
    isProduction: isLiveKey,
    isConfigured,
    mode: isLiveKey ? 'live' : isTestKey ? 'test' : 'demo'
  };
}

export function getStripeEndpoints() {
  // In production (Netlify), use full function paths
  // In development, try different endpoint patterns
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    return {
      createPayment: '/.netlify/functions/create-payment',
      createSubscription: '/.netlify/functions/create-subscription',
      verifyPayment: '/.netlify/functions/verify-payment'
    };
  }
  
  return {
    createPayment: '/.netlify/functions/create-payment',
    createSubscription: '/.netlify/functions/create-subscription', 
    verifyPayment: '/.netlify/functions/verify-payment'
  };
}

export function validateStripeSetup(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  instructions: string[];
} {
  const config = getStripeConfig();
  const errors: string[] = [];
  const warnings: string[] = [];
  const instructions: string[] = [];
  
  if (!config.isConfigured) {
    errors.push('Stripe publishable key is not configured');
    instructions.push('Set VITE_STRIPE_PUBLISHABLE_KEY in your environment');
  }
  
  if (config.mode === 'demo') {
    warnings.push('Running in demo mode - no real payments will be processed');
    instructions.push('Set real Stripe keys for live payments');
  }
  
  if (config.mode === 'test') {
    warnings.push('Running in test mode - only test payments will work');
    instructions.push('Use pk_live_ key for production payments');
  }
  
  return {
    isValid: config.isConfigured,
    errors,
    warnings,
    instructions
  };
}
