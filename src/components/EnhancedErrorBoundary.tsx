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
    console.error('Application error caught by boundary:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
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
      console.warn('Route/Blog error - redirecting to 404:', error.message);
      this.redirectTo404();
      return;
    }

    // For all other errors, set error state
    this.setState({ hasError: true, error, errorInfo });
    this.redirectTo404();
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

      // If we get here, redirect to 404 immediately
      this.redirectTo404();
      
      // Show minimal loading while redirecting
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return this.props.children;
  }
}
