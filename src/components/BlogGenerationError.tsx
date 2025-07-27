import React from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';

interface BlogGenerationErrorProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  targetUrl?: string;
  keyword?: string;
}

export const BlogGenerationError: React.FC<BlogGenerationErrorProps> = ({
  error,
  onRetry,
  onDismiss,
  targetUrl,
  keyword
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const errorMessage = typeof error === 'string' ? error : error.message;
  const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection');
  const is404Error = errorMessage.includes('404') || errorMessage.includes('not found');
  const isJsonError = errorMessage.includes('json') || errorMessage.includes('Response') || errorMessage.includes('body stream');
  const isServerError = errorMessage.includes('500') || errorMessage.includes('server error');

  const getErrorType = () => {
    if (is404Error) return { type: 'Service Unavailable', color: 'destructive' as const };
    if (isNetworkError) return { type: 'Network Issue', color: 'destructive' as const };
    if (isJsonError) return { type: 'Response Error', color: 'destructive' as const };
    if (isServerError) return { type: 'Server Error', color: 'destructive' as const };
    return { type: 'Generation Error', color: 'destructive' as const };
  };

  const getErrorDetails = () => {
    if (is404Error) {
      return {
        title: 'Blog Generation Service Not Found',
        description: 'The blog generation service is currently unavailable. This may be due to a deployment issue.',
        suggestions: [
          'Wait a few minutes and try again',
          'Check if the service has been deployed correctly',
          'Contact support if the issue persists'
        ],
        technicalInfo: 'The /.netlify/functions/generate-post endpoint returned a 404 error.'
      };
    }

    if (isJsonError) {
      return {
        title: 'Response Processing Error',
        description: 'There was an issue processing the response from the blog generation service.',
        suggestions: [
          'Try again in a few moments',
          'Check your internet connection',
          'Clear your browser cache and retry'
        ],
        technicalInfo: 'Failed to parse JSON response or response body was already consumed.'
      };
    }

    if (isNetworkError) {
      return {
        title: 'Network Connection Issue',
        description: 'Unable to connect to the blog generation service.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Disable any VPN or firewall that might be blocking the request'
        ],
        technicalInfo: 'Network request failed or timed out.'
      };
    }

    if (isServerError) {
      return {
        title: 'Server Error',
        description: 'The blog generation service encountered an internal error.',
        suggestions: [
          'Wait a few minutes and try again',
          'Check if all required environment variables are set',
          'Contact support if the error continues'
        ],
        technicalInfo: 'Internal server error (500) from the generation service.'
      };
    }

    return {
      title: 'Blog Generation Failed',
      description: 'An unexpected error occurred while generating your blog post.',
      suggestions: [
        'Try again with different keywords',
        'Check that your target URL is valid and accessible',
        'Contact support if the issue persists'
      ],
      technicalInfo: errorMessage
    };
  };

  const copyErrorDetails = async () => {
    const details = getErrorDetails();
    const errorInfo = `
Error Type: ${getErrorType().type}
Error Message: ${errorMessage}
Target URL: ${targetUrl || 'Not provided'}
Keyword: ${keyword || 'Not provided'}
Technical Info: ${details.technicalInfo}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorInfo);
      setCopied(true);
      toast({
        title: "Error details copied",
        description: "Error information has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy error details to clipboard.",
        variant: "destructive"
      });
    }
  };

  const { type, color } = getErrorType();
  const details = getErrorDetails();

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">{details.title}</CardTitle>
          <Badge variant={color}>{type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">{details.description}</p>
            <p className="text-sm text-muted-foreground">
              <strong>Error:</strong> {errorMessage}
            </p>
          </AlertDescription>
        </Alert>

        <div>
          <h4 className="font-medium mb-2">Suggested Solutions:</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {details.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        {details.technicalInfo && (
          <div className="bg-muted p-3 rounded-md">
            <h5 className="font-medium text-sm mb-1">Technical Information:</h5>
            <p className="text-xs text-muted-foreground font-mono">
              {details.technicalInfo}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {onRetry && (
            <Button onClick={onRetry} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyErrorDetails}
          >
            {copied ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied' : 'Copy Error Details'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href="mailto:support@backlinkoo.com?subject=Blog Generation Error&body=I encountered an error while generating a blog post. Please see the details below:"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>

        {is404Error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>For Developers</AlertTitle>
            <AlertDescription className="text-sm">
              The generate-post function may not be deployed or configured correctly. 
              Check the Netlify Functions dashboard and ensure all environment variables are set.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BlogGenerationError;
