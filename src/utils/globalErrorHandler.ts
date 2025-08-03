/**
 * Global Error Handler
 * 
 * Catches and handles global errors, particularly those caused by
 * third-party scripts interfering with application functionality
 */

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorCounts = new Map<string, number>();
  private readonly MAX_SAME_ERROR = 10;

  static getInstance(): GlobalErrorHandler {
    if (!this.instance) {
      this.instance = new GlobalErrorHandler();
    }
    return this.instance;
  }

  /**
   * Initialize global error handling
   */
  init(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Unhandled Promise Rejection');
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'Global Error');
    });

    console.log('🛡️ Global error handler initialized');
  }

  /**
   * Handle errors with categorization and deduplication
   */
  private handleError(error: any, source: string): void {
    const errorKey = this.getErrorKey(error);
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    // Check for RLS recursion error - this needs immediate attention
    if (this.isRLSRecursionError(error) && count === 1) {
      this.handleRLSRecursionError(error, source);
      return;
    }

    // Only log if we haven't seen this error too many times
    if (count <= this.MAX_SAME_ERROR) {
      if (this.isThirdPartyError(error)) {
        this.handleThirdPartyError(error, source, count);
      } else if (this.isNetworkError(error)) {
        this.handleNetworkError(error, source, count);
      } else {
        this.handleGenericError(error, source, count);
      }
    }

    // Suppress the error from appearing in console if it's a known third-party issue
    if (this.isThirdPartyError(error) && count > 1) {
      // Prevent the error from propagating further
      return;
    }
  }

  /**
   * Generate a unique key for error deduplication
   */
  private getErrorKey(error: any): string {
    const message = error?.message || 'Unknown error';
    const stack = error?.stack || '';
    return `${message}-${stack.split('\n')[0]}`;
  }

  /**
   * Check if error is from third-party scripts
   */
  private isThirdPartyError(error: any): boolean {
    const stack = error?.stack?.toLowerCase() || '';
    const message = error?.message?.toLowerCase() || '';

    const thirdPartyIndicators = [
      'fullstory',
      'fs.js',
      'google-analytics',
      'gtm.js',
      'facebook.net',
      'doubleclick',
      'analytics',
      'tracking',
      'chrome-extension://',
      'moz-extension://',
      'evmask',
      'phantom',
      'metamask',
      'coinbase',
      'cannot redefine property: ethereum',
      'ethereum',
      'web3',
      'wallet'
    ];

    return thirdPartyIndicators.some(indicator =>
      stack.includes(indicator) || message.includes(indicator)
    );
  }

  /**
   * Check if error is RLS recursion related
   */
  private isRLSRecursionError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('infinite recursion detected in policy') ||
           message.includes('infinite recursion') && message.includes('profiles');
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('failed to fetch') ||
           message.includes('network error') ||
           message.includes('connection failed');
  }

  /**
   * Handle third-party script errors
   */
  private handleThirdPartyError(error: any, source: string, count: number): void {
    if (count === 1) {
      console.warn(`🔍 Third-party script error detected (${source}):`, error.message);
      console.warn('This error is likely caused by browser extensions or analytics tools and can be safely ignored.');
    }
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(error: any, source: string, count: number): void {
    if (count <= 3) {
      console.warn(`🌐 Network error (${source}, occurrence ${count}):`, error.message);
    }
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: any, source: string, count: number): void {
    if (count <= 5) {
      console.error(`❌ Application error (${source}, occurrence ${count}):`, error);
    }
  }

  /**
   * Clear error counts (useful for testing or reset)
   */
  clearErrorCounts(): void {
    this.errorCounts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [key: string]: number } {
    return Object.fromEntries(this.errorCounts);
  }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  GlobalErrorHandler.getInstance().init();
}
