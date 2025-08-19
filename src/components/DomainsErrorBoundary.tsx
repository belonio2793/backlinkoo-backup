import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, Terminal, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class DomainsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DomainsPage Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  private isDatabaseError(): boolean {
    const message = this.state.error?.message || '';
    return (
      message.includes('does not exist') ||
      message.includes('domain_blog_themes') ||
      message.includes('update_domain_blog_theme') ||
      message.includes('getManualPropagationInstructions')
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDatabaseError = this.isDatabaseError();

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Domains Page Error
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDatabaseError ? (
                  <div className="space-y-4">
                    <Alert className="border-amber-200 bg-amber-50">
                      <Database className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <strong>Database Setup Required:</strong> The domain blog themes system is not set up yet.
                      </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Terminal className="h-4 w-4" />
                        Setup Instructions:
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>1. Add your Supabase service role key to .env:</strong></p>
                        <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
                          SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
                        </code>
                        
                        <p><strong>2. Run the setup command:</strong></p>
                        <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
                          npm run setup:blog-themes
                        </code>
                        
                        <p><strong>3. Restart the development server:</strong></p>
                        <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
                          npm run dev
                        </code>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">What this sets up:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Domain blog themes database table</li>
                        <li>• Theme management functions</li>
                        <li>• Default themes for existing domains</li>
                        <li>• Database security policies</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Application Error:</strong> {this.state.error?.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                </div>

                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Technical Details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                      {this.state.error?.stack}
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DomainsErrorBoundary;
