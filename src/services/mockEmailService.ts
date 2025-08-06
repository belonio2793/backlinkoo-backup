/**
 * Mock Email Service - Avoids CORS issues by not making external API calls
 */

export interface MockEmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
  provider: 'mock';
}

export interface MockEmailData {
  to: string;
  subject: string;
  message: string;
  from?: string;
}

export class MockEmailService {
  private static readonly FROM_EMAIL = 'Backlink ∞ <support@backlinkoo.com>';
  private static emailLog: Array<{ timestamp: Date; to: string; subject: string }> = [];

  /**
   * Send mock email (no actual network requests)
   */
  static async sendEmail(emailData: MockEmailData): Promise<MockEmailResponse> {
    console.log('📧 Mock Email Service - Sending email:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from || this.FROM_EMAIL,
      timestamp: new Date().toISOString()
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Log email for debugging
    this.emailLog.push({
      timestamp: new Date(),
      to: emailData.to,
      subject: emailData.subject
    });

    // Generate mock email ID
    const mockEmailId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Mock email "sent" successfully:', {
      emailId: mockEmailId,
      to: emailData.to,
      subject: emailData.subject
    });

    return {
      success: true,
      emailId: mockEmailId,
      provider: 'mock'
    };
  }

  /**
   * Send confirmation email
   */
  static async sendConfirmationEmail(email: string, confirmationUrl?: string): Promise<MockEmailResponse> {
    const defaultConfirmationUrl = confirmationUrl || `https://backlinkoo.com/auth/confirm?email=${encodeURIComponent(email)}`;

    return await this.sendEmail({
      to: email,
      subject: 'Confirm Your Email - Backlink ∞',
      message: `Welcome to Backlink ∞!

Please confirm your email address by clicking the link below:

${defaultConfirmationUrl}

If you didn't create this account, please ignore this email.

Best regards,
The Backlink ∞ Team`,
      from: this.FROM_EMAIL
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<MockEmailResponse> {
    return await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Backlink ∞',
      message: `You requested a password reset for your Backlink ∞ account.

Click the link below to reset your password:

${resetUrl}

If you didn't request this reset, please ignore this email.

Best regards,
The Backlink ∞ Team`,
      from: this.FROM_EMAIL
    });
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email: string, firstName?: string): Promise<MockEmailResponse> {
    const greeting = firstName ? `Hi ${firstName}` : 'Welcome';

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Backlink ∞',
      message: `${greeting}!

Thank you for joining Backlink ∞ - your professional SEO and backlink management platform.

🚀 GET STARTED
• Complete your profile setup
• Explore our backlink tools
• Start your first campaign

📊 TRACK YOUR SUCCESS
• Monitor your rankings
• Analyze competitor strategies
• Track backlink performance

��� EXPLORE OUR TOOLS
• Keyword research tools
• Ranking tracker
• Competitor analysis
• Backlink verification reports

Ready to start? Visit your dashboard:
https://backlinkoo.com/dashboard

Best regards,
The Backlink ∞ Team`,
      from: this.FROM_EMAIL
    });
  }

  /**
   * Get email log for debugging
   */
  static getEmailLog(): Array<{ timestamp: Date; to: string; subject: string }> {
    return [...this.emailLog];
  }

  /**
   * Clear email log
   */
  static clearEmailLog(): void {
    this.emailLog = [];
  }

  /**
   * Health check (always returns healthy for mock service)
   */
  static async healthCheck(): Promise<{ status: string; mock: boolean }> {
    return {
      status: 'healthy',
      mock: true
    };
  }
}
