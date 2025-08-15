import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, ArrowLeft, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BlogErrorBoundaryProps {
  error: Error | string;
  slug?: string;
  onRetry?: () => void;
  showDebugInfo?: boolean;
}

export const BlogErrorBoundary: React.FC<BlogErrorBoundaryProps> = ({ 
  error, 
  slug, 
  onRetry,
  showDebugInfo = false 
}) => {
  const navigate = useNavigate();
  const errorMessage = typeof error === 'string' ? error : error.message;

  const getErrorType = (message: string) => {
    if (message.includes('not found') || message.includes('404')) {
      return 'not_found';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('database') || message.includes('PGRST')) {
      return 'database';
    }
    if (message.includes('RLS') || message.includes('policy')) {
      return 'permission';
    }
    return 'unknown';
  };

  const errorType = getErrorType(errorMessage.toLowerCase());

  const getErrorDetails = () => {
    switch (errorType) {
      case 'not_found':
        return {
          title: 'Blog Post Not Found',
          description: 'This blog post may have been moved, deleted, or expired.',
          suggestion: 'Try browsing our latest posts instead.',
          icon: AlertTriangle,
          color: 'orange'
        };
      case 'network':
        return {
          title: 'Connection Error',
          description: 'Unable to load the blog post due to network issues.',
          suggestion: 'Check your internet connection and try again.',
          icon: RefreshCw,
          color: 'blue'
        };
      case 'database':
        return {
          title: 'Database Error',
          description: 'There was an issue retrieving the blog post from our database.',
          suggestion: 'This is usually temporary. Please try refreshing the page.',
          icon: Bug,
          color: 'red'
        };
      case 'permission':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to view this blog post.',
          suggestion: 'You may need to sign in or this post may be private.',
          icon: AlertTriangle,
          color: 'yellow'
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred while loading the blog post.',
          suggestion: 'Please try refreshing the page or contact support if the issue persists.',
          icon: AlertTriangle,
          color: 'gray'
        };
    }
  };

  const errorDetails = getErrorDetails();
  const IconComponent = errorDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <IconComponent className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {errorDetails.title}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              {errorDetails.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Suggestion:</strong> {errorDetails.suggestion}
              </AlertDescription>
            </Alert>

            {slug && (
              <Alert className="border-gray-200 bg-gray-50">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <strong>Requested:</strong> <code className="text-sm bg-gray-200 px-2 py-1 rounded">{slug}</code>
                </AlertDescription>
              </Alert>
            )}

            {showDebugInfo && (
              <Alert className="border-red-200 bg-red-50">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <strong>Debug Info:</strong>
                  <pre className="text-xs mt-2 p-2 bg-red-100 rounded overflow-auto">
                    {JSON.stringify({ 
                      error: errorMessage, 
                      slug, 
                      timestamp: new Date().toISOString() 
                    }, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => navigate('/blog')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
              
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>

            {errorType === 'not_found' && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500 mb-3">
                  Looking for something specific?
                </p>
                <Button
                  onClick={() => navigate('/blog')}
                  variant="ghost"
                  size="sm"
                >
                  Browse All Posts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogErrorBoundary;
