/**
 * OpenAI Configuration Test Component
 * Tests the OpenAI configuration and blog generation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DirectOpenAIService } from '@/services/directOpenAI';
import { LocalDevAPI } from '@/services/localDevAPI';
import { environmentVariablesService } from '@/services/environmentVariablesService';

export function OpenAIConfigTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      // Check configuration
      const shouldUseMock = LocalDevAPI.shouldUseMockAPI();
      const openaiKey = await environmentVariablesService.getOpenAIKey();
      const hasApiKey = Boolean(openaiKey);

      console.log('🔍 Configuration Check:', {
        shouldUseMock,
        hasApiKey,
        isDev: import.meta.env.DEV
      });

      // Test blog generation with a simple example
      const testRequest = {
        keyword: 'sustainable energy solutions',
        anchorText: 'renewable energy experts',
        targetUrl: 'https://example.com/renewable-energy'
      };

      const result = await DirectOpenAIService.generateBlogPost(testRequest);

      setResults({
        configuration: {
          shouldUseMock,
          hasApiKey,
          isDev: import.meta.env.DEV,
          viteOpenaiKey: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
          openaiKey: Boolean(import.meta.env.OPENAI_API_KEY)
        },
        blogGeneration: {
          success: result.success,
          title: result.title,
          contentLength: result.content?.length || 0,
          error: result.error,
          hasKeyword: result.content?.includes('sustainable energy') || false,
          hasBacklink: result.content?.includes('renewable energy experts') || false,
          isGeneric: result.content?.includes('today\'s digital landscape') || false
        }
      });

    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        configuration: {
          shouldUseMock: LocalDevAPI.shouldUseMockAPI(),
          hasApiKey: Boolean(await environmentVariablesService.getOpenAIKey()),
          isDev: import.meta.env.DEV
        }
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>OpenAI Configuration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test OpenAI Configuration & Blog Generation'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold mb-2">Configuration Status</h3>
              <div className="space-y-1 text-sm">
                <div>Environment: {results.configuration?.isDev ? 'Development' : 'Production'}</div>
                <div>Should Use Mock API: {results.configuration?.shouldUseMock ? '✅ Yes' : '❌ No'}</div>
                <div>Has API Key: {results.configuration?.hasApiKey ? '✅ Yes' : '❌ No'}</div>
                <div>VITE_OPENAI_API_KEY: {results.configuration?.viteOpenaiKey ? '✅ Found' : '❌ Not found'}</div>
                <div>OPENAI_API_KEY: {results.configuration?.openaiKey ? '✅ Found' : '❌ Not found'}</div>
              </div>
            </div>

            {results.blogGeneration && (
              <div className="p-4 border rounded">
                <h3 className="font-semibold mb-2">Blog Generation Test</h3>
                <div className="space-y-1 text-sm">
                  <div>Success: {results.blogGeneration.success ? '✅ Yes' : '❌ No'}</div>
                  {results.blogGeneration.title && (
                    <div>Title: {results.blogGeneration.title}</div>
                  )}
                  <div>Content Length: {results.blogGeneration.contentLength} characters</div>
                  <div>Contains Keyword: {results.blogGeneration.hasKeyword ? '✅ Yes' : '❌ No'}</div>
                  <div>Contains Backlink: {results.blogGeneration.hasBacklink ? '✅ Yes' : '❌ No'}</div>
                  <div>Is Generic Content: {results.blogGeneration.isGeneric ? '❌ Yes (Bad)' : '✅ No (Good)'}</div>
                  {results.blogGeneration.error && (
                    <div className="text-red-600">Error: {results.blogGeneration.error}</div>
                  )}
                </div>
              </div>
            )}

            {results.error && (
              <div className="p-4 border border-red-200 rounded bg-red-50">
                <h3 className="font-semibold mb-2 text-red-700">Error</h3>
                <div className="text-sm text-red-600">{results.error}</div>
              </div>
            )}

            <div className="p-4 border rounded bg-gray-50">
              <h3 className="font-semibold mb-2">Raw Results</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
