import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

export function OpenAIKeyGuide() {
  const [showApiKey, setShowApiKey] = useState(false);
  const currentApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isConfigured = currentApiKey && currentApiKey.length > 0 && currentApiKey !== 'test-key-check';

  return (
    <Card className="w-full max-w-2xl mx-auto border-orange-200 bg-gradient-to-br from-orange-50/50 to-yellow-50/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Key className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-lg">OpenAI API Key Configuration</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Required for AI-powered content generation
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border">
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">API Key Configured</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-700">API Key Missing</span>
              </>
            )}
          </div>
          <Badge variant={isConfigured ? "secondary" : "destructive"}>
            {isConfigured ? "Ready" : "Required"}
          </Badge>
        </div>

        {/* Current API Key Display */}
        {currentApiKey && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Current API Key:</label>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border font-mono text-sm">
              <span className="flex-1">
                {showApiKey 
                  ? currentApiKey 
                  : currentApiKey.replace(/./g, '•').substring(0, 20) + '...'
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentApiKey)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {!isConfigured && (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Content generation is disabled.</strong> A valid OpenAI API key is required to generate AI-powered content.
              </AlertDescription>
            </Alert>

            {/* Setup Instructions */}
            <div className="space-y-3">
              <h4 className="font-medium">Setup Instructions:</h4>
              
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <div>
                    <span>Get an OpenAI API key from </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-blue-600"
                      asChild
                    >
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        platform.openai.com/api-keys
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </li>
                
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <div>Set the environment variable in your development environment:</div>
                </li>
              </ol>

              <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span>VITE_OPENAI_API_KEY=sk-your-api-key-here</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('VITE_OPENAI_API_KEY=sk-your-api-key-here')}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Your API key should start with "sk-"</p>
                <p>• Make sure your OpenAI account has sufficient credits</p>
                <p>• Restart the development server after setting the environment variable</p>
              </div>
            </div>
          </>
        )}

        {isConfigured && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>OpenAI API is configured!</strong> You can now generate AI-powered content. Make sure your account has sufficient credits.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Links */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a 
              href="https://platform.openai.com/usage" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              Check Usage
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a 
              href="https://platform.openai.com/account/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              Billing Settings
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
