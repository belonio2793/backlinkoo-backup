/**
 * Minimal AI Test - Ultra-simplified buffer page for testing
 * Clean, minimalistic UI with only essentials
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { aiTestWorkflow } from '@/services/aiTestWorkflow';
import { Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';

export function MinimalAITest() {
  const [keyword, setKeyword] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { toast } = useToast();

  const getCurrentDomain = () => window.location.origin;

  const handleGenerate = async () => {
    if (!keyword.trim() || !url.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both keyword and URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const workflowResult = await aiTestWorkflow.processCompleteWorkflow({
        websiteUrl: url,
        keyword,
        anchorText: keyword,
        sessionId: crypto.randomUUID(),
        currentDomain: getCurrentDomain()
      });

      if (workflowResult.blogResult.success) {
        setResult(workflowResult.blogResult);
        toast({
          title: "Success",
          description: "Backlink article generated",
        });
      } else {
        throw new Error(workflowResult.blogResult.error || 'Generation failed');
      }

    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            AI Backlink Test
          </h1>
          <p className="text-gray-600">
            Testing buffer - Enter keyword and URL
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6 mb-8">
          <div>
            <Label htmlFor="keyword" className="text-sm font-medium text-gray-700">
              Keyword
            </Label>
            <Input
              id="keyword"
              placeholder="digital marketing"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="url" className="text-sm font-medium text-gray-700">
              URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={isLoading || !keyword.trim() || !url.trim()}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Backlink'
            )}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-green-800">
                Backlink Generated
              </h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Blog URL:</p>
                <p className="text-sm font-mono text-gray-800 break-all">
                  {getCurrentDomain().replace('https://', '').replace('http://', '')}/blog/{keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                </p>
              </div>

              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <a
                  href={result.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Article
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          Buffer testing environment
        </div>
      </div>
    </div>
  );
}
