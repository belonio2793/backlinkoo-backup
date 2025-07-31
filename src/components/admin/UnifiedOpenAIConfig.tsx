import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { environmentVariablesService } from '@/services/environmentVariablesService';
import {
  Brain,
  Key,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Zap
} from 'lucide-react';

interface OpenAIConfig {
  apiKey: string;
  isConfigured: boolean;
  isValid: boolean | null;
  lastTested: Date | null;
}

export function UnifiedOpenAIConfig() {
  const [config, setConfig] = useState<OpenAIConfig>({
    apiKey: '',
    isConfigured: false,
    isValid: null,
    lastTested: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOpenAIConfig();
  }, []);

  const loadOpenAIConfig = async () => {
    setIsLoading(true);
    try {
      const apiKey = await environmentVariablesService.getOpenAIKey();
      setConfig({
        apiKey: apiKey || '',
        isConfigured: Boolean(apiKey && apiKey.startsWith('sk-')),
        isValid: null,
        lastTested: null
      });
      setTempApiKey(apiKey || '');
    } catch (error) {
      console.error('Error loading OpenAI config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!tempApiKey.trim()) {
      toast({
        title: 'Invalid API Key',
        description: 'Please enter a valid OpenAI API key',
        variant: 'destructive'
      });
      return;
    }

    if (!tempApiKey.startsWith('sk-')) {
      toast({
        title: 'Invalid Format',
        description: 'OpenAI API keys should start with "sk-"',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await environmentVariablesService.saveVariable(
        'VITE_OPENAI_API_KEY',
        tempApiKey.trim(),
        'OpenAI API key for AI content generation and blog creation - GLOBAL CONFIGURATION',
        true
      );

      if (success) {
        // Force refresh the environment variables cache
        await environmentVariablesService.refreshCache();
        
        setConfig(prev => ({
          ...prev,
          apiKey: tempApiKey.trim(),
          isConfigured: true,
          isValid: null
        }));
        
        setIsEditing(false);
        
        toast({
          title: 'OpenAI API Key Saved',
          description: 'Your OpenAI API key has been saved and will sync across the entire application',
        });

        // Auto-test the key after saving
        setTimeout(() => testApiKey(), 1000);
      } else {
        throw new Error('Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving OpenAI API key:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Save Failed',
        description: `Failed to save OpenAI API key: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testApiKey = async () => {
    const keyToTest = config.apiKey || tempApiKey;
    if (!keyToTest) {
      toast({
        title: 'No API Key',
        description: 'Please enter an API key first',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${keyToTest}` },
        method: 'GET'
      });

      const isValid = response.ok;
      setConfig(prev => ({
        ...prev,
        isValid,
        lastTested: new Date()
      }));

      toast({
        title: isValid ? 'API Key Valid' : 'API Key Invalid',
        description: isValid 
          ? 'Your OpenAI API key is working correctly' 
          : `API key test failed: ${response.status} ${response.statusText}`,
        variant: isValid ? 'default' : 'destructive'
      });
    } catch (error) {
      setConfig(prev => ({
        ...prev,
        isValid: false,
        lastTested: new Date()
      }));
      
      toast({
        title: 'Test Failed',
        description: 'Failed to test API key. Please check your connection.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (!config.isConfigured) {
      return <Badge variant="destructive">Not Configured</Badge>;
    }
    if (config.isValid === null) {
      return <Badge variant="secondary">Not Tested</Badge>;
    }
    if (config.isValid) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Valid</Badge>;
    }
    return <Badge variant="destructive">Invalid</Badge>;
  };

  const getStatusIcon = () => {
    if (!config.isConfigured) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (config.isValid === null) {
      return <Key className="h-5 w-5 text-gray-500" />;
    }
    if (config.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 10) return '•'.repeat(key.length);
    return key.substring(0, 7) + '•'.repeat(Math.max(key.length - 14, 8)) + key.slice(-7);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          OpenAI API Configuration
          <Badge variant="outline" className="ml-auto">Global Setting</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="font-medium">API Key Status</div>
              <div className="text-sm text-muted-foreground">
                This setting affects all AI features across the application
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* API Key Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="openai-key" className="text-base font-medium">
              OpenAI API Key
            </Label>
            <div className="flex gap-2">
              {config.isConfigured && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testApiKey()}
                disabled={isTesting || (!config.apiKey && !tempApiKey)}
              >
                {isTesting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) {
                    setTempApiKey(config.apiKey);
                  }
                }}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-proj-..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button
                  onClick={saveApiKey}
                  disabled={isLoading || !tempApiKey.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save & Sync Globally
                </Button>
              </div>
            </div>
          ) : (
            <div className="font-mono bg-gray-100 p-3 rounded border text-sm">
              {config.apiKey 
                ? (showKey ? config.apiKey : maskApiKey(config.apiKey))
                : 'No API key configured'
              }
            </div>
          )}
        </div>

        {/* Test Results */}
        {config.lastTested && (
          <Alert className={config.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {config.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className="font-medium">
                {config.isValid ? 'API Key Verified' : 'API Key Invalid'}
              </div>
              <div className="text-sm">
                Last tested: {config.lastTested.toLocaleString()}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Instructions */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">This is the master OpenAI configuration</div>
              <div className="text-sm">
                • This API key will be used across all AI features: blog generation, content creation, etc.
                <br />
                • Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>
                <br />
                • Changes sync immediately across the entire application
                <br />
                • Keep your API key secure and never share it publicly
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        {!config.isConfigured && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              Configure OpenAI API Key
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
