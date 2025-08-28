#!/usr/bin/env node

/**
 * Production Stripe Validation Script
 * Validates live Stripe configuration for backlinkoo.com
 * Using hardcoded product IDs: prod_SoVoAb8dXp1cS0 (credits) and prod_SoVja4018pbOcy (premium)
 */

console.log('🔍 Validating LIVE Stripe Configuration for backlinkoo.com...\n');

// Live product IDs (hardcoded in the application)
const LIVE_PRODUCT_IDS = {
  CREDITS: 'prod_SoVoAb8dXp1cS0',
  PREMIUM: 'prod_SoVja4018pbOcy'
};

// Required environment variables for production
const requiredEnvVars = {
  // Core Stripe Configuration (Must be LIVE keys)
  'STRIPE_SECRET_KEY': {
    description: 'Live Stripe secret key for server-side operations',
    format: 'sk_live_*',
    required: true,
    isLive: true
  },
  'VITE_STRIPE_PUBLISHABLE_KEY': {
    description: 'Live Stripe publishable key for client-side operations',
    format: 'pk_live_*', 
    required: true,
    isLive: true
  },
  
  // Premium Plan Price IDs (Must be created in Stripe Dashboard)
  'STRIPE_PREMIUM_PLAN_MONTHLY': {
    description: 'Stripe price ID for $29/month premium subscription',
    format: 'price_*',
    required: true,
    note: 'Create this price for product prod_SoVja4018pbOcy in Stripe Dashboard'
  },
  'STRIPE_PREMIUM_PLAN_ANNUAL': {
    description: 'Stripe price ID for $290/year premium subscription',
    format: 'price_*',
    required: true,
    note: 'Create this price for product prod_SoVja4018pbOcy in Stripe Dashboard'
  },
  'VITE_STRIPE_PREMIUM_PLAN_MONTHLY': {
    description: 'Frontend-accessible monthly price ID',
    format: 'price_*',
    required: true,
    source: 'STRIPE_PREMIUM_PLAN_MONTHLY'
  },
  'VITE_STRIPE_PREMIUM_PLAN_ANNUAL': {
    description: 'Frontend-accessible annual price ID', 
    format: 'price_*',
    required: true,
    source: 'STRIPE_PREMIUM_PLAN_ANNUAL'
  },
  
  // Webhook Configuration (Recommended for production)
  'STRIPE_WEBHOOK_SECRET': {
    description: 'Stripe webhook secret for payment verification',
    format: 'whsec_*',
    required: false,
    note: 'Set up webhook endpoint: https://backlinkoo.com/.netlify/functions/payment-webhook'
  }
};

function validateFormat(value, expectedFormat, isLive = false) {
  if (!value) return { valid: false, error: 'Not set' };
  
  switch (expectedFormat) {
    case 'sk_live_*':
      if (!value.startsWith('sk_live_')) {
        return { valid: false, error: 'Must be live secret key (sk_live_*)' };
      }
      break;
    case 'pk_live_*':
      if (!value.startsWith('pk_live_')) {
        return { valid: false, error: 'Must be live publishable key (pk_live_*)' };
      }
      break;
    case 'price_*':
      if (!value.startsWith('price_')) {
        return { valid: false, error: 'Must be valid price ID (price_*)' };
      }
      break;
    case 'whsec_*':
      if (!value.startsWith('whsec_')) {
        return { valid: false, error: 'Must be valid webhook secret (whsec_*)' };
      }
      break;
  }
  
  return { valid: true };
}

function checkEnvironmentVariable(name, config) {
  const value = process.env[name];
  const validation = validateFormat(value, config.format, config.isLive);
  
  return {
    name,
    value: value ? `${value.substring(0, 15)}...` : 'Not set',
    isValid: validation.valid,
    error: validation.error,
    status: config.required ? (validation.valid ? '✅' : '❌') : (validation.valid ? '✅' : '⚠️'),
    config
  };
}

// Main validation
console.log('🏭 PRODUCTION ENVIRONMENT VALIDATION\n');
console.log('📋 Required Environment Variables:\n');

const results = {};
let allRequired = true;
let hasLiveKeys = true;

Object.entries(requiredEnvVars).forEach(([name, config]) => {
  const result = checkEnvironmentVariable(name, config);
  results[name] = result;
  
  console.log(`${result.status} ${name}`);
  console.log(`   Description: ${config.description}`);
  console.log(`   Format: ${config.format}`);
  console.log(`   Value: ${result.value}`);
  
  if (result.error) {
    console.log(`   ❌ Error: ${result.error}`);
  }
  
  if (config.note) {
    console.log(`   💡 Note: ${config.note}`);
  }
  
  if (config.required && !result.isValid) {
    allRequired = false;
  }
  
  if (config.isLive && !result.isValid) {
    hasLiveKeys = false;
  }
  
  console.log('');
});

// Product ID validation
console.log('🎯 HARDCODED PRODUCT CONFIGURATION:\n');
console.log(`✅ Credits Product ID: ${LIVE_PRODUCT_IDS.CREDITS}`);
console.log(`✅ Premium Product ID: ${LIVE_PRODUCT_IDS.PREMIUM}`);
console.log('');

// Credits pricing configuration
console.log('💰 CREDITS PRICING (Hardcoded in Application):\n');
const creditPricing = [
  { credits: 50, price: 70, rate: 1.40 },
  { credits: 100, price: 140, rate: 1.40 },
  { credits: 250, price: 350, rate: 1.40 },
  { credits: 500, price: 700, rate: 1.40 }
];

creditPricing.forEach(({ credits, price, rate }) => {
  console.log(`   ${credits} Credits: $${price} ($${rate} per credit)`);
});
console.log(`   Custom amounts: $1.40 per credit`);
console.log('');

// Premium pricing configuration
console.log('🎖️  PREMIUM PRICING (Configure in Stripe Dashboard):\n');
console.log('   Monthly Plan: $29.00/month');
console.log('   Annual Plan: $290.00/year (equivalent to $24.17/month)');
console.log('');

// Summary
console.log('📊 VALIDATION SUMMARY:\n');

if (allRequired && hasLiveKeys) {
  console.log('✅ All required environment variables are configured with LIVE keys!');
  console.log('🚀 Your payment system is ready for production on backlinkoo.com');
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('   1. Verify prices exist in Stripe Dashboard');
  console.log('   2. Set up webhook endpoint');
  console.log('   3. Test with live test cards');
  console.log('   4. Monitor payments in Stripe Dashboard');
} else if (!hasLiveKeys) {
  console.log('❌ LIVE STRIPE KEYS REQUIRED FOR PRODUCTION');
  console.log('⚠️  You must use sk_live_ and pk_live_ keys for backlinkoo.com production');
  console.log('');
  console.log('🔧 Actions Required:');
  console.log('   1. Get live keys from Stripe Dashboard');
  console.log('   2. Set STRIPE_SECRET_KEY=sk_live_YOUR_KEY');
  console.log('   3. Set VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY');
} else {
  console.log('❌ Some required environment variables are missing or invalid');
  console.log('⚠️  Payment system will not work correctly until these are fixed');
}

console.log('\n🔧 NETLIFY ENVIRONMENT SETUP:\n');
console.log('1. Log into Netlify Dashboard (app.netlify.com)');
console.log('2. Go to: Sites > backlinkoo > Site settings > Environment variables');
console.log('3. Add these variables:\n');

Object.entries(requiredEnvVars).forEach(([name, config]) => {
  const result = results[name];
  if (config.required && !result.isValid) {
    const placeholder = config.format.replace('*', 'YOUR_ACTUAL_VALUE');
    console.log(`   ❌ ${name}=${placeholder}`);
  } else if (result.isValid) {
    console.log(`   ✅ ${name} (already configured)`);
  } else {
    const placeholder = config.format.replace('*', 'YOUR_ACTUAL_VALUE');
    console.log(`   ⚠️  ${name}=${placeholder} (optional)`);
  }
});

console.log('\n4. Deploy site to apply changes');
console.log('5. Test payments with Stripe test cards\n');

console.log('🔗 USEFUL LINKS:\n');
console.log('• Stripe Dashboard: https://dashboard.stripe.com');
console.log('• Create Prices: https://dashboard.stripe.com/products');
console.log('• Webhooks Setup: https://dashboard.stripe.com/webhooks');
console.log('• Test Cards: https://stripe.com/docs/testing#cards');

// Exit codes for CI/CD
if (!allRequired || !hasLiveKeys) {
  console.log('\n❌ CONFIGURATION INCOMPLETE');
  process.exit(1);
} else {
  console.log('\n✅ CONFIGURATION COMPLETE');
  process.exit(0);
}
