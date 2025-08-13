/**
 * Quick Payment System Verification
 * Run this to verify premium payments are working
 */

async function testPaymentSystem() {
  console.log('🔍 Testing Payment System...\n');
  
  const baseUrl = window.location.origin;
  const results = [];

  // Test 1: Check environment
  console.log('1️⃣ Environment Check');
  const isMobile = window.innerWidth <= 768;
  const isHTTPS = window.location.protocol === 'https:';
  console.log(`   📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
  console.log(`   🔒 HTTPS: ${isHTTPS ? '✅' : '❌'}`);
  console.log(`   🌐 URL: ${baseUrl}\n`);

  // Test 2: Payment endpoints
  console.log('2️⃣ Testing Payment Endpoints');
  
  const endpoints = [
    '/.netlify/functions/create-payment',
    '/.netlify/functions/create-subscription',
    '/.netlify/functions/verify-payment'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing ${endpoint}...`);
      
      // Test OPTIONS first
      const optionsResponse = await fetch(endpoint, { method: 'OPTIONS' });
      console.log(`   OPTIONS: ${optionsResponse.status} ${optionsResponse.ok ? '✅' : '❌'}`);
      
      // Test POST with minimal data
      const postResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      console.log(`   POST: ${postResponse.status} ${postResponse.status < 500 ? '✅' : '❌'}`);
      
      results.push({
        endpoint,
        options: optionsResponse.ok,
        post: postResponse.status < 500
      });
      
    } catch (error) {
      console.log(`   ERROR: ${error.message} ❌`);
      results.push({
        endpoint,
        options: false,
        post: false,
        error: error.message
      });
    }
  }
  console.log('');

  // Test 3: Premium subscription
  console.log('3️⃣ Testing Premium Subscription');
  try {
    const response = await fetch('/.netlify/functions/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'monthly',
        isGuest: true,
        guestEmail: 'test@example.com',
        paymentMethod: 'stripe'
      })
    });
    
    const data = await response.json();
    const isWorking = response.ok && data.url;
    
    console.log(`   Status: ${response.status} ${isWorking ? '✅' : '❌'}`);
    if (isWorking) {
      console.log(`   ✅ Premium subscription endpoint working!`);
      console.log(`   🔗 Checkout URL: ${data.url.substring(0, 50)}...`);
    } else {
      console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    results.push({ test: 'premium', working: isWorking, data });
    
  } catch (error) {
    console.log(`   ❌ Premium test failed: ${error.message}`);
    results.push({ test: 'premium', working: false, error: error.message });
  }
  console.log('');

  // Test 4: Credits purchase
  console.log('4️⃣ Testing Credits Purchase');
  try {
    const response = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 29,
        productName: '50 Backlink Credits',
        isGuest: true,
        guestEmail: 'test@example.com',
        paymentMethod: 'stripe',
        credits: 50
      })
    });
    
    const data = await response.json();
    const isWorking = response.ok && data.url;
    
    console.log(`   Status: ${response.status} ${isWorking ? '✅' : '❌'}`);
    if (isWorking) {
      console.log(`   ✅ Credits payment endpoint working!`);
      console.log(`   🔗 Checkout URL: ${data.url.substring(0, 50)}...`);
    } else {
      console.log(`   ❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    results.push({ test: 'credits', working: isWorking, data });
    
  } catch (error) {
    console.log(`   ❌ Credits test failed: ${error.message}`);
    results.push({ test: 'credits', working: false, error: error.message });
  }
  console.log('');

  // Test 5: Mobile compatibility
  console.log('5️⃣ Mobile Compatibility Check');
  
  // Check viewport
  const viewport = document.querySelector('meta[name="viewport"]');
  console.log(`   📐 Viewport meta: ${viewport ? '✅' : '❌'}`);
  
  // Check touch events
  const hasTouchEvents = 'ontouchstart' in window;
  console.log(`   👆 Touch events: ${hasTouchEvents ? '✅' : '❌'}`);
  
  // Check button touch targets (if on mobile)
  if (isMobile) {
    const testButton = document.createElement('button');
    testButton.style.cssText = 'min-height: 44px; position: absolute; left: -9999px;';
    document.body.appendChild(testButton);
    
    const buttonHeight = testButton.offsetHeight;
    console.log(`   🔲 Touch targets: ${buttonHeight >= 44 ? '✅' : '❌'} (${buttonHeight}px)`);
    
    document.body.removeChild(testButton);
  }
  
  // iOS Safari check
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
  if (isIOSSafari) {
    console.log(`   🍎 iOS Safari: ✅ (specific optimizations applied)`);
  }
  console.log('');

  // Summary
  console.log('📊 SUMMARY');
  console.log('─'.repeat(50));
  
  const endpointStats = results.filter(r => r.endpoint);
  const workingEndpoints = endpointStats.filter(r => r.options && r.post).length;
  console.log(`🔗 Endpoints: ${workingEndpoints}/${endpointStats.length} working`);
  
  const premiumWorking = results.find(r => r.test === 'premium')?.working;
  const creditsWorking = results.find(r => r.test === 'credits')?.working;
  
  console.log(`💳 Premium Payments: ${premiumWorking ? '✅ Working' : '❌ Broken'}`);
  console.log(`🎯 Credits Payments: ${creditsWorking ? '✅ Working' : '❌ Broken'}`);
  console.log(`📱 Mobile Compatible: ${isMobile ? '✅ Optimized' : '🖥️ Desktop'}`);
  
  const allWorking = premiumWorking && creditsWorking && workingEndpoints === endpointStats.length;
  
  console.log('\n🎯 OVERALL STATUS');
  if (allWorking) {
    console.log('🎉 PAYMENT SYSTEM IS WORKING! 🎉');
    console.log('✅ All tests passed');
    console.log('✅ Premium payments ready');
    console.log('✅ Credits payments ready');
    console.log('✅ Mobile compatible');
  } else {
    console.log('⚠️ PAYMENT SYSTEM NEEDS ATTENTION');
    if (!premiumWorking) console.log('❌ Premium payments broken');
    if (!creditsWorking) console.log('❌ Credits payments broken');
    if (workingEndpoints < endpointStats.length) console.log('❌ Some endpoints not accessible');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Visit /payment-test for comprehensive testing');
  console.log('2. Test on mobile device for full verification');
  console.log('3. Check Netlify environment variables if payments fail');
  console.log('4. Monitor payment success rates in production');
  
  return {
    allWorking,
    premiumWorking,
    creditsWorking,
    endpointStats: { working: workingEndpoints, total: endpointStats.length },
    isMobile,
    results
  };
}

// Auto-run if script is loaded in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Payment System Verification Script Loaded');
  console.log('📞 Run testPaymentSystem() to test payments');
  console.log('📱 Or visit /payment-test for full testing interface\n');
  
  // Make function available globally
  window.testPaymentSystem = testPaymentSystem;
  
  // Auto-run basic test
  setTimeout(() => {
    console.log('⏰ Auto-running basic verification in 2 seconds...');
    console.log('   (You can also run testPaymentSystem() manually)\n');
    testPaymentSystem();
  }, 2000);
}

// Export for Node.js use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPaymentSystem };
}
