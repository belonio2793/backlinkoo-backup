// Simple payment test to identify issues
// Run in browser console: testPaymentIssues()

const testPaymentIssues = async () => {
  console.log('🔍 Investigating Payment Issues');
  console.log('===============================');

  const issues = [];
  const success = [];

  // Check 1: Environment Variables
  console.log('\n1️⃣ Checking Environment Variables...');
  const stripeKey = import.meta?.env?.VITE_STRIPE_PUBLISHABLE_KEY;
  const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL;

  if (stripeKey) {
    console.log('✅ VITE_STRIPE_PUBLISHABLE_KEY is configured');
    success.push('Stripe publishable key configured');
  } else {
    console.log('❌ VITE_STRIPE_PUBLISHABLE_KEY is missing');
    issues.push({
      critical: true,
      issue: 'VITE_STRIPE_PUBLISHABLE_KEY is missing',
      solution: 'Add VITE_STRIPE_PUBLISHABLE_KEY to environment variables'
    });
  }

  if (supabaseUrl) {
    console.log('✅ VITE_SUPABASE_URL is configured');
    success.push('Supabase URL configured');
  } else {
    console.log('❌ VITE_SUPABASE_URL is missing');
    issues.push({
      critical: true,
      issue: 'VITE_SUPABASE_URL is missing',
      solution: 'Add VITE_SUPABASE_URL to environment variables'
    });
  }

  // Check 2: Payment Endpoint Accessibility
  console.log('\n2️⃣ Testing Payment Endpoint...');
  try {
    const response = await fetch('/api/create-payment', {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      console.log('✅ Payment endpoint is accessible');
      success.push('Payment endpoint accessible');
    } else {
      console.log(`❌ Payment endpoint returned ${response.status}`);
      issues.push({
        critical: true,
        issue: `Payment endpoint returned ${response.status}`,
        solution: 'Check Netlify function deployment and logs'
      });
    }
  } catch (error) {
    console.log('❌ Payment endpoint unreachable:', error.message);
    issues.push({
      critical: true,
      issue: `Payment endpoint unreachable: ${error.message}`,
      solution: 'Ensure dev server is running and Netlify functions are deployed'
    });
  }

  // Check 3: Subscription Endpoint
  console.log('\n3️⃣ Testing Subscription Endpoint...');
  try {
    const response = await fetch('/api/create-subscription', {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      console.log('✅ Subscription endpoint is accessible');
      success.push('Subscription endpoint accessible');
    } else {
      console.log(`❌ Subscription endpoint returned ${response.status}`);
      issues.push({
        critical: true,
        issue: `Subscription endpoint returned ${response.status}`,
        solution: 'Check Netlify function deployment and logs'
      });
    }
  } catch (error) {
    console.log('❌ Subscription endpoint unreachable:', error.message);
    issues.push({
      critical: true,
      issue: `Subscription endpoint unreachable: ${error.message}`,
      solution: 'Ensure dev server is running and Netlify functions are deployed'
    });
  }

  // Check 4: Actual Payment Creation Test
  console.log('\n4️⃣ Testing Payment Creation...');
  try {
    const testPayload = {
      amount: 1,
      productName: 'Test Payment',
      paymentMethod: 'stripe',
      guestEmail: 'test@example.com',
      isGuest: true,
      credits: 1
    };

    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Payment creation successful');
      console.log('Result:', result);
      success.push('Payment creation working');

      if (result.url) {
        console.log('✅ Stripe checkout URL generated');
        success.push('Stripe checkout URL generation working');
      } else {
        issues.push({
          critical: false,
          issue: 'Payment created but no checkout URL',
          solution: 'Check Stripe configuration and secret key'
        });
      }
    } else {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { rawError: errorText };
      }

      console.log('❌ Payment creation failed:', response.status);
      console.log('Error details:', errorDetails);

      // Analyze specific errors
      if (errorText.includes('STRIPE_SECRET_KEY')) {
        issues.push({
          critical: true,
          issue: 'STRIPE_SECRET_KEY is missing or invalid',
          solution: 'Add STRIPE_SECRET_KEY to Netlify environment variables'
        });
      } else if (errorText.includes('PayPal')) {
        issues.push({
          critical: false,
          issue: 'PayPal credentials missing (optional)',
          solution: 'Add PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY for PayPal support'
        });
      } else if (errorText.includes('email')) {
        issues.push({
          critical: false,
          issue: 'Email validation issue',
          solution: 'Check email format validation in payment logic'
        });
      } else {
        issues.push({
          critical: true,
          issue: `Payment creation failed: ${errorDetails.error || errorText}`,
          solution: 'Check Netlify function logs for detailed error information'
        });
      }
    }
  } catch (error) {
    console.log('❌ Payment creation error:', error.message);
    issues.push({
      critical: true,
      issue: `Payment creation network error: ${error.message}`,
      solution: 'Check network connectivity and CORS configuration'
    });
  }

  // Check 5: Subscription Creation Test
  console.log('\n5️⃣ Testing Subscription Creation...');
  try {
    const testPayload = {
      plan: 'monthly',
      guestEmail: 'test@example.com',
      isGuest: true
    };

    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Subscription creation successful');
      success.push('Subscription creation working');
    } else {
      const errorText = await response.text();
      console.log('❌ Subscription creation failed:', response.status);
      console.log('Error:', errorText);

      issues.push({
        critical: true,
        issue: `Subscription creation failed: ${response.status}`,
        solution: 'Check Stripe configuration and subscription setup'
      });
    }
  } catch (error) {
    console.log('❌ Subscription creation error:', error.message);
    issues.push({
      critical: true,
      issue: `Subscription creation error: ${error.message}`,
      solution: 'Check network connectivity and function deployment'
    });
  }

  // Results Summary
  console.log('\n📊 DIAGNOSTIC RESULTS');
  console.log('=====================');
  console.log(`✅ Successful checks: ${success.length}`);
  console.log(`❌ Issues found: ${issues.length}`);

  if (success.length > 0) {
    console.log('\n✅ Working Components:');
    success.forEach(item => console.log(`  • ${item}`));
  }

  if (issues.length > 0) {
    console.log('\n❌ Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.critical ? '🚨 CRITICAL' : '⚠️  WARNING'}: ${issue.issue}`);
      console.log(`     💡 Solution: ${issue.solution}`);
    });

    console.log('\n🔧 IMMEDIATE ACTION REQUIRED:');
    const criticalIssues = issues.filter(i => i.critical);
    if (criticalIssues.length > 0) {
      console.log('Fix these critical issues first:');
      criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.solution}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Visit the Netlify dashboard and check environment variables');
    console.log('2. Ensure these variables are set:');
    console.log('   - STRIPE_SECRET_KEY (starts with sk_test_ or sk_live_)');
    console.log('   - VITE_STRIPE_PUBLISHABLE_KEY (starts with pk_test_ or pk_live_)');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    console.log('   - VITE_SUPABASE_URL');
    console.log('3. Check Netlify function logs for detailed errors');
    console.log('4. Redeploy after fixing environment variables');

  } else {
    console.log('\n🎉 No critical issues found! Payment system should be working.');
    console.log('If you\'re still having issues:');
    console.log('1. Try the actual payment flow in the UI');
    console.log('2. Check browser console for frontend errors');
    console.log('3. Verify Stripe test cards are being used correctly');
  }

  return { success, issues, summary: { successCount: success.length, issueCount: issues.length } };
};

// Make it available globally
window.testPaymentIssues = testPaymentIssues;

console.log('🔍 Payment Issue Diagnostic Tool Loaded');
console.log('📋 Run testPaymentIssues() to identify payment problems');
