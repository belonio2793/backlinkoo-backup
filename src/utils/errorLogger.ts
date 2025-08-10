/**
 * Safe Error Logging Utility
 * Prevents "[object Object]" errors by properly formatting error objects
 */

export function logError(context: string, error: any): void {
  const formattedError = formatErrorForLogging(error);
  console.error(`${context}:`, formattedError);
}

export function formatErrorForLogging(error: any): string {
  if (!error) {
    return 'Unknown error (null/undefined)';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object with a message
  if (error instanceof Error) {
    return error.message || error.toString();
  }

  // If it's an object with common error properties
  if (typeof error === 'object') {
    // Try different common error properties
    if (error.message) {
      return error.message;
    }
    if (error.error && typeof error.error === 'string') {
      return error.error;
    }
    if (error.details) {
      return error.details;
    }
    if (error.msg) {
      return error.msg;
    }
    if (error.description) {
      return error.description;
    }
    
    // If it has a toString method that's not the default Object toString
    if (error.toString && error.toString !== Object.prototype.toString) {
      const stringified = error.toString();
      if (stringified !== '[object Object]') {
        return stringified;
      }
    }
    
    // Last resort: safely stringify the object
    try {
      return JSON.stringify(error, null, 2);
    } catch (jsonError) {
      return `Error object (could not stringify): ${String(error)}`;
    }
  }

  // For any other type, convert to string
  return String(error);
}

export function getErrorMessage(error: any): string {
  return formatErrorForLogging(error);
}

export default {
  logError,
  formatErrorForLogging,
  getErrorMessage
};
