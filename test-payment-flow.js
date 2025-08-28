// Test script to verify payment flow is working
const testPaymentFlow = async () => {
  console.log('🧪 Testing Payment Flow...\n');

  // Test 1: Check environment variables
  console.log('1. Checking Environment Variables:');
  const viteStripeKey = import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  console.log(`   VITE_STRIPE_PUBLISHABLE_KEY: ${viteStripeKey ? viteStripeKey.substring(0, 12) + '...' : 'NOT SET'}`);
  console.log(`   Valid format: ${viteStripeKey?.startsWith('pk_') ? '✅' : '❌'}`);
  console.log('');

  // Test 2: Check if payment endpoint is accessible
  console.log('2. Testing Payment Endpoints:');
  
  const testEndpoints = [
    '/.netlify/functions/create-payment',
    '/api/create-payment'
  ];

  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 70,
          credits: 50,
          productName: 'Test 50 Credits',
          paymentMethod: 'stripe',
          isGuest: true,
          guestEmail: 'test@example.com'
        })
      });

      console.log(`   ${endpoint}: ${response.status === 200 ? '✅' : '❌'} (${response.status})`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Response: ${data.url ? 'Has checkout URL ✅' : 'Missing URL ❌'}`);
        if (data.url) {
          console.log(`   Checkout URL: ${data.url.substring(0, 50)}...`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   ${endpoint}: ❌ Network Error - ${error.message}`);
    }
    console.log('');
  }

  // Test 3: Test Stripe Key Format
  console.log('3. Stripe Configuration Summary:');
  if (!viteStripeKey) {
    console.log('   ❌ No Stripe publishable key found');
    console.log('   💡 Set VITE_STRIPE_PUBLISHABLE_KEY environment variable');
  } else if (!viteStripeKey.startsWith('pk_')) {
    console.log('   ❌ Invalid Stripe key format');
    console.log('   💡 Stripe keys should start with pk_test_ or pk_live_');
  } else if (viteStripeKey.startsWith('pk_test_')) {
    console.log('   ✅ Test mode configured (good for development)');
  } else if (viteStripeKey.startsWith('pk_live_')) {
    console.log('   ✅ Live mode configured (production ready)');
  }
  
  console.log('\n🎯 Test Complete!');
};

// Run test if in browser environment
if (typeof window !== 'undefined') {
  testPaymentFlow();
} else {
  // Node.js environment
  console.log('Run this script in browser console or add to your app temporarily');
}

export { testPaymentFlow };
