import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Zap,
  Shield,
  Activity,
  Info
} from "lucide-react";
import { multiProviderContentGenerator } from "@/services/multiProviderContentGenerator";

interface ProviderStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function ProviderStatus({ showDetails = false, className = "" }: ProviderStatusProps) {
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadProviderStatus = async () => {
    setIsLoading(true);
    try {
      const status = await multiProviderContentGenerator.testAllProviders();
      setProviderStatus(status);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load provider status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviderStatus();
  }, []);

  const getProviderDisplayName = (provider: string) => {
    const names: Record<string, string> = {
      openai: 'OpenAI GPT',
      cohere: 'Cohere',
      deepai: 'DeepAI'
    };
    return names[provider] || provider;
  };

  const getProviderIcon = (provider: string, isActive: boolean) => {
    const iconClass = `h-4 w-4 ${isActive ? 'text-green-600' : 'text-red-500'}`;
    
    switch (provider) {
      case 'openai':
        return <Zap className={iconClass} />;
      case 'cohere':
        return <Shield className={iconClass} />;
      case 'deepai':
        return <Activity className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const activeProviders = Object.entries(providerStatus).filter(([_, active]) => active);
  const hasAnyProvider = activeProviders.length > 0;

  if (!showDetails && hasAnyProvider) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700">
          {activeProviders.length} AI provider{activeProviders.length > 1 ? 's' : ''} available
        </span>
        <Badge variant="secondary" className="text-xs">
          Multi-Provider ✨
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-800">
            AI Content Providers
          </CardTitle>
          <Button
            onClick={loadProviderStatus}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {Object.entries(providerStatus).map(([provider, isActive]) => (
          <div key={provider} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getProviderIcon(provider, isActive)}
              <span className="text-sm font-medium">
                {getProviderDisplayName(provider)}
              </span>
            </div>
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className={`text-xs ${
                isActive 
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : 'bg-red-100 text-red-700 border-red-300'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        ))}

        {hasAnyProvider ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 text-xs">
              <strong>Intelligent Fallback Active:</strong> Content generation will automatically 
              try multiple providers to ensure success. If one fails, others will be attempted automatically.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 text-xs">
              <strong>No providers configured:</strong> Please configure at least one API key 
              to enable content generation.
            </AlertDescription>
          </Alert>
        )}

        {lastUpdated && (
          <div className="text-xs text-blue-600 text-center">
            Last checked: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
