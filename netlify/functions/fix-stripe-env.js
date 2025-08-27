/**
 * Stripe Environment Configuration Fix
 * This function checks and validates all Stripe environment variables
 * and provides clear instructions for fixing any issues
 */

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    console.log('🔍 Stripe Environment Configuration Check');
    
    // Required server-side environment variables
    const requiredServerVars = {
      'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
      'STRIPE_PREMIUM_PLAN_MONTHLY': process.env.STRIPE_PREMIUM_PLAN_MONTHLY,
      'STRIPE_PREMIUM_PLAN_ANNUAL': process.env.STRIPE_PREMIUM_PLAN_ANNUAL
    };

    // Optional server-side variables
    const optionalServerVars = {
      'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
      'STRIPE_PUBLISHABLE_KEY': process.env.STRIPE_PUBLISHABLE_KEY
    };

    // Check for security issues
    const securityIssues = [];
    if (process.env.VITE_STRIPE_SECRET_KEY) {
      securityIssues.push({
        variable: 'VITE_STRIPE_SECRET_KEY',
        issue: 'Secret key exposed to frontend',
        severity: 'CRITICAL',
        fix: 'Remove this variable immediately - secret keys should never have VITE_ prefix'
      });
    }

    // Validate required variables
    const missingVars = [];
    const configuredVars = [];
    const invalidVars = [];

    for (const [varName, value] of Object.entries(requiredServerVars)) {
      if (!value) {
        missingVars.push(varName);
      } else {
        // Validate format
        if (varName === 'STRIPE_SECRET_KEY' && !value.startsWith('sk_')) {
          invalidVars.push({
            variable: varName,
            issue: 'Invalid format - must start with sk_',
            current: value.substring(0, 10) + '...'
          });
        } else if (varName.includes('PLAN') && !value.startsWith('price_')) {
          invalidVars.push({
            variable: varName,
            issue: 'Invalid format - must be a Stripe price ID starting with price_',
            current: value
          });
        } else {
          configuredVars.push({
            variable: varName,
            value: varName.includes('SECRET') || varName.includes('KEY') 
              ? value.substring(0, 10) + '...' 
              : value,
            status: 'OK'
          });
        }
      }
    }

    // Check optional variables
    const optionalConfigured = [];
    for (const [varName, value] of Object.entries(optionalServerVars)) {
      if (value) {
        optionalConfigured.push({
          variable: varName,
          value: varName.includes('SECRET') || varName.includes('KEY') 
            ? value.substring(0, 10) + '...' 
            : value,
          status: 'CONFIGURED'
        });
      }
    }

    // Determine overall status
    const hasErrors = missingVars.length > 0 || invalidVars.length > 0 || securityIssues.length > 0;
    const status = hasErrors ? 'ERROR' : 'SUCCESS';

    const response = {
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      summary: {
        total_required: Object.keys(requiredServerVars).length,
        configured: configuredVars.length,
        missing: missingVars.length,
        invalid: invalidVars.length,
        security_issues: securityIssues.length
      },
      details: {
        configured_variables: configuredVars,
        optional_variables: optionalConfigured,
        missing_variables: missingVars,
        invalid_variables: invalidVars,
        security_issues: securityIssues
      },
      instructions: {
        missing_variables: missingVars.length > 0 ? {
          action: 'Add the following environment variables in Netlify dashboard',
          variables: missingVars.map(varName => {
            switch(varName) {
              case 'STRIPE_SECRET_KEY':
                return `${varName}=sk_test_... (or sk_live_... for production)`;
              case 'STRIPE_PREMIUM_PLAN_MONTHLY':
                return `${varName}=price_... (get from Stripe dashboard - Monthly plan)`;
              case 'STRIPE_PREMIUM_PLAN_ANNUAL':
                return `${varName}=price_... (get from Stripe dashboard - Annual plan)`;
              default:
                return `${varName}=...`;
            }
          })
        } : null,
        security_fixes: securityIssues.length > 0 ? {
          action: 'IMMEDIATE ACTION REQUIRED',
          fixes: securityIssues.map(issue => ({
            variable: issue.variable,
            action: issue.fix,
            severity: issue.severity
          }))
        } : null,
        frontend_variables: {
          action: 'Ensure these are configured for frontend',
          note: 'These should be set in Netlify build environment',
          variables: [
            'VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)'
          ]
        }
      }
    };

    console.log('✅ Stripe environment check completed:', { status, missingVars, invalidVars, securityIssues });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('❌ Error checking Stripe environment:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
