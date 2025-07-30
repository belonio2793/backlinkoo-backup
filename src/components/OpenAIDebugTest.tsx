import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { OpenAIService } from '@/services/api/openai';

export const OpenAIDebugTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const openAIService = new OpenAIService();
  const isConfigured = openAIService.isConfigured();

  const runSimpleTest = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🧪 Starting OpenAI API debug test...');
      
      // Test with a simple prompt
      const result = await openAIService.generateContent(
        'Write a single paragraph about cats. Keep it under 100 words.',
        {
          model: 'gpt-3.5-turbo',
          maxTokens: 150,
          temperature: 0.7
        }
      );

      console.log('🧪 OpenAI test result:', result);
      setTestResult(result);

      if (!result.success) {
        setError(result.error || 'Unknown error occurred');
      }

    } catch (error: any) {
      console.error('🧪 OpenAI test failed:', error);
      setError(error.message || 'Test failed with unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConfigured ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          OpenAI API Debug Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              OpenAI API key is not configured properly.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            This will test if the OpenAI API is working correctly.
          </p>
          
          <Button 
            onClick={runSimpleTest}
            disabled={!isConfigured || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing OpenAI API...
              </>
            ) : (
              'Run OpenAI Test'
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Test Failed:</div>
              <div className="text-sm mt-1">{error}</div>
            </AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-sm text-gray-700 mb-2">Test Results:</div>
              <div className="space-y-1 text-xs">
                <div>✅ Success: {testResult.success ? 'Yes' : 'No'}</div>
                <div>📊 Tokens: {testResult.usage?.tokens || 0}</div>
                <div>💰 Cost: ${testResult.usage?.cost || 0}</div>
                {testResult.error && <div>❌ Error: {testResult.error}</div>}
              </div>
            </div>

            {testResult.success && testResult.content && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-sm text-green-700 mb-2">Generated Content:</div>
                <div className="text-sm text-gray-700">{testResult.content}</div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <div>API Key Configured: {isConfigured ? 'Yes' : 'No'}</div>
          <div>Environment: {import.meta.env.VITE_OPENAI_API_KEY ? 'Set' : 'Not set'}</div>
        </div>
      </CardContent>
    </Card>
  );
};
