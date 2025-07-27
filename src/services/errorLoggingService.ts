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
        throw error;
      }
    } catch (error) {
      console.error('Failed to save error to database:', error);
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        setTimeout(() => {
          this.saveErrorToDatabase(entry, retryCount + 1);
        }, this.retryDelay * Math.pow(2, retryCount));
      } else {
        // Store in local storage as fallback
        this.saveErrorToLocalStorage(entry);
      }
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
        throw error;
      }

      return data || [];
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
