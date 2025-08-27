#!/usr/bin/env node

/**
 * Stripe Environment Variables Validation Script
 * Validates that all required Stripe environment variables are properly configured
 * for production deployment on backlinkoo.com
 */

console.log('🔍 Validating Stripe Environment Variables Configuration...\n');

// Environment variables that should be set in Netlify
const requiredNetlifyVars = {
  // Stripe Core Configuration
  'STRIPE_SECRET_KEY': {
    description: 'Stripe secret key for server-side operations',
    format: 'sk_live_* or sk_test_*',
    required: true,
    serverSide: true
  },
  'STRIPE_PUBLISHABLE_KEY': {
    description: 'Stripe publishable key for client-side operations', 
    format: 'pk_live_* or pk_test_*',
    required: true,
    serverSide: false,
    note: 'This will be exposed as VITE_STRIPE_PUBLISHABLE_KEY to frontend'
  },
  
  // Premium Plan Price IDs
  'STRIPE_PREMIUM_PLAN_MONTHLY': {
    description: 'Stripe price ID for monthly premium subscription',
    format: 'price_*',
    required: true,
    serverSide: true
  },
  'STRIPE_PREMIUM_PLAN_ANNUAL': {
    description: 'Stripe price ID for yearly premium subscription', 
    format: 'price_*',
    required: true,
    serverSide: true
  },
  
  // Optional but recommended
  'STRIPE_WEBHOOK_SECRET': {
    description: 'Stripe webhook secret for payment verification',
    format: 'whsec_*',
    required: false,
    serverSide: true,
    note: 'Recommended for production payment verification'
  }
};

// Frontend environment variables (auto-generated from Netlify vars)
const frontendVars = {
  'VITE_STRIPE_PUBLISHABLE_KEY': {
    description: 'Frontend-accessible Stripe publishable key',
    source: 'STRIPE_PUBLISHABLE_KEY',
    required: true
  },
  'VITE_STRIPE_PREMIUM_PLAN_MONTHLY': {
    description: 'Frontend-accessible monthly price ID',
    source: 'STRIPE_PREMIUM_PLAN_MONTHLY', 
    required: true
  },
  'VITE_STRIPE_PREMIUM_PLAN_ANNUAL': {
    description: 'Frontend-accessible annual price ID',
    source: 'STRIPE_PREMIUM_PLAN_ANNUAL',
    required: true
  }
};

function validateFormat(value, expectedFormat) {
  if (!value) return false;
  
  switch (expectedFormat) {
    case 'sk_live_* or sk_test_*':
      return value.startsWith('sk_live_') || value.startsWith('sk_test_');
    case 'pk_live_* or pk_test_*':
      return value.startsWith('pk_live_') || value.startsWith('pk_test_');
    case 'price_*':
      return value.startsWith('price_');
    case 'whsec_*':
      return value.startsWith('whsec_');
    default:
      return true;
  }
}

function checkEnvironmentVariable(name, config, envVars = process.env) {
  const value = envVars[name];
  const isSet = !!value;
  const isValidFormat = isSet ? validateFormat(value, config.format) : false;
  
  return {
    name,
    isSet,
    isValidFormat,
    value: isSet ? `${value.substring(0, 10)}...` : 'Not set',
    status: config.required ? (isSet && isValidFormat ? '✅' : '❌') : (isSet && isValidFormat ? '✅' : '⚠️')
  };
}

// Main validation
console.log('📋 Required Netlify Environment Variables:\n');

const results = {};
let allRequired = true;

Object.entries(requiredNetlifyVars).forEach(([name, config]) => {
  const result = checkEnvironmentVariable(name, config);
  results[name] = result;
  
  console.log(`${result.status} ${name}`);
  console.log(`   Description: ${config.description}`);
  console.log(`   Format: ${config.format}`);
  console.log(`   Value: ${result.value}`);
  if (config.note) {
    console.log(`   Note: ${config.note}`);
  }
  
  if (config.required && (!result.isSet || !result.isValidFormat)) {
    allRequired = false;
  }
  
  console.log('');
});

console.log('🎯 Frontend Environment Variables (Auto-generated):\n');

Object.entries(frontendVars).forEach(([name, config]) => {
  const sourceValue = process.env[config.source];
  console.log(`${sourceValue ? '✅' : '❌'} ${name}`);
  console.log(`   Source: ${config.source}`);
  console.log(`   Description: ${config.description}`);
  console.log(`   Value: ${sourceValue ? `${sourceValue.substring(0, 10)}...` : 'Not set (source missing)'}`);
  console.log('');
});

// Summary
console.log('📊 VALIDATION SUMMARY:\n');

if (allRequired) {
  console.log('✅ All required Stripe environment variables are properly configured!');
  console.log('🚀 Your payment system should work correctly on backlinkoo.com');
} else {
  console.log('❌ Some required environment variables are missing or invalid.');
  console.log('⚠️  Payment system may not work correctly until these are fixed.');
}

console.log('\n🔧 ENVIRONMENT SETUP INSTRUCTIONS:\n');
console.log('1. Log into your Netlify dashboard');
console.log('2. Go to Site settings > Environment variables');
console.log('3. Add/update the following variables:\n');

Object.entries(requiredNetlifyVars).forEach(([name, config]) => {
  const result = results[name];
  if (config.required && (!result.isSet || !result.isValidFormat)) {
    console.log(`   ❌ ${name}=${config.format.replace('*', 'YOUR_ACTUAL_VALUE')}`);
  } else if (result.isSet && result.isValidFormat) {
    console.log(`   ✅ ${name} (already configured)`);
  } else {
    console.log(`   ⚠️  ${name}=${config.format.replace('*', 'YOUR_ACTUAL_VALUE')} (optional)`);
  }
});

console.log('\n4. Deploy your site to apply the changes');
console.log('5. Test payments on your live site\n');

console.log('💡 TIPS:\n');
console.log('• Use test keys (sk_test_*, pk_test_*) for development');
console.log('• Use live keys (sk_live_*, pk_live_*) for production');
console.log('• Never commit secret keys to your repository');
console.log('• Price IDs are found in your Stripe Dashboard under Products');
console.log('• Webhook secrets are found in your Stripe Dashboard under Webhooks\n');

// Error codes for CI/CD
if (!allRequired) {
  process.exit(1);
}

process.exit(0);
