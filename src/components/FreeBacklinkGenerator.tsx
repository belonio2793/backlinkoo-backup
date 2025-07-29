import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { openAIOnlyContentGenerator, ContentGenerationRequest, GeneratedContentResult } from '@/services/openAIOnlyContentGenerator';
import RegistrationModal from './RegistrationModal';
import { WordCountProgress } from './WordCountProgress';
import { ProviderStatus } from './ui/provider-status';
import { 
  Loader2, 
  Sparkles, 
  Link, 
  Target, 
  Hash, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Gift,
  Zap
} from 'lucide-react';

interface FreeBacklinkGeneratorProps {
  onContentGenerated: (content: GeneratedContentResult) => void;
}

export function FreeBacklinkGenerator({ onContentGenerated }: FreeBacklinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [contentType, setContentType] = useState<'how-to' | 'listicle' | 'review' | 'comparison' | 'news' | 'opinion'>('how-to');
  const [wordCount, setWordCount] = useState<number>(1500);
  const [tone, setTone] = useState<'professional' | 'casual' | 'technical' | 'friendly' | 'convincing'>('professional');
  const [isReady, setIsReady] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const { toast } = useToast();

  useState(() => {
    // Check if service is ready
    const checkReady = async () => {
      const ready = freeBacklinkService.isReady();
      setIsReady(ready);
      
      if (ready) {
        try {
          await freeBacklinkService.testConnection();
        } catch (error) {
          console.warn('OpenAI connection test failed:', error);
        }
      }
    };
    
    checkReady();
  });

  const generateContent = async () => {
    if (!targetUrl || !primaryKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both target URL and primary keyword",
        variant: "destructive"
      });
      return;
    }

    if (!isReady) {
      toast({
        title: "Service Not Ready",
        description: "OpenAI is not configured. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const request: ContentGenerationRequest = {
        targetUrl,
        primaryKeyword,
        anchorText: anchorText || primaryKeyword,
        wordCount,
        tone,
        contentType,
        // OpenAI retry configuration
        retryConfig: {
          maxRetries: 8, // Robust retry configuration for OpenAI
          baseDelay: 1000,
          maxDelay: 15000,
          exponentialBackoff: true,
          retryOnRateLimit: true,
          retryOnServerError: true
        }
      };

      const result = await openAIOnlyContentGenerator.generateContent(request);

      // Store the result for 24-hour management
      freeBacklinkService.storeFreeBacklink(result);

      onContentGenerated(result);

      toast({
        title: "Free Backlink Generated! 🎉",
        description: "Your blog post is ready! Remember, it will auto-delete in 24 hours unless you register an account.",
      });

      // Reset form
      setTargetUrl('');
      setPrimaryKeyword('');
      setAnchorText('');

    } catch (error) {
      console.error('Content generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context: (error as any)?.context,
        timestamp: new Date().toISOString()
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorContext = (error as any)?.context;

      let title = "Generation Failed";
      let description = "Failed to generate content. Please try again.";
      let detailedInfo = "";

      // Extract detailed error information
      if (errorContext) {
        detailedInfo = ` (Error ${errorContext.status} at ${new Date(errorContext.timestamp).toLocaleTimeString()})`;
      }

      if (errorMessage.includes('Invalid API key') || errorMessage.includes('401')) {
        title = "🔑 OpenAI API Key Required";
        description = "A valid OpenAI API key is required for content generation. Please configure your API key to use this feature." + detailedInfo;
      } else if (errorMessage.includes('OpenAI API key is not configured')) {
        title = "🔑 API Key Missing";
        description = "OpenAI API key is not configured. Content generation requires a valid OpenAI API key." + detailedInfo;
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        title = "⏱️ Rate Limit Exceeded";
        description = "OpenAI rate limit reached. Please wait a few minutes before generating more content." + detailedInfo;
      } else if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        title = "💳 Quota Exceeded";
        description = "Your OpenAI account has exceeded its usage quota. Please check your OpenAI billing settings." + detailedInfo;
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        title = "⏱️ Request Timeout";
        description = "The request took too long to complete. We automatically retry, but you can try again if needed." + detailedInfo;
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        title = "🌐 Network Error";
        description = "Network connection issue. We automatically retry, but please check your internet connection." + detailedInfo;
      } else if (errorMessage.includes('500') || errorMessage.includes('server error')) {
        title = "🔧 Server Error";
        description = "OpenAI server is temporarily unavailable. We automatically retry, please wait a moment." + detailedInfo;
      } else if (errorMessage.includes('failed after') && errorMessage.includes('attempts')) {
        title = "🔄 Multiple Retry Attempts Failed";
        description = "Despite multiple automatic retry attempts, the generation failed. Please try again in a few moments." + detailedInfo;
      } else if (errorMessage.includes('OpenAI generation failed')) {
        title = "🔥 OpenAI Generation Failed";
        description = "OpenAI failed to generate content. Please try again in a moment." + detailedInfo;
      } else if (errorMessage.includes('platform.openai.com')) {
        description = errorMessage + detailedInfo;
      } else {
        // Show the actual error message for debugging
        description = `OpenAI content generation error: ${errorMessage}` + detailedInfo;
      }

      toast({
        title,
        description,
        variant: "destructive",
        duration: 10000, // Longer duration for error messages
      });

      // Log additional debugging information in development
      if (import.meta.env.DEV) {
        console.log('📊 Debugging info:', {
          originalError: errorMessage,
          errorContext,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="text-center space-y-6 mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Free Backlink
            </h1>
            <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
              🎉 100% FREE - No Signup Required
            </Badge>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <p className="text-xl text-gray-600 leading-relaxed mb-4">
            Generate professional, SEO-optimized blog posts with natural backlinks to your website using our advanced AI technology.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-purple-600">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">AI-Powered Content</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">SEO Optimized</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Link className="h-4 w-4" />
              <span className="font-medium">Natural Backlinks</span>
            </div>
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Ready in Minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Status */}
      <ProviderStatus showDetails={true} className="mb-4" />

      {/* Service Status Alert */}
      {!isReady && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Service Temporarily Unavailable:</strong> The AI content generation service is currently not configured. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Free Service Notice */}
      <Alert className="border-purple-200 bg-purple-50">
        <Clock className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Free Service Notice:</strong> Your generated blog post will be available for 24 hours. 
          To save it permanently and access advanced features, 
          <Button
            variant="link"
            className="p-0 h-auto text-purple-600 font-semibold"
            onClick={() => setRegistrationModalOpen(true)}
          >
            register a free account
          </Button> after generation.
        </AlertDescription>
      </Alert>

      {/* Enhanced Generation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-purple-200 shadow-xl bg-gradient-to-br from-white to-purple-50/30 hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Target & Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL *</Label>
              <Input
                id="targetUrl"
                placeholder="https://your-website.com/target-page"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                The URL you want to create a backlink to
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
              <Input
                id="primaryKeyword"
                placeholder="e.g., best SEO practices"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                className="focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                Main topic for your blog post
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="anchorText">Anchor Text (Optional)</Label>
              <Input
                id="anchorText"
                placeholder="Link text (defaults to primary keyword)"
                value={anchorText}
                onChange={(e) => setAnchorText(e.target.value)}
                className="focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                Text that will link to your URL
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-xl bg-gradient-to-br from-white to-purple-50/30 hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Content Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="how-to">How-To Guide</SelectItem>
                  <SelectItem value="listicle">Listicle</SelectItem>
                  <SelectItem value="review">Product Review</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="news">News Article</SelectItem>
                  <SelectItem value="opinion">Opinion Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Word Count</Label>
              <Select value={wordCount.toString()} onValueChange={(value) => setWordCount(parseInt(value))}>
                <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="800">800 words</SelectItem>
                  <SelectItem value="1200">1,200 words</SelectItem>
                  <SelectItem value="1500">1,500 words (Recommended)</SelectItem>
                  <SelectItem value="2000">2,000 words</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="convincing">Convincing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Highlight */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            What You'll Get (100% Free!)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-green-800">AI-Generated Content</p>
                <p className="text-sm text-green-700">High-quality, SEO-optimized blog post</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Link className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-green-800">Natural Backlink</p>
                <p className="text-sm text-green-700">Contextually relevant link to your site</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-green-600 mt-1" />
              <div>
                <p className="font-medium text-green-800">SEO Optimized</p>
                <p className="text-sm text-green-700">Structured for search engine ranking</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Count Progress */}
      {isGenerating && (
        <div className="mt-6">
          <WordCountProgress
            targetWords={wordCount}
            isGenerating={isGenerating}
            onComplete={(finalCount) => {
              console.log('Content generation completed with', finalCount, 'words');
            }}
          />
        </div>
      )}

      {/* Enhanced Generate Button */}
      <div className="text-center space-y-4">
        <Button
          onClick={generateContent}
          disabled={isGenerating || !isReady}
          size="lg"
          className="w-full max-w-md mx-auto bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 text-white font-bold py-8 text-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              <div className="flex flex-col">
                <span>Generating Your Free Backlink...</span>
                <span className="text-sm font-normal opacity-90">Please wait, AI is working its magic ✨</span>
              </div>
            </>
          ) : (
            <>
              <Sparkles className="mr-3 h-6 w-6" />
              <div className="flex flex-col">
                <span>Generate Free Backlink Blog Post</span>
                <span className="text-sm font-normal opacity-90">🚀 Powered by Advanced AI</span>
              </div>
            </>
          )}
        </Button>

        {!isReady && (
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">AI service initializing... Please wait a moment.</span>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground">
        By using this service, you agree that the generated content is for legitimate SEO purposes.
        The blog post will automatically delete after 24 hours unless you save it by registering an account.
      </p>

      {/* Registration Modal */}
      <RegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        trigger="general"
      />
    </div>
  );
}
