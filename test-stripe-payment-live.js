#!/usr/bin/env node

/**
 * Test Script for Live Stripe Payment Integration
 * Tests credit purchase flow with real Stripe keys
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  credits: 100,
  amount: 140,
  productName: "100 Test Credits",
  guestEmail: "test@backlinkoo.com",
  endpoints: [
    'http://localhost:3001/.netlify/functions/create-payment',
    'http://localhost:3001/api/create-payment',
    'http://localhost:3001/functions/create-payment'
  ]
};

async function testPaymentEndpoint(endpoint, testData) {
  console.log(`\n🧪 Testing endpoint: ${endpoint}`);
  console.log(`📊 Test data:`, testData);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);

    const responseData = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseData);
      console.log(`✅ Success! Response:`, {
        url: data.url ? 'STRIPE_CHECKOUT_URL_CREATED' : 'NO_URL',
        sessionId: data.sessionId ? 'SESSION_ID_PRESENT' : 'NO_SESSION',
        hasUrl: !!data.url
      });

      // Validate Stripe URL format
      if (data.url && data.url.includes('checkout.stripe.com')) {
        console.log(`🎯 Valid Stripe checkout URL generated!`);
        return { success: true, endpoint, data };
      } else {
        console.log(`⚠️ Invalid or missing Stripe URL`);
        return { success: false, endpoint, error: 'Invalid Stripe URL' };
      }
    } else {
      console.log(`❌ Error response:`, responseData);
      return { success: false, endpoint, error: responseData };
    }
  } catch (error) {
    console.log(`🔥 Request failed:`, error.message);
    return { success: false, endpoint, error: error.message };
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const required = [
    'STRIPE_SECRET_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const envStatus = {};
  
  for (const key of required) {
    const value = process.env[key];
    if (value) {
      envStatus[key] = value.startsWith('sk_live_') || value.startsWith('pk_live_') || value.startsWith('whsec_') 
        ? '✅ SET (LIVE)' 
        : value.startsWith('sk_test_') || value.startsWith('pk_test_') 
        ? '✅ SET (TEST)' 
        : '⚠️ SET (UNKNOWN FORMAT)';
    } else {
      envStatus[key] = '❌ NOT SET';
    }
  }

  console.table(envStatus);
  return envStatus;
}

async function runTests() {
  console.log('🚀 Starting Stripe Payment Integration Tests\n');
  console.log('=' * 50);

  // Test environment variables
  const envStatus = await testEnvironmentVariables();

  // Test data variants
  const testVariants = [
    {
      name: 'Guest Purchase - 100 Credits',
      data: {
        amount: TEST_CONFIG.amount,
        credits: TEST_CONFIG.credits,
        productName: TEST_CONFIG.productName,
        paymentMethod: 'stripe',
        isGuest: true,
        guestEmail: TEST_CONFIG.guestEmail
      }
    },
    {
      name: 'Authenticated User - 250 Credits',
      data: {
        amount: 350,
        credits: 250,
        productName: '250 Premium Credits',
        paymentMethod: 'stripe',
        isGuest: false,
        guestEmail: 'user@backlinkoo.com'
      }
    }
  ];

  const results = [];

  for (const variant of testVariants) {
    console.log(`\n📋 Testing: ${variant.name}`);
    console.log('=' * 30);

    for (const endpoint of TEST_CONFIG.endpoints) {
      const result = await testPaymentEndpoint(endpoint, variant.data);
      results.push({ variant: variant.name, ...result });
    }
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' * 50);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful tests: ${successful.length}`);
  console.log(`❌ Failed tests: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n🎉 Working endpoints:');
    successful.forEach(r => {
      console.log(`  - ${r.endpoint} (${r.variant})`);
    });
  }

  if (failed.length > 0) {
    console.log('\n🔥 Failed endpoints:');
    failed.forEach(r => {
      console.log(`  - ${r.endpoint} (${r.variant}): ${r.error}`);
    });
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('=' * 50);

  if (successful.length === 0) {
    console.log('❌ No payment endpoints are working!');
    console.log('🔧 Check:');
    console.log('   1. Netlify functions are deployed');
    console.log('   2. Environment variables are set correctly');
    console.log('   3. Stripe keys are valid');
    console.log('   4. Functions are accessible at the expected URLs');
  } else {
    console.log('✅ Payment system is working!');
    console.log('🎯 Next steps:');
    console.log('   1. Test checkout flow in browser');
    console.log('   2. Configure webhooks for automatic credit allocation');
    console.log('   3. Test subscription payments');
  }

  return results;
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testPaymentEndpoint };
