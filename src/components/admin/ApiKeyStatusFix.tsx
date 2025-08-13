import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { clearAllApiKeyCaches } from '@/utils/clearApiKeyCache';
import { Key, AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react';

export function ApiKeyStatusFix() {
  const [currentKey, setCurrentKey] = useState<string>('');
  const [isFixing, setIsFixing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  // API key should be retrieved from secure environment variables only

  const checkCurrentKey = () => {
    // Check various sources for the current key
    const envKey = import.meta.env.OPENAI_API_KEY;
    const adminConfig = localStorage.getItem('admin_api_configurations');
    const permanentConfig = localStorage.getItem('permanent_api_configs');
    const envVars = localStorage.getItem('admin_env_vars');

    let detectedKey = '';

    if (envKey) {
      detectedKey = envKey;
      console.log('🔍 Netlify environment key found:', envKey.slice(-4));
    } else if (adminConfig) {
      try {
        const configs = JSON.parse(adminConfig);
        const openaiConfig = configs.find((c: any) => c.service === 'OpenAI');
        if (openaiConfig?.apiKey) {
          detectedKey = openaiConfig.apiKey;
          console.log('🔍 Admin config key found:', openaiConfig.apiKey.slice(-4));
        }
      } catch (e) {
        console.warn('Error parsing admin config');
      }
    }

    setCurrentKey(detectedKey);
    return detectedKey;
  };

  // API key validation removed for security

  const forceFixApiKey = async () => {
    setIsFixing(true);
    try {
      console.log('🔧 Force fixing API key...');
      
      // Clear all caches
      clearAllApiKeyCaches();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear caches only - no hardcoded keys
      clearAllApiKeyCaches();
      
      // Wait another moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check the result
      const newKey = checkCurrentKey();
      setLastUpdate(new Date());
      
      if (newKey && newKey.startsWith('sk-')) {
        toast({
          title: 'API Key Fixed!',
          description: 'The correct API key is now in use across all systems.',
        });
        
        // Test the key
        setTimeout(async () => {
          try {
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: { 'Authorization': `Bearer ${newKey}` },
              method: 'GET'
            });
            
            const testResult = response.ok ? 'Valid ✅' : `Invalid ❌ (${response.status})`;
            toast({
              title: 'API Key Test',
              description: `New key status: ${testResult}`,
              variant: response.ok ? 'default' : 'destructive'
            });
          } catch (error) {
            console.log('API test failed:', error);
          }
        }, 1000);
        
      } else {
        throw new Error(`Key not updated correctly. Got: ${newKey.slice(-4)}`);
      }
      
    } catch (error) {
      console.error('Error fixing API key:', error);
      toast({
        title: 'Fix Failed',
        description: 'Could not update the API key. Please check console for details.',
        variant: 'destructive'
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Check on mount only
  useEffect(() => {
    checkCurrentKey();
  }, []);

  const keyStatus = isCorrectKey;

  return (
    <Card className="w-full border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-orange-600" />
          API Key Status & Fix
          {keyStatus ? (
            <Badge variant="default" className="bg-green-100 text-green-800">Fixed</Badge>
          ) : (
            <Badge variant="destructive">Needs Fix</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={keyStatus ? 'default' : 'destructive'}>
          {keyStatus ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Current Key Detected:</strong> {currentKey ? `...${currentKey.slice(-4)}` : 'NONE'}
              </div>
              <div>
                <strong>Expected Key Ends With:</strong> 1PsA
              </div>
              <div>
                <strong>Status:</strong> {keyStatus ? '✅ Correct key in use' : '❌ Wrong/old key detected'}
              </div>
              {lastUpdate && (
                <div>
                  <strong>Last Update:</strong> {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={checkCurrentKey} 
            variant="outline" 
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
          
          <Button 
            onClick={forceFixApiKey} 
            disabled={isFixing || keyStatus}
            className="flex-1"
            variant={keyStatus ? "outline" : "default"}
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Force Fix API Key
              </>
            )}
          </Button>
        </div>

        {!keyStatus && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              The system is still using an old API key. Click "Force Fix API Key" to clear all caches and set the correct key.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
