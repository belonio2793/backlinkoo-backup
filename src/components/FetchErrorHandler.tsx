import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { FetchErrorDiagnostic } from '@/utils/fetchErrorDiagnostic';

interface FetchErrorHandlerProps {
  onRetry?: () => void;
  context?: string; // e.g., "loading blog posts", "saving data"
}

export function FetchErrorHandler({ onRetry, context = "loading data" }: FetchErrorHandlerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await FetchErrorDiagnostic.runDiagnostics();
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      handleRefresh();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Connection Issue</AlertTitle>
        <AlertDescription className="text-orange-700 space-y-3">
          <p>
            We're having trouble {context}. This is usually a temporary network issue.
          </p>
          
          {!isOnline && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2 rounded">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">You appear to be offline</span>
            </div>
          )}

          {isOnline && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Internet connection detected</span>
            </div>
          )}

          {diagnosticResults && (
            <div className="text-sm bg-blue-50 p-2 rounded">
              <p className="font-medium text-blue-800 mb-1">Diagnostic Results:</p>
              <ul className="text-blue-700 space-y-1">
                <li>Internet: {diagnosticResults.internetConnection ? '✅' : '❌'}</li>
                <li>Database: {diagnosticResults.supabaseReachable ? '✅' : '❌'}</li>
                {diagnosticResults.recommendations.length > 0 && (
                  <li className="mt-2">
                    <strong>Suggestions:</strong>
                    <ul className="ml-2 mt-1">
                      {diagnosticResults.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                        <li key={idx} className="text-xs">• {rec}</li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleRetry}
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
            
            <Button 
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {isRunningDiagnostics ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                'Diagnose'
              )}
            </Button>
          </div>

          <div className="text-xs text-orange-600">
            <p>If the problem persists:</p>
            <ul className="ml-2 mt-1 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try disabling browser extensions</li>
              <li>• Clear your browser cache</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Error boundary specifically for fetch errors
interface FetchErrorBoundaryState {
  hasFetchError: boolean;
  errorContext?: string;
}

export class FetchErrorBoundary extends React.Component<
  React.PropsWithChildren<{ context?: string; onRetry?: () => void }>,
  FetchErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ context?: string; onRetry?: () => void }>) {
    super(props);
    this.state = { hasFetchError: false };
  }

  static getDerivedStateFromError(error: Error): FetchErrorBoundaryState {
    // Check if this is a fetch-related error
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('fetch') ||
        error.message.includes('Network') ||
        error.name === 'NetworkError') {
      return { 
        hasFetchError: true,
        errorContext: error.message
      };
    }
    
    // Not a fetch error, let other error boundaries handle it
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log fetch errors for analysis
    console.error('Fetch error boundary caught error:', error);
    FetchErrorDiagnostic.logError(window.location.href, error);
  }

  render() {
    if (this.state.hasFetchError) {
      return (
        <FetchErrorHandler 
          context={this.props.context}
          onRetry={() => {
            this.setState({ hasFetchError: false });
            if (this.props.onRetry) {
              this.props.onRetry();
            }
          }}
        />
      );
    }

    return this.props.children;
  }
}
