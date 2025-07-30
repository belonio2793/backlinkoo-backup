import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { debugApiKey, testSpecificApiKey } from '@/utils/debugApiKey';
import { validateAndTestApiKey } from '@/utils/isolatedApiTester';
import { CheckCircle, AlertCircle, Loader2, Key, TestTube, Bug } from 'lucide-react';

export function APIKeyDebugAdvanced() {
  const [loading, setLoading] = useState(false);
  const [testKey, setTestKey] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const runFullDebug = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const result = await debugApiKey();
      setResults(result);
    } catch (error) {
      setResults({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Debug failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const testCustomKey = async () => {
    if (!testKey.trim()) return;

    setTestLoading(true);
    setTestResults(null);

    try {
      // Use isolated tester to avoid response stream conflicts
      const result = await validateAndTestApiKey(testKey.trim());
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusIcon = (success: boolean | null) => {
    if (success === null) return <Bug className="h-5 w-5 text-gray-500" />;
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (success: boolean | null) => {
    if (success === null) return <Badge variant="outline">Not Tested</Badge>;
    return success ? 
      <Badge className="bg-green-100 text-green-800">Valid</Badge> : 
      <Badge className="bg-red-100 text-red-800">Invalid</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Advanced API Key Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Full Debug Section */}
        <div className="space-y-3">
          <Button 
            onClick={runFullDebug} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Full Debug...
              </>
            ) : (
              <>
                <Bug className="mr-2 h-4 w-4" />
                Run Comprehensive Debug
              </>
            )}
          </Button>

          {results && (
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current API Key Status:</span>
                {getStatusBadge(results.success)}
              </div>
              
              <p className="text-sm break-words">
                {results.success ? 
                  `✅ API key is working! ${results.modelsCount} models available.` :
                  `❌ ${results.error}`
                }
              </p>
              
              {results.status && (
                <div className="text-xs text-muted-foreground">
                  HTTP Status: {results.status}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Custom Key Section */}
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium">Test Custom API Key</h4>
          <div className="space-y-2">
            <Label htmlFor="test-key">Enter API Key to Test</Label>
            <Input
              id="test-key"
              type="password"
              placeholder="sk-proj-..."
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          
          <Button 
            onClick={testCustomKey} 
            disabled={testLoading || !testKey.trim()}
            className="w-full"
            variant="outline"
          >
            {testLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test This Key
              </>
            )}
          </Button>

          {testResults && (
            <div className="space-y-2 p-3 border rounded bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Test Result:</span>
                {getStatusIcon(testResults.success)}
              </div>
              
              <p className="text-sm break-words">
                {testResults.success ? 
                  `✅ Key is valid! ${testResults.modelsCount} models available.` :
                  `❌ ${testResults.error || 'Key is invalid'}`
                }
              </p>
              
              {testResults.status && (
                <div className="text-xs text-muted-foreground">
                  HTTP Status: {testResults.status}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-blue-50 rounded">
          <p><strong>Debug Steps:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Run comprehensive debug to check current setup</li>
            <li>Check browser console (F12) for detailed logs</li>
            <li>If invalid, test your API key manually above</li>
            <li>If valid manually, check Supabase configuration</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
