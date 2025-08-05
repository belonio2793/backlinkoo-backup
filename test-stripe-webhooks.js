#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script
 * 
 * This script tests the Stripe webhook implementation by:
 * 1. Checking webhook endpoint availability
 * 2. Sending mock webhook events
 * 3. Verifying database updates
 * 4. Testing different event types
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Initialize Supabase client
let supabase;
try {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
} catch (error) {
  log(`❌ Supabase initialization failed: ${error.message}`, colors.red);
  process.exit(1);
}

// Mock webhook events for testing
const mockEvents = {
  checkoutSessionCompleted: {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_webhook_session',
        object: 'checkout.session',
        amount_total: 2900, // $29.00 in cents
        customer_email: 'test.webhook@example.com',
        metadata: {
          email: 'test.webhook@example.com',
          credits: '100',
          isGuest: 'false',
          productName: 'Webhook Test Credits'
        },
        mode: 'payment',
        payment_status: 'paid',
        status: 'complete'
      }
    }
  },
  
  subscriptionPaymentSucceeded: {
    id: 'evt_test_subscription_webhook',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: 'in_test_webhook_invoice',
        object: 'invoice',
        customer: 'cus_test_webhook_customer',
        subscription: 'sub_test_webhook_subscription',
        amount_paid: 2900,
        status: 'paid'
      }
    }
  },
  
  subscriptionCanceled: {
    id: 'evt_test_cancel_webhook',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_webhook_subscription',
        object: 'subscription',
        customer: 'cus_test_webhook_customer',
        status: 'canceled',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        metadata: {
          email: 'test.webhook@example.com',
          plan: 'monthly',
          isGuest: 'false'
        }
      }
    }
  }
};

async function testEndpointHealth() {
  log('\n🔍 Testing webhook endpoint health...', colors.cyan);
  
  try {
    const baseUrl = process.env.NETLIFY_URL || 'http://localhost:8888';
    const response = await fetch(`${baseUrl}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'health-check' })
    });
    
    if (response.ok) {
      log('✅ Webhook endpoint is accessible', colors.green);
      return true;
    } else {
      log(`❌ Webhook endpoint returned ${response.status}`, colors.red);
      const text = await response.text();
      log(`Response: ${text}`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`❌ Webhook endpoint unreachable: ${error.message}`, colors.red);
    return false;
  }
}

async function sendMockWebhook(eventName, eventData) {
  log(`\n📤 Sending mock ${eventName} webhook...`, colors.cyan);
  
  try {
    const baseUrl = process.env.NETLIFY_URL || 'http://localhost:8888';
    const response = await fetch(`${baseUrl}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'mock_signature_for_testing'
      },
      body: JSON.stringify(eventData)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      log(`✅ ${eventName} webhook processed successfully`, colors.green);
      log(`Response: ${responseText}`, colors.blue);
      return true;
    } else {
      log(`❌ ${eventName} webhook failed with status ${response.status}`, colors.red);
      log(`Response: ${responseText}`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`❌ Error sending ${eventName} webhook: ${error.message}`, colors.red);
    return false;
  }
}

async function checkDatabaseUpdates(testEmail) {
  log('\n🔍 Checking database updates...', colors.cyan);
  
  try {
    // Check orders table
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('email', testEmail)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      log(`❌ Error checking orders: ${ordersError.message}`, colors.red);
    } else {
      log(`✅ Found ${orders?.length || 0} orders for ${testEmail}`, colors.green);
      if (orders && orders.length > 0) {
        const latestOrder = orders[0];
        log(`Latest order: ID=${latestOrder.id}, Amount=$${latestOrder.amount/100}, Status=${latestOrder.status}`, colors.blue);
      }
    }
    
    // Check subscribers table
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', testEmail)
      .limit(5);
    
    if (subscribersError) {
      log(`❌ Error checking subscribers: ${subscribersError.message}`, colors.red);
    } else {
      log(`✅ Found ${subscribers?.length || 0} subscriptions for ${testEmail}`, colors.green);
      if (subscribers && subscribers.length > 0) {
        const latestSub = subscribers[0];
        log(`Latest subscription: Tier=${latestSub.subscription_tier}, Status=${latestSub.status}, Subscribed=${latestSub.subscribed}`, colors.blue);
      }
    }
    
    // Check user_credits table
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .limit(5);
    
    if (creditsError) {
      log(`❌ Error checking user credits: ${creditsError.message}`, colors.red);
    } else {
      log(`✅ Found ${credits?.length || 0} user credit records`, colors.green);
    }
    
  } catch (error) {
    log(`❌ Database check failed: ${error.message}`, colors.red);
  }
}

async function testEnvironmentVariables() {
  log('\n🔍 Checking environment variables...', colors.cyan);
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  const optionalVars = [
    'STRIPE_WEBHOOK_SECRET',
    'NETLIFY_URL'
  ];
  
  let allRequired = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName} is configured`, colors.green);
    } else {
      log(`❌ ${varName} is missing`, colors.red);
      allRequired = false;
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName} is configured`, colors.green);
    } else {
      log(`⚠️  ${varName} is not configured (optional)`, colors.yellow);
    }
  });
  
  return allRequired;
}

async function cleanupTestData(testEmail) {
  log('\n🧹 Cleaning up test data...', colors.cyan);
  
  try {
    // Clean up test orders
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('email', testEmail);
    
    if (ordersError) {
      log(`⚠️  Could not clean up test orders: ${ordersError.message}`, colors.yellow);
    } else {
      log('✅ Test orders cleaned up', colors.green);
    }
    
    // Clean up test subscriptions
    const { error: subscribersError } = await supabase
      .from('subscribers')
      .delete()
      .eq('email', testEmail);
    
    if (subscribersError) {
      log(`⚠️  Could not clean up test subscriptions: ${subscribersError.message}`, colors.yellow);
    } else {
      log('✅ Test subscriptions cleaned up', colors.green);
    }
    
  } catch (error) {
    log(`⚠️  Cleanup failed: ${error.message}`, colors.yellow);
  }
}

async function simulateStripeEvents() {
  log('\n🎭 Simulating Stripe events...', colors.cyan);
  
  const testEmail = 'test.webhook@example.com';
  
  // Test 1: Payment success
  log('\n--- Test 1: Payment Success ---', colors.bright);
  await sendMockWebhook('checkout.session.completed', mockEvents.checkoutSessionCompleted);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for processing
  
  // Test 2: Subscription payment success  
  log('\n--- Test 2: Subscription Payment Success ---', colors.bright);
  await sendMockWebhook('invoice.payment_succeeded', mockEvents.subscriptionPaymentSucceeded);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Subscription cancellation
  log('\n--- Test 3: Subscription Cancellation ---', colors.bright);
  await sendMockWebhook('customer.subscription.deleted', mockEvents.subscriptionCanceled);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check database state
  await checkDatabaseUpdates(testEmail);
  
  // Cleanup
  await cleanupTestData(testEmail);
}

async function main() {
  log('🧪 Stripe Webhook Test Suite', colors.bright + colors.magenta);
  log('================================', colors.magenta);
  
  try {
    // Check environment
    const envCheck = await testEnvironmentVariables();
    if (!envCheck) {
      log('\n❌ Environment check failed. Please configure required variables.', colors.red);
      process.exit(1);
    }
    
    // Test endpoint health
    const healthCheck = await testEndpointHealth();
    if (!healthCheck) {
      log('\n❌ Endpoint health check failed. Make sure your dev server is running.', colors.red);
      log('Try running: npm run dev or netlify dev', colors.yellow);
      process.exit(1);
    }
    
    // Run webhook simulations
    await simulateStripeEvents();
    
    log('\n🎉 Webhook testing completed!', colors.bright + colors.green);
    log('\nNext steps:', colors.cyan);
    log('1. Check your Netlify function logs for detailed webhook processing', colors.blue);
    log('2. Test with real Stripe test events using Stripe CLI or dashboard', colors.blue);
    log('3. Verify webhook signature validation in production', colors.blue);
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, testEndpointHealth, sendMockWebhook, checkDatabaseUpdates };
