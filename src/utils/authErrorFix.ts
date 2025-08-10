/**
 * Authentication Error Fix Utility
 * Ensures authentication errors are properly formatted to prevent "[object Object]" displays
 */

import { formatErrorForUI } from './errorUtils';

/**
 * Safely formats authentication errors for display
 */
export function formatAuthError(error: any): string {
  if (!error) {
    return 'Authentication failed. Please try again.';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || 'Authentication error occurred.';
  }

  // Handle Supabase auth error objects
  if (error && typeof error === 'object') {
    // Check for Supabase auth error structure
    if (error.message) {
      return String(error.message);
    }
    
    // Check for nested error structure
    if (error.error && error.error.message) {
      return String(error.error.message);
    }

    // Check for auth-specific error properties
    if (error.statusText) {
      return `Authentication failed: ${error.statusText}`;
    }

    if (error.status) {
      return `Authentication failed with status ${error.status}`;
    }

    // Check for common auth error patterns
    if (error.invalid_credentials) {
      return 'Invalid email or password. Please check your credentials.';
    }

    if (error.email_not_confirmed) {
      return 'Please verify your email address before signing in.';
    }

    if (error.too_many_requests) {
      return 'Too many sign-in attempts. Please wait a few minutes before trying again.';
    }
  }

  // Fall back to the general error formatter
  const formatted = formatErrorForUI(error);
  
  // If we still get "[object Object]", provide a generic auth error message
  if (formatted === '[object Object]' || formatted.includes('[object Object]')) {
    return 'Authentication failed. Please check your credentials and try again.';
  }

  return formatted;
}

/**
 * Enhanced authentication error logger that prevents object dumps
 */
export function logAuthError(context: string, error: any): void {
  const safeMessage = formatAuthError(error);
  
  console.error(`🚨 Authentication Error [${context}]:`, safeMessage);
  
  // Log additional debug info only in development
  if (process.env.NODE_ENV === 'development') {
    console.debug('🔍 Auth Error Details:', {
      context,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      hasMessage: !!error?.message,
      hasErrorProperty: !!(error?.error),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Wrap toast error messages to ensure auth errors are properly formatted
 */
export function safeAuthToast(toast: any, title: string, error: any): void {
  const description = formatAuthError(error);
  
  toast({
    title,
    description,
    variant: 'destructive'
  });
}

/**
 * Global auth error interceptor for uncaught authentication errors
 */
export function setupAuthErrorInterceptor(): void {
  if (typeof window !== 'undefined') {
    // Add to existing error handlers
    window.addEventListener('error', (event) => {
      if (event.message?.includes('Authentication') && event.message?.includes('[object Object]')) {
        console.warn('🔧 Intercepted malformed auth error:', event.message);
        logAuthError('Global Error Handler', {
          originalMessage: event.message,
          filename: event.filename,
          lineno: event.lineno
        });
      }
    });

    // Add to existing promise rejection handlers
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      if (reason && typeof reason === 'object' && 
          (reason.message?.includes('auth') || reason.statusText?.includes('auth'))) {
        console.warn('🔧 Intercepted unhandled auth promise rejection:', reason);
        logAuthError('Unhandled Promise Rejection', reason);
      }
    });

    console.log('🛡️ Authentication error interceptor loaded');
  }
}

/**
 * Common authentication error patterns and their user-friendly messages
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please check your credentials and try again.',
  EMAIL_NOT_CONFIRMED: 'Please verify your email address before signing in.',
  USER_NOT_FOUND: 'No account found with this email address.',
  TOO_MANY_REQUESTS: 'Too many sign-in attempts. Please wait a few minutes before trying again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Access denied. Please check your credentials.',
  DATABASE_ERROR: 'Database connection issue. Please try again in a moment.',
  GENERIC: 'Authentication failed. Please try again.'
} as const;

/**
 * Map common error codes/messages to user-friendly messages
 */
export function mapAuthErrorMessage(error: any): string {
  if (!error) return AUTH_ERROR_MESSAGES.GENERIC;

  const message = String(error.message || error).toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
  }

  if (message.includes('email not confirmed') || message.includes('email not verified')) {
    return AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED;
  }

  if (message.includes('user not found')) {
    return AUTH_ERROR_MESSAGES.USER_NOT_FOUND;
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return AUTH_ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (message.includes('timeout')) {
    return AUTH_ERROR_MESSAGES.TIMEOUT;
  }

  if (message.includes('unauthorized') || message.includes('access denied')) {
    return AUTH_ERROR_MESSAGES.UNAUTHORIZED;
  }

  if (message.includes('database') || message.includes('db')) {
    return AUTH_ERROR_MESSAGES.DATABASE_ERROR;
  }

  return formatAuthError(error);
}
