import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { openAIContentGenerator } from '@/services/openAIContentGenerator';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function OpenAITestComponent() {
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [keyword, setKeyword] = useState('SEO optimization');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const testGeneration = async () => {
    if (!targetUrl || !keyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both target URL and keyword",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const content = await openAIContentGenerator.generateContent({
        targetUrl,
        primaryKeyword: keyword,
        wordCount: 500 // Short test content
      });

      setResult(content);
      toast({
        title: "Content Generated Successfully! 🎉",
        description: `Generated ${content.wordCount} words using OpenAI`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isConfigured = openAIContentGenerator.isConfigured();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            OpenAI Content Generator Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY environment variable to test content generation.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Target URL</label>
              <Input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Primary Keyword</label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="SEO optimization"
              />
            </div>
          </div>

          <Button 
            onClick={testGeneration}
            disabled={!isConfigured || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Content...
              </>
            ) : (
              'Test Content Generation'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Word Count:</strong> {result.wordCount}
              </div>
              <div>
                <strong>SEO Score:</strong> {result.seoScore}/100
              </div>
              <div>
                <strong>Tokens Used:</strong> {result.usage.tokens}
              </div>
              <div>
                <strong>Cost:</strong> ${result.usage.cost.toFixed(4)}
              </div>
            </div>
            
            <div>
              <strong>Title:</strong> {result.title}
            </div>
            
            <div>
              <strong>Meta Description:</strong>
              <p className="text-sm text-gray-600 mt-1">{result.metaDescription}</p>
            </div>

            <div>
              <strong>Content Preview:</strong>
              <div 
                className="mt-2 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto prose prose-sm"
                dangerouslySetInnerHTML={{ __html: result.content.substring(0, 2000) + (result.content.length > 2000 ? '...' : '') }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
