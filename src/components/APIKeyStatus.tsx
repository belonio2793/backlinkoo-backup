import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Key, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface APIKeyStatusProps {
  showWhenConfigured?: boolean;
}

export function APIKeyStatus({ showWhenConfigured = false }: APIKeyStatusProps) {
  const apiKey = import.meta.env.OPENAI_API_KEY || '';
  const isConfigured = apiKey && apiKey.length > 0 && !apiKey.includes('test-key');

  // Only show when not configured, or when explicitly requested
  if (isConfigured && !showWhenConfigured) {
    return null;
  }

  return (
    <Alert className={isConfigured ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        )}
        <AlertDescription className="flex-1">
          {isConfigured ? (
            <span className="text-green-700">
              <strong>OpenAI API configured</strong> - Content generation is ready
            </span>
          ) : (
            <span className="text-orange-700">
              <strong>OpenAI API key required</strong> - Configure your API key to enable content generation
            </span>
          )}
        </AlertDescription>
        {!isConfigured && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              <Key className="h-3 w-3" />
              Get API Key
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </Alert>
  );
}
