/**
 * Test script to verify subscription endpoints are working
 */

async function testSubscriptionEndpoints() {
  console.log('🧪 Testing subscription endpoints...');
  
  const endpoints = [
    '/.netlify/functions/create-subscription',
    '/api/create-subscription'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing ${endpoint}...`);
      
      // Test OPTIONS request (CORS preflight)
      const optionsResponse = await fetch(endpoint, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        }
      });
      
      console.log(`✅ OPTIONS ${endpoint}: ${optionsResponse.status}`);
      
      // Test POST request with valid data
      const postResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        body: JSON.stringify({
          plan: 'monthly',
          isGuest: true,
          guestEmail: 'test@example.com',
          paymentMethod: 'stripe'
        })
      });
      
      const responseText = await postResponse.text();
      console.log(`📊 POST ${endpoint}: ${postResponse.status}`);
      
      if (postResponse.status === 404) {
        console.log(`❌ Endpoint not found: ${endpoint}`);
      } else if (postResponse.status === 500) {
        console.log(`⚠️ Server error (expected if Stripe not configured): ${responseText.substring(0, 200)}`);
      } else {
        console.log(`✅ Endpoint responding: ${responseText.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${endpoint}:`, error.message);
    }
  }
}

// Test function availability
async function testFunctionAvailability() {
  console.log('\n🔍 Checking function file availability...');
  
  try {
    // Check if the subscription function exists
    const functionFiles = [
      'netlify/functions/create-subscription.mts',
      'netlify/functions/create-payment.mts',
      'netlify/functions/payment-webhook.mts'
    ];
    
    for (const file of functionFiles) {
      try {
        const response = await fetch(`/${file}`);
        console.log(`📁 ${file}: ${response.status === 404 ? 'Not publicly accessible (correct)' : 'Accessible'}`);
      } catch (error) {
        console.log(`📁 ${file}: File check failed (expected)`);
      }
    }
  } catch (error) {
    console.error('Function availability check failed:', error);
  }
}

// Run tests
testSubscriptionEndpoints()
  .then(() => testFunctionAvailability())
  .then(() => {
    console.log('\n✅ Subscription endpoint testing completed');
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
  });
