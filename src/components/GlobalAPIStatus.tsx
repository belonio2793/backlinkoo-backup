import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Key, 
  Brain,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { globalOpenAI } from '@/services/globalOpenAIConfig';
import { useToast } from '@/hooks/use-toast';

export function GlobalAPIStatus() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    checkStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const configured = globalOpenAI.isConfigured();
      const connected = await globalOpenAI.testConnection();
      
      setIsOnline(configured && connected);
      setLastChecked(new Date());
      
      if (configured) {
        setApiKey(globalOpenAI.getMaskedKey());
      }
    } catch (error) {
      setIsOnline(false);
      console.error('Status check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRefresh = async () => {
    await checkStatus();
    toast({
      title: "Status Refreshed",
      description: `OpenAI API is ${isOnline ? 'online' : 'offline'}`,
    });
  };

  const getStatusColor = () => {
    if (isOnline === null) return 'bg-gray-100 text-gray-800 border-gray-200';
    return isOnline 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = () => {
    if (isChecking) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isOnline === null) return <AlertCircle className="h-4 w-4" />;
    return isOnline ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isOnline === null) return 'Checking...';
    return isOnline ? 'Online & Ready' : 'Offline';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Global OpenAI Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Status Display */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">API Status:</span>
            </div>
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* API Key Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">API Key:</span>
          </div>
          <div className="font-mono text-xs bg-gray-100 p-2 rounded border">
            {apiKey || 'Not configured'}
          </div>
        </div>

        {/* Global Configuration Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Globe className="h-4 w-4 text-blue-600" />
            <div className="text-xs">
              <div className="font-medium">Global Access</div>
              <div className="text-gray-600">Available to all users</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <div className="text-xs">
              <div className="font-medium">Secure</div>
              <div className="text-gray-600">Centrally managed</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
            <Zap className="h-4 w-4 text-purple-600" />
            <div className="text-xs">
              <div className="font-medium">High Performance</div>
              <div className="text-gray-600">Direct API calls</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
            <Brain className="h-4 w-4 text-orange-600" />
            <div className="text-xs">
              <div className="font-medium">GPT-3.5 Turbo</div>
              <div className="text-gray-600">Latest model</div>
            </div>
          </div>
        </div>

        {/* Status Details */}
        {lastChecked && (
          <div className="text-xs text-gray-500 text-center">
            Last checked: {lastChecked.toLocaleString()}
          </div>
        )}

        {/* Success Message */}
        {isOnline && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ Global OpenAI configuration is active and working perfectly! 
              All users can now generate content using the centralized API.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {isOnline === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ OpenAI API is not responding. Please check the configuration or try again later.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
