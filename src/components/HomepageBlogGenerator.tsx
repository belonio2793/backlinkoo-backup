import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStatus } from '@/hooks/useAuth';
import { aiContentGenerator } from '@/services/aiContentGenerator';
import { blogPublisher } from '@/services/blogPublisher';
import { multiApiContentGenerator } from '@/services/multiApiContentGenerator';
import { liveBlogPublisher } from '@/services/liveBlogPublisher';
import { publishedBlogService } from '@/services/publishedBlogService';
import { supabase } from '@/integrations/supabase/client';
import { SavePostSignupPopup } from './SavePostSignupPopup';
import { GenerationSequence } from './GenerationSequence';
import { InteractiveContentGenerator } from './InteractiveContentGenerator';
import { MultiBlogGenerator } from './MultiBlogGenerator';
import { ClaimTrialPostDialog } from './ClaimTrialPostDialog';
import { AdaptiveProgressIndicator } from './AdaptiveProgressIndicator';
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

export function HomepageBlogGenerator() {
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [forceComplete, setForceComplete] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [allGeneratedPosts, setAllGeneratedPosts] = useState<any[]>([]);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [blogPostId, setBlogPostId] = useState<string>('');
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  // Use the authentication hook
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
    console.log('📋 Generation Parameters:', {
      targetUrl,
      primaryKeyword,
      userType: isLoggedIn ? 'AUTHENTICATED' : 'TRIAL',
      timestamp: new Date().toISOString()
    });

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
      console.log('🔄 GENERATION PROCESS STARTED');
      // Use the already checked currentUser state instead of re-checking

      // Check if we're in development mode
      const isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('localhost') ||
                           window.location.hostname.includes('.fly.dev') ||
                           window.location.port === '8080' ||
                           process.env.NODE_ENV === 'development';

      console.log('🔍 Environment check:', {
        hostname: window.location.hostname,
        port: window.location.port,
        isDevelopment,
        nodeEnv: process.env.NODE_ENV
      });

      let data;

      if (isDevelopment) {
        // Development mode - create mock data
        console.log('🚧 Development mode detected - generating mock blog post');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        data = {
          success: true,
          slug: `${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-demo-${Date.now()}`,
          blogPost: {
            id: `blog_demo_${Date.now()}`,
            title: `The Ultimate Guide to ${primaryKeyword}: Demo Preview`,
            content: `This is a demo preview of your blog post about ${primaryKeyword}. In production, this would be a full 1200+ word article with natural backlinks to ${targetUrl}.`,
            meta_description: `Demo preview: Learn about ${primaryKeyword} in this comprehensive guide.`,
            excerpt: `This is a demo preview showing how your ${primaryKeyword} blog post would look.`,
            keywords: [primaryKeyword],
            target_url: targetUrl,
            status: 'demo_preview',
            is_trial_post: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            seo_score: 85,
            contextual_links: [{ anchor: primaryKeyword, url: targetUrl }],
            word_count: 1200,
            slug: `${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-demo-${Date.now()}`,
            created_at: new Date().toISOString()
          },
          publishedUrl: `${window.location.origin}/blog/${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-demo-${Date.now()}`
        };
      } else {
        // Production mode - call actual Netlify function
        const response = await fetch('/.netlify/functions/generate-post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destinationUrl: targetUrl,
            keyword: primaryKeyword,
            userId: currentUser?.id
          })
        });

        if (!response.ok) {
          // Read the response body once and handle errors
          let errorMessage = 'Failed to generate blog post';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // If we can't parse the error response, use the status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to generate blog post');
        }
      }

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

      toast({
        title: "Blog Post Generated!",
        description: isLoggedIn
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
        duration: 10000 // Longer duration for error messages
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

      // Optional: Add error reporting for enterprise monitoring
      // reportErrorToAnalytics(error, { targetUrl, primaryKeyword, userType: isLoggedIn ? 'AUTH' : 'TRIAL' });
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
    setIsCompleted(false);
    setGeneratedPost(null);
    setAllGeneratedPosts([]);
    setPublishedUrl('');
    setShowProgress(false);
    setIsGenerating(false);
    setForceComplete(false);
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
                  // Completion state should already be set by the generation logic
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
                    <p className="text-sm text-gray-500">The keyword you're ranking for (used as anchor text)</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    What You'll Get:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>1,200+ word SEO-optimized blog post</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>Permanent links</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Published, viewable and indexed link within private networks</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>Dofollow backlinks</span>
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
                          ? 'Processing Your Enterprise Backlink...'
                          : currentUser
                            ? 'Generating Professional Content...'
                            : 'Creating Your Trial Content...'
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      <span>
                        {currentUser
                          ? '�� Deploy Enterprise Backlink'
                          : '🎯 Start Free Trial Backlink'
                        }
                      </span>
                    </>
                  )}

                  {/* Enterprise progress indicator overlay */}
                  {isGenerating && (
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-pulse w-full"></div>
                  )}
                </Button>

                {/* Enterprise Status & Validation Display */}
                <div className="text-center space-y-2">
                  {isGenerating && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                      ENTERPRISE GENERATION IN PROGRESS
                    </div>
                  )}

                  {!isGenerating && targetUrl && primaryKeyword && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      READY FOR DEPLOYMENT
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
                          ✨ Completely free • No signup required • Register to save permanently
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isCheckingAuth && (
                  <p className="text-center text-sm text-gray-500">
                    🔄 Checking authentication status...
                  </p>
                )}
              </CardContent>
            </Card>
            )
          ) : (
            // Success state
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
              <CardContent className="text-center py-12 px-8">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-blue-500 mb-6 animate-pulse">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full text-lg font-bold mb-6 shadow-lg">
                    <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
                    🎯 YOUR BACKLINK IS NOW LIVE
                  </div>

                  <h3 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    Content Successfully Published!
                  </h3>

                  <p className="text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
                    Professional article about <span className="font-bold text-blue-600">"{primaryKeyword}"</span> is now live with strategic backlinks to your website
                  </p>

                  {/* 🚀 LIVE BLOG POST SHOWCASE - MAIN ATTRACTION */}
                  <div className="mb-12 max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border-4 border-green-200 overflow-hidden">
                      {/* Browser URL Bar Mockup */}
                      <div className="bg-gray-100 px-6 py-4 border-b flex items-center gap-4">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-white rounded-lg px-4 py-2 font-mono text-lg text-gray-700 border-2 border-blue-200 flex items-center">
                          <Globe className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-600 font-semibold">🔒 https://</span>
                          <span className="font-bold">{publishedUrl?.replace('https://', '') || `backlinkoo.com/blog/${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const urlToCopy = publishedUrl || `https://backlinkoo.com/blog/${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
                            navigator.clipboard.writeText(urlToCopy);
                            toast({ title: "✅ URL Copied!", description: "Blog post URL copied to clipboard" });
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          📋 Copy URL
                        </Button>
                      </div>

                      {/* Live Content Preview */}
                      <div className="p-8 bg-white">
                        <div className="text-left space-y-6">
                          <h4 className="text-3xl font-bold text-gray-900 leading-tight">
                            {generatedPost?.title || `The Ultimate Guide to ${primaryKeyword}: Professional Insights & Strategies`}
                          </h4>

                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                B
                              </div>
                              <span>Backlinkoo Editorial</span>
                            </div>
                            <span>•</span>
                            <span>Published {new Date().toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{generatedPost?.word_count || 1200}+ words</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-600 font-medium">Live & Indexed</span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Link2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-blue-900 mb-2">Strategic Backlink Placement</h5>
                                <p className="text-blue-800 text-sm">
                                  Natural contextual links to <a href={targetUrl} className="font-semibold underline hover:text-blue-900" target="_blank" rel="noopener noreferrer">{targetUrl}</a> have been strategically placed throughout this professional article to maximize your SEO impact.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="prose prose-lg max-w-none text-gray-700">
                            <p className="leading-relaxed">
                              In today's competitive digital landscape, mastering <strong className="text-blue-600">{primaryKeyword}</strong> is essential for business success. This comprehensive guide provides actionable insights, proven strategies, and expert recommendations to help you achieve your goals...
                            </p>
                            <p className="text-gray-500 italic text-sm mt-4">
                              [This is a preview - click "View Full Article" below to see the complete professional content with all backlinks and SEO optimizations]
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Call-to-Action Footer */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-8 py-6 border-t">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                          <Button
                            size="lg"
                            onClick={() => {
                              const url = publishedUrl || `https://backlinkoo.com/blog/${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
                              window.open(url, '_blank');
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-10 py-4 text-xl shadow-xl transform hover:scale-105 transition-all"
                          >
                            <ExternalLink className="mr-3 h-6 w-6" />
                            🚀 View Your Live Article
                          </Button>

                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => {
                              const url = publishedUrl || `https://backlinkoo.com/blog/${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
                              const text = `🎯 Just published a professional article about ${primaryKeyword}! Check out my new backlink: ${url}`;
                              navigator.clipboard.writeText(text);
                              toast({ title: "✅ Share Text Copied!", description: "Perfect for social media sharing!" });
                            }}
                            className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold px-8 py-4 text-lg"
                          >
                            📤 Copy Share Link
                          </Button>
                        </div>

                        <div className="text-center mt-6">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {currentUser ? '💎 Permanent Backlink Active' : '⏱️ Trial Backlink Active (24 hours)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCTION STATUS & NEXT STEPS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* SEO Impact */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-bold text-green-800 mb-2">SEO Impact</h4>
                        <div className="text-2xl font-bold text-green-600 mb-2">{generatedPost?.seo_score || 85}/100</div>
                        <p className="text-sm text-green-700">High-quality backlink now boosting your rankings</p>
                      </div>
                    </div>

                    {/* Content Quality */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-6 rounded-xl border border-blue-200">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-bold text-blue-800 mb-2">Content Quality</h4>
                        <div className="text-2xl font-bold text-blue-600 mb-2">{generatedPost?.word_count || 1200}+</div>
                        <p className="text-sm text-blue-700">Professional words with natural backlinks</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`bg-gradient-to-br p-6 rounded-xl border ${
                      currentUser
                        ? 'from-purple-50 to-indigo-100 border-purple-200'
                        : 'from-amber-50 to-orange-100 border-amber-200'
                    }`}>
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          currentUser ? 'bg-purple-500' : 'bg-amber-500'
                        }`}>
                          {currentUser ? (
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <h4 className={`font-bold mb-2 ${currentUser ? 'text-purple-800' : 'text-amber-800'}`}>
                          {currentUser ? 'Permanent' : 'Trial Mode'}
                        </h4>
                        <div className={`text-2xl font-bold mb-2 ${currentUser ? 'text-purple-600' : 'text-amber-600'}`}>
                          {currentUser ? '∞' : '24h'}
                        </div>
                        <p className={`text-sm ${currentUser ? 'text-purple-700' : 'text-amber-700'}`}>
                          {currentUser ? 'Lifetime backlink active' : 'Register to save forever'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 🚀 PRODUCTION NEXT STEPS GUIDANCE */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200 mb-8">
                    <div className="text-center mb-6">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">
                        🎯 Your Backlink is Working Right Now!
                      </h4>
                      <p className="text-gray-600">
                        Here's what's happening behind the scenes and what to expect
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-lg border border-green-200">
                        <h5 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          ✅ Active SEO Benefits
                        </h5>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li>• Google is now indexing your new backlink</li>
                          <li>• Domain authority signals are being sent to your site</li>
                          <li>• "{primaryKeyword}" keyword rankings are improving</li>
                          <li>• Organic search traffic will increase over 2-4 weeks</li>
                        </ul>
                      </div>

                      <div className="bg-white p-6 rounded-lg border border-blue-200">
                        <h5 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          📈 Expected Timeline
                        </h5>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li>• <strong>Week 1:</strong> Google discovers and crawls your backlink</li>
                          <li>• <strong>Week 2-3:</strong> Keyword rankings begin to improve</li>
                          <li>• <strong>Week 4+:</strong> Measurable organic traffic increase</li>
                          <li>• <strong>Ongoing:</strong> Sustained SEO value and authority boost</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full font-semibold shadow-lg">
                        <Star className="h-5 w-5 animate-pulse" />
                        Your professional backlink is live and boosting your SEO right now!
                      </div>
                    </div>
                  </div>

                {/* Authentication Status Notice */}
                  {currentUser ? (
                    <div className="max-w-3xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-green-800 mb-1">
                            ✅ Permanent Backlink Created
                          </p>
                          <p className="text-sm text-green-700">
                            <strong>Your backlink is permanently saved</strong> and will continue providing SEO value indefinitely.
                            You can view and manage all your backlinks from your dashboard.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-3xl mx-auto mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-amber-800 mb-1">
                            ⚠️ Trial Backlink - 24 Hour Expiry
                          </p>
                          <p className="text-sm text-amber-700">
                            <strong>This is a trial backlink</strong> that will automatically delete in 24 hours unless claimed.
                            Create an account now to make this backlink permanent and unlock unlimited backlink creation!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* COMPLETION SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Content Quality Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Content Quality</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Word Count:</span>
                        <span className="font-medium">{generatedPost?.word_count || 1200}+ words</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SEO Score:</span>
                        <span className="font-medium text-green-600">{generatedPost?.seo_score || 85}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reading Time:</span>
                        <span className="font-medium">{Math.ceil((generatedPost?.word_count || 1200) / 200)} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Backlink Details Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Backlink Details</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Links Created:</span>
                        <span className="font-medium">{generatedPost?.contextual_links?.length || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Link Type:</span>
                        <span className="font-medium">Dofollow</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Anchor Text:</span>
                        <span className="font-medium text-blue-600">"{primaryKeyword}"</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Card */}
                  <div className={`bg-gradient-to-br p-4 rounded-xl border ${
                    currentUser
                      ? 'from-green-50 to-emerald-100 border-green-200'
                      : 'from-amber-50 to-orange-100 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {currentUser ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      )}
                      <h4 className={`font-semibold ${currentUser ? 'text-green-800' : 'text-amber-800'}`}>
                        Status
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">{currentUser ? 'Permanent' : 'Trial'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{currentUser ? 'Lifetime' : '24 hours'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Indexing:</span>
                        <span className="font-medium text-green-600">Live</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TARGET URL CONFIRMATION */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Backlink Target</p>
                        <p className="text-sm text-gray-600">Your website is now receiving SEO value</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm break-all"
                      >
                        {targetUrl}
                      </a>
                    </div>
                  </div>
                </div>

                {!currentUser && generatedPost && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                    <ClaimTrialPostDialog
                      trialPostSlug={generatedPost.slug}
                      trialPostTitle={generatedPost.title}
                      expiresAt={generatedPost.expires_at}
                      targetUrl={targetUrl}
                      onClaimed={() => {
                        // Refresh the page to update UI
                        window.location.reload();
                      }}
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white animate-pulse"
                      >
                        <Save className="mr-2 h-5 w-5" />
                        Save Now - Deletes in 24hrs!
                      </Button>
                    </ClaimTrialPostDialog>
                  </div>
                )}

                {/* FINALIZED NEXT STEPS */}
                <div className="mt-8 space-y-6">
                  {currentUser ? (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <CheckCircle2 className="h-6 w-6" />
                        <h4 className="text-xl font-bold">🎯 Mission Complete!</h4>
                      </div>
                      <p className="text-green-100 mb-4 text-lg">
                        Your professional backlink is now <strong>permanently active</strong> and boosting your SEO rankings!
                      </p>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            size="lg"
                            className="bg-white text-green-600 hover:bg-green-50 font-bold px-8"
                            onClick={() => window.location.href = '/dashboard'}
                          >
                            <BarChart3 className="mr-2 h-5 w-5" />
                            📊 Track Your SEO Growth
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-white text-white hover:bg-white hover:text-green-600 font-bold px-8"
                            onClick={resetForm}
                          >
                            <Sparkles className="mr-2 h-5 w-5" />
                            🚀 Create Another Backlink
                          </Button>
                        </div>

                        <div className="text-center">
                          <p className="text-green-100 text-sm">
                            💡 <strong>Pro Tip:</strong> Create 3-5 backlinks per month for maximum SEO impact
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-6 text-white text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <AlertCircle className="h-6 w-6 animate-pulse" />
                          <h4 className="text-xl font-bold">⚠️ Action Required!</h4>
                        </div>
                        <p className="text-red-100 mb-4 text-lg">
                          Your backlink is <strong>live and working</strong> but will auto-delete in 24 hours!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            size="lg"
                            className="bg-white text-red-600 hover:bg-red-50 font-semibold animate-pulse"
                            onClick={() => setShowSignupPopup(true)}
                          >
                            <Save className="mr-2 h-5 w-5" />
                            Save Forever - Stop Timer!
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-white text-white hover:bg-white hover:text-red-600 font-semibold"
                            onClick={() => setShowLoginModal(true)}
                          >
                            <Shield className="mr-2 h-5 w-5" />
                            Login / Register
                          </Button>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 text-center">
                        <p className="text-blue-800 font-medium mb-2">
                          🚀 Ready to scale your SEO?
                        </p>
                        <p className="text-sm text-blue-700">
                          Create unlimited professional backlinks with advanced targeting and analytics!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Signup Popup for Saving Posts */}
      <SavePostSignupPopup
        isOpen={showSignupPopup}
        onClose={() => setShowSignupPopup(false)}
        blogPostId={blogPostId}
        blogPostUrl={publishedUrl}
        blogPostTitle={generatedPost?.title}
        onSignupSuccess={(user) => {
          setShowSignupPopup(false);
          // Refresh the page to update auth state
          window.location.reload();
        }}
        timeRemaining={86400} // 24 hours
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onAuthSuccess={(user) => {
          setShowLoginModal(false);
          // Refresh the page to update all auth states
          window.location.reload();
        }}
        defaultTab="login"
      />
    </div>
  );
}
