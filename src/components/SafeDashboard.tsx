import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Dashboard from '@/pages/Dashboard';
import { GuestDashboard } from '@/components/GuestDashboard';

interface SafeDashboardState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class SafeDashboard extends React.Component<{}, SafeDashboardState> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): SafeDashboardState {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error caught by SafeDashboard:', error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < 2) {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        retryCount: this.state.retryCount + 1 
      });
    } else {
      // After 2 retries, show guest dashboard
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background p-8">
          <div className="max-w-md mx-auto mt-20">
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Dashboard Loading Issue</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We're having trouble loading your dashboard. This might be a temporary issue.
                </p>
                
                {this.state.retryCount < 2 ? (
                  <div className="space-y-2">
                    <Button onClick={this.handleRetry} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again ({2 - this.state.retryCount} attempts left)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = '/'}
                    >
                      Go to Home
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Maximum retries reached. Switching to simplified view.
                    </p>
                    <GuestDashboard />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    try {
      return <Dashboard />;
    } catch (error) {
      // Handle immediate render errors
      this.setState({ hasError: true, error: error as Error });
      return null;
    }
  }
}
