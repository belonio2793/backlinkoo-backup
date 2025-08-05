import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStatus } from '@/hooks/useAuth';
import { chatGPTBlogGenerator } from '@/services/chatGPTBlogGenerator';
import { productionBlogGenerator } from '@/services/productionBlogGenerator';
import { errorLogger, ErrorSeverity, ErrorCategory } from '@/services/errorLoggingService';
import BlogGenerationError from './BlogGenerationError';
import { supabase } from '@/integrations/supabase/client';
import { SavePostSignupPopup } from './SavePostSignupPopup';
import { GenerationSequence } from './GenerationSequence';
import { InteractiveContentGenerator } from './InteractiveContentGenerator';
import { MultiBlogGenerator } from './MultiBlogGenerator';
import { ClaimTrialPostDialog } from './ClaimTrialPostDialog';
import { AdaptiveProgressIndicator } from './AdaptiveProgressIndicator';
import { MinimalisticSuccessSection } from './MinimalisticSuccessSection';
import {
  Sparkles,
  Link2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Star,
  Zap,
  Globe,
  Target,
  TrendingUp,
  Save,
  AlertCircle,
  FileText,
  BarChart3,
  Shield
} from 'lucide-react';
import { RotatingText } from './RotatingText';
import { LoginModal } from './LoginModal';


/**
 * HomepageBlogGenerator - Main component for generating high-quality blog posts with backlinks
 * Features: Netlify function integration with fallback, error handling, trial/permanent post management
 * Last updated: January 2025 - Enhanced error handling and blog post storage
 */
export function HomepageBlogGenerator() {
  // Form state - Following ChatGPT specification
  const [targetUrl, setTargetUrl] = useState(''); // destinationURL
  const [primaryKeyword, setPrimaryKeyword] = useState(''); // targetKeyword
  const [anchorText, setAnchorText] = useState(''); // anchorText (optional)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [forceComplete, setForceComplete] = useState(false);

  // Content state
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [allGeneratedPosts, setAllGeneratedPosts] = useState<any[]>([]);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [blogPostId, setBlogPostId] = useState<string>('');

  // UI state
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [generationError, setGenerationError] = useState<Error | string | null>(null);

  const { toast } = useToast();
  const { currentUser, isCheckingAuth, isLoggedIn, isGuest, authChecked } = useAuthStatus();

  // ENTERPRISE DEBUG & MONITORING
  useEffect(() => {
    if (authChecked) {
      console.log('🔐 ENTERPRISE AUTH STATUS:', {
        isLoggedIn: isLoggedIn,
        isGuest: isGuest,
        authChecked: authChecked,
        currentUser: !!currentUser,
        timestamp: new Date().toISOString()
      });
    }
  }, [authChecked, isLoggedIn]);

  // ENTERPRISE STATE MONITORING
  useEffect(() => {
    console.log('📊 ENTERPRISE STATE UPDATE:', {
      isGenerating,
      isCompleted,
      showProgress,
      forceComplete,
      hasGeneratedPost: !!generatedPost,
      hasPublishedUrl: !!publishedUrl,
      hasBlogPostId: !!blogPostId,
      timestamp: new Date().toISOString()
    });
  }, [isGenerating, isCompleted, showProgress, forceComplete, generatedPost, publishedUrl, blogPostId]);

  const handleGenerate = async () => {
    console.log('🚀 ENTERPRISE BLOG GENERATION INITIATED');

    // Track blog generation attempt for guest users
    if (!isLoggedIn) {

    }
    console.log('📋 Generation Parameters:', {
      targetUrl,
      primaryKeyword,
      userType: isLoggedIn ? 'AUTHENTICATED' : 'TRIAL',
      timestamp: new Date().toISOString()
    });

    // Clear any previous errors
    setGenerationError(null);

    // ============= ENTERPRISE VALIDATION LAYER =============
    if (!targetUrl || !primaryKeyword) {
      console.error('❌ VALIDATION FAILED: Missing required parameters');
      toast({
        title: "⚠️ Missing Required Information",
        description: "Both target URL and primary keyword are required to proceed",
        variant: "destructive"
      });
      return;
    }

    if (!isValidUrl(targetUrl)) {
      console.error('❌ VALIDATION FAILED: Invalid URL format');
      toast({
        title: "⚠️ Invalid URL Format",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }

    // ============= ENTERPRISE INITIALIZATION =============
    console.log('✅ VALIDATION PASSED - Initializing generation process');

    // Reset all states for clean start
    setIsGenerating(true);
    setIsCompleted(false);
    setShowProgress(true);
    setGeneratedPost(null);
    setPublishedUrl('');
    setBlogPostId('');

    // Enterprise-grade user feedback
    toast({
      title: isLoggedIn ? "🚀 Creating Your Professional Backlink" : "🎯 Starting Your Free Trial",
      description: isLoggedIn
        ? "Generating high-quality content with permanent backlinks..."
        : "Creating demo content - upgrade to save permanently!",
    });

    try {
      console.log('🔄 BLOG GENERATION PIPELINE STARTED');

      // Use Self-Contained Production Generator as primary method
      const blogInput = {
        destinationURL: targetUrl,
        targetKeyword: primaryKeyword,
        anchorText: anchorText || primaryKeyword // Default to keyword if no anchor text
      };

      console.log('📋 Generation Input:', blogInput);

      let result = await productionBlogGenerator.generateAndPublishBlog(
        blogInput,
        currentUser?.id
      );

      // Fallback to ChatGPT generator if needed (though this should be reliable)
      if (!result.success) {
        console.log('⚠️ Self-contained generator failed, trying ChatGPT fallback...');
        result = await chatGPTBlogGenerator.generateAndPublishBlog(
          blogInput,
          currentUser?.id
        );
      }

      if (!result.success) {
        throw new Error(result.error || 'Blog generation failed');
      }

      console.log('✅ Blog Generation Pipeline Success:', result);

      // Convert to expected format for UI compatibility
      const data = {
        success: true,
        slug: result.blogPost?.slug,
        blogPost: {
          id: result.blogPost?.id,
          title: result.blogPost?.title,
          content: result.blogPost?.content,
          meta_description: result.blogPost?.metaDescription,
          excerpt: result.blogPost?.metaDescription,
          keywords: [primaryKeyword],
          target_url: targetUrl,
          published_url: result.livePostURL,
          status: 'published',
          is_trial_post: !currentUser,
          expires_at: result.expiresIn === '24 hours' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
          seo_score: result.blogPost?.seoScore || 92,
          contextual_links: [
            { anchor: anchorText || primaryKeyword, url: targetUrl }
          ],
          word_count: result.blogPost?.wordCount || 1200,
          reading_time: Math.ceil((result.blogPost?.wordCount || 1200) / 200),
          author_name: 'Backlinkoo Editorial Team',
          author_avatar: '/placeholder.svg',
          tags: [primaryKeyword, 'Professional Guide', 'SEO Content'],
          category: 'Professional Guides',
          featured_image: `https://images.unsplash.com/1600x900/?${encodeURIComponent(primaryKeyword)}`,
          slug: result.blogPost?.slug,
          created_at: new Date().toISOString(),
          published_at: result.blogPost?.publishedAt,
          updated_at: new Date().toISOString(),
          view_count: 0
        },
        publishedUrl: result.livePostURL
      };



      if (!data.success) {
        throw new Error('Failed to generate blog post');
      }

      const { slug, blogPost, publishedUrl } = data;

      // Create campaign entry for registered users
      if (isLoggedIn) {
        try {
          const { data: campaignData, error: campaignError } = await supabase
            .from('campaigns')
            .insert({
              name: `Live Blog: ${blogPost.title}`,
              target_url: targetUrl,
              keywords: [primaryKeyword],
              status: 'completed',
              links_requested: blogPost.contextual_links?.length || 1,
              links_delivered: blogPost.contextual_links?.length || 1,
              completed_backlinks: [publishedUrl],
              user_id: currentUser.id,
              credits_used: 1
            })
            .select()
            .single();

          if (campaignError) {
            console.warn('Failed to create campaign entry:', campaignError);
          } else {
            console.log('✅ Campaign created successfully:', campaignData);
          }
        } catch (error) {
          console.warn('Failed to create campaign entry:', error);
        }
      }

      // ============= ENTERPRISE SUCCESS HANDLING =============
      console.log('🎯 GENERATION SUCCESSFUL - Processing results');
      console.log('📊 Generated Content Data:', {
        title: blogPost.title,
        wordCount: blogPost.word_count,
        seoScore: blogPost.seo_score,
        publishedUrl,
        isTrialPost: blogPost.is_trial_post,
        userId: blogPost.user_id
      });

      // Set all completion data atomically
      setGeneratedPost(blogPost);
      setPublishedUrl(publishedUrl);
      setBlogPostId(blogPost.id);

      // Verify the blog post is accessible
      if (blogPost.slug) {
        console.log('📝 Blog post details:', {
          slug: blogPost.slug,
          id: blogPost.id,
          title: blogPost.title,
          status: blogPost.status,
          isTrialPost: blogPost.is_trial_post,
          publishedUrl: publishedUrl,
          accessUrl: `/blog/${blogPost.slug}`
        });

        setTimeout(async () => {
          console.log('🔍 Verifying blog post accessibility...');
          const verification = await testBlogPostAccess(blogPost.slug);
          if (verification.success) {
            console.log('✅ Blog post verified as accessible at:', `/blog/${blogPost.slug}`);
            console.log('🌐 Full URL:', `${window.location.origin}/blog/${blogPost.slug}`);
          } else {
            console.warn('⚠️ Blog post verification failed:', verification.error);
            console.log('💡 Try refreshing the page or checking the blog listing at /blog');
          }
        }, 1000);
      }

      // Force immediate completion for enterprise UX
      console.log('⚡ FINALIZING RESULTS - Transitioning to completion state');
      setForceComplete(true);

      // ENTERPRISE COMPLETION GUARANTEE - Multiple validation layers
      const completeGeneration = () => {
        console.log('✅ MISSION ACCOMPLISHED - Displaying final results');
        console.log('🔍 FINAL VALIDATION:', {
          hasGeneratedPost: !!blogPost,
          hasPublishedUrl: !!publishedUrl,
          hasBlogPostId: !!blogPost?.id,
          completionTimestamp: new Date().toISOString()
        });

        // Validate all required data is present
        if (!blogPost || !publishedUrl || !blogPost.id) {
          console.error('🚨 CRITICAL: Incomplete data for completion state');
          toast({
            title: "⚠️ Generation Issue Detected",
            description: "Content created but display data incomplete. Please refresh or try again.",
            variant: "destructive"
          });
          return;
        }

        // Set completion state with validation
        setIsCompleted(true);
        setIsGenerating(false);
        setShowProgress(false);

        // Enterprise success confirmation
        toast({
          title: "🎉 Enterprise Backlink Successfully Deployed!",
          description: isLoggedIn
            ? `Professional content for "${primaryKeyword}" is now live with permanent backlinks`
            : `Trial content for "${primaryKeyword}" is live for 24 hours - register to save permanently!`,
          duration: 8000
        });

        // Additional verification
        console.log('🎯 COMPLETION STATE SET - User should now see results');
        console.log('📊 Final Data Summary:', {
          title: blogPost.title,
          url: publishedUrl,
          type: isLoggedIn ? 'PERMANENT' : 'TRIAL',
          seoScore: blogPost.seo_score || 85
        });
      };

      // Execute completion with slight delay for state consistency
      setTimeout(completeGeneration, 100);

      // Show appropriate toast based on generation mode
      const isUsingFallback = blogPost?.mode === 'fallback';

      toast({
        title: isUsingFallback ? "Blog Post Generated (Backup Mode)" : "Blog Post Generated!",
        description: isUsingFallback
          ? "Your blog post was created using our backup system. All features work normally!"
          : isLoggedIn
            ? "Your content is ready and saved to your dashboard!"
            : "Your demo preview is ready. Register to keep it forever!",
      });

      // Store trial post info for notification system
      if (isGuest && blogPost.is_trial_post) {
        const trialPostInfo = {
          id: blogPost.id,
          title: blogPost.title,
          slug: blogPost.slug,
          expires_at: blogPost.expires_at,
          target_url: targetUrl,
          created_at: blogPost.created_at
        };

        // Store in localStorage for notification tracking
        const existingTrialPosts = localStorage.getItem('trial_blog_posts');
        const trialPosts = existingTrialPosts ? JSON.parse(existingTrialPosts) : [];
        trialPosts.push(trialPostInfo);
        localStorage.setItem('trial_blog_posts', JSON.stringify(trialPosts));
      }

      // Show signup popup for guest users after a delay
      if (isGuest) {
        setTimeout(() => {
          setShowSignupPopup(true);
        }, 3000); // Show popup after 3 seconds
      }

    } catch (error) {
      // ============= ENTERPRISE ERROR HANDLING =============
      console.error('🚨 CRITICAL ERROR IN GENERATION PROCESS:', error);
      console.error('📋 Error Context:', {
        targetUrl,
        primaryKeyword,
        userType: isLoggedIn ? 'AUTHENTICATED' : 'TRIAL',
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });

      // Set the error state for detailed display
      setGenerationError(error instanceof Error ? error : String(error));

      // Log the error for tracking
      await errorLogger.logError(
        ErrorSeverity.HIGH,
        ErrorCategory.GENERAL,
        `Blog generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          error: error instanceof Error ? error : new Error(String(error)),
          context: {
            targetUrl,
            primaryKeyword,
            userId: currentUser?.id,
            isProduction: true
          },
          component: 'HomepageBlogGenerator',
          action: 'generate_blog_post'
        }
      );

      // Determine error type and user guidance
      let errorTitle = "⚠️ Generation Process Failed";
      let errorDescription = "An unexpected error occurred during blog generation.";
      let nextSteps = "Please try again or contact support if the issue persists.";

      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorTitle = "🔌 Service Temporarily Unavailable";
          errorDescription = "Our blog generation service is currently offline.";
          nextSteps = "Please try again in a few minutes. If this persists, contact our support team.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorTitle = "🌐 Connection Error";
          errorDescription = "Unable to connect to our generation service.";
          nextSteps = "Check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorTitle = "⏱️ Request Timeout";
          errorDescription = "Generation took longer than expected.";
          nextSteps = "This usually resolves itself. Please try again.";
        } else {
          errorDescription = error.message;
        }
      }

      // Enterprise-grade error notification
      toast({
        title: errorTitle,
        description: `${errorDescription} ${nextSteps}`,
        variant: "destructive",
        duration: 10000
      });

      // Reset all states to clean slate
      console.log('🔄 RESETTING STATES AFTER ERROR');
      setIsGenerating(false);
      setShowProgress(false);
      setForceComplete(false);
      setIsCompleted(false);
      setGeneratedPost(null);
      setPublishedUrl('');
      setBlogPostId('');
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const resetForm = () => {
    setTargetUrl('');
    setPrimaryKeyword('');
    setAnchorText('');
    setIsCompleted(false);
    setGeneratedPost(null);
    setAllGeneratedPosts([]);
    setPublishedUrl('');
    setShowProgress(false);
    setIsGenerating(false);
    setForceComplete(false);
    setGenerationError(null);
  };

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="relative z-10">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 font-mono text-xs">
            <RotatingText
              phrases={[
                "HIGH RANKING AUTHORITY",
                "DOMINATE THE COMPETITION",
                "GOOGLE EFFECTIVE",
                "SKYROCKET YOUR RANKINGS",
                "INSTANT SEO BOOST",
                "OUTRANK COMPETITORS",
                "TRAFFIC EXPLOSION",
                "AUTHORITY BUILDER"
              ]}
              interval={2500}
            />
          </Badge>
          <h2 className="text-4xl md:text-5xl font-light mb-6 tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Create Your First Backlink For Free
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
            Enter your URL and keyword to generate a high-quality blog post with a natural backlink.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Authentication Status Banner */}
          {authChecked && (
            <Card className={`mb-6 border-l-4 ${
              isLoggedIn
                ? 'border-l-green-500 bg-green-50 border-green-200'
                : 'border-l-amber-500 bg-amber-50 border-amber-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">
                            Welcome back! You're logged in
                          </p>
                          <p className="text-sm text-green-700">
                            Your backlinks will be saved permanently to your dashboard
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-800">
                            Guest Mode - Create your free trial backlink
                          </p>
                          <p className="text-sm text-amber-700">
                            Trial backlinks expire in 24 hours. Register to save permanently!
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {isGuest && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-600 text-amber-700 hover:bg-amber-100"
                      onClick={() => setShowLoginModal(true)}
                    >
                      Login / Register
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!isCompleted ? (
            showProgress ? (
              <AdaptiveProgressIndicator
                isActive={isGenerating}
                targetUrl={targetUrl}
                keyword={primaryKeyword}
                forceComplete={forceComplete}
                onProgressUpdate={(step, progress) => {
                  console.log(`Progress: ${step} - ${Math.round(progress)}%`);
                }}
                onNaturalComplete={() => {
                  console.log('🎉 Progress animation complete');
                  setShowProgress(false);
                  setIsGenerating(false);
                  setForceComplete(false);
                }}
              />
            ) : (
              <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-semibold">Enter Campaign Details</CardTitle>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>High-Quality Content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>Instant Publishing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span>Live Backlink</span>
                    </div>
                    {authChecked && (
                      <div className="flex items-center gap-2">
                        <Save className={`h-4 w-4 ${isLoggedIn ? 'text-green-500' : 'text-amber-500'}`} />
                        <span className={isLoggedIn ? 'text-green-600' : 'text-amber-600'}>
                          {isLoggedIn ? 'Permanent Save' : 'Trial Mode'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 px-8 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="targetUrl" className="text-base font-medium flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-blue-500" />
                        Your Website URL
                      </Label>
                      <Input
                        id="targetUrl"
                        placeholder="https://yourwebsite.com"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="text-base py-3 px-4 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                      <p className="text-sm text-gray-500">The URL you want to get a backlink to</p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="primaryKeyword" className="text-base font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        Primary Keyword
                      </Label>
                      <Input
                        id="primaryKeyword"
                        placeholder="e.g., digital marketing, SEO tools"
                        value={primaryKeyword}
                        onChange={(e) => setPrimaryKeyword(e.target.value)}
                        className="text-base py-3 px-4 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                      <p className="text-sm text-gray-500">The keyword you're ranking for</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="anchorText" className="text-base font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-green-500" />
                      Anchor Text (Optional)
                    </Label>
                    <Input
                      id="anchorText"
                      placeholder="Leave blank to use keyword as anchor text"
                      value={anchorText}
                      onChange={(e) => setAnchorText(e.target.value)}
                      className="text-base py-3 px-4 border-gray-200 focus:border-green-400 focus:ring-green-400"
                    />
                    <p className="text-sm text-gray-500">
                      Custom anchor text for your backlink. {anchorText || primaryKeyword ? `Will use: "${anchorText || primaryKeyword}"` : 'Defaults to your keyword'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      What You'll Get:
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-xs">
                        Production Ready
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>1,200+ word SEO-optimized blog post</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <span>Instant generation (no API delays)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>Professional content structure</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <span>Strategic dofollow backlinks</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !targetUrl || !primaryKeyword || isCheckingAuth}
                    size="lg"
                    className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg relative overflow-hidden"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        <span className="animate-pulse">
                          {showProgress
                            ? 'Processing Your Professional Backlink...'
                            : currentUser
                              ? 'Generating Content Instantly...'
                              : 'Creating Your Free Backlink...'
                          }
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-3 h-5 w-5" />
                        <span>
                          {currentUser
                            ? 'Create Permanent Link'
                            : 'Start Free Trial'
                          }
                        </span>
                      </>
                    )}
                    {isGenerating && (
                      <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-pulse w-full"></div>
                    )}
                  </Button>

                  {/* Enterprise Status & Validation Display */}
                  <div className="text-center space-y-2">
                    {isGenerating && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                        GENERATING YOUR CONTENT
                      </div>
                    )}
                    {!isGenerating && targetUrl && primaryKeyword && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        READY TO GENERATE
                      </div>
                    )}
                  </div>

                  {authChecked && (
                    <div className="text-center text-sm">
                      {currentUser ? (
                        <div className="space-y-2">
                          <p className="text-green-600 font-medium">
                            ✅ Logged in - Your backlinks will be saved permanently
                          </p>
                          <p className="text-gray-500">
                            Welcome back! Your content will be saved to your dashboard.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-amber-600 font-medium">
                            ⚠️ Guest Mode - Trial backlink (24 hours)
                          </p>
                          <p className="text-gray-500">
                            Completely free • No signup required • Register to save permanently
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {isCheckingAuth && (
                    <p className="text-center text-sm text-gray-500">
                      Checking authentication status...
                    </p>
                  )}

                  {generationError && (
                    <div className="mt-6">
                      <BlogGenerationError
                        error={generationError}
                        targetUrl={targetUrl}
                        keyword={primaryKeyword}
                        onRetry={handleGenerate}
                        onDismiss={() => setGenerationError(null)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          ) : (
            // Success state - Minimalistic design
            <MinimalisticSuccessSection
              publishedUrl={publishedUrl}
              generatedPost={generatedPost}
              primaryKeyword={primaryKeyword}
              targetUrl={targetUrl}
              currentUser={currentUser}
              onCreateAnother={resetForm}
            />
          )}
        </div>
      </div>

      <SavePostSignupPopup
        isOpen={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
        blogPostId={blogPostId}
        blogPostUrl={publishedUrl}
        blogPostTitle={generatedPost?.title}
        onSignupSuccess={(user) => {
          setShowSignupPopup(false);
          window.location.reload();
        }}
        timeRemaining={86400}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={(user) => {
          setShowLoginModal(false);
          // Navigate to dashboard after successful auth
          window.location.href = '/dashboard';
        }}
        defaultTab="login"
      />
    </div>
  );
}
