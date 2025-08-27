#!/usr/bin/env node

/**
 * Stripe Environment Variables Diagnostic Tool
 * Checks if all required Stripe environment variables are properly configured
 */

console.log('🔍 Stripe Environment Variables Diagnostic');
console.log('==========================================');

// Required environment variables for Stripe integration
const requiredServerVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_MONTHLY_PRICE_ID', 
  'STRIPE_YEARLY_PRICE_ID'
];

const requiredClientVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY'
];

const optionalVars = [
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PREMIUM_PLAN_MONTHLY',
  'STRIPE_PREMIUM_PLAN_ANNUAL'
];

console.log('\n📋 Checking Server-side Variables (Netlify Functions):');
console.log('=====================================================');

requiredServerVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const maskedValue = varName.includes('SECRET') || varName.includes('KEY') 
      ? `${value.substring(0, 7)}...` 
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n📱 Checking Client-side Variables (Frontend):');
console.log('==============================================');

requiredClientVars.forEach(varName => {
  // Note: In Node.js environment, we can't check import.meta.env
  // This would need to be run in the browser environment
  console.log(`ℹ️  ${varName}: Check in browser console with import.meta.env.${varName}`);
});

console.log('\n🔧 Optional Variables:');
console.log('======================');

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  }
});

console.log('\n🚨 Security Check:');
console.log('==================');

// Check for security issues
const securityIssues = [];

if (process.env.VITE_STRIPE_SECRET_KEY) {
  securityIssues.push('VITE_STRIPE_SECRET_KEY found - this exposes your secret key to the frontend!');
}

if (securityIssues.length > 0) {
  console.log('❌ SECURITY ISSUES FOUND:');
  securityIssues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✅ No obvious security issues detected');
}

console.log('\n📝 Expected Configuration for Netlify:');
console.log('======================================');
console.log('Server-side environment variables (Functions):');
console.log('STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)');
console.log('STRIPE_MONTHLY_PRICE_ID=price_... (from Stripe dashboard)');
console.log('STRIPE_YEARLY_PRICE_ID=price_... (from Stripe dashboard)');
console.log('STRIPE_WEBHOOK_SECRET=whsec_... (optional)');
console.log('');
console.log('Client-side environment variables (Build):');
console.log('VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)');

console.log('\n🎯 Next Steps:');
console.log('===============');
console.log('1. Ensure STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID are set');
console.log('2. Remove VITE_STRIPE_SECRET_KEY if present (security risk)');
console.log('3. Verify Stripe keys are for the correct environment (test vs live)');
console.log('4. Test payment flow after configuration');
