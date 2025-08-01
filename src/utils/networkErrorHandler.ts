/**
 * Network Error Handler Utility
 * 
 * Handles network errors that may be caused by third-party scripts
 * (like FullStory, analytics tools) interfering with fetch requests
 */

export class NetworkErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Check if an error is likely caused by third-party interference
   */
  static isThirdPartyInterference(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const stack = error?.stack?.toLowerCase() || '';
    
    // Common patterns for third-party interference
    const thirdPartyPatterns = [
      'fullstory',
      'fs.js',
      'analytics',
      'tracking',
      'gtm',
      'google-analytics',
      'facebook.net',
      'doubleclick'
    ];
    
    return thirdPartyPatterns.some(pattern => 
      errorMessage.includes(pattern) || stack.includes(pattern)
    );
  }

  /**
   * Retry a network operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // If it's the last attempt or not a retryable error, throw
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = this.RETRY_DELAY * Math.pow(2, attempt);
        await this.delay(delay);
        
        console.warn(`Network operation failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error.message);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if an error is retryable
   */
  private static isRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    
    // Retry on network errors, but not on authentication or permission errors
    return (
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('connection failed') ||
      this.isThirdPartyInterference(error)
    ) && !message.includes('unauthorized') && !message.includes('forbidden');
  }

  /**
   * Simple delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap a Supabase operation with error handling
   */
  static async wrapSupabaseOperation<T>(
    operation: () => Promise<{ data: T; error: any }>,
    fallbackValue?: T
  ): Promise<{ data: T | null; error: any }> {
    try {
      return await this.retryOperation(operation);
    } catch (error: any) {
      console.warn('Supabase operation failed after retries:', error.message);
      
      // If third-party interference detected, provide helpful context
      if (this.isThirdPartyInterference(error)) {
        console.warn('🔍 Third-party script interference detected. This may be caused by browser extensions or analytics tools.');
      }
      
      return {
        data: fallbackValue || null,
        error: {
          message: `Network operation failed: ${error.message}`,
          originalError: error
        }
      };
    }
  }
}
