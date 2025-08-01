/**
 * Direct Email Service - Fallback when Netlify functions are unavailable
 * Uses direct API calls to email providers
 */

export interface DirectEmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
  provider: 'direct-resend' | 'direct-sendgrid' | 'mock';
}

export interface DirectEmailData {
  to: string;
  subject: string;
  message: string;
  from?: string;
}

export class DirectEmailService {
  private static readonly FROM_EMAIL = 'Backlink ∞ <support@backlinkoo.com>';
  private static failureLog: Array<{ timestamp: Date; error: string; email: string }> = [];

  /**
   * Send email using direct Resend API (no Netlify functions)
   */
  static async sendDirectResend(emailData: DirectEmailData): Promise<DirectEmailResponse> {
    try {
      // Get Resend API key from localStorage or environment
      const resendKey = this.getResendAPIKey();
      
      if (!resendKey) {
        throw new Error('Resend API key not configured. Please add RESEND_API_KEY in admin dashboard.');
      }

      console.log('Sending email via direct Resend API:', { to: emailData.to, subject: emailData.subject });

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailData.from || this.FROM_EMAIL,
          to: [emailData.to],
          subject: emailData.subject,
          html: this.formatEmailHTML(emailData.subject, emailData.message)
        }),
      });

      // Read response body once and handle both success and error cases
      const responseData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));

      if (!response.ok) {
        throw new Error(`Resend API error: ${responseData.error || response.statusText}`);
      }
      
      return {
        success: true,
        emailId: responseData.id,
        provider: 'direct-resend'
      };

    } catch (error) {
      console.error('Direct Resend email failed:', error);
      this.logFailure(emailData.to, error instanceof Error ? error.message : 'Unknown error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct Resend email failed',
        provider: 'direct-resend'
      };
    }
  }

  /**
   * Mock email service for testing when no real service is available
   */
  static async sendMockEmail(emailData: DirectEmailData): Promise<DirectEmailResponse> {
    try {
      console.log('📧 MOCK EMAIL SERVICE - Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate occasional failures for testing
      if (Math.random() < 0.1) { // 10% failure rate
        throw new Error('Mock service simulated failure');
      }

      const mockEmailId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        emailId: mockEmailId,
        provider: 'mock'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock email service failed',
        provider: 'mock'
      };
    }
  }

  /**
   * Auto-select best available email method
   */
  static async sendEmail(emailData: DirectEmailData): Promise<DirectEmailResponse> {
    // Try direct Resend first
    const resendKey = this.getResendAPIKey();
    if (resendKey) {
      const result = await this.sendDirectResend(emailData);
      if (result.success) {
        return result;
      }
      console.warn('Direct Resend failed, falling back to mock service');
    }

    // Fallback to mock service
    console.log('No email service available, using mock service');
    return await this.sendMockEmail(emailData);
  }

  /**
   * Get Resend API key from various sources
   */
  private static getResendAPIKey(): string | null {
    // Check admin configuration
    try {
      const adminConfigs = JSON.parse(localStorage.getItem('admin_env_vars') || '[]');
      const resendConfig = adminConfigs.find((config: any) => 
        config.key === 'RESEND_API_KEY' && config.value && config.value.startsWith('re_')
      );
      if (resendConfig) {
        return resendConfig.value;
      }

      // Check admin API configs
      const apiConfigs = JSON.parse(localStorage.getItem('admin_api_configs') || '{}');
      if (apiConfigs['RESEND_API_KEY'] && apiConfigs['RESEND_API_KEY'].startsWith('re_')) {
        return apiConfigs['RESEND_API_KEY'];
      }
    } catch (error) {
      console.warn('Failed to get Resend API key from localStorage:', error);
    }

    return null;
  }

  /**
   * Format email HTML
   */
  private static formatEmailHTML(subject: string, message: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Backlink ∞</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <div style="white-space: pre-wrap; line-height: 1.6; color: #555;">
            ${message}
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            Sent via Backlink ∞ Direct Email Service<br>
            ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Log email failures for debugging
   */
  private static logFailure(email: string, error: string): void {
    this.failureLog.push({
      timestamp: new Date(),
      error,
      email
    });

    // Keep only last 50 failures
    if (this.failureLog.length > 50) {
      this.failureLog = this.failureLog.slice(-50);
    }
  }

  /**
   * Get failure log for debugging
   */
  static getFailureLog(): Array<{ timestamp: Date; error: string; email: string }> {
    return [...this.failureLog];
  }

  /**
   * Test email service availability
   */
  static async testEmailService(): Promise<{
    resendAvailable: boolean;
    resendError?: string;
    mockAvailable: boolean;
    recommendation: string;
  }> {
    const resendKey = this.getResendAPIKey();
    let resendAvailable = false;
    let resendError = undefined;

    if (resendKey) {
      try {
        // Test with a simple API call
        const response = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          }
        });
        resendAvailable = response.ok;
        if (!response.ok) {
          resendError = `HTTP ${response.status}`;
        }
      } catch (error) {
        resendError = error instanceof Error ? error.message : 'Connection failed';
      }
    } else {
      resendError = 'API key not configured';
    }

    const mockAvailable = true; // Mock is always available

    let recommendation = '';
    if (resendAvailable) {
      recommendation = 'Direct Resend API is available and working';
    } else if (resendKey) {
      recommendation = `Direct Resend API configured but not working: ${resendError}. Using mock service.`;
    } else {
      recommendation = 'Configure RESEND_API_KEY in admin dashboard to enable real email sending. Currently using mock service.';
    }

    return {
      resendAvailable,
      resendError,
      mockAvailable,
      recommendation
    };
  }
}

// Export singleton instance
export const directEmailService = DirectEmailService;
