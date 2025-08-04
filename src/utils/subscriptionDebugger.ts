import { supabase } from '@/integrations/supabase/client';

export class SubscriptionDebugger {
  /**
   * Test the create-subscription edge function connectivity
   */
  static async testEdgeFunction(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🔍 Testing create-subscription edge function...');
      
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: 'test-price-id',
          tier: 'test-tier',
          isGuest: true,
          guestEmail: 'test@example.com'
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        return { 
          success: false, 
          error: `Edge function error: ${error.message}`,
          details: error
        };
      }

      console.log('✅ Edge function responded:', data);
      return { success: true, details: data };
    } catch (error: any) {
      console.error('❌ Exception testing edge function:', error);
      return { 
        success: false, 
        error: `Exception: ${error.message}`,
        details: error
      };
    }
  }

  /**
   * Check if Stripe is properly configured
   */
  static async checkStripeConfiguration(): Promise<{ configured: boolean; missing: string[] }> {
    const missing = [];
    
    // We can't directly check environment variables from the client,
    // but we can test if the function works with a basic call
    try {
      const { error } = await supabase.functions.invoke('create-subscription', {
        body: { test: true }
      });

      // If we get a specific error about missing config, we know what's wrong
      if (error?.message?.includes('STRIPE_SECRET_KEY')) {
        missing.push('STRIPE_SECRET_KEY');
      }
      if (error?.message?.includes('SUPABASE_URL')) {
        missing.push('SUPABASE_URL');
      }
      if (error?.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        missing.push('SUPABASE_SERVICE_ROLE_KEY');
      }
    } catch (error: any) {
      console.warn('Could not check Stripe configuration:', error.message);
    }

    return {
      configured: missing.length === 0,
      missing
    };
  }

  /**
   * Test subscription creation with debug info
   */
  static async debugSubscriptionCreation(userEmail?: string): Promise<{
    success: boolean;
    error?: string;
    steps: { step: string; success: boolean; details?: any }[];
  }> {
    const steps = [];
    let overallSuccess = true;

    // Step 1: Test edge function connectivity
    steps.push({ step: 'Testing edge function connectivity', success: false });
    try {
      const connectivityTest = await this.testEdgeFunction();
      steps[steps.length - 1].success = connectivityTest.success;
      steps[steps.length - 1].details = connectivityTest.details;
      
      if (!connectivityTest.success) {
        overallSuccess = false;
      }
    } catch (error: any) {
      steps[steps.length - 1].details = error.message;
      overallSuccess = false;
    }

    // Step 2: Check Stripe configuration
    steps.push({ step: 'Checking Stripe configuration', success: false });
    try {
      const stripeCheck = await this.checkStripeConfiguration();
      steps[steps.length - 1].success = stripeCheck.configured;
      steps[steps.length - 1].details = stripeCheck;
      
      if (!stripeCheck.configured) {
        overallSuccess = false;
      }
    } catch (error: any) {
      steps[steps.length - 1].details = error.message;
      overallSuccess = false;
    }

    // Step 3: Test with real parameters (but safe ones)
    steps.push({ step: 'Testing with real parameters', success: false });
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: 'price_premium_seo_tools',
          tier: 'premium-seo-tools',
          isGuest: true,
          guestEmail: userEmail || 'debug@example.com'
        }
      });

      if (error) {
        steps[steps.length - 1].details = error;
        overallSuccess = false;
      } else {
        steps[steps.length - 1].success = true;
        steps[steps.length - 1].details = data;
      }
    } catch (error: any) {
      steps[steps.length - 1].details = error.message;
      overallSuccess = false;
    }

    return {
      success: overallSuccess,
      error: overallSuccess ? undefined : 'One or more steps failed',
      steps
    };
  }

  /**
   * Run full subscription system diagnostic
   */
  static async runDiagnostic(): Promise<void> {
    console.log('🚀 Running subscription system diagnostic...');
    
    const result = await this.debugSubscriptionCreation();
    
    console.log('📊 Diagnostic Results:');
    console.log(`Overall Success: ${result.success ? '✅' : '❌'}`);
    
    result.steps.forEach((step, index) => {
      console.log(`\n${index + 1}. ${step.step}: ${step.success ? '✅' : '❌'}`);
      if (step.details) {
        console.log('   Details:', step.details);
      }
    });

    if (!result.success) {
      console.log('\n🔧 Recommended Actions:');
      console.log('1. Check that all edge function environment variables are set');
      console.log('2. Verify Stripe secret key is valid');
      console.log('3. Ensure edge function is deployed and accessible');
      console.log('4. Check Supabase service role key permissions');
    }
  }
}

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugSubscription = SubscriptionDebugger.runDiagnostic;
  (window as any).SubscriptionDebugger = SubscriptionDebugger;
}
