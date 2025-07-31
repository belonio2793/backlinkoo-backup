/**
 * Direct OpenAI Connection Test - Bypass all detection and connect directly
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  RefreshCw,
  TestTube
} from 'lucide-react';
import { safeNetlifyFetch } from '@/utils/netlifyFunctionHelper';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  responseTime?: number;
  models?: number;
  timestamp: Date;
}

export function DirectOpenAITest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testDirectConnection = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Test 1: Check API status via Netlify function
      console.log('🔍 Testing OpenAI via Netlify function...');
      const statusResult = await safeNetlifyFetch('api-status');
      
      if (statusResult.success && statusResult.data?.providers?.OpenAI?.configured) {
        console.log('✅ OpenAI detected as configured in Netlify');
        
        // Test 2: Try to generate actual content to verify it works
        console.log('🚀 Testing content generation...');
        const generateResult = await safeNetlifyFetch('generate-openai', {
          method: 'POST',
          body: JSON.stringify({
            prompt: 'Write a one sentence test response to verify OpenAI API connectivity.',
            max_tokens: 50
          })
        });

        const responseTime = Date.now() - startTime;

        if (generateResult.success && generateResult.data) {
          setResult({
            success: true,
            message: 'OpenAI API fully operational - content generation successful',
            details: {
              statusCheck: '✅ Configured',
              contentGeneration: '✅ Working', 
              response: generateResult.data.content || generateResult.data,
              environment: 'Production Netlify Functions'
            },
            responseTime,
            timestamp: new Date()
          });
        } else {
          setResult({
            success: false,
            message: 'OpenAI configured but content generation failed',
            details: {
              statusCheck: '✅ Configured',
              contentGeneration: '❌ Failed',
              error: generateResult.error || 'Unknown error',
              environment: 'Production Netlify Functions'
            },
            responseTime,
            timestamp: new Date()
          });
        }
      } else {
        // Test 3: Try check-ai-provider function as backup
        console.log('🔄 Trying alternative AI provider check...');
        const providerResult = await safeNetlifyFetch('check-ai-provider');
        
        const responseTime = Date.now() - startTime;
        
        if (providerResult.success) {
          setResult({
            success: true,
            message: 'OpenAI API accessible via AI provider endpoint',
            details: {
              method: 'AI Provider Check',
              response: providerResult.data,
              environment: 'Production Netlify Functions'
            },
            responseTime,
            timestamp: new Date()
          });
        } else {
          setResult({
            success: false,
            message: 'OpenAI API not accessible - configuration issue',
            details: {
              statusResult: statusResult.data || statusResult.error,
              providerResult: providerResult.error,
              environment: 'Production Netlify Functions'
            },
            responseTime,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setResult({
        success: false,
        message: `Direct connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        responseTime,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIModels = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Test by calling a function that lists available models
      console.log('📋 Testing OpenAI models endpoint...');
      
      const result = await safeNetlifyFetch('generate-openai', {
        method: 'POST',
        body: JSON.stringify({
          action: 'list_models' // Special action to list models instead of generating content
        })
      });

      const responseTime = Date.now() - startTime;

      if (result.success) {
        setResult({
          success: true,
          message: 'OpenAI models endpoint accessible',
          details: {
            modelsEndpoint: '✅ Accessible',
            response: result.data,
            environment: 'Production OpenAI API'
          },
          responseTime,
          timestamp: new Date()
        });
      } else {
        setResult({
          success: false,
          message: 'OpenAI models endpoint failed',
          details: {
            error: result.error,
            environment: 'Production OpenAI API'
          },
          responseTime,
          timestamp: new Date()
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setResult({
        success: false,
        message: `Models test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <span>Direct OpenAI Connection Test</span>
            <p className="text-sm font-normal text-muted-foreground mt-1">
              Bypass detection and test OpenAI API directly via production environment
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={testDirectConnection} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Testing...' : 'Test Direct Connection'}
          </Button>
          
          <Button 
            onClick={testOpenAIModels} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Models
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <Badge 
                  className={
                    result.success 
                      ? "bg-green-100 text-green-800 border-green-300" 
                      : "bg-red-100 text-red-800 border-red-300"
                  }
                >
                  {result.success ? 'Connected' : 'Failed'}
                </Badge>
              </div>
              
              {result.responseTime && (
                <span className="text-xs text-muted-foreground">
                  {result.responseTime}ms
                </span>
              )}
            </div>

            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                <div className="space-y-2">
                  <div className="font-medium">{result.message}</div>
                  
                  {result.details && (
                    <div className="text-xs space-y-1">
                      {Object.entries(result.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start gap-2">
                          <span className="font-medium min-w-0 shrink-0">{key}:</span>
                          <span className="break-all text-right max-w-[300px]">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-75">
                    Last tested: {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded border">
          <div className="font-medium mb-2">🔧 Direct Connection Tests:</div>
          <ul className="space-y-1">
            <li>• <strong>Test Direct Connection:</strong> Verifies API status and tries content generation</li>
            <li>• <strong>Test Models:</strong> Checks if OpenAI models endpoint is accessible</li>
            <li>• Uses production Netlify functions with real environment variables</li>
            <li>• Bypasses all frontend detection - tests actual backend connectivity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
