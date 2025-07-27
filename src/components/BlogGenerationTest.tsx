import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chatGPTBlogGenerator } from '@/services/chatGPTBlogGenerator';
import { useToast } from '@/hooks/use-toast';

export function BlogGenerationTest() {
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [keyword, setKeyword] = useState('digital marketing');
  const [anchorText, setAnchorText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      console.log('🧪 Testing blog generation with:', {
        destinationURL: targetUrl,
        targetKeyword: keyword,
        anchorText: anchorText || keyword
      });

      const result = await chatGPTBlogGenerator.generateAndPublishBlog({
        destinationURL: targetUrl,
        targetKeyword: keyword,
        anchorText: anchorText || keyword
      });

      console.log('🎉 Test result:', result);
      setResult(result);

      if (result.success) {
        toast({
          title: "✅ Blog Generation Test Successful!",
          description: `Blog post created with slug: ${result.blogPost?.slug}`,
        });
      } else {
        toast({
          title: "❌ Blog Generation Test Failed",
          description: result.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('🚨 Test error:', error);
      toast({
        title: "❌ Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Blog Generation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testTargetUrl">Target URL</Label>
          <Input
            id="testTargetUrl"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="testKeyword">Keyword</Label>
          <Input
            id="testKeyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="digital marketing"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="testAnchorText">Anchor Text (Optional)</Label>
          <Input
            id="testAnchorText"
            value={anchorText}
            onChange={(e) => setAnchorText(e.target.value)}
            placeholder="Leave blank to use keyword"
          />
        </div>

        <Button
          onClick={handleTest}
          disabled={isGenerating || !targetUrl || !keyword}
          className="w-full"
        >
          {isGenerating ? 'Testing...' : 'Test Blog Generation'}
        </Button>

        {result && (
          <Card className={`mt-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Test Result:</h4>
              <pre className="text-sm bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.success && result.livePostURL && (
                <div className="mt-4">
                  <Button
                    onClick={() => window.open(`/blog?slug=${result.blogPost?.slug}`, '_blank')}
                    size="sm"
                  >
                    View Generated Blog Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
