import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const GlobalErrorHandler: React.FC = () => {
  const { toast } = useToast();

  useEffect(() => {
    /**
     * Format error for proper display (prevent [object Object])
     */
    const formatError = (error: any): string => {
      if (!error) return 'Unknown error';
      if (typeof error === 'string') return error;
      if (error.message) return error.message;

      if (error.toString && typeof error.toString === 'function') {
        const str = error.toString();
        if (str !== '[object Object]') return str;
      }

      try {
        return JSON.stringify(error, null, 2);
      } catch {
        return 'Error object could not be serialized';
      }
    };

    /**
     * Check if error is from third-party scripts
     */
    const isThirdPartyError = (error: any): boolean => {
      const stack = error?.stack?.toLowerCase() || '';
      const message = error?.message?.toLowerCase() || '';

      const thirdPartyIndicators = [
        'fullstory', 'fs.js', 'google-analytics', 'gtm.js', 'facebook.net',
        'doubleclick', 'analytics', 'tracking', 'chrome-extension://',
        'moz-extension://', 'evmask', 'phantom', 'metamask', 'coinbase',
        'cannot redefine property: ethereum', 'ethereum', 'web3', 'wallet'
      ];

      return thirdPartyIndicators.some(indicator =>
        stack.includes(indicator) || message.includes(indicator)
      );
    };

    /**
     * Check if error is network-related
     */
    const isNetworkError = (error: any): boolean => {
      const message = error?.message?.toLowerCase() || '';
      return message.includes('failed to fetch') ||
             message.includes('network error') ||
             message.includes('connection failed') ||
             message.includes('load failed');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = formatError(event.reason);
      const errorType = typeof event.reason;
      const stack = event.reason?.stack || 'No stack trace available';

      // Categorize the error
      if (isThirdPartyError(event.reason)) {
        console.warn('🔍 Third-party script promise rejection (likely browser extension):', {
          message: errorMessage,
          type: errorType,
          stack: stack.split('\n').slice(0, 3).join('\n') // First 3 lines only
        });
        event.preventDefault();
        return;
      }

      if (isNetworkError(event.reason)) {
        console.warn('🌐 Network promise rejection:', {
          message: errorMessage,
          type: errorType
        });
        event.preventDefault();
        return;
      }

      // This is a real application error
      console.error('🚨 Unhandled Promise Rejection:', {
        message: errorMessage,
        type: errorType,
        stack: stack,
        reason: event.reason,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });

      // Show user-friendly notification for application errors
      if (process.env.NODE_ENV === 'development') {
        toast({
          title: "Application Error Detected",
          description: `Promise rejection: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`,
          variant: "destructive",
          duration: 5000
        });
      }

      // Prevent the default browser error reporting
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      const errorMessage = formatError(event.error);

      // Categorize the error
      if (isThirdPartyError(event.error)) {
        console.warn('🔍 Third-party script error (likely browser extension):', {
          message: errorMessage,
          filename: event.filename,
          lineno: event.lineno
        });
        return;
      }

      if (isNetworkError(event.error)) {
        console.warn('🌐 Network error:', {
          message: errorMessage,
          filename: event.filename
        });
        return;
      }

      console.error('🚨 Global Error:', {
        message: errorMessage,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });

      // Show user-friendly notification for application errors
      if (process.env.NODE_ENV === 'development') {
        toast({
          title: "JavaScript Error Detected",
          description: `Error: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`,
          variant: "destructive",
          duration: 5000
        });
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    console.log('✅ Global error handlers installed');

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      console.log('🧹 Global error handlers cleaned up');
    };
  }, []);

  return null; // This component doesn't render anything
};
