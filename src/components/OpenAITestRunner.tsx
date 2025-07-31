import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { openAIService } from '../services/api/openai';

export function OpenAITestRunner() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runInternalTest = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      console.log('🧪 Starting internal OpenAI test with random variables...');
      
      // Random test variables
      const testData = {
        keyword: 'productivity tips for remote workers',
        url: 'https://example.com/productivity-guide',
        anchorText: 'learn effective strategies',
        wordCount: 300,
        contentType: 'how-to',
        tone: 'professional'
      };

      console.log('📋 Test Variables:', testData);

      // Test connection first
      console.log('🔍 Testing OpenAI connection...');
      const connectionTest = await openAIService.testConnection();
      console.log('Connection test result:', connectionTest);

      // Test content generation
      console.log('🚀 Testing content generation...');
      const result = await openAIService.generateContent(
        testData.keyword,
        {
          maxTokens: Math.floor(testData.wordCount * 2.5),
          temperature: 0.7
        }
      );

      console.log('✅ OpenAI test completed:', result);
      
      setTestResults({
        connectionTest,
        generationResult: result,
        testData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ OpenAI test error:', error);
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Internal OpenAI Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runInternalTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Test...' : 'Run Internal OpenAI Test'}
        </Button>

        {testResults && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
