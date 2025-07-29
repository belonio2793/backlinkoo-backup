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

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStatus();

  useEffect(() => {
    try {
      loadGlobalStats();
      updateRemainingRequests();
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
    }
  }, []);

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
    // Simple rate limiting - just check if OpenAI is configured
    const remaining = openAIContentGenerator.isConfigured() ? 10 : 0;
    setRemainingRequests(remaining);
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

    if (remainingRequests <= 0) {
      toast({
        title: "Rate limit reached",
        description: "You've reached the free tier limit. Please try again later or sign up for unlimited access.",
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

      // Use the new OpenAI-only content generator
      const contentRequest: ContentGenerationRequest = {
        targetUrl: request.targetUrl,
        primaryKeyword: request.primaryKeyword,
        anchorText: request.anchorText,
        wordCount: 1500,
        tone: 'professional' as const,
        contentType: 'how-to' as const
      };

      const result = await openAIContentGenerator.generateContent(contentRequest);

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
          title: "Blog post generated successfully! 🎉",
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
      console.error('Global blog generation error:', error);

      // Reset all generation state
      setProgress(0);
      setGenerationStage('');
      setGeneratedPost(null);

      // Check if this is an OpenAI or configuration error
      const isConfigError = error.message && (
        error.message.includes('not configured') ||
        error.message.includes('API key') ||
        error.message.includes('OpenAI')
      );

      toast({
        title: "Generation failed",
        description: isConfigError
          ? "AI service temporarily unavailable. Try our dedicated Free Backlink feature for reliable generation!"
          : error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });

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
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{remainingRequests} requests remaining</span>
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
                placeholder="example.com (https:// will be added automatically)"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                onBlur={(e) => {
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
              disabled={isGenerating || remainingRequests <= 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Create Permanent Link
                </>
              )}
            </Button>
            
            {generatedPost && (
              <Button variant="outline" onClick={resetForm}>
                Create Another
              </Button>
            )}
          </div>

          {/* Rate Limit Warning */}
          {remainingRequests <= 2 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                {remainingRequests === 0 
                  ? "You've reached the free tier limit. Sign up for unlimited access!"
                  : `Only ${remainingRequests} request${remainingRequests === 1 ? '' : 's'} remaining. Sign up for unlimited access!`
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
}
