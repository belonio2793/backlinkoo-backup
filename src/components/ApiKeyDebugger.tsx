import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecureConfig } from '@/lib/secure-config';
import { validateProvidedApiKey, testProvidedApiKey, debugApiKeyIssue } from '@/utils/validateApiKey';
import { 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export function ApiKeyDebugger() {
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  useEffect(() => {
    // API keys are now handled server-side only
    console.log('API keys managed server-side via Netlify functions');
    setCurrentKey('[Server-Side Configured]');
  }, []);

  const handleTest = async () => {
    if (!currentKey) return;

    setTesting(true);
    try {
      const result = await testProvidedApiKey();
      setTestResult({ valid: result.success, error: result.error });
    } catch (error) {
      setTestResult({ valid: false, error: error instanceof Error ? error.message : 'Test failed' });
    }
    setTesting(false);
  };

  const handleSetKey = () => {
    if (newKey.trim()) {
      setCurrentKey(newKey.trim());
      setNewKey('');
      setTestResult(null);
    }
  };

  const getKeyStatus = (key: string) => {
    if (!key) return { status: 'missing', message: 'No API key configured' };
    if (!key.startsWith('sk-')) return { status: 'invalid', message: 'Invalid key format' };
    return { status: 'format-valid', message: 'Key format is valid' };
  };

  const keyStatus = getKeyStatus(currentKey);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Key Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Key Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Current API Key</label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={currentKey}
                readOnly
                placeholder="No API key configured"
                className="font-mono text-sm"
              />
              <Badge 
                variant={keyStatus.status === 'format-valid' ? 'default' : 'destructive'}
              >
                {keyStatus.status === 'missing' && 'Missing'}
                {keyStatus.status === 'invalid' && 'Invalid'}
                {keyStatus.status === 'format-valid' && 'Format OK'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{keyStatus.message}</p>
          </div>

          {/* Test Connection */}
          <div>
            <Button 
              onClick={handleTest} 
              disabled={!currentKey || testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Test API Key
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <Alert variant={testResult.valid ? 'default' : 'destructive'}>
              <div className="flex items-center gap-2">
                {testResult.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {testResult.valid 
                    ? '✅ API key is valid and working!' 
                    : `❌ API key test failed: ${testResult.error}`
                  }
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Set New Key */}
          <div>
            <label className="text-sm font-medium mb-2 block">Set New API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono text-sm"
              />
              <Button onClick={handleSetKey} disabled={!newKey.trim()}>
                Set Key
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Enter a valid OpenAI API key starting with 'sk-'
            </p>
          </div>

          {/* Debug Info */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Debug Information</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>API Configuration: Server-side via Netlify functions</div>
              <div>Security: API keys not exposed to client</div>
              <div>Status: {currentKey ? 'Configured' : 'Not configured'}</div>
              <div>Type: Server-side secure configuration</div>
            </div>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>To fix API key issues:</strong><br/>
              1. Get a valid API key from <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">OpenAI Platform</a><br/>
              2. Enter it above and test<br/>
              3. The system will automatically use the working key
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
