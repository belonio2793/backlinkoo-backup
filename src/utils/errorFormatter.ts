/**
 * Comprehensive error handling and formatting utilities
 * Prevents [object Object] display issues and provides meaningful error messages
 */

export interface ErrorDetails {
  message: string;
  originalError: unknown;
  context?: string;
  timestamp: string;
  type: 'Error' | 'NetworkError' | 'DatabaseError' | 'ValidationError' | 'UnknownError';
}

/**
 * Extract a meaningful error message from any error type
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    const errorObj = error as any;
    
    // Try multiple common error properties
    const extractedMessage = errorObj.message || 
                            errorObj.error || 
                            errorObj.details || 
                            errorObj.description ||
                            errorObj.msg ||
                            errorObj.statusText;
    
    if (extractedMessage && typeof extractedMessage === 'string') {
      return extractedMessage;
    }
    
    // If object has a meaningful toString method
    if (errorObj.toString && typeof errorObj.toString === 'function') {
      const stringified = errorObj.toString();
      if (stringified !== '[object Object]' && stringified !== '[object Error]') {
        return stringified;
      }
    }
    
    // Try to extract from common API error structures
    if (errorObj.response && errorObj.response.data) {
      return getErrorMessage(errorObj.response.data, fallbackMessage);
    }
    
    // Try to extract from nested error
    if (errorObj.error && typeof errorObj.error === 'object') {
      return getErrorMessage(errorObj.error, fallbackMessage);
    }
    
    // If all else fails, try JSON.stringify for debugging
    try {
      const jsonStr = JSON.stringify(errorObj);
      if (jsonStr && jsonStr !== '{}' && jsonStr.length < 200) {
        return `Error details: ${jsonStr}`;
      }
    } catch {
      // JSON.stringify failed, continue to fallback
    }
  }
  
  return fallbackMessage;
}

/**
 * Get detailed error information for logging and debugging
 */
export function getErrorDetails(error: unknown, context?: string): ErrorDetails {
  const message = getErrorMessage(error);
  const timestamp = new Date().toISOString();
  
  let type: ErrorDetails['type'] = 'UnknownError';
  
  if (error instanceof Error) {
    type = 'Error';
    
    // Check for specific error types
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      type = 'NetworkError';
    } else if (errorMessage.includes('database') || errorMessage.includes('table') || errorMessage.includes('column')) {
      type = 'DatabaseError';
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
      type = 'ValidationError';
    }
  }
  
  return {
    message,
    originalError: error,
    context,
    timestamp,
    type
  };
}

/**
 * Log error with proper formatting
 */
export function logError(message: string, error: unknown, context?: string): void {
  const errorDetails = getErrorDetails(error, context);
  
  console.error(`[${errorDetails.type}] ${message}`, {
    message: errorDetails.message,
    context: errorDetails.context,
    timestamp: errorDetails.timestamp,
    originalError: errorDetails.originalError,
    stack: error instanceof Error ? error.stack : undefined
  });
}

/**
 * Format error for user display
 */
export function formatUserError(error: unknown, userFriendlyContext?: string): string {
  const message = getErrorMessage(error);
  
  if (userFriendlyContext) {
    return `${userFriendlyContext}: ${message}`;
  }
  
  return message;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown, context?: string) {
  const details = getErrorDetails(error, context);
  
  return {
    success: false,
    error: details.message,
    details: {
      type: details.type,
      context: details.context,
      timestamp: details.timestamp
    }
  };
}

/**
 * Safely stringify any value for logging
 */
export function safeStringify(value: unknown): string {
  try {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    
    // For objects, try JSON.stringify with a replacer to handle circular references
    return JSON.stringify(value, (key, val) => {
      if (typeof val === 'function') return '[Function]';
      if (val instanceof Error) return val.message;
      return val;
    }, 2);
  } catch {
    return String(value);
  }
}
