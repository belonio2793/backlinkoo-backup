import { supabase } from '../integrations/supabase/client';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  EMAIL = 'email',
  PAYMENT = 'payment',
  SEO_ANALYSIS = 'seo_analysis',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  GENERAL = 'general'
}

export interface ErrorLogEntry {
  id?: string;
  timestamp: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  details?: Record<string, any>;
  stack_trace?: string;
  user_id?: string;
  component?: string;
  action?: string;
  resolved?: boolean;
  created_at?: string;
}

export interface ErrorDisplayData {
  title: string;
  message: string;
  action?: string;
  canRetry?: boolean;
  severity: ErrorSeverity;
}

class ErrorLoggingService {
  private errorQueue: ErrorLogEntry[] = [];
  private isProcessingQueue = false;
  private maxRetries = 3;
  private retryDelay = 1000;

  async logError(
    severity: ErrorSeverity,
    category: ErrorCategory,
    message: string,
    details?: {
      error?: Error;
      context?: Record<string, any>;
      component?: string;
      action?: string;
      userId?: string;
    }
  ): Promise<void> {
    const errorEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      category,
      message,
      details: details?.context,
      stack_trace: details?.error?.stack,
      user_id: details?.userId,
      component: details?.component,
      action: details?.action,
      resolved: false
    };

    // Always log to console for development
    this.logToConsole(errorEntry);

    // Add to queue for database logging
    this.errorQueue.push(errorEntry);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processErrorQueue();
    }
  }

  private logToConsole(entry: ErrorLogEntry): void {
    const logMethod = this.getConsoleMethod(entry.severity);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    logMethod(
      `[${timestamp}] ${entry.severity.toUpperCase()} - ${entry.category}:`,
      entry.message,
      entry.details ? '\nDetails:' : '',
      entry.details || '',
      entry.stack_trace ? '\nStack:' : '',
      entry.stack_trace || ''
    );
  }

  private getConsoleMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.LOW:
      default:
        return console.log;
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.errorQueue.length > 0) {
      const entry = this.errorQueue.shift()!;
      await this.saveErrorToDatabase(entry);
    }

    this.isProcessingQueue = false;
  }

  private async saveErrorToDatabase(entry: ErrorLogEntry, retryCount = 0): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .insert([entry]);

      if (error) {
        console.warn('Database error logging failed:', error.message);

        // Check if error is due to table not existing or database unavailable
        const isTableError = error.message?.includes('relation "error_logs" does not exist') ||
                            error.message?.includes('table "error_logs" does not exist') ||
                            error.message?.includes('Database not available');

        const isMockMode = error.message?.includes('Mock mode') ||
                          error.message?.includes('Please configure real Supabase credentials');

        if (isTableError && retryCount === 0) {
          console.warn('error_logs table does not exist. Attempting to create...');
          await this.createErrorLogsTable();

          // Retry the insert after table creation attempt
          return this.saveErrorToDatabase(entry, retryCount + 1);
        }

        if (isMockMode) {
          console.warn('Supabase in mock mode, saving error to localStorage only');
          this.saveErrorToLocalStorage(entry);
          return;
        }

        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'UnknownError';

      console.error('Failed to save error to database:', {
        message: errorMessage,
        name: errorName,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Always save to localStorage as fallback
      this.saveErrorToLocalStorage(entry);

      // Retry logic for temporary failures (but not for missing table/mock mode)
      const isRetryableError = !errorMessage.includes('does not exist') &&
                              !errorMessage.includes('Mock mode') &&
                              !errorMessage.includes('Database not available');

      if (isRetryableError && retryCount < this.maxRetries) {
        setTimeout(() => {
          this.saveErrorToDatabase(entry, retryCount + 1);
        }, this.retryDelay * Math.pow(2, retryCount));
      }
    }
  }

  private async createErrorLogsTable(): Promise<void> {
    try {
      // Try to call the setup function
      const response = await fetch('/supabase/functions/v1/setup-error-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create error_logs table via function');
      }

      console.log('error_logs table created successfully');
    } catch (error) {
      console.error('Failed to create error_logs table automatically:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        code: error.code
      });
      console.warn('Please create the error_logs table manually in Supabase dashboard');

      // Log instructions to console
      console.log(`
To create the error_logs table manually, run this SQL in your Supabase dashboard:

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT NOT NULL CHECK (category IN (
        'authentication', 'email', 'payment', 'seo_analysis',
        'database', 'network', 'validation', 'general'
    )),
    message TEXT NOT NULL,
    details JSONB,
    stack_trace TEXT,
    user_id TEXT,
    component TEXT,
    action TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can access all error logs" ON error_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id::text = auth.uid()::text
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Users can see their own error logs" ON error_logs
    FOR SELECT USING (user_id = auth.uid()::text);

GRANT ALL ON error_logs TO authenticated;
GRANT ALL ON error_logs TO service_role;
      `);
    }
  }

  private saveErrorToLocalStorage(entry: ErrorLogEntry): void {
    try {
      const existingErrors = this.getErrorsFromLocalStorage();
      existingErrors.push(entry);
      
      // Keep only last 100 errors in localStorage
      const trimmedErrors = existingErrors.slice(-100);
      
      localStorage.setItem('error_logs_fallback', JSON.stringify(trimmedErrors));
    } catch (error) {
      console.error('Failed to save error to localStorage:', error);
    }
  }

  private getErrorsFromLocalStorage(): ErrorLogEntry[] {
    try {
      const stored = localStorage.getItem('error_logs_fallback');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async getRecentErrors(limit = 50): Promise<ErrorLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Database error retrieval failed:', error.message);

        // Check if it's a known database unavailability issue
        const isDatabaseUnavailable = error.message?.includes('does not exist') ||
                                     error.message?.includes('Mock mode') ||
                                     error.message?.includes('Database not available');

        if (isDatabaseUnavailable) {
          console.log('Using localStorage fallback for error retrieval');
          return this.getErrorsFromLocalStorage();
        }

        throw error;
      }

      // If we have database data, merge with localStorage for completeness
      const dbErrors = data || [];
      const localErrors = this.getErrorsFromLocalStorage();

      // Combine and deduplicate by timestamp + message
      const allErrors = [...dbErrors, ...localErrors];
      const uniqueErrors = allErrors.filter((error, index, self) =>
        index === self.findIndex(e =>
          e.timestamp === error.timestamp && e.message === error.message
        )
      );

      // Sort by timestamp (newest first) and limit
      return uniqueErrors
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to fetch errors from database:', error);
      return this.getErrorsFromLocalStorage();
    }
  }

  async markErrorAsResolved(errorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({ resolved: true })
        .eq('id', errorId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to mark error as resolved:', error);
    }
  }

  // Helper methods for common error scenarios
  async logAuthenticationError(message: string, userId?: string, component?: string): Promise<void> {
    await this.logError(ErrorSeverity.HIGH, ErrorCategory.AUTHENTICATION, message, {
      userId,
      component,
      action: 'authentication'
    });
  }

  async logEmailError(message: string, details?: Record<string, any>, component?: string): Promise<void> {
    await this.logError(ErrorSeverity.HIGH, ErrorCategory.EMAIL, message, {
      context: details,
      component,
      action: 'email_delivery'
    });
  }

  async logPaymentError(message: string, details?: Record<string, any>, userId?: string): Promise<void> {
    await this.logError(ErrorSeverity.CRITICAL, ErrorCategory.PAYMENT, message, {
      context: details,
      userId,
      action: 'payment_processing'
    });
  }

  async logValidationError(message: string, details?: Record<string, any>, component?: string): Promise<void> {
    await this.logError(ErrorSeverity.LOW, ErrorCategory.VALIDATION, message, {
      context: details,
      component,
      action: 'validation'
    });
  }

  async logNetworkError(message: string, details?: Record<string, any>, component?: string): Promise<void> {
    await this.logError(ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, message, {
      context: details,
      component,
      action: 'network_request'
    });
  }

  // Convert errors to user-friendly display format
  getErrorDisplayData(error: Error | string, category: ErrorCategory): ErrorDisplayData {
    const message = typeof error === 'string' ? error : error.message;
    
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return {
          title: 'Authentication Error',
          message: 'Unable to verify your credentials. Please try logging in again.',
          action: 'login',
          canRetry: true,
          severity: ErrorSeverity.HIGH
        };
      
      case ErrorCategory.EMAIL:
        return {
          title: 'Email Delivery Issue',
          message: 'We encountered an issue sending your email. Please try again or contact support.',
          action: 'retry',
          canRetry: true,
          severity: ErrorSeverity.HIGH
        };
      
      case ErrorCategory.PAYMENT:
        return {
          title: 'Payment Processing Error',
          message: 'Your payment could not be processed. Please check your payment details and try again.',
          action: 'payment',
          canRetry: true,
          severity: ErrorSeverity.CRITICAL
        };
      
      case ErrorCategory.NETWORK:
        return {
          title: 'Connection Error',
          message: 'Unable to connect to our servers. Please check your internet connection and try again.',
          action: 'retry',
          canRetry: true,
          severity: ErrorSeverity.MEDIUM
        };
      
      case ErrorCategory.VALIDATION:
        return {
          title: 'Validation Error',
          message: message || 'Please check your input and try again.',
          canRetry: true,
          severity: ErrorSeverity.LOW
        };
      
      default:
        return {
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
          action: 'retry',
          canRetry: true,
          severity: ErrorSeverity.MEDIUM
        };
    }
  }
}

export const errorLogger = new ErrorLoggingService();
