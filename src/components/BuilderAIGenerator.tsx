import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { builderAIContentGenerator } from '@/services/builderAIContentGenerator';
import { chatGPTFallbackService } from '@/services/chatGPTFallbackService';
import {
  Zap,
  CheckCircle2,
  Globe,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ProgressUpdate {
  stage: string;
  progress: number;
  details: string;
  timestamp: Date;
}

interface UserGenerationStatus {
  canGenerate: boolean;
  reason?: string;
}

export const BuilderAIGenerator = () => {
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [userCanGenerate, setUserCanGenerate] = useState<UserGenerationStatus>({ canGenerate: true });
  const [apiStatus, setApiStatus] = useState<{ accessible: boolean; error?: string } | null>(null);
  const [isCheckingAPI, setIsCheckingAPI] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    setIsCheckingAPI(true);
    try {
      const status = await builderAIContentGenerator.checkAPIAccessibility();
      setApiStatus(status);
      setUserCanGenerate({
        canGenerate: status.accessible,
        reason: status.error
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApiStatus({ accessible: false, error: errorMessage });
      setUserCanGenerate({
        canGenerate: false,
        reason: errorMessage
      });
    } finally {
      setIsCheckingAPI(false);
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim() || !anchorText.trim() || !targetUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    let formattedUrl = targetUrl.trim();
    try {
      // Add https:// if no protocol specified
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., example.com or https://example.com)",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // First try Builder.io AI
      try {
        // Set up real-time progress callback for Builder.io AI
        builderAIContentGenerator.setProgressCallback((update) => {
          setProgress(update);
        });

        // Generate content using Builder.io AI with the 3 specific prompts
        const result = await builderAIContentGenerator.generateContent({
          keyword: keyword.trim(),
          anchorText: anchorText.trim(),
          targetUrl: formattedUrl
        });

        toast({
          title: "Blog Post Generated & Published!",
          description: `Your content has been published successfully! Redirecting to: ${result.publishedUrl}`,
        });

        // Reset form
        setKeyword('');
        setAnchorText('');
        setTargetUrl('');

        // Redirect to the published blog post
        setTimeout(() => {
          window.open(result.publishedUrl, '_blank');
          // Also navigate to our internal view
          navigate(`/free-backlink/${result.id}`);
        }, 2000);

      } catch (builderError) {
        console.warn('Builder.io AI failed, trying ChatGPT fallback:', builderError);

        // Use ChatGPT fallback when Builder.io AI fails
        setProgress({
          stage: "Fallback Mode",
          progress: 10,
          details: "Builder.io AI unavailable, switching to ChatGPT fallback...",
          timestamp: new Date()
        });

        // Set up progress callback for ChatGPT fallback
        chatGPTFallbackService.setProgressCallback((update) => {
          setProgress(update);
        });

        const fallbackResult = await chatGPTFallbackService.generateContentWithChatGPT({
          keyword: keyword.trim(),
          anchorText: anchorText.trim(),
          targetUrl: formattedUrl
        });

        toast({
          title: "Blog Post Generated with ChatGPT!",
          description: `Content generated using ChatGPT fallback. Published at: ${fallbackResult.publishedUrl}`,
          variant: "default",
        });

        // Reset form
        setKeyword('');
        setAnchorText('');
        setTargetUrl('');

        // Redirect to the published blog post
        setTimeout(() => {
          window.open(fallbackResult.publishedUrl, '_blank');
          // Also navigate to our internal view if available
          try {
            navigate(`/free-backlink/${fallbackResult.id}`);
          } catch (navError) {
            console.warn('Navigation failed, opening published URL directly');
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Both Builder.io AI and ChatGPT fallback failed:', error);
      toast({
        title: "Generation Failed",
        description: "Both Builder.io AI and ChatGPT fallback failed. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(null);
      }, 2000);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-4">
        <CardTitle>Create a Backlink</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          🤖 Uses Builder.io AI with ChatGPT fallback for maximum reliability
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Limit Status */}
        {userCanGenerate && !userCanGenerate.canGenerate && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userCanGenerate.reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="keyword" className="text-sm font-medium">
              Keyword *
            </Label>
            <Input
              id="keyword"
              placeholder="e.g., digital marketing, SEO tips"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={isGenerating}
              className="bg-white"
            />
            <p className="text-xs text-gray-600">
              Main topic for your 1000+ word article
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anchorText" className="text-sm font-medium">
              Anchor Text *
            </Label>
            <Input
              id="anchorText"
              placeholder="e.g., best marketing tools, learn more"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              disabled={isGenerating}
              className="bg-white"
            />
            <p className="text-xs text-gray-600">
              Text that will be hyperlinked in the article
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetUrl" className="text-sm font-medium">
            Target URL *
          </Label>
          <Input
            id="targetUrl"
            placeholder="https://yourwebsite.com"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={isGenerating}
            className="bg-white"
          />
          <p className="text-xs text-gray-600">
            URL where the anchor text will link to
          </p>
        </div>

        {/* API Status Display */}
        {isCheckingAPI && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 animate-pulse text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Checking Builder.io AI API status...</span>
            </div>
          </div>
        )}

        {apiStatus && !isCheckingAPI && (
          <div className={`p-4 rounded-lg border ${apiStatus.accessible
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {apiStatus.accessible ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${apiStatus.accessible
                ? 'text-green-800'
                : 'text-red-800'
              }`}>
                {apiStatus.accessible
                  ? 'Builder.io AI API is ready'
                  : `API Error: ${apiStatus.error}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Real-time Progress Display */}
        {isGenerating && progress && (
          <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="font-bold text-lg text-gray-800">{progress.stage}</div>
              <div className="text-lg font-mono text-gray-600">{progress.progress}%</div>
            </div>
            <Progress value={progress.progress} className="h-4" />
            <div className="text-sm text-gray-700 font-medium">{progress.details}</div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>⏰ {progress.timestamp.toLocaleTimeString()}</span>
              <span>🤖 Builder.io AI Engine</span>
              <span>📝 Real-time Generation</span>
            </div>

            {/* Live Action Indicators */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className={`p-2 rounded text-center ${progress.progress >= 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ API Check
              </div>
              <div className={`p-2 rounded text-center ${progress.progress >= 30 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ AI Generation
              </div>
              <div className={`p-2 rounded text-center ${progress.progress >= 80 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ Publishing
              </div>
              <div className={`p-2 rounded text-center ${progress.progress >= 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                ✓ Complete
              </div>
            </div>
          </div>
        )}

        {/* Generation Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !userCanGenerate?.canGenerate}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
        >
          {isGenerating ? (
            <>
              <Zap className="mr-2 h-5 w-5 animate-pulse" />
              Generating Your Blog Post...
            </>
          ) : (
            <>
              Create Your First Backlink For Free
            </>
          )}
        </Button>

        {/* Usage Info */}
        <div className="text-center text-sm text-gray-600">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>1000+ words guaranteed</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4 text-blue-600" />
              <span>SEO optimized</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span>Auto-published to /blog</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-orange-600" />
              <span>ChatGPT fallback</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
