import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatErrorForUI } from '@/utils/errorUtils';
import { 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Wifi, 
  Server, 
  Key,
  CreditCard,
  Activity
} from "lucide-react";

interface ErrorDisplayProps {
  error: string;
  context?: {
    status?: number;
    timestamp?: string;
    retryAttempts?: number;
    maxRetries?: number;
  };
  onRetry?: () => void;
  retryDisabled?: boolean;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  context, 
  onRetry, 
  retryDisabled = false,
  className = "" 
}: ErrorDisplayProps) {
  const getErrorIcon = () => {
    if (error.includes('network') || error.includes('fetch') || error.includes('connection')) {
      return <Wifi className="h-4 w-4" />;
    }
    if (error.includes('timeout') || error.includes('timed out')) {
      return <Clock className="h-4 w-4" />;
    }
    if (error.includes('401') || error.includes('API key') || error.includes('unauthorized')) {
      return <Key className="h-4 w-4" />;
    }
    if (error.includes('429') || error.includes('rate limit')) {
      return <Activity className="h-4 w-4" />;
    }
    if (error.includes('quota') || error.includes('billing')) {
      return <CreditCard className="h-4 w-4" />;
    }
    if (error.includes('500') || error.includes('server')) {
      return <Server className="h-4 w-4" />;
    }
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getErrorType = () => {
    if (error.includes('network') || error.includes('fetch') || error.includes('connection')) {
      return { type: 'Network Error', color: 'blue' };
    }
    if (error.includes('timeout') || error.includes('timed out')) {
      return { type: 'Timeout Error', color: 'yellow' };
    }
    if (error.includes('401') || error.includes('API key') || error.includes('unauthorized')) {
      return { type: 'Authentication Error', color: 'red' };
    }
    if (error.includes('429') || error.includes('rate limit')) {
      return { type: 'Rate Limited', color: 'orange' };
    }
    if (error.includes('quota') || error.includes('billing')) {
      return { type: 'Quota Exceeded', color: 'purple' };
    }
    if (error.includes('500') || error.includes('server')) {
      return { type: 'Server Error', color: 'red' };
    }
    if (error.includes('failed after') && error.includes('attempts')) {
      return { type: 'Multiple Retries Failed', color: 'red' };
    }
    return { type: 'Unknown Error', color: 'gray' };
  };

  const errorType = getErrorType();
  const canRetry = !error.includes('401') && 
                   !error.includes('API key') && 
                   !error.includes('quota') &&
                   !error.includes('billing');

  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-red-600">
          {getErrorIcon()}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTitle className="text-red-800 mb-0">Generation Failed</AlertTitle>
            <Badge 
              variant="secondary" 
              className={`text-xs bg-${errorType.color}-100 text-${errorType.color}-700 border-${errorType.color}-200`}
            >
              {errorType.type}
            </Badge>
          </div>
          
          <AlertDescription className="text-red-700">
            {formatErrorForUI(error)}
          </AlertDescription>

          {context && (
            <div className="text-xs text-red-600 space-y-1">
              {context.status && (
                <div>Status Code: {context.status}</div>
              )}
              {context.timestamp && (
                <div>Time: {new Date(context.timestamp).toLocaleString()}</div>
              )}
              {context.retryAttempts !== undefined && context.maxRetries && (
                <div>Retry Attempts: {context.retryAttempts}/{context.maxRetries}</div>
              )}
            </div>
          )}

          {onRetry && canRetry && (
            <div className="pt-2">
              <Button
                onClick={onRetry}
                disabled={retryDisabled}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            </div>
          )}

          {!canRetry && (
            <div className="text-xs text-red-600 bg-red-100 p-2 rounded border border-red-200">
              💡 This error requires manual intervention. Please check your API configuration or billing status.
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}
