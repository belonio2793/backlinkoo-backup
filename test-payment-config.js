/**
 * Test Payment Configuration
 * Verifies that Stripe environment variables are properly configured
 */

console.log('🧪 Testing Payment Configuration...\n');

// Test environment variables
const requiredEnvVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PREMIUM_PLAN_MONTHLY', 
  'VITE_STRIPE_PREMIUM_PLAN_ANNUAL',
  'VITE_STRIPE_MONTHLY_PRICE_ID',
  'VITE_STRIPE_YEARLY_PRICE_ID'
];

console.log('📋 Checking Environment Variables:\n');

const missingVars = [];
const configuredVars = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value.trim() !== '') {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    configuredVars.push(varName);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  }
});

console.log('\n📊 Configuration Summary:');
console.log(`✅ Configured: ${configuredVars.length}/${requiredEnvVars.length}`);
console.log(`❌ Missing: ${missingVars.length}/${requiredEnvVars.length}`);

if (missingVars.length === 0) {
  console.log('\n🎉 All payment environment variables are configured!');
  console.log('💳 Payment system should be working correctly.');
} else {
  console.log('\n⚠️  Some environment variables are missing:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Add these to your .env file to fix payment issues.');
}

console.log('\n🔧 Environment Details:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   - DEV Mode: ${process.env.VITE_DEV_MODE || 'not set'}`);

console.log('\n✨ Test completed!\n');
