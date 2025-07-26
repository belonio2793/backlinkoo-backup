// Direct Resend email service - no Netlify or Supabase dependencies

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
  private static readonly NETLIFY_FUNCTION_URL = '/.netlify/functions/send-email';

  // Check if we're in development environment
  private static isDevelopment(): boolean {
    return window.location.hostname === 'localhost' ||
           window.location.hostname.includes('127.0.0.1') ||
           window.location.hostname.includes('.fly.dev');
  }

  private static async sendViaMockService(emailData: ResendEmailData): Promise<ResendEmailResponse> {
    console.log('🧪 DEVELOPMENT MODE: Mock email service');
    console.log('📧 Email would be sent:', {
      from: emailData.from || this.FROM_EMAIL,
      to: emailData.to,
      subject: emailData.subject,
      message: emailData.message.substring(0, 100) + '...'
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate successful email sending in development
    const mockEmailId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('✅ Mock email sent successfully with ID:', mockEmailId);

    return {
      success: true,
      emailId: mockEmailId,
      provider: 'resend'
    };
  }

  private static async sendViaNetlify(emailData: ResendEmailData): Promise<ResendEmailResponse> {
    // Use mock service in development
    if (this.isDevelopment()) {
      console.warn('⚠️ Development environment detected - using mock email service');
      return await this.sendViaMockService(emailData);
    }

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

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error('Netlify function error:', response.status, errorData);
        throw new Error(`Email service error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully via Netlify:', result.emailId);

      return {
        success: true,
        emailId: result.emailId,
        provider: 'resend'
      };
    } catch (error: any) {
      console.error('Netlify email service error:', error);

      // In production, try to provide more helpful error messages
      let friendlyError = error.message || 'Failed to send email';
      if (error.message?.includes('404')) {
        friendlyError = 'Email service not available - Netlify function not found';
      } else if (error.message?.includes('fetch')) {
        friendlyError = 'Network error - unable to connect to email service';
      }

      // Log failure
      this.failureLog.push({
        timestamp: new Date(),
        error: friendlyError,
        email: emailData.to
      });

      return {
        success: false,
        error: friendlyError,
        provider: 'resend'
      };
    }
  }



  // Public methods for different email types
  static async sendConfirmationEmail(email: string, confirmationUrl?: string): Promise<ResendEmailResponse> {
    console.log('Sending confirmation email to:', email);

    const defaultConfirmationUrl = confirmationUrl || `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}`;

    // Add development notice if in dev mode
    const devNotice = this.isDevelopment() ? `

🧪 DEVELOPMENT MODE NOTICE:
This is a simulated email for testing purposes. In production, you would receive an actual email.
For testing, you can manually navigate to: ${defaultConfirmationUrl}

` : '';

    const emailData: ResendEmailData = {
      to: email,
      subject: 'Confirm Your Backlink ∞ Account',
      message: `Welcome to Backlink ∞!
${devNotice}
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

---
Professional SEO & Backlink Management Platform
https://backlinkoo.com`
    };

    return await this.sendViaNetlify(emailData);
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

---
Professional SEO & Backlink Management Platform
https://backlinkoo.com`
    };

    return await this.sendViaNetlify(emailData);
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

---
Professional SEO & Backlink Management Platform
https://backlinkoo.com`
    };

    return await this.sendViaNetlify(emailData);
  }

  // Legacy compatibility methods
  static async sendEmail(emailData: ResendEmailData): Promise<ResendEmailResponse> {
    return await this.sendViaNetlify(emailData);
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
