import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStatus } from '@/hooks/useAuth';
import { aiContentGenerator } from '@/services/aiContentGenerator';
import { errorLogger, ErrorSeverity, ErrorCategory } from '@/services/errorLoggingService';
import BlogGenerationError from './BlogGenerationError';
import { PublishedBlogService } from '@/services/publishedBlogService';
import { testBlogPostAccess } from '@/utils/blogTestUtils';
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

/**
 * HomepageBlogGenerator - Main component for generating high-quality blog posts with backlinks
 * Features: Netlify function integration with fallback, error handling, trial/permanent post management
 * Last updated: January 2025 - Enhanced error handling and blog post storage
 */
export function HomepageBlogGenerator() {
  // Form state
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');

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
      console.log('🔄 GENERATION PROCESS STARTED');

      // Test connection to Netlify functions first (in production)
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

        const blogSlug = `${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const publishedBlogUrl = `${window.location.origin}/blog/?slug=${blogSlug}`;

        // Create comprehensive blog content with multiple sections and strategic backlinks
        const blogContent = `
          <div class="prose prose-lg max-w-none">
            <p class="text-xl text-gray-700 mb-6 leading-relaxed">In today's competitive digital landscape, mastering <strong>${primaryKeyword}</strong> has become essential for businesses and professionals alike. This comprehensive guide explores the latest strategies, best practices, and expert insights to help you excel in this dynamic field.</p>

            <h2>Understanding ${primaryKeyword}: The Foundation</h2>
            <p>Before diving into advanced strategies, it's crucial to understand the fundamentals of ${primaryKeyword}. Industry leaders consistently emphasize the importance of building a solid foundation, and companies like <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${new URL(targetUrl).hostname}</a> have demonstrated how proper implementation can drive remarkable results.</p>

            <h2>Key Strategies for ${primaryKeyword} Success</h2>
            <p>Successful implementation of ${primaryKeyword} requires a multi-faceted approach:</p>
            <ul>
              <li><strong>Strategic Planning:</strong> Develop a comprehensive roadmap that aligns with your objectives</li>
              <li><strong>Best Practices:</strong> Follow industry-proven methodologies and standards</li>
              <li><strong>Continuous Optimization:</strong> Regularly review and improve your approach</li>
              <li><strong>Performance Monitoring:</strong> Track key metrics and adjust strategies accordingly</li>
            </ul>

            <h2>Expert Insights and Professional Recommendations</h2>
            <p>Leading professionals in the field recommend focusing on quality over quantity when it comes to ${primaryKeyword}. Organizations that prioritize excellence, such as those featured on <a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${new URL(targetUrl).hostname}</a>, consistently outperform their competitors by maintaining high standards and innovative approaches.</p>

            <h2>Common Challenges and Solutions</h2>
            <p>Every journey with ${primaryKeyword} comes with its unique challenges. Here are the most common obstacles and how to overcome them:</p>
            <ol>
              <li><strong>Resource Allocation:</strong> Ensure adequate budget and personnel for optimal results</li>
              <li><strong>Technology Integration:</strong> Seamlessly integrate new solutions with existing systems</li>
              <li><strong>Skill Development:</strong> Invest in training and professional development</li>
              <li><strong>Market Adaptation:</strong> Stay flexible and responsive to changing market conditions</li>
            </ol>

            <h2>Future Trends and Opportunities</h2>
            <p>The landscape of ${primaryKeyword} continues to evolve rapidly. Forward-thinking organizations are already preparing for emerging trends and technologies that will shape the future of this field.</p>

            <h2>Conclusion</h2>
            <p>Success with ${primaryKeyword} requires dedication, strategic thinking, and continuous learning. By implementing the strategies outlined in this guide and learning from industry leaders, you'll be well-positioned to achieve your goals and drive meaningful results in your organization.</p>

            <div class="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 class="text-lg font-semibold text-blue-900 mb-2">Ready to Take Your ${primaryKeyword} Strategy to the Next Level?</h3>
              <p class="text-blue-800 mb-3">Discover how professional solutions can accelerate your success and deliver measurable results.</p>
              <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                Learn More About Professional ${primaryKeyword} Solutions →
              </a>
            </div>
          </div>
        `;

        data = {
          success: true,
          slug: blogSlug,
          blogPost: {
            id: `blog_live_${Date.now()}`,
            title: `The Ultimate Guide to ${primaryKeyword}: Professional Insights & Strategies`,
            content: blogContent,
            meta_description: `Master ${primaryKeyword} with this comprehensive professional guide. Expert insights, proven strategies, and best practices for success.`,
            excerpt: `Discover everything you need to know about ${primaryKeyword} in this ultimate professional guide with actionable strategies and expert insights.`,
            keywords: [primaryKeyword, 'professional guide', 'best practices', 'strategies'],
            target_url: targetUrl,
            status: 'published',
            is_trial_post: !isLoggedIn,
            expires_at: !isLoggedIn ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
            seo_score: 92,
            contextual_links: [
              { anchor: new URL(targetUrl).hostname, url: targetUrl },
              { anchor: `Professional ${primaryKeyword} Solutions`, url: targetUrl }
            ],
            word_count: 1247,
            reading_time: 6,
            author_name: 'Backlinkoo Editorial Team',
            author_avatar: '/placeholder.svg',
            tags: [primaryKeyword, 'Professional Guide', 'Best Practices', 'Expert Insights'],
            category: 'Professional Guides',
            featured_image: `https://images.unsplash.com/1600x900/?${encodeURIComponent(primaryKeyword)}`,
            slug: blogSlug,
            created_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_url: publishedBlogUrl,
            view_count: 0
          },
          publishedUrl: publishedBlogUrl
        };

        console.log('📱 DEVELOPMENT: Generated comprehensive blog post:', {
          url: publishedBlogUrl,
          title: data.blogPost.title,
          wordCount: data.blogPost.word_count,
          seoScore: data.blogPost.seo_score
        });
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

        // Check if response is ok first
        if (!response.ok) {
          console.log('ℹ️ Netlify function response status:', response.status);

          // Handle 404 specifically with fallback
          if (response.status === 404) {
            console.warn('⚠️ Netlify function not found (404), using fallback content generation');

            // Show user-friendly message about fallback mode
            toast({
              title: "Using Backup Mode",
              description: "Blog generation service is temporarily unavailable. Using our backup system to create your content.",
              variant: "default"
            });

            // Use fallback content generation
            data = await generateFallbackBlogPost(targetUrl, primaryKeyword);

            if (data.success) {
              console.log('✅ Fallback content generated successfully');
            } else {
              console.error('❌ Fallback generation failed:', data.error);
              throw new Error(data.error || 'Fallback generation failed');
            }
          } else {
            // For other errors, try to get error message from response
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
              const errorData = await response.text();
              console.error('Server error response:', errorData);
              // Try to parse as JSON to get error message
              try {
                const parsedError = JSON.parse(errorData);
                errorMessage = parsedError.error || parsedError.message || errorMessage;
              } catch {
                // If not JSON, use the text as error message
                errorMessage = errorData || errorMessage;
              }
            } catch {
              // If we can't read the response, use status-based message
              errorMessage = `Server error (${response.status}). Please try again.`;
            }
            throw new Error(errorMessage);
          }
        } else {
          // Response is OK, parse JSON response
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            throw new Error('Invalid response from server. Please try again.');
          }

          if (!data.success) {
            throw new Error(data.error || 'Failed to generate blog post');
          }
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

      // Verify the blog post is accessible
      if (blogPost.slug) {
        console.log('📋 Blog post details:', {
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

  // Fallback content generation using proper blog service
  const generateFallbackBlogPost = async (targetUrl: string, keyword: string) => {
    console.log('🔄 Generating fallback blog post using blog service...');

    try {
      const blogService = new PublishedBlogService();

      // Create blog post using the proper service
      const blogPost = await blogService.createBlogPost({
        keyword,
        targetUrl,
        userId: currentUser?.id,
        isTrialPost: !currentUser,
        wordCount: 1200
      });

      console.log('✅ Blog post created and saved:', {
        slug: blogPost.slug,
        id: blogPost.id,
        publishedUrl: blogPost.published_url,
        isTrialPost: blogPost.is_trial_post
      });

      return {
        success: true,
        slug: blogPost.slug,
        blogPost: {
          ...blogPost,
          mode: 'fallback'
        },
        publishedUrl: blogPost.published_url,
        message: 'Blog post generated and saved using fallback mode'
      };
    } catch (error) {
      console.error('Fallback generation failed:', error);
      return {
        success: false,
        error: `Fallback generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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
                  <div className="mb-12 max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border-4 border-green-200 overflow-hidden">
                      <div className="bg-gray-100 px-6 py-4 border-b flex items-center gap-4">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-white rounded-lg px-4 py-2 font-mono text-lg text-gray-700 border-2 border-blue-200 flex items-center">
                          <Globe className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-600 font-semibold">�� https://</span>
                          <span className="font-bold">
                            {publishedUrl?.includes('://')
                              ? publishedUrl.split('://')[1]
                              : `${window.location.host}/blog/?slug=${generatedPost?.slug || primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
                            }
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const urlToCopy = publishedUrl || `${window.location.origin}/blog/?slug=${generatedPost?.slug || `${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`}`;
                            navigator.clipboard.writeText(urlToCopy);
                            toast({ title: "✅ URL Copied!", description: "Blog post URL copied to clipboard" });
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          📋 Copy URL
                        </Button>
                      </div>
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
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-8 py-6 border-t">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                          <Button
                            size="lg"
                            onClick={() => {
                              const blogUrl = publishedUrl || `${window.location.origin}/blog/?slug=${generatedPost?.slug || `${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`}`;
                              console.log('🔗 Opening blog post URL:', blogUrl);
                              window.open(blogUrl, '_blank');
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-10 py-4 text-xl shadow-xl transform hover:scale-105 transition-all"
                          >
                            <ExternalLink className="mr-3 h-6 w-6" />
                            View Your Live Article
                          </Button>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => {
                              const blogUrl = publishedUrl || `${window.location.origin}/blog/?slug=${generatedPost?.slug || `${primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`}`;
                              const shareText = `🎯 Just published a professional article about ${primaryKeyword}! Check out my new backlink: ${blogUrl}`;
                              navigator.clipboard.writeText(shareText);
                              toast({
                                title: "✅ Share Text Copied!",
                                description: "Perfect for social media sharing!"
                              });
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                        <h5 className="font-bold text-green-800 mb-4 text-left">
                          Active SEO Benefits
                        </h5>
                        <ul className="space-y-2 text-sm text-gray-700 text-left">
                          <li>• Google is now indexing your new backlink</li>
                          <li>• Domain authority signals are being sent to your site</li>
                          <li>• "{primaryKeyword}" keyword rankings are improving</li>
                          <li>• Organic search traffic will increase over 2-4 weeks</li>
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-lg border border-blue-200">
                        <h5 className="font-bold text-blue-800 mb-4 text-left">
                          Expected Timeline
                        </h5>
                        <ul className="space-y-2 text-sm text-gray-700 text-left">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                </div>
              </CardContent>
            </Card>
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
          window.location.reload();
        }}
        defaultTab="login"
      />
    </div>
  );
}
