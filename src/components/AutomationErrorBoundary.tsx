import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Database,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorId: string;
}

export class AutomationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console for debugging
    console.error('AutomationErrorBoundary caught an error:', error, errorInfo);

    // In a real app, you might want to send this to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // You could send this to Sentry, LogRocket, or another service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };

      // For now, just log to console
      console.log('Error Report:', errorReport);
      
      // Store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('automation_errors') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      localStorage.setItem('automation_errors', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: ''
    });
  };

  private copyErrorDetails = async () => {
    const errorDetails = `
Error ID: ${this.state.errorId}
Time: ${new Date().toISOString()}
URL: ${window.location.href}

Error Message:
${this.state.error?.message}

Stack Trace:
${this.state.error?.stack}

Component Stack:
${this.state.errorInfo?.componentStack}

User Agent:
${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      alert('Error details copied to clipboard');
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
      // Fallback: show in alert
      alert('Copy failed. Error details:\n\n' + errorDetails);
    }
  };

  private getErrorType = (error: Error | null): string => {
    if (!error) return 'Unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network Error';
    }
    if (message.includes('database') || message.includes('supabase')) {
      return 'Database Error';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Authentication Error';
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return 'Permission Error';
    }
    if (message.includes('timeout')) {
      return 'Timeout Error';
    }
    
    return 'Application Error';
  };

  private getErrorSeverity = (error: Error | null): 'low' | 'medium' | 'high' => {
    if (!error) return 'medium';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'medium';
    }
    if (message.includes('database') || message.includes('permission')) {
      return 'high';
    }
    
    return 'low';
  };

  private getSuggestions = (error: Error | null): string[] => {
    if (!error) return [];
    
    const message = error.message.toLowerCase();
    const suggestions: string[] = [];
    
    if (message.includes('network') || message.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Check if the server is responding');
    }
    
    if (message.includes('database') || message.includes('supabase')) {
      suggestions.push('Verify database configuration');
      suggestions.push('Check database permissions');
      suggestions.push('Run the database setup script');
    }
    
    if (message.includes('auth') || message.includes('unauthorized')) {
      suggestions.push('Try logging out and back in');
      suggestions.push('Clear browser cache and cookies');
      suggestions.push('Check authentication configuration');
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      suggestions.push('Contact an administrator');
      suggestions.push('Verify your account permissions');
      suggestions.push('Check RLS policies');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear browser cache');
      suggestions.push('Check browser console for more details');
    }
    
    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType(this.state.error);
      const severity = this.getErrorSeverity(this.state.error);
      const suggestions = this.getSuggestions(this.state.error);

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-red-900">
                      Automation System Error
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}>
                        {errorType}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Error ID: {this.state.errorId}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Message */}
              <Alert variant="destructive">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Error Details:</div>
                  <div className="text-sm">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Suggested Actions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-4">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button onClick={this.handleReload} variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Supabase Dashboard
                </Button>

                <Button 
                  onClick={this.copyErrorDetails}
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Error Details
                </Button>
              </div>

              {/* Technical Details Toggle */}
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  {this.state.showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>

                {this.state.showDetails && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-sm text-gray-900 mb-2">Stack Trace:</h5>
                      <pre className="text-xs text-gray-700 overflow-auto max-h-32 font-mono">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                    
                    {this.state.errorInfo?.componentStack && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-sm text-gray-900 mb-2">Component Stack:</h5>
                        <pre className="text-xs text-gray-700 overflow-auto max-h-32 font-mono">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Help Links */}
              <div className="text-center text-sm text-gray-600">
                Need help? Visit our{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => window.open('/setup', '_blank')}
                >
                  setup guide
                </Button>{' '}
                or{' '}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
                >
                  report this issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AutomationErrorBoundary;
