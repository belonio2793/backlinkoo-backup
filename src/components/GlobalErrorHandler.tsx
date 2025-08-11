import { useEffect } from 'react';

export const GlobalErrorHandler: React.FC = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled Promise Rejection caught:', {
        reason: event.reason,
        type: typeof event.reason,
        stack: event.reason?.stack,
        message: event.reason?.message || event.reason
      });
      
      // Prevent the default browser error reporting
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global Error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
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
