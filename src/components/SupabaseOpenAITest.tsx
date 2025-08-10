import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Zap,
  Database,
  Shield
} from 'lucide-react';
import { enhancedOpenAI } from '@/services/enhancedOpenAIService';
import { formatErrorForUI } from '@/utils/errorUtils';

export function SupabaseOpenAITest() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingGeneration, setIsTestingGeneration] = useState(false);
  const [connectionResults, setConnectionResults] = useState<any[]>([]);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnections = async () => {
    setIsTestingConnection(true);
    setError(null);
    
    try {
      console.log('🔍 Testing all endpoint connections...');
      const results = await enhancedOpenAI.testConnection();
      setConnectionResults(results);
      
      const workingEndpoints = results.filter(r => r.status);
      if (workingEndpoints.length === 0) {
        setError('No endpoints are currently accessible');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testGeneration = async () => {
    setIsTestingGeneration(true);
    setError(null);
    setGenerationResult(null);
    
    try {
      console.log('🚀 Testing content generation...');
      const result = await enhancedOpenAI.generateContent({
        keyword: 'digital marketing',
        anchorText: 'learn more',
        url: 'https://example.com',
        wordCount: 500,
        contentType: 'test',
        tone: 'professional'
      });
      
      setGenerationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation test failed');
    } finally {
      setIsTestingGeneration(false);
    }
  };

  const getEndpointName = (endpoint: string) => {
    if (endpoint.includes('/functions/v1/')) return 'Supabase Edge';
    if (endpoint.includes('/.netlify/functions/')) return 'Netlify Function';
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Enhanced OpenAI Service Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testConnections}
              disabled={isTestingConnection}
              className="w-full"
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Test Connections
            </Button>
            
            <Button 
              onClick={testGeneration}
              disabled={isTestingGeneration}
              className="w-full"
            >
              {isTestingGeneration ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test Generation
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formatErrorForUI(error)}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Results */}
      {connectionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectionResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.status ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{getEndpointName(result.endpoint)}</div>
                      <div className="text-sm text-gray-500">{result.endpoint}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.status ? "default" : "destructive"}>
                      {result.status ? 'Online' : 'Offline'}
                    </Badge>
                    <Badge variant="outline">
                      {result.responseTime}ms
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Results */}
      {generationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {generationResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <Badge variant={generationResult.success ? "default" : "destructive"}>
                  {generationResult.success ? 'Success' : 'Failed'}
                </Badge>
                <Badge variant="outline">
                  {generationResult.provider}
                </Badge>
                {generationResult.attempts && (
                  <Badge variant="secondary">
                    {generationResult.attempts} attempts
                  </Badge>
                )}
                {generationResult.fallbackUsed && (
                  <Badge variant="outline" className="text-amber-600">
                    Fallback Used
                  </Badge>
                )}
              </div>

              {generationResult.prompt && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Prompt:</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    {generationResult.prompt}
                  </div>
                </div>
              )}

              {generationResult.success && generationResult.content && (
                <div className="space-y-2">
                  <h4 className="font-medium">Generated Content (Preview):</h4>
                  <div className="bg-gray-50 p-4 rounded max-h-40 overflow-y-auto">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: generationResult.content.substring(0, 500) + '...' 
                      }} 
                    />
                  </div>
                </div>
              )}

              {generationResult.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formatErrorForUI(generationResult.error)}</AlertDescription>
                </Alert>
              )}

              {generationResult.usage && (
                <div className="text-sm text-gray-600">
                  <strong>Usage:</strong> {generationResult.usage.tokens} tokens, 
                  ${generationResult.usage.cost?.toFixed(4) || '0.0000'} cost
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Available Prompt Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enhancedOpenAI.getPromptTemplates().map((template, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium mb-2">Template {index + 1}:</div>
                <div className="text-sm font-mono text-gray-700">{template}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
