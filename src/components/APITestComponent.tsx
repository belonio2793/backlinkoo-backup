import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { huggingFaceService } from '@/services/api/huggingface';
import { cohereService } from '@/services/api/cohere';
import { enhancedAIContentEngine } from '@/services/enhancedAIContentEngine';

export function APITestComponent() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAPIs = async () => {
    setIsLoading(true);
    setTestResults(null);

    const results: any = {
      huggingface: { configured: false, tested: false, success: false, content: '' },
      cohere: { configured: false, tested: false, success: false, content: '' },
      contentGeneration: { tested: false, success: false, provider: '', content: '' }
    };

    // Test HuggingFace
    console.log('🧪 Testing HuggingFace...');
    results.huggingface.configured = huggingFaceService.isConfigured();
    
    if (results.huggingface.configured) {
      try {
        results.huggingface.tested = true;
        const hfResult = await huggingFaceService.generateText('Write about digital marketing', {
          model: 'microsoft/DialoGPT-large',
          maxLength: 200,
          temperature: 0.7
        });
        results.huggingface.success = hfResult.success;
        results.huggingface.content = hfResult.content;
        results.huggingface.error = hfResult.error;
      } catch (error) {
        results.huggingface.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Test Cohere
    console.log('🧪 Testing Cohere...');
    results.cohere.configured = cohereService.isConfigured();
    
    if (results.cohere.configured) {
      try {
        results.cohere.tested = true;
        const cohereResult = await cohereService.generateText('Write about SEO optimization', {
          model: 'command',
          maxTokens: 200,
          temperature: 0.7
        });
        results.cohere.success = cohereResult.success;
        results.cohere.content = cohereResult.content;
        results.cohere.error = cohereResult.error;
      } catch (error) {
        results.cohere.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Test Enhanced Content Generation
    console.log('🧪 Testing Enhanced Content Generation...');
    try {
      results.contentGeneration.tested = true;
      const contentResult = await enhancedAIContentEngine.generateContent({
        keyword: 'digital marketing',
        targetUrl: 'https://example.com',
        anchorText: 'marketing tools',
        contentLength: 'short',
        seoFocus: 'high'
      });
      
      results.contentGeneration.success = !!contentResult.finalContent;
      results.contentGeneration.provider = contentResult.selectedProvider;
      results.contentGeneration.content = contentResult.finalContent.substring(0, 500) + '...';
      results.contentGeneration.wordCount = contentResult.metadata.wordCount;
      results.contentGeneration.seoScore = contentResult.metadata.seoScore;
    } catch (error) {
      results.contentGeneration.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>API Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testAPIs} disabled={isLoading} className="w-full">
          {isLoading ? 'Testing APIs...' : 'Test HuggingFace & Cohere Integration'}
        </Button>

        {testResults && (
          <div className="space-y-4">
            {/* HuggingFace Results */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">HuggingFace API</h3>
                <Badge variant={testResults.huggingface.configured ? "default" : "secondary"}>
                  {testResults.huggingface.configured ? 'Configured' : 'Not Configured'}
                </Badge>
                {testResults.huggingface.tested && (
                  <Badge variant={testResults.huggingface.success ? "default" : "destructive"}>
                    {testResults.huggingface.success ? 'Success' : 'Failed'}
                  </Badge>
                )}
              </div>
              {testResults.huggingface.content && (
                <p className="text-sm text-muted-foreground">{testResults.huggingface.content}</p>
              )}
              {testResults.huggingface.error && (
                <p className="text-sm text-red-600">Error: {testResults.huggingface.error}</p>
              )}
            </div>

            {/* Cohere Results */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">Cohere API</h3>
                <Badge variant={testResults.cohere.configured ? "default" : "secondary"}>
                  {testResults.cohere.configured ? 'Configured' : 'Not Configured'}
                </Badge>
                {testResults.cohere.tested && (
                  <Badge variant={testResults.cohere.success ? "default" : "destructive"}>
                    {testResults.cohere.success ? 'Success' : 'Failed'}
                  </Badge>
                )}
              </div>
              {testResults.cohere.content && (
                <p className="text-sm text-muted-foreground">{testResults.cohere.content}</p>
              )}
              {testResults.cohere.error && (
                <p className="text-sm text-red-600">Error: {testResults.cohere.error}</p>
              )}
            </div>

            {/* Content Generation Results */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">Enhanced Content Generation</h3>
                <Badge variant={testResults.contentGeneration.success ? "default" : "destructive"}>
                  {testResults.contentGeneration.success ? 'Success' : 'Failed'}
                </Badge>
                {testResults.contentGeneration.provider && (
                  <Badge variant="outline">
                    Provider: {testResults.contentGeneration.provider}
                  </Badge>
                )}
              </div>
              
              {testResults.contentGeneration.success && (
                <div className="space-y-2">
                  <div className="flex gap-4 text-sm">
                    <span>Words: {testResults.contentGeneration.wordCount}</span>
                    <span>SEO Score: {testResults.contentGeneration.seoScore}/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                    {testResults.contentGeneration.content}
                  </p>
                </div>
              )}
              
              {testResults.contentGeneration.error && (
                <p className="text-sm text-red-600">Error: {testResults.contentGeneration.error}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
