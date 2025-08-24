import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Key,
  Globe,
  Link,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NetlifyConfigStatus {
  hasAccessToken: boolean;
  hasSiteId: boolean;
  edgeFunctionWorking: boolean;
  netlifyApiWorking: boolean;
  lastChecked: string;
}

interface NetlifyConfigHelperProps {
  onConfigurationComplete?: () => void;
}

const NetlifyConfigHelper: React.FC<NetlifyConfigHelperProps> = ({ 
  onConfigurationComplete 
}) => {
  const [configStatus, setConfigStatus] = useState<NetlifyConfigStatus>({
    hasAccessToken: false,
    hasSiteId: false,
    edgeFunctionWorking: false,
    netlifyApiWorking: false,
    lastChecked: new Date().toISOString()
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setIsChecking(true);
    console.log('🔍 Checking Netlify configuration...');

    try {
      // Test edge function
      const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('domains', {
        body: { action: 'sync' }
      });

      const edgeFunctionWorking = !edgeError && edgeResult?.success !== false;
      
      // Test direct Netlify API (if available)
      let netlifyApiWorking = false;
      try {
        const netlifyResponse = await fetch('/netlify/functions/add-domain-to-netlify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'test_config' }),
        });
        netlifyApiWorking = netlifyResponse.ok;
      } catch (netlifyError) {
        console.warn('Direct Netlify API test failed:', netlifyError);
      }

      const newStatus: NetlifyConfigStatus = {
        hasAccessToken: edgeFunctionWorking || !edgeError?.message?.includes('NETLIFY_ACCESS_TOKEN'),
        hasSiteId: edgeFunctionWorking || !edgeError?.message?.includes('NETLIFY_SITE_ID'),
        edgeFunctionWorking,
        netlifyApiWorking,
        lastChecked: new Date().toISOString()
      };

      setConfigStatus(newStatus);

      // Check if configuration is complete
      const isComplete = newStatus.hasAccessToken && newStatus.hasSiteId && newStatus.edgeFunctionWorking;
      
      if (isComplete) {
        toast.success('✅ Netlify configuration is working!');
        setShowInstructions(false);
        onConfigurationComplete?.();
      } else {
        console.warn('⚠️ Netlify configuration incomplete:', newStatus);
        if (edgeError) {
          console.error('Edge function error:', edgeError);
        }
      }

    } catch (error: any) {
      console.error('❌ Configuration check failed:', error);
      toast.error(`Configuration check failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getStatusBadge = (isWorking: boolean, label: string) => {
    return (
      <Badge variant={isWorking ? "default" : "destructive"} className="ml-2">
        {isWorking ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            {label} OK
          </>
        ) : (
          <>
            <AlertTriangle className="h-3 w-3 mr-1" />
            {label} Missing
          </>
        )}
      </Badge>
    );
  };

  const isConfigurationComplete = 
    configStatus.hasAccessToken && 
    configStatus.hasSiteId && 
    configStatus.edgeFunctionWorking;

  if (isConfigurationComplete && !showInstructions) {
    return null; // Hide component when everything is working
  }

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Settings className="h-5 w-5" />
          Netlify Configuration Required
          {getStatusBadge(configStatus.hasAccessToken, "Token")}
          {getStatusBadge(configStatus.hasSiteId, "Site ID")}
          {getStatusBadge(configStatus.edgeFunctionWorking, "Function")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigurationComplete && (
          <Alert className="border-amber-300 bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Setup Required:</strong> Configure Netlify secrets in Supabase to enable domain management.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Supabase Secrets Configuration */}
          <div className="space-y-3">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Step 1: Configure Supabase Secrets
            </h4>
            
            <div className="space-y-2 text-sm">
              <p className="text-amber-800">
                Add these environment variables to your Supabase edge function:
              </p>
              
              <div className="bg-amber-100 border border-amber-300 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono">NETLIFY_ACCESS_TOKEN</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('NETLIFY_ACCESS_TOKEN', 'Environment variable name')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono">NETLIFY_SITE_ID</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('NETLIFY_SITE_ID', 'Environment variable name')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/functions/secrets', '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase Secrets
              </Button>
            </div>
          </div>

          {/* Netlify Token Instructions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Step 2: Get Netlify Credentials
            </h4>
            
            <div className="space-y-2 text-sm text-amber-800">
              <p>Get your Netlify credentials:</p>
              
              <div className="space-y-1">
                <p><strong>Access Token:</strong></p>
                <ol className="list-decimal list-inside text-xs space-y-1 ml-2">
                  <li>Go to Netlify → User Settings → Applications</li>
                  <li>Click "New access token"</li>
                  <li>Copy the generated token</li>
                </ol>
              </div>

              <div className="space-y-1">
                <p><strong>Site ID:</strong></p>
                <p className="text-xs ml-2">
                  From your site settings or use: <code>ca6261e6-0a59-40b5-a2bc-5b5481ac8809</code>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard('ca6261e6-0a59-40b5-a2bc-5b5481ac8809', 'Site ID')}
                  className="mt-1"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Site ID
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://app.netlify.com/user/applications#personal-access-tokens', '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get Netlify Token
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Setup Instructions */}
        <div className="border border-amber-300 rounded p-3 bg-amber-100">
          <h5 className="font-medium text-amber-900 mb-2">Quick Setup:</h5>
          <ol className="list-decimal list-inside text-sm text-amber-800 space-y-1">
            <li>Click "Get Netlify Token" above and create a new access token</li>
            <li>Click "Open Supabase Secrets" and add both variables</li>
            <li>Click "Test Configuration" below to verify setup</li>
          </ol>
        </div>

        {/* Configuration Status */}
        <div className="flex items-center justify-between pt-3 border-t border-amber-300">
          <div className="text-xs text-amber-700">
            Last checked: {new Date(configStatus.lastChecked).toLocaleTimeString()}
          </div>
          
          <div className="flex gap-2">
            {isConfigurationComplete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(false)}
              >
                Hide Instructions
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={checkConfiguration}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Configuration
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {isConfigurationComplete && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Configuration Complete!</strong> Netlify domain management is now active.
              You can now add domains and they will be automatically configured in Netlify.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default NetlifyConfigHelper;
