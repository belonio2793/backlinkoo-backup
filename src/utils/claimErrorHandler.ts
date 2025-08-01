/**
 * Claim Error Handler - Centralized error handling for claim operations
 * Provides detailed error analysis and user-friendly messages
 */

export interface ClaimError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  action?: string;
}

export class ClaimErrorHandler {
  /**
   * Analyze and categorize claim-related errors
   */
  static analyzeError(error: any): ClaimError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const postgrestCode = error?.code;
    
    // Database connectivity errors
    if (errorMessage.includes('fetch') || 
        errorMessage.includes('network') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout')) {
      return {
        code: 'NETWORK_ERROR',
        message: errorMessage,
        userMessage: 'Connection failed. Please check your internet connection and try again.',
        severity: 'medium',
        retryable: true,
        action: 'retry'
      };
    }

    // Authentication errors
    if (errorMessage.includes('JWT') || 
        errorMessage.includes('auth') ||
        errorMessage.includes('token') ||
        postgrestCode === 'PGRST301') {
      return {
        code: 'AUTH_ERROR',
        message: errorMessage,
        userMessage: 'Authentication failed. Please sign in again.',
        severity: 'high',
        retryable: false,
        action: 'reauthenticate'
      };
    }

    // Row not found errors (post doesn't exist or was just claimed)
    if (postgrestCode === 'PGRST116' || errorMessage.includes('No rows found')) {
      return {
        code: 'POST_NOT_FOUND',
        message: errorMessage,
        userMessage: 'This post is no longer available or was just claimed by someone else.',
        severity: 'low',
        retryable: false,
        action: 'refresh'
      };
    }

    // Permission/RLS errors
    if (postgrestCode === 'PGRST103' || 
        errorMessage.includes('permission') ||
        errorMessage.includes('policy')) {
      return {
        code: 'PERMISSION_ERROR',
        message: errorMessage,
        userMessage: 'You don\'t have permission to claim this post.',
        severity: 'medium',
        retryable: false,
        action: 'check_permissions'
      };
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many') ||
        postgrestCode === '429') {
      return {
        code: 'RATE_LIMIT',
        message: errorMessage,
        userMessage: 'Too many requests. Please wait a moment and try again.',
        severity: 'medium',
        retryable: true,
        action: 'wait_and_retry'
      };
    }

    // Constraint violations (like unique constraints)
    if (postgrestCode === '23505' || errorMessage.includes('duplicate')) {
      return {
        code: 'DUPLICATE_ERROR',
        message: errorMessage,
        userMessage: 'This action has already been completed.',
        severity: 'low',
        retryable: false,
        action: 'refresh'
      };
    }

    // Database table/column not found
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return {
        code: 'SCHEMA_ERROR',
        message: errorMessage,
        userMessage: 'System configuration error. Please contact support.',
        severity: 'critical',
        retryable: false,
        action: 'contact_support'
      };
    }

    // Generic PostgreSQL errors
    if (postgrestCode && postgrestCode.startsWith('PG')) {
      return {
        code: 'DATABASE_ERROR',
        message: errorMessage,
        userMessage: 'Database error occurred. Please try again later.',
        severity: 'high',
        retryable: true,
        action: 'retry_later'
      };
    }

    // Unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'medium',
      retryable: true,
      action: 'retry'
    };
  }

  /**
   * Get suggested action based on error
   */
  static getSuggestedAction(error: ClaimError): string {
    switch (error.action) {
      case 'retry':
        return 'Try the operation again.';
      case 'reauthenticate':
        return 'Please sign out and sign in again.';
      case 'refresh':
        return 'Refresh the page to see the latest status.';
      case 'check_permissions':
        return 'Make sure you have permission to perform this action.';
      case 'wait_and_retry':
        return 'Wait a few minutes before trying again.';
      case 'retry_later':
        return 'The system may be experiencing issues. Try again in a few minutes.';
      case 'contact_support':
        return 'Please contact technical support for assistance.';
      default:
        return 'Try refreshing the page or contacting support if the problem persists.';
    }
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: ClaimError, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context, null, 2) : 'No context';
    
    return `
[CLAIM ERROR] ${timestamp}
Code: ${error.code}
Severity: ${error.severity}
Message: ${error.message}
User Message: ${error.userMessage}
Retryable: ${error.retryable}
Action: ${error.action}
Context: ${contextStr}
`;
  }

  /**
   * Create toast message configuration
   */
  static createToastConfig(error: ClaimError) {
    const baseConfig = {
      title: this.getErrorTitle(error),
      description: `${error.userMessage} ${this.getSuggestedAction(error)}`,
      variant: error.severity === 'critical' ? 'destructive' : 
               error.severity === 'high' ? 'destructive' : 'default'
    };

    return baseConfig;
  }

  /**
   * Get appropriate error title
   */
  private static getErrorTitle(error: ClaimError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'AUTH_ERROR':
        return 'Authentication Required';
      case 'POST_NOT_FOUND':
        return 'Post Unavailable';
      case 'PERMISSION_ERROR':
        return 'Permission Denied';
      case 'RATE_LIMIT':
        return 'Too Many Requests';
      case 'DUPLICATE_ERROR':
        return 'Already Completed';
      case 'SCHEMA_ERROR':
        return 'System Error';
      case 'DATABASE_ERROR':
        return 'Database Error';
      default:
        return 'Claim Failed';
    }
  }

  /**
   * Check if error suggests system-wide issue
   */
  static isSystemWideIssue(error: ClaimError): boolean {
    return ['SCHEMA_ERROR', 'DATABASE_ERROR'].includes(error.code) ||
           error.severity === 'critical';
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: ClaimError): number {
    switch (error.code) {
      case 'RATE_LIMIT':
        return 60000; // 1 minute
      case 'NETWORK_ERROR':
        return 5000; // 5 seconds
      case 'DATABASE_ERROR':
        return 10000; // 10 seconds
      default:
        return 3000; // 3 seconds
    }
  }
}

// Development helper for error testing
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).claimErrorHandler = ClaimErrorHandler;
}
