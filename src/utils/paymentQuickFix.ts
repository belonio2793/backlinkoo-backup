/**
 * Payment Quick Fix Utility
 * Identifies and fixes common Stripe payment issues
 */

export interface PaymentIssue {
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fix: string;
  autoFixable: boolean;
}

export interface PaymentHealthCheck {
  isHealthy: boolean;
  issues: PaymentIssue[];
  summary: string;
}

export class PaymentQuickFix {
  
  /**
   * Perform a comprehensive payment health check
   */
  public static performHealthCheck(): PaymentHealthCheck {
    const issues: PaymentIssue[] = [];
    
    // Check environment variables
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      issues.push({
        issue: 'missing_stripe_public_key',
        severity: 'critical',
        description: 'Stripe publishable key is not configured',
        fix: 'Add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables',
        autoFixable: false
      });
    }
    
    if (!import.meta.env.VITE_SUPABASE_URL) {
      issues.push({
        issue: 'missing_supabase_url',
        severity: 'critical',
        description: 'Supabase URL is not configured',
        fix: 'Add VITE_SUPABASE_URL to your environment variables',
        autoFixable: false
      });
    }
    
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      issues.push({
        issue: 'missing_supabase_key',
        severity: 'critical',
        description: 'Supabase anonymous key is not configured',
        fix: 'Add VITE_SUPABASE_ANON_KEY to your environment variables',
        autoFixable: false
      });
    }
    
    // Check Stripe key format
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (stripeKey && !stripeKey.startsWith('pk_')) {
      issues.push({
        issue: 'invalid_stripe_key_format',
        severity: 'high',
        description: 'Stripe publishable key has invalid format',
        fix: 'Ensure the key starts with pk_test_ or pk_live_',
        autoFixable: false
      });
    }
    
    // Check if using test keys in production
    if (stripeKey && window.location.hostname === 'backlinkoo.com' && stripeKey.includes('test')) {
      issues.push({
        issue: 'test_keys_in_production',
        severity: 'high',
        description: 'Using test Stripe keys in production',
        fix: 'Replace with production Stripe keys (pk_live_...)',
        autoFixable: false
      });
    }
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    let summary = '';
    if (criticalIssues > 0) {
      summary = `${criticalIssues} critical payment issues found. Payments will not work.`;
    } else if (highIssues > 0) {
      summary = `${highIssues} high-priority payment issues found. Some payments may fail.`;
    } else if (issues.length > 0) {
      summary = `${issues.length} minor payment issues found.`;
    } else {
      summary = 'Payment system appears to be configured correctly.';
    }
    
    return {
      isHealthy: issues.length === 0,
      issues,
      summary
    };
  }
  
  /**
   * Get configuration instructions for Netlify
   */
  public static getNetlifyConfigInstructions(): string {
    return `
# 🔧 Netlify Environment Variables Setup

## Required Variables for backlinkoo.com:

### Frontend Variables (Build & Runtime):
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

### Backend Variables (Functions Only):
STRIPE_SECRET_KEY=sk_live_your_production_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

### Optional PayPal Variables:
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET_KEY=your_paypal_secret

## 📋 How to Add These:

1. Go to https://app.netlify.com/sites/[your-site]/settings/deploys
2. Click "Environment variables"
3. Add each variable above
4. Deploy your site

## ⚠️ Important Notes:

- Use PRODUCTION keys for backlinkoo.com (pk_live_, sk_live_)
- Use TEST keys for development (pk_test_, sk_test_)
- Never commit secret keys to git
- VITE_ prefixed variables are exposed to frontend
- Non-VITE_ variables are only available in Netlify functions

## 🔍 Test Your Setup:

Visit /payment-debug to verify configuration.
`;
  }
  
  /**
   * Get quick fixes for common issues
   */
  public static getQuickFixes(): Record<string, string> {
    return {
      missing_stripe_public_key: `
Add to Netlify Environment Variables:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key

For production, use pk_live_... keys.
For testing, use pk_test_... keys.`,

      missing_supabase_url: `
Add to Netlify Environment Variables:
VITE_SUPABASE_URL=https://your-project.supabase.co

Find this in your Supabase project settings.`,

      missing_supabase_key: `
Add to Netlify Environment Variables:
VITE_SUPABASE_ANON_KEY=your_anon_key

Find this in Supabase → Settings → API.`,

      test_keys_in_production: `
Replace test keys with production keys:
- pk_test_... → pk_live_...
- sk_test_... → sk_live_...

Get production keys from Stripe Dashboard.`,

      endpoint_not_found: `
Ensure Netlify functions are deployed:
- netlify/functions/create-payment.js
- netlify/functions/create-subscription.js
- netlify/functions/payment-webhook.js

Check build logs for function deployment errors.`
    };
  }
  
  /**
   * Test if payment endpoints are accessible
   */
  public static async testEndpoints(): Promise<{
    createPayment: boolean;
    createSubscription: boolean;
    webhook: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let createPayment = false;
    let createSubscription = false;
    let webhook = false;
    
    // Test create-payment endpoint
    try {
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'OPTIONS'
      });
      createPayment = response.ok;
      if (!response.ok) {
        errors.push(`create-payment: ${response.status}`);
      }
    } catch (error) {
      errors.push(`create-payment: ${(error as Error).message}`);
    }
    
    // Test create-subscription endpoint
    try {
      const response = await fetch('/.netlify/functions/create-subscription', {
        method: 'OPTIONS'
      });
      createSubscription = response.ok;
      if (!response.ok) {
        errors.push(`create-subscription: ${response.status}`);
      }
    } catch (error) {
      errors.push(`create-subscription: ${(error as Error).message}`);
    }
    
    // Test webhook endpoint
    try {
      const response = await fetch('/.netlify/functions/payment-webhook', {
        method: 'OPTIONS'
      });
      webhook = response.ok;
      if (!response.ok) {
        errors.push(`payment-webhook: ${response.status}`);
      }
    } catch (error) {
      errors.push(`payment-webhook: ${(error as Error).message}`);
    }
    
    return {
      createPayment,
      createSubscription,
      webhook,
      errors
    };
  }
  
  /**
   * Attempt to create a minimal test payment
   */
  public static async testPaymentCreation(): Promise<{
    success: boolean;
    error?: string;
    sessionId?: string;
  }> {
    try {
      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 1,
          productName: 'Test Payment',
          paymentMethod: 'stripe',
          isGuest: true,
          guestEmail: 'test@backlinkoo.com'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          sessionId: result.sessionId
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: `${response.status}: ${error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  
  /**
   * Generate a complete diagnostic report
   */
  public static async generateDiagnosticReport(): Promise<string> {
    const healthCheck = this.performHealthCheck();
    const endpointTest = await this.testEndpoints();
    const paymentTest = await this.testPaymentCreation();
    
    const report = `
# 💳 Payment System Diagnostic Report
Generated: ${new Date().toISOString()}
Site: ${window.location.hostname}

## 🔍 Health Check Summary
${healthCheck.summary}
Healthy: ${healthCheck.isHealthy ? '✅' : '❌'}

## 🚨 Issues Found (${healthCheck.issues.length})
${healthCheck.issues.map(issue => `
- **${issue.issue}** (${issue.severity})
  ${issue.description}
  Fix: ${issue.fix}
`).join('')}

## 🔗 Endpoint Tests
- Create Payment: ${endpointTest.createPayment ? '✅' : '❌'}
- Create Subscription: ${endpointTest.createSubscription ? '✅' : '❌'}
- Payment Webhook: ${endpointTest.webhook ? '✅' : '❌'}

${endpointTest.errors.length > 0 ? `
Endpoint Errors:
${endpointTest.errors.map(err => `- ${err}`).join('\n')}
` : ''}

## 🧪 Payment Test
Test Payment Creation: ${paymentTest.success ? '✅' : '❌'}
${paymentTest.error ? `Error: ${paymentTest.error}` : ''}
${paymentTest.sessionId ? `Session ID: ${paymentTest.sessionId}` : ''}

## 🔧 Environment Variables
- VITE_STRIPE_PUBLISHABLE_KEY: ${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✅ Configured' : '❌ Missing'}
- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}
- VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}

## 📋 Next Steps
${healthCheck.issues.length > 0 ? `
1. Fix the ${healthCheck.issues.length} issue(s) listed above
2. Add missing environment variables to Netlify
3. Re-run this diagnostic
4. Test a real payment flow
` : `
1. Test a real payment with a small amount
2. Monitor payment webhooks
3. Check Stripe dashboard for transactions
`}

## 🔗 Useful Links
- Netlify Site Settings: https://app.netlify.com/sites/[your-site]/settings/deploys
- Stripe Dashboard: https://dashboard.stripe.com/
- Supabase Dashboard: https://supabase.com/dashboard/projects
`;
    
    return report.trim();
  }
}

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).PaymentQuickFix = PaymentQuickFix;
}

export default PaymentQuickFix;
