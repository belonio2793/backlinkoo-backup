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
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        return {
          success: true,
          emailId: result.emailId,
          provider: 'netlify_resend'
        };
      } else {
        throw new Error(result.error || 'Failed to send email via Netlify function');
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
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
}
