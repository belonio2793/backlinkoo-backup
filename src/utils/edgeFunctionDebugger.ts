/**
 * Edge Function Debugging Utility
 * Helps debug issues with Supabase Edge Functions
 */

import { supabase } from '@/integrations/supabase/client';

export interface EdgeFunctionDebugResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

export class EdgeFunctionDebugger {
  
  /**
   * Test basic Edge Function connectivity
   */
  static async testConnectivity(): Promise<EdgeFunctionDebugResult> {
    try {
      // Test a simple function that should exist
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { test: true }
      });

      if (error) {
        return {
          test: 'Edge Function Connectivity',
          success: false,
          message: 'Edge Function connectivity failed',
          details: { error, supabaseUrl: supabase.supabaseUrl }
        };
      }

      return {
        test: 'Edge Function Connectivity',
        success: true,
        message: 'Edge Functions are accessible',
        details: { response: data }
      };
    } catch (error) {
      return {
        test: 'Edge Function Connectivity',
        success: false,
        message: 'Network error accessing Edge Functions',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Test authentication token
   */
  static async testAuthentication(): Promise<EdgeFunctionDebugResult> {
    try {
      const { data: session, error } = await supabase.auth.getSession();

      if (error) {
        return {
          test: 'Authentication Token',
          success: false,
          message: 'Failed to get authentication session',
          details: { error }
        };
      }

      if (!session?.session) {
        return {
          test: 'Authentication Token',
          success: false,
          message: 'No active authentication session',
          details: { hasSession: false }
        };
      }

      return {
        test: 'Authentication Token',
        success: true,
        message: 'Authentication token is valid',
        details: { 
          hasSession: true,
          userId: session.session.user?.id,
          email: session.session.user?.email
        }
      };
    } catch (error) {
      return {
        test: 'Authentication Token',
        success: false,
        message: 'Authentication check failed',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Test subscription creation with minimal payload
   */
  static async testSubscriptionCreation(): Promise<EdgeFunctionDebugResult> {
    try {
      // Get current session
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session) {
        return {
          test: 'Subscription Creation',
          success: false,
          message: 'Cannot test subscription - no authentication',
          details: { requiresAuth: true }
        };
      }

      const testPayload = {
        priceId: 'price_test_monthly',
        tier: 'premium',
        isGuest: false
      };

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: testPayload
      });

      if (error) {
        return {
          test: 'Subscription Creation',
          success: false,
          message: 'Subscription creation failed',
          details: { 
            error,
            payload: testPayload,
            errorType: typeof error,
            errorKeys: Object.keys(error || {})
          }
        };
      }

      return {
        test: 'Subscription Creation',
        success: true,
        message: 'Subscription creation test passed',
        details: { response: data }
      };
    } catch (error) {
      return {
        test: 'Subscription Creation',
        success: false,
        message: 'Exception during subscription test',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Test guest subscription creation
   */
  static async testGuestSubscription(): Promise<EdgeFunctionDebugResult> {
    try {
      const testPayload = {
        priceId: 'price_test_monthly',
        tier: 'premium',
        isGuest: true,
        guestEmail: 'test@example.com'
      };

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: testPayload
      });

      if (error) {
        return {
          test: 'Guest Subscription',
          success: false,
          message: 'Guest subscription creation failed',
          details: { 
            error,
            payload: testPayload
          }
        };
      }

      return {
        test: 'Guest Subscription',
        success: true,
        message: 'Guest subscription test passed',
        details: { response: data }
      };
    } catch (error) {
      return {
        test: 'Guest Subscription',
        success: false,
        message: 'Exception during guest subscription test',
        details: { error: (error as Error).message }
      };
    }
  }

  /**
   * Check environment configuration
   */
  static checkEnvironment(): EdgeFunctionDebugResult {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    const issues = [];
    const config = [];

    if (supabaseUrl) {
      config.push('VITE_SUPABASE_URL configured');
    } else {
      issues.push('VITE_SUPABASE_URL missing');
    }

    if (supabaseAnonKey) {
      config.push('VITE_SUPABASE_ANON_KEY configured');
    } else {
      issues.push('VITE_SUPABASE_ANON_KEY missing');
    }

    if (stripePublishableKey) {
      config.push('VITE_STRIPE_PUBLISHABLE_KEY configured');
    } else {
      issues.push('VITE_STRIPE_PUBLISHABLE_KEY missing');
    }

    return {
      test: 'Environment Configuration',
      success: issues.length === 0,
      message: issues.length === 0 
        ? 'Environment configuration looks good'
        : `Missing ${issues.length} required variables`,
      details: {
        configured: config,
        missing: issues,
        supabaseClient: {
          url: supabase.supabaseUrl,
          hasKey: !!supabase.supabaseKey
        }
      }
    };
  }

  /**
   * Run comprehensive Edge Function diagnostics
   */
  static async runComprehensiveDiagnostics(): Promise<{
    results: EdgeFunctionDebugResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      criticalIssues: string[];
    };
  }> {
    console.log('🔍 Running Edge Function diagnostics...');

    const results: EdgeFunctionDebugResult[] = [];

    // Environment check (synchronous)
    results.push(this.checkEnvironment());

    // Authentication check
    results.push(await this.testAuthentication());

    // Connectivity check
    results.push(await this.testConnectivity());

    // Subscription tests (only if auth is working)
    const authResult = results.find(r => r.test === 'Authentication Token');
    if (authResult?.success) {
      results.push(await this.testSubscriptionCreation());
    }

    // Guest subscription test
    results.push(await this.testGuestSubscription());

    // Calculate summary
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const criticalIssues = results
      .filter(r => !r.success)
      .map(r => r.message);

    console.log(`✅ Diagnostics complete: ${passed}/${results.length} passed`);

    return {
      results,
      summary: {
        total: results.length,
        passed,
        failed,
        criticalIssues
      }
    };
  }

  /**
   * Quick diagnostic for immediate issues
   */
  static async quickDiagnostic(): Promise<EdgeFunctionDebugResult[]> {
    const results = [];

    // Quick environment check
    const envResult = this.checkEnvironment();
    if (!envResult.success) {
      results.push(envResult);
    }

    // Quick auth check
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        results.push({
          test: 'Quick Auth Check',
          success: false,
          message: 'No active authentication session',
          details: { suggestion: 'Please sign in first' }
        });
      }
    } catch (error) {
      results.push({
        test: 'Quick Auth Check',
        success: false,
        message: 'Authentication system error',
        details: { error: (error as Error).message }
      });
    }

    return results;
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).EdgeFunctionDebugger = EdgeFunctionDebugger;
  (window as any).edgeFunctionDebugger = EdgeFunctionDebugger;
}

export default EdgeFunctionDebugger;
