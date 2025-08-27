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

        // Handle different error object structures
        let extractedMessage = errorObj.message ||
                             errorObj.error ||
                             errorObj.details ||
                             errorObj.description ||
                             errorObj.msg ||
                             errorObj.statusText;

        // If no clear message, try to create a meaningful one
        if (!extractedMessage) {
          const parts = [];
          if (errorObj.status || errorObj.statusCode) {
            parts.push(`Status: ${errorObj.status || errorObj.statusCode}`);
          }
          if (errorObj.endpoint) {
            parts.push(`Endpoint: ${errorObj.endpoint}`);
          }
          if (errorObj.type) {
            parts.push(`Type: ${errorObj.type}`);
          }
          extractedMessage = parts.length > 0 ? parts.join(', ') : 'Unknown error';
        }

        const serialized = {
          message: extractedMessage,
          status: errorObj.status || errorObj.statusCode,
          endpoint: errorObj.endpoint,
          type: errorObj.type,
          data: errorObj.data
        };

        // Only add raw if we can safely stringify it
        try {
          const jsonStr = JSON.stringify(error, (key, val) => {
            if (typeof val === 'function') return '[Function]';
            if (val instanceof Error) return val.message;
            return val;
          }, 2);

          if (jsonStr && jsonStr !== '{}' && jsonStr.length < 1000) {
            serialized.raw = jsonStr;
          }
        } catch {
          // Skip raw if can't stringify
        }

        return serialized;
      } catch {
        // If all else fails, convert to string
        return String(error).replace('[object Object]', 'Error object (details unavailable)');
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
