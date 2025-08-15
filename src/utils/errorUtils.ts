/**
 * Error Utilities
 * 
 * Utility functions for handling and formatting error messages consistently
 */

/**
 * Extracts a readable error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (!error) {
    return 'Unknown error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // Try to get the message property
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  // Try to get error details if it's a Supabase error
  if (error.details && typeof error.details === 'string') {
    return error.details;
  }

  // Try to get error property (common in API responses)
  if (error.error && typeof error.error === 'string') {
    return error.error;
  }

  // Try to get data.error (nested error structures)
  if (error.data && error.data.error && typeof error.data.error === 'string') {
    return error.data.error;
  }

  // Try toString method (but avoid calling it on plain objects to prevent circular refs)
  if (typeof error.toString === 'function' && error.constructor !== Object) {
    try {
      const stringified = error.toString();
      if (stringified !== '[object Object]') {
        return stringified;
      }
    } catch {
      // toString might fail or cause circular reference, skip it
    }
  }

  // Try to extract useful information from object properties
  if (typeof error === 'object' && error !== null) {
    const keys = Object.keys(error);
    if (keys.length > 0) {
      // Look for common error properties
      const errorKeys = ['message', 'error', 'details', 'description', 'reason'];
      for (const key of errorKeys) {
        if (error[key] && typeof error[key] === 'string') {
          return error[key];
        }
      }

      // If no standard error property, try to build a meaningful message
      const meaningfulKeys = keys.filter(key =>
        !['stack', 'constructor', '__proto__', 'name'].includes(key)
      ).slice(0, 3);

      if (meaningfulKeys.length > 0) {
        const parts = meaningfulKeys.map(key => {
          const value = error[key];
          if (typeof value === 'object') return `${key}: [object]`;
          return `${key}: ${value}`;
        });
        return `Error: ${parts.join(', ')}`;
      }
    }

    // Try to stringify if it's an object with useful properties
    try {
      const errorObj = JSON.stringify(error, null, 2);
      if (errorObj !== '{}' && errorObj !== 'null') {
        return `Error details: ${errorObj}`;
      }
    } catch {
      // JSON.stringify failed, continue to fallback
    }
  }

  // Final fallback
  return 'Unknown error occurred';
}

/**
 * Logs an error with consistent formatting
 */
export function logError(context: string, error: any): void {
  console.error(`[${context}] Error:`, {
    message: getErrorMessage(error),
    originalError: error,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  });
}

/**
 * Creates a user-friendly error message for display
 */
export function formatErrorForUser(error: any, context?: string): string {
  const message = getErrorMessage(error);

  // Remove technical details that users don't need to see
  const cleanMessage = message
    .replace(/^Error: /, '')
    .replace(/\n.*$/s, '') // Remove stack traces
    .replace(/at [^(]*\([^)]*\)/g, ''); // Remove function references

  if (context) {
    return `${context}: ${cleanMessage}`;
  }

  return cleanMessage;
}

/**
 * Alias for formatErrorForUser to match common import patterns
 */
export const formatErrorForUI = formatErrorForUser;

/**
 * Creates a detailed error message for logging purposes
 */
export function formatErrorForLogging(error: any, context?: string): string {
  const message = getErrorMessage(error);

  // Include more technical details for logging
  let logMessage = message;

  // Add stack trace if available
  if (error?.stack) {
    logMessage += `\nStack: ${error.stack}`;
  }

  // Add error code if available
  if (error?.code) {
    logMessage += `\nCode: ${error.code}`;
  }

  // Add error status if available
  if (error?.status) {
    logMessage += `\nStatus: ${error.status}`;
  }

  // Add context if provided
  if (context) {
    logMessage = `[${context}] ${logMessage}`;
  }

  return logMessage;
}

/**
 * Checks if an error is a network/connectivity issue
 */
export function isNetworkError(error: any): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('network') ||
         message.includes('fetch') ||
         message.includes('connection') ||
         message.includes('timeout') ||
         error?.code === 'NETWORK_ERROR';
}

/**
 * Checks if an error is an authentication issue
 */
export function isAuthError(error: any): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('auth') ||
         message.includes('unauthorized') ||
         message.includes('forbidden') ||
         error?.status === 401 ||
         error?.status === 403;
}
