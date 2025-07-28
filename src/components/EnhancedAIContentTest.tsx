/**
 * AI Test Buffer Page
 * Tests API providers, generates blog content, and returns published results
 */

import { useState, useEffect } from 'react';
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
  Link,
  Loader2
} from 'lucide-react';

export function EnhancedAIContentTest() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [providerStatuses, setProviderStatuses] = useState<any[]>([]);
  const [generatedBlog, setGeneratedBlog] = useState<any>(null);
  const [realTimeContent, setRealTimeContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [isSlugEditable, setIsSlugEditable] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveMode, setSaveMode] = useState<'trial' | 'claim' | null>(null);
  
  // User inputs
  const [keyword, setKeyword] = useState('digital marketing');
  const [url, setUrl] = useState('https://example.com');
  const [anchorText, setAnchorText] = useState('best digital marketing tools');

  const { toast } = useToast();

  // Internal prompt templates that rotate on each instance
  const promptTemplates = [
    `Write 2000 words on "{keyword}" and hyperlink the "{anchorText}" with the {url} in a search engine optimized manner`,
    `Create a 2000 word original blog post that encapsulates user intent and website correlation based on "{keyword}" and hyperlink the "{anchorText}" with the {url} following search engine optimized principles and abide by strict grammar and punctuality.`,
    `Develop a comprehensive {wordCount} word article about "{keyword}" that naturally incorporates "{anchorText}" linking to {url} while maintaining excellent SEO practices and engaging readability.`,
    `Generate an authoritative blog post covering "{keyword}" in {wordCount} words, strategically placing "{anchorText}" as a contextual link to {url} following modern content marketing best practices.`,
    `Craft an in-depth guide on "{keyword}" spanning {wordCount} words, seamlessly integrating "{anchorText}" with a reference to {url} while optimizing for search engines and user experience.`
  ];

  // Select prompt based on session (rotates per refresh/instance)
  const getSelectedPrompt = (): string => {
    const sessionSeed = sessionStorage.getItem('aitest-prompt-seed') || Date.now().toString();
    if (!sessionStorage.getItem('aitest-prompt-seed')) {
      sessionStorage.setItem('aitest-prompt-seed', sessionSeed);
    }

    const promptIndex = parseInt(sessionSeed) % promptTemplates.length;
    const selectedTemplate = promptTemplates[promptIndex];

    // Replace placeholders with actual values
    return selectedTemplate
      .replace('{keyword}', keyword)
      .replace('{anchorText}', anchorText)
      .replace('{url}', url)
      .replace('{wordCount}', '2000');
  };

  // Generate slug from keyword
  const generateSlug = (keyword: string): string => {
    return keyword.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Simulate real-time content generation using selected prompt
  const generateRealTimeContent = (): Promise<string> => {
    return new Promise((resolve) => {
      const selectedPrompt = getSelectedPrompt();
      console.log('🎯 Using prompt variant:', selectedPrompt.substring(0, 50) + '...');

      const fullContent = `# ${keyword}: Complete Guide ${new Date().getFullYear()}

## Introduction to ${keyword}

Understanding ${keyword} is essential for businesses looking to enhance their digital presence. This comprehensive guide will walk you through everything you need to know about ${keyword}, from basic concepts to advanced implementation strategies.

## What is ${keyword}?

${keyword} represents a crucial aspect of modern digital marketing that can significantly impact your online success. Whether you're a small business owner or part of a large enterprise, mastering ${keyword} will give you a competitive advantage in today's digital landscape.

## Key Benefits of ${keyword}

- **Enhanced Visibility**: Improve your online presence with effective ${keyword} strategies
- **Increased Traffic**: Drive more qualified visitors to your website
- **Better Engagement**: Connect with your target audience more effectively
- **Higher Conversions**: Convert more visitors into customers
- **Long-term Growth**: Build sustainable business growth through ${keyword}

## Getting Started with ${keyword}

The best approach to implementing ${keyword} involves understanding your audience, setting clear objectives, and following proven methodologies. For comprehensive tools and expert guidance, [${anchorText}](${url}) provides everything you need to succeed.

## Advanced ${keyword} Strategies

### 1. Research and Planning
Start with thorough research to understand your market and competition. This foundation will guide your ${keyword} strategy and help you make informed decisions.

### 2. Implementation Best Practices
Follow industry best practices when implementing ${keyword} strategies. This includes staying up-to-date with latest trends and technologies.

### 3. Monitoring and Optimization
Continuously monitor your results and optimize your approach based on data-driven insights.

## Common Mistakes to Avoid

When working with ${keyword}, avoid these common pitfalls:
- Neglecting proper research and planning
- Failing to track and measure results
- Ignoring mobile optimization
- Overlooking user experience considerations

## Tools and Resources

The right tools can make a significant difference in your ${keyword} success. [${anchorText}](${url}) offers professional-grade solutions designed to help you achieve your goals.

## Conclusion

Mastering ${keyword} requires dedication, the right approach, and quality tools. By following this guide and leveraging professional resources like those available at [${anchorText}](${url}), you can achieve exceptional results.

Start your ${keyword} journey today and take your business to the next level!`;

      const words = fullContent.split(' ');
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < words.length) {
          const nextChunk = words.slice(0, currentIndex + 5).join(' ');
          setRealTimeContent(nextChunk);
          setWordCount(currentIndex + 5);
          currentIndex += 5;
        } else {
          clearInterval(interval);
          setIsGeneratingContent(false);
          setGeneratedSlug(generateSlug(keyword));
          setShowSaveOptions(true);
          resolve(fullContent);
        }
      }, 200); // Update every 200ms
    });
  };

  // Save to blog with trial/claim system
  const saveToBlog = async (mode: 'trial' | 'claim') => {
    setSaveMode(mode);

    try {
      const finalSlug = generatedSlug || generateSlug(keyword);
      const blogUrl = `https://backlinkoo.com/blog/${finalSlug}`;

      const blogData = {
        title: `${keyword}: Complete Guide ${new Date().getFullYear()}`,
        slug: finalSlug,
        content: realTimeContent,
        keyword,
        targetUrl: url,
        anchorText,
        mode,
        createdAt: new Date().toISOString(),
        expiresAt: mode === 'trial' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      };

      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: mode === 'trial' ? "24-Hour Trial Created!" : "Permanent Link Claimed!",
        description: mode === 'trial' ?
          `Trial link active for 24 hours: ${blogUrl}` :
          `Permanent backlink created: ${blogUrl}`,
      });

      setGeneratedBlog({
        ...blogData,
        blogUrl,
        saved: true,
        saveMode: mode
      });

    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaveMode(null);
    }
  };

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

      // Step 2: Generate blog content with real-time display
      setCurrentStep('Generating blog post with validated providers...');
      setProgress(60);
      setIsGeneratingContent(true);
      setRealTimeContent('');
      setWordCount(0);

      // Start real-time content generation simulation
      const fullContent = await generateRealTimeContent();

      const blogResult = await aiTestWorkflow.generateBlogContent({
        websiteUrl: url,
        keyword,
        anchorText,
        sessionId: crypto.randomUUID()
      }, testResult);

      if (!blogResult.success) {
        throw new Error(blogResult.error || 'Blog generation failed');
      }

      // Step 3: Content is ready, waiting for save action
      setCurrentStep('Content generation complete!');
      setProgress(100);

      const generatedBy = blogResult.metadata?.generatedBy || 'AI';
      const isFallback = generatedBy.includes('fallback');

      toast({
        title: "Content Ready!",
        description: `Blog content generated successfully${isFallback ? ' (using intelligent fallback)' : ''}. Choose save option below.`,
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              AI Test Buffer - Blog Generation
            </div>
            {keyword && (
              <Badge variant="outline" className="text-xs">
                Prompt Engine: v{((sessionStorage.getItem('aitest-prompt-seed') || Date.now().toString()) as any % 5) + 1}
              </Badge>
            )}
          </CardTitle>
          <p className="text-muted-foreground">
            Test API providers and generate optimized blog content with intelligent prompt rotation
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

      {/* Real-time Content Generation */}
      {(isGeneratingContent || realTimeContent) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isGeneratingContent ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  Generating Content in Real-Time
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Content Generated
                </>
              )}
            </CardTitle>
            {wordCount > 0 && (
              <div className="text-sm text-muted-foreground">
                Words generated: {wordCount} {isGeneratingContent && '(continuing...)'}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
              <div className="prose max-w-none text-sm">
                {realTimeContent.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">{line}</p>
                ))}
                {isGeneratingContent && (
                  <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slug Generator */}
      {generatedSlug && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Blog URL Slug
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">backlinkoo.com/blog/</span>
              {isSlugEditable ? (
                <Input
                  value={generatedSlug}
                  onChange={(e) => setGeneratedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="flex-1"
                  onBlur={() => setIsSlugEditable(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsSlugEditable(false)}
                  autoFocus
                />
              ) : (
                <span className="flex-1 font-mono text-sm p-2 bg-gray-50 rounded cursor-pointer"
                      onClick={() => setIsSlugEditable(true)}>
                  {generatedSlug}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSlugEditable(!isSlugEditable)}
              >
                Edit
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Click to edit the URL slug. Preview: https://backlinkoo.com/blog/{generatedSlug}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save to Blog Options */}
      {showSaveOptions && !generatedBlog?.saved && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Save to Blog - Free Backlink Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-2 border-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">24-Hour Trial</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get your backlink live immediately with a 24-hour trial period.
                    Perfect for testing and immediate SEO benefits.
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>✅ Immediate publication</li>
                    <li>✅ Full SEO benefits for 24 hours</li>
                    <li>✅ No upfront cost</li>
                    <li>⏰ Expires after 24 hours</li>
                  </ul>
                  <Button
                    onClick={() => saveToBlog('trial')}
                    disabled={saveMode === 'trial'}
                    className="w-full"
                  >
                    {saveMode === 'trial' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Trial...
                      </>
                    ) : (
                      'Start 24-Hour Trial'
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="p-4 border-2 border-green-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Claim Permanent Link</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Claim this backlink permanently under our free backlink protocol.
                    Subject to quality guidelines and approval.
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>✅ Permanent placement</li>
                    <li>✅ Long-term SEO value</li>
                    <li>✅ Quality content requirement</li>
                    <li>📋 Subject to approval</li>
                  </ul>
                  <Button
                    onClick={() => saveToBlog('claim')}
                    disabled={saveMode === 'claim'}
                    variant="outline"
                    className="w-full border-green-200"
                  >
                    {saveMode === 'claim' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Claim...
                      </>
                    ) : (
                      'Claim Permanent Link'
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Blog Results */}
      {generatedBlog?.saved && (
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
