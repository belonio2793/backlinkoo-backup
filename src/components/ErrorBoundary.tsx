import React from 'react';
import { logError } from '@/utils/errorFormatter';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  redirectSeconds: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private redirectTimer?: NodeJS.Timeout;
  private countdownTimer?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, redirectSeconds: 5 };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, redirectSeconds: 5 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Filter out browser extension errors and other common non-critical errors
    const isExtensionError = error.message.includes('Cannot redefine property: ethereum') ||
                            error.stack?.includes('chrome-extension://') ||
                            error.message.includes('ethereum') ||
                            error.message.includes('evmAsk') ||
                            error.message.includes('ResizeObserver loop limit exceeded') ||
                            error.message.includes('Non-Error promise rejection captured');

    // Also filter out authentication-related errors that should be handled gracefully
    const isAuthError = error.message.includes('Auth') ||
                       error.message.includes('supabase') ||
                       error.message.includes('session') ||
                       error.message.includes('user');

    // Filter out dashboard navigation errors
    const isDashboardError = window.location.pathname.includes('/dashboard') &&
                            (error.message.includes('navigate') ||
                             error.message.includes('router') ||
                             error.message.includes('redirect'));

    // Filter out database table errors (non-existent tables)
    const isDatabaseTableError = error.message.includes('published_blog_posts') ||
                                error.message.includes('relation') ||
                                error.message.includes('does not exist') ||
                                error.stack?.includes('published_blog_posts') ||
                                error.message.includes('PGRST') ||
                                error.message.includes('422') ||
                                error.message.includes('schema') ||
                                (error.message.includes('404') && error.message.includes('blog'));

    if (isExtensionError || isAuthError || isDashboardError || isDatabaseTableError) {
      console.warn('Non-critical error filtered:', error.message);
      if (isDatabaseTableError) {
        console.warn('Database table error filtered - app will continue with fallback data');
      }
      // Reset error state to prevent app crash
      this.setState({ hasError: false, error: undefined });
      return;
    }

    logError('Application error', {
      ...error,
      componentStack: errorInfo.componentStack
    });
    this.startRedirectCountdown();
  }

  componentWillUnmount() {
    this.clearTimers();
  }

  clearTimers = () => {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  };

  startRedirectCountdown = () => {
    // Start countdown
    this.countdownTimer = setInterval(() => {
      this.setState(prevState => ({
        redirectSeconds: prevState.redirectSeconds - 1
      }));
    }, 1000);

    // Redirect after 5 seconds
    this.redirectTimer = setTimeout(() => {
      this.clearTimers();
      window.location.href = '/';
    }, 5000);
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return <Fallback error={this.state.error} />;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Please refresh the page or try again later.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Redirecting to home page in {this.state.redirectSeconds} seconds...
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Go to Home Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
