// Quick test script for credits and premium webhook testing
// Run in browser console: testCreditsAndPremium()

const testCreditsAndPremium = async () => {
  console.log('🧪 Testing Credits & Premium Webhook Processing');
  console.log('===============================================');

  const results = {
    credits: [],
    premium: [],
    summary: { passed: 0, failed: 0, total: 0 }
  };

  // Test 1: Popular Credits Package (100 credits)
  console.log('\n💳 Testing Popular Credits Package (100 credits - $70)...');
  try {
    const creditsEvent = {
      id: 'evt_test_credits_100',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_credits_100',
          amount_total: 7000, // $70 in cents
          customer_email: 'test.credits@example.com',
          metadata: {
            email: 'test.credits@example.com',
            credits: '100',
            isGuest: 'false',
            productName: '100 Backlink Credits'
          },
          mode: 'payment',
          payment_status: 'paid',
          status: 'complete'
        }
      }
    };

    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature'
      },
      body: JSON.stringify(creditsEvent)
    });

    if (response.ok) {
      console.log('✅ Credits webhook succeeded');
      results.credits.push({ scenario: '100 Credits', success: true });
      results.summary.passed++;
    } else {
      const error = await response.text();
      console.log('❌ Credits webhook failed:', response.status);
      console.log('Error:', error);
      results.credits.push({ scenario: '100 Credits', success: false, error });
      results.summary.failed++;
    }
  } catch (error) {
    console.log('❌ Credits webhook error:', error.message);
    results.credits.push({ scenario: '100 Credits', success: false, error: error.message });
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 2: Guest Credits Purchase
  console.log('\n👤 Testing Guest Credits Purchase (50 credits - $35)...');
  try {
    const guestCreditsEvent = {
      id: 'evt_test_guest_credits',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_guest_credits',
          amount_total: 3500, // $35 in cents
          customer_email: 'guest.test@example.com',
          metadata: {
            email: 'guest.test@example.com',
            credits: '50',
            isGuest: 'true', // Key difference for guest checkout
            productName: '50 Backlink Credits (Guest)'
          },
          mode: 'payment',
          payment_status: 'paid',
          status: 'complete'
        }
      }
    };

    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature'
      },
      body: JSON.stringify(guestCreditsEvent)
    });

    if (response.ok) {
      console.log('✅ Guest credits webhook succeeded');
      results.credits.push({ scenario: '50 Credits (Guest)', success: true });
      results.summary.passed++;
    } else {
      const error = await response.text();
      console.log('❌ Guest credits webhook failed:', response.status);
      results.credits.push({ scenario: '50 Credits (Guest)', success: false, error });
      results.summary.failed++;
    }
  } catch (error) {
    console.log('❌ Guest credits webhook error:', error.message);
    results.credits.push({ scenario: '50 Credits (Guest)', success: false, error: error.message });
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 3: Monthly Premium Subscription
  console.log('\n👑 Testing Monthly Premium Subscription ($29/month)...');
  try {
    const premiumEvent = {
      id: 'evt_test_premium_monthly',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test_premium_monthly',
          customer: 'cus_test_premium',
          subscription: 'sub_test_premium_monthly',
          amount_paid: 2900, // $29 in cents
          status: 'paid'
        }
      }
    };

    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature'
      },
      body: JSON.stringify(premiumEvent)
    });

    if (response.ok) {
      console.log('✅ Premium subscription webhook succeeded');
      results.premium.push({ scenario: 'Monthly Premium', success: true });
      results.summary.passed++;
    } else {
      const error = await response.text();
      console.log('❌ Premium subscription webhook failed:', response.status);
      results.premium.push({ scenario: 'Monthly Premium', success: false, error });
      results.summary.failed++;
    }
  } catch (error) {
    console.log('❌ Premium subscription webhook error:', error.message);
    results.premium.push({ scenario: 'Monthly Premium', success: false, error: error.message });
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 4: Subscription Cancellation
  console.log('\n❌ Testing Subscription Cancellation...');
  try {
    const cancelEvent = {
      id: 'evt_test_cancel',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_cancel',
          customer: 'cus_test_cancel',
          status: 'canceled',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
          metadata: {
            email: 'test.cancel@example.com',
            plan: 'monthly',
            isGuest: 'false'
          }
        }
      }
    };

    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature'
      },
      body: JSON.stringify(cancelEvent)
    });

    if (response.ok) {
      console.log('✅ Subscription cancellation webhook succeeded');
      results.premium.push({ scenario: 'Subscription Cancellation', success: true });
      results.summary.passed++;
    } else {
      const error = await response.text();
      console.log('❌ Subscription cancellation webhook failed:', response.status);
      results.premium.push({ scenario: 'Subscription Cancellation', success: false, error });
      results.summary.failed++;
    }
  } catch (error) {
    console.log('❌ Subscription cancellation webhook error:', error.message);
    results.premium.push({ scenario: 'Subscription Cancellation', success: false, error: error.message });
    results.summary.failed++;
  }
  results.summary.total++;

  // Results Summary
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

  console.log('\n💳 Credits Tests:');
  results.credits.forEach(test => {
    console.log(`  ${test.success ? '✅' : '❌'} ${test.scenario}`);
  });

  console.log('\n👑 Premium Tests:');
  results.premium.forEach(test => {
    console.log(`  ${test.success ? '✅' : '❌'} ${test.scenario}`);
  });

  console.log('\n🔗 Payment Modal Coverage:');
  console.log('  Credits: EnhancedUnifiedPaymentModal, PricingModal, BuyCreditsButton');
  console.log('  Premium: PremiumCheckoutModal, EnhancedPremiumCheckoutModal, UpgradeToPremiumButton');
  console.log('  Guest: All credit modals support guest checkout');

  console.log('\n💡 Next Steps:');
  if (results.summary.failed === 0) {
    console.log('  ✅ All tests passed! Your webhook system is working correctly.');
    console.log('  🔍 Check your database to verify data was properly stored.');
    console.log('  📋 Review Netlify function logs for processing details.');
  } else {
    console.log('  ⚠️  Some tests failed. Check the errors above.');
    console.log('  🔧 Review your webhook implementation in netlify/functions/payment-webhook.mts');
    console.log('  🔍 Check environment variables and database permissions.');
  }

  return results;
};

// Additional helper functions
const testSpecificCredits = async (credits, amount) => {
  console.log(`Testing ${credits} credits for $${amount}...`);
  
  const event = {
    id: `evt_test_credits_${credits}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_test_credits_${credits}`,
        amount_total: amount * 100,
        customer_email: `test.${credits}credits@example.com`,
        metadata: {
          email: `test.${credits}credits@example.com`,
          credits: credits.toString(),
          isGuest: 'false',
          productName: `${credits} Backlink Credits`
        },
        mode: 'payment',
        payment_status: 'paid',
        status: 'complete'
      }
    }
  };

  try {
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature'
      },
      body: JSON.stringify(event)
    });

    if (response.ok) {
      console.log(`✅ ${credits} credits test passed`);
      return true;
    } else {
      console.log(`❌ ${credits} credits test failed:`, response.status);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${credits} credits test error:`, error.message);
    return false;
  }
};

const testSpecificPremium = async (plan, amount) => {
  console.log(`Testing ${plan} premium plan for $${amount}...`);
  
  const event = {
    id: `evt_test_premium_${plan}`,
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: `in_test_premium_${plan}`,
        customer: `cus_test_premium_${plan}`,
        subscription: `sub_test_premium_${plan}`,
        amount_paid: amount * 100,
        status: 'paid'
      }
    }
  };

  try {
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature'
      },
      body: JSON.stringify(event)
    });

    if (response.ok) {
      console.log(`✅ ${plan} premium test passed`);
      return true;
    } else {
      console.log(`❌ ${plan} premium test failed:`, response.status);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${plan} premium test error:`, error.message);
    return false;
  }
};

// Make functions available globally
window.testCreditsAndPremium = testCreditsAndPremium;
window.testSpecificCredits = testSpecificCredits;
window.testSpecificPremium = testSpecificPremium;

console.log('🧪 Credits & Premium Webhook Tester loaded!');
console.log('📋 Available functions:');
console.log('  • testCreditsAndPremium() - Run all tests');
console.log('  • testSpecificCredits(credits, amount) - Test specific credit amount');
console.log('  • testSpecificPremium(plan, amount) - Test specific premium plan');
console.log('\n🚀 Run testCreditsAndPremium() to start testing!');
