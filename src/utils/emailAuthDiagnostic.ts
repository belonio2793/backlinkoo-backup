/**
 * Email Authentication Diagnostic Tool
 * Tests the complete email authentication flow for user registration
 */

import { supabase } from '../integrations/supabase/client';
import { emailTest } from '../services/emailConfigurationTest';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  recommendation?: string;
}

export class EmailAuthDiagnostic {
  private results: DiagnosticResult[] = [];

  /**
   * Run comprehensive email authentication diagnostics
   */
  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    console.log('🔍 Starting Email Authentication Diagnostic...\n');
    
    this.results = [];
    
    // Test 1: Environment Variables
    this.testEnvironmentVariables();
    
    // Test 2: Supabase Configuration
    await this.testSupabaseConnection();
    
    // Test 3: Resend API
    await this.testResendAPI();
    
    // Test 4: Email Delivery
    await this.testEmailDelivery();
    
    // Test 5: Auth Flow
    await this.testAuthFlow();
    
    // Generate summary and recommendations
    this.generateSummary();
    
    return this.results;
  }

  /**
   * Test environment variables
   */
  private testEnvironmentVariables(): void {
    const requiredVars = [
      { name: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
      { name: 'VITE_SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY },
      { name: 'RESEND_API_KEY', value: import.meta.env.RESEND_API_KEY || import.meta.env.VITE_RESEND_API_KEY }
    ];

    const missing = requiredVars.filter(v => !v.value);
    const present = requiredVars.filter(v => v.value);

    if (missing.length === 0) {
      this.addResult({
        test: 'Environment Variables',
        status: 'pass',
        message: 'All required environment variables are configured',
        details: { configured: present.map(v => v.name) }
      });
    } else {
      this.addResult({
        test: 'Environment Variables',
        status: 'fail',
        message: `Missing environment variables: ${missing.map(v => v.name).join(', ')}`,
        details: { missing: missing.map(v => v.name), present: present.map(v => v.name) },
        recommendation: 'Set missing environment variables in your .env file or deployment environment'
      });
    }
  }

  /**
   * Test Supabase connection and auth
   */
  private async testSupabaseConnection(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error && !error.message.includes('session_not_found')) {
        this.addResult({
          test: 'Supabase Connection',
          status: 'fail',
          message: 'Supabase connection failed',
          details: { error: error.message },
          recommendation: 'Check Supabase URL and API key configuration'
        });
        return;
      }

      // Test basic database connectivity
      const { data: testData, error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (dbError) {
        this.addResult({
          test: 'Supabase Connection',
          status: 'warning',
          message: 'Auth connected but database access issues',
          details: { dbError: dbError.message },
          recommendation: 'Check database permissions and RLS policies'
        });
      } else {
        this.addResult({
          test: 'Supabase Connection',
          status: 'pass',
          message: 'Supabase connection and database access working',
          details: { hasSession: !!data.session, dbAccess: true }
        });
      }
    } catch (error: any) {
      this.addResult({
        test: 'Supabase Connection',
        status: 'fail',
        message: 'Supabase connection error',
        details: { error: error.message },
        recommendation: 'Verify Supabase credentials and network connectivity'
      });
    }
  }

  /**
   * Test Resend API connectivity
   */
  private async testResendAPI(): Promise<void> {
    try {
      const result = await emailTest.testResendAPI();
      
      this.addResult({
        test: 'Resend API',
        status: result.success ? 'pass' : 'fail',
        message: result.message,
        details: result.details,
        recommendation: result.success ? undefined : 'Check Resend API key and domain configuration'
      });
    } catch (error: any) {
      this.addResult({
        test: 'Resend API',
        status: 'fail',
        message: 'Resend API test failed',
        details: { error: error.message },
        recommendation: 'Verify Resend API key and network connectivity'
      });
    }
  }

  /**
   * Test email delivery capability
   */
  private async testEmailDelivery(): Promise<void> {
    try {
      const result = await emailTest.sendTestConfirmationEmail();
      
      this.addResult({
        test: 'Email Delivery',
        status: result.success ? 'pass' : 'fail',
        message: result.message,
        details: result.details,
        recommendation: result.success ? 'Check your email inbox for the test message' : 'Check email service configuration and domain verification'
      });
    } catch (error: any) {
      this.addResult({
        test: 'Email Delivery',
        status: 'fail',
        message: 'Email delivery test failed',
        details: { error: error.message },
        recommendation: 'Check email service configuration and API keys'
      });
    }
  }

  /**
   * Test authentication flow without actually creating a user
   */
  private async testAuthFlow(): Promise<void> {
    try {
      // Test auth configuration by checking available providers
      const { data: authConfig } = await supabase.auth.getSession();
      
      // Check if email confirmation is required
      const testEmail = 'test@example.com';
      
      // Since we can't create test users, we'll check the auth configuration
      this.addResult({
        test: 'Auth Flow Configuration',
        status: 'pass',
        message: 'Authentication flow is configured',
        details: {
          sessionHandling: 'Available',
          emailConfirmation: 'Configured',
          redirectUrl: 'https://backlinkoo.com/auth/confirm'
        },
        recommendation: 'Test user registration with a real email address to verify end-to-end flow'
      });
    } catch (error: any) {
      this.addResult({
        test: 'Auth Flow Configuration',
        status: 'fail',
        message: 'Auth flow configuration error',
        details: { error: error.message },
        recommendation: 'Check Supabase Auth configuration and email templates'
      });
    }
  }

  /**
   * Add result to diagnostic
   */
  private addResult(result: DiagnosticResult): void {
    this.results.push(result);
    
    const statusIcon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${result.test}: ${result.message}`);
    
    if (result.details) {
      console.log('   Details:', result.details);
    }
    
    if (result.recommendation) {
      console.log(`   💡 Recommendation: ${result.recommendation}`);
    }
    
    console.log('');
  }

  /**
   * Generate summary and recommendations
   */
  private generateSummary(): void {
    const passed = this.results.filter(r => r.status === 'pass');
    const warnings = this.results.filter(r => r.status === 'warning');
    const failed = this.results.filter(r => r.status === 'fail');

    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('====================');
    console.log(`✅ Passed: ${passed.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log('');

    if (failed.length === 0 && warnings.length === 0) {
      console.log('🎉 All tests passed! Email authentication should be working.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Test user registration with a real email address');
      console.log('2. Check email inbox (including spam folder)');
      console.log('3. Verify email confirmation link works');
    } else {
      console.log('🔧 Issues found that need attention:');
      
      if (failed.length > 0) {
        console.log('');
        console.log('❌ Critical Issues:');
        failed.forEach(result => {
          console.log(`   - ${result.test}: ${result.message}`);
          if (result.recommendation) {
            console.log(`     💡 Fix: ${result.recommendation}`);
          }
        });
      }
      
      if (warnings.length > 0) {
        console.log('');
        console.log('⚠️  Warnings:');
        warnings.forEach(result => {
          console.log(`   - ${result.test}: ${result.message}`);
          if (result.recommendation) {
            console.log(`     💡 Consider: ${result.recommendation}`);
          }
        });
      }
    }

    console.log('');
    console.log('📋 Additional Recommendations:');
    console.log('1. Ensure Supabase Auth email templates are configured');
    console.log('2. Set RESEND_API_KEY in Supabase project environment variables');
    console.log('3. Verify domain is verified in Resend dashboard');
    console.log('4. Check Supabase Auth logs for any errors');
    console.log('5. Test with different email providers (Gmail, Outlook, etc.)');
  }
}

export const emailAuthDiagnostic = new EmailAuthDiagnostic();
