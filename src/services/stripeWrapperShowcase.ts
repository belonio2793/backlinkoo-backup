/**
 * Stripe Wrapper Showcase
 * 
 * Examples and demos of how to use the new comprehensive Stripe Wrapper
 * across your application. Replace direct Stripe calls with these patterns.
 */

import { 
  stripeWrapper, 
  createPayment, 
  createSubscription, 
  verifyPayment, 
  openCheckout, 
  quickBuyCredits, 
  quickSubscribe, 
  getStripeStatus 
} from './stripeWrapper';

/**
 * Example 1: Simple credit purchase
 */
export async function buyCreditsExample() {
  console.log('📦 Example: Buying credits');
  
  // Method 1: Using convenience function
  const quickResult = await quickBuyCredits(100, 'user@example.com');
  console.log('Quick purchase result:', quickResult);
  
  // Method 2: Using full API
  const customResult = await createPayment({
    amount: 140,
    credits: 100,
    productName: 'Custom 100 Credits Package',
    isGuest: true,
    guestEmail: 'user@example.com'
  });
  console.log('Custom purchase result:', customResult);
  
  return customResult;
}

/**
 * Example 2: Premium subscription
 */
export async function subscribeToPremiumExample() {
  console.log('💎 Example: Premium subscription');
  
  // Method 1: Using convenience function
  const quickResult = await quickSubscribe('monthly');
  console.log('Quick subscription result:', quickResult);
  
  // Method 2: Using full API
  const customResult = await createSubscription({
    plan: 'yearly',
    tier: 'premium',
    isGuest: false,
    metadata: {
      source: 'marketing-campaign',
      discount: 'early-bird'
    }
  });
  console.log('Custom subscription result:', customResult);
  
  return customResult;
}

/**
 * Example 3: Payment verification
 */
export async function verifyPaymentExample(sessionId: string) {
  console.log('🔍 Example: Payment verification');
  
  const verification = await verifyPayment(sessionId);
  
  if (verification.success && verification.paid) {
    console.log('✅ Payment confirmed:', {
      amount: verification.amount,
      credits: verification.credits
    });
    
    // Handle successful payment
    await handleSuccessfulPayment(verification);
  } else {
    console.log('❌ Payment not confirmed:', verification.error);
    
    // Handle failed payment
    await handleFailedPayment(verification);
  }
  
  return verification;
}

/**
 * Example 4: Check system status
 */
export function checkStripeStatus() {
  console.log('🔧 Example: System status check');
  
  const status = getStripeStatus();
  
  console.log('Stripe Wrapper Status:', {
    configured: status.configured,
    environment: status.environment,
    primaryMethod: status.primaryMethod,
    fallbacksAvailable: status.netlifyAvailable || status.clientFallbackAvailable,
    errors: status.errors
  });
  
  if (!status.configured) {
    console.error('❌ Stripe not properly configured!');
    console.log('Missing configuration:', status.errors);
  }
  
  return status;
}

/**
 * Example 5: Advanced payment with custom handling
 */
export async function advancedPaymentFlow(
  amount: number, 
  credits: number, 
  userEmail?: string
) {
  console.log('🎯 Example: Advanced payment flow');
  
  // Step 1: Check system status
  const status = checkStripeStatus();
  if (!status.configured) {
    throw new Error('Payment system not configured');
  }
  
  // Step 2: Create payment
  const paymentResult = await createPayment({
    amount,
    credits,
    productName: `${credits} Professional Credits`,
    isGuest: !userEmail,
    guestEmail: userEmail,
    metadata: {
      package_type: 'professional',
      user_type: userEmail ? 'authenticated' : 'guest'
    }
  });
  
  if (!paymentResult.success) {
    console.error('❌ Payment creation failed:', paymentResult.error);
    return paymentResult;
  }
  
  console.log(`✅ Payment created via ${paymentResult.method}${paymentResult.fallbackUsed ? ' (fallback)' : ''}`);
  
  // Step 3: Open checkout with custom handling
  if (paymentResult.url) {
    const checkoutWindow = openCheckout(paymentResult.url, paymentResult.sessionId);
    
    if (checkoutWindow) {
      // Custom window monitoring
      const monitoring = setInterval(async () => {
        if (checkoutWindow.closed) {
          clearInterval(monitoring);
          console.log('🪟 Checkout window closed, verifying payment...');
          
          if (paymentResult.sessionId) {
            const verification = await verifyPayment(paymentResult.sessionId);
            if (verification.success && verification.paid) {
              console.log('🎉 Payment completed successfully!');
              await handleSuccessfulPayment(verification);
            }
          }
        }
      }, 1000);
    }
  }
  
  return paymentResult;
}

/**
 * Example 6: Batch operations
 */
export async function batchPaymentOperations() {
  console.log('📦 Example: Batch operations');
  
  // Check status
  const status = getStripeStatus();
  console.log('System status:', status.configured ? 'Ready' : 'Not configured');
  
  // Create multiple payment options
  const paymentPromises = [
    createPayment({ amount: 70, credits: 50, productName: 'Starter Pack' }),
    createPayment({ amount: 140, credits: 100, productName: 'Pro Pack' }),
    createPayment({ amount: 350, credits: 250, productName: 'Business Pack' })
  ];
  
  try {
    const results = await Promise.allSettled(paymentPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
    
    console.log(`✅ ${successful.length} payments created successfully`);
    console.log(`❌ ${failed.length} payments failed`);
    
    return { successful, failed };
  } catch (error) {
    console.error('Batch operation failed:', error);
    throw error;
  }
}

/**
 * Helper: Handle successful payment
 */
async function handleSuccessfulPayment(verification: any) {
  console.log('🎉 Handling successful payment:', verification);
  
  // Add credits to user account
  if (verification.credits) {
    console.log(`Adding ${verification.credits} credits to user account`);
    // Implementation would call your user service
  }
  
  // Send confirmation email
  console.log('Sending payment confirmation email');
  // Implementation would call your email service
  
  // Update user interface
  console.log('Updating UI with new credit balance');
  // Implementation would refresh UI components
}

/**
 * Helper: Handle failed payment
 */
async function handleFailedPayment(verification: any) {
  console.log('❌ Handling failed payment:', verification);
  
  // Log payment failure
  console.log('Logging payment failure for analysis');
  // Implementation would call your analytics service
  
  // Show user-friendly error message
  console.log('Showing user error message');
  // Implementation would update UI with error state
}

/**
 * Migration Helper: Replace old payment calls
 */
export const migrationExamples = {
  
  // OLD: Direct Supabase function call
  oldSupabaseCall: async () => {
    // const { data, error } = await supabase.functions.invoke('create-payment', {...});
    // return { success: !error, url: data?.url, sessionId: data?.sessionId };
  },
  
  // NEW: Stripe Wrapper call
  newWrapperCall: async () => {
    return await createPayment({
      amount: 140,
      credits: 100,
      productName: '100 Credits'
    });
  },
  
  // OLD: Multiple service calls
  oldMultipleServices: async () => {
    // const paymentService = new SomePaymentService();
    // const result = await paymentService.createPayment(...);
    // if (!result.success) {
    //   const fallback = await backupPaymentService.createPayment(...);
    //   return fallback;
    // }
    // return result;
  },
  
  // NEW: Automatic fallback handling
  newAutomaticFallback: async () => {
    // Wrapper automatically handles fallbacks
    return await createPayment({
      amount: 140,
      credits: 100,
      productName: '100 Credits'
    });
  }
};

export default {
  buyCreditsExample,
  subscribeToPremiumExample,
  verifyPaymentExample,
  checkStripeStatus,
  advancedPaymentFlow,
  batchPaymentOperations,
  migrationExamples
};
