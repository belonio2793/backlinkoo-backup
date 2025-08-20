import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Shield, Zap } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isFullStoryError: boolean;
  isSupabaseError: boolean;
}

export class EmergencyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isFullStoryError: false,
      isSupabaseError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorMessage = error.message || '';
    const errorStack = error.stack || '';
    
    const isFullStoryError = 
      errorMessage.includes('Failed to fetch') ||
      errorStack.includes('fullstory') ||
      errorStack.includes('fs.js') ||
      errorStack.includes('edge.fullstory.com');
    
    const isSupabaseError = 
      errorMessage.includes('supabase') ||
      errorStack.includes('supabase') ||
      errorMessage.includes('auth') ||
      errorMessage.includes('_handleRequest');

    return {
      hasError: true,
      error,
      isFullStoryError,
      isSupabaseError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Log the error
    console.error('🚨 Emergency Error Boundary caught error:', error);
    console.error('📍 Error Info:', errorInfo);

    // If it's a FullStory or Supabase error, trigger emergency recovery
    if (this.state.isFullStoryError || this.state.isSupabaseError) {
      console.log('🔧 Triggering emergency network recovery...');
      this.triggerEmergencyRecovery();
    }
  }

  triggerEmergencyRecovery = async () => {
    try {
      // Import and run emergency recovery
      const { emergencyNetworkRecovery } = await import('@/utils/emergencyFetchFix');
      await emergencyNetworkRecovery();
    } catch (recoveryError) {
      console.error('❌ Emergency recovery failed:', recoveryError);
    }
  };

  fixFullStoryIssues = async () => {
    try {
      const { disableFullStory } = await import('@/utils/emergencyFetchFix');
      disableFullStory();
      
      // Clear the error and reload component
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isFullStoryError: false,
        isSupabaseError: false,
      });
      
      // Force reload after a delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to fix FullStory issues:', error);
    }
  };

  fixSupabaseIssues = async () => {
    try {
      const { fixSupabaseConnection } = await import('@/utils/emergencyFetchFix');
      await fixSupabaseConnection();
      
      // Clear the error
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isFullStoryError: false,
        isSupabaseError: false,
      });
    } catch (error) {
      console.error('❌ Failed to fix Supabase issues:', error);
    }
  };

  reloadPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, isFullStoryError, isSupabaseError } = this.state;
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
          <div className="max-w-2xl mx-auto mt-8">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-6 w-6" />
                  Application Error Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Type Detection */}
                {isFullStoryError && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <div className="space-y-2">
                        <p className="font-medium">FullStory Interference Detected</p>
                        <p className="text-sm">
                          FullStory is interfering with network requests. This is a known issue that can be resolved automatically.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {isSupabaseError && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <div className="space-y-2">
                        <p className="font-medium">Supabase Authentication Error</p>
                        <p className="text-sm">
                          There's an issue with the database connection or authentication. This can be fixed automatically.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Error Details:</h4>
                  <p className="text-sm text-gray-700 font-mono break-all">
                    {error?.message || 'Unknown error occurred'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {isFullStoryError && (
                    <Button 
                      onClick={this.fixFullStoryIssues}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Fix FullStory Issues
                    </Button>
                  )}

                  {isSupabaseError && (
                    <Button 
                      onClick={this.fixSupabaseIssues}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Fix Supabase Connection
                    </Button>
                  )}

                  <Button 
                    onClick={this.triggerEmergencyRecovery}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Recovery
                  </Button>

                  <Button 
                    onClick={this.reloadPage}
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                </div>

                {/* Emergency Instructions */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Emergency Recovery Steps:</p>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        <li>Click "Emergency Recovery" to automatically fix network issues</li>
                        <li>If that doesn't work, try the specific fix buttons above</li>
                        <li>As a last resort, reload the page</li>
                        <li>If issues persist, clear your browser cache and restart</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Debug Information */}
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer font-medium">Show Debug Information</summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded font-mono">
                    <div><strong>Error:</strong> {error?.name || 'Unknown'}</div>
                    <div><strong>Message:</strong> {error?.message || 'None'}</div>
                    <div><strong>FullStory Error:</strong> {isFullStoryError ? 'Yes' : 'No'}</div>
                    <div><strong>Supabase Error:</strong> {isSupabaseError ? 'Yes' : 'No'}</div>
                    <div><strong>Stack:</strong></div>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">
                      {error?.stack?.substring(0, 500) || 'No stack trace'}
                    </pre>
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EmergencyErrorBoundary;
