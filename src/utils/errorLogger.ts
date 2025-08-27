/**
 * Utility for consistent error logging across the application
 */

import { getErrorMessage, getErrorDetails, logError as logFormattedError } from './errorFormatter';

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
    const errorDetails = getErrorDetails(error, options.context);

    // Create a clean error object for logging
    const errorInfo = {
      message,
      error: errorDetails.message,
      stack: error instanceof Error ? error.stack : undefined,
      context: options.context,
      userId: options.userId,
      timestamp: errorDetails.timestamp,
      additionalData: options.additionalData,
      type: errorDetails.type,
      // Safely serialize the error details
      details: this.serializeError(error)
    };

    // Log with proper formatting
    console.error(`[${errorDetails.type}] ${message}:`, errorDetails.message);

    // Log additional details separately for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', errorInfo);
    }

    // Also use the formatted logger for consistent logging
    logFormattedError(message, error, options.context);
  }

  /**
   * Safely serialize error objects for logging
   */
  private static serializeError(error: unknown): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      try {
        // Try to extract meaningful properties
        const errorObj = error as any;
        return {
          message: errorObj.message || errorObj.error || errorObj.details,
          status: errorObj.status || errorObj.statusCode,
          data: errorObj.data,
          // Safely stringify the object if needed
          raw: JSON.stringify(error, null, 2)
        };
      } catch {
        return String(error);
      }
    }

    return error;
  }

  /**
   * Get a user-friendly error message from an error object
   */
  static getUserFriendlyMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
    return getErrorMessage(error, fallbackMessage);
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
