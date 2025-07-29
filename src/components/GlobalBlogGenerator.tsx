import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { openAIContentGenerator, ContentGenerationRequest } from '@/services/openAIContentGenerator';
import { freeBacklinkService } from '@/services/freeBacklinkService';
import { WordCountProgress } from './WordCountProgress';
import { contentModerationService } from '@/services/contentModerationService';
import { adminSyncService } from '@/services/adminSyncService';
import { useAuthStatus } from '@/hooks/useAuth';
import { trackBlogGeneration } from '@/hooks/useGuestTracking';
import { MultiApiContentGenerator } from '@/services/multiApiContentGenerator';
import {
  Globe,
  Zap,
  Target,
  Clock,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BarChart3,
  Link2,
  Settings,
  RefreshCw,
  Eye
} from 'lucide-react';

interface GlobalBlogRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  sessionId: string;
  additionalContext?: {
    industry?: string;
    contentTone: 'professional' | 'casual' | 'technical' | 'friendly';
    contentLength: 'short' | 'medium' | 'long';
    seoFocus: 'high' | 'medium' | 'balanced';
  };
}

interface GlobalBlogGeneratorProps {
  onSuccess?: (blogPost: any) => void;
  variant?: 'homepage' | 'blog' | 'embedded';
  showAdvancedOptions?: boolean;
}

export function GlobalBlogGenerator({ 
  onSuccess, 
  variant = 'homepage',
  showAdvancedOptions = false 
}: GlobalBlogGeneratorProps) {
  // Form state
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [anchorText, setAnchorText] = useState('');
  
  // Advanced options
  const [industry, setIndustry] = useState('');
  const [contentTone, setContentTone] = useState<'professional' | 'casual' | 'technical' | 'friendly'>('professional');
  const [contentLength, setContentLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [seoFocus, setSeoFocus] = useState<'high' | 'medium' | 'balanced'>('high');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [remainingRequests, setRemainingRequests] = useState(0);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'content' | 'seo' | 'links'>('content');

  // API status state
  const [apiStatus, setApiStatus] = useState<{
    status: 'checking' | 'ready' | 'error' | 'partial' | 'retrying';
    message: string;
    details?: string;
    retryAttempt?: number;
    maxRetries?: number;
  }>({
    status: 'checking',
    message: 'Checking API status...'
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStatus();

  useEffect(() => {
    try {
      loadGlobalStats();
      updateRemainingRequests();
      checkApiStatus();

      // Set up aggressive retry mechanism - retry every 10 seconds until connected
      const statusInterval = setInterval(() => {
        if (apiStatus.status === 'error' || apiStatus.status === 'checking') {
          console.log('🔄 Auto-retrying API connection...');
          checkApiStatus();
        }
      }, 10 * 1000); // 10 seconds for aggressive retry

      // Additional long-term monitoring every 2 minutes for maintenance
      const maintenanceInterval = setInterval(() => {
        if (apiStatus.status === 'ready') {
          // Occasional health check when ready
          checkApiStatus();
        }
      }, 2 * 60 * 1000); // 2 minutes

      return () => {
        clearInterval(statusInterval);
        clearInterval(maintenanceInterval);
      };
    } catch (error) {
      console.error('Error initializing GlobalBlogGenerator:', error);
      // Set safe defaults
      setGlobalStats({
        totalPosts: 0,
        postsToday: 0,
        activeUsers: null,
        averageQuality: null
      });
      setRemainingRequests(5);
      setApiStatus({
        status: 'error',
        message: 'Initialization error',
        details: 'Failed to initialize the blog generator'
      });
    }
  }, [apiStatus.status]);

  const loadGlobalStats = async () => {
    // Simple stats from localStorage for OpenAI-only system
    try {
      const allPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
      const today = new Date().toDateString();
      const postsToday = allPosts.filter((post: any) =>
        new Date(post.created_at).toDateString() === today
      ).length;

      setGlobalStats({
        totalPosts: allPosts.length,
        postsToday,
        activeUsers: null,
        averageQuality: null
      });
    } catch (error) {
      console.warn('Could not load stats:', error);
      setGlobalStats({
        totalPosts: 0,
        postsToday: 0,
        activeUsers: null,
        averageQuality: null
      });
    }
  };

  const updateRemainingRequests = () => {
    // All users get unlimited requests if OpenAI is configured
    const remaining = openAIContentGenerator.isConfigured() ? 999 : 0;
    setRemainingRequests(remaining);
  };

  const checkApiStatus = async () => {
    try {
      // Set initial checking state with encouraging message
      setApiStatus({
        status: 'checking',
        message: 'Connecting to AI service...',
        details: 'Establishing secure connection',
        retryAttempt: 1,
        maxRetries: 8
      });

      // Check OpenAI API key first
      const hasApiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!hasApiKey || hasApiKey === 'sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE') {
        setApiStatus({
          status: 'error',
          message: 'API key required',
          details: 'Please configure your OpenAI API key'
        });
        return;
      }

      // Check OpenAI service configuration
      const openAIConfigured = openAIContentGenerator.isConfigured();
      if (!openAIConfigured) {
        setApiStatus({
          status: 'error',
          message: 'Configuration error',
          details: 'OpenAI service not properly configured'
        });
        return;
      }

      // Simplified connection test - just verify the key format and configuration
      setApiStatus({
        status: 'checking',
        message: 'Validating API configuration...',
        details: 'Checking credentials'
      });

      console.log('🔍 Validating OpenAI API key...');

      // Simple validation - if key exists and looks valid, assume it's ready
      // This avoids CORS issues with the models endpoint
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const isValidKeyFormat = apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;

      if (isValidKeyFormat) {
        console.log('✅ API key format is valid');
        setApiStatus({
          status: 'ready',
          message: 'AI service ready',
          details: 'Configuration validated'
        });
      } else {
        console.log('❌ Invalid API key format');
        setApiStatus({
          status: 'error',
          message: 'Invalid API key',
          details: 'Please check your OpenAI API key format'
        });
      }

    } catch (error) {
      console.error('API status check failed:', error);
      setApiStatus({
        status: 'error',
        message: 'Connection error',
        details: 'Failed to verify API status'
      });
    }
  };



  const formatUrl = (url: string): string => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return trimmedUrl;

    // If URL already has protocol, return as is
    if (trimmedUrl.match(/^https?:\/\//)) {
      return trimmedUrl;
    }

    // Add https:// protocol if missing
    return `https://${trimmedUrl}`;
  };

  const validateForm = (): boolean => {
    if (!targetUrl.trim()) {
      toast({
        title: "Target URL required",
        description: "Please enter the URL you want to create a backlink to.",
        variant: "destructive",
      });
      return false;
    }

    if (!primaryKeyword.trim()) {
      toast({
        title: "Primary keyword required",
        description: "Please enter the main keyword for your blog post.",
        variant: "destructive",
      });
      return false;
    }

    // Auto-format URL and update state
    const formattedUrl = formatUrl(targetUrl);
    if (formattedUrl !== targetUrl) {
      setTargetUrl(formattedUrl);
    }

    try {
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com).",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    // Enhanced content moderation check before proceeding
    const moderationResult = await contentModerationService.moderateContent(
      `${targetUrl} ${primaryKeyword} ${anchorText || ''}`,
      targetUrl,
      primaryKeyword,
      anchorText,
      undefined, // No user ID for guest users
      'blog_request'
    );

    if (!moderationResult.allowed) {
      if (moderationResult.requiresReview) {
        toast({
          title: "Content submitted for review",
          description: "Your request has been flagged for administrative review. You'll be notified once the review is complete.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Content blocked",
          description: "Your request contains terms that violate our content policy. Please try again with appropriate content.",
          variant: "destructive",
        });
      }
      return;
    }

    // Check if API is configured
    if (remainingRequests <= 0) {
      toast({
        title: "API not configured",
        description: "OpenAI API is not properly configured. Please check the configuration.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setGenerationStage('Initializing global generation...');

    // Track for guest users
    if (!isLoggedIn) {
      trackBlogGeneration();
    }

    try {
      // Simulate realistic generation progress
      const progressStages = [
        { stage: 'Analyzing target URL and keywords...', progress: 15 },
        { stage: 'Gathering global context and trends...', progress: 30 },
        { stage: 'Generating contextual content...', progress: 50 },
        { stage: 'Optimizing for SEO and readability...', progress: 70 },
        { stage: 'Creating natural backlink integration...', progress: 85 },
        { stage: 'Finalizing and publishing...', progress: 95 }
      ];

      for (const { stage, progress: stageProgress } of progressStages) {
        setGenerationStage(stage);
        setProgress(stageProgress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const sessionId = crypto.randomUUID();
      const formattedTargetUrl = formatUrl(targetUrl.trim());
      const request: GlobalBlogRequest = {
        targetUrl: formattedTargetUrl,
        primaryKeyword: primaryKeyword.trim(),
        anchorText: anchorText.trim() || undefined,
        sessionId,
        additionalContext: showAdvancedOptions ? {
          industry: industry || undefined,
          contentTone,
          contentLength,
          seoFocus
        } : undefined
      };

      // Track the request for admin monitoring
      adminSyncService.trackFreeBacklinkRequest({
        targetUrl: request.targetUrl,
        primaryKeyword: request.primaryKeyword,
        anchorText: request.anchorText,
        sessionId: request.sessionId
      });

      // Use the new OpenAI-only content generator with enhanced retry configuration
      const contentRequest: ContentGenerationRequest = {
        targetUrl: request.targetUrl,
        primaryKeyword: request.primaryKeyword,
        anchorText: request.anchorText,
        wordCount: 1500,
        tone: 'professional' as const,
        contentType: 'how-to' as const,
        retryConfig: {
          maxRetries: 12,
          baseDelay: 2000,
          maxDelay: 60000,
          exponentialBackoff: true,
          retryOnRateLimit: true,
          retryOnServerError: true,
          retryOnNetworkError: true,
          retryOnTimeout: true
        }
      };

      // Update progress to show content generation with retry attempts
      setGenerationStage('Generating high-quality content with AI (up to 12 automatic retries if needed)...');
      setProgress(60);

      const result = await openAIContentGenerator.generateContent(contentRequest);

      // Update progress after successful generation
      setProgress(80);
      setGenerationStage('Content generated! Finalizing...');

      // Store the result for 24-hour management
      freeBacklinkService.storeFreeBacklink(result);

      // Process the successful result
      if (result && result.content) {
        setProgress(100);
        setGenerationStage('Generation complete!');

        // Generate a unique slug for the blog post with enhanced randomization
        const timestamp = Date.now().toString(36);
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const uniqueSlug = `${result.slug}-${timestamp}-${randomSuffix}`;

        // Convert free backlink result to match the expected format
        const blogPost = {
          id: result.id,
          title: result.title,
          content: result.content,
          excerpt: result.metaDescription,
          slug: uniqueSlug,
          keywords: result.keywords,
          meta_description: result.metaDescription,
          target_url: result.targetUrl,
          anchor_text: result.anchorText,
          seo_score: result.seoScore,
          reading_time: result.readingTime,
          published_url: `${window.location.origin}/blog/${uniqueSlug}`,
          is_trial_post: true,
          expires_at: result.expiresAt,
          created_at: result.createdAt,
          updated_at: result.createdAt
        };

        // Store the blog post for /blog/[slug] access
        try {
          localStorage.setItem(`blog_post_${uniqueSlug}`, JSON.stringify(blogPost));

          // Also add to the global blog posts list
          const allBlogPosts = JSON.parse(localStorage.getItem('all_blog_posts') || '[]');
          const blogMeta = {
            id: blogPost.id,
            slug: uniqueSlug,
            title: blogPost.title,
            excerpt: blogPost.excerpt,
            created_at: blogPost.created_at,
            is_trial_post: blogPost.is_trial_post,
            expires_at: blogPost.expires_at,
            seo_score: blogPost.seo_score,
            reading_time: blogPost.reading_time
          };

          allBlogPosts.unshift(blogMeta);
          localStorage.setItem('all_blog_posts', JSON.stringify(allBlogPosts));

          console.log('✅ Blog post published successfully:', {
            slug: uniqueSlug,
            url: `${window.location.origin}/blog/${uniqueSlug}`
          });
        } catch (error) {
          console.error('❌ Failed to store blog post:', error);
        }

        setGeneratedPost(blogPost);

        // Update remaining requests
        updateRemainingRequests();

        // Check if this was generated with fallback content (when OpenAI is not available)
        const isFromFallback = result.error || result.usage.tokens === 0;

        toast({
          title: "Blog post generated successfully! ���",
          description: isFromFallback
            ? "Your free backlink post is ready! Generated using our reliable fallback system. It will auto-delete in 24 hours unless you register an account."
            : "Your free backlink post is ready! It will auto-delete in 24 hours unless you register an account.",
          action: (
            <Button
              size="sm"
              onClick={() => navigate(`/blog/${uniqueSlug}`)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              View Blog Post
            </Button>
          ),
        });

        // Track successful blog generation for admin monitoring
        adminSyncService.trackBlogGenerated({
          sessionId: request.sessionId,
          blogSlug: result.slug,
          targetUrl: request.targetUrl,
          primaryKeyword: request.primaryKeyword,
          seoScore: result.seoScore,
          generationTime: 45, // Approximate generation time
          isTrialPost: true,
          expiresAt: result.expiresAt
        });

        onSuccess?.(blogPost);

        // Navigate to blog post if in blog variant
        if (variant === 'blog') {
          navigate(`/blog/${uniqueSlug}`);
        }

      } else {
        throw new Error('Content generation failed completely. Please try again or use the dedicated Free Backlink feature.');
      }

    } catch (error: any) {
      console.error('Global blog generation error:', {
        error: error.message || 'Unknown error',
        stack: error.stack,
        context: error.context,
        timestamp: new Date().toISOString()
      });

      // Reset all generation state
      setProgress(0);
      setGenerationStage('');
      setGeneratedPost(null);

      // Provide specific error handling with more details
      const errorMessage = error.message || 'Unknown error';
      const errorContext = error.context;
      let title = "Generation failed";
      let description = "An unexpected error occurred. Please try again.";
      let detailedInfo = "";

      // Add timing and context information if available
      if (errorContext) {
        detailedInfo = ` (Error ${errorContext.status} at ${new Date(errorContext.timestamp).toLocaleTimeString()})`;
      }

      const isConfigError = errorMessage.includes('not configured') ||
                           errorMessage.includes('Invalid API key') ||
                           errorMessage.includes('401');

      if (errorMessage.includes('Invalid API key') || errorMessage.includes('401') ||
          errorMessage.includes('OpenAI API key is not configured') || isConfigError) {
        title = "Service Configuration Issue";
        description = "The AI service is not properly configured. Please try again or contact support." + detailedInfo;
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        title = "Service Busy - Rate Limited";
        description = "Too many requests right now. Please wait a few minutes and try again." + detailedInfo;
      } else if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        title = "Service Quota Issue";
        description = "Service quota reached. Please try again later." + detailedInfo;
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        title = "Request Timeout";
        description = "The request took too long. We automatically retry, but you can try again if needed." + detailedInfo;
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        title = "Connection Issue";
        description = "Network connection problem. Please check your connection and try again." + detailedInfo;
      } else if (errorMessage.includes('failed after') && errorMessage.includes('attempts')) {
        title = "Multiple Attempts Failed";
        description = "Despite automatic retries, generation failed. Please try again in a few moments." + detailedInfo;
      } else {
        title = "Generation Failed";
        description = `Generation error: ${errorMessage}` + detailedInfo;
      }

      toast({
        title,
        description,
        variant: "destructive",
        duration: 10000,
      });

      // Enhanced debugging in development
      if (import.meta.env.DEV) {
        console.log('📊 Enhanced debugging info:', {
          originalError: errorMessage,
          errorContext,
          retryAttempts: 'Check retry logs above',
          timestamp: new Date().toISOString()
        });
      }

      // If it's a config error, suggest the free backlink feature
      if (isConfigError) {
        setTimeout(() => {
          toast({
            title: "💡 Try Free Backlink Feature",
            description: "Generate high-quality blog posts with our dedicated free backlink tool!",
            action: (
              <Button
                size="sm"
                onClick={() => navigate('/free-backlink')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Try Free Backlink
              </Button>
            ),
          });
        }, 2000);
      }
    } finally {
      setIsGenerating(false);
      // Ensure progress is reset in case of any hanging state
      setProgress(0);
      setGenerationStage('');
    }
  };

  const resetForm = () => {
    setTargetUrl('');
    setPrimaryKeyword('');
    setAnchorText('');
    setGeneratedPost(null);
    setProgress(0);
    setGenerationStage('');
    setShowPreview(false);
  };



  const renderGenerationProgress = () => {
    if (!isGenerating && !generatedPost) return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          {isGenerating ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-medium">Generating your global backlink post...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{generationStage}</p>

              {/* Word Count Progress */}
              <div className="mt-4">
                <WordCountProgress
                  targetWords={1500}
                  isGenerating={isGenerating}
                  onComplete={(finalCount) => {
                    console.log('Global blog generation completed with', finalCount, 'words');
                  }}
                />
              </div>
            </div>
          ) : generatedPost ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Blog post generated successfully!</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">SEO Score</div>
                  <div className="text-lg font-semibold text-green-600">{generatedPost.seo_score}/100</div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">Reading Time</div>
                  <div className="text-lg font-semibold text-blue-600">{generatedPost.reading_time}m</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">Keywords</div>
                  <div className="text-lg font-semibold text-purple-600">{generatedPost.keywords?.length || 0}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowPreview(true)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Post
                </Button>
                <Button 
                  onClick={() => navigate(`/blog/${generatedPost.slug}`)}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const renderPreviewModal = () => {
    if (!showPreview || !generatedPost) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Blog Post Preview
            </CardTitle>
            <Button variant="ghost" onClick={() => setShowPreview(false)}>×</Button>
          </CardHeader>
          
          <CardContent className="overflow-y-auto max-h-[70vh]">
            <Tabs value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-4">{generatedPost.title}</h2>
                  <div className="prose max-w-none text-sm" 
                       dangerouslySetInnerHTML={{ __html: generatedPost.content?.replace(/\n/g, '<br>') }} />
                </div>
              </TabsContent>
              
              <TabsContent value="seo" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Meta Description</Label>
                    <p className="text-sm text-muted-foreground p-2 bg-gray-50 rounded">{generatedPost.meta_description}</p>
                  </div>
                  <div>
                    <Label>Keywords</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generatedPost.keywords?.map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="links" className="space-y-4">
                <div>
                  <Label>Primary Link</Label>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-600" />
                      <a href={generatedPost.target_url} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">{generatedPost.anchor_text}</a>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Contextually integrated into the content</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">


      {/* Main Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-blue-600" />
              <CardTitle>Create Your First Backlink For Free</CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Live & Dynamic
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {apiStatus.status === 'ready' ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-600">Ready</span>
                </div>
              ) : apiStatus.status === 'error' ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-600">Error</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-600">Connecting</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-muted-foreground">
            Generate high-quality blog posts with natural contextual backlinks. 
            Our AI creates content based on global trends and user inputs from around the world.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Generation Progress */}
          {renderGenerationProgress()}

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL *</Label>
              <Input
                id="targetUrl"
                placeholder="example.com"
                value={targetUrl}
                onChange={(e) => {
                  const value = e.target.value;
                  setTargetUrl(value);

                  // Auto-format as user types (after they stop typing for 500ms)
                  clearTimeout((window as any).urlFormatTimeout);
                  (window as any).urlFormatTimeout = setTimeout(() => {
                    const formatted = formatUrl(value);
                    if (formatted !== value && formatted.trim() && value.trim()) {
                      setTargetUrl(formatted);
                    }
                  }, 500);
                }}
                onBlur={(e) => {
                  // Immediate format on blur
                  clearTimeout((window as any).urlFormatTimeout);
                  const formatted = formatUrl(e.target.value);
                  if (formatted !== e.target.value && formatted.trim()) {
                    setTargetUrl(formatted);
                  }
                }}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryKeyword">Primary Keyword *</Label>
              <Input
                id="primaryKeyword"
                placeholder="SEO optimization"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anchorText">Anchor Text (optional)</Label>
            <Input
              id="anchorText"
              placeholder="Custom anchor text for your backlink"
              value={anchorText}
              onChange={(e) => setAnchorText(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <Card className="p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Advanced Options</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Tone</Label>
                  <Select value={contentTone} onValueChange={(value: any) => setContentTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content Length</Label>
                  <Select value={contentLength} onValueChange={(value: any) => setContentLength(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (500-800 words)</SelectItem>
                      <SelectItem value="medium">Medium (800-1200 words)</SelectItem>
                      <SelectItem value="long">Long (1200+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || remainingRequests <= 0 || apiStatus.status !== 'ready'}
              className={`flex-1 transition-all duration-300 ${
                apiStatus.status === 'ready'
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg'
                  : 'bg-gradient-to-r from-gray-400 to-gray-500'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : apiStatus.status === 'ready' ? (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Create Permanent Link
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  {apiStatus.status === 'retrying' ? 'Connecting...' : 'Preparing...'}
                </>
              )}
            </Button>
            
            {generatedPost && (
              <Button variant="outline" onClick={resetForm}>
                Create Another
              </Button>
            )}
          </div>


        </CardContent>
      </Card>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
}
