/**
 * Payment Diagnostics Utility
 * Diagnose issues with Stripe and PayPal checkout
 */

export interface PaymentDiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class PaymentDiagnostics {
  
  /**
   * Check environment variables
   */
  checkEnvironmentVariables(): PaymentDiagnosticResult[] {
    const results: PaymentDiagnosticResult[] = [];
    
    // Check Stripe configuration
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (stripePublishableKey) {
      results.push({
        test: 'Stripe Publishable Key',
        status: 'success',
        message: 'VITE_STRIPE_PUBLISHABLE_KEY is configured',
        details: { key: stripePublishableKey.substring(0, 10) + '...' }
      });
    } else {
      results.push({
        test: 'Stripe Publishable Key',
        status: 'error',
        message: 'VITE_STRIPE_PUBLISHABLE_KEY is missing',
        details: { required: true, variable: 'VITE_STRIPE_PUBLISHABLE_KEY' }
      });
    }
    
    // Check Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      results.push({
        test: 'Supabase URL',
        status: 'success',
        message: 'VITE_SUPABASE_URL is configured',
        details: { url: supabaseUrl }
      });
    } else {
      results.push({
        test: 'Supabase URL',
        status: 'error',
        message: 'VITE_SUPABASE_URL is missing',
        details: { required: true }
      });
    }
    
    // Note about backend variables
    results.push({
      test: 'Backend Variables',
      status: 'warning',
      message: 'Backend variables cannot be checked from frontend',
      details: {
        required: ['STRIPE_SECRET_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
        note: 'These must be configured in Netlify environment variables'
      }
    });
    
    return results;
  }
  
  /**
   * Test payment endpoint accessibility
   */
  async testPaymentEndpoint(): Promise<PaymentDiagnosticResult> {
    try {
      const response = await fetch('/api/create-payment', {
        method: 'OPTIONS', // Use OPTIONS to avoid triggering actual payment logic
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          test: 'Payment Endpoint',
          status: 'success',
          message: 'Payment endpoint is accessible',
          details: { status: response.status, url: '/api/create-payment' }
        };
      } else {
        return {
          test: 'Payment Endpoint',
          status: 'error',
          message: `Payment endpoint returned ${response.status}`,
          details: { status: response.status }
        };
      }
    } catch (error) {
      return {
        test: 'Payment Endpoint',
        status: 'error',
        message: `Payment endpoint unreachable: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }
  
  /**
   * Test subscription endpoint accessibility
   */
  async testSubscriptionEndpoint(): Promise<PaymentDiagnosticResult> {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return {
          test: 'Subscription Endpoint',
          status: 'success',
          message: 'Subscription endpoint is accessible',
          details: { status: response.status, url: '/api/create-subscription' }
        };
      } else {
        return {
          test: 'Subscription Endpoint',
          status: 'error',
          message: `Subscription endpoint returned ${response.status}`,
          details: { status: response.status }
        };
      }
    } catch (error) {
      return {
        test: 'Subscription Endpoint',
        status: 'error',
        message: `Subscription endpoint unreachable: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }
  
  /**
   * Test actual payment creation (with minimal data)
   */
  async testPaymentCreation(): Promise<PaymentDiagnosticResult> {
    try {
      const testPayload = {
        amount: 1, // $1 minimum
        productName: 'Payment Diagnostic Test',
        paymentMethod: 'stripe',
        guestEmail: 'diagnostic@test.com',
        isGuest: true,
        credits: 1
      };
      
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        return {
          test: 'Payment Creation',
          status: 'success',
          message: 'Payment creation successful',
          details: { 
            hasUrl: !!result.url,
            hasSessionId: !!result.sessionId,
            response: result
          }
        };
      } else {
        const errorText = await response.text();
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { rawError: errorText };
        }
        
        return {
          test: 'Payment Creation',
          status: 'error',
          message: `Payment creation failed: ${response.status}`,
          details: {
            status: response.status,
            error: errorDetails,
            endpoint: '/api/create-payment'
          }
        };
      }
    } catch (error) {
      return {
        test: 'Payment Creation',
        status: 'error',
        message: `Payment creation error: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }
  
  /**
   * Test subscription creation
   */
  async testSubscriptionCreation(): Promise<PaymentDiagnosticResult> {
    try {
      const testPayload = {
        plan: 'monthly',
        guestEmail: 'diagnostic.subscription@test.com',
        isGuest: true
      };
      
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        return {
          test: 'Subscription Creation',
          status: 'success',
          message: 'Subscription creation successful',
          details: { 
            hasUrl: !!result.url,
            hasSessionId: !!result.sessionId,
            response: result
          }
        };
      } else {
        const errorText = await response.text();
        let errorDetails;
        try {
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { rawError: errorText };
        }
        
        return {
          test: 'Subscription Creation',
          status: 'error',
          message: `Subscription creation failed: ${response.status}`,
          details: {
            status: response.status,
            error: errorDetails,
            endpoint: '/api/create-subscription'
          }
        };
      }
    } catch (error) {
      return {
        test: 'Subscription Creation',
        status: 'error',
        message: `Subscription creation error: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }
  
  /**
   * Run comprehensive payment diagnostics
   */
  async runComprehensiveDiagnostics(): Promise<{
    environment: PaymentDiagnosticResult[];
    endpoints: PaymentDiagnosticResult[];
    functionality: PaymentDiagnosticResult[];
    summary: {
      total: number;
      success: number;
      errors: number;
      warnings: number;
    };
  }> {
    console.log('🔍 Running comprehensive payment diagnostics...');
    
    // Environment checks
    const environment = this.checkEnvironmentVariables();
    
    // Endpoint accessibility
    const endpoints = await Promise.all([
      this.testPaymentEndpoint(),
      this.testSubscriptionEndpoint()
    ]);
    
    // Functionality tests
    const functionality = await Promise.all([
      this.testPaymentCreation(),
      this.testSubscriptionCreation()
    ]);
    
    // Calculate summary
    const allResults = [...environment, ...endpoints, ...functionality];
    const summary = {
      total: allResults.length,
      success: allResults.filter(r => r.status === 'success').length,
      errors: allResults.filter(r => r.status === 'error').length,
      warnings: allResults.filter(r => r.status === 'warning').length
    };
    
    console.log(`✅ Diagnostics complete: ${summary.success}/${summary.total} passed`);
    
    return {
      environment,
      endpoints,
      functionality,
      summary
    };
  }
  
  /**
   * Quick diagnostic for immediate issues
   */
  async quickDiagnostic(): Promise<PaymentDiagnosticResult[]> {
    const results = [];
    
    // Quick environment check
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      results.push({
        test: 'Critical: Stripe Key Missing',
        status: 'error' as const,
        message: 'VITE_STRIPE_PUBLISHABLE_KEY is not configured',
        details: { urgency: 'high', fix: 'Add to environment variables' }
      });
    }
    
    // Quick endpoint test
    try {
      const response = await fetch('/api/create-payment', { method: 'OPTIONS' });
      if (!response.ok) {
        results.push({
          test: 'Critical: Payment Endpoint Down',
          status: 'error' as const,
          message: 'Payment endpoint is not responding',
          details: { status: response.status, urgency: 'high' }
        });
      }
    } catch (error) {
      results.push({
        test: 'Critical: Payment Endpoint Unreachable',
        status: 'error' as const,
        message: 'Cannot reach payment endpoint',
        details: { error: (error as Error).message, urgency: 'high' }
      });
    }
    
    return results;
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).PaymentDiagnostics = PaymentDiagnostics;
  (window as any).paymentDiagnostics = new PaymentDiagnostics();
}

export default PaymentDiagnostics;
