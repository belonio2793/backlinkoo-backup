// Direct Resend email service - with Netlify function fallback

import { safeFetch } from '../utils/fullstoryWorkaround';

export interface ResendEmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
  provider: 'resend';
}

export interface ResendEmailData {
  to: string;
  subject: string;
  message: string;
  from?: string;
}

export class ResendEmailService {
  private static readonly FROM_EMAIL = 'Backlink ∞ <support@backlinkoo.com>';
  private static failureLog: Array<{ timestamp: Date; error: string; email: string }> = [];
  private static readonly NETLIFY_FUNCTION_URL = '/netlify/functions/send-email';
  private static readonly RESEND_API_KEY = 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq';

  private static async sendViaNetlify(emailData: ResendEmailData): Promise<ResendEmailResponse> {
    try {
      console.log('Sending email via Netlify function:', { to: emailData.to, subject: emailData.subject });

      const response = await fetch(this.NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailData.from || this.FROM_EMAIL,
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message
        }),
      });

      // Read response body once and handle both success and error cases
      const responseData = await response.json().catch(() => ({ error: `HTTP ${response.status} error` }));

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Email Netlify function not available (404), trying alternative paths...');

          // Try alternative function path
          const altResponse = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: emailData.from || this.FROM_EMAIL,
              to: emailData.to,
              subject: emailData.subject,
              message: emailData.message
            }),
          });

          if (!altResponse.ok) {
            console.warn('Alternative Netlify function also failed:', altResponse.status);
            return {
              success: false,
              error: `Netlify functions unavailable (${response.status}, ${altResponse.status}) - will try direct API`,
              provider: 'resend'
            };
          }

          const altResult = await altResponse.json();
          return {
            success: true,
            emailId: altResult.emailId,
            provider: 'resend'
          };
        }

        console.warn('Netlify function error:', response.status, responseData);
        return {
          success: false,
          error: `Netlify function error (${response.status}): ${responseData.error || response.statusText}`,
          provider: 'resend'
        };
      }

      console.log('Email sent successfully via Netlify:', responseData.emailId);

      return {
        success: true,
        emailId: responseData.emailId,
        provider: 'resend'
      };
    } catch (error: any) {
      console.error('Netlify email service error:', error);

      // Log failure
      this.failureLog.push({
        timestamp: new Date(),
        error: error.message,
        email: emailData.to
      });

      return {
        success: false,
        error: error.message || 'Failed to send email',
        provider: 'resend'
      };
    }
  }

  /**
   * Send email directly via Resend API (fallback when Netlify functions unavailable)
   */
  private static async sendDirectAPI(emailData: ResendEmailData): Promise<ResendEmailResponse> {
    try {
      console.log('Sending email directly via Resend API:', { to: emailData.to, subject: emailData.subject });

      const response = await safeFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailData.from || this.FROM_EMAIL,
          to: [emailData.to],
          subject: emailData.subject,
          html: this.formatEmailHTML(emailData.message, emailData.subject)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully via direct API:', result.id);

      return {
        success: true,
        emailId: result.id,
        provider: 'resend'
      };
    } catch (error: any) {
      console.error('Direct API email error:', error);

      // Log failure
      this.failureLog.push({
        timestamp: new Date(),
        error: error.message,
        email: emailData.to
      });

      return {
        success: false,
        error: error.message || 'Failed to send email via direct API',
        provider: 'resend'
      };
    }
  }

  /**
   * Smart email sending with automatic fallback
   */
  private static async sendWithFallback(emailData: ResendEmailData): Promise<ResendEmailResponse> {
    // First try Netlify function
    try {
      const netlifyResult = await this.sendViaNetlify(emailData);
      return netlifyResult;
    } catch (error: any) {
      console.warn('Netlify function failed, trying direct API:', error.message);

      // If Netlify function fails, try direct API
      return await this.sendDirectAPI(emailData);
    }
  }

  /**
   * Format email content as HTML
   */
  private static formatEmailHTML(message: string, subject: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔗 Backlink ∞</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #555;">
            ${message}
          </div>
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

  // Public methods for different email types
  static async sendConfirmationEmail(email: string, confirmationUrl?: string): Promise<ResendEmailResponse> {
    console.log('Sending confirmation email to:', email);

    const defaultConfirmationUrl = confirmationUrl || `https://backlinkoo.com/auth/confirm?email=${encodeURIComponent(email)}`;

    const emailData: ResendEmailData = {
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
https://backlinkoo.com`
    };

    return await this.sendWithFallback(emailData);
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<ResendEmailResponse> {
    console.log('Sending password reset email to:', email);

    const emailData: ResendEmailData = {
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
https://backlinkoo.com`
    };

    return await this.sendWithFallback(emailData);
  }

  static async sendWelcomeEmail(email: string, firstName?: string): Promise<ResendEmailResponse> {
    console.log('Sending welcome email to:', email);

    const name = firstName ? ` ${firstName}` : '';

    const emailData: ResendEmailData = {
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
https://backlinkoo.com`
    };

    return await this.sendWithFallback(emailData);
  }

  // Legacy compatibility methods
  static async sendEmail(emailData: ResendEmailData): Promise<ResendEmailResponse> {
    return await this.sendWithFallback(emailData);
  }

  static async healthCheck(): Promise<{ status: string; resend: boolean }> {
    try {
      // Test Netlify function availability
      const response = await fetch(this.NETLIFY_FUNCTION_URL, {
        method: 'OPTIONS', // Preflight request to check availability
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // If we get any response (even error), the function is available
      const isHealthy = response.status !== 0;

      return {
        status: isHealthy ? 'healthy' : 'error',
        resend: isHealthy
      };
    } catch (error) {
      console.warn('Email service health check failed:', error);
      return {
        status: 'error',
        resend: false
      };
    }
  }

  static getFailureLog(): Array<{ timestamp: Date; error: string; email: string }> {
    return this.failureLog;
  }
}
