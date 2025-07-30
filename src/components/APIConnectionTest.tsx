import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Info, Settings } from 'lucide-react';
import { openAIService } from '@/services/api/openai';
import { SecureConfig } from '@/lib/secure-config';

interface ConnectionStatus {
  status: 'checking' | 'success' | 'error' | 'unconfigured';
  message: string;
  details?: string;
  source?: string;
}

export function APIConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'unconfigured',
    message: 'Click to test API connection',
  });

  const checkAPIConnection = async () => {
    setConnectionStatus({ status: 'checking', message: 'Testing API connection...' });

    try {
      // Check configuration source
      const envKey = import.meta.env.VITE_OPENAI_API_KEY;
      const secureKey = SecureConfig.OPENAI_API_KEY;
      const isConfigured = openAIService.isConfigured();

      let source = 'Not configured';
      if (envKey && envKey.startsWith('sk-')) {
        source = 'Environment Variable (Netlify)';
      } else if (secureKey && secureKey.startsWith('sk-')) {
        source = 'Secure Config (Fallback)';
      }

      console.log('🔍 API Key Configuration Check:', {
        hasEnvKey: Boolean(envKey),
        hasSecureKey: Boolean(secureKey),
        envKeyPreview: envKey ? envKey.substring(0, 8) + '...' : 'None',
        secureKeyPreview: secureKey ? secureKey.substring(0, 8) + '...' : 'None',
        isConfigured,
        source
      });

      if (!isConfigured) {
        setConnectionStatus({
          status: 'unconfigured',
          message: 'OpenAI API key not configured',
          details: 'Please set VITE_OPENAI_API_KEY in Netlify environment variables',
          source: 'None'
        });
        return;
      }

      // Test actual connection
      const connectionTest = await openAIService.testConnection();

      if (connectionTest) {
        setConnectionStatus({
          status: 'success',
          message: 'OpenAI API connected successfully',
          details: 'API key is valid and connection is working',
          source
        });
      } else {
        setConnectionStatus({
          status: 'error',
          message: 'Connection failed',
          details: 'API key may be invalid or OpenAI service is unavailable',
          source
        });
      }

    } catch (error: any) {
      console.error('API connection test failed:', error);
      setConnectionStatus({
        status: 'error',
        message: 'Connection test failed',
        details: error.message || 'Unknown error occurred',
        source: 'Error during test'
      });
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'unconfigured':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'unconfigured':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          OpenAI API Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Configuration Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Environment Variable</div>
            <div className="text-gray-500">
              {import.meta.env.VITE_OPENAI_API_KEY ? 
                `${import.meta.env.VITE_OPENAI_API_KEY.substring(0, 8)}...` : 
                'Not set'
              }
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Configuration Source</div>
            <div className="text-gray-500">
              {connectionStatus.source || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={checkAPIConnection}
          disabled={connectionStatus.status === 'checking'}
          className="w-full"
        >
          {connectionStatus.status === 'checking' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test OpenAI API Connection'
          )}
        </Button>

        {/* Status Display */}
        <Alert className={getStatusColor()}>
          <div className="flex items-start gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <AlertDescription>
                <div className="font-medium">{connectionStatus.message}</div>
                {connectionStatus.details && (
                  <div className="text-sm mt-1 text-gray-600">
                    {connectionStatus.details}
                  </div>
                )}
                {connectionStatus.source && (
                  <Badge variant="outline" className="mt-2">
                    Source: {connectionStatus.source}
                  </Badge>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* Netlify Configuration Instructions */}
        {connectionStatus.status === 'unconfigured' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">How to configure in Netlify:</div>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Go to your Netlify site dashboard</li>
                  <li>Navigate to: Site settings → Environment variables</li>
                  <li>Add: <code className="bg-gray-100 px-1 rounded">VITE_OPENAI_API_KEY</code></li>
                  <li>Set value to your OpenAI API key (starts with sk-)</li>
                  <li>Deploy the site</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Information */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">Debug Information</summary>
          <div className="mt-2 space-y-1 font-mono bg-gray-50 p-2 rounded">
            <div>Environment: {import.meta.env.MODE}</div>
            <div>Has Env Key: {Boolean(import.meta.env.VITE_OPENAI_API_KEY).toString()}</div>
            <div>Has Secure Key: {Boolean(SecureConfig.OPENAI_API_KEY).toString()}</div>
            <div>Service Configured: {openAIService.isConfigured().toString()}</div>
            <div>Timestamp: {new Date().toISOString()}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
