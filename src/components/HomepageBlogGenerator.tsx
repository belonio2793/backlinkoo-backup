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
  AlertCircle
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

  // Log auth status changes
  useEffect(() => {
    if (authChecked) {
      console.log('📝 Auth status:', isLoggedIn ? 'Logged in' : 'Guest user');
    }
  }, [authChecked, isLoggedIn]);

  const handleGenerate = async () => {
    console.log('🚀 handleGenerate called with:', { targetUrl, primaryKeyword });
    console.log('👤 Current user status:', isLoggedIn ? 'Authenticated' : 'Guest');

    if (!targetUrl || !primaryKeyword) {
      toast({
        title: "Missing Information",
        description: "Please provide both target URL and primary keyword",
        variant: "destructive"
      });
      return;
    }

    if (!isValidUrl(targetUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }

    // Show different messages based on auth status
    if (isLoggedIn) {
      console.log('✅ Starting generation for authenticated user');
      toast({
        title: "Generating Your Backlink",
        description: "Creating your permanent blog post with backlinks...",
      });
    } else {
      console.log('✅ Starting generation for guest user (trial mode)');
      toast({
        title: "Generating Your Free Trial",
        description: "Creating your demo blog post - register to save it permanently!",
      });
    }

    setIsGenerating(true);
    setIsCompleted(false);
    setShowProgress(true);

    try {
      // Use the already checked currentUser state instead of re-checking

      // Check if we're in development mode
      const isDevelopment = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('localhost');

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

      setGeneratedPost(blogPost);
      setPublishedUrl(publishedUrl);
      setBlogPostId(blogPost.id);

      // Force the progress indicator to complete
      setForceComplete(true);

      // Show results after progress completes
      setTimeout(() => {
        setIsCompleted(true);
      }, 2000);

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
      console.error('Blog generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate blog post. Please try again.",
        variant: "destructive"
      });
      setIsGenerating(false);
      setShowProgress(false);
      setForceComplete(false);
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
                      onClick={() => window.location.href = '/login'}
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
                  console.log('🎉 Progress complete, showing results...');
                  setShowProgress(false);
                  setIsGenerating(false);
                  setForceComplete(false);
                  // Only transition to completion if we have generated content
                  if (generatedPost) {
                    setIsCompleted(true);
                  }
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
                  className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {currentUser ? 'Generating Your Backlink...' : 'Generating Your Trial Backlink...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      {currentUser ? 'Create Permanent Backlink' : 'Create Free Trial Backlink'}
                    </>
                  )}
                </Button>

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
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-500 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-900">
                    🎉 Your Blog Post is Live!
                  </h3>
                  <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                    We've created a professional article about "{primaryKeyword}" with natural backlinks pointing to your website.
                    {currentUser
                      ? "Your content is permanently saved and ready to boost your SEO!"
                      : "Your trial content is live and ready to boost your SEO!"
                    }
                  </p>

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

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border border-green-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">📝 Generated Content Details</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Title: {generatedPost?.title}</li>
                        <li>• Word Count: {generatedPost?.wordCount || 1200}+ words</li>
                        <li>• Status: {currentUser ? 'Permanently Saved' : 'Trial (24h Expiry)'}</li>
                        <li>• SEO Score: {generatedPost?.seoScore || 85}/100</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">🔗 Backlink Preview Details</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Target: {targetUrl}</li>
                        <li>• Contextual Links: {generatedPost?.contextualLinks?.length || 1}</li>
                        <li>• Type: Natural, Contextual</li>
                        <li className={`font-medium ${currentUser ? 'text-green-600' : 'text-amber-600'}`}>
                          • Status: {currentUser ? 'Live & Permanent' : 'Trial (Expires in 24h)'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Blog Post Preview */}
                {generatedPost && (
                  <div className="space-y-4 mb-6">
                    <div className="p-4 border rounded-lg bg-white">
                      <div className="text-lg font-medium mb-2">{generatedPost.title}</div>
                      <div className="text-sm text-gray-600 mb-3">
                        Published at: <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{publishedUrl}</a>
                      </div>

                      {/* Unclaimed Blog Notification */}
                      {!currentUser && (
                        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-amber-600">⚠️</span>
                            <span className="font-medium text-amber-800">Trial Blog Post</span>
                          </div>
                          <p className="text-amber-700 text-sm leading-tight">
                            This blog post is in trial mode. Create an account to claim and save it permanently,
                            or it will be automatically deleted in 24 hours.
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={() => window.open(publishedUrl, '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Live Blog Post
                      </Button>
                    </div>
                  </div>
                )}

                {!currentUser && generatedPost && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                    <ClaimTrialPostDialog
                      trialPostSlug={generatedPost.slug}
                      trialPostTitle={generatedPost.title}
                      expiresAt={generatedPost.expires_at}
                      targetUrl={targetUrl}
                      onClaimed={() => {
                        setCurrentUser(true); // Mark as claimed
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

                <div className="mt-8 space-y-4">
                  {currentUser ? (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium mb-2">
                        ✅ <strong>Success! Your backlink is permanently saved</strong>
                      </p>
                      <p className="text-sm text-green-700 mb-3">
                        Your backlink is live and will continue providing SEO value indefinitely.
                        View all your backlinks and create more from your dashboard.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => window.location.href = '/dashboard'}
                        >
                          View Dashboard
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600 text-green-700 hover:bg-green-100"
                          onClick={resetForm}
                        >
                          Create Another
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-800 font-medium mb-2">
                          ⏰ <strong>WARNING: This backlink will auto-delete in 24 hours!</strong>
                        </p>
                        <p className="text-sm text-red-700 mb-3">
                          Your backlink is live and building SEO value right now, but it's on a 24-hour trial timer.
                          Create an account now to keep it forever and stop the deletion countdown!
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                            onClick={() => setShowSignupPopup(true)}
                          >
                            Stop Deletion Timer Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-700 hover:bg-red-100"
                            onClick={() => window.location.href = '/login'}
                          >
                            Login / Register
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          🚀 Ready for more? Create unlimited backlinks with our premium packages and advanced targeting!
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
          setCurrentUser(user);
          setShowSignupPopup(false);
        }}
        timeRemaining={86400} // 24 hours
      />
    </div>
  );
}
