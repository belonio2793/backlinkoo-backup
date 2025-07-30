import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { builderAIAgent, AIGenerationRequest, GenerationProgress, BlogPostResult } from '@/services/builderAIAgent';
import { useAuthStatus } from '@/hooks/useAuth';
import { 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  Eye,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface BuilderAIGeneratorProps {
  onSuccess?: (blogPost: BlogPostResult) => void;
  variant?: 'homepage' | 'dashboard' | 'standalone';
}

export function BuilderAIGenerator({ onSuccess, variant = 'homepage' }: BuilderAIGeneratorProps) {
  // Form state
  const [keyword, setKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generatedPost, setGeneratedPost] = useState<BlogPostResult | null>(null);
  const [apiStatus, setApiStatus] = useState<{ accessible: boolean; error?: string } | null>(null);
  const [userCanGenerate, setUserCanGenerate] = useState<{ canGenerate: boolean; reason?: string } | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStatus();
  const sessionId = useState(() => crypto.randomUUID())[0];

  // Check API status on load
  useEffect(() => {
    checkAPIStatus();
  }, []);

  // Check user generation limit on user change
  useEffect(() => {
    if (isLoggedIn !== undefined) {
      checkUserLimit();
    }
  }, [isLoggedIn, user]);

  const checkAPIStatus = async () => {
    try {
      const status = await builderAIAgent.checkAPIAccessibility();
      setApiStatus(status);
    } catch (error) {
      setApiStatus({ accessible: false, error: 'Failed to check API status' });
    }
  };

  const checkUserLimit = async () => {
    try {
      const limitCheck = await builderAIAgent.checkUserGenerationLimit(user?.id, sessionId);
      setUserCanGenerate(limitCheck);
    } catch (error) {
      setUserCanGenerate({ canGenerate: true });
    }
  };

  const validateForm = (): boolean => {
    if (!keyword.trim()) {
      toast({
        title: "Keyword required",
        description: "Please enter a keyword for your blog post.",
        variant: "destructive",
      });
      return false;
    }

    if (!anchorText.trim()) {
      toast({
        title: "Anchor text required", 
        description: "Please enter the anchor text for your hyperlink.",
        variant: "destructive",
      });
      return false;
    }

    if (!targetUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter the target URL for your hyperlink.",
        variant: "destructive",
      });
      return false;
    }

    // Validate URL format
    try {
      new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    if (!userCanGenerate?.canGenerate) {
      toast({
        title: "Generation Limit Reached",
        description: userCanGenerate?.reason || "You cannot generate more content",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(null);
    setGeneratedPost(null);

    const request: AIGenerationRequest = {
      user_input_keyword: keyword.trim(),
      user_input_anchor_text: anchorText.trim(),
      user_input_url: targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`,
      userId: user?.id,
      sessionId
    };

    try {
      // Register for real-time progress updates
      builderAIAgent.registerProgressCallback(sessionId, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      const result = await builderAIAgent.generateContent(request);
      
      setGeneratedPost(result);
      onSuccess?.(result);

      toast({
        title: "Blog Post Generated! 🎉",
        description: `Your ${result.word_count}-word blog post is ready and published!`,
        action: (
          <Button
            size="sm"
            onClick={() => window.open(result.published_url, '_blank')}
            className="bg-green-600 hover:bg-green-700"
          >
            View Post
          </Button>
        ),
      });

      // Update user limit status
      await checkUserLimit();

    } catch (error: any) {
      console.error('Generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate blog post",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      builderAIAgent.unregisterProgressCallback(sessionId);
    }
  };

  const copyUrl = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost.published_url);
      toast({
        title: "URL Copied!",
        description: "Blog post URL copied to clipboard",
      });
    }
  };

  const resetForm = () => {
    setKeyword('');
    setAnchorText('');
    setTargetUrl('');
    setGeneratedPost(null);
    setProgress(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Main Generation Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">Builder.io AI Content Generator</div>
              <div className="text-sm text-gray-600">Generate 1000+ word SEO-optimized blog posts instantly</div>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* API Status - Hidden but still functional */}

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

          {/* Progress Display */}
          {isGenerating && progress && (
            <div className="space-y-3 p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-800">{progress.stage}</div>
                <div className="text-sm text-gray-600">{progress.progress}%</div>
              </div>
              <Progress value={progress.progress} className="h-3" />
              <div className="text-sm text-gray-600">{progress.details}</div>
              <div className="text-xs text-gray-500">
                {progress.timestamp.toLocaleTimeString()}
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
                <Sparkles className="mr-2 h-5 w-5" />
                Create Your First Backlink For Free
              </>
            )}
          </Button>

          {/* Usage Info */}
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-4">
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
                <span>24h auto-delete</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Result Card */}
      {generatedPost && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-800">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Blog Post Generated Successfully!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-green-700">Title</Label>
                <p className="text-sm text-gray-700 font-medium">{generatedPost.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-green-700">Word Count</Label>
                <p className="text-sm text-gray-700 font-medium">{generatedPost.word_count} words</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-700">Published URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={generatedPost.published_url}
                  readOnly
                  className="bg-white text-sm"
                />
                <Button onClick={copyUrl} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => window.open(generatedPost.published_url, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="text-sm text-gray-600">
                Post expires: {new Date(generatedPost.expires_at).toLocaleString()}
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300">
                <Clock className="h-3 w-3 mr-1" />
                24 hours remaining
              </Badge>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/blog/${generatedPost.slug}`)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Blog Post
              </Button>
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Generate Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
