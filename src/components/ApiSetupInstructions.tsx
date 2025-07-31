import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Key, 
  ExternalLink, 
  AlertCircle,
  CheckCircle2,
  Copy
} from 'lucide-react';

export function ApiSetupInstructions() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Key className="h-5 w-5" />
          OpenAI API Key Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No valid OpenAI API key detected.</strong> The system is currently using local fallback templates for content generation.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold text-orange-900">To enable AI-powered content generation:</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Step 1</Badge>
              <span className="text-sm">Get your OpenAI API key</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-8"
              onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open OpenAI Platform
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Step 2</Badge>
              <span className="text-sm">Set environment variable</span>
            </div>
            <div className="ml-8 bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm flex items-center justify-between">
              <span>OPENAI_API_KEY=sk-your-api-key-here</span>
              <Button
                size="sm"
                variant="outline"
                className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => copyToClipboard('OPENAI_API_KEY=sk-your-api-key-here')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Step 3</Badge>
              <span className="text-sm">Restart the development server</span>
            </div>
            <p className="ml-8 text-sm text-muted-foreground">
              The system will automatically detect and use your new API key.
            </p>
          </div>
        </div>

        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Good news:</strong> The system still works perfectly with local templates! You'll get high-quality content even without an OpenAI key.
          </AlertDescription>
        </Alert>

        <div className="border-t pt-4">
          <h5 className="font-medium text-sm mb-2">Alternative: Use DevServerControl</h5>
          <p className="text-sm text-muted-foreground">
            You can also set the API key using the DevServerControl tool with the set_env_variable function.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
