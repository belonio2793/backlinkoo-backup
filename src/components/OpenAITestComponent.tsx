import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { directOpenAI } from '@/services/directOpenAI';
import { OpenAIKeyGuide } from './OpenAIKeyGuide';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function OpenAITestComponent() {
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [keyword, setKeyword] = useState('artificial intelligence');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!targetUrl || !keyword) {
      toast({
        title: "Missing fields",
        description: "Please fill in both URL and keyword",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const content = await directOpenAI.generateBlogPost({
        targetUrl,
        primaryKeyword: keyword,
        wordCount: 1000
      });

      setResult(content);
      toast({
        title: "Content generated!",
        description: "OpenAI successfully generated your content"
      });

    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isConfigured = directOpenAI.isConfigured();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConfigured ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            OpenAI Direct Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured && <OpenAIKeyGuide />}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="artificial intelligence"
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !isConfigured}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Content'
            )}
          </Button>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Title:</strong> {result.title}</p>
                  <p><strong>Word Count:</strong> {result.wordCount}</p>
                  <p><strong>SEO Score:</strong> {result.seoScore}/100</p>
                  <div className="max-h-60 overflow-y-auto border p-3 rounded">
                    <div dangerouslySetInnerHTML={{ __html: result.content }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
