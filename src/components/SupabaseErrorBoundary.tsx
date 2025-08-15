import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, AlertCircle, Network } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isNetworkError: boolean;
  retryCount: number;
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isNetworkError = 
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('timeout') ||
      error.message?.includes('Network connection failed') ||
      error.name === 'TypeError' && error.message?.includes('fetch');

    return {
      hasError: true,
      error,
      isNetworkError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 SupabaseErrorBoundary caught error:', error, errorInfo);
    
    // Log additional context for debugging
    if (this.state.isNetworkError) {
      console.warn('🌐 Network connectivity issue detected in React component');
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      isNetworkError: false,
      retryCount: prevState.retryCount + 1
    }));

    // Force a re-render after a short delay
    this.retryTimeoutId = setTimeout(() => {
      this.forceUpdate();
    }, 100);
  };

  handleReload = () => {
    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if a custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isNetworkError, retryCount } = this.state;

      if (isNetworkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <WifiOff className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Connection Lost</CardTitle>
                <CardDescription>
                  Unable to connect to the server. Please check your internet connection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Network className="h-4 w-4" />
                  <AlertDescription>
                    This usually happens when:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Your internet connection is unstable</li>
                      <li>The server is temporarily unavailable</li>
                      <li>A firewall is blocking the connection</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    disabled={retryCount >= 3}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {retryCount >= 3 ? 'Max Retries Reached' : `Retry Connection ${retryCount > 0 ? `(${retryCount})` : ''}`}
                  </Button>
                  
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full"
                  >
                    Reload Page
                  </Button>
                </div>

                {retryCount >= 3 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-amber-700">
                      If the problem persists, please check your internet connection or try again later.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">Technical Details</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {error.message}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      // Generic error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>

              {error && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer">Error Details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {error.message}
                    {error.stack && '\n\n' + error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useSupabaseErrorHandler = () => {
  const handleSupabaseError = (error: any) => {
    if (error?.message?.includes('Failed to fetch')) {
      console.error('�� Network error detected:', error);
      throw new Error('Network connection failed - please check your internet connection and try again');
    }
    
    if (error?.message?.includes('timeout')) {
      console.error('⏰ Timeout error detected:', error);
      throw new Error('Request timed out - please try again');
    }
    
    throw error;
  };

  return { handleSupabaseError };
};
