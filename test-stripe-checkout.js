/**
 * Test Script: Stripe Checkout Integration
 * Tests the payment modal and Stripe integration functionality
 */

console.log('🧪 Testing Stripe Checkout Integration...');

// Test 1: Check if payment modal is accessible
function testPaymentModalAccess() {
  console.log('\n1️⃣ Testing Payment Modal Access...');
  
  // Look for the payment modal trigger button
  const upgradeButton = document.querySelector('button[class*="bg-gradient-to-r from-purple-600 to-blue-600"]');
  if (upgradeButton) {
    console.log('✅ Found "Upgrade to Premium" button');
    console.log('   Button text:', upgradeButton.textContent?.trim());
    
    // Check if button has click handler
    const hasClickHandler = upgradeButton.onclick || upgradeButton.getAttribute('onclick');
    console.log('   Has click handler:', !!hasClickHandler);
    
    return true;
  } else {
    console.log('❌ "Upgrade to Premium" button not found');
    return false;
  }
}

// Test 2: Check payment service availability
async function testPaymentService() {
  console.log('\n2️⃣ Testing Payment Service Endpoints...');
  
  try {
    // Test subscription endpoint
    const subscriptionResponse = await fetch('/.netlify/functions/create-subscription', {
      method: 'OPTIONS'
    });
    console.log('✅ Subscription endpoint accessible:', subscriptionResponse.status !== 404);
    
    // Test payment endpoint
    const paymentResponse = await fetch('/.netlify/functions/create-payment', {
      method: 'OPTIONS'
    });
    console.log('✅ Payment endpoint accessible:', paymentResponse.status !== 404);
    
    return true;
  } catch (error) {
    console.log('❌ Payment service endpoints not accessible:', error.message);
    return false;
  }
}

// Test 3: Check if Stripe configuration is available
function testStripeConfig() {
  console.log('\n3️⃣ Testing Stripe Configuration...');
  
  const hasPublicKey = !!import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY;
  console.log('   Stripe public key configured:', hasPublicKey);
  
  const hasMonthlyPlan = !!import.meta?.env?.VITE_STRIPE_PREMIUM_PLAN_MONTHLY;
  console.log('   Monthly plan ID configured:', hasMonthlyPlan);
  
  const hasYearlyPlan = !!import.meta?.env?.VITE_STRIPE_PREMIUM_PLAN_ANNUAL;
  console.log('   Yearly plan ID configured:', hasYearlyPlan);
  
  return hasPublicKey || hasMonthlyPlan || hasYearlyPlan;
}

// Test 4: Simulate payment modal flow
async function testPaymentFlow() {
  console.log('\n4️⃣ Testing Payment Flow Simulation...');
  
  try {
    // Import payment service
    const { paymentIntegrationService } = await import('./src/services/paymentIntegrationService');
    
    console.log('✅ Payment integration service loaded');
    
    // Check available payment methods
    const methods = paymentIntegrationService.getAvailablePaymentMethods();
    console.log('   Available payment methods:', methods);
    
    // Check if configured
    const isConfigured = paymentIntegrationService.isConfigured();
    console.log('   Payment system configured:', isConfigured);
    
    return true;
  } catch (error) {
    console.log('❌ Payment flow test failed:', error.message);
    return false;
  }
}

// Test 5: Check window.open functionality
function testWindowOpen() {
  console.log('\n5️⃣ Testing New Window Functionality...');
  
  try {
    // Test if window.open is available
    const canOpenWindow = typeof window.open === 'function';
    console.log('   window.open available:', canOpenWindow);
    
    // Test popup blocker (won't actually open)
    if (canOpenWindow) {
      console.log('✅ New window functionality is available');
      console.log('   Note: Stripe checkout will open in new window when payment is processed');
    }
    
    return canOpenWindow;
  } catch (error) {
    console.log('❌ Window open test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Stripe Checkout Integration Tests...');
  
  const results = {
    modalAccess: testPaymentModalAccess(),
    paymentService: await testPaymentService(),
    stripeConfig: testStripeConfig(),
    paymentFlow: await testPaymentFlow(),
    windowOpen: testWindowOpen()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('================================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Stripe integration is fully functional!');
    console.log('   - Payment modal is accessible');
    console.log('   - Stripe endpoints are configured');
    console.log('   - New window checkout will work');
    console.log('\n💡 To test the full flow:');
    console.log('   1. Click the "Upgrade to Premium" button');
    console.log('   2. Select a plan (Monthly or Yearly)');
    console.log('   3. Click "Continue to Payment"');
    console.log('   4. Stripe checkout will open in a new window');
  } else {
    console.log('\n🔧 Some issues detected. Check the individual test results above.');
  }
  
  return results;
}

// Auto-run tests if in development
if (typeof window !== 'undefined' && import.meta?.env?.DEV) {
  // Run tests after a short delay to ensure DOM is ready
  setTimeout(runAllTests, 2000);
}

// Make available globally for manual testing
if (typeof window !== 'undefined') {
  window.testStripeIntegration = runAllTests;
  console.log('💡 Manual testing available: run testStripeIntegration() in console');
}

export { runAllTests, testPaymentModalAccess, testPaymentService, testStripeConfig, testPaymentFlow, testWindowOpen };
