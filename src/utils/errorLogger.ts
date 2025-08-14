/**
 * Utility for consistent error logging across the application
 */

export interface ErrorLogOptions {
  context?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class ErrorLogger {
  /**
   * Log an error with proper serialization
   */
  static logError(message: string, error: unknown, options: ErrorLogOptions = {}): void {
    const errorInfo = {
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: options.context,
      userId: options.userId,
      timestamp: new Date().toISOString(),
      additionalData: options.additionalData,
      details: error
    };

    console.error(message, errorInfo);
  }

  /**
   * Get a user-friendly error message from an error object
   */
  static getUserFriendlyMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return fallbackMessage;
  }

  /**
   * Check if an error is a network/connection related error
   */
  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('fetch') || 
             message.includes('network') || 
             message.includes('connection') ||
             message.includes('timeout');
    }
    return false;
  }

  /**
   * Check if an error is a database related error
   */
  static isDatabaseError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('database') || 
             message.includes('table') || 
             message.includes('column') ||
             message.includes('query');
    }
    return false;
  }
}
