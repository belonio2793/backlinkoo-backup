import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Copy,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OpenAISetupGuideProps {
  onKeyConfigured?: () => void;
}

export function OpenAISetupGuide({ onKeyConfigured }: OpenAISetupGuideProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showKey, setShowKey] = useState(false);

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key || !key.startsWith('sk-')) {
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  };

  const handleValidateKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter an OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    try {
      const valid = await validateApiKey(apiKey);
      setIsValid(valid);
      
      if (valid) {
        toast({
          title: "✅ API Key Valid!",
          description: "Your OpenAI API key is working correctly.",
        });
        
        // Store the key in localStorage for this session
        localStorage.setItem('temp_openai_key', apiKey);
        
        if (onKeyConfigured) {
          onKeyConfigured();
        }
      } else {
        toast({
          title: "❌ Invalid API Key",
          description: "Please check your OpenAI API key and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      setIsValid(false);
      toast({
        title: "❌ Validation Failed",
        description: "Could not validate API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">API Status:</span>
              {isValid === null && (
                <Badge variant="secondary">Not Configured</Badge>
              )}
              {isValid === true && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Working
                </Badge>
              )}
              {isValid === false && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Invalid
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.reload()}
              title="Refresh page"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              To use the AI Live testing interface, you need to configure an OpenAI API key. 
              Follow the steps below to get started.
            </AlertDescription>
          </Alert>

          {/* Step 1: Get API Key */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Get Your OpenAI API Key
            </h3>
            <p className="text-sm text-gray-600 ml-8">
              Visit the OpenAI platform to create or retrieve your API key.
            </p>
            <div className="ml-8">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                OpenAI API Keys
              </Button>
            </div>
          </div>

          {/* Step 2: Enter API Key */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
              Enter Your API Key
            </h3>
            <div className="ml-8 space-y-3">
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                    className="h-8 w-8 p-0"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {apiKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleValidateKey}
                disabled={!apiKey.trim() || isValidating}
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Validate & Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Security Note */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Security Note:</strong> Your API key is stored temporarily in your browser session only. 
              For production use, configure it as an environment variable in your hosting platform.
            </AlertDescription>
          </Alert>

          {/* Success Message */}
          {isValid === true && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ OpenAI API key configured successfully! You can now use the AI Live generator.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
