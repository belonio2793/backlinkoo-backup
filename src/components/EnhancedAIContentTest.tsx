/**
 * AI Test Buffer Page
 * Tests API providers, generates blog content, and returns published results
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { aiTestWorkflow } from '@/services/aiTestWorkflow';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  FileText,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Link
} from 'lucide-react';

export function EnhancedAIContentTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [providerStatuses, setProviderStatuses] = useState<any[]>([]);
  const [generatedBlog, setGeneratedBlog] = useState<any>(null);
  const [showPrompts, setShowPrompts] = useState(true);
  
  // User inputs
  const [keyword, setKeyword] = useState('digital marketing');
  const [url, setUrl] = useState('https://example.com');
  const [anchorText, setAnchorText] = useState('best digital marketing tools');

  const { toast } = useToast();

  // Dynamic prompts based on user inputs
  const dynamicPrompts = [
    `Write 2000 words on "${keyword}" and hyperlink the "${anchorText}" with the ${url} in a search engine optimized manner`,
    `Create a 2000 word original blog post that encapsulates user intent and website correlation based on "${keyword}" and hyperlink the "${anchorText}" with the ${url} following search engine optimized principles and abide by strict grammar and punctuality.`
  ];

  const runBlogGeneration = async () => {
    if (!keyword || !url) {
      toast({
        title: "Missing Information",
        description: "Please provide both keyword and URL",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setGeneratedBlog(null);
    setProviderStatuses([]);
    
    try {
      // Step 1: Check API providers
      setCurrentStep('Checking all AI provider connections...');
      setProgress(20);
      
      const testResult = await aiTestWorkflow.runTestWorkflow({
        websiteUrl: url,
        keyword,
        anchorText,
        sessionId: crypto.randomUUID()
      });

      setProviderStatuses(testResult.providerStatuses);

      if (!testResult.canProceedToBlogGeneration) {
        console.warn('No working providers, but will use fallback generation');
      }

      const workingCount = testResult.workingProviders.length;
      toast({
        title: workingCount > 0 ? "Providers Validated" : "Using Fallback Generation",
        description: workingCount > 0 ?
          `${workingCount} providers available` :
          "API providers have issues, using intelligent fallback",
      });

      // Step 2: Generate blog content
      setCurrentStep('Generating blog post with validated providers...');
      setProgress(60);

      const blogResult = await aiTestWorkflow.generateBlogContent({
        websiteUrl: url,
        keyword,
        anchorText,
        sessionId: crypto.randomUUID()
      }, testResult);

      if (!blogResult.success) {
        throw new Error(blogResult.error || 'Blog generation failed');
      }

      // Step 3: Create blog slug and return results
      setCurrentStep('Creating blog slug and finalizing...');
      setProgress(90);

      // Generate slug from keyword
      const slug = keyword.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const finalBlogUrl = blogResult.blogUrl || `https://backlinkoo.com/blog/${slug}`;

      setGeneratedBlog({
        ...blogResult,
        blogUrl: finalBlogUrl,
        slug,
        testResult,
        prompts: dynamicPrompts,
        userInputs: { keyword, url, anchorText }
      });

      setProgress(100);

      const generatedBy = blogResult.metadata?.generatedBy || 'AI';
      const isFallback = generatedBy.includes('fallback');

      toast({
        title: "Blog Generated Successfully!",
        description: `Your blog post is ready at: ${finalBlogUrl}${isFallback ? ' (using intelligent fallback)' : ''}`,
      });

    } catch (error) {
      console.error('Blog generation workflow failed:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate blog. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            AI Test Buffer - Blog Generation
          </CardTitle>
          <p className="text-muted-foreground">
            Test API providers and generate optimized blog content with dynamic prompts
          </p>
        </CardHeader>
      </Card>

      {/* User Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                placeholder="e.g., digital marketing"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Target URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anchorText">Anchor Text</Label>
              <Input
                id="anchorText"
                placeholder="best marketing tools"
                value={anchorText}
                onChange={(e) => setAnchorText(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Prompts Overlay */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Dynamic Prompts (Uneditable)
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompts(!showPrompts)}
            >
              {showPrompts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showPrompts && (
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                These prompts are automatically generated based on your inputs and cannot be edited.
              </AlertDescription>
            </Alert>
            
            {dynamicPrompts.map((prompt, index) => (
              <div key={index} className="relative">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Prompt {index + 1}</Badge>
                    <Badge variant="secondary" className="text-xs">Auto-generated</Badge>
                  </div>
                  <div className="relative">
                    <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                      {prompt}
                    </pre>
                    {/* Overlay to prevent editing */}
                    <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{currentStep}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Status */}
      {providerStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              API Provider Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {providerStatuses.map((provider, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize text-sm">{provider.provider}</span>
                    {provider.available ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className={`text-xs px-2 py-1 rounded ${
                      provider.quotaStatus === 'available' ? 'bg-green-100 text-green-800' :
                      provider.quotaStatus === 'low' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Quota: {provider.quotaStatus}
                      {provider.usagePercentage && ` (${provider.usagePercentage}%)`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Blog Results */}
      {generatedBlog && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Blog Generation Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success!</strong> Your blog post has been generated and is available at:{' '}
                <a 
                  href={generatedBlog.blogUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium underline hover:no-underline"
                >
                  {generatedBlog.blogUrl}
                </a>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Blog Slug</p>
                <p className="text-sm text-muted-foreground font-mono">/blog/{generatedBlog.slug}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Generation Time</p>
                <p className="text-sm text-muted-foreground">
                  {generatedBlog.testResult?.testDuration}ms
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Recommended Provider</p>
                <Badge variant="outline">
                  {generatedBlog.testResult?.recommendedProvider}
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <a 
                  href={generatedBlog.blogUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Published Blog
                </a>
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigator.clipboard.writeText(generatedBlog.blogUrl)}
              >
                <Link className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <Button 
        onClick={runBlogGeneration} 
        disabled={isProcessing || !keyword || !url} 
        size="lg"
        className="w-full"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            {currentStep || 'Processing...'}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Test APIs & Generate Blog Post
          </>
        )}
      </Button>
    </div>
  );
}
