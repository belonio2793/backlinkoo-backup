/**
 * Global Error Handler for Network Issues
 * Provides user-friendly solutions for common network problems
 */

import { responseBodyManager } from './responseBodyFix';

export class NetworkErrorHandler {
  private static isInitialized = false;
  private static originalFetch: typeof fetch;
  
  /**
   * Check if error is related to FullStory interference
   */
  static isFullStoryError(error: any): boolean {
    if (!error) return false;

    const message = error.message || '';
    const stack = error.stack || '';

    // Only consider it a FullStory error if there's explicit evidence in the stack trace
    return stack.includes('fullstory') ||
           stack.includes('edge.fullstory.com') ||
           stack.includes('fs.js') ||
           stack.includes('fullstory.com');
  }
  
  /**
   * Check if error is a network/connectivity issue
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || '';
    return message.includes('Failed to fetch') ||
           message.includes('Network request failed') ||
           message.includes('CORS') ||
           message.includes('NetworkError') ||
           message.includes('body stream already read') ||
           error.name === 'TypeError' && message.includes('fetch');
  }
  
  /**
   * Check if error is related to response body being consumed multiple times
   */
  static isResponseBodyError(error: any): boolean {
    if (!error) return false;
    const message = error.message || '';
    return message.includes('body stream already read') || 
           message.includes('body used already') ||
           message.includes('body has already been consumed');
  }
  
  /**
   * Provide user-friendly error message and solution
   */
  static getErrorSolution(error: any): { 
    message: string; 
    solution: string; 
    actions: Array<{label: string, action: () => void}> 
  } {
    
    if (this.isResponseBodyError(error)) {
      return {
        message: 'Response handling error',
        solution: 'A response was processed multiple times. This is usually a temporary issue.',
        actions: [
          {
            label: 'Refresh Page',
            action: () => window.location.reload()
          },
          {
            label: 'Clear Cache',
            action: () => {
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                  window.location.reload();
                });
              } else {
                window.location.reload();
              }
            }
          }
        ]
      };
    }
    
    if (this.isFullStoryError(error)) {
      return {
        message: 'Network request blocked by browser analytics',
        solution: 'This appears to be caused by analytics software interfering with network requests.',
        actions: [
          {
            label: 'Disable Analytics',
            action: () => {
              localStorage.setItem('disable_fullstory', 'true');
              window.location.reload();
            }
          },
          {
            label: 'Refresh Page',
            action: () => window.location.reload()
          }
        ]
      };
    }
    
    if (this.isNetworkError(error)) {
      return {
        message: 'Network connection problem',
        solution: 'There seems to be a connectivity issue. This could be due to internet connection problems or browser extensions.',
        actions: [
          {
            label: 'Check Connection',
            action: () => {
              // Simple connectivity test
              this.originalFetch('https://www.google.com/generate_204', { mode: 'no-cors' })
                .then(() => alert('Internet connection is working'))
                .catch(() => alert('No internet connection detected'));
            }
          },
          {
            label: 'Disable Extensions',
            action: () => {
              alert('Please try disabling browser extensions and refresh the page');
            }
          },
          {
            label: 'Refresh Page',
            action: () => window.location.reload()
          }
        ]
      };
    }
    
    // Generic error
    return {
      message: 'An unexpected error occurred',
      solution: 'Please try refreshing the page or contact support if the problem persists.',
      actions: [
        {
          label: 'Refresh Page',
          action: () => window.location.reload()
        },
        {
          label: 'Clear Cache',
          action: () => {
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
                window.location.reload();
              });
            } else {
              window.location.reload();
            }
          }
        }
      ]
    };
  }
  
  /**
   * Initialize global error handling (safe, single initialization)
   */
  static initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Network error handler already initialized, skipping');
      return;
    }

    // Check if fetch wrapper should be disabled (escape hatch)
    if (window.localStorage?.getItem('disable-fetch-wrapper') === 'true') {
      console.log('🚫 Fetch wrapper disabled via localStorage flag');
      this.isInitialized = true;
      return;
    }

    // Store original fetch before any modifications
    this.originalFetch = window.fetch.bind(window);
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Don't show UI for development errors or very frequent errors
      if (import.meta.env.DEV) return;
      
      // Check if this is a network error we can help with
      if (this.isFullStoryError(event.reason) || this.isNetworkError(event.reason)) {
        // Throttle error notifications
        if (!window._lastErrorTime || Date.now() - window._lastErrorTime > 5000) {
          window._lastErrorTime = Date.now();
          
          const solution = this.getErrorSolution(event.reason);
          console.log('Network error solution:', solution);
          
          // You could show a toast or modal here
          // For now, just log the solution
        }
      }
    });
    
    // Enhanced fetch wrapper with better error handling
    window.fetch = async (...args) => {
      try {
        const [url] = args;

        // Don't interfere with module loading (dynamic imports)
        if (url && typeof url === 'string' && (url.includes('.tsx') || url.includes('.ts') || url.includes('.js'))) {
          return await this.originalFetch(...args);
        }

        // Use the stored original fetch to avoid recursive wrapping
        const response = await this.originalFetch(...args);

        // Use safe response body management for API calls only
        if (response.ok && responseBodyManager.canReadBody(response) && url && typeof url === 'string' &&
            (url.includes('/api/') || url.includes('supabase') || url.includes('functions'))) {
          try {
            const clonedResponse = responseBodyManager.safeClone(response);
            return clonedResponse;
          } catch (cloneError) {
            // If cloning fails, return original response
            console.warn('Failed to clone response, returning original:', cloneError);
            return response;
          }
        }

        return response;

      } catch (error: any) {
        const [url] = args;

        // Don't interfere with module loading errors
        if (url && typeof url === 'string' && (url.includes('.tsx') || url.includes('.ts') || url.includes('.js'))) {
          throw error;
        }

        // Log fetch errors with context but avoid recursive logging
        console.error('Fetch error detected:', error?.message || 'Unknown error');

        // Only treat as FullStory error if there's explicit evidence
        if (this.isFullStoryError(error)) {
          console.warn('🌐 FullStory interference detected, retrying request...');
          // Try once more with original fetch before giving up
          try {
            return await this.originalFetch(...args);
          } catch (retryError) {
            const newError = new Error('Network request blocked by browser analytics. Please try refreshing the page.');
            newError.name = 'NetworkBlockedError';
            throw newError;
          }
        }

        // If it's a response body error, provide cleaner error message
        if (this.isResponseBodyError(error)) {
          const newError = new Error('Response already processed. Please try again.');
          newError.name = 'ResponseBodyError';
          throw newError;
        }

        throw error;
      }
    };
    
    this.isInitialized = true;
    console.log('✅ Network error handler initialized');
  }
  
  /**
   * Reset the error handler (for testing or if needed)
   */
  static reset() {
    if (this.originalFetch && this.isInitialized) {
      window.fetch = this.originalFetch;
      this.isInitialized = false;
      console.log('🔄 Network error handler reset');
    }
  }
  
  /**
   * Get the original fetch function (useful for bypassing wrapper)
   */
  static getOriginalFetch(): typeof fetch {
    return this.originalFetch || window.fetch;
  }
}

// Auto-initialize in browser environment with safety check
if (typeof window !== 'undefined' && !window._networkErrorHandlerInitialized) {
  // Delay initialization to avoid interfering with module loading
  setTimeout(() => {
    try {
      NetworkErrorHandler.initialize();
      window._networkErrorHandlerInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize NetworkErrorHandler:', error);
    }
  }, 1000);
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).NetworkErrorHandler = NetworkErrorHandler;
}
