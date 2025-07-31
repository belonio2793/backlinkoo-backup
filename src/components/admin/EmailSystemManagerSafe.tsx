import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { EmailSystemManager } from './EmailSystemManager';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class EmailSystemErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EmailSystemManager error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Email System Manager Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The Email System Manager encountered an error and could not load properly.
                {this.state.error && (
                  <div className="mt-2 text-xs font-mono bg-red-100 p-2 rounded">
                    {this.state.error.message}
                  </div>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              
              <div className="text-sm text-gray-600">
                <p><strong>Possible solutions:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Refresh the page to reload the component</li>
                  <li>Check if all email services are properly configured</li>
                  <li>Verify network connectivity</li>
                  <li>Check browser console for additional error details</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export function EmailSystemManagerSafe() {
  return (
    <EmailSystemErrorBoundary>
      <EmailSystemManager />
    </EmailSystemErrorBoundary>
  );
}
