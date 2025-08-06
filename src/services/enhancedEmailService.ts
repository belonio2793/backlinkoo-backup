import { EmailService, EmailServiceResponse, EmailData } from './emailService';

/**
 * Enhanced Email Service with improved error handling and fallback mechanisms
 */
export class EnhancedEmailService extends EmailService {
  private static readonly NETLIFY_FUNCTION_PATH = '/.netlify/functions/send-email';
  private static readonly SUPABASE_FUNCTION_PATH = '/supabase/functions/send-email-resend';
  
  /**
   * Send email with multiple fallback mechanisms
   */
  static async sendEmailRobust(emailData: EmailData): Promise<EmailServiceResponse> {
    const providers = [
      { name: 'netlify', method: this.sendViaNetlifyRobust },
      { name: 'supabase', method: this.sendViaSupabaseEdge },
      { name: 'direct_resend', method: this.sendViaDirectResend }
    ];

    let lastError: string = '';
    
    for (const provider of providers) {
      try {
        console.log(`Attempting to send email via ${provider.name}...`);
        const result = await provider.method.call(this, emailData);
        
        if (result.success) {
          console.log(`✅ Email sent successfully via ${provider.name}`);
          return result;
        } else {
          lastError = result.error || `${provider.name} failed`;
          console.warn(`❌ ${provider.name} failed:`, lastError);
          continue;
        }
      } catch (error) {
        lastError = this.serializeError(error);
        console.error(`💥 ${provider.name} threw error:`, lastError);
        continue;
      }
    }

    // All providers failed
    return {
      success: false,
      error: `All email providers failed. Last error: ${lastError}`,
      provider: 'all_failed'
    };
  }

  /**
   * Enhanced Netlify function with better error detection
   */
  private static async sendViaNetlifyRobust(emailData: EmailData): Promise<EmailServiceResponse> {
    try {
      // Check if we're likely in a Netlify environment
      const isNetlifyEnv = this.isNetlifyEnvironment();
      
      if (!isNetlifyEnv) {
        throw new Error('Not in Netlify environment - skipping Netlify function');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced timeout

      const response = await fetch(this.NETLIFY_FUNCTION_PATH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 404 specifically
      if (response.status === 404) {
        throw new Error('Netlify function not found. Function may not be deployed or path is incorrect.');
      }

      if (!response.ok) {
        let errorText = 'Unknown error';
        try {
          const textResponse = await response.text();
          errorText = textResponse || `HTTP ${response.status}`;
        } catch (readError) {
          errorText = `HTTP ${response.status} (unable to read response)`;
        }
        
        throw new Error(`Netlify function error: ${errorText}`);
      }

      const result = await response.json();
      
      return {
        success: result.success || false,
        emailId: result.emailId,
        error: result.error,
        provider: 'netlify_resend'
      };

    } catch (error) {
      const errorMessage = this.serializeError(error);
      console.error('Netlify function error details:', errorMessage);
      
      return {
        success: false,
        error: `Netlify function failed: ${error instanceof Error ? error.message : errorMessage}`,
        provider: 'netlify_resend'
      };
    }
  }

  /**
   * Supabase Edge Function fallback
   */
  private static async sendViaSupabaseEdge(emailData: EmailData): Promise<EmailServiceResponse> {
    try {
      const { supabase } = await import('../integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('send-email-resend', {
        body: emailData
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      return {
        success: data?.success || false,
        emailId: data?.emailId,
        error: data?.error,
        provider: 'supabase_resend'
      };

    } catch (error) {
      return {
        success: false,
        error: `Supabase Edge function failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: 'supabase_resend'
      };
    }
  }

  /**
   * Direct Resend API call as last resort
   */
  private static async sendViaDirectResend(emailData: EmailData): Promise<EmailServiceResponse> {
    try {
      // This would require the Resend API key to be available client-side
      // which is not recommended for security reasons, so we'll simulate
      
      throw new Error('Direct Resend API not available in client environment for security');
      
    } catch (error) {
      return {
        success: false,
        error: `Direct Resend failed: ${error instanceof Error ? error.message : String(error)}`,
        provider: 'direct_resend'
      };
    }
  }

  /**
   * Detect if we're in a Netlify environment
   */
  private static isNetlifyEnvironment(): boolean {
    // Check for Netlify-specific environment indicators
    if (typeof window !== 'undefined') {
      // Client-side checks
      const hostname = window.location.hostname;
      return hostname.includes('netlify.app') || 
             hostname.includes('netlify.com') || 
             hostname === 'localhost' ||
             hostname === '127.0.0.1';
    }
    
    // Server-side checks
    return !!(process.env.NETLIFY || 
              process.env.NETLIFY_DEV || 
              process.env.DEPLOY_URL);
  }

  /**
   * Improved error serialization with more detail
   */
  private static serializeError(error: any): string {
    if (error instanceof Error) {
      return JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Limit stack trace
        cause: error.cause
      }, null, 2);
    }
    
    if (typeof error === 'object' && error !== null) {
      try {
        // Handle Response objects specially
        if (error.constructor?.name === 'Response') {
          return `HTTP Response: ${error.status} ${error.statusText}`;
        }
        
        return JSON.stringify(error, (key, value) => {
          // Avoid circular references
          if (typeof value === 'object' && value !== null) {
            if (value.constructor?.name === 'HTMLElement') {
              return '[HTMLElement]';
            }
            if (value.constructor?.name === 'Window') {
              return '[Window]';
            }
          }
          return value;
        }, 2);
      } catch (e) {
        return `[Object: ${Object.prototype.toString.call(error)} - Cannot serialize: ${e.message}]`;
      }
    }
    
    return String(error);
  }

  /**
   * Test email connectivity with detailed diagnostics
   */
  static async testEmailConnectivity(testEmail: string = 'test@example.com'): Promise<{
    netlify: { available: boolean; error?: string };
    supabase: { available: boolean; error?: string };
    overall: { working: boolean; recommendedProvider: string };
  }> {
    const results = {
      netlify: { available: false, error: undefined as string | undefined },
      supabase: { available: false, error: undefined as string | undefined },
      overall: { working: false, recommendedProvider: 'none' }
    };

    // Test Netlify function
    try {
      const testResult = await this.sendViaNetlifyRobust({
        to: testEmail,
        subject: 'Connectivity Test',
        message: 'This is a connectivity test email'
      });
      
      results.netlify.available = testResult.success;
      if (!testResult.success) {
        results.netlify.error = testResult.error;
      }
    } catch (error) {
      results.netlify.error = error instanceof Error ? error.message : String(error);
    }

    // Test Supabase function
    try {
      const testResult = await this.sendViaSupabaseEdge({
        to: testEmail,
        subject: 'Connectivity Test',
        message: 'This is a connectivity test email'
      });
      
      results.supabase.available = testResult.success;
      if (!testResult.success) {
        results.supabase.error = testResult.error;
      }
    } catch (error) {
      results.supabase.error = error instanceof Error ? error.message : String(error);
    }

    // Determine overall status
    if (results.netlify.available) {
      results.overall.working = true;
      results.overall.recommendedProvider = 'netlify';
    } else if (results.supabase.available) {
      results.overall.working = true;
      results.overall.recommendedProvider = 'supabase';
    }

    return results;
  }

  /**
   * Send confirmation email with enhanced error handling
   */
  static async sendConfirmationEmailRobust(email: string, confirmationUrl?: string): Promise<EmailServiceResponse> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://backlinkoo.com';
    const defaultConfirmationUrl = confirmationUrl || `${origin}/auth/confirm?email=${encodeURIComponent(email)}`;

    const emailData = {
      to: email,
      subject: 'Confirm Your Backlink ∞ Account',
      message: `Welcome to Backlink ∞!

Thank you for creating an account with us. To complete your registration and start building high-authority backlinks, please confirm your email address.

Click the link below to verify your account:
${defaultConfirmationUrl}

Why verify your email?
✅ Secure your account
✅ Access all platform features
✅ Receive important updates
✅ Start your first backlink campaign

This link will expire in 24 hours for security reasons.

If you didn't create an account with Backlink ∞, please ignore this email.

Need help? Reply to this email or contact our support team.

Best regards,
The Backlink ∞ Team

Professional SEO & Backlink Management Platform
${origin}`,
      from: 'Backlink ∞ <support@backlinkoo.com>'
    };

    return this.sendEmailRobust(emailData);
  }

  /**
   * Send password reset email with enhanced error handling
   */
  static async sendPasswordResetEmailRobust(email: string, resetUrl: string): Promise<EmailServiceResponse> {
    const emailData = {
      to: email,
      subject: 'Reset Your Backlink ∞ Password',
      message: `Hi there,

We received a request to reset your password for your Backlink ∞ account.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Need help? Contact our support team at support@backlinkoo.com

Best regards,
The Backlink ∞ Team

Professional SEO & Backlink Management Platform
https://backlinkoo.com`,
      from: 'Backlink ∞ <support@backlinkoo.com>'
    };

    return this.sendEmailRobust(emailData);
  }

  /**
   * Send welcome email with enhanced error handling
   */
  static async sendWelcomeEmailRobust(email: string, firstName?: string): Promise<EmailServiceResponse> {
    const name = firstName ? ` ${firstName}` : '';

    const emailData = {
      to: email,
      subject: 'Welcome to Backlink ∞ - Your SEO Journey Starts Now!',
      message: `Hi${name}!

Welcome to Backlink ∞! 🎉

Your account has been successfully verified and you're now part of our professional SEO community.

Here's what you can do next:

🚀 CREATE YOUR FIRST CAMPAIGN
   • Log in to your dashboard
   • Purchase credits to get started
   • Launch your first backlink campaign

💡 EXPLORE OUR TOOLS
   • Keyword research tools
   • Ranking tracker
   • Competitor analysis
   • Backlink verification reports

📈 PROFESSIONAL FEATURES
   • High-DA backlinks (80+ authority)
   • AI-generated content
   • Real-time campaign tracking
   • Detailed performance analytics

Ready to start? Visit your dashboard:
https://backlinkoo.com/dashboard

Questions? Our support team is here to help at support@backlinkoo.com

Best regards,
The Backlink ∞ Team

Professional SEO & Backlink Management Platform
https://backlinkoo.com`,
      from: 'Backlink ∞ <support@backlinkoo.com>'
    };

    return this.sendEmailRobust(emailData);
  }
}
