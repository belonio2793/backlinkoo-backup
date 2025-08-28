/**
 * Edge Function Testing and Debugging Utility
 * Tests Supabase Edge Functions directly to diagnose issues
 */

import { supabase } from '@/integrations/supabase/client';

export interface EdgeFunctionTestResult {
  function: string;
  success: boolean;
  error?: string;
  response?: any;
  statusCode?: number;
  details?: any;
}

export class EdgeFunctionTester {
  
  /**
   * Test create-payment edge function
   */
  static async testCreatePayment(): Promise<EdgeFunctionTestResult> {
    console.log('🧪 Testing create-payment edge function...');
    
    const testPayload = {
      amount: 70,
      credits: 50,
      productName: "50 Test Credits",
      isGuest: true,
      guestEmail: "test@example.com",
      paymentMethod: "stripe"
    };

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: testPayload
      });

      console.log('📥 create-payment response:', { data, error });

      if (error) {
        return {
          function: 'create-payment',
          success: false,
          error: error.message || JSON.stringify(error),
          details: error
        };
      }

      if (data && data.url) {
        return {
          function: 'create-payment',
          success: true,
          response: data,
          details: { hasUrl: true, sessionId: data.sessionId }
        };
      }

      return {
        function: 'create-payment',
        success: false,
        error: 'No checkout URL returned',
        response: data
      };

    } catch (error: any) {
      console.error('❌ create-payment test failed:', error);
      return {
        function: 'create-payment',
        success: false,
        error: error.message || 'Unknown error',
        details: error
      };
    }
  }

  /**
   * Test create-subscription edge function
   */
  static async testCreateSubscription(): Promise<EdgeFunctionTestResult> {
    console.log('🧪 Testing create-subscription edge function...');
    
    const testPayload = {
      plan: "monthly",
      tier: "premium",
      isGuest: true,
      guestEmail: "test@example.com"
    };

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: testPayload
      });

      console.log('📥 create-subscription response:', { data, error });

      if (error) {
        return {
          function: 'create-subscription',
          success: false,
          error: error.message || JSON.stringify(error),
          details: error
        };
      }

      if (data && data.url) {
        return {
          function: 'create-subscription',
          success: true,
          response: data,
          details: { hasUrl: true, sessionId: data.sessionId }
        };
      }

      return {
        function: 'create-subscription',
        success: false,
        error: 'No checkout URL returned',
        response: data
      };

    } catch (error: any) {
      console.error('❌ create-subscription test failed:', error);
      return {
        function: 'create-subscription',
        success: false,
        error: error.message || 'Unknown error',
        details: error
      };
    }
  }

  /**
   * Test edge function environment configuration
   */
  static async testEnvironmentConfig(): Promise<EdgeFunctionTestResult> {
    console.log('🧪 Testing edge function environment...');
    
    try {
      // Test with a minimal request to see what error we get
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { test: true }
      });

      console.log('📥 Environment test response:', { data, error });

      if (error) {
        let errorDetails = 'Unknown configuration error';
        
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          errorDetails = 'Edge function not deployed';
        } else if (error.message?.includes('configuration') || error.message?.includes('environment')) {
          errorDetails = 'Environment variables not set';
        } else if (error.message?.includes('stripe') || error.message?.includes('Stripe')) {
          errorDetails = 'Stripe configuration issue';
        } else if (error.message?.includes('supabase') || error.message?.includes('database')) {
          errorDetails = 'Supabase configuration issue';
        }

        return {
          function: 'environment-test',
          success: false,
          error: errorDetails,
          details: error
        };
      }

      return {
        function: 'environment-test',
        success: true,
        response: data,
        details: { testPassed: true }
      };

    } catch (error: any) {
      console.error('❌ Environment test failed:', error);
      return {
        function: 'environment-test',
        success: false,
        error: error.message || 'Network error',
        details: error
      };
    }
  }

  /**
   * Run comprehensive edge function tests
   */
  static async runAllTests(): Promise<EdgeFunctionTestResult[]> {
    console.log('🧪 Running comprehensive edge function tests...');
    
    const results: EdgeFunctionTestResult[] = [];

    // Test 1: Environment configuration
    results.push(await this.testEnvironmentConfig());

    // Test 2: create-payment function
    results.push(await this.testCreatePayment());

    // Test 3: create-subscription function
    results.push(await this.testCreateSubscription());

    console.log('📊 Test results:', results);
    return results;
  }

  /**
   * Generate deployment instructions based on test results
   */
  static generateDeploymentInstructions(results: EdgeFunctionTestResult[]): string[] {
    const instructions: string[] = [];
    
    const environmentTest = results.find(r => r.function === 'environment-test');
    const paymentTest = results.find(r => r.function === 'create-payment');
    const subscriptionTest = results.find(r => r.function === 'create-subscription');

    if (!environmentTest?.success) {
      instructions.push('🚀 Deploy Edge Functions:');
      instructions.push('   supabase functions deploy create-payment');
      instructions.push('   supabase functions deploy create-subscription');
      instructions.push('   supabase functions deploy verify-payment');
      instructions.push('');
    }

    if (environmentTest?.error?.includes('configuration') || 
        paymentTest?.error?.includes('stripe') ||
        subscriptionTest?.error?.includes('stripe')) {
      instructions.push('🔑 Set Environment Variables:');
      instructions.push('   supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_KEY');
      instructions.push('   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key');
      instructions.push('');
    }

    if (results.every(r => !r.success)) {
      instructions.push('❌ All tests failed. Possible issues:');
      instructions.push('   1. Edge functions not deployed');
      instructions.push('   2. Environment variables not set');
      instructions.push('   3. Supabase project not properly configured');
      instructions.push('   4. Network connectivity issues');
    }

    return instructions;
  }
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  (window as any).EdgeFunctionTester = EdgeFunctionTester;
  console.log('🔧 EdgeFunctionTester available globally: window.EdgeFunctionTester');
}

export default EdgeFunctionTester;
