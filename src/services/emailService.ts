// Direct Resend email service for authentication emails

export interface EmailServiceResponse {
  success: boolean;
  emailId?: string;
  error?: string;
  provider: string;
}

// Legacy interfaces for compatibility
export interface EmailData {
  to: string;
  subject: string;
  message: string;
  from?: string;
}

export interface EmailResult extends EmailServiceResponse {
  // Additional properties for legacy compatibility
}

export class EmailService {
  private static failureLog: Array<{ timestamp: Date; error: string; email: string }> = [];

  private static async sendViaNetlifyFunction(emailData: any): Promise<EmailServiceResponse> {
    try {
      console.log('Sending email via Netlify function:', { to: emailData.to, subject: emailData.subject });

      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error response:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid JSON response from email service');
      }

      console.log('Email service response:', result);

      if (result.success) {
        return {
          success: true,
          emailId: result.emailId,
          provider: 'netlify_resend'
        };
      } else {
        throw new Error(result.error || 'Email service returned failure');
      }
    } catch (error: any) {
      console.error('sendViaNetlifyFunction error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        provider: 'netlify_resend'
      };
    }
  }

  static async sendConfirmationEmail(email: string, confirmationUrl?: string): Promise<EmailServiceResponse> {
    console.log('EmailService: Sending confirmation email to:', email);

    const defaultConfirmationUrl = confirmationUrl || `https://backlinkoo.com/auth/confirm?email=${encodeURIComponent(email)}`;

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

---
Professional SEO & Backlink Management Platform
https://backlinkoo.com`,
      from: 'Backlink ∞ <support@backlinkoo.com>'
    };

    return await this.sendViaNetlifyFunction(emailData);
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailServiceResponse> {
    console.log('EmailService: Sending password reset email to:', email);

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

---
Professional SEO & Backlink Management Platform
https://backlinkoo.com`,
      from: 'Backlink ∞ <support@backlinkoo.com>'
    };

    return await this.sendViaNetlifyFunction(emailData);
  }

  static async sendWelcomeEmail(email: string, firstName?: string): Promise<EmailServiceResponse> {
    console.log('EmailService: Sending welcome email to:', email);

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

---
Professional SEO & Backlink Management Platform
https://backlinkoo.com`,
      from: 'Backlink ∞ <support@backlinkoo.com>'
    };

    return await this.sendViaNetlifyFunction(emailData);
  }

  // Legacy methods for EmailSystemManager compatibility
  static async healthCheck(): Promise<{ status: string; resend: boolean; netlify: boolean }> {
    try {
      // Test if we can make a request to our Netlify function
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@example.com',
          subject: 'Health Check',
          message: 'Test',
          test: true // Add a test flag to avoid actually sending
        }),
      });

      const isHealthy = response.status !== 500;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        resend: isHealthy,
        netlify: isHealthy
      };
    } catch (error) {
      return {
        status: 'error',
        resend: false,
        netlify: false
      };
    }
  }

  static getFailureLog(): Array<{ timestamp: Date; error: string; email: string }> {
    return this.failureLog;
  }

  static async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      const result = await this.sendViaNetlifyFunction(emailData);

      if (!result.success && result.error) {
        // Log failure
        this.failureLog.push({
          timestamp: new Date(),
          error: result.error,
          email: emailData.to
        });

        // Keep only last 50 failures
        if (this.failureLog.length > 50) {
          this.failureLog = this.failureLog.slice(-50);
        }
      }

      return result as EmailResult;
    } catch (error: any) {
      const failureResult: EmailResult = {
        success: false,
        error: error.message,
        provider: 'netlify_resend'
      };

      this.failureLog.push({
        timestamp: new Date(),
        error: error.message,
        email: emailData.to
      });

      return failureResult;
    }
  }
}
