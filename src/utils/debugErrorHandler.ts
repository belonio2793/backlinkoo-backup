/**
 * Debug utility to help identify where the "permission denied for table users" error is coming from
 */

export class DebugErrorHandler {
  static initializeErrorTracking() {
    // Only in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Override console.error to catch and analyze errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args.join(' ');
      
      if (errorMessage.includes('permission denied for table users')) {
        console.log('🔍 DEBUG: Found users table permission error at:');
        console.log('Stack trace:', new Error().stack);
        console.log('Arguments:', args);
      }
      
      // Call the original console.error
      originalConsoleError.apply(console, args);
    };

    // Also listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      if (error && error.message && error.message.includes('permission denied for table users')) {
        console.log('🔍 DEBUG: Unhandled promise rejection with users table permission error:');
        console.log('Error:', error);
        console.log('Stack:', error.stack);
        
        // Prevent the error from showing in console
        event.preventDefault();
      }
    });

    console.log('🔧 Debug error tracking initialized for users table permission errors');
  }

  static suppressUsersTableErrors(originalError: any): boolean {
    if (originalError && originalError.message && originalError.message.includes('permission denied for table users')) {
      console.log('ℹ️ Suppressed users table permission error - this is likely a database configuration issue');
      return true;
    }
    return false;
  }
}
