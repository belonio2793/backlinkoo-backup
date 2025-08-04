/**
 * Utility to properly format error objects for logging and display
 * Prevents "[object Object]" errors in console and UI
 */

export interface FormattedError {
  message: string;
  stack?: string;
  name?: string;
  code?: string;
  details?: any;
}

/**
 * Format an error object into a readable format
 */
export function formatError(error: any): FormattedError {
  if (!error) {
    return { message: 'Unknown error occurred' };
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return { message: error };
  }

  // If it's an Error object
  if (error instanceof Error) {
    return {
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      details: error
    };
  }

  // If it's an object with message property
  if (error && typeof error === 'object') {
    return {
      message: error.message || error.msg || error.error || 'Unknown error',
      stack: error.stack,
      name: error.name,
      code: error.code,
      details: error
    };
  }

  // Fallback - try to stringify
  try {
    return {
      message: JSON.stringify(error),
      details: error
    };
  } catch {
    return {
      message: String(error) || 'Unknown error',
      details: error
    };
  }
}

/**
 * Get a user-friendly error message from any error type
 */
export function getErrorMessage(error: any): string {
  const formatted = formatError(error);
  return formatted.message;
}

/**
 * Log an error properly to console
 */
export function logError(context: string, error: any): void {
  const formatted = formatError(error);
  console.error(`${context}:`, formatted.message, formatted.details ? { details: formatted.details } : '');
}

/**
 * Convert error to display-friendly format
 */
export function errorToString(error: any): string {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) {
    return error.message || 'Unknown error';
  }
  
  if (error && typeof error === 'object') {
    return error.message || error.msg || error.error || JSON.stringify(error);
  }
  
  return String(error);
}
