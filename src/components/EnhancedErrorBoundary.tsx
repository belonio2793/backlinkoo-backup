import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logError } from '@/utils/errorFormatter';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

export class EnhancedErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private redirectTimer?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('Application error caught by boundary', {
      ...error,
      componentStack: errorInfo.componentStack
    });
    
    // Filter out browser extension errors and other non-critical errors
    const isExtensionError = error.message.includes('Cannot redefine property: ethereum') ||
                            error.stack?.includes('chrome-extension://') ||
                            error.message.includes('ethereum') ||
                            error.message.includes('evmAsk') ||
                            error.message.includes('ResizeObserver loop limit exceeded') ||
                            error.message.includes('Non-Error promise rejection captured');

    // Authentication-related errors that should be handled gracefully
    const isAuthError = error.message.includes('Auth') ||
                       error.message.includes('supabase') ||
                       error.message.includes('session');

    // Route/navigation errors
    const isRouteError = error.message.includes('navigate') ||
                        error.message.includes('router') ||
                        error.message.includes('redirect') ||
                        error.message.includes('route');

    // Database/API errors that should not crash the app
    const isDatabaseError = error.message.includes('published_blog_posts') ||
                           error.message.includes('relation') ||
                           error.message.includes('does not exist') ||
                           error.message.includes('PGRST') ||
                           error.message.includes('422') ||
                           error.message.includes('404') ||
                           error.message.includes('500') ||
                           error.message.includes('cleanup_expired_posts') ||
                           error.message.includes('getQuickStatus');

    // Component loading errors (lazy components)
    const isComponentError = error.message.includes('Loading chunk') ||
                            error.message.includes('is not defined') ||
                            error.message.includes('lazy') ||
                            error.message.includes('Cannot resolve module');

    // Blog system errors
    const isBlogError = error.message.includes('blog') ||
                       error.message.includes('Blog') ||
                       error.message.includes('claim') ||
                       error.stack?.includes('blog');

    if (isExtensionError || isAuthError || isDatabaseError || isComponentError) {
      console.warn('Non-critical error filtered and recovered:', error.message);
      // Reset error state to prevent app crash
      this.setState({ hasError: false, error: undefined });
      return;
    }

    if (isRouteError || isBlogError) {
      console.warn('Route/Blog error - recovering gracefully:', error.message);
      // Reset error state instead of redirecting to 404
      this.setState({ hasError: false, error: undefined });
      return;
    }

    // For all other errors, set error state but don't auto-redirect
    console.warn('Application error - showing fallback UI:', error.message);
    this.setState({ hasError: true, error, errorInfo });
  }

  componentWillUnmount() {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }

  redirectTo404 = () => {
    // Immediate redirect to 404 instead of showing error page
    this.redirectTimer = setTimeout(() => {
      window.location.href = '/404';
    }, 100);
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return <Fallback error={this.state.error} />;
      }

      // Show error UI instead of auto-redirecting
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto text-center p-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">We're experiencing a temporary issue. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
