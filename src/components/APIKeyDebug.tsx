import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { environmentVariablesService } from '@/services/environmentVariablesService';
import { CheckCircle, AlertCircle, Key, Search } from 'lucide-react';

export function APIKeyDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    const info: any = {};

    try {
      // Check environment variable directly
      info.envVar = {
        value: import.meta.env.VITE_OPENAI_API_KEY,
        preview: import.meta.env.VITE_OPENAI_API_KEY ? `${import.meta.env.VITE_OPENAI_API_KEY.substring(0, 15)}...` : 'Not found',
        exists: !!import.meta.env.VITE_OPENAI_API_KEY
      };

      // Check admin environment variables service
      try {
        const adminKey = await environmentVariablesService.getVariable('VITE_OPENAI_API_KEY');
        info.adminEnvService = {
          value: adminKey,
          preview: adminKey ? `${adminKey.substring(0, 15)}...` : 'Not found',
          exists: !!adminKey
        };
      } catch (error) {
        info.adminEnvService = {
          error: error instanceof Error ? error.message : 'Unknown error',
          exists: false
        };
      }

      // Check localStorage directly
      try {
        const storedVars = localStorage.getItem('admin_env_vars');
        const parsed = storedVars ? JSON.parse(storedVars) : [];
        const openAIVar = parsed.find((v: any) => v.key === 'VITE_OPENAI_API_KEY');
        info.localStorage = {
          rawData: storedVars,
          parsedCount: parsed.length,
          openAIVar: openAIVar,
          preview: openAIVar?.value ? `${openAIVar.value.substring(0, 15)}...` : 'Not found',
          exists: !!openAIVar?.value
        };
      } catch (error) {
        info.localStorage = {
          error: error instanceof Error ? error.message : 'Unknown error',
          exists: false
        };
      }

      // Test all import.meta.env keys
      info.allEnvKeys = Object.keys(import.meta.env).filter(key => 
        key.includes('OPENAI') || key.includes('API') || key.includes('VITE')
      );

      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Debug failed' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebug();
  }, []);

  const renderSource = (title: string, data: any) => (
    <div className="space-y-2 p-3 border rounded">
      <div className="flex items-center gap-2">
        <h4 className="font-medium">{title}</h4>
        {data.exists ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
      {data.error ? (
        <p className="text-sm text-red-600">Error: {data.error}</p>
      ) : (
        <div className="text-sm space-y-1">
          <div><strong>Found:</strong> {data.exists ? 'Yes' : 'No'}</div>
          {data.preview && <div><strong>Preview:</strong> {data.preview}</div>}
          {data.parsedCount !== undefined && <div><strong>Total vars:</strong> {data.parsedCount}</div>}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Debug Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebug} disabled={loading} className="w-full">
          <Search className="mr-2 h-4 w-4" />
          {loading ? 'Debugging...' : 'Run Debug Check'}
        </Button>

        {Object.keys(debugInfo).length > 0 && (
          <div className="space-y-4">
            {debugInfo.envVar && renderSource('Environment Variable (import.meta.env)', debugInfo.envVar)}
            {debugInfo.adminEnvService && renderSource('Admin Environment Service', debugInfo.adminEnvService)}
            {debugInfo.localStorage && renderSource('Local Storage', debugInfo.localStorage)}
            
            {debugInfo.allEnvKeys && (
              <div className="p-3 border rounded">
                <h4 className="font-medium mb-2">All Available Environment Keys</h4>
                <div className="flex flex-wrap gap-1">
                  {debugInfo.allEnvKeys.map((key: string) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {debugInfo.error && (
              <div className="p-3 border border-red-200 rounded bg-red-50">
                <p className="text-red-600">Debug Error: {debugInfo.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
