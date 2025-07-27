import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { productionAIContentManager } from '@/services/productionAIContentManager';
import { CheckCircle, XCircle, Loader2, RefreshCw, Key, Zap } from 'lucide-react';

interface APIStatus {
  name: string;
  key: string;
  configured: boolean;
  working?: boolean;
  description: string;
  icon: string;
}

export function ApiConfigStatus() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([
    {
      name: 'OpenAI',
      key: 'openai',
      configured: false,
      description: 'GPT-4 for high-quality content generation',
      icon: '🤖'
    },
    {
      name: 'Grok (X.AI)',
      key: 'grok',
      configured: false,
      description: 'Real-time AI from X/Twitter',
      icon: '⚡'
    },
    {
      name: 'DeepAI',
      key: 'deepai',
      configured: false,
      description: 'Diverse AI models for content creation',
      icon: '🧠'
    },
    {
      name: 'HuggingFace',
      key: 'huggingface',
      configured: false,
      description: 'Open-source AI models',
      icon: '🤗'
    },
    {
      name: 'Cohere',
      key: 'cohere',
      configured: false,
      description: 'Enterprise-grade language models',
      icon: '🔥'
    },
    {
      name: 'Rytr',
      key: 'rytr',
      configured: false,
      description: 'AI writing assistant',
      icon: '✍️'
    }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkAPIConfigurations();
  }, []);

  const checkAPIConfigurations = () => {
    const updatedStatuses = apiStatuses.map(status => ({
      ...status,
      configured: getAPIKeyStatus(status.key)
    }));
    setApiStatuses(updatedStatuses);
  };

  const getAPIKeyStatus = (key: string): boolean => {
    // Check for environment variables
    const envKeys = {
      openai: process.env.OPENAI_API_KEY || (window as any).OPENAI_API_KEY,
      grok: process.env.GROK_API_KEY || (window as any).GROK_API_KEY,
      deepai: process.env.DEEPAI_API_KEY || (window as any).DEEPAI_API_KEY,
      huggingface: process.env.HUGGINGFACE_TOKEN || (window as any).HUGGINGFACE_TOKEN,
      cohere: process.env.COHERE_API_KEY || (window as any).COHERE_API_KEY,
      rytr: process.env.RYTR_API_KEY || (window as any).RYTR_API_KEY
    };
    
    return Boolean(envKeys[key as keyof typeof envKeys]);
  };

  const testAPIConnections = async () => {
    setIsChecking(true);
    try {
      const results = await enhancedAIContentGenerator.testAPIConnections();
      
      const updatedStatuses = apiStatuses.map(status => ({
        ...status,
        working: results[status.key]
      }));
      
      setApiStatuses(updatedStatuses);
    } catch (error) {
      console.error('Failed to test API connections:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const configuredCount = apiStatuses.filter(status => status.configured).length;
  const workingCount = apiStatuses.filter(status => status.working === true).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          AI API Configuration Status
        </CardTitle>
        <CardDescription>
          Monitor your AI service configurations and test connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{configuredCount}/6</span> APIs configured
            </div>
            {workingCount > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{workingCount}</span> working
              </div>
            )}
          </div>
          <Button
            onClick={testAPIConnections}
            disabled={isChecking || configuredCount === 0}
            size="sm"
            variant="outline"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Test Connections
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {apiStatuses.map((status) => (
            <div
              key={status.key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{status.icon}</span>
                <div>
                  <div className="font-medium text-sm">{status.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {status.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status.configured ? (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600">
                    <XCircle className="h-3 w-3 mr-1" />
                    Missing
                  </Badge>
                )}
                {status.working === true && (
                  <Badge variant="default" className="bg-green-600">
                    <Zap className="h-3 w-3 mr-1" />
                    Working
                  </Badge>
                )}
                {status.working === false && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {configuredCount > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Blog Generation Ready!</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your AI APIs are configured and ready to generate high-quality blog content with contextual backlinks.
            </p>
          </div>
        )}

        {configuredCount === 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">No APIs Configured</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Blog generation will use fallback content. Configure API keys for enhanced AI-powered content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
