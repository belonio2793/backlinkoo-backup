import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class CampaignMonitoringErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Campaign monitoring error boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).realTimeFeedService) {
      (window as any).realTimeFeedService.emitSystemEvent(
        `Campaign monitoring error: ${error.message}`,
        'error'
      );
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-3">
              <div>
                <strong>Campaign monitoring temporarily unavailable</strong>
                <p className="text-sm mt-1">
                  {this.state.error?.message || 'An unexpected error occurred in the monitoring system'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Refresh Page
                </Button>
              </div>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="text-xs bg-orange-100 p-2 rounded mt-2">
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default CampaignMonitoringErrorBoundary;
