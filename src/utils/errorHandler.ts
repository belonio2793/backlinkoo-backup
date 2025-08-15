/**
 * Global Error Handler for Network Issues
 * Provides user-friendly solutions for common network problems
 */

export class NetworkErrorHandler {
  
  /**
   * Check if error is related to FullStory interference
   */
  static isFullStoryError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || '';
    const stack = error.stack || '';
    
    return stack.includes('fullstory') ||
           stack.includes('edge.fullstory.com') ||
           stack.includes('fs.js') ||
           (message.includes('Failed to fetch') && 
            (stack.includes('fullstory') || document.querySelector('script[src*="fullstory"]')));
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
           error.name === 'TypeError' && message.includes('fetch');
  }
  
  /**
   * Provide user-friendly error message and solution
   */
  static getErrorSolution(error: any): { 
    message: string; 
    solution: string; 
    actions: Array<{label: string, action: () => void}> 
  } {
    
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
              fetch('https://www.google.com/generate_204', { mode: 'no-cors' })
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
   * Initialize global error handling
   */
  static initialize() {
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
    
    // Handle fetch errors globally
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error) {
        // Log fetch errors with context
        console.error('Fetch error:', {
          url: args[0],
          error: error.message,
          stack: error.stack,
          isFullStoryError: this.isFullStoryError(error),
          isNetworkError: this.isNetworkError(error)
        });
        
        throw error;
      }
    };
    
    console.log('✅ Network error handler initialized');
  }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  NetworkErrorHandler.initialize();
}
