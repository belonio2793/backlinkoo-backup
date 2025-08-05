// Simple webhook test that can be run in the browser console
const testWebhooks = async () => {
  console.log('🧪 Starting Stripe Webhook Tests...');
  console.log('================================');

  // Test 1: Endpoint Health Check
  console.log('\n1️⃣ Testing webhook endpoint...');
  try {
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'health-check' })
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ Webhook endpoint is accessible');
      console.log('📄 Response:', result);
    } else {
      const error = await response.text();
      console.log('❌ Webhook endpoint failed:', response.status);
      console.log('📄 Error:', error);
    }
  } catch (error) {
    console.log('❌ Webhook endpoint unreachable:', error.message);
  }

  // Test 2: Payment Completion Webhook
  console.log('\n2️⃣ Testing payment completion webhook...');
  const paymentEvent = {
    id: 'evt_test_payment',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session',
        amount_total: 2900,
        customer_email: 'test@example.com',
        metadata: {
          email: 'test@example.com',
          credits: '100',
          isGuest: 'false',
          productName: 'Test Credits'
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
      body: JSON.stringify(paymentEvent)
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ Payment webhook processed successfully');
      console.log('📄 Response:', result);
    } else {
      const error = await response.text();
      console.log('❌ Payment webhook failed:', response.status);
      console.log('📄 Error:', error);
    }
  } catch (error) {
    console.log('❌ Payment webhook error:', error.message);
  }

  // Test 3: Subscription Webhook
  console.log('\n3️⃣ Testing subscription webhook...');
  const subscriptionEvent = {
    id: 'evt_test_subscription',
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: 'in_test_invoice',
        customer: 'cus_test_customer',
        subscription: 'sub_test_subscription',
        amount_paid: 2900,
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
      body: JSON.stringify(subscriptionEvent)
    });

    if (response.ok) {
      const result = await response.text();
      console.log('✅ Subscription webhook processed successfully');
      console.log('📄 Response:', result);
    } else {
      const error = await response.text();
      console.log('❌ Subscription webhook failed:', response.status);
      console.log('📄 Error:', error);
    }
  } catch (error) {
    console.log('❌ Subscription webhook error:', error.message);
  }

  console.log('\n🎉 Webhook testing completed!');
  console.log('\nTo test more thoroughly:');
  console.log('1. Visit /test-webhooks for a full UI test');
  console.log('2. Check Netlify function logs for detailed processing info');
  console.log('3. Use Stripe CLI for real webhook testing: stripe listen --forward-to localhost:8888/api/webhook');
};

// Make it available globally
window.testWebhooks = testWebhooks;

console.log('🧪 Webhook tester loaded! Run testWebhooks() to start testing.');
