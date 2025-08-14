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

    const errorInfo = {
      message,
      error: errorDetails.message,
      stack: error instanceof Error ? error.stack : undefined,
      context: options.context,
      userId: options.userId,
      timestamp: errorDetails.timestamp,
      additionalData: options.additionalData,
      type: errorDetails.type,
      details: error
    };

    console.error(message, errorInfo);

    // Also use the formatted logger for consistent logging
    logFormattedError(message, error, options.context);
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
