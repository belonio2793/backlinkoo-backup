/**
 * Email Configuration Test Service
 * Comprehensive testing for email delivery and configuration
 */

import { safeFetch } from '../utils/fullstoryWorkaround';

interface EmailTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  testEmail: string;
}

export class EmailConfigurationTest {
  private config: EmailConfig;

  constructor() {
    // Get API key from multiple sources
    const getApiKey = (): string => {
      // Check environment variables first
      const envKey = import.meta.env.VITE_RESEND_API_KEY ||
                     import.meta.env.RESEND_API_KEY;
      if (envKey && envKey.startsWith('re_')) {
        return envKey;
      }

      // Check localStorage configs
      try {
        const adminConfigs = JSON.parse(localStorage.getItem('admin_api_configs') || '{}');
        if (adminConfigs.RESEND_API_KEY && adminConfigs.RESEND_API_KEY.startsWith('re_')) {
          return adminConfigs.RESEND_API_KEY;
        }
      } catch (error) {
        console.warn('Failed to parse admin configs from localStorage');
      }

      // Fallback to hardcoded key
      return 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq';
    };

    this.config = {
      apiKey: getApiKey(),
      fromEmail: 'Backlink ∞ <noreply@backlinkoo.com>',
      testEmail: 'support@backlinkoo.com'
    };
  }

  /**
   * Test Resend API connectivity
   */
  async testResendAPI(): Promise<EmailTestResult> {
    try {
      // Check if API key is valid format
      if (!this.config.apiKey || !this.config.apiKey.startsWith('re_')) {
        return {
          success: false,
          message: 'Invalid Resend API key format',
          error: 'API key should start with "re_"'
        };
      }

      const response = await safeFetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Resend API is accessible',
          details: {
            domains: data.data?.length || 0,
            domainList: data.data?.map((d: any) => ({ name: d.name, status: d.status })) || [],
            apiKeyFormat: 'Valid',
            responseStatus: response.status
          }
        };
      } else {
        const errorText = await response.text();
        let errorMessage = 'Resend API connection failed';

        // Parse common error responses
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Keep original error text if not JSON
        }

        return {
          success: false,
          message: errorMessage,
          error: `HTTP ${response.status}: ${errorText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            apiKeyUsed: this.config.apiKey.substring(0, 8) + '...'
          }
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Network error connecting to Resend',
        error: error.message,
        details: {
          errorType: error.constructor.name,
          stack: error.stack?.split('\n')[0]
        }
      };
    }
  }

  /**
   * Send test confirmation email
   */
  async sendTestConfirmationEmail(): Promise<EmailTestResult> {
    try {
      const confirmationUrl = 'https://backlinkoo.com/auth/confirm?token=test-token&email=test@example.com';
      
      const emailData = {
        from: this.config.fromEmail,
        to: [this.config.testEmail],
        subject: '🔧 Email Confirmation Test - Backlink ∞',
        html: this.generateConfirmationEmailHTML(confirmationUrl)
      };

      const response = await safeFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: 'Test confirmation email sent successfully',
          details: {
            emailId: result.id,
            to: this.config.testEmail,
            subject: emailData.subject
          }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          message: 'Failed to send test email',
          error: `${response.status}: ${errorText}`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Error sending test email',
        error: error.message
      };
    }
  }

  /**
   * Test environment variables
   */
  testEnvironmentVariables(): EmailTestResult {
    const envChecks = [
      { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
      { name: 'VITE_SUPABASE_URL', value: process.env.VITE_SUPABASE_URL },
      { name: 'VITE_SUPABASE_ANON_KEY', value: process.env.VITE_SUPABASE_ANON_KEY }
    ];

    const missing = envChecks.filter(check => !check.value);
    const configured = envChecks.filter(check => check.value);

    return {
      success: missing.length === 0,
      message: missing.length === 0 
        ? 'All required environment variables are configured'
        : `Missing environment variables: ${missing.map(m => m.name).join(', ')}`,
      details: {
        configured: configured.map(c => ({ name: c.name, hasValue: !!c.value })),
        missing: missing.map(m => m.name)
      }
    };
  }

  /**
   * Test Supabase Auth configuration (requires valid session)
   */
  async testSupabaseAuth(): Promise<EmailTestResult> {
    try {
      // Import dynamically to avoid build issues
      const { supabase } = await import('../integrations/supabase/client');
      
      // Test basic auth functionality
      const { data, error } = await supabase.auth.getSession();
      
      if (error && !error.message.includes('session_not_found')) {
        return {
          success: false,
          message: 'Supabase Auth connection failed',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Supabase Auth is accessible',
        details: {
          hasSession: !!data.session,
          authEndpoint: 'reachable'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Supabase Auth test failed',
        error: error.message
      };
    }
  }

  /**
   * Run comprehensive email configuration test
   */
  async runComprehensiveTest(): Promise<{
    overall: boolean;
    results: Record<string, EmailTestResult>;
    recommendations: string[];
  }> {
    console.log('🔧 Running comprehensive email configuration test...');

    const results: Record<string, EmailTestResult> = {};

    // Test 1: Environment Variables
    results.environment = this.testEnvironmentVariables();

    // Test 2: Resend API
    results.resendAPI = await this.testResendAPI();

    // Test 3: Supabase Auth
    results.supabaseAuth = await this.testSupabaseAuth();

    // Test 4: Email Delivery
    if (results.resendAPI.success) {
      results.emailDelivery = await this.sendTestConfirmationEmail();
    } else {
      results.emailDelivery = {
        success: false,
        message: 'Skipped - Resend API not accessible'
      };
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (!results.environment.success) {
      recommendations.push('Set missing environment variables in Supabase project settings');
    }
    
    if (!results.resendAPI.success) {
      recommendations.push('Verify RESEND_API_KEY is valid and properly configured');
    }
    
    if (!results.supabaseAuth.success) {
      recommendations.push('Check Supabase project configuration and credentials');
    }
    
    if (!results.emailDelivery.success && results.resendAPI.success) {
      recommendations.push('Check Resend domain configuration and email templates');
    }

    if (results.emailDelivery.success) {
      recommendations.push('Configure Supabase Auth email templates to use this Resend setup');
      recommendations.push('Set auth redirect URL to: https://backlinkoo.com/auth/confirm');
    }

    const overall = Object.values(results).every(result => result.success);

    return {
      overall,
      results,
      recommendations
    };
  }

  /**
   * Generate HTML for confirmation email
   */
  private generateConfirmationEmailHTML(confirmationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔗 Backlink ∞</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333; margin-top: 0;">Confirm Your Email Address</h2>
          <p style="line-height: 1.6; color: #555;">
            Welcome to Backlink ∞! Please confirm your email address to complete your registration.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Confirm Email Address
            </a>
          </div>
          <p style="line-height: 1.6; color: #777; font-size: 14px;">
            If the button above doesn't work, copy and paste this link into your browser:
            <br><a href="${confirmationUrl}" style="color: #3B82F6;">${confirmationUrl}</a>
          </p>
          <p style="line-height: 1.6; color: #777; font-size: 14px;">
            This is a test email to verify the email confirmation system is working properly.
          </p>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            Sent via Backlink ∞ Email System<br>
            ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;
  }
}

// Export a singleton instance for easy use
export const emailTest = new EmailConfigurationTest();
