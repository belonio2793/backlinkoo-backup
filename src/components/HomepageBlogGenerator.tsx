import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
import { SmartProgressIndicator } from './SmartProgressIndicator';
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
  Save
} from 'lucide-react';
import { RotatingText } from './RotatingText';

export function HomepageBlogGenerator() {
  const [targetUrl, setTargetUrl] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [allGeneratedPosts, setAllGeneratedPosts] = useState<any[]>([]);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [blogPostId, setBlogPostId] = useState<string>('');
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    console.log('🚀 handleGenerate called with:', { targetUrl, primaryKeyword });

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

    console.log('✅ Starting generation with valid inputs');
    setIsGenerating(true);
    setIsCompleted(false);
    setShowProgress(true);

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Call Netlify function to generate blog post
      const response = await fetch('/.netlify/functions/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationUrl: targetUrl,
          keyword: primaryKeyword,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate blog post');
      }

      const { slug, blogPost, publishedUrl } = data;

      // Create campaign entry for registered users
      if (user) {
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
              user_id: user.id,
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

      // Let the progress indicator complete naturally, then show results
      setTimeout(() => {
        setIsCompleted(true);
        setIsGenerating(false);
        setShowProgress(false);
      }, 2000); // Give progress indicator time to complete

      toast({
        title: "Blog Post Generated!",
        description: user
          ? "Your content is ready and saved to your dashboard!"
          : "Your demo preview is ready. Register to keep it forever!",
      });

      // Store trial post info for notification system
      if (!user && blogPost.is_trial_post) {
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
      if (!user) {
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
          {!isCompleted ? (
            showProgress ? (
              <SmartProgressIndicator
                isActive={isGenerating}
                targetUrl={targetUrl}
                keyword={primaryKeyword}
                onProgressUpdate={(step, progress) => {
                  console.log(`Progress: ${step} - ${Math.round(progress)}%`);
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
                  disabled={isGenerating || !targetUrl || !primaryKeyword}
                  size="lg"
                  className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Generating Your Trial Backlink...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Claim Now
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  ✨ Completely free • No signup required • Instant results
                </p>
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
                    We've created a professional article about "{primaryKeyword}" with natural backlinks pointing to your website. Your content is now live and ready to boost your SEO!
                  </p>

                  {/* Trial Backlink Notice - Only shown after completion */}
                  <div className="max-w-3xl mx-auto mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-amber-800 mb-1">
                          ⚠️ Demo Preview Notice
                        </p>
                        <p className="text-sm text-amber-700">
                          <strong>This is a demo preview</strong> of your generated blog post content.
                          To publish this as a live backlink on high-authority domains, simply{' '}
                          <span className="font-semibold">create an account and purchase any number of credits</span>.
                          Your content will then be published as a permanent campaign with real SEO value.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border border-green-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">📝 Generated Content Details</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Title: {generatedPost?.title}</li>
                        <li>• Word Count: {generatedPost?.wordCount || 1200}+ words</li>
                        <li>• Status: Demo Preview Ready</li>
                        <li>• SEO Score: {generatedPost?.seoScore || 85}/100</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900">🔗 Backlink Preview Details</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Target: {targetUrl}</li>
                        <li>• Contextual Links: {generatedPost?.contextualLinks?.length || 1}</li>
                        <li>• Type: Natural, Contextual</li>
                        <li className="font-medium text-blue-600">
                          • Status: Demo Preview (Ready for Publishing)
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

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {!currentUser && generatedPost && (
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
                  )}
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    size="lg"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Create More Backlinks
                  </Button>
                </div>

                {!currentUser && (
                  <div className="mt-8 space-y-4">
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-800 font-medium mb-2">
                        ⏰ <strong>WARNING: This backlink will auto-delete in 24 hours!</strong>
                      </p>
                      <p className="text-sm text-red-700 mb-3">
                        Your backlink is live and building SEO value right now, but it's on a 24-hour trial timer.
                        Create an account now to keep it forever and stop the deletion countdown!
                      </p>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        onClick={() => setShowSignupPopup(true)}
                      >
                        Stop Deletion Timer Now
                      </Button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">
                        🚀 Ready for more? Create unlimited backlinks with our premium packages and advanced targeting!
                      </p>
                    </div>
                  </div>
                )}
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
