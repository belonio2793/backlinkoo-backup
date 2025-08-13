/**
 * Quick Payment Debug Script
 * Run this in browser console to diagnose payment issues
 */

import PaymentQuickFix from '@/utils/paymentQuickFix';

// Make functions available globally
declare global {
  interface Window {
    debugPayments: () => Promise<void>;
    checkPaymentHealth: () => void;
    testPaymentEndpoints: () => Promise<void>;
    getPaymentConfig: () => void;
  }
}

// Quick debug function
window.debugPayments = async () => {
  console.log('🔍 Running Payment Diagnostics...\n');
  
  const healthCheck = PaymentQuickFix.performHealthCheck();
  console.log('🏥 Health Check:');
  console.log(`  Status: ${healthCheck.isHealthy ? '✅ Healthy' : '❌ Issues Found'}`);
  console.log(`  Summary: ${healthCheck.summary}\n`);
  
  if (healthCheck.issues.length > 0) {
    console.log('🚨 Issues Found:');
    healthCheck.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
      console.log(`     Fix: ${issue.fix}\n`);
    });
  }
  
  console.log('🔗 Testing Endpoints...');
  const endpointTest = await PaymentQuickFix.testEndpoints();
  console.log(`  Create Payment: ${endpointTest.createPayment ? '✅' : '❌'}`);
  console.log(`  Create Subscription: ${endpointTest.createSubscription ? '✅' : '❌'}`);
  console.log(`  Payment Webhook: ${endpointTest.webhook ? '✅' : '❌'}`);
  
  if (endpointTest.errors.length > 0) {
    console.log('  Errors:', endpointTest.errors);
  }
  
  console.log('\n🧪 Testing Payment Creation...');
  const paymentTest = await PaymentQuickFix.testPaymentCreation();
  console.log(`  Payment Test: ${paymentTest.success ? '✅' : '❌'}`);
  if (paymentTest.error) {
    console.log(`  Error: ${paymentTest.error}`);
  }
  if (paymentTest.sessionId) {
    console.log(`  Session ID: ${paymentTest.sessionId}`);
  }
  
  console.log('\n📋 Quick Fixes:');
  console.log(PaymentQuickFix.getNetlifyConfigInstructions());
  
  // Generate full report
  const report = await PaymentQuickFix.generateDiagnosticReport();
  console.log('\n📊 Full Report (copied to clipboard):');
  try {
    await navigator.clipboard.writeText(report);
    console.log('✅ Report copied to clipboard!');
  } catch (error) {
    console.log('❌ Could not copy to clipboard, here\'s the report:');
    console.log(report);
  }
};

// Health check only
window.checkPaymentHealth = () => {
  const healthCheck = PaymentQuickFix.performHealthCheck();
  console.log('🏥 Payment Health Check:');
  console.log(`Status: ${healthCheck.isHealthy ? '✅ Healthy' : '❌ Issues'}`);
  console.log(`Summary: ${healthCheck.summary}`);
  
  if (healthCheck.issues.length > 0) {
    console.table(healthCheck.issues.map(issue => ({
      Issue: issue.issue,
      Severity: issue.severity,
      Description: issue.description,
      Fix: issue.fix.substring(0, 100) + '...'
    })));
  }
};

// Test endpoints only
window.testPaymentEndpoints = async () => {
  console.log('🔗 Testing Payment Endpoints...');
  const test = await PaymentQuickFix.testEndpoints();
  console.table({
    'Create Payment': test.createPayment ? '✅' : '❌',
    'Create Subscription': test.createSubscription ? '✅' : '❌',
    'Payment Webhook': test.webhook ? '✅' : '❌'
  });
  
  if (test.errors.length > 0) {
    console.log('❌ Endpoint Errors:', test.errors);
  }
};

// Show current config
window.getPaymentConfig = () => {
  console.log('⚙️ Current Payment Configuration:');
  console.table({
    'VITE_STRIPE_PUBLISHABLE_KEY': import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 
      `${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 10)}...` : '❌ Missing',
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL || '❌ Missing',
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY ? 
      `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...` : '❌ Missing',
    'Environment': window.location.hostname === 'localhost' ? 'Development' : 'Production',
    'Domain': window.location.hostname
  });
};

// Show instructions
console.log(`
🔧 Payment Debug Tools Available:

To diagnose payment issues, run:
  debugPayments()

Quick commands:
  checkPaymentHealth()     - Check configuration
  testPaymentEndpoints()   - Test API endpoints  
  getPaymentConfig()       - Show current config

Example:
  debugPayments()
`);

// Auto-run basic check
console.log('🔍 Running basic payment health check...');
window.checkPaymentHealth();
