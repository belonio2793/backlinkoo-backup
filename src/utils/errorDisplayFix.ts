/**
 * Global Error Display Fix
 * Prevents "[object Object]" errors from appearing in UI components
 * by intercepting and properly formatting error objects
 */

/**
 * Enhanced error formatter that handles all common error types
 */
export function safeErrorMessage(error: any): string {
  // Handle null/undefined
  if (!error) {
    return 'An unknown error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object, use the message
  if (error instanceof Error) {
    return error.message || error.toString() || 'Error object without message';
  }

  // Handle common API error structures
  if (error && typeof error === 'object') {
    // Supabase error structure
    if (error.message) {
      return String(error.message);
    }
    
    // Nested error structure
    if (error.error && error.error.message) {
      return String(error.error.message);
    }
    
    // Details field
    if (error.details) {
      return String(error.details);
    }
    
    // Response error structure
    if (error.statusText) {
      return `${error.status || 'HTTP'} Error: ${error.statusText}`;
    }
    
    // Edge function error structure
    if (error.msg) {
      return String(error.msg);
    }
    
    // Validation error structure
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map((e: any) => e.message || String(e)).join(', ');
    }
    
    // If it has a status code, format it nicely
    if (error.status && error.message) {
      return `${error.status}: ${error.message}`;
    }
    
    // Try to create a meaningful message from object properties
    const keys = Object.keys(error);
    if (keys.length > 0) {
      const meaningfulKeys = keys.filter(key => 
        ['message', 'error', 'details', 'reason', 'description', 'text'].includes(key.toLowerCase())
      );
      
      if (meaningfulKeys.length > 0) {
        const values = meaningfulKeys.map(key => String(error[key])).filter(Boolean);
        if (values.length > 0) {
          return values.join('; ');
        }
      }
    }
  }

  // For primitive types that aren't strings
  if (typeof error === 'number' || typeof error === 'boolean') {
    return String(error);
  }

  // Last resort: try to stringify it safely
  try {
    const stringified = JSON.stringify(error);
    if (stringified && stringified !== '{}' && stringified !== 'null' && stringified !== 'undefined') {
      // If it's just an empty object, return a more helpful message
      if (stringified === '{}') {
        return 'Empty error object received';
      }
      return `Error: ${stringified}`;
    }
  } catch (jsonError) {
    // JSON.stringify failed
    return 'Error object could not be serialized';
  }

  // Absolute fallback
  return 'An unspecified error occurred';
}

/**
 * Intercept and fix toast error messages
 */
export function fixToastError(description: any): string {
  if (typeof description === 'string' && description === '[object Object]') {
    return 'An error occurred. Please check the console for details.';
  }
  
  return safeErrorMessage(description);
}

/**
 * Enhanced error logger that formats errors properly for console
 */
export function logError(context: string, error: any): void {
  const formattedError = {
    context,
    message: safeErrorMessage(error),
    originalError: error,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
    type: typeof error,
    constructor: error?.constructor?.name || 'unknown'
  };
  
  console.error(`🚨 ${context}:`, formattedError);
}

/**
 * Global window error handler to catch unhandled "[object Object]" displays
 */
if (typeof window !== 'undefined') {
  // Override the native toString method for common error patterns
  const originalToString = Object.prototype.toString;
  
  // Track if we've already seen this error to avoid infinite loops
  const seenErrors = new WeakSet();
  
  // Add global error handler
  window.addEventListener('error', (event) => {
    if (event.message?.includes('[object Object]')) {
      console.warn('🔧 Detected [object Object] error display:', event);
      logError('Global Error Handler', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    }
  });

  // Add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (typeof reason === 'object' && reason !== null && !seenErrors.has(reason)) {
      seenErrors.add(reason);
      console.warn('🔧 Unhandled promise rejection with object:', reason);
      logError('Unhandled Promise Rejection', reason);
      
      // Try to provide a better error message
      const betterMessage = safeErrorMessage(reason);
      if (betterMessage !== '[object Object]') {
        // Update the rejection reason if possible
        console.log('💡 Better error message would be:', betterMessage);
      }
    }
  });
  
  // Make error fixing utilities available globally for debugging
  (window as any).safeErrorMessage = safeErrorMessage;
  (window as any).fixToastError = fixToastError;
  (window as any).logError = logError;
  
  console.log('🛠️ Error display fix utilities loaded');
}
