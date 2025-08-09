/**
 * Error Serialization Utility
 * Prevents "[object Object]" errors by properly serializing error objects
 */

/**
 * Serialize any error object to a readable string
 */
export function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error === null || error === undefined) {
    return 'Unknown error occurred';
  }
  
  try {
    return JSON.stringify(error, null, 2);
  } catch (jsonError) {
    return `Error serialization failed: ${String(error)}`;
  }
}

/**
 * Enhanced console.error that properly serializes error objects
 */
export function logError(message: string, error?: unknown): void {
  if (error) {
    console.error(message, serializeError(error));
  } else {
    console.error(message);
  }
}

/**
 * Get error message for UI display
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Create user-friendly error message from any error type
 */
export function createErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  const message = getErrorMessage(error);
  return message || fallback;
}
