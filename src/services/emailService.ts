import { errorLogger, ErrorSeverity, ErrorCategory } from './errorLoggingService';

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
  private static failureLog: Array<{ timestamp: Date; error: string; email: string; attempt: number }> = [];
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second base delay

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return this.RETRY_DELAY * Math.pow(2, attempt - 1);
  }

  private static async sendViaNetlifyFunction(emailData: any, attempt: number = 1): Promise<EmailServiceResponse> {
    try {
      console.log(`Sending email via Netlify function (attempt ${attempt}):`, {
        to: emailData.to,
        subject: emailData.subject
      });

      // Log email attempt
      await errorLogger.logError(
        ErrorSeverity.LOW,
        ErrorCategory.EMAIL,
        `Email sending attempt ${attempt}`,
        {
          context: {
            to: emailData.to,
            subject: emailData.subject,
            attempt,
            provider: 'netlify_resend'
          },
          component: 'EmailService',
          action: 'send_email'
        }
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          attempt,
          retryable: attempt < this.MAX_RETRIES
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Enhanced error handling for different HTTP status codes
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (readError) {
          console.warn('Failed to read response text:', readError);
          errorText = 'Unable to read error response';
        }

        console.error('Netlify function error response:', response.status, errorText);

        const errorMessage = this.getErrorMessage(response.status, errorText);

        // Determine if error is retryable
        const isRetryable = this.isRetryableError(response.status);

        if (isRetryable && attempt < this.MAX_RETRIES) {
          console.log(`Retryable error, attempt ${attempt}/${this.MAX_RETRIES}, retrying...`);
          await this.delay(this.getRetryDelay(attempt));
          return this.sendViaNetlifyFunction(emailData, attempt + 1);
        }

        // Log the error
        await errorLogger.logEmailError(
          `Email delivery failed: ${errorMessage}`,
          {
            httpStatus: response.status,
            to: emailData.to,
            subject: emailData.subject,
            attempt,
            retryable: isRetryable,
            errorText: errorText
          },
          'EmailService'
        );

        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);

        if (attempt < this.MAX_RETRIES) {
          console.log(`JSON parse error, retrying attempt ${attempt + 1}...`);
          await this.delay(this.getRetryDelay(attempt));
          return this.sendViaNetlifyFunction(emailData, attempt + 1);
        }

        await errorLogger.logEmailError(
          'Invalid JSON response from email service',
          {
            to: emailData.to,
            subject: emailData.subject,
            attempt,
            jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError)
          },
          'EmailService'
        );

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
        const errorMessage = result.error || 'Email service returned failure';

        // Check if we should retry based on the error
        if (this.isRetryableServiceError(result.error) && attempt < this.MAX_RETRIES) {
          console.log(`Service error is retryable, attempt ${attempt}/${this.MAX_RETRIES}, retrying...`);
          await this.delay(this.getRetryDelay(attempt));
          return this.sendViaNetlifyFunction(emailData, attempt + 1);
        }

        await errorLogger.logEmailError(
          `Email service returned failure: ${errorMessage}`,
          {
            to: emailData.to,
            subject: emailData.subject,
            attempt,
            serviceError: result.error,
            retryable: this.isRetryableServiceError(result.error)
          },
          'EmailService'
        );

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';
      const errorName = error?.name || 'UnknownError';

      console.error('sendViaNetlifyFunction error:', {
        message: errorMessage,
        name: errorName,
        stack: error?.stack
      });

      // Log the failure with attempt number
      this.logFailure(emailData.to, errorMessage, attempt);

      // Log to centralized error logging
      await errorLogger.logEmailError(
        `Email sending failed: ${errorMessage}`,
        {
          to: emailData.to,
          subject: emailData.subject,
          attempt,
          errorType: errorName,
          isTimeout: errorName === 'AbortError',
          fullError: {
            message: errorMessage,
            name: errorName,
            stack: error?.stack
          }
        },
        'EmailService'
      );

      // Handle specific error types
      if (error.name === 'AbortError') {
        if (attempt < this.MAX_RETRIES) {
          console.log(`Request timeout, retrying attempt ${attempt + 1}...`);
          await this.delay(this.getRetryDelay(attempt));
          return this.sendViaNetlifyFunction(emailData, attempt + 1);
        }
        return {
          success: false,
          error: 'Email service timeout after multiple attempts',
          provider: 'netlify_resend'
        };
      }

      return {
        success: false,
        error: this.sanitizeErrorMessage(errorMessage) || 'Unknown error occurred',
        provider: 'netlify_resend'
      };
    }
  }

  private static getErrorMessage(status: number, errorText: string): string {
    switch (status) {
      case 400:
        return 'Invalid email data provided';
      case 401:
        return 'Email service authentication failed';
      case 403:
        return 'Email service access forbidden';
      case 429:
        return 'Email rate limit exceeded, please try again later';
      case 500:
        return 'Email service internal error';
      case 502:
      case 503:
      case 504:
        return 'Email service temporarily unavailable';
      default:
        return `Email service error (${status}): ${errorText}`;
    }
  }

  private static isRetryableError(status: number): boolean {
    // Retry on server errors, rate limits, and timeouts
    return status >= 500 || status === 429 || status === 408;
  }

  private static isRetryableServiceError(error: string): boolean {
    if (!error) return false;

    const retryableErrors = [
      'timeout',
      'rate limit',
      'temporarily unavailable',
      'service unavailable',
      'internal error',
      'connection error',
      'network error'
    ];

    return retryableErrors.some(retryableError =>
      error.toLowerCase().includes(retryableError)
    );
  }

  private static sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    return message
      .replace(/api[_-]?key[s]?[:\s=]*[a-zA-Z0-9_-]+/gi, 'API_KEY_REDACTED')
      .replace(/token[s]?[:\s=]*[a-zA-Z0-9_-]+/gi, 'TOKEN_REDACTED')
      .replace(/password[s]?[:\s=]*[^\s]+/gi, 'PASSWORD_REDACTED');
  }

  private static logFailure(email: string, error: string, attempt: number): void {
    this.failureLog.push({
      timestamp: new Date(),
      error: this.sanitizeErrorMessage(error),
      email,
      attempt
    });

    // Keep only last 100 failures
    if (this.failureLog.length > 100) {
      this.failureLog = this.failureLog.slice(-100);
    }
  }

  private static getOriginUrl(): string {
    // Get the current origin, with fallback to production URL
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    // Fallback for server-side or when window is not available
    return 'https://backlinkoo.com';
  }

  static async sendConfirmationEmail(email: string, confirmationUrl?: string): Promise<EmailServiceResponse> {
    console.log('EmailService: Sending confirmation email to:', email);

    // Log confirmation email request
    await errorLogger.logError(
      ErrorSeverity.LOW,
      ErrorCategory.EMAIL,
      'Confirmation email requested',
      {
        context: { to: email, type: 'confirmation' },
        component: 'EmailService',
        action: 'send_confirmation_email'
      }
    );

    const origin = this.getOriginUrl();
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

    try {
      const result = await this.sendViaNetlifyFunction(emailData);

      if (result.success) {
        console.log('Confirmation email sent successfully to:', email);
      } else {
        console.error('Failed to send confirmation email:', result.error);
      }

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';

      console.error('Error sending confirmation email:', {
        message: errorMessage,
        name: error?.name,
        stack: error?.stack
      });

      await errorLogger.logEmailError(
        `Failed to send confirmation email: ${errorMessage}`,
        {
          to: email,
          emailType: 'confirmation',
          confirmationUrl,
          fullError: {
            message: errorMessage,
            name: error?.name,
            stack: error?.stack
          }
        },
        'EmailService'
      );

      return {
        success: false,
        error: `Failed to send confirmation email: ${errorMessage}`,
        provider: 'netlify_resend'
      };
    }
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailServiceResponse> {
    console.log('EmailService: Sending password reset email to:', email);

    // Log password reset email request
    await errorLogger.logError(
      ErrorSeverity.LOW,
      ErrorCategory.EMAIL,
      'Password reset email requested',
      {
        context: { to: email, type: 'password_reset' },
        component: 'EmailService',
        action: 'send_password_reset_email'
      }
    );

    try {
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
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';

      await errorLogger.logEmailError(
        `Failed to send password reset email: ${errorMessage}`,
        {
          to: email,
          emailType: 'password_reset',
          resetUrl,
          fullError: {
            message: errorMessage,
            name: error?.name,
            stack: error?.stack
          }
        },
        'EmailService'
      );
      throw new Error(errorMessage);
    }
  }

  static async sendWelcomeEmail(email: string, firstName?: string): Promise<EmailServiceResponse> {
    console.log('EmailService: Sending welcome email to:', email);

    // Log welcome email request
    await errorLogger.logError(
      ErrorSeverity.LOW,
      ErrorCategory.EMAIL,
      'Welcome email requested',
      {
        context: { to: email, type: 'welcome', firstName },
        component: 'EmailService',
        action: 'send_welcome_email'
      }
    );

    try {
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
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Unknown error';

      await errorLogger.logEmailError(
        `Failed to send welcome email: ${errorMessage}`,
        {
          to: email,
          emailType: 'welcome',
          firstName,
          fullError: {
            message: errorMessage,
            name: error?.name,
            stack: error?.stack
          }
        },
        'EmailService'
      );
      throw new Error(errorMessage);
    }
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

  static getFailureLog(): Array<{ timestamp: Date; error: string; email: string; attempt: number }> {
    return this.failureLog.slice(); // Return a copy to prevent external modification
  }

  static getFailureStats(): {
    totalFailures: number;
    recentFailures: number;
    uniqueEmails: number;
    commonErrors: Array<{ error: string; count: number }>
  } {
    const now = new Date();
    const recentThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const recentFailures = this.failureLog.filter(log => log.timestamp > recentThreshold);
    const uniqueEmails = new Set(this.failureLog.map(log => log.email)).size;

    // Count error types
    const errorCounts: { [key: string]: number } = {};
    this.failureLog.forEach(log => {
      const errorType = log.error.split(':')[0]; // Get the main error type
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 errors

    return {
      totalFailures: this.failureLog.length,
      recentFailures: recentFailures.length,
      uniqueEmails,
      commonErrors
    };
  }

  static clearFailureLog(): void {
    this.failureLog = [];
  }

  static async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      // Validate email data before sending
      if (!emailData.to || !emailData.subject || !emailData.message) {
        throw new Error('Missing required email fields (to, subject, message)');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.to)) {
        throw new Error('Invalid email address format');
      }

      const result = await this.sendViaNetlifyFunction(emailData);

      // Enhanced logging for debugging
      if (result.success) {
        console.log(`Email sent successfully to ${emailData.to} via ${result.provider}`);
      } else {
        console.error(`Email failed to send to ${emailData.to}:`, result.error);
      }

      return result as EmailResult;
    } catch (error: any) {
      const sanitizedError = this.sanitizeErrorMessage(error.message);
      console.error('SendEmail error:', sanitizedError);

      const failureResult: EmailResult = {
        success: false,
        error: sanitizedError,
        provider: 'netlify_resend'
      };

      // Failure logging is handled within sendViaNetlifyFunction
      return failureResult;
    }
  }
}
