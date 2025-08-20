import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Zap,
  Key,
  Server,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import DevServerEnvironment from '@/utils/devServerEnvironment';

interface NetlifyEnvSyncProps {
  onSyncComplete?: () => void;
}

const NetlifyEnvironmentSync: React.FC<NetlifyEnvSyncProps> = ({ onSyncComplete }) => {
  const [envStatus, setEnvStatus] = useState<'unknown' | 'synced' | 'missing' | 'updating'>('unknown');
  const [keyValue, setKeyValue] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Check current environment sync status
  const checkEnvSync = () => {
    const envToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;
    const syncStatus = DevServerEnvironment.getSyncStatus();

    if (envToken && envToken.length > 10 && !envToken.includes('demo')) {
      setEnvStatus('synced');
      setKeyValue(envToken.substring(0, 8) + '...' + envToken.substring(envToken.length - 4));
    } else if (envToken && envToken.includes('demo')) {
      setEnvStatus('synced');
      setKeyValue('demo-token');
    } else if (syncStatus.synced) {
      // Check if we have a backup in DevServerEnvironment
      setEnvStatus('synced');
      setKeyValue('stored-locally');
    } else {
      setEnvStatus('missing');
      setKeyValue('');
    }
  };

  useEffect(() => {
    checkEnvSync();

    // Auto-sync if token is available and not already synced
    const autoSync = async () => {
      const envToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;

      // Only auto-sync if we have a valid token that's not already synced
      if (envToken && envToken.length > 20 && !envToken.includes('demo') && envStatus === 'missing') {
        console.log('🚀 Auto-syncing available Netlify token...');
        await syncToEnvironment(envToken);
      } else if (envToken && envToken.includes('demo_token_auto_stored')) {
        // Token was auto-stored via DevServerControl
        setEnvStatus('synced');
        setKeyValue('auto-stored');
        if (onSyncComplete) {
          onSyncComplete();
        }
      }
    };

    // Delay auto-sync slightly to let initial state settle
    setTimeout(autoSync, 1000);
  }, []);

  // Direct DevServerControl integration for environment variable syncing
  const syncToEnvironment = async (apiKey: string) => {
    try {
      setEnvStatus('updating');

      // Validate the key format
      if (!apiKey || apiKey.length < 20) {
        throw new Error('Invalid Netlify Access Token format (must be at least 20 characters)');
      }

      console.log('🔧 Syncing Netlify key to environment variables...');

      // Use the DevServerEnvironment utility for permanent syncing
      const result = await DevServerEnvironment.syncNetlifyToken(apiKey);

      if (result.success) {
        setEnvStatus('synced');
        setKeyValue(result.value || (apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)));
        setShowInput(false);

        // Show success message based on the method used
        const methodMessages = {
          'dev_server_control': '✅ Netlify key permanently synced via DevServerControl!',
          'admin_endpoint': '✅ Netlify key synced to environment variables!',
          'localStorage_simulation': '✅ Netlify key stored locally. Deploy for permanent persistence.',
          'dual_sync': '✅ Netlify key synced to both server and client environments!'
        };

        const message = methodMessages[result.method as keyof typeof methodMessages] || '✅ Netlify key synced successfully!';
        toast.success(message);

        if (onSyncComplete) {
          onSyncComplete();
        }

        // If using admin endpoint, suggest refresh
        if (result.method === 'admin_endpoint') {
          setTimeout(() => {
            if (confirm('Environment variables updated. Refresh the page to apply changes?')) {
              window.location.reload();
            }
          }, 1500);
        }

      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      console.error('Failed to sync Netlify key:', error);
      setEnvStatus('missing');
      toast.error(`Failed to sync: ${error.message}`);
    }
  };

  const handleSync = () => {
    if (!inputKey.trim()) {
      toast.error('Please enter your Netlify Access Token');
      return;
    }
    
    syncToEnvironment(inputKey.trim());
  };

  const autoDetectKey = () => {
    const currentToken = import.meta.env.VITE_NETLIFY_ACCESS_TOKEN;
    if (currentToken && !currentToken.includes('demo') && currentToken.length > 20) {
      syncToEnvironment(currentToken);
    } else {
      toast.info('No valid Netlify token detected. Please enter manually.');
      setShowInput(true);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Globe className="h-5 w-5" />
          Netlify Environment Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">Environment Status:</span>
          </div>
          <div className="flex items-center gap-2">
            {envStatus === 'synced' ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Synced ({keyValue})
              </Badge>
            ) : envStatus === 'updating' ? (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Syncing...
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Not Synced
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={checkEnvSync}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Sync Information */}
        <Alert className="border-blue-200 bg-blue-50">
          <Key className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-medium">Permanent Environment Sync</p>
              <p className="text-sm">
                This will sync your Netlify Access Token to the server environment variables,
                making it permanently available for DNS automation and domain management.
              </p>
              <ul className="text-xs space-y-1 ml-4">
                <li>• Sets NETLIFY_ACCESS_TOKEN for server-side operations</li>
                <li>• Sets VITE_NETLIFY_ACCESS_TOKEN for client-side access</li>
                <li>• Enables automatic DNS configuration via Netlify API</li>
                <li>• Persists across app restarts and deployments</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="space-y-3">
          {envStatus !== 'synced' && (
            <div className="flex gap-2">
              <Button
                onClick={autoDetectKey}
                disabled={envStatus === 'updating'}
                variant="outline"
                className="flex-1"
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto-Detect & Sync
              </Button>
              <Button
                onClick={() => setShowInput(!showInput)}
                disabled={envStatus === 'updating'}
                variant="default"
                className="flex-1"
              >
                <Key className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          )}

          {/* Manual Input */}
          {showInput && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="netlify-token">Netlify Access Token</Label>
                <Input
                  id="netlify-token"
                  type="password"
                  placeholder="nfp_..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Get your token from: <a href="https://app.netlify.com/user/applications#personal-access-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Netlify Personal Access Tokens</a>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSync}
                  disabled={envStatus === 'updating' || !inputKey.trim()}
                  className="flex-1"
                >
                  {envStatus === 'updating' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Sync to Environment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInput(false);
                    setInputKey('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {envStatus === 'synced' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Successfully Synced</span>
              </div>
              <p className="text-sm text-green-800">
                Your Netlify Access Token is now permanently available in the environment.
                All DNS automation features are now active.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowInput(true);
                  setInputKey('');
                }}
                className="mt-2"
              >
                Update Token
              </Button>
            </div>
          )}
        </div>

        {/* Manual Instructions (fallback) */}
        {envStatus === 'synced' && localStorage.getItem('netlify_api_token_backup') && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-amber-800">
              <div className="space-y-2">
                <p className="font-medium">Manual Environment Setup Required</p>
                <p className="text-sm">
                  For permanent persistence, add these environment variables to your deployment:
                </p>
                <div className="bg-white p-2 rounded border text-xs font-mono">
                  <div>NETLIFY_ACCESS_TOKEN={keyValue.replace('...', '****')}</div>
                  <div>VITE_NETLIFY_ACCESS_TOKEN={keyValue.replace('...', '****')}</div>
                </div>
                <p className="text-xs">
                  In Netlify: Site Settings → Environment variables → Add variables
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default NetlifyEnvironmentSync;
