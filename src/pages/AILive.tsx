/**
 * AI Live Content Generator - Modern User Interface
 * Beautiful, user-friendly interface for generating AI blog content
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Zap,
  Clock,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2,
  BookOpen,
  Users,
  Shield,
  Eye
} from 'lucide-react';
import { BuilderAIGenerator, type GenerationStatus, type BuilderAIResult } from '@/services/builderAIGenerator';
import { useAuth } from '@/hooks/useAuth';
import { blogPublishingService } from '@/services/blogPublishingService';
import { toast } from 'sonner';

export default function AILive() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [result, setResult] = useState<BuilderAIResult | null>(null);
  const [hasUsedLimit, setHasUsedLimit] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [intermediateContent, setIntermediateContent] = useState<string>('');

  // No limits on AI Live - removed user limit check
  useEffect(() => {
    // AI Live has no generation limits
    setHasUsedLimit(false);
  }, []);

  const handleGenerate = async () => {
    if (!keyword.trim() || !anchorText.trim() || !targetUrl.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // No limits on AI Live - unlimited generations allowed

    setIsGenerating(true);
    setResult(null);
    setShowPreview(false);

    try {
      // Set up status updates
      const generator = new BuilderAIGenerator((status) => {
        setGenerationStatus(status);

        // Simulate intermediate content during generation
        if (status.stage === 'generating' && status.progress > 50) {
          setIntermediateContent(`
            <h1>Generating content about ${keyword}</h1>
            <p>Creating comprehensive article with ${anchorText} linking to your target URL...</p>
            <p>Content generation in progress using ${status.provider?.toUpperCase()} AI...</p>
          `);
        }
      });

      const generationResult = await generator.generateContent({
        keyword: keyword.trim(),
        anchorText: anchorText.trim(),
        targetUrl: targetUrl.trim(),
        userId: user?.id,
        accountId: user?.id
      });

      // Publish to blog
      await blogPublishingService.publishBlogPost({
        title: generationResult.title,
        slug: generationResult.slug,
        content: generationResult.content,
        keyword: keyword.trim(),
        anchor_text: anchorText.trim(),
        target_url: targetUrl.trim(),
        word_count: generationResult.wordCount,
        provider: generationResult.provider,
        generation_time: generationResult.generationTime,
        seo_score: generationResult.metadata.seoScore,
        reading_time: generationResult.metadata.readingTime,
        keyword_density: generationResult.metadata.keywordDensity,
        expires_at: generationResult.expiresAt.toISOString(),
        generated_by_account: user?.id
      });

      setResult(generationResult);
      setHasUsedLimit(true);
      setIntermediateContent(''); // Clear intermediate content
      toast.success('Content generated and published successfully!');
      
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate content');
      setGenerationStatus({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Live Generator</h1>
                <p className="text-sm text-gray-500">Generate professional blog content instantly</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Unlimited</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>AI Live</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Generate Your Blog Post
                </CardTitle>
                <CardDescription className="text-base text-gray-600 max-w-md mx-auto">
                  Create high-quality, SEO-optimized content with AI in seconds. One free generation per account.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="keyword" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Topic/Keyword *</span>
                    </Label>
                    <Input
                      id="keyword"
                      placeholder="e.g., Digital Marketing Strategies"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="mt-2 h-12 text-base"
                      disabled={isGenerating || hasUsedLimit}
                    />
                    <p className="text-xs text-gray-500 mt-1">The main topic your article will focus on</p>
                  </div>

                  <div>
                    <Label htmlFor="anchorText" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>Anchor Text *</span>
                    </Label>
                    <Input
                      id="anchorText"
                      placeholder="e.g., best marketing tools"
                      value={anchorText}
                      onChange={(e) => setAnchorText(e.target.value)}
                      className="mt-2 h-12 text-base"
                      disabled={isGenerating || hasUsedLimit}
                    />
                    <p className="text-xs text-gray-500 mt-1">Text that will be hyperlinked in your article</p>
                  </div>

                  <div>
                    <Label htmlFor="targetUrl" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Target URL *</span>
                    </Label>
                    <Input
                      id="targetUrl"
                      placeholder="https://example.com/your-page"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="mt-2 h-12 text-base"
                      disabled={isGenerating || hasUsedLimit}
                    />
                    <p className="text-xs text-gray-500 mt-1">Where the anchor text will link to</p>
                  </div>
                </div>

                {/* Generation Status */}
                {isGenerating && generationStatus && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {generationStatus.message}
                        </span>
                      </div>
                      {generationStatus.provider && (
                        <Badge variant="secondary" className="text-xs">
                          {generationStatus.provider.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <Progress value={generationStatus.progress} className="h-2" />

                    {/* Show intermediate content if available */}
                    {intermediateContent && generationStatus.stage === 'generating' && (
                      <div className="mt-4 p-3 bg-white border rounded-lg">
                        <h5 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          Content Being Generated...
                        </h5>
                        <div
                          className="text-xs text-gray-700 max-h-32 overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: intermediateContent.substring(0, 300) + '...' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {generationStatus?.stage === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{generationStatus.error}</AlertDescription>
                  </Alert>
                )}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || hasUsedLimit || !keyword.trim() || !anchorText.trim() || !targetUrl.trim()}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : hasUsedLimit ? (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Generation Limit Used
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Blog Post
                    </>
                  )}
                </Button>

                {hasUsedLimit && (
                  <p className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <Shield className="inline h-4 w-4 mr-1" />
                    You've used your free generation. Each account gets one free blog post.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Features */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>What You Get</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="text-sm text-gray-600">
                    <strong>1000+ words</strong> of high-quality content
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="text-sm text-gray-600">
                    <strong>SEO optimized</strong> with proper formatting
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="text-sm text-gray-600">
                    <strong>Auto-published</strong> to your blog
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="text-sm text-gray-600">
                    <strong>24-hour window</strong> to claim content
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Providers */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <span>AI Providers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">Hugging Face</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">Cohere</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Backup</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-12">
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="text-center border-b bg-gradient-to-r from-green-50 to-blue-50">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Content Generated Successfully!
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Your blog post has been created and published. It will be available for 24 hours.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-800">{result.wordCount}</div>
                    <div className="text-sm text-blue-600">Words</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">{result.metadata.readingTime}</div>
                    <div className="text-sm text-green-600">Min Read</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-800">{result.metadata.seoScore}</div>
                    <div className="text-sm text-purple-600">SEO Score</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Globe className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-800">{result.provider.toUpperCase()}</div>
                    <div className="text-sm text-orange-600">AI Provider</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">{result.title}</h3>
                      <p className="text-sm text-gray-600">Published URL: {window.location.origin}{result.publishedUrl}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${window.location.origin}${result.publishedUrl}`)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.open(result.publishedUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Post
                      </Button>
                    </div>
                  </div>

                  <Alert className="border-amber-200 bg-amber-50">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Important:</strong> This content will be automatically deleted in 24 hours unless you claim it by logging into your account.
                      Expires: {new Date(result.expiresAt).toLocaleString()}
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-center space-x-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide' : 'Show'} Full Content
                    </Button>
                    <Button
                      onClick={() => window.open(result.publishedUrl, '_blank')}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Published Post
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('/blog', '_blank')}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      All Posts
                    </Button>
                  </div>

                  {/* Always show content preview */}
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                        Generated Content Preview
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.content)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Content
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}${result.publishedUrl}`)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy URL
                        </Button>
                      </div>
                    </div>

                    <div
                      className="prose max-w-none text-sm bg-white p-4 rounded border"
                      dangerouslySetInnerHTML={{
                        __html: showPreview
                          ? result.content
                          : result.content.substring(0, 800) + (result.content.length > 800 ? '...' : '')
                      }}
                    />

                    {!showPreview && result.content.length > 800 && (
                      <Button
                        variant="link"
                        className="mt-2 p-0 text-blue-600"
                        onClick={() => setShowPreview(true)}
                      >
                        Show full content ({result.wordCount} words) →
                      </Button>
                    )}

                    <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Published Successfully!</p>
                          <p className="text-xs text-green-700">
                            Your content is live at:
                            <code className="ml-1 px-2 py-1 bg-green-200 rounded text-xs">
                              {window.location.origin}{result.publishedUrl}
                            </code>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => window.open(result.publishedUrl, '_blank')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
