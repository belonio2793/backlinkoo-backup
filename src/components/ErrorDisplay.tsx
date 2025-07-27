import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, X, AlertCircle, Info, AlertOctagon } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent } from './ui/card';
import { ErrorSeverity, ErrorCategory, ErrorDisplayData, errorLogger } from '../services/errorLoggingService';

interface ErrorDisplayProps {
  error?: Error | string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  customMessage?: string;
  customTitle?: string;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
  compact?: boolean;
}

interface ErrorState {
  isRetrying: boolean;
  retryCount: number;
  dismissed: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  category = ErrorCategory.GENERAL,
  severity = ErrorSeverity.MEDIUM,
  customMessage,
  customTitle,
  onRetry,
  onDismiss,
  showDismiss = true,
  className = '',
  compact = false
}) => {
  const [state, setState] = useState<ErrorState>({
    isRetrying: false,
    retryCount: 0,
    dismissed: false
  });

  if (state.dismissed || !error) {
    return null;
  }

  const displayData: ErrorDisplayData = error 
    ? errorLogger.getErrorDisplayData(error, category)
    : {
        title: customTitle || 'Error',
        message: customMessage || 'An error occurred',
        severity,
        canRetry: !!onRetry
      };

  const getSeverityIcon = () => {
    switch (displayData.severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertOctagon className="h-5 w-5 text-destructive" />;
      case ErrorSeverity.HIGH:
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case ErrorSeverity.MEDIUM:
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case ErrorSeverity.LOW:
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityVariant = () => {
    switch (displayData.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const handleRetry = async () => {
    if (!onRetry || state.isRetrying) return;

    setState(prev => ({ ...prev, isRetrying: true, retryCount: prev.retryCount + 1 }));

    try {
      await onRetry();
      setState(prev => ({ ...prev, dismissed: true }));
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // Log the retry failure
      await errorLogger.logError(
        ErrorSeverity.MEDIUM,
        category,
        'Retry attempt failed',
        {
          error: retryError instanceof Error ? retryError : new Error(String(retryError)),
          context: { retryCount: state.retryCount + 1, originalError: String(error) }
        }
      );
    } finally {
      setState(prev => ({ ...prev, isRetrying: false }));
    }
  };

  const handleDismiss = () => {
    setState(prev => ({ ...prev, dismissed: true }));
    onDismiss?.();
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md ${className}`}>
        {getSeverityIcon()}
        <span className="text-sm text-destructive flex-1">{displayData.message}</span>
        {displayData.canRetry && onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={state.isRetrying}
            className="h-6 px-2"
          >
            {state.isRetrying ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              'Retry'
            )}
          </Button>
        )}
        {showDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant={getSeverityVariant()} className={className}>
      <div className="flex items-start gap-2">
        {getSeverityIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-2">{displayData.title}</AlertTitle>
          <AlertDescription className="mb-4">
            {displayData.message}
            {state.retryCount > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Retry attempts: {state.retryCount}
              </div>
            )}
          </AlertDescription>
          
          <div className="flex items-center gap-2">
            {displayData.canRetry && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={state.isRetrying}
              >
                {state.isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            )}
            
            {showDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
        
        {showDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

// Hook for managing error state in components
export const useErrorHandler = () => {
  const [error, setError] = useState<Error | string | null>(null);
  const [category, setCategory] = useState<ErrorCategory>(ErrorCategory.GENERAL);

  const handleError = async (
    error: Error | string,
    category: ErrorCategory = ErrorCategory.GENERAL,
    context?: Record<string, any>
  ) => {
    setError(error);
    setCategory(category);

    // Log the error
    await errorLogger.logError(
      ErrorSeverity.MEDIUM,
      category,
      typeof error === 'string' ? error : error.message,
      {
        error: error instanceof Error ? error : new Error(String(error)),
        context
      }
    );
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    category,
    hasError: !!error,
    handleError,
    clearError
  };
};

// Global error boundary component
export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    errorLogger.logError(
      ErrorSeverity.CRITICAL,
      ErrorCategory.GENERAL,
      error.message,
      {
        error,
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        }
      }
    );
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <Card className="m-4">
          <CardContent className="p-6">
            <ErrorDisplay
              error={this.state.error}
              category={ErrorCategory.GENERAL}
              severity={ErrorSeverity.CRITICAL}
              onRetry={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              showDismiss={false}
            />
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorDisplay;
