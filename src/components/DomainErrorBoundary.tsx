import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class DomainErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Domain Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // No fallback rendering in production - errors should be addressed directly

      const isNetworkError = this.state.error?.message?.includes('Failed to fetch') ||
                           this.state.error?.message?.includes('NetworkError') ||
                           this.state.error?.message?.includes('timeout');

      const isSupabaseError = this.state.error?.message?.includes('supabase') ||
                            this.state.error?.message?.includes('database');

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Something went wrong
              </CardTitle>
              <p className="text-gray-600 mt-2">
                An error occurred while loading the domain management page
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Error Type Specific Messages */}
              {isNetworkError && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <div className="space-y-2">
                      <p className="font-medium">Network Connection Issue</p>
                      <p className="text-sm">This appears to be a network connectivity problem.</p>
                      <div className="mt-2">
                        <p className="text-xs font-medium">Try these steps:</p>
                        <ul className="text-xs list-disc list-inside space-y-1 mt-1">
                          <li>Check your internet connection</li>
                          <li>Disable browser extensions (ad blockers, etc.)</li>
                          <li>Try refreshing the page</li>
                          <li>Switch to a different network if possible</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {isSupabaseError && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="space-y-2">
                      <p className="font-medium">Database Connection Issue</p>
                      <p className="text-sm">There's a problem connecting to the database.</p>
                      <div className="mt-2">
                        <p className="text-xs font-medium">Possible causes:</p>
                        <ul className="text-xs list-disc list-inside space-y-1 mt-1">
                          <li>Temporary database maintenance</li>
                          <li>Network connectivity issues</li>
                          <li>Authentication problems</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Details */}
              <div className="p-4 bg-gray-100 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Error Details</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div>
                    <span className="font-medium">Error:</span> {this.state.error?.message || 'Unknown error'}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {new Date().toLocaleString()}
                  </div>
                  {this.state.error?.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-gray-600">
                        Technical Details (Click to expand)
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/dashboard'} 
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <p>
                  If this problem persists, please contact support with the error details above.
                </p>
                <p className="mt-1">
                  <a 
                    href="mailto:support@backlinkoo.com" 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    support@backlinkoo.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DomainErrorBoundary;
